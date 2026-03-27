"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";

const SidebarContext = createContext<{ openSidebar: () => void }>({ openSidebar: () => {} });
export function useSidebar(): { openSidebar: () => void } { return useContext(SidebarContext); }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <div className="min-h-screen bg-(--surface) text-(--on-surface)">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="ml-0 md:ml-20 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
