"use client";

import { useState } from "react";
import Link from "next/link";
import { FormInput, useToast } from "@/components/shared";

type PackId = "single" | "pack5" | "pack10";

const packs: { id: PackId; trips: number; price: number; perTrip: number; saving: string | null }[] = [
  { id: "single", trips: 1, price: 49, perTrip: 49, saving: null },
  { id: "pack5", trips: 5, price: 199, perTrip: 39.8, saving: "ประหยัด 19%" },
  { id: "pack10", trips: 10, price: 349, perTrip: 34.9, saving: "ประหยัด 29%" },
];

export default function UpgradePage(): React.ReactNode {
  const [selected, setSelected] = useState<PackId>("single");
  const { toast } = useToast();
  const pack = packs.find((p) => p.id === selected)!;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/usage" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าการใช้งาน
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ซื้อทริปเพิ่ม</h1>
        <p className="text-slate-500 mt-2 text-sm">จ่ายเฉพาะทริปที่ใช้ ไม่มี subscription ไม่ผูกมัด</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pack Selection */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-bold text-slate-900">เลือกจำนวน</h2>
          {packs.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-5 rounded-xl border-2 flex items-center justify-between transition-all ${
                selected === p.id ? "border-blue-600 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <p className="font-bold text-slate-900">{p.trips} ทริป</p>
                {p.saving && <span className="text-xs font-semibold text-blue-600">{p.saving}</span>}
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-900">฿{p.price}</p>
                <p className="text-xs text-slate-400">฿{p.perTrip}/ทริป</p>
              </div>
            </button>
          ))}

          <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6">
            <h3 className="font-bold text-slate-900 mb-4">ทุกทริปที่ซื้อได้รับ</h3>
            <div className="space-y-3">
              {[
                "ผู้ติดตามไม่จำกัด",
                "แจ้งเตือน LINE + Web Push ไม่จำกัด",
                "แก้ไขหลัง publish ไม่จำกัด",
                "ไม่มี \"Powered by\" badge",
                "QR Code + ลิงก์แชร์",
                "ไม่มีวันหมดอายุ — ใช้ได้ตลอด",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4">สรุปคำสั่งซื้อ</h3>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">{pack.trips} ทริป</span>
                <span className="font-bold text-slate-900">฿{pack.price.toFixed(2)}</span>
              </div>
              {pack.saving && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-600 font-semibold">{pack.saving}</span>
                  <span className="text-blue-600 font-semibold">-฿{((49 * pack.trips) - pack.price).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xl mt-4">
                <span className="font-bold text-slate-900">รวม</span>
                <span className="font-black text-blue-600">฿{pack.price.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <h3 className="font-bold text-slate-900">ชำระเงิน</h3>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-700">PromptPay QR</p>
                <div className="w-36 h-36 mx-auto bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                  <span className="text-slate-300 text-xs">QR Code</span>
                </div>
                <p className="text-xs text-slate-400">สแกนด้วยแอปธนาคาร</p>
              </div>

              <div className="relative flex items-center">
                <div className="grow border-t border-slate-200" />
                <span className="mx-4 text-xs text-slate-400">หรือจ่ายด้วยบัตร</span>
                <div className="grow border-t border-slate-200" />
              </div>

              <div className="space-y-4">
                <FormInput label="หมายเลขบัตร" placeholder="xxxx xxxx xxxx xxxx" />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="วันหมดอายุ" placeholder="MM/YY" />
                  <FormInput label="CVC" placeholder="•••" />
                </div>
              </div>

              <button
                onClick={() => toast("ชำระเงินสำเร็จ! ได้รับ " + pack.trips + " ทริป")}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all"
              >
                ชำระ ฿{pack.price.toFixed(2)}
              </button>

              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  SSL 256-bit
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Omise Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
