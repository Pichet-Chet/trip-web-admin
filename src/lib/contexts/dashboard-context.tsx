"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";

export interface UsageData {
  tier: string | null;
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt: string | null;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationData {
  unreadCount: number;
  items: NotificationItem[];
}

interface DashboardContextValue {
  ticketUnread: number;
  usage: UsageData | null;
  refreshUsage: () => void;
  notifications: NotificationData | null;
  refreshNotifications: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DashboardContext = createContext<DashboardContextValue>({
  ticketUnread: 0,
  usage: null,
  refreshUsage: () => {},
  notifications: null,
  refreshNotifications: () => {},
  markNotificationRead: () => {},
  markAllNotificationsRead: () => {},
});

export function useDashboard(): DashboardContextValue {
  return useContext(DashboardContext);
}

export function DashboardProvider({ children }: { children: React.ReactNode }): React.ReactNode {
  const [ticketUnread, setTicketUnread] = useState(0);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchTickets = useCallback(() => {
    if (document.hidden) return;
    api.get<{ unread: number }>("/admin/support/tickets/summary")
      .then((s) => setTicketUnread(s.unread))
      .catch(() => {});
  }, []);

  const refreshUsage = useCallback(() => {
    api.get<UsageData>("/admin/usage")
      .then(setUsage)
      .catch((err) => { if (!(err instanceof ApiError)) console.error(err); });
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await api.get<NotificationData>("/me/notifications?pageSize=10");
      setNotifications(res);
    } catch (err) {
      if (!(err instanceof ApiError)) console.error("[DashboardContext] notifications", err);
    }
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev && {
      ...prev,
      unreadCount: Math.max(0, prev.unreadCount - 1),
      items: prev.items.map((n) => n.id === id ? { ...n, isRead: true } : n),
    });
    api.put(`/me/notifications/${id}/read`, {}).catch(() => {});
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev && {
      ...prev,
      unreadCount: 0,
      items: prev.items.map((n) => ({ ...n, isRead: true })),
    });
    api.post("/me/notifications/read-all", {}).catch(() => {});
  }, []);

  useEffect(() => {
    // Initial fetch — all in parallel
    fetchTickets();
    refreshUsage();
    refreshNotifications();

    // Poll tickets + notifications every 60s
    const onVisible = () => {
      if (!document.hidden) {
        fetchTickets();
        refreshNotifications();
      }
    };

    pollRef.current = window.setInterval(() => {
      fetchTickets();
      refreshNotifications();
    }, 60_000);

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchTickets, refreshUsage, refreshNotifications]);

  return (
    <DashboardContext.Provider value={{
      ticketUnread,
      usage,
      refreshUsage,
      notifications,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
