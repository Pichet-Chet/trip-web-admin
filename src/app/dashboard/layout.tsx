"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/shared";

const SidebarContext = createContext<{ openSidebar: () => void }>({ openSidebar: () => {} });
export function useSidebar(): { openSidebar: () => void } { return useContext(SidebarContext); }

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <ToastProvider>
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
              <div className="relative">
                <button onClick={() => { setNotiOpen(!notiOpen); setProfileOpen(false); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors relative">
                  <span className="material-symbols-outlined text-xl">notifications</span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                {notiOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotiOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">การแจ้งเตือน</span>
                        <span className="text-xs text-blue-600 font-semibold cursor-pointer">อ่านทั้งหมด</span>
                      </div>
                      <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                        {[
                          { text: "Anna ขอเข้าร่วมทริป Tokyo Winter Trip", time: "5 นาทีที่แล้ว", unread: true },
                          { text: "เอก ขอเข้าร่วมทริป Tokyo Winter Trip", time: "1 ชั่วโมงที่แล้ว", unread: true },
                          { text: "สมชาย รับทราบการเปลี่ยนแปลงทริปแล้ว", time: "2 ชั่วโมงที่แล้ว", unread: false },
                          { text: "แพลน Free ใกล้ถึงลิมิต (2/3 ทริป)", time: "เมื่อวาน", unread: false },
                        ].map((n, i) => (
                          <div key={i} className={`px-4 py-3 ${n.unread ? "bg-blue-50/30" : ""}`}>
                            <p className="text-sm text-slate-700">{n.text}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{n.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                        <a href="/dashboard/help" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">help</span>
                          ช่วยเหลือ
                        </a>
                        <a href="/dashboard/feedback" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">feedback</span>
                          แจ้งปัญหา / ข้อเสนอแนะ
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
          <div className="flex-1 pb-16 md:pb-0">
            {children}
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex justify-around items-center py-2 safe-area-pb">
            <a href="/dashboard" className="flex flex-col items-center gap-0.5 p-2 text-slate-400">
              <span className="material-symbols-outlined text-xl">dashboard</span>
              <span className="text-[10px] font-medium">หน้าหลัก</span>
            </a>
            <a href="/dashboard/my-trips" className="flex flex-col items-center gap-0.5 p-2 text-slate-400">
              <span className="material-symbols-outlined text-xl">luggage</span>
              <span className="text-[10px] font-medium">ทริป</span>
            </a>
            <a href="/dashboard/trips/new" className="flex flex-col items-center gap-0.5 p-2 text-blue-600">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              <span className="text-[10px] font-bold">สร้างทริป</span>
            </a>
            <a href="/dashboard/profile" className="flex flex-col items-center gap-0.5 p-2 text-slate-400">
              <span className="material-symbols-outlined text-xl">person</span>
              <span className="text-[10px] font-medium">โปรไฟล์</span>
            </a>
          </nav>

          {/* Global Footer */}
          <footer className="border-t border-slate-100 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>&copy; 2569 Trip Admin · v0.1.0</p>
            <div className="flex items-center gap-4">
              <a href="/dashboard/terms" className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้งาน</a>
              <a href="/dashboard/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="/dashboard/help" className="hover:text-slate-600 transition-colors">ช่วยเหลือ</a>
              <a href="/dashboard/feedback" className="hover:text-slate-600 transition-colors">แจ้งปัญหา / ข้อเสนอแนะ</a>
            </div>
          </footer>
        </main>
      </div>
    </ToastProvider>
    </SidebarContext.Provider>
  );
}
