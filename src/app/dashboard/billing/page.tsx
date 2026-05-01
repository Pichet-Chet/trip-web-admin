"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Banner, EmptyState, ErrorState, LoadingState, Modal, Pagination, SectionHeader, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

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
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
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
  autoClassification: string | null;
  recommendedRefundAmount: number | null;
  approvedRefundAmount: number | null;
}

const REFUND_STATUS: Record<MyRefundRequest["status"], { label: string; cls: string; icon: string }> = {
  pending:   { label: "รอตรวจ",      cls: "bg-amber-50 text-amber-700 border-amber-200",   icon: "hourglass_empty" },
  approved:  { label: "อนุมัติ",       cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "check_circle" },
  rejected:  { label: "ปฏิเสธ",        cls: "bg-rose-50 text-rose-700 border-rose-200",       icon: "cancel" },
  cancelled: { label: "ยกเลิกเอง",    cls: "bg-slate-100 text-slate-600 border-slate-200",   icon: "block" },
};

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

// Tone-driven inline status colors (dot + text). No more background-pill noise.
const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  paid:     { dot: "bg-emerald-500", text: "text-emerald-700" },
  pending:  { dot: "bg-amber-500",   text: "text-amber-700" },
  failed:   { dot: "bg-red-500",     text: "text-red-700" },
  refunded: { dot: "bg-cyan-500",    text: "text-cyan-700" },
  expired:  { dot: "bg-slate-400",   text: "text-slate-500" },
};

const STATUS_LABEL: Record<string, string> = {
  paid: "สำเร็จ",
  pending: "รอดำเนินการ",
  failed: "ล้มเหลว",
  refunded: "คืนเงินแล้ว",
  expired: "หมดอายุ",
};

/**
 * Trigger a file download without leaving the current page or opening a blank tab.
 * R2 presigned URLs already set Content-Disposition=attachment, so the browser
 * routes this through its native download UI rather than navigating.
 */
function triggerDownload(url: string, suggestedName?: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener noreferrer";
  if (suggestedName) a.download = suggestedName;
  // Some browsers ignore `download` for cross-origin URLs; the server-side
  // Content-Disposition header is the actual enforcement layer.
  document.body.appendChild(a);
  a.click();
  a.remove();
}

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
  usePageTitle("การเรียกเก็บเงิน");
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

  // Phase V — preview modal for tax invoice (inline PDF + download button)
  const [previewInvoice, setPreviewInvoice] = useState<{ runningNumber: string; previewUrl: string; paymentId: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openInvoicePreview = useCallback(async (paymentId: string) => {
    setPreviewLoading(true);
    try {
      // Try existing invoice first; if 404 → auto-issue + open
      let invoice;
      try {
        invoice = await api.get<{ runningNumber: string; previewUrl: string }>(`/admin/billing/payments/${paymentId}/tax-invoice`);
      } catch (e: unknown) {
        if (!(e instanceof ApiError) || e.status !== 404) throw e;
        invoice = await api.post<{ runningNumber: string; previewUrl: string }>(`/admin/billing/payments/${paymentId}/tax-invoice/issue`, {});
        toast("ออกใบเสร็จเรียบร้อย", "success");
      }
      setPreviewInvoice({ runningNumber: invoice.runningNumber, previewUrl: invoice.previewUrl, paymentId });
    } catch (e: unknown) {
      toast(e instanceof ApiError ? e.message : "ไม่สามารถเปิดใบเสร็จได้", "error");
    } finally {
      setPreviewLoading(false);
    }
  }, [toast]);

  const loadRefunds = useCallback(async () => {
    try {
      const rows = await api.get<MyRefundRequest[]>("/admin/refund-requests");
      setRefundRequests(rows);
    } catch { /* ignore — refund flow optional */ }
  }, []);

  async function cancelRefundRequest(id: string) {
    if (!confirm("ยกเลิกคำขอคืนเงินนี้?")) return;
    try {
      await api.post(`/admin/refund-requests/${id}/cancel`, {});
      toast("ยกเลิกคำขอเรียบร้อย", "success");
      await loadRefunds();
    } catch (e: unknown) {
      toast(e instanceof ApiError ? e.message : "ยกเลิกไม่สำเร็จ", "error");
    }
  }

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  useEffect(() => {
    api.get<{ wantsTaxInvoice: boolean; legalName: string } | null>("/admin/billing/billing-profile")
      .then(p => setBillingProfile(p ?? "missing"))
      .catch(() => setBillingProfile("missing"));
  }, []);

  function refundFor(paymentId: string): MyRefundRequest | null {
    // approved → backend marks payment.status="refunded" so we don't reach here
    // cancelled → operator can submit again
    return refundRequests.find(r => r.paymentId === paymentId && (r.status === "pending" || r.status === "rejected")) ?? null;
  }

  const [rejectedDetail, setRejectedDetail] = useState<MyRefundRequest | null>(null);

  // Payment filters
  const [statusFilter, setStatusFilter] = useState<"default" | "all" | "paid" | "refunded" | "failed">("default");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const buildPaymentQuery = useCallback((includePagination: boolean) => {
    const params = new URLSearchParams();
    if (includePagination) {
      params.set("page", String(page));
      params.set("pageSize", "20");
    }
    if (statusFilter !== "default") params.set("status", statusFilter);
    if (fromDate) params.set("from", new Date(fromDate).toISOString());
    if (toDate) params.set("to", new Date(toDate + "T23:59:59").toISOString());
    return params.toString();
  }, [page, statusFilter, fromDate, toDate]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<PaymentHistoryPage>(`/admin/billing/payments?${buildPaymentQuery(true)}`),
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
  }, [buildPaymentQuery, searchParams]);

  function exportCsv() {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
    const url = `${baseUrl}/admin/billing/payments/export.csv?${buildPaymentQuery(false)}`;
    fetch(url, {
      credentials: "include",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("access_token") ?? ""}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("download failed");
        return res.blob();
      })
      .then((blob) => {
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = dlUrl;
        a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
        toast("ดาวน์โหลด CSV เรียบร้อย", "success");
      })
      .catch(() => toast("ดาวน์โหลด CSV ไม่สำเร็จ", "error"));
  }

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
      // Refetch usage so the Plan card reflects 'cancelling' status immediately —
      // user shouldn't have to refresh to see the change.
      api.get<UsageData>("/admin/usage").then(setUsage).catch(() => {});
    } catch (e: unknown) {
      setCancelError(e instanceof ApiError ? e.message : "ไม่สามารถยกเลิกได้ กรุณาลองใหม่");
    } finally {
      setCancelLoading(false);
    }
  };

  const payments = paymentPage?.items ?? [];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const isSub = usage?.hasActiveSubscription ?? false;
  const subStatus = usage?.subscriptionStatus ?? null;
  const isPastDue = subStatus === "past_due";
  const isPending = subStatus === "pending";
  const isCancelling = subStatus === "cancelling" || subStatus === "scheduled_cancel";
  const totalRevenue = paymentPage?.totalRevenue ?? 0;
  const totalCount = paymentPage?.totalCount ?? 0;

  return (
    <div className="p-4 md:p-8 space-y-6">

      <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">การชำระเงิน</h1>

      {successBanner && (
        <Banner
          variant="success"
          title="ชำระเงินสำเร็จ! แพลนของคุณได้รับการอัปเดตแล้ว"
          onDismiss={() => setSuccessBanner(false)}
        />
      )}

      {cancelSuccess && (
        <Banner
          variant="warning"
          icon="info"
          title={cancelSuccess}
          onDismiss={() => setCancelSuccess(null)}
        />
      )}

      {isPastDue && (
        <Banner
          variant="warning"
          title="ชำระเงินไม่สำเร็จ — อัปเดตบัตรภายใน 7 วัน ไม่งั้นกลับเป็น Free Plan"
          action={
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-full font-bold text-xs hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {portalLoading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
              อัปเดตบัตร
            </button>
          }
        />
      )}

      {/* ═══ Plan Hero + Stat — matches /dashboard/usage layout ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Plan + Subscription mgmt */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-(--surface-container-high) shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">แพลนปัจจุบัน</p>
              {isSub && !isPastDue && !isPending && !isCancelling && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              )}
              {isPastDue && <span className="text-[11px] font-semibold text-red-700">Past Due</span>}
              {isPending && <span className="text-[11px] font-semibold text-amber-700">รอยืนยันการจ่าย</span>}
              {isCancelling && <span className="text-[11px] font-semibold text-slate-600">Cancelling</span>}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
              {usage ? (TIER_LABEL[usage.tier] ?? usage.tier) : "—"} <span className="text-on-surface-variant font-bold text-2xl md:text-3xl">Plan</span>
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm md:text-base">
              {isSub && usage?.subscriptionExpiresAt ? (
                <>
                  {isPastDue ? "ต้องอัปเดตบัตรก่อน "
                    : isCancelling ? "ใช้งานได้ถึง "
                    : isPending ? "ครบกำหนด "
                    : "ต่ออายุ "}
                  <strong className="text-on-surface">{formatDate(usage.subscriptionExpiresAt)}</strong>
                </>
              ) : usage?.tier === "free" ? (
                <>เหลือทริปฟรี <strong className="text-on-surface">{usage.remainingTrips}/{usage.tripQuotaLimit}</strong></>
              ) : (
                <>ใช้งานแบบ Pay-as-you-go</>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6">
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

        {/* Right card — context-aware: subscription billing date / credits balance / total spent */}
        <div className="bg-white p-6 rounded-2xl border border-(--surface-container-high) shadow-sm flex flex-col justify-center text-center space-y-3">
          {isSub && usage?.subscriptionExpiresAt ? (
            <>
              <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-(--primary-container)">
                <span className="material-symbols-outlined text-2xl text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-outline">
                  {isCancelling ? "หมดอายุ" : isPastDue ? "ครบกำหนดชำระ" : "ต่ออายุครั้งถัดไป"}
                </p>
                <p className="text-2xl md:text-3xl font-black text-on-surface mt-2">
                  {formatDate(usage.subscriptionExpiresAt)}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {(() => {
                    const days = Math.ceil((new Date(usage.subscriptionExpiresAt).getTime() - Date.now()) / (24 * 3600 * 1000));
                    return days <= 0 ? "หมดอายุแล้ว" : `อีก ${days} วัน`;
                  })()}
                </p>
              </div>
            </>
          ) : usage && usage.creditsRemaining > 0 ? (
            <>
              <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-emerald-50">
                <span className="material-symbols-outlined text-2xl text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-outline">เครดิตคงเหลือ</p>
                <p className="text-3xl md:text-4xl font-black text-on-surface mt-2">{usage.creditsRemaining}</p>
                <p className="text-xs text-on-surface-variant mt-1">จาก {usage.creditsTotal} ทริปที่ซื้อ</p>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </section>

      {/* ═══ Cancel Modal — matches <ConfirmDialog> style + adds reason textarea ═══ */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        blocking={cancelLoading}
        title="ยืนยันยกเลิก Subscription?"
        subtitle={
          <>
            คุณยังใช้งานได้จนถึง <strong className="text-(--on-surface)">{usage?.subscriptionExpiresAt ? formatDate(usage.subscriptionExpiresAt) : "วันหมดอายุปัจจุบัน"}</strong> หลังจากนั้นบัญชีจะปรับเป็น Free Plan โดยอัตโนมัติ
          </>
        }
        footer={
          <div className="flex gap-3">
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
        }
      >
        <div className="px-6 py-5 space-y-4">
          {tripCounts && tripCounts.totalNotArchived > tripCounts.freeLimit && (
            <Banner variant="warning" title="⚠️ หลังหมดอายุ คุณจะ publish ทริปเพิ่มไม่ได้">
              <p className="text-xs text-amber-800 mt-1">
                ตอนนี้คุณมี <strong>{tripCounts.publishedCount}</strong> ทริปที่ publish, <strong>{tripCounts.draftCount}</strong> ร่าง — Free plan จำกัด {tripCounts.freeLimit} ทริปทั้งหมด
              </p>
              <p className="text-xs text-amber-800 mt-1">
                ทริปที่ publish ไปแล้ว → ใช้งานต่อได้ปกติ. ทริปร่าง → ต้องซื้อ credits ก่อน publish
              </p>
            </Banner>
          )}
          <div>
            <label className="text-xs font-semibold text-(--on-surface-variant) block mb-1.5">เหตุผล (ไม่บังคับ)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              maxLength={512}
              rows={3}
              placeholder="ช่วยบอกเราว่าทำไมคุณยกเลิก..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 focus:bg-white resize-none transition-all"
            />
          </div>
          {cancelError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              {cancelError}
            </div>
          )}
        </div>
      </Modal>

      {/* Suppress informational banner when an urgent banner (past_due) is active —
          past_due requires user action; billing-profile is just a recommendation. */}
      {billingProfile === "missing" && !isPastDue && (
        <Banner
          variant="info"
          icon="description"
          title="ต้องการใบกำกับภาษี?"
          action={
            <Link href="/dashboard/billing/profile" className="inline-flex items-center gap-1 px-4 py-2 bg-(--primary) text-white rounded-full text-xs font-bold hover:opacity-90">
              ตั้งค่า
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          }
        >
          ระบบออกใบเสร็จให้ทุกการชำระเงินอยู่แล้ว — ตั้งข้อมูลภาษี (TIN/ที่อยู่) เพื่อให้เป็นใบกำกับภาษีที่นำไปใช้เครดิตภาษีได้
        </Banner>
      )}

      {/* ═══ Payment Table ═══ */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <SectionHeader title="รายการชำระเงิน" subtitle="ประวัติการชำระเงินทั้งหมดของบัญชีคุณ" />
          <button
            type="button"
            onClick={exportCsv}
            disabled={!paymentPage || paymentPage.totalCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">download</span>
            ดาวน์โหลด CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant p-3 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 outline-none"
            >
              <option value="default">สำเร็จ + คืนเงินแล้ว</option>
              <option value="all">ทุกสถานะ</option>
              <option value="paid">สำเร็จเท่านั้น</option>
              <option value="refunded">คืนเงินแล้ว</option>
              <option value="failed">ล้มเหลว</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">ถึงวันที่</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
          {payments.length === 0 ? (
            (statusFilter !== "default" || fromDate || toDate) ? (
              <EmptyState
                icon="filter_alt_off"
                title="ไม่พบรายการตามเงื่อนไขที่เลือก"
                description="ลองเปลี่ยนสถานะหรือช่วงวันที่ดู"
              />
            ) : (
              <EmptyState
                icon="receipt_long"
                title="ยังไม่มีประวัติการชำระเงิน"
                description="เมื่อคุณซื้อทริปหรือสมัคร Subscription รายการจะแสดงที่นี่"
                actionLabel="อัปเกรดแพลน"
                actionHref="/dashboard/upgrade"
              />
            )
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
                        {(() => {
                          const s = STATUS_STYLE[tx.status] ?? { dot: "bg-slate-400", text: "text-slate-500" };
                          return (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {STATUS_LABEL[tx.status] ?? tx.status}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === "paid" ? (
                          <div className="inline-flex items-center gap-4 justify-end">
                            <button
                              onClick={() => openInvoicePreview(tx.id)}
                              disabled={previewLoading}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-(--primary) hover:underline cursor-pointer disabled:opacity-50"
                              title="ดู / ดาวน์โหลด ใบเสร็จ — ใบกำกับภาษี"
                            >
                              <span className="material-symbols-outlined text-[16px] leading-none">receipt_long</span>
                              <span className="leading-none">ใบเสร็จ</span>
                            </button>
                            {(() => {
                              const r = refundFor(tx.id);
                              if (r?.status === "pending") {
                                return (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600" title="รอ staff review">
                                    <span className="material-symbols-outlined text-[16px] leading-none">hourglass_empty</span>
                                    <span className="leading-none">รอตรวจ</span>
                                  </span>
                                );
                              }
                              if (r?.status === "rejected") {
                                return (
                                  <button
                                    onClick={() => setRejectedDetail(r)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                                    title="ดูเหตุผลที่ปฏิเสธ"
                                  >
                                    <span className="material-symbols-outlined text-[16px] leading-none">info</span>
                                    <span className="leading-none">ปฏิเสธ</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => setRefundTarget(tx)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-(--primary) hover:underline cursor-pointer"
                                  title="ขอเงินคืน (ผ่าน staff review)"
                                >
                                  <span className="material-symbols-outlined text-[16px] leading-none">currency_exchange</span>
                                  <span className="leading-none">ขอคืนเงิน</span>
                                </button>
                              );
                            })()}
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

      {/* ═══ Refund Requests History (Phase A + U) ═══ */}
      {refundRequests.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="ประวัติคำขอคืนเงิน" />
          <div className="space-y-3">
            {refundRequests.map((r) => {
              const style = REFUND_STATUS[r.status];
              const isPartial = r.approvedRefundAmount !== null && r.approvedRefundAmount < r.amount;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-outline-variant p-4 md:p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          r.status === "approved" ? "text-emerald-700"
                            : r.status === "rejected" ? "text-rose-700"
                            : r.status === "cancelled" ? "text-slate-500"
                            : "text-amber-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            r.status === "approved" ? "bg-emerald-500"
                              : r.status === "rejected" ? "bg-rose-500"
                              : r.status === "cancelled" ? "bg-slate-400"
                              : "bg-amber-500"
                          }`} />
                          {style.label}
                        </span>
                        <span className="text-xs text-on-surface-variant">· {formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-sm font-bold text-on-surface mt-1">
                        {PLAN_LABEL[r.planCode] ?? r.planCode}
                        <span className="text-on-surface-variant font-medium"> · ฿{r.amount.toFixed(2)}</span>
                        {isPartial && (
                          <span className="ml-2 text-xs text-emerald-700 font-bold">
                            → คืน ฿{(r.approvedRefundAmount ?? 0).toFixed(2)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2"><strong>เหตุผล:</strong> {r.reason}</p>
                      {r.resolutionNotes && (
                        <p className="text-xs text-slate-500 mt-1 italic line-clamp-2"><strong>ทีมงาน:</strong> {r.resolutionNotes}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => cancelRefundRequest(r.id)}
                        className="shrink-0 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                        title="ยกเลิกคำขอ (เฉพาะที่ยังรอ review)"
                      >
                        ยกเลิกคำขอ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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

      {previewInvoice && (
        <InvoicePreviewModal
          runningNumber={previewInvoice.runningNumber}
          previewUrl={previewInvoice.previewUrl}
          paymentId={previewInvoice.paymentId}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {rejectedDetail && (
        <Modal
          open
          onClose={() => setRejectedDetail(null)}
          size="md"
          title="คำขอถูกปฏิเสธ"
          subtitle={
            <>
              {PLAN_LABEL[rejectedDetail.planCode] ?? rejectedDetail.planCode} · ฿{rejectedDetail.amount.toFixed(2)}
            </>
          }
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setRejectedDetail(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                ปิด
              </button>
              <Link
                href="/dashboard/feedback?type=billing"
                onClick={() => setRejectedDetail(null)}
                className="flex-1 py-3 rounded-xl bg-(--primary) text-white text-sm font-bold hover:brightness-110 inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                ติดต่อทีมงาน
              </Link>
            </div>
          }
        >
          <div className="px-6 py-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">เหตุผลจากทีมงาน</p>
              <p className="text-sm text-rose-800 whitespace-pre-wrap">
                {rejectedDetail.resolutionNotes ?? "ไม่ได้ระบุเหตุผล"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">เหตุผลที่คุณส่ง</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{rejectedDetail.reason}</p>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3">
              <span>ส่งเมื่อ {formatDate(rejectedDetail.createdAt)}</span>
              {rejectedDetail.resolvedAt && (
                <span>ปฏิเสธเมื่อ {formatDate(rejectedDetail.resolvedAt)}</span>
              )}
            </div>
          </div>
        </Modal>
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
    <Modal
      open
      onClose={onClose}
      size="md"
      blocking={submitting}
      title="ขอเงินคืน"
      subtitle={
        <>
          <strong>฿{payment.amount.toFixed(2)}</strong> · {PLAN_LABEL[payment.planCode] ?? payment.planCode}
          {payment.quantity > 1 && ` ×${payment.quantity}`}
        </>
      }
      footer={
        <div className="flex gap-2">
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
      }
    >
      <div className="px-6 py-5 space-y-4">
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
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 text-xs">
            <p className="font-bold text-amber-900 inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base">pie_chart</span>
              คืนตามสัดส่วนที่ใช้ไป
            </p>
            <p className="text-amber-800">
              ใช้เครดิตไป {verdict.creditsUsed}/{verdict.creditsTotal} → คืนได้ <strong>฿{verdict.refundableAmount.toFixed(2)}</strong> จาก ฿{verdict.totalAmount.toFixed(2)}
            </p>
            <p className="text-[11px] text-amber-700/90 leading-relaxed">
              ระบบจะคืนเฉพาะส่วนของเครดิตที่ <strong>ยังไม่ได้ใช้</strong> เท่านั้น ส่วนที่ใช้ไปแล้วถือว่าใช้บริการเรียบร้อย
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
                <Link href="/dashboard/refund-policy" className="text-(--primary) font-bold hover:underline">นโยบายคืนเงินฉบับเต็ม</Link>
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
        )}
      </div>
    </Modal>
  );
}

interface InvoicePreviewModalProps {
  runningNumber: string;
  previewUrl: string;
  paymentId: string;
  onClose: () => void;
}

function InvoicePreviewModal({ runningNumber, previewUrl, paymentId, onClose }: InvoicePreviewModalProps): React.ReactNode {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    try {
      // Re-fetch with download=true → server returns presigned URL with attachment header
      const r = await api.get<{ downloadUrl: string }>(`/admin/billing/payments/${paymentId}/tax-invoice?download=true`);
      triggerDownload(r.downloadUrl, `${runningNumber}.pdf`);
      toast("กำลังดาวน์โหลดไฟล์", "success");
    } catch (e: unknown) {
      toast(e instanceof ApiError ? e.message : "ดาวน์โหลดไม่สำเร็จ", "error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="ใบเสร็จ / ใบกำกับภาษี"
      subtitle={<span className="font-mono">{runningNumber}</span>}
      headerActions={
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-(--primary) text-white rounded-full font-bold text-xs hover:opacity-90 disabled:opacity-60 cursor-pointer transition-all"
        >
          {downloading ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">download</span>
          )}
          ดาวน์โหลด PDF
        </button>
      }
      className="h-[90vh]"
    >
      <iframe
        src={previewUrl}
        title={`Tax invoice ${runningNumber}`}
        className="w-full h-full border-0 bg-(--surface-container-low)"
      />
    </Modal>
  );
}

export default function BillingPage(): React.ReactNode {
  return (
    <Suspense fallback={<LoadingState />}>
      <BillingContent />
    </Suspense>
  );
}
