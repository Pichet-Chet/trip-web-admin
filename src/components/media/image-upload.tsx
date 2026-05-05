"use client";

import { useRef, useState } from "react";
import { MediaLibraryModal } from "./media-library-modal";

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
  const [showLibrary, setShowLibrary] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
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

      // Use media endpoint for tracking
      const endpoint = uploadUrl || `${API_URL}/admin/media/upload?folder=${folder}`;
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

      <div className={isSquare ? "" : presets ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : ""}>
        <div
          className={`${isSquare ? "" : presets ? "lg:col-span-8" : ""} relative overflow-hidden rounded-2xl bg-white border-2 border-dashed border-(--outline-variant)/30 transition-all ${aspectClass[aspect]}`}
        >
          {uploading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 z-10 p-4">
              <div className="w-8 h-8 border-3 border-(--primary) border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-(--on-surface-variant)">กำลังอัปโหลด...</p>
            </div>
          ) : value ? (
            <>
              <img src={value} alt={label ?? "Upload"} className="absolute inset-0 w-full h-full object-cover" />
              {isSquare ? (
                /* Square / avatar — icon-only round buttons so text doesn't
                   wrap into a "two-circle" blob in tight containers. */
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-(--on-surface) shadow-sm hover:bg-white transition-colors"
                    title="อัปโหลดใหม่"
                    aria-label="อัปโหลดใหม่"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">photo_camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLibrary(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/95 text-(--on-surface) shadow-sm hover:bg-white transition-colors"
                    title="เลือกจากคลังสื่อ"
                    aria-label="เลือกจากคลังสื่อ"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">photo_library</span>
                  </button>
                </div>
              ) : (
                /* Wide / cover — full-text pills, plenty of horizontal room. */
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="bg-white/90 text-(--on-surface) px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-white transition-colors whitespace-nowrap"
                  >
                    อัปโหลดใหม่
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLibrary(true)}
                    className="bg-white/90 text-(--on-surface) px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-white transition-colors whitespace-nowrap"
                  >
                    คลังสื่อ
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 z-10 p-4">
              <span className="material-symbols-outlined text-3xl text-(--outline-variant)">add_photo_alternate</span>
              {label && <p className="text-sm font-semibold text-(--on-surface-variant)">{label}</p>}
              {hint && <p className="text-xs text-(--on-surface-variant)">{hint}</p>}
              <div className={`flex gap-2 ${isSquare ? "flex-col w-full max-w-[160px]" : ""}`}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-(--primary) text-(--on-primary) text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  อัปโหลด
                </button>
                <button
                  type="button"
                  onClick={() => setShowLibrary(true)}
                  className="px-4 py-2 rounded-xl bg-(--surface-variant) text-(--on-surface-variant) text-xs font-bold hover:bg-(--surface-variant)/80 transition-colors whitespace-nowrap"
                >
                  คลังสื่อ
                </button>
              </div>
            </div>
          )}
        </div>

        {presets && !isSquare && (
          <div className="lg:col-span-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-(--on-surface-variant)">ภาพสำเร็จรูป</p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange(p.url)}
                  className="group/preset relative h-24 rounded-xl overflow-hidden shadow-sm hover:ring-2 ring-(--primary) ring-offset-2 transition-all"
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

      {/* Media Library Modal */}
      <MediaLibraryModal
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(url) => onChange(url)}
        folder={folder}
      />
    </div>
  );
}
