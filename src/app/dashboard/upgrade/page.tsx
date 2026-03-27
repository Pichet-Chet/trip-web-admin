"use client";

import { useState } from "react";
import Link from "next/link";
import { FormInput } from "@/components/shared";

type PlanId = "free" | "pro" | "business";

const plans: { id: PlanId; name: string; price: string; priceNum: number; desc: string; features: string[]; badge?: string }[] = [
  { id: "free", name: "Free", price: "฿0", priceNum: 0, desc: "สำหรับไกด์อิสระที่เริ่มต้นใช้งาน", features: ["3 ทริป", "ผู้ติดตาม 30 คน/ทริป", "แจ้งเตือน 10 ครั้ง/เดือน", "แก้ไขหลัง publish 2 ครั้ง/ทริป"], badge: "แพลนปัจจุบัน" },
  { id: "pro", name: "Pro", price: "฿299", priceNum: 299, desc: "สำหรับบริษัททัวร์ที่กำลังเติบโต", features: ["30 ทริป", "ผู้ติดตาม 100 คน/ทริป", "แจ้งเตือน 200 ครั้ง/เดือน", "แก้ไขไม่จำกัด", "Custom Branding", "Analytics Dashboard"], badge: "แนะนำ" },
  { id: "business", name: "Business", price: "฿599", priceNum: 599, desc: "สำหรับบริษัททัวร์ขนาดใหญ่", features: ["ทริปไม่จำกัด", "ผู้ติดตามไม่จำกัด", "แจ้งเตือนไม่จำกัด", "White-label (ซ่อน badge)", "API Access", "ผู้จัดการบัญชีเฉพาะ"] },
];

export default function UpgradePage(): React.ReactNode {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const selected = plans.find((p) => p.id === selectedPlan)!;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-8">
        <Link href="/dashboard/usage" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 mr-4">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-slate-900">อัปเกรดแพลน</h1>
      </header>

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">เลือกแพลนที่เหมาะกับคุณ</h1>
          <p className="text-slate-500 mt-2">ปลดล็อกฟีเจอร์ระดับมืออาชีพเพื่อขยายธุรกิจทัวร์ของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Plan Selection (7 cols) ── */}
          <div className="lg:col-span-7 space-y-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === "free";
              const isSelected = plan.id === selectedPlan;
              return (
                <button
                  key={plan.id}
                  onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                  className={`relative w-full text-left p-6 rounded-xl border-2 flex items-start gap-4 transition-all ${
                    isSelected
                      ? "border-blue-600 bg-white shadow-xl ring-4 ring-blue-600/10"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 right-6 px-3 py-1 text-xs font-bold rounded-full ${
                      plan.badge === "แนะนำ" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`text-xl font-bold ${isSelected ? "text-blue-600" : "text-slate-900"}`}>{plan.name}</h3>
                      {plan.priceNum > 0 && (
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                          <span className="text-slate-400 text-sm">/เดือน</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{plan.desc}</p>
                    <ul className={`mt-4 ${plan.features.length > 4 ? "grid grid-cols-2 gap-y-2" : "space-y-2"}`}>
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center text-sm">
                          <span className={`material-symbols-outlined text-sm mr-2 ${isSelected ? "text-blue-600" : "text-slate-400"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Payment (5 cols) ── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Order Summary */}
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-4">สรุปคำสั่งซื้อ</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">{selected.name} Plan (รายเดือน)</span>
                  <span className="font-bold">{selected.priceNum.toFixed(2)} THB</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400 mb-4">
                  <span>ค่าธรรมเนียม</span>
                  <span>0.00 THB</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xl">
                  <span className="font-bold text-slate-900">รวมทั้งหมด</span>
                  <span className="font-extrabold text-blue-600">{selected.priceNum.toFixed(2)} THB</span>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900">ชำระเงิน</h3>
                </div>

                {/* PromptPay Section */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="material-symbols-outlined text-lg">qr_code_2</span>
                    PromptPay QR
                  </div>
                  <div className="w-40 h-40 mx-auto bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                    <span className="text-slate-300 text-sm">QR Code</span>
                  </div>
                  <p className="text-xs text-slate-400">สแกนด้วยแอปธนาคาร</p>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="mx-4 text-xs text-slate-400">หรือจ่ายด้วยบัตร</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                {/* Card Form */}
                <div className="space-y-4">
                  <FormInput label="หมายเลขบัตร" placeholder="xxxx xxxx xxxx xxxx" icon="credit_card" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput label="วันหมดอายุ" placeholder="MM/YY" />
                    <FormInput label="CVC" placeholder="•••" />
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6">
                  อัปเกรดเลย
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>

                {/* Trust */}
                <div className="flex items-center justify-center gap-4 pt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    SSL 256-bit
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified_user</span>
                    Omise Verified
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
                <p className="text-sm text-blue-700">คุณสามารถยกเลิกหรือเปลี่ยนแพลนได้ทุกเมื่อ อาจมีภาษีเพิ่มเติมตามพื้นที่ของคุณ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
