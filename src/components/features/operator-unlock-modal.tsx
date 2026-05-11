"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getUser, setAccessToken } from "@/lib/auth";

type AccountType = "Company" | "FreelanceGuide" | "Personal";

interface Props {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; desc: string; icon: string }[] = [
  { value: "Company", label: "บริษัททัวร์", desc: "จดทะเบียนบริษัท มีใบอนุญาต ททท.", icon: "business" },
  { value: "FreelanceGuide", label: "ไกด์อิสระ", desc: "รับงานอิสระ ไม่ต้องมีใบอนุญาต", icon: "person_pin" },
  { value: "Personal", label: "ส่วนตัว", desc: "จัดทริปกับเพื่อน ครอบครัว", icon: "group" },
];

export function OperatorUnlockModal({ open, onSuccess, onClose }: Props) {
  const [accountType, setAccountType] = useState<AccountType>("Company");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) { setError("กรุณากรอกชื่อที่แสดงในทริป"); return; }

    setLoading(true);
    try {
      await api.post("/admin/operator/unlock", { accountType, displayName: displayName.trim() });
      // Refresh session so isOperator updates everywhere
      const res = await api.post<{ accessToken: string }>("/admin/auth/refresh", {});
      if (res.accessToken) setAccessToken(res.accessToken);
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-(--surface) rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-(--primary)/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-(--primary) text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
          </div>
          <h2 className="text-2xl font-bold text-(--on-surface) mb-1">ก่อนสร้างทริปแรก</h2>
          <p className="text-sm text-(--on-surface-variant)">บอกเราหน่อยว่าคุณใช้งานในฐานะอะไร เพื่อตั้งค่าบัญชีให้เหมาะสม</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account Type */}
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setAccountType(t.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  accountType === t.value
                    ? "border-(--primary) bg-(--primary)/5"
                    : "border-(--outline-variant)/30 hover:border-(--outline-variant)"
                }`}
              >
                <span className={`material-symbols-outlined text-2xl shrink-0 ${accountType === t.value ? "text-(--primary)" : "text-(--outline)"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {t.icon}
                </span>
                <div>
                  <p className={`font-bold text-sm ${accountType === t.value ? "text-(--primary)" : "text-(--on-surface)"}`}>{t.label}</p>
                  <p className="text-xs text-(--on-surface-variant)">{t.desc}</p>
                </div>
                {accountType === t.value && (
                  <span className="material-symbols-outlined text-(--primary) ml-auto shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {/* Display Name */}
          <div>
            <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest block mb-2">
              {accountType === "Company" ? "ชื่อบริษัท" : "ชื่อที่แสดงในทริป"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
              placeholder={accountType === "Company" ? "บริษัท ทัวร์สนุก จำกัด" : accountType === "FreelanceGuide" ? "ไกด์สมชาย" : "กลุ่มเพื่อนซี้"}
              className="w-full px-4 py-3 rounded-xl border border-(--outline-variant)/40 bg-(--surface-container-low) text-(--on-surface) text-sm focus:outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 transition"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-(--outline-variant)/40 text-(--on-surface-variant) text-sm font-semibold hover:bg-(--surface-container-low) transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-full bg-(--primary) text-(--on-primary) text-sm font-bold hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "เริ่มสร้างทริป →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
