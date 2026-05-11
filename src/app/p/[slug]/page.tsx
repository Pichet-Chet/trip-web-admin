"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/client-api";

interface Trip {
  id: string;
  title: string;
  destination: string;
  slug: string;
  coverImageUrl: string | null;
}

interface Post {
  id: string;
  title: string;
  destination: string;
  price: number | null;
  duration: number | null;
  images: { url: string; sortOrder: number }[];
}

interface Portfolio {
  name: string;
  accountType: string;
  logoUrl: string | null;
  phone: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  trips: Trip[];
  posts: Post[];
}

function AccountTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Company: { label: "บริษัททัวร์", cls: "bg-blue-100 text-blue-700" },
    FreelanceGuide: { label: "ไกด์อิสระ", cls: "bg-violet-100 text-violet-700" },
    Personal: { label: "จัดทริปส่วนตัว", cls: "bg-emerald-100 text-emerald-700" },
  };
  const info = map[type] ?? { label: type, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${info.cls}`}>{info.label}</span>
  );
}

export default function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get<Portfolio>(`/client/portfolio/${encodeURIComponent(slug)}`)
      .then(setPortfolio)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-(--surface)">
      <div className="text-(--outline) animate-pulse">กำลังโหลด...</div>
    </div>
  );

  if (notFound || !portfolio) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-(--surface) gap-4 p-8">
      <span className="material-symbols-outlined text-6xl text-(--outline-variant)">person_off</span>
      <h1 className="text-xl font-bold text-(--on-surface)">ไม่พบ Portfolio นี้</h1>
      <p className="text-sm text-(--on-surface-variant)">อาจถูกปิดหรือ URL ไม่ถูกต้อง</p>
      <Link href="/" className="text-(--primary) text-sm font-bold hover:underline">กลับหน้าหลัก</Link>
    </div>
  );

  const hasContact = portfolio.phone || portfolio.lineId || portfolio.facebookUrl || portfolio.instagramUrl || portfolio.websiteUrl;

  return (
    <div className="min-h-screen bg-(--surface)">
      {/* Hero */}
      <div className="bg-white border-b border-(--outline-variant)/20">
        <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-(--primary-container) flex items-center justify-center shrink-0 overflow-hidden shadow-md">
            {portfolio.logoUrl ? (
              <img src={portfolio.logoUrl} alt={portfolio.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-(--primary)">{portfolio.name.charAt(0)}</span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-2">
              <h1 className="text-2xl md:text-3xl font-black text-(--on-surface)">{portfolio.name}</h1>
              <AccountTypeBadge type={portfolio.accountType} />
            </div>
            {hasContact && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {portfolio.phone && (
                  <a href={`tel:${portfolio.phone}`}
                    className="flex items-center gap-1.5 text-sm text-(--on-surface-variant) hover:text-(--primary) transition-colors">
                    <span className="material-symbols-outlined text-base">phone</span>
                    {portfolio.phone}
                  </a>
                )}
                {portfolio.lineId && (
                  <span className="flex items-center gap-1.5 text-sm text-(--on-surface-variant)">
                    <span className="material-symbols-outlined text-base">chat</span>
                    LINE: {portfolio.lineId}
                  </span>
                )}
                {portfolio.facebookUrl && (
                  <a href={portfolio.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-(--on-surface-variant) hover:text-(--primary) transition-colors">
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    Facebook
                  </a>
                )}
                {portfolio.instagramUrl && (
                  <a href={portfolio.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-(--on-surface-variant) hover:text-(--primary) transition-colors">
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                    Instagram
                  </a>
                )}
                {portfolio.websiteUrl && (
                  <a href={portfolio.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-(--on-surface-variant) hover:text-(--primary) transition-colors">
                    <span className="material-symbols-outlined text-base">language</span>
                    เว็บไซต์
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

        {/* Published Trips */}
        {portfolio.trips.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-(--on-surface) flex items-center gap-2">
              <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>luggage</span>
              ทริปที่เปิดรับ
              <span className="text-sm font-normal text-(--on-surface-variant) ml-1">({portfolio.trips.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {portfolio.trips.map((trip) => (
                <Link key={trip.id} href={`/t/${trip.slug}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden bg-(--surface-variant)">
                    {trip.coverImageUrl ? (
                      <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-(--outline-variant)">landscape</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[15px] text-(--on-surface) line-clamp-1 group-hover:text-(--primary) transition-colors">{trip.title}</h3>
                    <p className="text-xs text-(--on-surface-variant) mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {trip.destination}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tour Packages (Posts) */}
        {portfolio.posts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-(--on-surface) flex items-center gap-2">
              <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>flight_takeoff</span>
              แพ็กเกจทัวร์
              <span className="text-sm font-normal text-(--on-surface-variant) ml-1">({portfolio.posts.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {portfolio.posts.map((post) => {
                const cover = post.images[0]?.url ?? null;
                return (
                  <div key={post.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col border border-(--outline-variant)/20">
                    <div className="relative aspect-video overflow-hidden bg-(--surface-variant)">
                      {cover ? (
                        <img src={cover} alt={post.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-(--outline-variant)">photo</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[15px] text-(--on-surface) line-clamp-1">{post.title}</h3>
                      <p className="text-xs text-(--on-surface-variant) mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {post.destination}
                      </p>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-(--outline-variant)/20">
                        {post.price != null && (
                          <span className="text-sm font-bold text-(--primary)">
                            ฿{post.price.toLocaleString()}
                          </span>
                        )}
                        {post.duration != null && (
                          <span className="text-xs text-(--on-surface-variant)">{post.duration} วัน</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty */}
        {portfolio.trips.length === 0 && portfolio.posts.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-(--outline-variant) block mb-4">travel_explore</span>
            <p className="text-(--on-surface-variant)">ยังไม่มีทริปหรือแพ็กเกจเผยแพร่</p>
          </div>
        )}
      </div>
    </div>
  );
}
