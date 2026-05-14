"use client";

import { useState } from "react";
import { FormInput, FormTextarea, IconButton, TimePicker } from "@/components/shared";
import { ImageUpload } from "@/components/media/image-upload";
import { PlaceAutocompleteInput, type PlaceResult } from "./place-autocomplete-input";
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
  googleMapsApiKey?: string | null;
  onPlaceSelect?: (patch: Partial<TripActivity>) => void;
}

/**
 * Itinerary activity row in the day editor. Local edits buffer in parent
 * state and only commit to the server on blur — that's why we need the
 * onLocalChange / onCommit split.
 */
export function ActivityEditorCard({
  activity, onLocalChange, onCommit, onImagesChange, onRemove,
  defaultExpanded = false, onRequestExpand, onCollapse,
  googleMapsApiKey, onPlaceSelect,
}: ActivityEditorCardProps): React.ReactNode {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const imageUrls: string[] = activity.imageUrls ?? [];

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
            <PlaceAutocompleteInput
              value={activity.placeName ?? ""}
              apiKey={googleMapsApiKey ?? null}
              onPlaceSelect={(result: PlaceResult) => {
                onLocalChange({ placeName: result.placeName, lat: result.lat, lng: result.lng, mapsLink: result.mapsLink });
                onPlaceSelect?.({ placeName: result.placeName, lat: result.lat, lng: result.lng, mapsLink: result.mapsLink });
              }}
              onTextChange={(v) => onLocalChange({ placeName: v })}
              onBlur={() => onCommit("placeName", activity.placeName ?? "")}
            />
            {/* Mini map preview — shown when lat/lng is known */}
            {activity.lat && activity.lng && googleMapsApiKey ? (
              <div className="relative rounded-xl overflow-hidden border border-(--outline-variant)/30 h-40">
                <iframe
                  title="map-preview"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${activity.lat},${activity.lng}&zoom=15&language=th`}
                  allowFullScreen
                />
                {activity.mapsLink && (
                  <a
                    href={activity.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] font-semibold bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow text-(--primary) hover:bg-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Google Maps
                  </a>
                )}
              </div>
            ) : !activity.mapsLink ? (
              <FormInput
                placeholder="Google Maps link (ถ้ามี)"
                value={activity.mapsLink ?? ""}
                onChange={(e) => onLocalChange({ mapsLink: e.target.value })}
                onBlur={() => onCommit("mapsLink", activity.mapsLink ?? "")}
                icon="map"
                type="url"
              />
            ) : (
              <a
                href={activity.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-(--primary) hover:underline px-1"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                ดูใน Google Maps
              </a>
            )}
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
          <ImageUpload
            values={imageUrls}
            onMultiChange={onImagesChange}
            maxImages={MAX_IMAGES}
            folder="activities"
            label="รูปภาพประกอบ"
          />
        </div>

        <div className="mt-6 shrink-0">
          <IconButton icon="delete" variant="danger" onClick={onRemove} />
        </div>
      </div>
    </div>
  );
}
