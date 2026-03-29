"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { mockPosts } from "@/lib/mock-data";
import { FormInput, FormTextarea, ImageUpload, useToast } from "@/components/shared";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const post = mockPosts.find((p) => p.id === id);

  const [highlights, setHighlights] = useState<string[]>(post?.highlights ?? [""]);

  if (!post) return <div className="p-12 text-center text-slate-400">ไม่พบแพ็กเกจนี้</div>;

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

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => router.push("/dashboard/posts")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าแพ็กเกจ
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">แก้ไขแพ็กเกจ</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Cover Image */}
        <ImageUpload
          value={post.images[0] ?? null}
          onChange={() => {}}
          aspect="video"
          label="รูปปกแพ็กเกจ"
          hint="แนะนำ: 1200x630px"
        />

        {/* Additional Images */}
        {post.images.length > 1 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">รูปเพิ่มเติม</label>
            <div className="flex gap-2 overflow-x-auto">
              {post.images.slice(1).map((img, i) => (
                <div key={i} className="relative w-24 h-24 min-w-24 rounded-xl overflow-hidden border border-slate-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[12px]">close</span>
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 min-w-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                <span className="material-symbols-outlined text-slate-300">add_photo_alternate</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        )}

        <FormInput label="ชื่อแพ็กเกจ" defaultValue={post.title} />
        <FormInput label="จุดหมายปลายทาง" defaultValue={post.destination} />

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ระยะเวลา" defaultValue={post.duration} />
          <FormInput label="ช่วงเดินทาง" defaultValue={post.travelPeriod} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="ราคาเริ่มต้น (บาท)" type="number" defaultValue={String(post.priceStartFrom)} />
          <FormInput label="จำนวนที่รับ (คน)" type="number" defaultValue={String(post.totalSlots)} />
        </div>

        <FormTextarea label="รายละเอียด" rows={5} defaultValue={post.description} />

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

        <FormInput label="แท็ก" defaultValue={post.tags.join(", ")} />

        {/* Slug */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">ลิงก์แชร์</label>
          <div className="flex items-center gap-0 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <span className="text-xs text-slate-400 pl-4 whitespace-nowrap">/p/amazing-tour/</span>
            <input
              defaultValue={post.slug}
              className="flex-1 bg-transparent py-2.5 px-1 pr-4 text-sm outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400 px-1">URL สำหรับแชร์แพ็กเกจบน Marketplace (slug อยู่ภายใต้ชื่อบริษัทของคุณ)</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput label="จำนวนที่รับทั้งหมด (คน)" type="number" defaultValue={String(post.totalSlots)} />
          <FormInput label="ที่ว่างคงเหลือ (คน)" type="number" defaultValue={String(post.slotsLeft)} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => { toast("บันทึกร่างแล้ว"); router.push("/dashboard/posts"); }} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            บันทึกร่าง
          </button>
          <button onClick={() => { toast("อัปเดตแพ็กเกจแล้ว"); router.push("/dashboard/posts"); }} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            {post.status === "published" ? "อัปเดต" : post.status === "closed" ? "เปิดรับใหม่" : "เผยแพร่"}
          </button>
        </div>
      </div>
    </div>
  );
}
