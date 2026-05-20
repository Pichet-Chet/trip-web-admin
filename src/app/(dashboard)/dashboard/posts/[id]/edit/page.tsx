"use client";

import { use, useEffect, useState, useMemo } from "react";
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
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { Button, IconButton } from "@pichetch08/trip-ui";

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
  // Skip the placeholder title while loading so the tab doesn't flash.
  usePageTitle(post ? `แก้ไข: ${post.title}` : null);
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

  // Snapshot the loaded post so dirty = "diverged from server state".
  // useMemo so we don't re-stringify on every keystroke when nothing
  // depends on the snapshot value.
  const loadedSnapshot = useMemo(
    () => post
      ? JSON.stringify({
          coverUrl: post.images[0] ?? null,
          title: post.title,
          destination: post.destination ?? "",
          duration: post.duration ?? "",
          travelPeriod: post.travelPeriod ?? "",
          price: post.price !== null ? String(post.price) : "",
          slots: post.slots !== null ? String(post.slots) : "",
          description: post.description ?? "",
          highlights: (post.highlights ?? "").split("\n").filter(Boolean),
          tagsInput: post.tags.join(", "),
        })
      : "",
    [post],
  );
  const currentSnapshot = JSON.stringify({
    coverUrl, title, destination, duration, travelPeriod, price, slots,
    description, highlights: highlights.filter((h) => h.trim() !== ""), tagsInput,
  });
  const isDirty = !saving && loadedSnapshot !== "" && currentSnapshot !== loadedSnapshot;
  useUnsavedChanges(isDirty);

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
        toast.error(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
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
      toast.success("อัปเดตแพ็กเกจแล้ว");
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
      toast.success(
        newStatus === "published" ? "เผยแพร่แล้ว"
        : newStatus === "closed" ? "ปิดรับลูกค้าแล้ว"
        : "เปลี่ยนเป็นร่างแล้ว",
      );
      router.push("/dashboard/posts");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setSaving(false);
      setConfirmStatus(null);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("ลบแพ็กเกจแล้ว");
      router.push("/dashboard/posts");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
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
        <Button variant="ghost" icon="arrow_back" size="sm" onClick={() => router.push("/dashboard/posts")}>กลับหน้าแพ็กเกจ</Button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-(--on-surface) tracking-tight">แก้ไขแพ็กเกจ</h1>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white ${
            isPublished ? "bg-emerald-500" : isClosed ? "bg-(--surface-container-low)0" : "bg-amber-500"
          }`}>
            {isPublished ? "เปิดรับ" : isClosed ? "ปิดรับแล้ว" : "ร่าง"}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-6 space-y-6">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput label="ระยะเวลา" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <FormInput label="ช่วงเดินทาง" value={travelPeriod} onChange={(e) => setTravelPeriod(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <IconButton icon="close" variant="ghost" size="sm" onClick={() => removeHighlight(idx)} aria-label="ลบไฮไลท์" />
              )}
            </div>
          ))}
          {highlights.length < 8 && (
            <Button variant="ghost" icon="add" size="sm" onClick={addHighlight}>เพิ่มไฮไลท์</Button>
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
        <div className="flex flex-wrap gap-2 pt-4 border-t border-(--outline-variant)/20">
          {!isPublished && (
            <Button
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => setConfirmStatus("published")}
            >
              เปิดรับลูกค้า
            </Button>
          )}
          {isPublished && (
            <Button
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => setConfirmStatus("closed")}
            >
              ปิดรับลูกค้า
            </Button>
          )}
          <div className="ml-auto">
            <Button
              variant="danger"
              size="sm"
              disabled={saving}
              onClick={() => setConfirmDelete(true)}
            >
              ลบแพ็กเกจ
            </Button>
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <Button variant="outline" disabled={saving} onClick={() => router.push("/dashboard/posts")} size="lg">ยกเลิก</Button>
          <Button variant="primary" disabled={saving} loading={saving} onClick={handleSave} size="lg">บันทึกการเปลี่ยนแปลง</Button>
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
