"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, ApiError } from "@/lib/api";
import { FilterTabs, EmptyState, ErrorState, ConfirmDialog, PageSkeleton, useToast } from "@/components/shared";
import type { PostStatus } from "@/types";
import { usePageTitle } from "@/lib/hooks/use-page-title";

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
  closed: { label: "ปิดรับแล้ว", cls: "bg-slate-400" },
};

function formatPrice(n: number): string {
  return n.toLocaleString("th-TH");
}

export default function PostsPage(): React.ReactNode {
  usePageTitle("แพ็กเกจทัวร์");
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<PostResponse[]>("/admin/posts")
      .then(setPosts)
      .catch((err) => setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
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
      toast.success("ลบแพ็กเกจเรียบร้อยแล้ว");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--outline) text-lg">search</span>
          <input
            className="w-full bg-white border border-(--outline-variant)/30 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary)"
            placeholder="ค้นหาแพ็กเกจ หรือจุดหมาย..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FilterTabs
          tabs={[
            { id: "all" as FilterTab, label: `ทั้งหมด (${posts.length})` },
            { id: "published" as FilterTab, label: `เปิดรับ (${posts.filter(p => p.status === "published").length})` },
            { id: "draft" as FilterTab, label: `ร่าง (${posts.filter(p => p.status === "draft").length})` },
            { id: "closed" as FilterTab, label: "ปิดรับแล้ว" },
          ]}
          activeTab={filter}
          onTabChange={(v) => setFilter(v as FilterTab)}
        />
      </div>

      {/* Post Grid */}
      {filtered.length === 0 && posts.length > 0 ? (
        <EmptyState
          icon={search ? "search_off" : "filter_list_off"}
          title={search ? `ไม่พบ "${search}"` : "ไม่มีแพ็กเกจในหมวดนี้"}
          description={search ? "ลองค้นหาด้วยคำอื่น" : "ลองเปลี่ยนตัวกรอง"}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Create Slot — ตำแหน่งแรกเสมอ */}
          <Link
            href="/dashboard/posts/new"
            className="group rounded-2xl border-2 border-dashed border-(--outline-variant)/30 hover:border-(--primary)/40 flex flex-col items-center justify-center min-h-70 transition-all duration-300 hover:bg-(--primary)/3"
          >
            <div className="w-12 h-12 rounded-xl bg-(--primary)/8 flex items-center justify-center text-(--primary) group-hover:scale-110 transition-transform mb-3">
              <span className="material-symbols-outlined text-2xl">add</span>
            </div>
            <p className="font-bold text-(--on-surface) text-sm">สร้างแพ็กเกจใหม่</p>
            <p className="text-[11px] text-(--on-surface-variant) mt-0.5">เพิ่มแพ็กเกจทัวร์ใหม่</p>
          </Link>

          {/* Post Cards */}
          {filtered.map((post) => {
            const cfg = statusConfig[post.status];
            return (
              <div key={post.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-(--outline-variant)/60 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Image */}
                <div className="relative aspect-16/10 overflow-hidden">
                  {post.images[0] ? (
                    <Image src={post.images[0]} alt={post.title} fill sizes="(max-width:768px) 100vw, 400px" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-(--surface-variant) to-(--outline-variant)/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-(--outline-variant)">image</span>
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                  {post.destination && (
                    <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-(--on-surface) text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                      {post.destination}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-4 flex flex-col">
                  <Link href={`/dashboard/posts/${post.id}/edit`} className="min-w-0">
                    <h3 className="font-bold text-[15px] text-(--on-surface) leading-snug line-clamp-1 group-hover:text-(--primary) transition-colors">{post.title}</h3>
                  </Link>

                  {post.price !== null && (
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-lg font-extrabold text-(--primary)">฿{formatPrice(post.price)}</span>
                      <span className="text-[11px] text-(--outline)">/ท่าน</span>
                    </div>
                  )}

                  <p className="text-[12px] text-(--outline) mt-1 flex flex-wrap gap-x-2">
                    {post.duration && <span>{post.duration}</span>}
                    {post.slots !== null && <span>{post.slots} คน</span>}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] font-medium text-(--outline) bg-(--surface-container-low) px-2 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex-1" />

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-(--outline-variant)/20">
                    <span className="text-[11px] text-(--outline)">
                      {post.viewCount > 0 && `${post.viewCount.toLocaleString()} views`}
                      {post.viewCount > 0 && post.inquiryCount > 0 && " · "}
                      {post.inquiryCount > 0 && `${post.inquiryCount} สนใจ`}
                    </span>
                    <div className="flex gap-1">
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="w-7 h-7 rounded-lg hover:bg-(--surface-variant) flex items-center justify-center text-(--outline) hover:text-(--on-surface) transition-colors"
                        aria-label={`แก้ไข ${post.title}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(post)}
                        disabled={deleting}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-(--outline) hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`ลบ ${post.title}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-(--outline) text-sm">ยังไม่มีแพ็กเกจทัวร์ — สร้างแพ็กเกจแรกของคุณได้เลย</p>
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
