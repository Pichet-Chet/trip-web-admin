"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type PlanCode = "per_trip" | "pack_5" | "subscription";

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

interface Plan {
  code: PlanCode;
  name: string;          // "จ่ายต่อทริป", "แพ็ค 5 ทริป", "Subscription"
  description: string;   // "Perfect for ..."
  price: number;
  unit: string;          // "/ทริป", "/5 ทริป", "/เดือน"
  features: string[];
  badge: string | null;  // "RECOMMENDED" / "ประหยัดสุด"
  icon: string;          // material symbol
}

interface UsageData {
  tier: string;
  hasActiveSubscription: boolean;
}

const PLAN_META: Record<PlanCode, Omit<Plan, "code" | "price">> = {
  per_trip: {
    name: "จ่ายต่อทริป",
    description: "เหมาะกับมือใหม่ จ่ายเฉพาะทริปที่สร้างเพิ่ม",
    unit: "/ ทริป",
    badge: "แนะนำ",
    icon: "rocket_launch",
    features: ["ทุกฟีเจอร์ไม่จำกัด", "ผู้ติดตามไม่จำกัด", "ไม่มี Powered by badge", "ไม่มีวันหมดอายุ"],
  },
  pack_5: {
    name: "แพ็ค 5 ทริป",
    description: "เหมาะกับคนจัดบ่อย — ประหยัดกว่าซื้อแยก",
    unit: "/ 5 ทริป",
    badge: "ประหยัดสุด",
    icon: "redeem",
    features: ["5 ทริปเครดิต (ฉลี่ย ฿49.8/ทริป)", "ทุกฟีเจอร์เหมือนจ่ายต่อทริป", "ไม่มีวันหมดอายุ"],
  },
  subscription: {
    name: "Subscription รายเดือน",
    description: "เหมาะกับธุรกิจที่จัดทริปไม่จำกัด",
    unit: "/ เดือน",
    badge: null,
    icon: "workspace_premium",
    features: ["ทริปไม่จำกัด", "ผู้ติดตามไม่จำกัด", "Priority Support", "ยกเลิกได้ทุกเมื่อ"],
  },
};

function buildPlans(catalog: PlanCatalogItem[]): Plan[] {
  return catalog
    .filter(c => c.code in PLAN_META)
    .map(c => ({
      code: c.code as PlanCode,
      price: c.price,
      ...PLAN_META[c.code as PlanCode],
    }))
    .sort((a, b) => {
      const order: PlanCode[] = ["per_trip", "pack_5", "subscription"];
      return order.indexOf(a.code) - order.indexOf(b.code);
    });
}

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

function UpgradeContent(): React.ReactNode {
  const searchParams = useSearchParams();
  const raw = searchParams.get("plan");
  const validCodes: PlanCode[] = ["per_trip", "pack_5", "subscription"];
  const defaultPlan: PlanCode = validCodes.includes(raw as PlanCode) ? (raw as PlanCode) : "per_trip";
  const [selected, setSelected] = useState<PlanCode>(defaultPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<PlanCatalogItem[]>("/admin/billing/plans"),
      api.get<UsageData>("/admin/usage").catch(() => null),
    ]).then(([catalog, u]) => {
      setPlans(buildPlans(catalog));
      if (u) setUsage(u);
    }).catch((e: unknown) => setPlansError(e instanceof ApiError ? e.message : "โหลดข้อมูลแพลนไม่สำเร็จ"));
  }, []);

  const plan = plans?.find((p) => p.code === selected);
  const currentTier = usage?.tier ?? "free";

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const result = await api.post<CheckoutResponse>("/admin/billing/checkout", {
        planCode: selected,
        successUrl: `${origin}/dashboard/billing?success=1`,
        cancelUrl: `${origin}/dashboard/upgrade`,
      });
      window.location.href = result.url;
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  };

  if (plansError) {
    return (
      <div className="p-8 text-center space-y-3">
        <span className="material-symbols-outlined text-4xl text-red-400">error</span>
        <p className="text-on-surface-variant text-sm">{plansError}</p>
        <button onClick={() => window.location.reload()} className="text-sm text-primary font-semibold cursor-pointer">ลองใหม่</button>
      </div>
    );
  }

  if (!plans || !plan) {
    return (
      <div className="p-8 flex items-center justify-center min-h-60">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <Link href="/dashboard/usage" className="text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1 mb-4 cursor-pointer">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับ
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">อัปเกรดแพลน</h1>
        <p className="text-on-surface-variant mt-2 text-base md:text-lg">ปลดล็อกฟีเจอร์ระดับมืออาชีพ — ขยายธุรกิจทัวร์ของคุณ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* ═══ Plan Selection (Left 7/12) ═══ */}
        <div className="lg:col-span-7 space-y-4">
          {/* Free / Current plan card */}
          <div className="relative p-6 rounded-xl border-2 border-outline-variant bg-(--surface-container-lowest) flex items-start gap-4">
            <div className="mt-1 p-2 bg-(--surface-container-high) rounded-lg flex-shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-on-surface">Free</h3>
                {currentTier === "free" && (
                  <span className="px-3 py-1 bg-(--surface-container-high) text-on-surface-variant text-xs font-bold rounded-full">
                    แพลนปัจจุบัน
                  </span>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mt-1">เริ่มต้นใช้งาน — เหมาะกับมือใหม่</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  3 ทริปฟรี ต่อบัญชี
                </li>
                <li className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-green-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Basic Support
                </li>
              </ul>
            </div>
          </div>

          {/* Selectable plans */}
          {plans.map((p) => {
            const isSelected = selected === p.code;
            const isCurrent = currentTier === p.code;
            return (
              <button
                key={p.code}
                onClick={() => setSelected(p.code)}
                className={`relative w-full text-left p-6 rounded-xl flex items-start gap-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-2 border-(--primary) bg-white shadow-xl ring-4 ring-(--primary)/10"
                    : "border-2 border-outline-variant bg-(--surface-container-lowest) hover:border-outline"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 bg-(--primary) text-white text-[10px] font-bold tracking-wider uppercase rounded-full shadow-md">
                    {p.badge}
                  </span>
                )}
                <div className={`mt-1 p-2 rounded-lg flex-shrink-0 ${isSelected ? "bg-(--primary-container) text-(--primary)" : "bg-(--surface-container-high) text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined">{p.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2 flex-wrap">
                    <h3 className={`text-xl font-bold ${isSelected ? "text-(--primary)" : "text-on-surface"}`}>{p.name}</h3>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-on-surface">฿{p.price.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
                      <span className="text-on-surface-variant text-sm ml-1">{p.unit}</span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">{p.description}</p>
                  <ul className={`mt-4 grid gap-y-2 ${isSelected ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm font-medium text-on-surface-variant">
                        <span className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${isSelected ? "text-(--primary)" : "text-green-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-(--primary)">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      แพลนปัจจุบันของคุณ
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ═══ Order Summary (Right 5/12) ═══ */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-lg border border-(--surface-container-high) overflow-hidden sticky top-24">
            {/* Order Summary */}
            <div className="p-6 bg-(--surface-container-lowest) border-b border-(--surface-container)">
              <h3 className="text-lg font-bold text-on-surface mb-4">สรุปคำสั่งซื้อ</h3>
              <div className="flex justify-between mb-2">
                <span className="text-on-surface-variant text-sm">{plan.name}</span>
                <span className="font-bold text-on-surface">฿{plan.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-outline mb-4">
                <span>ค่าธรรมเนียม</span>
                <span>฿0.00</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-(--surface-container) text-xl">
                <span className="font-bold text-on-surface">รวม</span>
                <span className="font-extrabold text-(--primary)">฿{plan.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-on-surface">ชำระเงินปลอดภัย</h3>
                <div className="flex gap-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">VISA</span>
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded">MC</span>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                ระบบจะนำคุณไปหน้าชำระเงินของ Stripe — ข้อมูลบัตรถูกเก็บอย่างปลอดภัยโดย Stripe เท่านั้น
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 bg-(--primary) hover:bg-(--surface-tint) text-white font-bold rounded-xl shadow-lg shadow-(--primary)/20 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    <span>กำลังเชื่อมต่อ...</span>
                  </>
                ) : (
                  <>
                    <span>ชำระ ฿{plan.price.toFixed(2)}</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-outline">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  SSL 256-bit
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Stripe Verified
                </span>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div className="mt-6 p-4 rounded-xl bg-(--secondary-fixed)/30 border border-(--secondary-fixed)">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-(--secondary) flex-shrink-0">info</span>
              <p className="text-sm text-(--secondary)">
                คุณสามารถยกเลิกหรือเปลี่ยนแพลนได้ตลอดเวลาผ่านหน้า Billing — เครดิตที่ซื้อแล้วไม่มีวันหมดอายุ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage(): React.ReactNode {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>}>
      <UpgradeContent />
    </Suspense>
  );
}
