"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea, ImageUpload, useToast } from "@/components/shared";
import type { PostCategory } from "@/types";

const categories: { value: PostCategory; label: string; desc: string }[] = [
  { value: "promotion", label: "โปรโมชั่น", desc: "เปิดรับสมัครทริป ราคาพิเศษ ลดราคา" },
  { value: "review", label: "รีวิว", desc: "ภาพบรรยากาศ ความประทับใจจากทริปที่ผ่านมา" },
  { value: "knowledge", label: "ความรู้", desc: "เคล็ดลับ สิ่งที่ต้องเตรียม ข้อมูลท่องเที่ยว" },
  { value: "announcement", label: "ประกาศ", desc: "ข่าวสาร อัปเดตจากบริษัท" },
];

export default function NewPostPage(): React.ReactNode {
  const router = useRouter();
  const { toast } = useToast();
  const [category, setCategory] = useState<PostCategory | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  function handlePublish(): void {
    toast("เผยแพร่โพสต์แล้ว");
    router.push("/dashboard/posts");
  }

  function handleDraft(): void {
    toast("บันทึกร่างแล้ว");
    router.push("/dashboard/posts");
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => router.push("/dashboard/posts")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าโพสต์
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">สร้างโพสต์ใหม่</h1>
        <p className="text-slate-500 mt-2 text-sm">สร้าง content เพื่อโปรโมททริปและดึงลูกค้าใหม่ผ่าน Marketplace</p>
      </div>

      {/* Category */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-900">ประเภทโพสต์</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                category === c.value ? "border-blue-600 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className={`text-sm font-bold ${category === c.value ? "text-blue-600" : "text-slate-900"}`}>{c.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Content Form — show after category selected */}
      {category && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h2 className="font-bold text-slate-900">เนื้อหา</h2>

          {/* Cover Image */}
          <ImageUpload
            value={coverUrl}
            onChange={setCoverUrl}
            aspect="video"
            label="อัปโหลดรูปปก"
            hint="แนะนำ: 1200x630px สำหรับ SEO และ social share"
          />

          {/* Additional Images */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">รูปเพิ่มเติม (ไม่บังคับ)</label>
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center transition-colors hover:bg-blue-50/30">
                <span className="material-symbols-outlined text-xl text-slate-300">add_photo_alternate</span>
                <p className="text-xs text-slate-400 mt-1">เพิ่มรูปภาพ (สูงสุด 10 รูป)</p>
              </div>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </div>

          <FormInput label="หัวข้อ" placeholder={
            category === "promotion" ? "เช่น เปิดรับสมัคร! ทริปญี่ปุ่นใบไม้เปลี่ยนสี ต.ค. 2569" :
            category === "review" ? "เช่น รีวิวทริป Seoul Autumn จากลูกทริปของเรา" :
            category === "knowledge" ? "เช่น 5 สิ่งที่ต้องเตรียมก่อนไปญี่ปุ่น" :
            "หัวข้อโพสต์"
          } />

          <FormTextarea label="เนื้อหา" rows={6} placeholder={
            category === "promotion" ? "รายละเอียดทริป ราคา จำนวนที่รับ..." :
            category === "review" ? "เล่าประสบการณ์ ความประทับใจ..." :
            category === "knowledge" ? "เคล็ดลับ ข้อมูลที่เป็นประโยชน์..." :
            "เนื้อหาโพสต์..."
          } />

          <FormInput label="แท็ก" placeholder="เช่น ญี่ปุ่น, ใบไม้เปลี่ยนสี, โตเกียว (คั่นด้วย comma)" />

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={handleDraft} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              บันทึกร่าง
            </button>
            <button onClick={handlePublish} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
              เผยแพร่โพสต์
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
