"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";

interface Post {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  highlights: string | null;
  images: string[];
  price: number | null;
  duration: number | null;
  travelPeriod: string | null;
  slots: number | null;
  tags: string[];
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get<Post>(`/client/posts/${id}`)
      .then(setPost)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-(--surface)">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  if (notFound || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-(--surface) gap-4 p-8">
      <span className="material-symbols-outlined text-6xl text-(--outline-variant)">search_off</span>
      <h1 className="text-xl font-bold text-(--on-surface)">ไม่พบแพ็กเกจนี้</h1>
      <Link href="/posts" className="text-(--primary) text-sm font-bold hover:underline">ดูแพ็กเกจทั้งหมด</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-(--surface)">
      {/* Back nav */}
      <div className="bg-white border-b border-(--outline-variant)/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/posts" className="material-symbols-outlined text-(--on-surface-variant) hover:text-(--primary) transition-colors">arrow_back</Link>
          <span className="text-sm font-bold text-(--on-surface) truncate">{post.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Image Gallery */}
        {post.images.length > 0 && (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-(--surface-variant) shadow-md">
              <img src={post.images[activeImg]} alt={post.title} className="w-full h-full object-cover" />
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + post.images.length) % post.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % post.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {post.images.map((_, i) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? "bg-white w-4" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {post.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {post.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? "border-(--primary)" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Info */}
        <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm border border-(--outline-variant)/20">
          <div>
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[11px] bg-(--primary)/8 text-(--primary) px-2.5 py-0.5 rounded-full font-medium">{tag}</span>
              ))}
            </div>
            <h1 className="text-2xl font-black text-(--on-surface)">{post.title}</h1>
            <p className="text-sm text-(--on-surface-variant) mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              {post.destination}
            </p>
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {post.price != null && (
              <div className="text-center p-3 rounded-xl bg-(--primary)/5">
                <p className="text-2xl font-black text-(--primary)">฿{post.price.toLocaleString()}</p>
                <p className="text-xs text-(--on-surface-variant)">ราคาต่อท่าน</p>
              </div>
            )}
            {post.duration != null && (
              <div className="text-center p-3 rounded-xl bg-(--surface-container-low)">
                <p className="text-2xl font-black text-(--on-surface)">{post.duration}</p>
                <p className="text-xs text-(--on-surface-variant)">วัน</p>
              </div>
            )}
            {post.slots != null && (
              <div className="text-center p-3 rounded-xl bg-(--surface-container-low)">
                <p className="text-2xl font-black text-(--on-surface)">{post.slots}</p>
                <p className="text-xs text-(--on-surface-variant)">ที่นั่งว่าง</p>
              </div>
            )}
          </div>

          {post.travelPeriod && (
            <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>ช่วงเดินทาง: <strong className="text-(--on-surface)">{post.travelPeriod}</strong></span>
            </div>
          )}
        </div>

        {/* Description */}
        {post.description && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-(--outline-variant)/20 space-y-2">
            <h2 className="font-bold text-(--on-surface)">รายละเอียด</h2>
            <p className="text-sm text-(--on-surface-variant) whitespace-pre-line leading-relaxed">{post.description}</p>
          </div>
        )}

        {/* Highlights */}
        {post.highlights && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-(--outline-variant)/20 space-y-2">
            <h2 className="font-bold text-(--on-surface) flex items-center gap-2">
              <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ไฮไลต์
            </h2>
            <p className="text-sm text-(--on-surface-variant) whitespace-pre-line leading-relaxed">{post.highlights}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-(--outline-variant)/20 text-center space-y-3">
          <p className="text-(--on-surface-variant) text-sm">สนใจแพ็กเกจนี้? ติดต่อผู้จัดทริปได้เลย</p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 border border-(--outline-variant)/40 text-(--on-surface-variant) px-6 py-2.5 rounded-full text-sm font-bold hover:bg-(--surface-container-low) transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            ดูแพ็กเกจอื่น
          </Link>
        </div>
      </div>
    </div>
  );
}
