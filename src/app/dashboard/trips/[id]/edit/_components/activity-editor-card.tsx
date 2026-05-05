"use client";

import { useRef, useState } from "react";
import { FormInput, FormTextarea, IconButton, TimePicker } from "@/components/shared";
import type { TripActivity } from "@/types";

const ACTIVITY_TYPES = [
  { value: "attraction", label: "สถานที่ท่องเที่ยว", icon: "landscape" },
  { value: "restaurant", label: "ร้านอาหาร", icon: "restaurant" },
  { value: "hotel", label: "ที่พัก", icon: "hotel" },
  { value: "transport", label: "การเดินทาง", icon: "directions_car" },
  { value: "shopping", label: "ช้อปปิ้ง", icon: "shopping_bag" },
  { value: "other", label: "อื่นๆ", icon: "category" },
] as const;

const EMOJI_OPTIONS = [
  "📍", "✈️", "🏨", "🍜", "🍱", "🍽️", "☕",
  "⛩️", "🏛️", "🛍️", "🛒", "🌅", "🏖️", "⛰️",
  "🎡", "🎭", "🚌", "🚢", "🚂", "🏥", "📸",
  "🎶", "🙏", "🐘", "🌊", "🌴", "🗺️", "🎒",
];

const MAX_IMAGES = 6;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

const TYPE_LABELS: Record<string, string> = {
  attraction: "สถานที่", restaurant: "ร้านอาหาร", hotel: "ที่พัก",
  transport: "เดินทาง", shopping: "ช้อปปิ้ง", other: "อื่นๆ",
};
const TYPE_COLORS: Record<string, string> = {
  attraction: "bg-sky-50 text-sky-700",
  restaurant: "bg-orange-50 text-orange-700",
  hotel: "bg-indigo-50 text-indigo-700",
  transport: "bg-slate-100 text-slate-700",
  shopping: "bg-pink-50 text-pink-700",
  other: "bg-(--surface-variant) text-(--on-surface-variant)",
};

interface ActivityEditorCardProps {
  activity: TripActivity;
  /** Optimistic local edit — fires on every keystroke. */
  onLocalChange: (patch: Partial<TripActivity>) => void;
  /** Persisting save — fires on blur with the field name + final value. */
  onCommit: (field: keyof TripActivity, value: string | null) => void;
  /** Fires when the image gallery changes (bulk-replace). */
  onImagesChange: (urls: string[]) => void;
  onRemove: () => void;
  /** Start in expanded state (e.g. blank activity created via button). */
  defaultExpanded?: boolean;
  /** Override compact-row click (e.g. open a bottom sheet on mobile). */
  onRequestExpand?: () => void;
  /** Override "ย่อ" button (e.g. close the bottom sheet that hosts this card). */
  onCollapse?: () => void;
}

/**
 * Itinerary activity row in the day editor. Local edits buffer in parent
 * state and only commit to the server on blur — that's why we need the
 * onLocalChange / onCommit split.
 */
export function ActivityEditorCard({
  activity, onLocalChange, onCommit, onImagesChange, onRemove,
  defaultExpanded = false, onRequestExpand, onCollapse,
}: ActivityEditorCardProps): React.ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const imageUrls: string[] = activity.imageUrls ?? [];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be re-selected after removing it
    e.target.value = "";

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setUploadError("รองรับเฉพาะ JPEG, PNG, WebP, GIF"); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("ขนาดไฟล์ต้องไม่เกิน 5 MB"); return; }

    setUploadError("");
    setUploading(true);
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "activities");
      const res = await fetch(`${API_URL}/admin/upload/image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url: string = data.data?.url ?? data.url ?? "";
      if (!url) throw new Error("No URL in response");
      const next = [...imageUrls, url];
      onImagesChange(next);
    } catch {
      setUploadError("อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    const next = imageUrls.filter((_, i) => i !== idx);
    onImagesChange(next);
  }

  // ── Compact (collapsed) row ──
  if (!expanded) {
    return (
      <div
        onClick={() => onRequestExpand ? onRequestExpand() : setExpanded(true)}
        className="group flex items-center gap-3 bg-white rounded-2xl border border-(--outline-variant)/30 hover:border-(--primary)/30 shadow-sm transition-all px-4 py-3 cursor-pointer"
        role="button"
        aria-expanded={false}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(true); } }}
      >
        <span className="text-xl shrink-0">{activity.emoji || "📍"}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-(--on-surface) truncate block">
            {activity.name || <span className="text-(--on-surface-variant) italic">กิจกรรมใหม่</span>}
          </span>
        </div>
        {activity.time && (
          <span className="hidden sm:inline text-xs font-mono text-(--on-surface-variant) shrink-0">{activity.time}</span>
        )}
        <span className={`hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[activity.type] ?? TYPE_COLORS.other}`}>
          {TYPE_LABELS[activity.type] ?? activity.type}
        </span>
        <span className="material-symbols-outlined text-lg text-(--on-surface-variant) shrink-0 group-hover:text-(--primary) transition-colors">expand_more</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-(--on-surface-variant) hover:bg-rose-50 hover:text-rose-600 transition-all shrink-0 opacity-0 group-hover:opacity-100"
          title="ลบกิจกรรม"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    );
  }

  // ── Expanded (full edit) view ──
  return (
    <div className="group bg-white rounded-2xl border border-(--outline-variant)/30 hover:border-(--primary)/30 shadow-sm transition-all p-5 md:p-6">
      {/* Collapse button */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => onCollapse ? onCollapse() : setExpanded(false)}
          className="inline-flex items-center gap-1 text-xs font-bold text-(--on-surface-variant) hover:text-(--primary) transition-colors"
        >
          <span className="material-symbols-outlined text-base">expand_less</span>
          ย่อ
        </button>
      </div>
      <div className="flex gap-3 items-start">
        {/* Emoji selector */}
        <div className="mt-6 relative shrink-0">
          <button
            onClick={() => setEmojiPickerOpen((v) => !v)}
            className="w-10 h-10 rounded-xl bg-(--surface-variant)/50 hover:bg-(--surface-variant) flex items-center justify-center text-xl transition-all"
            title="เลือก Emoji"
          >
            {activity.emoji}
          </button>
          {emojiPickerOpen && (
            <>
              <div className="fixed inset-0 z-30 cursor-pointer" onClick={() => setEmojiPickerOpen(false)} />
              <div className="absolute left-0 top-12 z-40 bg-white rounded-xl shadow-xl border border-(--outline-variant)/30 p-3 grid grid-cols-7 gap-1 w-64">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    onClick={() => {
                      onCommit("emoji", em);
                      setEmojiPickerOpen(false);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-(--surface-variant) transition-all ${activity.emoji === em ? "bg-(--primary-container) ring-2 ring-(--primary)" : ""}`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 relative">
              <TimePicker
                label="เวลา"
                value={activity.time ?? ""}
                onChange={(v) => onLocalChange({ time: v })}
                onBlur={() => onCommit("time", activity.time ?? "")}
              />
            </div>
            <div className="col-span-2">
              <FormInput
                label="ชื่อกิจกรรม"
                value={activity.name}
                onChange={(e) => onLocalChange({ name: e.target.value })}
                onBlur={() => onCommit("name", activity.name)}
                placeholder="ชื่อสถานที่ / กิจกรรม"
              />
            </div>
          </div>

          {/* Activity type chip strip */}
          <div>
            <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 block mb-2">ประเภท</label>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ประเภทกิจกรรม">
              {ACTIVITY_TYPES.map((t) => {
                const selected = activity.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onCommit("type", t.value)}
                    title={t.label}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) ${
                      selected
                        ? "bg-(--primary-container) text-(--on-primary-container) shadow-sm"
                        : "bg-(--surface-variant)/50 text-(--on-surface-variant) hover:bg-(--surface-variant)"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location fields */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 block">สถานที่</label>
            <FormInput
              placeholder="ชื่อสถานที่ / สถานที่ตั้ง"
              value={activity.placeName ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (/^https?:\/\//i.test(v.trim())) {
                  onLocalChange({ mapsLink: v.trim() });
                  onCommit("mapsLink", v.trim());
                  return;
                }
                onLocalChange({ placeName: v });
              }}
              onBlur={() => onCommit("placeName", activity.placeName ?? "")}
              icon="location_on"
            />
            <FormInput
              placeholder="Google Maps link (ถ้ามี)"
              value={activity.mapsLink ?? ""}
              onChange={(e) => onLocalChange({ mapsLink: e.target.value })}
              onBlur={() => onCommit("mapsLink", activity.mapsLink ?? "")}
              icon="map"
              type="url"
            />
          </div>

          <FormTextarea
            label="หมายเหตุถึงลูกทัวร์"
            rows={2}
            value={activity.description ?? ""}
            onChange={(e) => onLocalChange({ description: e.target.value })}
            onBlur={() => onCommit("description", activity.description ?? "")}
            placeholder="เช่น ใส่กางเกงขาสั้น, เตรียมเสื้อกันหนาว..."
          />

          {/* Photo gallery — max 6 images */}
          <div>
            <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 block mb-2">
              รูปภาพประกอบ
              <span className="ml-1.5 font-normal normal-case text-[11px]">({imageUrls.length}/{MAX_IMAGES})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-(--outline-variant)/40 group/img shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`รูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                    title="ลบรูป"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </div>
              ))}

              {/* Add button — hidden when at max */}
              {imageUrls.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-(--outline-variant)/60 hover:border-(--primary)/50 flex flex-col items-center justify-center gap-0.5 text-(--on-surface-variant) hover:text-(--primary) transition-all shrink-0 disabled:opacity-50"
                  title="เพิ่มรูป"
                >
                  {uploading ? (
                    <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                      <span className="text-[10px] font-bold">เพิ่มรูป</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {uploadError && <p className="text-xs text-rose-600 mt-1 px-1">{uploadError}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="mt-6 shrink-0">
          <IconButton icon="delete" variant="danger" onClick={onRemove} />
        </div>
      </div>
    </div>
  );
}
