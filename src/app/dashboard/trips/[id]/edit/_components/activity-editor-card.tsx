"use client";

import { useState } from "react";
import { FormInput, FormTextarea, IconButton, TimePicker, SelectPicker } from "@/components/shared";
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

interface ActivityEditorCardProps {
  activity: TripActivity;
  /** Optimistic local edit — fires on every keystroke. */
  onLocalChange: (patch: Partial<TripActivity>) => void;
  /** Persisting save — fires on blur with the field name + final value. */
  onCommit: (field: keyof TripActivity, value: string | null) => void;
  onRemove: () => void;
}

/**
 * Itinerary activity row in the day editor. Local edits buffer in parent
 * state and only commit to the server on blur — that's why we need the
 * onLocalChange / onCommit split.
 */
export function ActivityEditorCard({
  activity, onLocalChange, onCommit, onRemove,
}: ActivityEditorCardProps): React.ReactNode {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  return (
    <div className="group bg-white rounded-2xl border border-(--outline-variant)/30 hover:border-(--primary)/30 shadow-sm transition-all p-5 md:p-6">
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

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 relative">
              <SelectPicker
                label="ประเภท"
                value={activity.type}
                onChange={(v) => onCommit("type", v)}
                options={ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
                searchable={false}
              />
            </div>
            <div className="col-span-2">
              <FormInput
                label="สถานที่ / Google Maps"
                placeholder="ชื่อสถานที่ หรือ link Google Maps"
                value={activity.placeName ?? activity.mapsLink ?? ""}
                onChange={(e) => onLocalChange({ placeName: e.target.value })}
                onBlur={() => onCommit("placeName", activity.placeName ?? "")}
                icon="location_on"
              />
            </div>
          </div>

          <FormTextarea
            label="หมายเหตุถึงลูกทัวร์"
            rows={2}
            value={activity.description ?? ""}
            onChange={(e) => onLocalChange({ description: e.target.value })}
            onBlur={() => onCommit("description", activity.description ?? "")}
            placeholder="เช่น ใส่กางเกงขาสั้น, เตรียมเสื้อกันหนาว..."
          />
        </div>

        <div className="mt-6 shrink-0">
          <IconButton icon="delete" variant="danger" onClick={onRemove} />
        </div>
      </div>
    </div>
  );
}
