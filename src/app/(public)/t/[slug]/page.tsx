"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { fetchTripBySlug, trackView } from "@/lib/trip-api";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { isAuthenticated, getUser, logout, refreshAuth } from "@/lib/auth";
import { followMember } from "@/lib/trip-api";
import type { TripPlan } from "@/lib/types/trip";
import { formatDateRange, getTripDuration, getDaysUntil, detectMapProvider, detectMapProviderFromActivities, buildRouteUrl, getMapProviderLabel, getActivityTypeStyle, getDayEmoji, getActivityEmoji } from "@/lib/utils";
import { getLangMeta, getUiStrings, getLangLocale, type TripLang } from "@/lib/i18n-trip";
import type { Day, Activity } from "@/lib/types/trip";

interface TripViewPageProps {
  params: Promise<{ slug: string }>;
}

const LANG_STORAGE_KEY = (slug: string) => `trip_lang_${slug}`;

export default function TripViewPage({ params }: TripViewPageProps): React.JSX.Element {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<string>("");
  const [langLoading, setLangLoading] = useState(false);
  // Derived from primary-language fetch — never overwritten by translated re-fetch
  const [availableLangs, setAvailableLangs] = useState<string[]>([]);

  // Initial load — always fetch primary language first to get the full supportedLanguages list,
  // then apply stored preference only if the trip actually supports that language.
  useEffect(() => {
    let cancelled = false;
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY(slug)) : null;
    fetchTripBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        const primaryLang = data.language ?? "th";
        const allLangs = [primaryLang, ...(data.supportedLanguages ?? []).filter((l) => l !== primaryLang)];
        setAvailableLangs(allLangs);
        const resolvedLang = stored && allLangs.includes(stored) ? stored : primaryLang;
        if (resolvedLang !== primaryLang) {
          return fetchTripBySlug(slug, resolvedLang).then((translated) => {
            if (!cancelled) {
              setTrip(translated);
              setActiveLang(resolvedLang);
              trackView(slug);
            }
          });
        }
        setTrip(data);
        setActiveLang(primaryLang);
        trackView(slug);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดทริปได้");
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Re-fetch when user switches language
  const handleLangChange = useCallback((code: string) => {
    if (code === activeLang || !trip) return;
    setLangLoading(true);
    fetchTripBySlug(slug, code)
      .then((data) => {
        setTrip(data);
        setActiveLang(code);
        localStorage.setItem(LANG_STORAGE_KEY(slug), code);
      })
      .catch(() => { /* keep current data on error */ })
      .finally(() => setLangLoading(false));
  }, [slug, activeLang, trip]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">error</span>
          <h1 className="text-xl font-bold text-slate-900 mb-2">ไม่พบทริป</h1>
          <p className="text-slate-500 text-sm">{loadError}</p>
          <Link href="/" className="inline-block mt-6 text-blue-600 font-semibold text-sm hover:underline">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  return <TripViewContent trip={trip} activeLang={activeLang} onLangChange={handleLangChange} langLoading={langLoading} availableLangs={availableLangs} />;
}

function TripViewContent({ trip, activeLang, onLangChange, langLoading, availableLangs }: {
  trip: TripPlan;
  activeLang: string;
  onLangChange: (code: string) => void;
  langLoading: boolean;
  availableLangs: string[];
}): React.JSX.Element {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const user = getUser();

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinPending, setJoinPending] = useState(false);

  useEffect(() => {
    setIsFollowing(localStorage.getItem(`followed_${trip.slug}`) === "1");
    function onTripFollowed() { setIsFollowing(true); }
    window.addEventListener("trip-followed", onTripFollowed);
    return () => window.removeEventListener("trip-followed", onTripFollowed);
  }, [trip.slug]);

  // Auto-join after redirect from login (when ?autoJoin=1 in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoJoin") !== "1") return;
    // Remove param from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("autoJoin");
    window.history.replaceState({}, "", url.toString());

    refreshAuth().then((ok) => {
      if (!ok) return;
      followMember(trip.id)
        .then((result) => {
          if (result.status === "Pending") {
            setJoinPending(true);
          } else {
            localStorage.setItem(`followed_${trip.slug}`, "1");
            localStorage.setItem(`follower_id_${trip.slug}`, result.id);
            setIsFollowing(true);
          }
        })
        .catch(() => {});
    });
  }, [trip.id, trip.slug]);

  // Web push only — no account needed
  function handleOpenFollowModal() {
    window.dispatchEvent(new CustomEvent("open-follow-modal"));
  }

  // Join trip = requires account. If already logged in → call API directly.
  async function handleJoinTrip() {
    const ok = await refreshAuth();
    if (!ok) {
      router.push(`/login?next=${encodeURIComponent(`/t/${trip.slug}?autoJoin=1`)}`);
      return;
    }
    setJoinLoading(true);
    setJoinError(null);
    try {
      const result = await followMember(trip.id);
      if (result.status === "Pending") {
        setJoinPending(true);
      } else {
        localStorage.setItem(`followed_${trip.slug}`, "1");
        localStorage.setItem(`follower_id_${trip.slug}`, result.id);
        setIsFollowing(true);
      }
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setJoinLoading(false);
    }
  }
  const [acknowledged, setAcknowledged] = useState(false);
  const lang: TripLang = activeLang || trip.language || "th";
  const [showLangMenu, setShowLangMenu] = useState(false);
  const dayNavRef = useRef<HTMLDivElement>(null);
  const t = getUiStrings(lang);

  // Use the list captured from the primary-language fetch — stable across language switches
  const availableLanguages = availableLangs;

  const duration = getTripDuration(trip.startDate, trip.endDate);
  const daysUntil = getDaysUntil(trip.startDate);
  const isEnded = trip.endDate ? new Date(trip.endDate + "T23:59:59") < new Date() : false;

  // Ended trip data: ratings, recommendations, gallery
  const [ratingSummary, setRatingSummary] = useState<{ count: number; avgOverall: number | null; avgGuide: number | null; avgItinerary: number | null; avgValue: number | null; comments: { items: { imageUrls?: string[] }[]; totalCount: number; hasNext: boolean } } | null>(null);
  const [recommendations, setRecommendations] = useState<{ id: string; category: string; name: string; description: string | null; imageUrl: string | null; mapsLink: string | null; likeCount: number; createdByName: string }[]>([]);
  const [totalRecommendations, setTotalRecommendations] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  function getShareUrl() {
    return `${window.location.origin}/t/${trip.slug}`;
  }

  function shareToLine() {
    const url = getShareUrl();
    const text = `${trip.title} — ${trip.destination}`;
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "noopener");
    setShowShareMenu(false);
  }

  function shareToFacebook() {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,width=600,height=400");
    setShowShareMenu(false);
  }

  function shareToX() {
    const url = getShareUrl();
    const text = `${trip.title} — ${trip.destination}`;
    window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank", "noopener,width=600,height=400");
    setShowShareMenu(false);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(getShareUrl());
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
    setShowShareMenu(false);
  }

  useEffect(() => {
    if (!isEnded) return;
    import("@/lib/api").then(({ api }) => {
      api.get<typeof ratingSummary>(`/client/t/${trip.slug}/ratings`).then((raw: any) => {
        if (raw.recentComments && !raw.comments) {
          raw.comments = { items: raw.recentComments, totalCount: raw.recentComments.length, hasNext: false };
        }
        setRatingSummary(raw);
      }).catch(() => {});
      api.get<any>(`/client/t/${trip.slug}/recommendations?pageSize=8`).then((data: any) => {
        if (Array.isArray(data)) { setRecommendations(data); setTotalRecommendations(data.length); }
        else { setRecommendations(data.items ?? []); setTotalRecommendations(data.totalCount ?? 0); }
      }).catch(() => {});
    });
  }, [isEnded, trip.slug]);

  const galleryPhotos = (() => {
    if (!isEnded) return [];
    const photos: { url: string; label: string }[] = [];
    for (const day of trip.days) {
      for (const act of day.activities) {
        if (act.imageUrl) photos.push({ url: act.imageUrl, label: act.name });
        if ("imageUrls" in act && Array.isArray((act as Record<string, unknown>).imageUrls)) {
          for (const u of (act as Record<string, unknown>).imageUrls as string[]) photos.push({ url: u, label: act.name });
        }
      }
    }
    if (ratingSummary?.comments?.items) {
      for (const c of ratingSummary.comments.items) {
        if (c.imageUrls) for (const u of c.imageUrls) photos.push({ url: u, label: "รีวิว" });
      }
    }
    const seen = new Set<string>();
    return photos.filter((p) => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
  })();

  // ── Simulate "now" for demo: Day 3, 10:30 ──
  // TODO: Replace with real Date when going live
  const SIMULATED_NOW = new Date("2026-04-17T10:30:00");
  const simDateStr = SIMULATED_NOW.toISOString().split("T")[0]; // "2026-04-17"
  const simHHMM = SIMULATED_NOW.getHours() * 60 + SIMULATED_NOW.getMinutes(); // 630 mins

  // Find the current activity: match today's day, then find the activity whose time <= now and next activity's time > now
  const currentActivityId = (() => {
    const todayDay = trip.days.find((d) => d.date === simDateStr);
    if (!todayDay) return null;
    const sorted = [...todayDay.activities].sort((a, b) => a.sortOrder - b.sortOrder);
    let current: string | null = null;
    for (const act of sorted) {
      const [h, m] = act.time.split(":").map(Number);
      const actMins = (h ?? 0) * 60 + (m ?? 0);
      if (actMins <= simHHMM) {
        current = act.id;
      }
    }
    return current;
  })();

  const currentDayNumber = trip.days.find((d) => d.date === simDateStr)?.dayNumber ?? null;

  // Banner height no longer needed (modal instead of sticky banner)
  const ackBannerHeight = 0;

  // Auto-scroll day nav to keep active button visible
  useEffect(() => {
    const nav = dayNavRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector(`[data-day="${activeDay}"]`) as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeDay]);

  // Auto-scroll to current activity on mount
  useEffect(() => {
    if (!currentActivityId) return;
    // Small delay to let the page render
    const timer = setTimeout(() => {
      const el = document.getElementById(`activity-${currentActivityId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer to track active day on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.id.replace("day-", ""), 10);
            if (!isNaN(index)) setActiveDay(index);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    trip.days.forEach((day) => {
      const el = document.getElementById(`day-${day.dayNumber}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [trip.days]);

  const scrollToDay = useCallback((dayNumber: number) => {
    setActiveDay(dayNumber);
    const el = document.getElementById(`day-${dayNumber}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const dayGradients = [
    "from-blue-600 to-indigo-700",
    "from-sky-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-slate-600 to-slate-800",
    "from-pink-500 to-rose-600",
  ];

  return (
    <div className="natgan-bg text-on-surface min-h-screen" style={{ "--sticky-offset": `${64 + ackBannerHeight + 52}px` } as React.CSSProperties}>
      {/* ── TopNavBar ── */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 max-w-7xl mx-auto">

          {/* ── Left: brand + desktop links ── */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-brand-blue flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
              </div>
              <span className="font-headline font-bold text-brand-blue text-base hidden sm:block">TripApp</span>
            </Link>

            <div className="hidden md:flex items-center">
              <button
                onClick={() => dayNavRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
              >
                แผนการเดินทาง
              </button>
              <Link href={`/t/${trip.slug}/imm`} className="px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors">
                เอกสาร
              </Link>
              <Link href={`/t/${trip.slug}/help`} className="px-3 py-1.5 text-sm font-medium text-on-surface-variant hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors">
                ช่วยเหลือ
              </Link>
            </div>
          </div>

          {/* ── Right: lang + follow + account ── */}
          <div className="flex items-center gap-2">

            {/* Language toggle */}
            {availableLanguages.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  disabled={langLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {langLoading
                    ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    : <span>{getLangMeta(lang).flag}</span>
                  }
                  <span className="hidden sm:inline text-xs">{getLangMeta(lang).label}</span>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
                </button>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden min-w-[140px]">
                      {availableLanguages.map((l) => {
                        const meta = getLangMeta(l);
                        return (
                          <button
                            key={l}
                            onClick={() => { onLangChange(l); setShowLangMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors ${lang === l ? "bg-brand-blue/5 text-brand-blue font-bold" : "text-on-surface"}`}
                          >
                            <span>{meta.flag}</span>
                            <span>{meta.label}</span>
                            {lang === l && <span className="material-symbols-outlined text-brand-blue text-sm ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Follow / Following — desktop only */}
            {isFollowing ? (
              <Link
                href={`/t/${trip.slug}/changelog`}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-blue/30 text-brand-blue text-sm font-semibold hover:bg-brand-blue/5 transition-colors"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                กำลังติดตาม
              </Link>
            ) : (
              <button
                onClick={handleOpenFollowModal}
                className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-blue text-white text-sm font-bold hover:bg-brand-blue/90 active:scale-95 transition-all shadow-sm shadow-brand-blue/20"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
                Follow
              </button>
            )}

            {/* Account */}
            {isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {user?.firstName?.charAt(0) ?? "?"}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                      </div>
                      <nav className="py-1">
                        <a href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">person</span>
                          โปรไฟล์
                        </a>
                        <a href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">settings</span>
                          ตั้งค่าบัญชี
                        </a>
                        <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">dashboard</span>
                          Dashboard
                        </a>
                      </nav>
                      <div className="border-t border-slate-100 py-1">
                        <button
                          onClick={async () => { await logout().catch(() => {}); router.push("/login"); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          ออกจากระบบ
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href={`/login?next=/t/${trip.slug}`}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-on-surface-variant hover:text-brand-blue hover:bg-brand-blue/5 rounded-lg transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>

        </div>
      </nav>

      {/* ── Acknowledge Modal (G3) ── */}
      {trip.pendingChange && !acknowledged && (
        <AcknowledgeModal
          changes={trip.pendingChange.changes}
          onAcknowledge={() => setAcknowledged(true)}
          companyName={trip.company.name}
          t={t}
          slug={trip.slug}
        />
      )}

      {/* ── Hero Section ── */}
      <header className="relative min-h-[520px] sm:min-h-[600px] overflow-hidden">
        <img alt={trip.title} className="absolute inset-0 w-full h-full object-cover" src={trip.coverImageUrl} />
        <div className="hero-overlay absolute inset-0" />

        {/* Decorative elements */}
        <div className="absolute right-6 top-6 text-7xl opacity-15 sm:right-12 sm:top-10 sm:text-9xl select-none">✈️</div>
        <div className="absolute bottom-10 left-6 text-5xl opacity-10 sm:left-12 sm:text-7xl select-none">🌏</div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex min-h-[520px] sm:min-h-[600px] flex-col items-center justify-center px-6 text-center">
          {/* Badge */}
          <div className="glass-card mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2">
            <span className={`w-2 h-2 rounded-full ${isEnded ? "bg-slate-400" : "bg-green-400 animate-pulse"}`} />
            <span className="text-sm font-medium text-white/90">
              {trip.destination} • {isEnded ? t.tripEnded : daysUntil > 0 ? t.daysToGo(daysUntil) : t.onTrip}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter text-white font-headline">
            {trip.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="shimmer-text">{trip.title.split(" ").slice(-1)}</span>
          </h1>

          <p className="mt-4 text-lg font-light text-white/70 sm:text-xl">
            {formatDateRange(trip.startDate, trip.endDate, getLangLocale(lang))} • {duration} {t.days}
          </p>

          {/* Info badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: "👥", label: `${trip.travelersCount} ${t.travelers}` },
              { icon: "✈️", label: trip.airlineInfo[0]?.airline ?? "" },
              { icon: "🏨", label: `${trip.accommodations.length} ${t.hotels}` },
              { icon: "📅", label: `${duration} ${t.days} ${trip.days.reduce((s, d) => s + d.activities.length, 0)} ${t.activities}` },
            ].map((b) => (
              <span key={b.label} className="glass-card inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/90 shadow-lg">
                <span>{b.icon}</span>{b.label}
              </span>
            ))}
          </div>

          {/* Join Trip CTA — requires account on platform */}
          <div className="mt-10 flex flex-col items-center gap-3">
            {isEnded ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white/70 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                  <span className="text-white/80 font-bold text-sm">ทริปนี้สิ้นสุดแล้ว</span>
                </div>
                {ratingSummary && ratingSummary.count > 0 && (
                  <Link
                    href={`/t/${trip.slug}/rating`}
                    className="flex items-center gap-1.5 text-amber-300/80 hover:text-amber-200 text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {ratingSummary.avgOverall?.toFixed(1)} คะแนน ({ratingSummary.count} รีวิว)
                  </Link>
                )}
              </div>
            ) : isFollowing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-green-500/20 border border-green-400/40 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-green-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-white font-bold text-sm">เข้าร่วมแล้ว</span>
                </div>
                <Link
                  href={`/t/${trip.slug}/changelog`}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  ดูการอัปเดตทริป
                </Link>
              </div>
            ) : joinPending ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-yellow-300 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                  <span className="text-white font-semibold text-sm">รอการอนุมัติจากเจ้าของทริป</span>
                </div>
                <p className="text-white/50 text-xs">เจ้าของทริปจะแจ้งให้ทราบเมื่ออนุมัติแล้ว</p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleJoinTrip}
                  disabled={joinLoading}
                  className="gradient-silk text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-2xl shadow-brand-blue-deep/40 hover:opacity-90 active:scale-95 transition-all border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {joinLoading ? "progress_activity" : "group_add"}
                  </span>
                  {joinLoading ? "กำลังบันทึก..." : t.followTrip}
                </button>
                {joinError && (
                  <p className="text-red-300 text-sm font-medium">{joinError}</p>
                )}
                <button
                  onClick={handleOpenFollowModal}
                  className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-base">notifications</span>
                  รับแจ้งเตือนอย่างเดียว
                </button>
              </>
            )}
          </div>

          {/* Share buttons */}
          <div className="mt-6 relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">share</span>
              แชร์ทริปนี้
            </button>

            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200/60">
                  <button onClick={shareToLine} title="LINE" className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center hover:opacity-80 active:scale-90 transition-all">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                  </button>
                  <button onClick={shareToFacebook} title="Facebook" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 active:scale-90 transition-all">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  </button>
                  <button onClick={shareToX} title="X (Twitter)" className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:opacity-80 active:scale-90 transition-all">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </button>
                  <div className="w-px h-6 bg-slate-200" />
                  <button onClick={copyShareLink} title="คัดลอกลิงก์" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all">
                    <span className="material-symbols-outlined text-lg text-slate-600">
                      {shareCopied ? "check" : "link"}
                    </span>
                  </button>
                </div>
              </>
            )}

            {shareCopied && !showShareMenu && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold whitespace-nowrap shadow-lg animate-fade-in">
                คัดลอกลิงก์แล้ว
              </div>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 animate-float">
            <div className="flex flex-col items-center gap-1 text-white/40">
              <span className="text-[10px] tracking-[0.2em] uppercase">{t.scrollDown}</span>
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Sticky Day Nav ── */}
      <nav
        className="sticky top-16 z-40 border-b border-outline-variant/20 bg-white"
      >
        <div ref={dayNavRef} className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-3 no-scrollbar sm:justify-center">
          {trip.days.map((day) => (
            <button
              key={day.id}
              data-day={day.dayNumber}
              onClick={() => scrollToDay(day.dayNumber)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                activeDay === day.dayNumber
                  ? "bg-brand-blue text-white shadow-md"
                  : "bg-white text-on-surface-variant hover:bg-brand-blue/5"
              }`}
            >
              <span>{getDayEmoji(day.subtitle, day.dayNumber - 1)}</span>
              <span className="hidden sm:inline">{new Date(day.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
              <span className="sm:hidden">D{day.dayNumber}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── All Day Cards ── */}
      <main className="mx-auto mt-10 max-w-7xl px-4 sm:px-8">
        <div className="relative">
          {/* Timeline line (desktop) */}
          <div className="timeline-line hidden lg:block" />

          <div className="space-y-8 lg:pl-16">
            {trip.days.map((day, idx) => (
              <div key={day.id} className="relative">
                {/* Timeline dot (desktop) */}
                <div className="absolute -left-16 top-8 hidden h-12 w-12 items-center justify-center rounded-full bg-warm-white text-xl shadow-md ring-4 ring-brand-blue-light/30 lg:flex">
                  {getDayEmoji(day.subtitle, idx)}
                </div>

                <DayCardComponent
                  day={day}
                  dayIndex={idx}
                  gradient={dayGradients[idx % dayGradients.length] ?? "from-blue-600 to-indigo-700"}
                  animDelay={idx * 0.08}
                  t={t}
                  currentActivityId={currentActivityId}
                  isToday={day.dayNumber === currentDayNumber}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Rating Summary (ended trips) ── */}
        {isEnded && ratingSummary && ratingSummary.count > 0 && (
          <section className="mt-16">
            <div className="rounded-3xl border border-amber-200/40 bg-warm-white p-6 shadow-ambient sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-xl">
                  <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-on-surface sm:text-xl font-headline">รีวิวจากสมาชิก</h3>
                  <p className="text-xs text-on-surface-variant">{ratingSummary.count} รีวิว</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Big score */}
                <div className="text-center shrink-0">
                  <p className="text-5xl font-extrabold font-headline text-amber-500">
                    {ratingSummary.avgOverall?.toFixed(1)}
                  </p>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-lg ${(ratingSummary.avgOverall ?? 0) >= s ? "text-amber-400" : "text-slate-200"}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">คะแนนภาพรวม</p>
                </div>

                {/* Bar breakdown */}
                <div className="flex-1 w-full space-y-2">
                  {[
                    { label: "ภาพรวม", val: ratingSummary.avgOverall },
                    { label: "ไกด์ / ทีมงาน", val: ratingSummary.avgGuide },
                    { label: "แผนการเดินทาง", val: ratingSummary.avgItinerary },
                    { label: "ความคุ้มค่า", val: ratingSummary.avgValue },
                  ].filter((d) => d.val !== null).map((d) => (
                    <div key={d.label} className="flex items-center gap-3">
                      <p className="text-xs text-on-surface-variant w-28 shrink-0">{d.label}</p>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${((d.val ?? 0) / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs font-bold text-amber-600 w-8 text-right shrink-0">{d.val?.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href={`/t/${trip.slug}/rating`}
                  className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-amber-500/90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  ดูรีวิวทั้งหมด
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Photo Gallery (ended trips) ── */}
        {isEnded && galleryPhotos.length > 0 && (
          <section className="mt-16">
            <div className="rounded-3xl border border-outline-variant/20 bg-warm-white p-6 shadow-ambient sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/8 text-xl">
                  <span className="material-symbols-outlined text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-brand-blue sm:text-xl font-headline">ภาพบรรยากาศทริป</h3>
                  <p className="text-xs text-on-surface-variant">{galleryPhotos.length} ภาพ</p>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {galleryPhotos.slice(0, 15).map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxUrl(photo.url)}
                    className="group relative aspect-square rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] font-medium text-white truncate">{photo.label}</p>
                    </div>
                  </button>
                ))}
                {galleryPhotos.length > 15 && (
                  <div className="aspect-square rounded-xl bg-brand-blue/8 flex flex-col items-center justify-center text-brand-blue">
                    <span className="text-2xl font-bold">+{galleryPhotos.length - 15}</span>
                    <span className="text-[10px] font-medium">ภาพเพิ่มเติม</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Recommendations (ended trips) ── */}
        {isEnded && recommendations.length > 0 && (
          <section className="mt-10">
            <div className="rounded-3xl border border-outline-variant/20 bg-warm-white p-6 shadow-ambient sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                  <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-emerald-700 sm:text-xl font-headline">แนะนำโดยสมาชิก</h3>
                  <p className="text-xs text-on-surface-variant">สถานที่ที่สมาชิกในทริปแนะนำ</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {recommendations.map((rec) => {
                  const catStyle: Record<string, { icon: string; color: string }> = {
                    restaurant: { icon: "restaurant", color: "text-orange-500 bg-orange-50" },
                    attraction: { icon: "landscape", color: "text-blue-500 bg-blue-50" },
                    cafe: { icon: "local_cafe", color: "text-amber-600 bg-amber-50" },
                    shopping: { icon: "shopping_bag", color: "text-pink-500 bg-pink-50" },
                    other: { icon: "place", color: "text-slate-500 bg-slate-50" },
                  };
                  const cat = catStyle[rec.category] ?? catStyle.other;
                  return (
                    <div key={rec.id} className="flex gap-3 rounded-2xl bg-white border border-outline-variant/15 p-4 hover:shadow-md transition-all">
                      {rec.imageUrl ? (
                        <button type="button" onClick={() => setLightboxUrl(rec.imageUrl)} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 hover:opacity-80 transition-opacity">
                          <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ) : (
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-on-surface truncate">{rec.name}</h4>
                          <span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cat.color}`}>
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                          </span>
                        </div>
                        {rec.description && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{rec.description}</p>}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs text-rose-400" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                            {rec.likeCount}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">โดย {rec.createdByName}</span>
                          {rec.mapsLink && (
                            <a href={rec.mapsLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-blue font-bold flex items-center gap-0.5 hover:underline">
                              <span className="material-symbols-outlined text-xs">map</span>
                              แผนที่
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalRecommendations > recommendations.length && (
                <div className="flex justify-center mt-4">
                  <Link href={`/t/${trip.slug}/recommendations`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline">
                    ดูทั้งหมด ({totalRecommendations})
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Summary Section ── */}
        <section className="mt-16">
          <div className="rounded-3xl border border-outline-variant/20 bg-warm-white p-6 shadow-ambient sm:p-10">
            <h3 className="mb-6 text-center text-xl font-bold text-brand-blue sm:text-2xl font-headline">{t.tripSummary}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { icon: "📅", value: `${duration} ${t.days}`, label: t.duration },
                { icon: "✈️", value: trip.airlineInfo[0]?.airline ?? "-", label: t.airline },
                { icon: "👥", value: `${trip.travelersCount}`, label: t.travelers },
                { icon: "🏨", value: `${trip.accommodations.length}`, label: t.accommodation },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center rounded-2xl bg-brand-blue/5 p-4 text-center">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="mt-2 text-lg font-bold text-on-surface">{s.value}</span>
                  <span className="text-xs text-on-surface-variant">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Accommodation ── */}
        <section className="mt-10">
          <div className="rounded-3xl border border-outline-variant/20 bg-warm-white p-6 shadow-ambient sm:p-10">
            <h3 className="mb-5 text-lg font-bold text-brand-blue sm:text-xl font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>hotel</span>
              {t.accommodation}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {trip.accommodations.map((acc) => (
                <div key={acc.name} className="flex gap-4 rounded-2xl bg-white p-5 border border-outline-variant/15">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue/8 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-brand-blue">apartment</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{acc.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{acc.address}</p>
                    <p className="text-xs text-on-surface-variant">📞 {acc.phone}</p>
                    <p className="text-xs text-brand-blue font-semibold mt-1">{t.checkIn} {acc.checkIn} • {acc.nights} {t.nights}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Checklist ── */}
        {trip.checklistItems.length > 0 && (
          <section className="mt-10">
            <div className="rounded-3xl border border-outline-variant/20 bg-warm-white p-6 shadow-ambient sm:p-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/8 text-xl">
                  <span className="material-symbols-outlined text-brand-blue" style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
                </span>
                <h3 className="text-lg font-bold text-brand-blue sm:text-xl font-headline">สิ่งที่ต้องเตรียม</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {trip.checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.isRequired
                        ? "border-brand-blue bg-brand-blue"
                        : "border-outline-variant"
                    }`}>
                      {item.isRequired && (
                        <span className="material-symbols-outlined text-white text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      )}
                    </span>
                    <span className="text-sm text-on-surface">{item.label}</span>
                    {item.isRequired && (
                      <span className="ml-auto shrink-0 rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-bold text-brand-blue">จำเป็น</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Notes ── */}
        {trip.notes && (
          <section className="mt-10">
            <div className="rounded-3xl border border-brand-gold/20 bg-linear-to-r from-brand-blue-deep to-brand-blue p-6 text-white shadow-xl sm:p-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">📝</span>
                <h3 className="text-lg font-bold font-headline">{t.guideNotes}</h3>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-white/80">
                {trip.notes.split("\n").map((note, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand-gold">●</span>
                    {note.replace(/^[•\s]+/, "")}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Emergency ── */}
        <section className="mt-10">
          <div className="rounded-3xl border border-red-200/40 bg-warm-white p-6 shadow-ambient sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-xl">🆘</span>
              <h3 className="text-lg font-bold text-red-700 sm:text-xl font-headline">{t.emergency}</h3>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trip.emergencyContacts.map((c) => (
                <a
                  key={c.phone}
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 transition-all hover:border-red-300 hover:shadow-md card-glow"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    {/^[a-z0-9_]+$/.test(c.icon ?? "")
                      ? <span className="material-symbols-outlined text-red-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                      : <span className="text-xl">{c.icon ?? "🆘"}</span>
                    }
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-on-surface-variant">{c.name}</p>
                    <p className="text-sm font-bold text-red-600">{c.phone}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Company footer ── */}
        <section className="mt-10 mb-32">
          <div className="rounded-3xl bg-warm-white border border-outline-variant/10 p-6 shadow-ambient sm:p-10">
            <div className="flex items-center gap-4 mb-5">
              <img src={trip.company.logoUrl} alt={trip.company.name} className="w-14 h-14 rounded-2xl shadow-sm" />
              <div>
                <h4 className="font-headline font-bold text-lg">{trip.company.name}</h4>
                {trip.company.tatLicense && <p className="text-xs text-on-surface-variant">TAT License: {trip.company.tatLicense}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a href={`tel:${trip.company.phone}`} className="flex items-center gap-2 p-3 rounded-xl bg-white border border-outline-variant/10 text-sm font-medium hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-slate-600 text-lg">call</span>
                {trip.company.phone}
              </a>
              <a href={`https://line.me/R/ti/p/${trip.company.lineId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-white border border-outline-variant/10 text-sm font-medium hover:bg-line-green/5 transition-colors">
                <span className="text-line-green text-lg">💚</span>
                {trip.company.lineId}
              </a>
              {trip.company.facebook && (
                <a href={`https://facebook.com/${trip.company.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-white border border-outline-variant/10 text-sm font-medium hover:bg-blue-50 transition-colors">
                  <span className="text-lg">📘</span>
                  {trip.company.facebook}
                </a>
              )}
              {trip.company.instagram && (
                <a href={`https://instagram.com/${trip.company.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-white border border-outline-variant/10 text-sm font-medium hover:bg-pink-50 transition-colors">
                  <span className="text-lg">📷</span>
                  @{trip.company.instagram}
                </a>
              )}
            </div>
            {/* Immigration link */}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={`/t/${trip.slug}/imm`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue-deep text-white px-6 py-3.5 font-bold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined">security</span>
                🛂 {t.immigrationMode}
              </Link>
              <Link
                href={`/t/${trip.slug}/help`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-blue text-brand-blue px-6 py-3.5 font-bold text-sm hover:bg-brand-blue hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">help_center</span>
                Help Center
              </Link>
            </div>
            {/* H2.1: Powered by — only renders for plans where ShowWatermark = true (Free tier).
                Paid plans (per_trip / pack_5 / subscription) have showWatermark = false → badge hidden. */}
            <div className="mt-8 border-t border-outline-variant/10 pt-6 text-center space-y-1">
              <p className="text-sm text-on-surface-variant/50">✈️ {trip.title}</p>
              {(trip.showWatermark ?? true) && (
                <a href="https://tripapp.com" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[11px] text-on-surface-variant/30 hover:text-brand-blue transition-colors font-medium tracking-wide">
                  <span className="bg-brand-blue/10 text-brand-blue text-[9px] font-black px-1.5 py-0.5 rounded">T</span>
                  Powered by TripApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxUrl} alt="" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Day Card Component ────────────────────────── */

function DayCardComponent({ day, dayIndex, gradient, animDelay, t, currentActivityId, isToday }: { day: Day; dayIndex: number; gradient: string; animDelay: number; t: import("@/lib/i18n-trip").UIStrings; currentActivityId: string | null; isToday: boolean }): React.JSX.Element {
  return (
    <article
      id={`day-${day.dayNumber}`}
      className={`day-card animate-fade-in-up relative overflow-hidden rounded-3xl border bg-warm-white shadow-ambient ${isToday ? "border-brand-blue/30 ring-2 ring-brand-blue/10" : "border-outline-variant/20"}`}
      style={{ animationDelay: `${animDelay}s`, scrollMarginTop: "var(--sticky-offset, 8rem)" }}
    >
      {/* Cover image */}
      {day.coverImageUrl && (
        <div className="day-cover">
          <img src={day.coverImageUrl} alt={day.title} />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <p className="text-xs font-light text-white/70">{new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
        </div>
      )}

      {/* Gradient header */}
      <div className={`bg-linear-to-r ${gradient} px-6 py-4 sm:px-8`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
              {getDayEmoji(day.subtitle, dayIndex)}
            </span>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                Day {day.dayNumber} · {new Date(day.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
              </span>
              <h2 className="text-xl font-bold text-white sm:text-2xl font-headline">{day.title}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isToday && (
              <span className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                วันนี้
              </span>
            )}
            <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm sm:inline-block">
              {day.activities.length} ✦
            </span>
          </div>
        </div>
      </div>

      {/* Activities — Timeline */}
      <div className="px-3 py-5 sm:px-6 sm:py-8">
        <div className="relative">
          {day.activities.map((activity, idx) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={idx === day.activities.length - 1}
              isCurrent={activity.id === currentActivityId}
            />
          ))}
        </div>

        {/* Route link */}
        {(() => {
          const activitiesWithMaps = day.activities.filter((a) => a.mapsLink);
          const provider = detectMapProviderFromActivities(activitiesWithMaps);
          const places = activitiesWithMaps.map((a) => a.placeName);
          const routeUrl = buildRouteUrl(places, provider);
          if (!routeUrl) return null;
          return (
            <div className="mt-4 border-t border-outline-variant/10 pt-4">
              <a
                href={routeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue/20 transition-all hover:bg-brand-blue-deep active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-lg">alt_route</span>
                {t.viewRoute}
              </a>
            </div>
          );
        })()}
      </div>
    </article>
  );
}

/* ────────────────────────── Activity Gallery + Lightbox ────────────────────────── */

/* Lightbox overlay rendered via portal directly into document.body to escape stacking contexts */
function LightboxPortal({ images, name, index, onClose, onPrev, onNext, onGoTo }: {
  images: string[]; name: string; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void;
}): React.JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 safe-top">
        <div className="flex items-center gap-2.5">
          <span className="text-white font-bold text-sm">{name}</span>
          <span className="text-white/40 text-sm">·</span>
          <span className="text-white/50 text-sm">{index + 1} / {images.length}</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Image */}
      <img
        src={images[index]}
        alt={`${name} รูปที่ ${index + 1}`}
        className="max-h-[70dvh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {/* Bottom: arrows + dots */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 safe-bottom" onClick={e => e.stopPropagation()}>
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>

          <div className="flex gap-1.5 flex-wrap justify-center max-w-[60vw]">
            {images.slice(0, 12).map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); onGoTo(i); }}
                className={`rounded-full transition-all duration-200 ${i === index ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"}`}
              />
            ))}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

function ActivityGallery({ images, name, initialIndex, onClose }: { images: string[]; name: string; initialIndex?: number; onClose?: () => void }): React.JSX.Element | null {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(initialIndex ?? null);
  const isLightboxOnly = initialIndex !== undefined;

  useEffect(() => { setLightboxIndex(initialIndex ?? null); }, [initialIndex]);

  const closeLightbox = useCallback(() => { setLightboxIndex(null); onClose?.(); }, [onClose]);
  const prev = useCallback(() => setLightboxIndex(i => i != null ? (i - 1 + images.length) % images.length : null), [images.length]);
  const next = useCallback(() => setLightboxIndex(i => i != null ? (i + 1) % images.length : null), [images.length]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, prev, next]);

  if (images.length === 0) return null;
  if (isLightboxOnly && lightboxIndex == null) return null;

  const goTo = useCallback((i: number) => setLightboxIndex(i), []);

  const lightbox = lightboxIndex != null ? (
    <LightboxPortal images={images} name={name} index={lightboxIndex} onClose={closeLightbox} onPrev={prev} onNext={next} onGoTo={goTo} />
  ) : null;

  // Lightbox-only mode (triggered from activity card strip) — no thumbnail grid
  if (isLightboxOnly) return lightbox;

  const MAX_VISIBLE = 5;
  const thumbnails = images.slice(0, MAX_VISIBLE);
  const overflow = images.length - MAX_VISIBLE;

  return (
    <>
      {images.length > 1 && (
        <div className="mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-slate-400">photo_library</span>
          <span className="text-xs font-semibold text-slate-400">{images.length} รูป</span>
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {thumbnails.map((url, i) => (
          <button
            key={`${url}-${i}`}
            onClick={() => setLightboxIndex(i)}
            className="relative shrink-0 overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <img
              src={url}
              alt={`${name} รูปที่ ${i + 1}`}
              className="h-28 w-28 object-cover transition-transform duration-300 hover:scale-105 sm:h-32 sm:w-32"
            />
          </button>
        ))}

        {overflow > 0 && (
          <button
            onClick={() => setLightboxIndex(MAX_VISIBLE)}
            className="relative shrink-0 overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
          >
            <img src={images[MAX_VISIBLE]} alt={`${name} รูปที่เพิ่มเติม`} className="h-28 w-28 object-cover sm:h-32 sm:w-32" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55">
              <span className="text-xl font-black text-white">+{overflow}</span>
              <span className="text-[11px] font-medium text-white/80">รูป</span>
            </div>
          </button>
        )}
      </div>

      {lightbox}
    </>
  );
}

/* ────────────────────────── Activity Item Component ────────────────────────── */

function ActivityItemComponent({ activity, isCurrent }: { activity: Activity; isLast?: boolean; isCurrent: boolean }): React.JSX.Element {
  const typeStyle = getActivityTypeStyle(activity.type);
  const mapProvider = activity.mapsLink ? detectMapProvider(activity.mapsLink) : null;
  const galleryImages = activity.imageUrls?.length ? activity.imageUrls : activity.imageUrl ? [activity.imageUrl] : [];

  const cardBg = isCurrent
    ? "bg-green-50 shadow-[0_2px_12px_rgba(34,197,94,0.12)]"
    : activity.isNew
    ? "bg-blue-50/50 shadow-sm"
    : activity.isChanged
    ? "bg-amber-50/60 shadow-sm"
    : "bg-white shadow-[0_1px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_18px_rgba(0,0,0,0.1)]";

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const hasImages = galleryImages.length > 0;
  const stripImages = galleryImages.slice(0, 3);
  const overflow = galleryImages.length - 3;

  return (
    <div id={`activity-${activity.id}`} className="pb-3">
      <div className={`rounded-2xl transition-all overflow-hidden ${cardBg}`}>

        {/* ── Card body: stacks on mobile, row on sm+ ── */}
        <div className="flex flex-col sm:flex-row sm:items-stretch">

          {/* text content — no icon column, emoji inline in title */}
          <div className="px-4 pt-4 pb-3 sm:pb-4 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {activity.time && (
                <span className="rounded-full bg-[#1e3a5f] px-3 py-1 text-xs font-bold text-white tabular-nums tracking-wide">
                  {activity.time}
                </span>
              )}
              {isCurrent && (
                <span className="flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  ตอนนี้
                </span>
              )}
              {activity.isNew && !isCurrent && (
                <span className="rounded-full bg-blue-500 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">New</span>
              )}
              {activity.isChanged && !isCurrent && (
                <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">แก้ไข</span>
              )}
            </div>
            <h4 className="text-base font-bold text-slate-800 leading-snug">
              <span className="mr-1.5 saturate-[1.4]">{getActivityEmoji(activity.emoji, activity.type)}</span>
              {activity.name}
            </h4>
              {activity.description && (
                <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{activity.description}</p>
              )}
              {(activity.placeName || activity.mapsLink) && (
                <div className="mt-2 flex items-center gap-2">
                  {activity.placeName && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      {activity.mapsLink
                        ? <a href={activity.mapsLink} target="_blank" rel="noreferrer" className="font-semibold text-[#1e3a5f]/70 hover:text-[#1e3a5f] transition-colors">{activity.placeName}</a>
                        : activity.placeName}
                    </span>
                  )}
                  {activity.mapsLink && (
                    <a href={activity.mapsLink} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 active:scale-95 transition-all"
                      title={mapProvider ? getMapProviderLabel(mapProvider) : "Map"}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 92.3 132.3">
                        <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                        <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-32.4L10.8 16.5z"/>
                        <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.1 27.5-32.3-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.5-3.8 8.4-6.3 13.6-6.3z"/>
                        <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 32.4c5.4 11.2 14.2 22.7 23.1 34.1l30.3-36.8c-3.5 3.9-8.5 6.4-13.7 6.4-1.6-.1 1.9-.1 1.9-.1z"/>
                        <path fill="#34a853" d="M59.7 109.2c15.4-24.1 32.6-43 32.6-63.1 0-8.7-1.7-15.7-4.6-22l-57.4 66.7c2.6 3.4 5.3 7 7.9 10.8 7.1 10.7 5.1 15.3 8.1 15.3 2.9 0 .9-4.6 8-15.3l5.4 7.6z"/>
                      </svg>
                      แผนที่
                    </a>
                  )}
                </div>
              )}
          </div>

          {/* Images — below text on mobile, right column on sm+ */}
          {hasImages && (
            <div className="flex items-center gap-1.5 px-4 pb-4 sm:px-0 sm:pb-0 sm:pr-4 sm:self-center sm:shrink-0">
              {stripImages.map((url, i) => {
                const isLast = i === stripImages.length - 1;
                return (
                  <button
                    key={`${url}-${i}`}
                    onClick={() => setLightboxIndex(i)}
                    className="relative w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] rounded-xl overflow-hidden shrink-0 focus:outline-none"
                  >
                    <img src={url} alt={`${activity.name} ${i + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                    {isLast && overflow > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 rounded-xl">
                        <span className="text-sm font-black text-white">+{overflow}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Lightbox (reuse ActivityGallery's lightbox via hidden instance) */}
      {hasImages && lightboxIndex != null && (
        <ActivityGallery images={galleryImages} name={activity.name} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}

/* ────────────────────────── Acknowledge Modal (G3) ────────────────────────── */

function AcknowledgeModal({ changes, onAcknowledge, companyName, t, slug }: {
  changes: { type: "add" | "update" | "delete"; description: string }[];
  onAcknowledge: () => void;
  slug: string;
  companyName: string;
  t: import("@/lib/i18n-trip").UIStrings;
}): React.JSX.Element {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="px-6 pt-8 pb-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
                <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-blue">{companyName}</span>
            </div>

            <h2 className="text-2xl font-extrabold text-on-surface font-headline">{t.tripUpdate}</h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              มีการเปลี่ยนแปลงในโปรแกรมทัวร์ กรุณาตรวจสอบรายละเอียดด้านล่าง
            </p>
          </div>

          {/* Changes list */}
          <div className="mx-6 rounded-2xl border border-outline-variant/20 overflow-hidden">
            {changes.map((change, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 ${idx !== changes.length - 1 ? "border-b border-outline-variant/15" : ""}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white text-xs ${
                  change.type === "add" ? "bg-green-500" :
                  change.type === "update" ? "bg-amber-500" :
                  "bg-red-500"
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {change.type === "add" ? "add" : change.type === "update" ? "edit" : "remove"}
                  </span>
                </span>
                <p className="text-sm text-on-surface font-medium">{change.description}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 pt-6 pb-8">
            <button
              onClick={onAcknowledge}
              className="w-full rounded-2xl bg-brand-blue py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-deep active:scale-[0.98] transition-all"
            >
              {t.acknowledge}
            </button>
            <Link
              href={`/t/${slug}/changelog`}
              onClick={onAcknowledge}
              className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-on-surface-variant hover:text-brand-blue transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              ดูประวัติการเปลี่ยนแปลงทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

