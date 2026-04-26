"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { EmptyState, Pagination, SectionHeader, useToast } from "@/components/shared";

interface PaymentItem {
  id: string;
  planCode: string;
  amount: number;
  currency: string;
  quantity: number;
  status: string;
  createdAt: string;
}

interface UsageData {
  tier: string;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt: string | null;
  subscriptionStatus: string | null;
}

const PLAN_LABEL: Record<string, string> = {
  per_trip: "จ่ายต่อทริป",
  pack_5: "แพ็ค 5 ทริป",
  subscription: "Subscription (รายเดือน)",
};

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  per_trip: "จ่ายต่อทริป",
  pack_5: "แพ็ค 5 ทริป",
  subscription: "Subscription",
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-green-50 text-green-700 border border-green-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  failed: "bg-red-50 text-red-700 border border-red-200",
  refunded: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  expired: "bg-slate-100 text-slate-600 border border-slate-200",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "สำเร็จ",
  pending: "รอดำเนินการ",
  failed: "ล้มเหลว",
  refunded: "คืนเงินแล้ว",
  expired: "หมดอายุ",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

interface PaymentHistoryPage {
  totalCount: number;
  totalRevenue: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PaymentItem[];
}

function BillingContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [paymentPage, setPaymentPage] = useState<PaymentHistoryPage | null>(null);
  const [page, setPage] = useState(1);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [tripCounts, setTripCounts] = useState<{ totalNotArchived: number; draftCount: number; publishedCount: number; freeLimit: number } | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<PaymentHistoryPage>(`/admin/billing/payments?page=${page}&pageSize=20`),
      api.get<UsageData>("/admin/usage"),
    ])
      .then(([p, u]) => {
        setPaymentPage(p);
        setUsage(u);
        if (searchParams.get("success") === "1" && p.items.length > 0) {
          const latestPaid = new Date(p.items[0].createdAt).getTime();
          if (Date.now() - latestPaid < 10 * 60 * 1000) setSuccessBanner(true);
        }
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, searchParams]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const result = await api.post<{ url: string }>("/admin/billing/portal", { returnUrl: window.location.href });
      window.location.href = result.url;
    } catch (e: unknown) {
      setPortalLoading(false);
      toast(e instanceof ApiError ? e.message : "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const result = await api.post<{ accessUntil: string; status: string }>("/admin/billing/cancel-subscription", {
        reason: cancelReason.trim() || null,
      });
      setCancelSuccess(`ยกเลิกเรียบร้อย — ใช้งานได้ถึง ${formatDate(result.accessUntil)}`);
      setCancelOpen(false);
      setCancelReason("");
    } catch (e: unknown) {
      setCancelError(e instanceof ApiError ? e.message : "ไม่สามารถยกเลิกได้ กรุณาลองใหม่");
    } finally {
      setCancelLoading(false);
    }
  };

  const payments = paymentPage?.items ?? [];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-60">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-slate-500 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary font-semibold cursor-pointer">ลองใหม่</button>
      </div>
    );
  }

  const isSub = usage?.hasActiveSubscription ?? false;
  const isPastDue = usage?.subscriptionStatus === "past_due";
  const totalRevenue = paymentPage?.totalRevenue ?? 0;
  const totalCount = paymentPage?.totalCount ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header — clean professional style matching mockup */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">การชำระเงิน</h1>
        <p className="text-on-surface-variant mt-2 text-base md:text-lg">ดูประวัติการชำระเงิน + จัดการ Subscription ของคุณ</p>
      </div>

      {/* ═══ Success Banner ═══ */}
      {successBanner && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="text-sm font-semibold text-green-700">ชำระเงินสำเร็จ! แพลนของคุณได้รับการอัปเดตแล้ว</p>
          </div>
          <button onClick={() => setSuccessBanner(false)} className="text-green-500 cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* ═══ Cancel Success Banner ═══ */}
      {cancelSuccess && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="text-sm font-semibold text-amber-700">{cancelSuccess}</p>
          </div>
          <button onClick={() => setCancelSuccess(null)} className="text-amber-500 cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* ═══ Past-due Banner ═══ */}
      {isPastDue && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">การชำระเงินไม่สำเร็จ — บัตรอาจหมดอายุหรือเงินไม่เพียงพอ</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Stripe จะลองเรียกเก็บอีกครั้งภายใน 7 วัน หากไม่สำเร็จ Subscription จะถูกระงับและปรับลงเป็น Free Plan โดยอัตโนมัติ
            </p>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-full font-bold text-xs hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {portalLoading ? (
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">credit_card</span>
              )}
              อัปเดตวิธีชำระเงินทันที
            </button>
          </div>
        </div>
      )}

      {/* ═══ Plan + Spent Summary — clean white cards (matches upgrade mockup) ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan + Subscription mgmt */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--surface-container-high) shadow-sm p-6 md:p-8 flex flex-col justify-between min-h-60">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-(--primary-container) rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <span className="px-3 py-1 bg-(--surface-container-high) text-on-surface-variant text-[10px] font-bold tracking-widest uppercase rounded-full">
                แพลนปัจจุบัน
              </span>
              {isSub && (
                <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold tracking-widest uppercase rounded-full border border-green-200">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
              {usage ? (TIER_LABEL[usage.tier] ?? usage.tier) : "—"} Plan
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm md:text-base">
              ยอดชำระสะสม <strong className="text-on-surface">฿{totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong> • {totalCount} รายการ
            </p>
            {isSub && usage?.subscriptionExpiresAt && (
              <p className="text-xs text-on-surface-variant mt-1">
                {isPastDue ? "ต้องอัปเดตบัตรก่อน" : "ต่ออายุอัตโนมัติ"} {formatDate(usage.subscriptionExpiresAt)}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
            {isSub ? (
              <>
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) text-white rounded-xl font-bold text-sm shadow-lg shadow-(--primary)/20 hover:opacity-95 disabled:opacity-60 cursor-pointer transition-all"
                >
                  {portalLoading ? (
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-base">credit_card</span>
                  )}
                  อัปเดตบัตร / ใบเสร็จ
                </button>
                <button
                  onClick={async () => {
                    setCancelOpen(true);
                    setCancelError(null);
                    // H3.1: load draft + published counts for warning
                    try {
                      const counts = await api.get<typeof tripCounts>("/admin/trips/counts");
                      setTripCounts(counts);
                    } catch { /* ignore — modal still works without counts */ }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-(--outline-variant) text-on-surface rounded-xl font-bold text-sm hover:bg-(--surface-container-low) transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  ยกเลิก
                </button>
              </>
            ) : (
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) text-white rounded-xl font-bold text-sm shadow-lg shadow-(--primary)/20 hover:opacity-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                อัปเกรดแพลน
              </Link>
            )}
          </div>
        </div>

        {/* Total Revenue Stat Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-(--surface-container-high) shadow-sm flex flex-col justify-center text-center space-y-4">
          <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-(--primary-container)">
            <span className="material-symbols-outlined text-2xl text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-outline">ยอดชำระรวม</p>
            <p className="text-3xl md:text-4xl font-black text-on-surface mt-2">
              ฿{totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{totalCount} รายการสำเร็จ</p>
          </div>
        </div>
      </section>

      {/* ═══ Cancel Modal — matches <ConfirmDialog> style + adds reason textarea ═══ */}
      {cancelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 cursor-pointer" onClick={() => !cancelLoading && setCancelOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ยืนยันยกเลิก Subscription?</h3>
              <p className="text-sm text-slate-500 mt-1">
                คุณยังใช้งานได้จนถึง <strong className="text-slate-700">{usage?.subscriptionExpiresAt ? formatDate(usage.subscriptionExpiresAt) : "วันหมดอายุปัจจุบัน"}</strong> หลังจากนั้นบัญชีจะปรับเป็น Free Plan โดยอัตโนมัติ
              </p>
            </div>

            {/* H3.1: Warn if drafts/published exceed free tier limit */}
            {tripCounts && tripCounts.totalNotArchived > tripCounts.freeLimit && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-base mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                  <div>
                    <p className="font-bold">⚠️ หลังหมดอายุ คุณจะ publish ทริปเพิ่มไม่ได้</p>
                    <p className="mt-1">
                      ตอนนี้คุณมี <strong>{tripCounts.publishedCount}</strong> ทริปที่ publish, <strong>{tripCounts.draftCount}</strong> ร่าง — Free plan จำกัด {tripCounts.freeLimit} ทริปทั้งหมด
                    </p>
                    <p className="mt-1">
                      ทริปที่ publish ไปแล้ว → ใช้งานต่อได้ปกติ. ทริปร่าง → ต้องซื้อ credits ก่อน publish
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">เหตุผล (ไม่บังคับ)</label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                maxLength={512}
                rows={3}
                placeholder="ช่วยบอกเราว่าทำไมคุณยกเลิก..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:bg-white resize-none transition-all"
              />
            </div>
            {cancelError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                {cancelError}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancelOpen(false)}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                ไม่, ใช้งานต่อ
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {cancelLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Payment Table ═══ */}
      <section className="space-y-4">
        <SectionHeader title="รายการชำระเงิน" subtitle="ประวัติการชำระเงินทั้งหมดของบัญชีคุณ" />

        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          {payments.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="ยังไม่มีประวัติการชำระเงิน"
              description="เมื่อคุณซื้อทริปหรือสมัคร Subscription รายการจะแสดงที่นี่"
              actionLabel="อัปเกรดแพลน"
              actionHref="/dashboard/upgrade"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-(--surface-container) text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="px-6 py-4">วันที่</th>
                    <th className="px-6 py-4">แพลน</th>
                    <th className="px-6 py-4">จำนวนเงิน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-right">ใบเสร็จ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {payments.map((tx) => (
                    <tr key={tx.id} className="hover:bg-(--surface-container)/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-on-surface">{formatDate(tx.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {PLAN_LABEL[tx.planCode] ?? tx.planCode}
                        {tx.quantity > 1 && <span className="ml-1 text-xs text-primary font-bold">×{tx.quantity}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-on-surface">
                        ฿{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_STYLE[tx.status] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {STATUS_LABEL[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === "paid" ? (
                          <button
                            onClick={async () => {
                              try {
                                const r = await api.get<{ url: string }>(`/admin/billing/payments/${tx.id}/receipt`);
                                window.open(r.url, "_blank", "noopener,noreferrer");
                              } catch (e: unknown) {
                                toast(e instanceof ApiError ? e.message : "ไม่สามารถดึงใบเสร็จได้", "error");
                              }
                            }}
                            className="text-primary text-xs font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">receipt_long</span>
                            ดาวน์โหลด
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paymentPage && paymentPage.totalPages > 1 && (
            <Pagination
              currentPage={paymentPage.page}
              totalPages={paymentPage.totalPages}
              totalItems={paymentPage.totalCount}
              pageSize={paymentPage.pageSize}
              onPageChange={setPage}
            />
          )}
        </div>
      </section>

      {/* ═══ Footer Info ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-outline-variant p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary">verified_user</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">การชำระเงินปลอดภัย</h4>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              ข้อมูลการชำระเงินทั้งหมดถูกเข้ารหัสและดำเนินการผ่าน Stripe ระบบไม่เก็บข้อมูลบัตรเครดิต
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-outline-variant p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-(--surface-container) flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">receipt</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">ต้องการใบกำกับภาษี?</h4>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              หากต้องการใบกำกับภาษีหรือเพิ่มข้อมูลบริษัทในใบเสร็จ <Link href="/dashboard/support" className="text-primary font-semibold hover:underline">ติดต่อฝ่ายสนับสนุน</Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function BillingPage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>}>
      <BillingContent />
    </Suspense>
  );
}
