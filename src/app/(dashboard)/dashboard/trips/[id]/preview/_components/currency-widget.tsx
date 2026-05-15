"use client";

import { useEffect, useState } from "react";

const CURRENCIES: { code: string; label: string; flag: string }[] = [
  { code: "USD", label: "ดอลลาร์สหรัฐ", flag: "🇺🇸" },
  { code: "EUR", label: "ยูโร", flag: "🇪🇺" },
  { code: "JPY", label: "เยน (ญี่ปุ่น)", flag: "🇯🇵" },
  { code: "GBP", label: "ปอนด์สเตอร์ลิง", flag: "🇬🇧" },
  { code: "SGD", label: "ดอลลาร์สิงคโปร์", flag: "🇸🇬" },
  { code: "AUD", label: "ดอลลาร์ออสเตรเลีย", flag: "🇦🇺" },
  { code: "CNY", label: "หยวน (จีน)", flag: "🇨🇳" },
  { code: "HKD", label: "ดอลลาร์ฮ่องกง", flag: "🇭🇰" },
  { code: "KRW", label: "วอน (เกาหลี)", flag: "🇰🇷" },
  { code: "MYR", label: "ริงกิต (มาเลเซีย)", flag: "🇲🇾" },
  { code: "TWD", label: "ดอลลาร์ไต้หวัน", flag: "🇹🇼" },
  { code: "INR", label: "รูปี (อินเดีย)", flag: "🇮🇳" },
  { code: "AED", label: "เดอร์แฮม (UAE)", flag: "🇦🇪" },
  { code: "CHF", label: "ฟรังก์สวิส", flag: "🇨🇭" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

interface CurrencyWidgetProps {
  defaultTarget?: string;
}

export function CurrencyWidget({ defaultTarget = "JPY" }: CurrencyWidgetProps) {
  const [target, setTarget] = useState(defaultTarget);
  const [rate, setRate] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("1000");

  useEffect(() => {
    setLoading(true);
    setRate(null);
    fetch(`${API_URL}/client/currency?base=THB&target=${target}`)
      .then((r) => r.json())
      .then((json) => {
        const d = json.data;
        if (d?.available) {
          setRate(d.rate);
          setDate(d.date ?? "");
        } else {
          setRate(null);
        }
      })
      .catch(() => setRate(null))
      .finally(() => setLoading(false));
  }, [target]);

  const thbAmount = parseFloat(amount) || 0;
  const converted = rate !== null ? thbAmount * rate : null;

  const fmt = (val: number, code: string) =>
    new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(val) + " " + code;

  const targetMeta = CURRENCIES.find((c) => c.code === target);

  return (
    <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-xl text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
        <h4 className="text-sm font-bold text-(--on-surface)">แปลงสกุลเงิน</h4>
        {date && <span className="ml-auto text-[11px] text-(--on-surface-variant)">อัปเดต {date}</span>}
      </div>

      {/* Currency selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-2 bg-(--surface-variant)/50 rounded-xl text-sm font-bold text-(--on-surface)">
          🇹🇭 THB
        </div>
        <span className="material-symbols-outlined text-(--on-surface-variant) text-base">arrow_forward</span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="flex-1 px-3 py-2 bg-(--surface-variant)/50 rounded-xl text-sm font-bold text-(--on-surface) border-none outline-none cursor-pointer"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.label}</option>
          ))}
        </select>
      </div>

      {/* Rate display */}
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <span className="w-4 h-4 border-2 border-(--primary)/30 border-t-(--primary) rounded-full animate-spin" />
          <span className="text-xs text-(--on-surface-variant)">กำลังโหลดอัตราแลกเปลี่ยน...</span>
        </div>
      ) : rate !== null ? (
        <div className="bg-(--primary-container)/40 rounded-xl px-4 py-3">
          <p className="text-sm font-bold text-(--on-primary-container)">
            1 THB ≈ {fmt(rate, target)}
          </p>
          {targetMeta && <p className="text-xs text-(--on-surface-variant) mt-0.5">{targetMeta.flag} {targetMeta.label}</p>}
        </div>
      ) : (
        <p className="text-xs text-(--on-surface-variant)">ไม่สามารถดึงอัตราแลกเปลี่ยนได้</p>
      )}

      {/* Quick converter */}
      {rate !== null && (
        <div className="space-y-2 pt-1 border-t border-(--outline-variant)/20">
          <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest">คำนวณเร็ว</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-(--surface-variant)/50 rounded-xl text-sm font-bold text-(--on-surface) border border-(--outline-variant)/30 focus:outline-none focus:border-(--primary)/50"
                placeholder="จำนวน THB"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-(--on-surface-variant)">THB</span>
            </div>
            <div className="flex items-center px-3 py-2 bg-(--surface-variant)/30 rounded-xl">
              <span className="text-sm font-bold text-(--on-surface) truncate">
                {converted !== null ? fmt(converted, target) : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
