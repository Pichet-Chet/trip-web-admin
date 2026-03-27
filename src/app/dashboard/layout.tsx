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
          {/* Global Header */}
          <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu */}
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined">menu</span>
              </button>
              {/* Search */}
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  className="bg-slate-50 border-none rounded-full py-2.5 pl-10 pr-5 text-sm w-64 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  placeholder="ค้นหา..."
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                <span className="material-symbols-outlined text-xl">settings</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
