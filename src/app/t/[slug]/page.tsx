"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { fetchTripBySlug, trackView } from "@/lib/trip-api";
import { useRouter } from "next/navigation";
import { ApiError, getToken } from "@/lib/client-api";
import { fetchMe } from "@/lib/client-auth";
import type { TripPlan } from "@/lib/mock-data";
import { formatDateRange, getTripDuration, getDaysUntil, detectMapProvider, detectMapProviderFromActivities, buildRouteUrl, getMapProviderLabel, getActivityTypeStyle } from "@/lib/trip-utils";
import { getLangMeta, getUiStrings, type TripLang } from "@/lib/i18n-trip";
import type { Day, Activity } from "@/lib/mock-data";

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

  // Initial load (no lang — gets primary language + supportedLanguages list)
  useEffect(() => {
    let cancelled = false;
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY(slug)) : null;
    fetchTripBySlug(slug, stored ?? undefined)
      .then((data) => {
        if (cancelled) return;
        setTrip(data);
        setActiveLang(stored ?? data.language ?? "th");
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

  return <TripViewContent trip={trip} activeLang={activeLang} onLangChange={handleLangChange} langLoading={langLoading} />;
}

function TripViewContent({ trip, activeLang, onLangChange, langLoading }: {
  trip: TripPlan;
  activeLang: string;
  onLangChange: (code: string) => void;
  langLoading: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [activeDay, setActiveDay] = useState(1);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [authedUser, setAuthedUser] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    fetchMe().then((me) => {
      if (me) setAuthedUser({ firstName: me.firstName, lastName: me.lastName });
    });
  }, []);

  function handleFollowClick() {
    if (!getToken()) {
      router.push(`/login?next=/t/${trip.slug}`);
      return;
    }
    setShowFollowModal(true);
  }
  const [acknowledged, setAcknowledged] = useState(false);
  const lang: TripLang = activeLang || trip.language || "th";
  const [showLangMenu, setShowLangMenu] = useState(false);
  const dayNavRef = useRef<HTMLDivElement>(null);
  const t = getUiStrings(lang);

  // Real supported languages from API (includes primary + additional)
  const primaryLang = trip.language ?? "th";
  const additionalLangs = trip.supportedLanguages ?? [];
  const availableLanguages: string[] = [primaryLang, ...additionalLangs.filter((c) => c !== primaryLang)];

  const duration = getTripDuration(trip.startDate, trip.endDate);
  const daysUntil = getDaysUntil(trip.startDate);

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
      <nav className="bg-white border-b border-outline-variant/20 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold tracking-tighter text-brand-blue font-headline">Logo</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a className="text-brand-blue border-b-2 border-brand-blue pb-1 text-sm font-semibold" href="#">Itinerary</a>
              <a className="text-on-surface-variant hover:text-brand-blue text-sm font-medium transition-colors" href="#">Documents</a>
              <Link href={`/t/${trip.slug}/help`} className="text-on-surface-variant hover:text-brand-blue text-sm font-medium transition-colors">Support</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle — only shown when trip has > 1 available language */}
            {availableLanguages.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  disabled={langLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-sm font-medium disabled:opacity-60"
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
            <button className="p-2 rounded-full hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container-high transition-all">
              <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
            </button>
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
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white/90">{trip.destination} • {daysUntil > 0 ? `อีก ${daysUntil} วัน!` : "กำลังเดินทาง!"}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter text-white font-headline">
            {trip.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="shimmer-text">{trip.title.split(" ").slice(-1)}</span>
          </h1>

          <p className="mt-4 text-lg font-light text-white/70 sm:text-xl">
            {formatDateRange(trip.startDate, trip.endDate)} • {duration} Days
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

          {/* Follow CTA */}
          <div className="mt-10">
            <button
              onClick={handleFollowClick}
              className="gradient-silk text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 shadow-2xl shadow-brand-blue-deep/40 hover:opacity-90 active:scale-95 transition-all border border-white/10"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {t.followTrip}
            </button>
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
              <span>{day.subtitle.split(" ")[0]}</span>
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
                  {day.subtitle.split(" ")[0]}
                </div>

                <DayCardComponent
                  day={day}
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
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">{c.icon}</span>
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
            {(trip.showWatermark ?? true) && (
              <div className="mt-8 text-center">
                <a href="https://tripapp.com" target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-[11px] text-on-surface-variant/40 hover:text-brand-blue transition-colors font-medium tracking-wide">
                  <span className="bg-brand-blue/10 text-brand-blue text-[9px] font-black px-1.5 py-0.5 rounded">T</span>
                  Powered by TripApp
                </a>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] rounded-t-2xl">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center text-brand-blue bg-brand-blue/10 rounded-xl px-3 py-1"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
          <span className="text-[10px] font-bold">Overview</span>
        </button>
        <Link href={`/t/${trip.slug}/changelog`} className="relative flex flex-col items-center text-on-surface-variant/50">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-medium">Updates</span>
          {trip.changelogs.filter(c => !c.acknowledgedAt).length > 0 && (
            <span className="absolute -top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
              {trip.changelogs.filter(c => !c.acknowledgedAt).length}
            </span>
          )}
        </Link>
        <button
          onClick={handleFollowClick}
          className="flex flex-col items-center text-on-surface-variant/50"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-[10px] font-medium">Follow</span>
        </button>
        <Link href={`/t/${trip.slug}/help`} className="flex flex-col items-center text-on-surface-variant/50">
          <span className="material-symbols-outlined">help_center</span>
          <span className="text-[10px] font-medium">Help</span>
        </Link>
      </nav>

      {/* ── Follow Modal (G2) ── */}
      {showFollowModal && (
        <FollowModal
          onClose={() => setShowFollowModal(false)}
          t={t}
          tripId={trip.id}
          defaultName={authedUser ? `${authedUser.firstName} ${authedUser.lastName}`.trim() : ""}
        />
      )}
    </div>
  );
}

/* ────────────────────────── Day Card Component ────────────────────────── */

function DayCardComponent({ day, gradient, animDelay, t, currentActivityId, isToday }: { day: Day; gradient: string; animDelay: number; t: import("@/lib/i18n-trip").UIStrings; currentActivityId: string | null; isToday: boolean }): React.JSX.Element {
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
              {day.subtitle.split(" ")[0]}
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue/5 px-4 py-3 text-sm font-semibold text-brand-blue transition-all hover:bg-brand-blue hover:text-white sm:w-auto"
              >
                <span className="material-symbols-outlined text-lg">map</span>
                {t.viewRoute}
              </a>
            </div>
          );
        })()}
      </div>
    </article>
  );
}

/* ────────────────────────── Activity Item Component ────────────────────────── */

function ActivityItemComponent({ activity, isLast, isCurrent }: { activity: Activity; isLast: boolean; isCurrent: boolean }): React.JSX.Element {
  const typeStyle = getActivityTypeStyle(activity.type);
  const mapProvider = activity.mapsLink ? detectMapProvider(activity.mapsLink) : null;

  return (
    <div id={`activity-${activity.id}`} className="relative pl-5">
      {/* ── Timeline rail (absolute left) ── */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        {/* Dot */}
        <div className={`relative z-10 mt-1.5 shrink-0 rounded-full ${
          isCurrent ? "h-3.5 w-3.5 bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)] animate-pulse" :
          activity.isNew ? "h-2.5 w-2.5 bg-brand-blue shadow-[0_0_0_3px_rgba(25,120,229,0.12)]" :
          activity.isChanged ? "h-2.5 w-2.5 bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.12)]" :
          "h-2.5 w-2.5 border-2 border-brand-blue-light bg-white"
        }`} />
        {/* Connector line */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-brand-blue/12 mt-1" />
        )}
      </div>

      {/* ── Content ── */}
      <div className="pb-6">
        {/* Time label + NOW badge */}
        <div className="mb-1.5 flex items-center gap-2">
          <p className="text-xs font-bold text-brand-blue tabular-nums">
            {activity.time}
          </p>
          {isCurrent && (
            <span className="flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              ตอนนี้
            </span>
          )}
        </div>

        {/* Card */}
        <div className={`rounded-2xl border bg-white p-3.5 transition-all hover:shadow-md ${
          isCurrent ? "border-green-300 ring-2 ring-green-100 shadow-md" :
          activity.isNew ? "border-brand-blue/20 ring-1 ring-brand-blue/5" :
          activity.isChanged ? "border-amber-200 ring-1 ring-amber-100/50" :
          "border-outline-variant/20"
        }`}>
          {/* Image (if available) */}
          {activity.imageUrl && (
            <div className="-mx-3.5 -mt-3.5 mb-3 overflow-hidden rounded-t-2xl">
              <img
                src={activity.imageUrl}
                alt={activity.name}
                className="h-36 w-full object-cover sm:h-44"
              />
            </div>
          )}

          {/* Title row + maps icon */}
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${typeStyle.bg} text-base`}>
              {activity.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-[13px] font-bold text-on-surface leading-snug">{activity.name}</h4>
                {activity.isNew && (
                  <span className="rounded-full bg-brand-blue px-1.5 py-px text-[9px] font-bold text-white uppercase tracking-wider">New</span>
                )}
                {activity.isChanged && (
                  <span className="rounded-full bg-amber-400 px-1.5 py-px text-[9px] font-bold text-white uppercase tracking-wider">แก้ไข</span>
                )}
              </div>
              {activity.description && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">{activity.description}</p>
              )}
            </div>
            {/* Maps icon */}
            {activity.mapsLink && (
              <a
                href={activity.mapsLink}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F0E8] hover:scale-105 active:scale-95 transition-transform"
                title={mapProvider ? getMapProviderLabel(mapProvider) : "Map"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 92.3 132.3">
                  <path fill="#1a73e8" d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"/>
                  <path fill="#ea4335" d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-32.4L10.8 16.5z"/>
                  <path fill="#4285f4" d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.1 27.5-32.3-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.5-3.8 8.4-6.3 13.6-6.3z"/>
                  <path fill="#fbbc04" d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 32.4c5.4 11.2 14.2 22.7 23.1 34.1l30.3-36.8c-3.5 3.9-8.5 6.4-13.7 6.4-1.6-.1 1.9-.1 1.9-.1z"/>
                  <path fill="#34a853" d="M59.7 109.2c15.4-24.1 32.6-43 32.6-63.1 0-8.7-1.7-15.7-4.6-22l-57.4 66.7c2.6 3.4 5.3 7 7.9 10.8 7.1 10.7 5.1 15.3 8.1 15.3 2.9 0 .9-4.6 8-15.3l5.4 7.6z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
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

/* ────────────────────────── Follow Modal (G2) ────────────────────────── */

function FollowModal({ onClose, t, tripId, defaultName }: { onClose: () => void; t: import("@/lib/i18n-trip").UIStrings; tripId: string; defaultName: string }): React.JSX.Element {
  const [name, setName] = useState(defaultName);
  const [channel, setChannel] = useState<"line" | "web_push" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribeWebPush(): Promise<{ endpoint: string; p256dh: string; auth: string } | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("เบราว์เซอร์ของคุณไม่รองรับ Web Push — ลองใช้ Chrome หรือ Edge");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError("ต้องอนุญาตการแจ้งเตือนของเบราว์เซอร์ก่อน");
      return null;
    }

    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (!reg) {
      setError("ไม่พบ service worker — กรุณาลองใหม่อีกครั้ง");
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError("ระบบยังไม่ได้ตั้งค่า Web Push (VAPID key)");
      return null;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    });

    const json = sub.toJSON();
    return {
      endpoint: json.endpoint ?? "",
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    };
  }

  async function handleConfirm(): Promise<void> {
    if (!channel || !name.trim() || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      if (channel === "line") {
        // LINE channel — operator's LINE OA flow not implemented yet on follower side
        setError("LINE OA channel ยังไม่เปิดให้ใช้ — กรุณาเลือก Web Push");
        return;
      }

      const subscription = await subscribeWebPush();
      if (!subscription) return;

      const { followWebPush } = await import("@/lib/trip-api");
      const { ApiError: ApiErrorCls } = await import("@/lib/client-api");

      try {
        await followWebPush({ tripId, displayName: name.trim(), subscription });
      } catch (err) {
        if (err instanceof ApiErrorCls) {
          setError(err.message);
        } else {
          setError("ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่");
        }
        return;
      }

      setIsSuccess(true);
      setTimeout(() => onClose(), 2000);
    } finally {
      setIsSubmitting(false);
    }
  }

  function urlBase64ToUint8Array(b64: string): Uint8Array {
    const padding = "=".repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  if (isSuccess) {
    return (
      <>
        <div className="fixed inset-0 bg-slate-900/60 glass-blur z-60" onClick={onClose} />
        <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-70 w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-line-green/10 text-line-green mb-5">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-slate-900 mb-2">เข้าร่วมสำเร็จ!</h2>
          <p className="text-on-surface-variant text-sm">คุณจะได้รับแจ้งเตือนเมื่อ plan มีการเปลี่ยนแปลง</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 glass-blur z-60" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-70 w-full max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hidden md:flex items-center justify-center hover:bg-slate-200">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="px-6 md:px-10 pt-10 pb-6 text-center border-b border-outline-variant/30">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue mb-5">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
          </div>
          <h2 className="font-headline font-extrabold text-2xl text-slate-900 mb-2">{t.followTrip}</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto">รับข้อมูลอัปเดตสำคัญจากไกด์แบบเรียลไทม์</p>
        </div>

        <div className="px-6 md:px-10 py-8 space-y-8">
          <div className="space-y-4">
            <label className="font-headline font-bold text-[11px] uppercase tracking-[0.15em] text-on-surface-variant">เลือกช่องทางรับข่าวสาร</label>
            <div className="grid gap-3">
              {/* LINE */}
              <button
                onClick={() => setChannel("line")}
                className={`group relative w-full text-left p-4 rounded-xl border-2 transition-all ${
                  channel === "line" ? "border-line-green bg-line-green/5" : "border-outline-variant/50 hover:border-line-green/50"
                }`}
              >
                <div className="absolute -top-2.5 right-4 bg-line-green text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">แนะนำ</div>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white border border-outline-variant rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-line-green text-2xl">chat_bubble</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">LINE OA Notifications</p>
                    <p className="text-[12px] text-on-surface-variant">อัปเดตผ่านบัญชีทางการ LINE</p>
                  </div>
                  <span className={`material-symbols-outlined text-line-green transition-opacity ${channel === "line" ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </button>

              {/* Web Push */}
              <button
                onClick={() => setChannel("web_push")}
                className={`group w-full text-left p-4 rounded-xl border-2 transition-all ${
                  channel === "web_push" ? "border-brand-blue bg-brand-blue/5" : "border-outline-variant/50 hover:border-brand-blue/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white border border-outline-variant rounded-lg flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-brand-blue text-2xl">notifications</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">Web Browser Push</p>
                    <p className="text-[12px] text-on-surface-variant">แจ้งเตือนผ่านบราวเซอร์</p>
                  </div>
                  <span className={`material-symbols-outlined text-brand-blue transition-opacity ${channel === "web_push" ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-headline font-bold text-[11px] uppercase tracking-[0.15em] text-on-surface-variant">ระบุชื่อของคุณ</label>
            <div className="relative">
              <input className="w-full h-12 bg-slate-50 border border-outline-variant rounded-lg px-4 pr-10 font-medium text-slate-900 focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white transition-all placeholder:text-slate-400 text-sm" placeholder="ชื่อ-นามสกุล หรือชื่อเล่น..." value={name} onChange={(e) => setName(e.target.value)} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl text-slate-300">person</span>
            </div>
            <div className="flex items-center gap-2 px-1">
              <span className="material-symbols-outlined text-brand-blue/60 text-lg">info</span>
              <p className="text-[11px] text-on-surface-variant italic">ไกด์จะใช้ชื่อนี้เพื่อระบุตัวตนในรายการผู้ติดตาม</p>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">error</span>
                <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={!channel || !name.trim() || isSubmitting}
              className="w-full h-14 bg-brand-blue text-white font-headline font-bold rounded-lg shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  Confirm & Follow
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
            <button onClick={onClose} className="w-full py-3 text-on-surface-variant hover:text-slate-900 font-semibold text-xs uppercase tracking-widest text-center">
              Not now, maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
