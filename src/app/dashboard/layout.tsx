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
  const [profileOpen, setProfileOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <div className="min-h-screen bg-(--surface) text-(--on-surface)">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="ml-0 md:ml-20 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
          {/* Global Header */}
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2.5 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="relative hidden sm:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input className="bg-slate-50 border-none rounded-full py-2.5 pl-10 pr-5 text-sm w-64 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="ค้นหา..." />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="h-6 w-px bg-slate-200" />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-none">สมชาย ใจดี</p>
                    <p className="text-[10px] text-slate-400">Amazing Tour Co.</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    ส
                  </div>
                </button>
                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-14 z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-100">
                        <p className="font-bold text-slate-900">สมชาย ใจดี</p>
                        <p className="text-xs text-slate-400">admin@amazingtour.com</p>
                      </div>
                      <nav className="py-2">
                        <a href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">person</span>
                          โปรไฟล์บริษัท
                        </a>
                        <a href="/dashboard/usage" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">speed</span>
                          การใช้งาน & แพลน
                        </a>
                        <a href="/dashboard/upgrade" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">upgrade</span>
                          อัปเกรดแพลน
                        </a>
                        <a href="/dashboard/billing" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">receipt_long</span>
                          ประวัติการชำระเงิน
                        </a>
                      </nav>
                      <div className="border-t border-slate-100 py-2">
                        <a href="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">logout</span>
                          ออกจากระบบ
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Global Footer */}
          <footer className="border-t border-slate-100 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>&copy; 2569 Trip Admin · v0.1.0</p>
            <div className="flex items-center gap-4">
              <a href="/dashboard/terms" className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้งาน</a>
              <a href="/dashboard/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="/dashboard/help" className="hover:text-slate-600 transition-colors">ช่วยเหลือ</a>
            </div>
          </footer>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
