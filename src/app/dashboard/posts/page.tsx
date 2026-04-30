"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { FilterTabs, EmptyState, ConfirmDialog, PageSkeleton, useToast } from "@/components/shared";
import type { PostStatus } from "@/types";

type FilterTab = "all" | PostStatus;

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
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<PostStatus, { label: string; cls: string }> = {
  published: { label: "เปิดรับ", cls: "bg-emerald-500" },
  draft: { label: "ร่าง", cls: "bg-amber-500" },
  closed: { label: "ปิดรับแล้ว", cls: "bg-slate-500" },
};

function formatPrice(n: number): string {
  return n.toLocaleString("th-TH");
}

export default function PostsPage(): React.ReactNode {
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get<PostResponse[]>("/admin/posts")
      .then(setPosts)
      .catch((err) => toast(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() =>
    posts
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) =>
        search === ""
        || p.title.toLowerCase().includes(search.toLowerCase())
        || (p.destination?.toLowerCase().includes(search.toLowerCase()) ?? false)
      ),
    [posts, filter, search]
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/posts/${deleteTarget.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast("ลบแพ็กเกจเรียบร้อยแล้ว", "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">แพ็กเกจทัวร์</h1>
        </div>
        <Link href="/dashboard/posts/new" className="px-5 py-3 bg-(--primary) text-white rounded-xl font-bold text-sm hover:opacity-95 transition-colors shadow-sm flex items-center gap-2 w-fit">
          <span className="material-symbols-outlined text-lg">add</span>
          สร้างแพ็กเกจใหม่
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
            placeholder="ค้นหาแพ็กเกจ หรือจุดหมาย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterTabs
          tabs={[
            { value: "all" as FilterTab, label: "ทั้งหมด" },
            { value: "published" as FilterTab, label: "เปิดรับ" },
            { value: "draft" as FilterTab, label: "ร่าง" },
            { value: "closed" as FilterTab, label: "ปิดรับแล้ว" },
          ]}
          active={filter}
          onChange={setFilter}
        />
      </div>

      {/* Post Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={search ? "search_off" : "flight_takeoff"}
          title={search ? `ไม่พบ "${search}"` : "ยังไม่มีแพ็กเกจทัวร์"}
          description={search ? "ลองค้นหาด้วยคำอื่น" : "สร้างแพ็กเกจทัวร์แรกเพื่อเปิดรับลูกค้าใหม่"}
          actionLabel="สร้างแพ็กเกจใหม่"
          actionHref="/dashboard/posts/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post) => {
            const cfg = statusConfig[post.status];
            return (
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
                  <div className="absolute top-3 left-3">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm text-white ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {post.destination && (
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {post.destination}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-4 flex flex-col">
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-(--primary) transition-colors">{post.title}</h3>

                  {/* Price + Duration */}
                  {post.price !== null && (
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-lg font-extrabold text-(--primary)">฿{formatPrice(post.price)}</span>
                      <span className="text-[11px] text-slate-400">/ท่าน</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                    {post.duration && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {post.duration}
                      </span>
                    )}
                    {post.travelPeriod && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">date_range</span>
                        {post.travelPeriod}
                      </span>
                    )}
                    {post.slots !== null && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        {post.slots} คน
                      </span>
                    )}
                  </div>

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
                      {post.viewCount > 0 && `${post.viewCount.toLocaleString()} views`}
                      {post.viewCount > 0 && post.inquiryCount > 0 && " · "}
                      {post.inquiryCount > 0 && `${post.inquiryCount} สนใจ`}
                    </span>
                    <div className="flex gap-1">
                      <Link href={`/dashboard/posts/${post.id}/edit`} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </Link>
                      <button onClick={() => setDeleteTarget(post)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Create Card */}
          <Link href="/dashboard/posts/new" className="group rounded-2xl border-2 border-dashed border-slate-200 hover:border-(--primary)/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-(--primary-container)/20">
            <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-(--primary) transition-colors mb-3">add</span>
            <p className="font-bold text-slate-500 text-sm">สร้างแพ็กเกจใหม่</p>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`ลบ "${deleteTarget?.title ?? "แพ็กเกจ"}"?`}
        description="แพ็กเกจจะถูกลบออกจากระบบและ Marketplace ถาวร"
        confirmLabel={deleting ? "กำลังลบ..." : "ลบแพ็กเกจ"}
        variant="danger"
      />
    </div>
  );
}
