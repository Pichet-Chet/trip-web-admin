"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button, FormInput } from "@pichetch08/trip-ui";

interface ApplyPromoResponse {
  type: string;
  value: number;
  benefit: string;
}

// raw code fallback — shown only before the error-code seed has run in a new env
const CODE_FALLBACK: Record<string, string> = {
  PROMO_INVALID:          "โค้ดไม่ถูกต้อง",
  PROMO_EXPIRED:          "โค้ดหมดอายุแล้ว",
  PROMO_MAX_USES_REACHED: "โค้ดนี้ถูกใช้ครบจำนวนแล้ว",
  PROMO_ALREADY_USED:     "คุณเคยใช้โค้ดนี้แล้ว",
};

interface PromoCodeWidgetProps {
  onApplied?: (result: ApplyPromoResponse) => void;
}

export function PromoCodeWidget({ onApplied }: PromoCodeWidgetProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [benefit, setBenefit] = useState<string | null>(null);

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setBenefit(null);
    try {
      const result = await api.post<ApplyPromoResponse>("/admin/billing/apply-promo", { code: trimmed });
      setBenefit(result.benefit);
      setCode("");
      onApplied?.(result);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(CODE_FALLBACK[e.message] ?? e.message);
      } else {
        setError("ใช้โค้ดไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-wider">โปรโมชันโค้ด</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <FormInput
            placeholder="ใส่โค้ดที่นี่"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(null); setBenefit(null); }}
            onKeyDown={e => { if (e.key === "Enter") handleApply(); }}
            maxLength={32}
            disabled={loading}
            error={error ?? undefined}
          />
        </div>
        <Button
          variant="primary"
          loading={loading}
          onClick={handleApply}
        >ใช้โค้ด</Button>
      </div>

      {benefit && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-emerald-500 text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="font-medium">{benefit}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
