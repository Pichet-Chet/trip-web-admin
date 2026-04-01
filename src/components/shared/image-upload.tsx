"use client";

import { useRef, useState } from "react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  uploadUrl?: string;
  folder?: string;
  label?: string;
  hint?: string;
  aspect?: "square" | "video" | "wide";
  presets?: { label: string; url: string }[];
}

const aspectClass = {
  square: "aspect-square w-32 md:w-40",
  video: "aspect-video w-full",
  wide: "aspect-video lg:aspect-21/9 w-full",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";

export function ImageUpload({
  value,
  onChange,
  uploadUrl,
  folder = "general",
  label,
  hint,
  aspect = "square",
  presets,
}: ImageUploadProps): React.ReactNode {
  const isSquare = aspect === "square";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("รองรับเฉพาะ JPEG, PNG, WebP, GIF");
      return;
    }
    if (file.size > maxSize) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5 MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const { getValidToken } = await import("@/lib/auth");
      const token = await getValidToken();

      const endpoint = uploadUrl || `${API_URL}/admin/upload/image?folder=${folder}`;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (json.success && json.data) {
        onChange(json.data.url || json.data.logoUrl || json.data);
      } else {
        setError(json.error || "อัปโหลดไม่สำเร็จ");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={isSquare ? "flex flex-col items-center gap-4" : "space-y-4"}>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />

      <div className={isSquare ? "" : "grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className={`${isSquare ? "" : "lg:col-span-8"} group relative overflow-hidden rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer ${aspectClass[aspect]}`}
        >
          {uploading ? (
            <div className="text-center space-y-2 z-10 p-4">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-semibold text-slate-500">กำลังอัปโหลด...</p>
            </div>
          ) : value ? (
            <>
              <img src={value} alt={label ?? "Upload"} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full text-sm font-bold">
                  เปลี่ยนรูป
                </span>
              </div>
            </>
          ) : (
            <div className="text-center space-y-2 z-10 p-4">
              <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
              {label && <p className="text-sm font-semibold text-slate-700">{label}</p>}
              {hint && <p className="text-xs text-slate-400">{hint}</p>}
            </div>
          )}

          {/* กดที่รูปเพื่อเปลี่ยน — ไม่ต้องมีปุ่ม edit ซ้อน */}
        </div>

        {presets && !isSquare && (
          <div className="lg:col-span-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ภาพสำเร็จรูป</p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange(p.url)}
                  className="group/preset relative h-24 rounded-xl overflow-hidden shadow-sm hover:ring-2 ring-blue-600 ring-offset-2 transition-all"
                >
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover/preset:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{p.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
