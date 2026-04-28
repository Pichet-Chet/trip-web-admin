"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { SectionHeader } from "@/components/shared";

interface UsageData {
  tier: string;
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  publishedCount: number;
  draftCount: number;
  maxDateChanges: number;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  creditsRemainingBySource: Record<string, number>;
  hasActiveSubscription: boolean;
  subscriptionExpiresAt: string | null;
  subscriptionStatus: string | null;
}

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  per_trip: "จ่ายต่อทริป",
  pack_5: "แพ็ค 5 ทริป",
  subscription: "Subscription",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

interface PlanCatalogItem {
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  tripLimit: number | null;
  isSubscription: boolean;
  sortOrder: number;
}

const TIER_FALLBACK: Record<string, number> = {
  per_trip: 49,
  pack_5: 249,
  subscription: 299,
};

function priceFor(catalog: PlanCatalogItem[] | null, code: string): number {
  if (!catalog) return TIER_FALLBACK[code] ?? 0;
  return catalog.find((p) => p.code === code)?.price ?? TIER_FALLBACK[code] ?? 0;
}

export default function UsagePage(): React.ReactNode {
  const [data, setData] = useState<UsageData | null>(null);
  const [catalog, setCatalog] = useState<PlanCatalogItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<UsageData>("/admin/usage"),
      api.get<PlanCatalogItem[]>("/admin/billing/plans").catch(() => null),
    ])
      .then(([usage, plans]) => {
        setData(usage);
        setCatalog(plans);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-60">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-slate-500 text-sm">{error ?? "ไม่สามารถโหลดข้อมูลได้"}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary font-semibold cursor-pointer">ลองใหม่</button>
      </div>
    );
  }

  const isFree = data.tier === "free";
  const isSub = data.hasActiveSubscription;
  const hasCredits = data.creditsRemaining > 0;

  // Effective trip capacity
  const capacityLabel = isSub
    ? "Subscription ใช้งานได้ไม่จำกัด"
    : isFree
    ? `ฟรี ${data.remainingTrips} ทริปที่เหลือ + เครดิต ${data.creditsRemaining} ทริป`
    : `เครดิตที่เหลือ ${data.creditsRemaining} ทริป`;

  const freeUsedPct = Math.min(100, (data.tripQuotaUsed / data.tripQuotaLimit) * 100);
  const circumference = 364.4;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header — clean professional style matching mockup */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">การใช้งานของคุณ</h1>
        <p className="text-on-surface-variant mt-2 text-base md:text-lg">ติดตามโควต้าทริป + เครดิต และอัปเกรดแพลนเมื่อต้องการ</p>
      </div>

      {/* ═══ Hero — softer rounded-3xl cards matching /dashboard ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Status */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-(--outline-variant)/50 shadow-sm p-6 md:p-8 flex flex-col justify-between min-h-60 hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <span className="px-3 py-1 bg-(--surface-container-high) text-on-surface-variant text-[10px] font-bold tracking-widest uppercase rounded-full">
                {TIER_LABEL[data.tier] ?? data.tier}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface leading-tight">
              สร้างแล้ว {data.tripQuotaUsed} <span className="text-on-surface-variant font-bold text-2xl md:text-3xl">ทริป</span>
            </h2>
            <p className="text-on-surface-variant mt-2 text-sm md:text-base">{capacityLabel}</p>
            {isSub && data.subscriptionExpiresAt && (
              <p className="text-xs text-on-surface-variant mt-1">ต่ออายุ {formatDate(data.subscriptionExpiresAt)}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
            {isSub ? (
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) text-white rounded-full font-bold text-sm shadow-lg shadow-(--primary)/20 hover:shadow-xl hover:shadow-(--primary)/30 transition-all"
              >
                <span className="material-symbols-outlined text-base">workspace_premium</span>
                จัดการ Subscription
              </Link>
            ) : (
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) text-white rounded-full font-bold text-sm shadow-lg shadow-(--primary)/20 hover:shadow-xl hover:shadow-(--primary)/30 transition-all"
              >
                <span className="material-symbols-outlined text-base">arrow_upward</span>
                {isFree ? "อัปเกรดแพลน" : "ซื้อเครดิตเพิ่ม"}
              </Link>
            )}
            {!isSub && <p className="text-xs text-outline">เริ่มต้น ฿{priceFor(catalog, "per_trip").toLocaleString("th-TH")}/ทริป</p>}
          </div>
        </div>

        {/* Gauge */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-(--outline-variant)/50 shadow-sm flex flex-col justify-center items-center text-center space-y-4 hover:shadow-md transition-shadow">
          {isSub ? (
            <>
              <div className="w-32 h-32 flex items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">Subscription</h3>
                <p className="text-sm text-on-surface-variant">ใช้งานไม่จำกัด</p>
                {data.subscriptionExpiresAt && (
                  <p className="text-xs text-on-surface-variant mt-1">ถึง {formatDate(data.subscriptionExpiresAt)}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="var(--surface-container)" strokeWidth="8" />
                  <circle cx="64" cy="64" r="58" fill="transparent" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - freeUsedPct / 100)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-on-surface">{data.tripQuotaUsed}/{data.tripQuotaLimit}</span>
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant">ทริปฟรี</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">ทริปฟรีที่เหลือ</h3>
                <p className="text-sm text-on-surface-variant">เหลืออีก {data.remainingTrips} ทริป</p>
                {hasCredits && (
                  <p className="text-xs text-primary font-semibold mt-1">+ เครดิต {data.creditsRemaining} ทริป</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ Stats Row — pastel icon tiles, softer feel ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "กำลังใช้งาน", value: data.publishedCount, icon: "public", bg: "from-emerald-100 to-emerald-50", color: "text-emerald-600" },
          { label: "ร่าง", value: data.draftCount, icon: "draft", bg: "from-slate-100 to-slate-50", color: "text-slate-500" },
          { label: "เครดิตที่ซื้อ", value: data.creditsTotal, icon: "toll", bg: "from-violet-100 to-violet-50", color: "text-violet-600" },
          { label: "เครดิตคงเหลือ", value: isSub ? "∞" : data.creditsRemaining, icon: "savings", bg: "from-blue-100 to-blue-50", color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-3xl border border-(--outline-variant)/50 p-5 md:p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">{s.label}</p>
              <p className="text-2xl md:text-3xl font-black text-on-surface mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ Credits-by-source breakdown (E9) ═══ */}
      {!isSub && data.creditsRemaining > 0 && Object.keys(data.creditsRemainingBySource ?? {}).length > 0 && (
        <section className="bg-white rounded-3xl border border-(--outline-variant)/50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">account_tree</span>
            <h3 className="text-sm font-bold text-on-surface">เครดิตคงเหลือแยกตามแหล่งซื้อ</h3>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">ระบบจะใช้เครดิตจากการซื้อรอบเก่าก่อน (FIFO) — ใช้ได้ตลอด ไม่มีวันหมดอายุ</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(data.creditsRemainingBySource).map(([source, count]) => {
              const label = source === "per_trip" ? "ซื้อต่อทริป"
                : source === "pack_5" ? "ซื้อแพ็ค 5"
                : source;
              const color = source === "pack_5" ? "bg-violet-50 text-violet-700 border-violet-200"
                : "bg-sky-50 text-sky-700 border-sky-200";
              return (
                <div key={source} className={`rounded-xl border ${color} p-3`}>
                  <p className="text-xs font-semibold opacity-80">{label}</p>
                  <p className="text-2xl font-black mt-1">{count}<span className="text-xs font-medium ml-1 opacity-70">ทริป</span></p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ Plans — same design language as /dashboard/upgrade ═══ */}
      <section className="space-y-6">
        <SectionHeader title="เพิ่มความสามารถ" subtitle="เลือกแพลนที่เหมาะกับคุณ" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* ── Free ──────────────────────────────────────────────── */}
          <div className={`relative bg-white rounded-3xl border ${data.tier === "free" ? "border-(--outline)" : "border-(--outline-variant)/50"} p-6 flex flex-col hover:shadow-md transition-shadow`}>
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-(--surface-container-high) rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-on-surface">เริ่มต้น</h3>
                  {data.tier === "free" && (
                    <span className="px-2 py-0.5 bg-(--surface-container-high) text-on-surface-variant text-[10px] font-bold tracking-wider uppercase rounded-full">
                      ปัจจุบัน
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-on-surface">ฟรี</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">3 ทริปแรก ไม่เสียค่าใช้จ่าย</p>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {["3 ทริปฟรี ต่อบัญชี", "ผู้ติดตาม 30 คน/ทริป", "แจ้งเตือน LINE + Web Push"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500 text-base mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-on-surface-variant/60">
                <span className="material-symbols-outlined text-outline text-base mt-0.5 flex-shrink-0">cancel</span>
                <span>มี &quot;Powered by&quot; badge</span>
              </li>
            </ul>
          </div>

          {/* ── Per Trip (RECOMMENDED) ───────────────────────────── */}
          <div className="relative bg-white rounded-3xl border-2 border-(--primary) shadow-xl ring-4 ring-(--primary)/10 p-6 flex flex-col">
            <span className="absolute -top-3 right-6 px-3 py-1 bg-(--primary) text-white text-[10px] font-bold tracking-widest uppercase rounded-full shadow-md">
              แนะนำ
            </span>
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-(--primary-container) rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-(--primary)">rocket_launch</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-(--primary)">จ่ายต่อทริป</h3>
                  {data.tier === "per_trip" && (
                    <span className="px-2 py-0.5 bg-(--primary-container) text-(--primary) text-[10px] font-bold tracking-wider uppercase rounded-full">
                      ปัจจุบัน
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-on-surface">฿{priceFor(catalog, "per_trip").toLocaleString("th-TH")}</span>
                  <span className="text-sm text-on-surface-variant ml-1">/ ทริป</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">จ่ายเฉพาะทริปที่สร้างเพิ่ม</p>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {["ทุกฟีเจอร์ไม่จำกัด", "ผู้ติดตามไม่จำกัด", "แก้ไขไม่จำกัด", "ไม่มี Powered by badge"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm font-medium text-on-surface-variant">
                  <span className="material-symbols-outlined text-(--primary) text-base mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/upgrade?plan=per_trip"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 bg-(--primary) text-white rounded-xl font-bold text-sm shadow-lg shadow-(--primary)/20 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              ซื้อทริป
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          {/* ── Pack 5 ───────────────────────────────────────────── */}
          <div className={`relative bg-white rounded-3xl border ${data.tier === "pack_5" ? "border-(--outline)" : "border-(--outline-variant)/50"} p-6 flex flex-col hover:shadow-md transition-shadow`}>
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2 bg-(--surface-container-high) rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant">redeem</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-on-surface">แพ็ค 5 ทริป</h3>
                  {data.tier === "pack_5" && (
                    <span className="px-2 py-0.5 bg-(--surface-container-high) text-on-surface-variant text-[10px] font-bold tracking-wider uppercase rounded-full">
                      ปัจจุบัน
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-black text-on-surface">฿{priceFor(catalog, "pack_5").toLocaleString("th-TH")}</span>
                  <span className="text-sm text-on-surface-variant ml-1">/ 5 ทริป</span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  ประหยัด ~฿{Math.max(0, priceFor(catalog, "per_trip") * 5 - priceFor(catalog, "pack_5")).toLocaleString("th-TH")} เหมาะกับคนจัดบ่อย
                </p>
              </div>
            </div>
            <ul className="space-y-2.5 flex-1">
              {[`5 ทริป (เฉลี่ย ฿${(priceFor(catalog, "pack_5") / 5).toFixed(2)}/ทริป)`, "ทุกฟีเจอร์เหมือนจ่ายต่อทริป", "ไม่มีวันหมดอายุ"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500 text-base mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/upgrade?plan=pack_5"
              className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3 bg-white border border-(--outline-variant) text-on-surface rounded-xl font-bold text-sm hover:bg-(--surface-container-low) active:scale-[0.98] transition-all"
            >
              ซื้อแพ็ค
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Subscription upsell — full-width below */}
        {data.tier !== "subscription" && (
          <Link
            href="/dashboard/upgrade?plan=subscription"
            className="block bg-gradient-to-br from-(--primary-container) to-(--primary-container)/40 rounded-3xl p-5 md:p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-on-surface">Subscription รายเดือน</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">ทริปไม่จำกัด • ฿{priceFor(catalog, "subscription").toLocaleString("th-TH")}/เดือน • ยกเลิกได้ทุกเมื่อ</p>
              </div>
              <span className="material-symbols-outlined text-(--primary) group-hover:translate-x-1 transition-transform flex-shrink-0">arrow_forward</span>
            </div>
          </Link>
        )}
      </section>

    </div>
  );
}
