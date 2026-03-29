"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea, ImageUpload, useToast } from "@/components/shared";

export default function NewPostPage(): React.ReactNode {
  const router = useRouter();
  const { toast } = useToast();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([""]);

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

  function handlePublish(): void {
    toast("เผยแพร่แพ็กเกจแล้ว");
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
          กลับหน้าแพ็กเกจ
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">สร้างแพ็กเกจทัวร์ใหม่</h1>
        <p className="text-slate-500 mt-2 text-sm">ลงข้อมูลทริปเพื่อเปิดรับสมัครลูกค้าผ่าน Marketplace</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Cover Image */}
        <ImageUpload
          value={coverUrl}
          onChange={setCoverUrl}
          aspect="video"
          label="รูปปกแพ็กเกจ"
          hint="แนะนำ: 1200x630px เพื่อแสดงผลสวยบน Marketplace"
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

        <FormInput label="ชื่อแพ็กเกจ" placeholder="เช่น ทริปญี่ปุ่นใบไม้เปลี่ยนสี โตเกียว — ฟูจิ — เกียวโต" />
        <FormInput label="จุดหมายปลายทาง" placeholder="เช่น ญี่ปุ่น, เกาหลีใต้, เชียงใหม่" />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ระยะเวลา" placeholder="เช่น 5 วัน 4 คืน" />
          <FormInput label="ช่วงเดินทาง" placeholder="เช่น ต.ค. — พ.ย. 2569" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ราคาเริ่มต้น (บาท)" type="number" placeholder="เช่น 32900" />
          <FormInput label="จำนวนที่รับ (คน)" type="number" placeholder="เช่น 25" />
        </div>

        <FormTextarea label="รายละเอียด" rows={5} placeholder="อธิบายรายละเอียดทริป สิ่งที่รวมอยู่ในราคา จุดเด่น..." />

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
                className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {highlights.length > 1 && (
                <button onClick={() => removeHighlight(idx)} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          ))}
          {highlights.length < 8 && (
            <button onClick={addHighlight} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">add</span>
              เพิ่มไฮไลท์
            </button>
          )}
        </div>

        <FormInput label="แท็ก" placeholder="เช่น ญี่ปุ่น, ใบไม้เปลี่ยนสี, โตเกียว (คั่นด้วย comma)" />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={handleDraft} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            บันทึกร่าง
          </button>
          <button onClick={handlePublish} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            เผยแพร่แพ็กเกจ
          </button>
        </div>
      </div>
    </div>
  );
}
