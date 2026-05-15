"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";

interface Post {
  id: string;
  title: string;
  destination: string;
  description: string | null;
  images: string[];
  price: number | null;
  duration: number | null;
  travelPeriod: string | null;
  slots: number | null;
  tags: string[];
}

export default function PostsPage(): React.ReactNode {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Post[]>("/client/posts?pageSize=50")
      .then(setPosts)
      .catch(() => {/* silently ignore */})
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.destination.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-(--surface)">
      {/* Header */}
      <div className="bg-white border-b border-(--outline-variant)/20 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h1 className="text-2xl font-black text-(--on-surface)">แพ็กเกจทัวร์</h1>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-(--outline) text-lg">search</span>
            <input
              className="w-full bg-(--surface-container-low) border border-(--outline-variant)/30 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20"
              placeholder="ค้นหา ชื่อ จุดหมาย แท็ก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-(--outline-variant) block mb-4">flight_takeoff</span>
            <p className="text-(--on-surface-variant)">
              {search ? `ไม่พบแพ็กเกจสำหรับ "${search}"` : "ยังไม่มีแพ็กเกจทัวร์"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-(--outline-variant)/10"
              >
                <div className="relative aspect-video overflow-hidden bg-(--surface-variant)">
                  {post.images[0] ? (
                    <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-(--outline-variant)">photo</span>
                    </div>
                  )}
                  {post.slots != null && post.slots > 0 && (
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-(--primary) text-[10px] font-bold px-2 py-0.5 rounded-full">
                      เหลือ {post.slots} ที่
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-[15px] text-(--on-surface) line-clamp-1 group-hover:text-(--primary) transition-colors">{post.title}</h3>
                  <p className="text-xs text-(--on-surface-variant) mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {post.destination}
                  </p>

                  {post.description && (
                    <p className="text-xs text-(--on-surface-variant) mt-2 line-clamp-2 flex-1">{post.description}</p>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-(--primary)/8 text-(--primary) px-2 py-0.5 rounded-full font-medium">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-(--outline-variant)/20">
                    {post.price != null ? (
                      <span className="text-base font-extrabold text-(--primary)">฿{post.price.toLocaleString()}</span>
                    ) : (
                      <span className="text-xs text-(--on-surface-variant)">ติดต่อสอบถาม</span>
                    )}
                    {post.duration != null && (
                      <span className="text-xs text-(--on-surface-variant) flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {post.duration} วัน
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
