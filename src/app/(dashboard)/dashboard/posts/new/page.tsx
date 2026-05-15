"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { FormInput, FormTextarea, ImageUpload, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";

interface CreatePostRequest {
  title: string;
  destination?: string;
  description?: string;
  highlights?: string;
  images?: string[];
  price?: number;
  duration?: string;
  travelPeriod?: string;
  slots?: number;
  tags?: string[];
}

export default function NewPostPage(): React.ReactNode {
  usePageTitle("โพสต์ใหม่");
  const router = useRouter();
  const { toast } = useToast();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [travelPeriod, setTravelPeriod] = useState("");
  const [price, setPrice] = useState("");
  const [slots, setSlots] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [tagsInput, setTagsInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Treat any non-empty form field as "dirty" so the operator gets a
  // beforeunload warning if they navigate away mid-create. Cheap check
  // — none of these fields cost much to read on every render.
  const isDirty = !saving && (
    !!coverUrl || title.trim() !== "" || destination.trim() !== "" ||
    duration.trim() !== "" || travelPeriod.trim() !== "" || price !== "" ||
    slots !== "" || description.trim() !== "" ||
    highlights.some((h) => h.trim() !== "") || tagsInput.trim() !== ""
  );
  useUnsavedChanges(isDirty);

  function addHighlight(): void {
    if (highlights.length < 8) setHighlights([...highlights, ""]);
  }

  function updateHighlight(idx: number, val: string): void {
    const next = [...highlights];
    next[idx] = val;
    setHighlights(next);
  }

  function removeHighlight(idx: number): void {
    setHighlights(highlights.filter((_, i) => i !== idx));
  }

  function buildPayload(): CreatePostRequest | null {
    if (!title.trim()) {
      setError("กรุณากรอกชื่อแพ็กเกจ");
      return null;
    }
    return {
      title: title.trim(),
      destination: destination.trim() || undefined,
      description: description.trim() || undefined,
      highlights: highlights.map((h) => h.trim()).filter(Boolean).join("\n") || undefined,
      images: coverUrl ? [coverUrl] : undefined,
      price: price ? Number(price) : undefined,
      duration: duration.trim() || undefined,
      travelPeriod: travelPeriod.trim() || undefined,
      slots: slots ? Number(slots) : undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
  }

  async function save(targetStatus: "draft" | "published") {
    const payload = buildPayload();
    if (!payload) return;

    setError("");
    setSaving(true);
    try {
      const post = await api.post<{ id: string }>("/admin/posts", payload);
      if (targetStatus === "published") {
        await api.put(`/admin/posts/${post.id}/status`, { status: "published" });
      }
      toast.success(targetStatus === "published" ? "เผยแพร่แพ็กเกจแล้ว" : "บันทึกร่างแล้ว");
      router.push("/dashboard/posts");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => router.push("/dashboard/posts")} className="text-sm text-(--outline) hover:text-(--on-surface-variant) flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าแพ็กเกจ
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-(--on-surface) tracking-tight">สร้างแพ็กเกจทัวร์</h1>
      </div>

      <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-6 space-y-6">
        <ImageUpload
          value={coverUrl}
          onChange={setCoverUrl}
          aspect="video"
          label="รูปปกแพ็กเกจ"
          hint="แนะนำขนาด 1200×630 px"
        />

        <FormInput
          label="ชื่อแพ็กเกจ"
          placeholder="เช่น ทริปญี่ปุ่นใบไม้เปลี่ยนสี โตเกียว — ฟูจิ — เกียวโต"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <FormInput
          label="จุดหมายปลายทาง"
          placeholder="เช่น ญี่ปุ่น, เกาหลีใต้, เชียงใหม่"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="ระยะเวลา"
            placeholder="เช่น 5 วัน 4 คืน"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <FormInput
            label="ช่วงเดินทาง"
            placeholder="เช่น ต.ค. — พ.ย. 2569"
            value={travelPeriod}
            onChange={(e) => setTravelPeriod(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="ราคาเริ่มต้น (บาท)"
            type="number"
            placeholder="เช่น 32900"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <FormInput
            label="จำนวนที่รับ (คน)"
            type="number"
            placeholder="เช่น 25"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
          />
        </div>

        <FormTextarea
          label="รายละเอียด"
          rows={5}
          placeholder="อธิบายรายละเอียดทริป สิ่งที่รวมอยู่ในราคา จุดเด่น..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Highlights */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-(--outline) uppercase tracking-widest px-1">ไฮไลท์ทริป</label>
          {highlights.map((h, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-(--outline-variant) w-5 text-center">{idx + 1}.</span>
              <input
                value={h}
                onChange={(e) => updateHighlight(idx, e.target.value)}
                placeholder="เช่น ชมใบไม้เปลี่ยนสีที่เกียวโต"
                className="flex-1 bg-white border border-(--outline-variant)/30 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
              />
              {highlights.length > 1 && (
                <button onClick={() => removeHighlight(idx)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-(--outline-variant) hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          ))}
          {highlights.length < 8 && (
            <button onClick={addHighlight} className="text-xs text-(--primary) hover:opacity-80 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">add</span>
              เพิ่มไฮไลท์
            </button>
          )}
        </div>

        <FormInput
          label="แท็ก"
          placeholder="เช่น ญี่ปุ่น, ใบไม้เปลี่ยนสี, โตเกียว (คั่นด้วย comma)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-(--outline-variant)/20">
          <button
            onClick={() => save("draft")}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl border border-(--outline-variant)/30 text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-container-low) transition-colors disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกร่าง"}
          </button>
          <button
            onClick={() => save("published")}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-(--primary) text-white text-sm font-bold hover:opacity-95 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "เผยแพร่แพ็กเกจ"}
          </button>
        </div>
      </div>
    </div>
  );
}
