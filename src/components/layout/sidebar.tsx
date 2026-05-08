"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ROUTES } from "@/constants/routes";
import { getUser, type UserInfo } from "@/lib/auth";
import { useDashboard } from "@/lib/contexts/dashboard-context";

const navItems = [
  { label: "หน้าหลัก", href: ROUTES.dashboard, icon: "dashboard" },
  { label: "ทริปของฉัน", href: "/dashboard/my-trips", icon: "luggage" },
  { label: "แพ็กเกจทัวร์", href: "/dashboard/posts", icon: "flight_takeoff" },
  { label: "คลังสื่อ", href: "/dashboard/media", icon: "photo_library" },
  { label: "โปรไฟล์", href: ROUTES.profile, icon: "person" },
  { label: "การใช้งาน", href: ROUTES.usage, icon: "speed" },
  { label: "การชำระเงิน", href: "/dashboard/billing", icon: "receipt_long" },
  { label: "ตั๋วสนับสนุน", href: "/dashboard/support/tickets", icon: "support_agent" },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }): React.ReactNode {
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const { ticketUnread } = useDashboard();

  // getUser() lives in module memory; poll briefly until the AuthGuard refresh
  // hydrates it, then stop. Same pattern the dashboard layout uses.
  useEffect(() => {
    const initial = getUser();
    if (initial) { setUser(initial); return; }
    const interval = setInterval(() => {
      const u = getUser();
      if (u) { setUser(u); clearInterval(interval); }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden cursor-pointer" onClick={onClose} />
      )}

      <aside
        className={`h-screen w-64 md:w-20 lg:w-64 fixed left-0 top-0 border-r border-(--outline-variant)/30 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full py-6">
          {/* Logo */}
          <div className="px-6 mb-10 flex items-center justify-between lg:block">
            <div>
              <h1 className="text-2xl font-bold text-(--primary) tracking-tight lg:block md:hidden block">ระบบจัดการ</h1>
              <h1 className="text-2xl font-bold text-(--primary) tracking-tight hidden md:block lg:hidden">T</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-(--on-surface-variant) mt-1 font-bold lg:block md:hidden block">Trip Admin</p>
            </div>
            {/* Mobile close button */}
            <button className="md:hidden text-(--on-surface-variant)" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== ROUTES.dashboard && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                    isActive
                      ? "text-(--primary) font-bold border-r-4 border-(--primary) bg-(--primary)/5"
                      : "text-(--on-surface-variant) hover:text-(--primary) hover:bg-(--surface-container-low)"
                  }`}
                >
                  <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium md:hidden lg:block">{item.label}</span>
                  {item.href === "/dashboard/support/tickets" && ticketUnread > 0 && (
                    <span className="ml-auto md:hidden lg:flex shrink-0 min-w-5 h-5 items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {ticketUnread > 99 ? "99+" : ticketUnread}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profile */}
          <div className="px-4 lg:px-6 mt-auto">
            <Link
              href={ROUTES.profile}
              className="flex items-center gap-3 p-3 rounded-xl bg-(--surface-container-lowest) shadow-sm border border-(--outline-variant)/20 overflow-hidden hover:border-(--primary)/30 hover:bg-white transition-colors"
            >
              <div className="w-10 h-10 min-w-10 rounded-full bg-(--primary-container) flex items-center justify-center text-sm font-bold text-(--on-primary-container) shrink-0">
                {user?.firstName?.charAt(0) || "?"}
              </div>
              <div className="md:hidden lg:block min-w-0">
                <p className="text-sm font-bold text-(--on-surface) truncate">
                  {user ? `${user.firstName} ${user.lastName}`.trim() : "—"}
                </p>
                <p className="text-[10px] text-(--on-surface-variant) truncate">
                  {user?.companyName || ""}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
