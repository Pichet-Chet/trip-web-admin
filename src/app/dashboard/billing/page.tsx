"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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

interface MyRefundRequest {
  id: string;
  paymentId: string;
  planCode: string;
  amount: number;
  currency: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
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

  // Phase A — refund requests
  const [refundRequests, setRefundRequests] = useState<MyRefundRequest[]>([]);
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);

  // Phase V — billing profile awareness (banner when not opted in)
  const [billingProfile, setBillingProfile] = useState<{ wantsTaxInvoice: boolean; legalName: string } | null | "missing">(null);

  const loadRefunds = useCallback(async () => {
    try {
      const rows = await api.get<MyRefundRequest[]>("/admin/refund-requests");
      setRefundRequests(rows);
    } catch { /* ignore — refund flow optional */ }
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  useEffect(() => {
    api.get<{ wantsTaxInvoice: boolean; legalName: string } | null>("/admin/billing/billing-profile")
      .then(p => setBillingProfile(p ?? "missing"))
      .catch(() => setBillingProfile("missing"));
  }, []);

  function refundStatusFor(paymentId: string): "pending" | "rejected" | null {
    // approved → backend marks payment.status="refunded" so we don't reach here
    // cancelled → operator can submit again
    const open = refundRequests.find(r => r.paymentId === paymentId && (r.status === "pending" || r.status === "rejected"));
    if (!open) return null;
    return open.status === "pending" ? "pending" : "rejected";
  }

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

  // Stripe webhook can land 1-10s after redirect — refetch usage twice at
  // 3s and 8s when ?success=1 so the Account Status card reflects the new
  // tier without a manual page refresh. Also clear the localStorage
  // checkout-in-flight flag set by /dashboard/upgrade.
  useEffect(() => {
    if (searchParams.get("success") !== "1") return;
    try { localStorage.removeItem("tripapp:checkout-in-flight"); } catch {}

    const refetch = () => api.get<UsageData>("/admin/usage").then(setUsage).catch(() => {});
    const t1 = setTimeout(refetch, 3_000);
    const t2 = setTimeout(refetch, 8_000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [searchParams]);

  const handlePortal = async () => {
    setPortalLoading(true);
    // 15s client-side timeout — Stripe portal usually responds in <2s, anything
    // longer is a sign of a hung request. Without this the spinner could spin
    // forever and the user keeps clicking, opening 5 tickets to support.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new ApiError("Portal API ตอบช้ากว่าปกติ — กรุณาลองใหม่", 504)), 15_000)
    );
    try {
      const result = await Promise.race([
        api.post<{ url: string }>("/admin/billing/portal", { returnUrl: window.location.href }),
        timeout,
      ]);
      window.location.href = result.url;
    } catch (e: unknown) {
      setPortalLoading(false);
      toast(e instanceof ApiError ? e.message : "เกิดข้อผิดพลาด", "error");
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelError(null);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new ApiError("API ตอบช้ากว่าปกติ — กรุณาลองใหม่", 504)), 20_000)
    );
    try {
      const result = await Promise.race([
        api.post<{ accessUntil: string; status: string }>("/admin/billing/cancel-subscription", {
          reason: cancelReason.trim() || null,
        }),
        timeout,
      ]);
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
  const subStatus = usage?.subscriptionStatus ?? null;
  const isPastDue = subStatus === "past_due";
  const isPending = subStatus === "pending";
  const isCancelling = subStatus === "cancelling" || subStatus === "scheduled_cancel";
  const totalRevenue = paymentPage?.totalRevenue ?? 0;
  const totalCount = paymentPage?.totalCount ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header — matches /dashboard/usage */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">การชำระเงิน</h1>
          <p className="text-on-surface-variant mt-2 text-base md:text-lg">ดูประวัติการชำระเงิน + จัดการ Subscription ของคุณ</p>
        </div>
        <Link
          href="/dashboard/billing/profile"
          className="self-start inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-(--outline-variant) text-on-surface rounded-xl font-bold text-sm hover:bg-(--surface-container-low) transition-colors"
        >
          <span className="material-symbols-outlined text-base">description</span>
          ข้อมูลใบกำกับภาษี
        </Link>
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

      {/* ═══ Plan Hero + Stat — matches /dashboard/usage layout ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan + Subscription mgmt */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--surface-container-high) shadow-sm p-6 md:p-8 flex flex-col justify-between min-h-60">
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="p-2.5 bg-(--primary-container) rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <span className="px-3 py-1 bg-(--surface-container-high) text-on-surface-variant text-[10px] font-bold tracking-widest uppercase rounded-full">
                แพลนปัจจุบัน
              </span>
              {isSub && !isPastDue && !isPending && !isCancelling && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold tracking-widest uppercase rounded-full border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              )}
              {isPastDue && (
                <span className="px-3 py-1 bg-red-50 text-red-700 text-[10px] font-bold tracking-widest uppercase rounded-full border border-red-200">Past Due</span>
              )}
              {isPending && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold tracking-widest uppercase rounded-full border border-amber-200">Pending</span>
              )}
              {isCancelling && (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold tracking-widest uppercase rounded-full border border-slate-200">Cancelling</span>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
              {usage ? (TIER_LABEL[usage.tier] ?? usage.tier) : "—"} <span className="text-on-surface-variant font-bold text-2xl md:text-3xl">Plan</span>
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm md:text-base">
              ยอดชำระสะสม <strong className="text-on-surface">฿{totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</strong> • {totalCount} รายการ
            </p>
            {isSub && usage?.subscriptionExpiresAt && (
              <p className="text-xs text-on-surface-variant mt-1">
                {isPastDue ? "ต้องอัปเดตบัตรก่อน "
                  : isCancelling ? "ใช้งานได้ถึง "
                  : isPending ? "รอ webhook ยืนยัน • คาดว่าครบกำหนด "
                  : "ต่ออายุอัตโนมัติ "}
                {formatDate(usage.subscriptionExpiresAt)}
              </p>
            )}
            {isPending && (
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                ระบบกำลังรอ Stripe webhook — สถานะจะอัปเดตในไม่กี่วินาที
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
                    try {
                      const counts = await api.get<typeof tripCounts>("/admin/trips/counts");
                      setTripCounts(counts);
                    } catch { /* ignore */ }
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

        {/* Total Revenue Stat Card — matches usage gauge card style */}
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

      {/* ═══ Tax invoice opt-in banner (Phase V) ═══ */}
      {billingProfile === "missing" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-600 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900">ต้องการใบกำกับภาษี?</p>
            <p className="text-xs text-blue-800 mt-0.5">ตั้งข้อมูลบริษัทเพื่อให้ระบบออกใบกำกับภาษี PDF ให้อัตโนมัติทุกครั้งที่ชำระเงิน</p>
          </div>
          <Link href="/dashboard/billing/profile" className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:opacity-90">
            ตั้งค่า
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      )}
      {billingProfile && billingProfile !== "missing" && !billingProfile.wantsTaxInvoice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 mt-0.5">info</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">ใบกำกับภาษีปิดอยู่</p>
            <p className="text-xs text-amber-800 mt-0.5">มีข้อมูลบริษัทแล้วแต่ยังไม่ได้เปิดออกใบกำกับภาษีอัตโนมัติ</p>
          </div>
          <Link href="/dashboard/billing/profile" className="shrink-0 inline-flex items-center gap-1 px-4 py-2 bg-amber-600 text-white rounded-full text-xs font-bold hover:opacity-90">
            จัดการ
          </Link>
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
                    <th className="px-6 py-4 text-right">การกระทำ</th>
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
                          <div className="inline-flex items-center gap-4 justify-end">
                            <button
                              onClick={async () => {
                                try {
                                  const r = await api.get<{ url: string }>(`/admin/billing/payments/${tx.id}/receipt`);
                                  window.open(r.url, "_blank", "noopener,noreferrer");
                                } catch (e: unknown) {
                                  toast(e instanceof ApiError ? e.message : "ไม่สามารถดึงใบเสร็จได้", "error");
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-(--primary) hover:underline cursor-pointer"
                              title="ใบเสร็จ Stripe"
                            >
                              <span className="material-symbols-outlined text-[16px] leading-none">receipt_long</span>
                              <span className="leading-none">ใบเสร็จ</span>
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const r = await api.get<{ downloadUrl: string }>(`/admin/billing/payments/${tx.id}/tax-invoice`);
                                  window.open(r.downloadUrl, "_blank", "noopener,noreferrer");
                                } catch (e: unknown) {
                                  if (e instanceof ApiError && e.status === 404) {
                                    if (confirm("ยังไม่ได้ออกใบกำกับภาษีสำหรับรายการนี้ — ออกตอนนี้?")) {
                                      try {
                                        const r2 = await api.post<{ downloadUrl: string }>(`/admin/billing/payments/${tx.id}/tax-invoice/issue`, {});
                                        window.open(r2.downloadUrl, "_blank", "noopener,noreferrer");
                                      } catch (e2) {
                                        toast(e2 instanceof ApiError ? e2.message : "ออกใบกำกับภาษีไม่สำเร็จ", "error");
                                      }
                                    }
                                  } else {
                                    toast(e instanceof ApiError ? e.message : "ไม่สามารถดึงใบกำกับภาษีได้", "error");
                                  }
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                              title="ใบกำกับภาษี (PDF)"
                            >
                              <span className="material-symbols-outlined text-[16px] leading-none">description</span>
                              <span className="leading-none">ใบกำกับภาษี</span>
                            </button>
                            {refundStatusFor(tx.id) === "pending" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600" title="รอ staff review">
                                <span className="material-symbols-outlined text-[16px] leading-none">hourglass_empty</span>
                                <span className="leading-none">รอตรวจ</span>
                              </span>
                            ) : refundStatusFor(tx.id) === "rejected" ? (
                              <span className="text-xs font-semibold text-slate-400" title="คำขอถูก reject">ปฏิเสธ</span>
                            ) : (
                              <button
                                onClick={() => setRefundTarget(tx)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                                title="ขอเงินคืน (ผ่าน staff review)"
                              >
                                <span className="material-symbols-outlined text-[16px] leading-none">currency_exchange</span>
                                <span className="leading-none">ขอคืนเงิน</span>
                              </button>
                            )}
                          </div>
                        ) : tx.status === "refunded" ? (
                          <span className="text-xs font-semibold text-emerald-700">คืนแล้ว</span>
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

      {/* ═══ Footer Info — matches /dashboard/usage card style ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-outline-variant p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-(--primary-container) flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-(--primary)">verified_user</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">การชำระเงินปลอดภัย</h4>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              ข้อมูลการชำระเงินทั้งหมดถูกเข้ารหัสและดำเนินการผ่าน Stripe ระบบไม่เก็บข้อมูลบัตรเครดิต
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-outline-variant p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-(--surface-container-high) flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">receipt</span>
          </div>
          <div>
            <h4 className="font-bold text-on-surface text-sm">ต้องการใบกำกับภาษี?</h4>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              ตั้งข้อมูลบริษัทเพื่อรับ <Link href="/dashboard/billing/profile" className="text-(--primary) font-semibold hover:underline">ใบกำกับภาษีอัตโนมัติ</Link> · <Link href="/dashboard/refund-policy" className="text-(--primary) font-semibold hover:underline">นโยบายคืนเงิน</Link>
            </p>
          </div>
        </div>
      </section>

      {refundTarget && (
        <RefundRequestModal
          payment={refundTarget}
          onClose={() => setRefundTarget(null)}
          onSubmitted={() => { setRefundTarget(null); loadRefunds(); }}
        />
      )}
    </div>
  );
}

interface RefundRequestModalProps {
  payment: PaymentItem;
  onClose: () => void;
  onSubmitted: () => void;
}

interface RefundEligibility {
  status: "eligible" | "partial" | "blocked" | "force_majeure_only";
  planCode: string;
  totalAmount: number;
  refundableAmount: number;
  currency: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  publishedTripsConsumed: number;
  windowExpiresAt: string | null;
  daysRemaining: number | null;
  blockReasonKey: string | null;
  blockReasonMessage: string | null;
  requiresStaffAdmin: boolean;
}

function RefundRequestModal({ payment, onClose, onSubmitted }: RefundRequestModalProps): React.ReactNode {
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<RefundEligibility | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(true);

  // Phase U — preview eligibility before letting the user fill in reason.
  // Avoids accepting a long reason only for the API to reject at submit.
  useEffect(() => {
    setVerdictLoading(true);
    api.get<RefundEligibility>(`/admin/refund-requests/eligibility?paymentId=${payment.id}`)
      .then(setVerdict)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setVerdictLoading(false));
  }, [payment.id]);

  const blocked = verdict?.status === "blocked" || verdict?.status === "force_majeure_only";

  async function submit() {
    if (reason.trim().length < 10) {
      setError("กรุณาระบุเหตุผล (อย่างน้อย 10 ตัวอักษร)");
      return;
    }
    if (!acknowledged) {
      setError("กรุณาอ่านและยืนยันเงื่อนไข");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/admin/refund-requests", { paymentId: payment.id, reason: reason.trim() });
      onSubmitted();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "ส่งคำขอไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !submitting && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">ขอเงินคืน</h3>
          <p className="text-sm text-slate-600 mt-1">
            <strong>฿{payment.amount.toFixed(2)}</strong> · {PLAN_LABEL[payment.planCode] ?? payment.planCode}
            {payment.quantity > 1 && ` ×${payment.quantity}`}
          </p>
        </div>

        {verdictLoading && (
          <div className="text-center py-4 text-slate-400 text-sm">
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            <p className="mt-1">กำลังตรวจสอบสิทธิ์ตามนโยบาย...</p>
          </div>
        )}

        {verdict && verdict.status === "eligible" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1 text-xs">
            <p className="font-bold text-emerald-800 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">check_circle</span>
              ขอคืนเงินได้เต็มจำนวน ฿{verdict.refundableAmount.toFixed(2)}
            </p>
            {verdict.daysRemaining !== null && (
              <p className="text-emerald-700">เหลือเวลาขอคืนอีก {verdict.daysRemaining} วัน</p>
            )}
          </div>
        )}

        {verdict && verdict.status === "partial" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1 text-xs">
            <p className="font-bold text-amber-900 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">pie_chart</span>
              คืนแบบ Pro-rata
            </p>
            <p className="text-amber-800">
              ใช้เครดิตไป {verdict.creditsUsed}/{verdict.creditsTotal} → คืนได้ <strong>฿{verdict.refundableAmount.toFixed(2)}</strong> จาก ฿{verdict.totalAmount.toFixed(2)}
            </p>
            {verdict.daysRemaining !== null && (
              <p className="text-amber-700">เหลือเวลาขอคืนอีก {verdict.daysRemaining} วัน</p>
            )}
          </div>
        )}

        {verdict && blocked && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 space-y-2">
            <p className="font-bold text-rose-800 inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">block</span>
              ไม่สามารถขอคืนเงินตามนโยบายปกติ
            </p>
            <p className="text-xs text-rose-700 leading-relaxed">{verdict.blockReasonMessage}</p>
            {verdict.publishedTripsConsumed > 0 && (
              <p className="text-xs text-rose-700">มีทริปที่ publish/รอตรวจ: {verdict.publishedTripsConsumed} รายการ</p>
            )}
            <Link
              href="/dashboard/support"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline mt-1"
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              ติดต่อ Support สำหรับกรณีพิเศษ
            </Link>
          </div>
        )}

        {!blocked && (
          <>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">เหตุผลที่ต้องการเงินคืน <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                maxLength={2048}
                rows={4}
                placeholder="เช่น ชำระซ้ำซ้อนโดยไม่ได้ตั้งใจ / สมัครผิดแพคเกจ / ระบบเก็บเงินผิด..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">{reason.length}/2048</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
              <input
                type="checkbox"
                id="ack"
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <label htmlFor="ack" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                ฉันเข้าใจว่าคำขอจะส่งไปยังทีมงานเพื่อตรวจสอบ ไม่ใช่การคืนเงินทันที — อ่าน{" "}
                <Link href="/dashboard/refund-policy" className="text-rose-600 font-bold hover:underline">นโยบายคืนเงินฉบับเต็ม</Link>
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {blocked ? "ปิด" : "ยกเลิก"}
          </button>
          {!blocked && (
            <button
              onClick={submit}
              disabled={submitting || !acknowledged || reason.trim().length < 10 || verdictLoading}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
              ส่งคำขอ
            </button>
          )}
        </div>
      </div>
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
