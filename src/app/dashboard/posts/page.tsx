"use client";

import { useState } from "react";
import Link from "next/link";
import { mockPosts } from "@/lib/mock-data";
import { FilterTabs, EmptyState, ConfirmDialog, useToast } from "@/components/shared";
import type { PostStatus } from "@/types";

type FilterTab = "all" | "published" | "draft";

const categoryLabel: Record<string, string> = {
  promotion: "โปรโมชั่น",
  review: "รีวิว",
  knowledge: "ความรู้",
  announcement: "ประกาศ",
};

export default function PostsPage(): React.ReactNode {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = mockPosts
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) => search === "" || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">โพสต์</h1>
          <p className="text-slate-500 mt-1 text-sm">สร้าง content โปรโมทเพื่อดึงลูกค้าใหม่ผ่าน Marketplace</p>
        </div>
        <Link href="/dashboard/posts/new" className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 w-fit">
          <span className="material-symbols-outlined text-lg">add</span>
          สร้างโพสต์
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="ค้นหาโพสต์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterTabs
          tabs={[
            { value: "all" as FilterTab, label: "ทั้งหมด" },
            { value: "published" as FilterTab, label: "เผยแพร่แล้ว" },
            { value: "draft" as FilterTab, label: "ร่าง" },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Post Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search ? "search_off" : "article"}
          title={search ? `ไม่พบ "${search}"` : "ยังไม่มีโพสต์"}
          description={search ? "ลองค้นหาด้วยคำอื่น" : "สร้างโพสต์แรกเพื่อโปรโมททริปของคุณ"}
          actionLabel="สร้างโพสต์"
          actionHref="/dashboard/posts/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => (
            <div key={post.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
              {/* Image */}
              <div className="relative aspect-16/10 overflow-hidden">
                {post.images[0] ? (
                  <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${post.status === "published" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                    {post.status === "published" ? "เผยแพร่" : "ร่าง"}
                  </span>
                  <span className="bg-white/90 text-slate-700 text-[9px] font-bold px-2 py-1 rounded-md shadow-sm">
                    {categoryLabel[post.category]}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 p-4 flex flex-col">
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">{post.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{post.content}</p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="flex-1" />

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    {post.viewCount > 0 && ` · ${post.viewCount} views`}
                    {post.inquiryCount > 0 && ` · ${post.inquiryCount} สนใจ`}
                  </span>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/posts/${post.id}/edit`} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </Link>
                    <button onClick={() => setDeleteTarget(post.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Create Card */}
          <Link href="/dashboard/posts/new" className="group rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-blue-50/30">
            <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-blue-500 transition-colors mb-3">add</span>
            <p className="font-bold text-slate-500 text-sm">สร้างโพสต์ใหม่</p>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => toast("ลบโพสต์เรียบร้อยแล้ว")}
        title="ลบโพสต์นี้?"
        description="โพสต์จะถูกลบออกจากระบบและ Marketplace"
        confirmLabel="ลบโพสต์"
        variant="danger"
      />
    </div>
  );
}
