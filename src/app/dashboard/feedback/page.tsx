"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormInput, FormTextarea } from "@/components/shared";
import { api, ApiError } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
const MAX_ATTACHMENTS = 5;

type FeedbackType = "bug" | "feature" | "improvement" | "other";

const TYPE_MAP: Record<FeedbackType, string> = {
  bug:         "Bug",
  feature:     "FeatureRequest",
  improvement: "FeatureRequest",
  other:       "Other",
};

const feedbackTypes: { value: FeedbackType; label: string; desc: string }[] = [
  { value: "bug",         label: "แจ้งปัญหา",          desc: "ระบบทำงานผิดปกติ ข้อผิดพลาด หรือใช้งานไม่ได้" },
  { value: "feature",     label: "เสนอฟีเจอร์ใหม่",    desc: "อยากให้ระบบมีความสามารถอะไรเพิ่ม" },
  { value: "improvement", label: "ปรับปรุงฟีเจอร์เดิม", desc: "ฟีเจอร์ที่มีอยู่แล้วแต่อยากให้ดีขึ้น" },
  { value: "other",       label: "อื่นๆ",               desc: "คำถาม ข้อสงสัย หรือความคิดเห็นทั่วไป" },
];

const priorityOptions = [
  { value: "Low",    label: "ไม่เร่งด่วน" },
  { value: "Medium", label: "ปานกลาง" },
  { value: "High",   label: "เร่งด่วน" },
];

interface AttachmentItem {
  url: string;
  name: string;
}

export default function FeedbackPage(): React.ReactNode {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { document.title = "เปิด Ticket ใหม่ | ระบบจัดการ"; }, []);

  const [type, setType]         = useState<FeedbackType | null>(null);
  const [priority, setPriority] = useState("Medium");
  const [subject, setSubject]   = useState("");
  const [detail, setDetail]     = useState("");
  const [bugUrl, setBugUrl]     = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  const handleUpload = async (files: FileList) => {
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();

      const results = await Promise.all(
        toUpload.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${API_URL}/admin/upload/image?folder=support`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token ?? ""}` },
            body: formData,
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          return { url: json.data.url as string, name: file.name };
        })
      );

      setAttachments((prev) => [...prev, ...results]);
    } catch {
      setError("อัปโหลดบางไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAttachment = (url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
  };

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!type || !subject.trim() || !detail.trim()) {
      setError("กรุณาเลือกประเภทและกรอกข้อมูลให้ครบ");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fullDescription = type === "bug" && bugUrl.trim()
        ? `${detail.trim()}\n\nURL ที่เกิดปัญหา: ${bugUrl.trim()}`
        : detail.trim();

      const res = await api.post<{ id: string }>("/admin/support/tickets", {
        subject:     subject.trim(),
        description: fullDescription,
        type:        TYPE_MAP[type],
        priority,
        attachments: attachments.map((a) => a.url),
      });
      router.push(`/dashboard/support/tickets/${res.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/dashboard/support/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-600 transition-colors mb-3 group"
        >
          <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          ตั๋วสนับสนุน
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">เปิด Ticket ใหม่</h1>
        <p className="text-slate-500 mt-2 text-sm">แจ้งปัญหา ขอฟีเจอร์ หรือส่งคำถามให้ทีมงาน — เราจะตอบกลับโดยเร็วที่สุด</p>
      </div>

      {/* Step 1: Select type */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">ประเภท</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {feedbackTypes.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setType(ft.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                type === ft.value
                  ? "border-blue-600 bg-blue-50/50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className={`text-sm font-bold ${type === ft.value ? "text-blue-600" : "text-slate-900"}`}>{ft.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{ft.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Detail form */}
      {type && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">รายละเอียด</h2>
          </div>
          <div className="p-6 space-y-6">
            <FormInput
              label="หัวข้อ"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={type === "bug" ? "เช่น กดบันทึกทริปแล้ว error" : type === "feature" ? "เช่น อยากให้มีระบบจัดการค่าใช้จ่าย" : "สรุปสั้นๆ"}
            />

            <FormTextarea
              label="รายละเอียด"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={type === "bug"
                ? "อธิบายขั้นตอนที่ทำให้เกิดปัญหา:\n1. เข้าหน้า...\n2. กดปุ่ม...\n3. เกิด error..."
                : type === "feature"
                  ? "อธิบายสิ่งที่อยากได้:\n- ใช้งานยังไง\n- ช่วยแก้ปัญหาอะไร\n- ตัวอย่างจากระบบอื่น (ถ้ามี)"
                  : "อธิบายเพิ่มเติม..."}
              rows={6}
            />

            {type === "bug" && (
              <FormInput
                label="URL หน้าที่เกิดปัญหา"
                value={bugUrl}
                onChange={(e) => setBugUrl(e.target.value)}
                placeholder="เช่น /dashboard/trips/new"
                icon="link"
              />
            )}

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">ระดับความสำคัญ</label>
              <div className="flex gap-2">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      priority === p.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-file attachment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  แนบภาพหน้าจอ (ไม่บังคับ)
                </label>
                <span className="text-xs text-slate-400">{attachments.length}/{MAX_ATTACHMENTS}</span>
              </div>

              {/* Thumbnail grid */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {attachments.map((a) => (
                    <div key={a.url} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.url)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-white text-xl">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone — hide when max reached */}
              {attachments.length < MAX_ATTACHMENTS && (
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    uploading
                      ? "border-blue-300 bg-blue-50/30"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                  }`}>
                    {uploading
                      ? <span className="material-symbols-outlined text-2xl text-blue-400 animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-2xl text-slate-300">add_photo_alternate</span>
                    }
                    <p className="text-sm text-slate-400 mt-1">
                      {uploading ? "กำลังอัปโหลด..." : `คลิกหรือลากไฟล์มาวางที่นี่`}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">JPEG, PNG, WebP ≤ 8MB · เพิ่มได้อีก {MAX_ATTACHMENTS - attachments.length} ไฟล์</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); }}
                  />
                </label>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !detail.trim()}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {submitting ? "กำลังส่ง..." : "ส่ง Ticket"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
