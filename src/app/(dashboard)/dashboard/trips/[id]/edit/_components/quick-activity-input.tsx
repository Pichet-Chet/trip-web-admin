"use client";

import { useState } from "react";
import type { TripActivity } from "@/types";

type ActivityType = TripActivity["type"];

const KEYWORD_RULES: Array<{ keywords: string[]; type: ActivityType; emoji: string }> = [
  {
    keywords: ["อาหาร", "ร้าน", "กิน", "ข้าว", "lunch", "dinner", "breakfast", "cafe", "coffee", "ชา", "ชาบู", "ซูชิ", "บุฟเฟ่", "restaurant", "ปิ้งย่าง", "สุกี้", "ราเมน", "โซบะ", "tempura", "sushi"],
    type: "restaurant",
    emoji: "🍽️",
  },
  {
    keywords: ["โรงแรม", "ที่พัก", "รีสอร์ท", "resort", "hotel", "hostel", "check in", "check-in", "เช็คอิน", "villa"],
    type: "hotel",
    emoji: "🏨",
  },
  {
    keywords: ["ช้อปปิ้ง", "ตลาด", "mall", "market", "shopping", "ห้าง", "outlet", "ดิวตี้ฟรี", "duty free", "ของที่ระลึก"],
    type: "shopping",
    emoji: "🛍️",
  },
  {
    keywords: ["สนามบิน", "airport", "เครื่องบิน", "บิน", "flight", "รถ", "bus", "train", "เรือ", "ferry", "taxi", "grab", "ออกเดินทาง", "เช็คเอาท์", "check out", "transit", "ต่อเครื่อง"],
    type: "transport",
    emoji: "✈️",
  },
];

export function detectActivityMeta(name: string): { type: ActivityType; emoji: string } {
  const lower = name.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { type: rule.type, emoji: rule.emoji };
    }
  }
  return { type: "attraction", emoji: "📍" };
}

interface QuickActivityInputProps {
  onAdd: (name: string, type: ActivityType, emoji: string) => void;
  disabled?: boolean;
}

export function QuickActivityInput({ onAdd, disabled }: QuickActivityInputProps) {
  const [value, setValue] = useState("");
  const detected = detectActivityMeta(value.trim());

  function submit() {
    const name = value.trim();
    if (!name) return;
    onAdd(name, detected.type, detected.emoji);
    setValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-dashed border-(--outline-variant)/60 hover:border-(--primary)/40 px-4 py-3 transition-all focus-within:border-(--primary) focus-within:shadow-sm group">
      <span className="text-xl select-none transition-all">{value.trim() ? detected.emoji : "✏️"}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="พิมพ์ชื่อกิจกรรม แล้วกด Enter..."
        disabled={disabled}
        className="flex-1 bg-transparent text-sm font-medium text-(--on-surface) placeholder:text-(--on-surface-variant)/50 outline-none disabled:opacity-50"
        aria-label="เพิ่มกิจกรรมด่วน"
      />
      {value.trim() && (
        <span className="hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-lg bg-(--surface-variant) text-(--on-surface-variant)">
          {detected.type}
        </span>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || disabled}
        title="เพิ่มกิจกรรม (Enter)"
        className="w-7 h-7 rounded-lg bg-(--primary) text-(--on-primary) flex items-center justify-center opacity-0 group-focus-within:opacity-100 disabled:opacity-0 transition-opacity"
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
    </div>
  );
}
