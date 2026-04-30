"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  FormInput,
  FormTextarea,
  ImageUpload,
  PageSkeleton,
  ConfirmDialog,
  useToast,
} from "@/components/shared";
import type { PostStatus } from "@/types";

interface PostResponse {
  id: string;
  title: string;
  destination: string | null;
  description: string | null;
  highlights: string | null;
  images: string[];
  price: number | null;
  duration: string | null;
  travelPeriod: string | null;
  slots: number | null;
  tags: string[];
  status: PostStatus;
  viewCount: number;
  inquiryCount: number;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<PostStatus | null>(null);

  useEffect(() => {
    api.get<PostResponse>(`/admin/posts/${id}`)
      .then((p) => {
        setPost(p);
        setCoverUrl(p.images[0] ?? null);
        setTitle(p.title);
        setDestination(p.destination ?? "");
        setDuration(p.duration ?? "");
        setTravelPeriod(p.travelPeriod ?? "");
        setPrice(p.price !== null ? String(p.price) : "");
        setSlots(p.slots !== null ? String(p.slots) : "");
        setDescription(p.description ?? "");
        const lines = (p.highlights ?? "").split("\n").filter(Boolean);
        setHighlights(lines.length > 0 ? lines : [""]);
        setTagsInput(p.tags.join(", "));
      })
      .catch((err) => {
        toast(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ", "error");
        router.push("/dashboard/posts");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  async function handleSave() {
    if (!title.trim()) {
      setError("กรุณากรอกชื่อแพ็กเกจ");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await api.put(`/admin/posts/${id}`, {
        title: title.trim(),
        destination: destination.trim() || null,
        description: description.trim() || null,
        highlights: highlights.map((h) => h.trim()).filter(Boolean).join("\n") || null,
        images: coverUrl ? [coverUrl] : [],
        price: price ? Number(price) : null,
        duration: duration.trim() || null,
        travelPeriod: travelPeriod.trim() || null,
        slots: slots ? Number(slots) : null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast("อัปเดตแพ็กเกจแล้ว", "success");
      router.push("/dashboard/posts");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: PostStatus) {
    setSaving(true);
    try {
      await api.put(`/admin/posts/${id}/status`, { status: newStatus });
      toast(
        newStatus === "published" ? "เผยแพร่แล้ว"
        : newStatus === "closed" ? "ปิดรับลูกค้าแล้ว"
        : "เปลี่ยนเป็นร่างแล้ว",
        "success",
      );
      router.push("/dashboard/posts");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เปลี่ยนสถานะไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
      setConfirmStatus(null);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.delete(`/admin/posts/${id}`);
      toast("ลบแพ็กเกจแล้ว", "success");
      router.push("/dashboard/posts");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
      setSaving(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!post) return null;

  const isPublished = post.status === "published";
  const isClosed = post.status === "closed";

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => router.push("/dashboard/posts")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าแพ็กเกจ
        </button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">แก้ไขแพ็กเกจ</h1>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white ${
            isPublished ? "bg-emerald-500" : isClosed ? "bg-slate-500" : "bg-amber-500"
          }`}>
            {isPublished ? "เปิดรับ" : isClosed ? "ปิดรับแล้ว" : "ร่าง"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <ImageUpload
          value={coverUrl}
          onChange={setCoverUrl}
          aspect="video"
          label="รูปปกแพ็กเกจ"
          hint="แนะนำ: 1200x630px"
        />

        <FormInput
          label="ชื่อแพ็กเกจ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <FormInput
          label="จุดหมายปลายทาง"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ระยะเวลา" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <FormInput label="ช่วงเดินทาง" value={travelPeriod} onChange={(e) => setTravelPeriod(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="ราคาเริ่มต้น (บาท)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <FormInput
            label="จำนวนที่รับ (คน)"
            type="number"
            value={slots}
            onChange={(e) => setSlots(e.target.value)}
          />
        </div>

        <FormTextarea
          label="รายละเอียด"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Highlights */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">ไฮไลท์ทริป</label>
          {highlights.map((h, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-xs text-slate-300 w-5 text-center">{idx + 1}.</span>
              <input
                value={h}
                onChange={(e) => updateHighlight(idx, e.target.value)}
                placeholder="เช่น ชมใบไม้เปลี่ยนสีที่เกียวโต"
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
              />
              {highlights.length > 1 && (
                <button onClick={() => removeHighlight(idx)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
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
          placeholder="คั่นด้วย comma"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          {!isPublished && (
            <button
              onClick={() => setConfirmStatus("published")}
              disabled={saving}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              เปิดรับลูกค้า
            </button>
          )}
          {isPublished && (
            <button
              onClick={() => setConfirmStatus("closed")}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              ปิดรับลูกค้า
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="ml-auto px-4 py-2 bg-red-50 text-red-700 text-sm font-bold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            ลบแพ็กเกจ
          </button>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/posts")}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-(--primary) text-white text-sm font-bold hover:opacity-95 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => !saving && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={`ลบ "${post.title}"?`}
        description="แพ็กเกจจะถูกลบออกจากระบบและ Marketplace ถาวร"
        confirmLabel={saving ? "กำลังลบ..." : "ลบแพ็กเกจ"}
        variant="danger"
      />

      <ConfirmDialog
        open={confirmStatus !== null}
        onClose={() => !saving && setConfirmStatus(null)}
        onConfirm={() => confirmStatus && handleStatusChange(confirmStatus)}
        title={confirmStatus === "published" ? "เปิดรับลูกค้า?" : "ปิดรับลูกค้า?"}
        description={
          confirmStatus === "published"
            ? "แพ็กเกจจะแสดงบน Marketplace และเปิดรับลูกค้าใหม่"
            : "แพ็กเกจจะหยุดรับลูกค้า แต่ยังคงแสดงข้อมูลให้ลูกค้าที่จองแล้วเห็น"
        }
        confirmLabel={saving ? "กำลังบันทึก..." : "ยืนยัน"}
      />
    </div>
  );
}
