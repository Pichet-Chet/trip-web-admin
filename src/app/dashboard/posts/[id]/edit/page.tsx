"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { mockPosts } from "@/lib/mock-data";
import { FormInput, FormTextarea, ImageUpload, useToast } from "@/components/shared";
import type { PostCategory } from "@/types";

const categories: { value: PostCategory; label: string }[] = [
  { value: "promotion", label: "โปรโมชั่น" },
  { value: "review", label: "รีวิว" },
  { value: "knowledge", label: "ความรู้" },
  { value: "announcement", label: "ประกาศ" },
];

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const post = mockPosts.find((p) => p.id === id);

  if (!post) return <div className="p-12 text-center text-slate-400">ไม่พบโพสต์นี้</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <button onClick={() => router.push("/dashboard/posts")} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          กลับหน้าโพสต์
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">แก้ไขโพสต์</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">ประเภท</label>
          <div className="flex gap-2">
            {categories.map((c) => (
              <span key={c.value} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${post.category === c.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Cover */}
        <ImageUpload
          value={post.images[0] ?? null}
          onChange={() => {}}
          aspect="video"
          label="รูปปก"
          hint="แนะนำ: 1200x630px"
        />

        <FormInput label="หัวข้อ" defaultValue={post.title} />
        <FormTextarea label="เนื้อหา" rows={6} defaultValue={post.content} />
        <FormInput label="แท็ก" defaultValue={post.tags.join(", ")} />

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => { toast("บันทึกร่างแล้ว"); router.push("/dashboard/posts"); }} className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            บันทึกร่าง
          </button>
          <button onClick={() => { toast("อัปเดตโพสต์แล้ว"); router.push("/dashboard/posts"); }} className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
            {post.status === "published" ? "อัปเดต" : "เผยแพร่"}
          </button>
        </div>
      </div>
    </div>
  );
}
