"use client";

import { useState, createContext, useContext, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/shared";
import { ConfirmProvider } from "@/lib/hooks/use-confirm";
import { AuthGuard } from "@/components/app/auth-guard";
import { LegalReacceptGuard } from "@/components/legal/legal-reaccept-guard";
import { CookieBanner } from "@/components/app/cookie-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { QuotaWarningBanner } from "@/components/app/quota-warning-banner";
import { subscribe, logout, switchCompany, getImpersonationContext, type UserInfo, type CompanyInfo } from "@/lib/auth";
import { useToast } from "@/components/shared";
import { DashboardProvider } from "@/lib/contexts/dashboard-context";

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
  const [user, setUser] = useState<UserInfo | null>(null);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [switching, setSwitching] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const router = useRouter();
  const wasLoggedIn = useRef(false);

  // Unified auth subscription — redirects on session drop
  useEffect(() => {
    return subscribe((u) => {
      setUser(u);
      setCompanies(u?.companies ?? []);
      if (u) {
        wasLoggedIn.current = true;
      } else if (wasLoggedIn.current) {
        router.replace("/login");
      }
    });
  }, [router]);

  const displayUser = user
    ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
    : null;

  async function handleLogout() {
    await logout().catch(() => {});
    router.replace("/login");
  }

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <ToastProvider>
      <ConfirmProvider>
      <AuthGuard>
      <DashboardProvider>
      <LegalReacceptGuard />
      <CookieBanner />
      <ImpersonationBanner />
      <QuotaWarningBanner />
      <div className="min-h-screen bg-(--surface) text-(--on-surface)">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="ml-0 md:ml-20 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
          {/* Global Header */}
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2.5 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell
                open={notiOpen}
                onOpenChange={(o) => { setNotiOpen(o); if (o) setProfileOpen(false); }}
              />
              <div className="h-6 w-px bg-slate-200" />
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900 leading-none">{displayUser ? `${displayUser.firstName} ${displayUser.lastName}` : "..."}</p>
                    <p className="text-[10px] text-slate-400">{user?.companyName || (user && !user.isOperator ? "สมาชิก" : "")}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-(--primary) flex items-center justify-center text-white text-sm font-bold">
                    {displayUser?.firstName?.charAt(0) || "?"}
                  </div>
                </button>
                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-14 z-50 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{displayUser ? `${displayUser.firstName} ${displayUser.lastName}` : ""}</p>
                        <p className="text-xs text-slate-400">{displayUser?.email}</p>
                      </div>
                      {/* Company Switcher */}
                      {companies.length > 1 && (
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-1">บริษัท</p>
                          {companies.map((c) => (
                            <button
                              key={c.id}
                              disabled={switching}
                              onClick={async () => {
                                if (c.id === user?.companyId) return;
                                setSwitching(true);
                                try {
                                  const data = await switchCompany(c.id);
                                  setUser(data.user);
                                  setProfileOpen(false);
                                  window.location.reload();
                                } catch { /* ignore */ }
                                setSwitching(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                                c.id === user?.companyId ? "bg-(--primary-container)/40" : "hover:bg-slate-50"
                              }`}
                            >
                              {c.logoUrl ? (
                                <img src={c.logoUrl} className="w-7 h-7 rounded-lg object-cover" alt="" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{c.name.charAt(0)}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{c.name}</p>
                                <p className="text-[10px] text-slate-400">{c.role}</p>
                              </div>
                              {c.id === user?.companyId && (
                                <span className="material-symbols-outlined text-(--primary) text-sm">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      <nav className="py-2">
                        <a href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">person</span>
                          โปรไฟล์บริษัท
                        </a>
                        <a href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">settings</span>
                          ตั้งค่าบัญชี
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
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left">
                          <span className="material-symbols-outlined text-lg">logout</span>
                          ออกจากระบบ
                        </button>
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
            <a href="/dashboard/profile" className="flex flex-col items-center gap-0.5 p-2 text-slate-400">
              <span className="material-symbols-outlined text-xl">person</span>
              <span className="text-[10px] font-medium">โปรไฟล์</span>
            </a>
          </nav>

          {/* Global Footer */}
          <footer className="border-t border-slate-100 px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p>&copy; 2569 TripApp · v0.1.0</p>
            <div className="flex items-center gap-4">
              <a href="/dashboard/terms" className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้งาน</a>
              <a href="/dashboard/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</a>
              <a href="/dashboard/help" className="hover:text-slate-600 transition-colors">ช่วยเหลือ</a>
              <a href="/dashboard/feedback" className="hover:text-slate-600 transition-colors">แจ้งปัญหา / ข้อเสนอแนะ</a>
            </div>
          </footer>
        </main>
      </div>
    </DashboardProvider>
    </AuthGuard>
    </ConfirmProvider>
    </ToastProvider>
    </SidebarContext.Provider>
  );
}

function ImpersonationBanner(): React.ReactNode {
  const [ctx, setCtx] = useState<{ active: boolean; impersonatedBy: string | null }>({ active: false, impersonatedBy: null });

  useEffect(() => {
    setCtx(getImpersonationContext());
    const interval = setInterval(() => setCtx(getImpersonationContext()), 5_000);
    return () => clearInterval(interval);
  }, []);

  if (!ctx.active) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white text-sm font-bold flex items-center justify-center gap-3 py-2 px-4 shadow">
      <span className="material-symbols-outlined text-base">visibility</span>
      <span>โหมดดูแทน operator (read-only) โดย {ctx.impersonatedBy ?? "Staff"} — กดแก้ไขใดๆ จะถูก reject</span>
    </div>
  );
}
