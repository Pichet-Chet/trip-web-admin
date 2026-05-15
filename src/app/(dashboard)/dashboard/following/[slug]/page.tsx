"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import {
  TripDayMapLazy, type MapActivity,
  Button, IconButton,
  Drawer,
  FormInput, DatePicker, SelectPicker, type SelectOption,
  SegmentedControl,
  Checkbox,
  Tabs, type TabItem,
  StatCard,
  StatusBadge, type StatusConfig,
  Spinner,
  ErrorState,
  EmptyState,
  ConfirmDialog,
  Avatar,
  CopyButton,
  QRCodeDisplay,
  Modal,
} from "@/components/shared";
import type { TripPublicResponse } from "@/lib/trip-api";

// ─── Types ───────────────────────────────────────────────────────────────────

type TripStatus = "upcoming" | "active" | "completed";

interface TripMember { id: string; displayName: string }

interface LiveActivity {
  id: string; time: string | null; name: string; description: string | null;
  type: string; placeName: string | null; lat: number | null; lng: number | null;
  mapsLink: string | null; imageUrl: string | null; emoji: string | null; sortOrder: number;
}
interface LiveDay {
  id: string; dayNumber: number; title: string; subtitle: string | null;
  coverImageUrl: string | null; date: string | null; isFreeDay: boolean; sortOrder: number;
  activities: LiveActivity[];
}

interface ExpenseParticipant { followerId: string; displayName: string; share: number; owedAmount: number }
interface Expense {
  id: string;
  paidByFollowerId: string;
  paidByName: string;
  amount: number;
  currency: string;
  description: string;
  occurredOn: string;
  splitMode: string;
  createdAt: string;
  participants: ExpenseParticipant[];
}

interface ExpenseFormState {
  paidByFollowerId: string;
  amount: string;
  currency: string;
  description: string;
  occurredOn: string;
  splitMode: "equal" | "shares" | "exact";
  selectedParticipants: string[];
  exactAmounts: Record<string, string>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveStatus(start: string, end: string): TripStatus {
  const now = Date.now();
  const startMs = new Date(start + "T00:00:00").getTime();
  const endMs = new Date(end + "T23:59:59").getTime();
  if (now < startMs) return "upcoming";
  if (now > endMs) return "completed";
  return "active";
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("th-TH", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T23:59:59");
  const fmt = (d: Date) => d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(s)} — ${fmt(e)}`;
}

function getDaysUntil(start: string): number {
  return Math.ceil((new Date(start + "T00:00:00").getTime() - Date.now()) / 86_400_000);
}

const ACTIVITY_TYPE_ICON: Record<string, string> = {
  attraction: "place",
  restaurant: "restaurant",
  hotel: "hotel",
  transport: "directions_bus",
  shopping: "shopping_bag",
  other: "radio_button_unchecked",
};

const MARKER_COLOR: Record<string, string> = {
  restaurant: "#E53935",
  hotel:      "#8E24AA",
  transport:  "#1E88E5",
  shopping:   "#FB8C00",
  attraction: "#00897B",
  other:      "#546E7A",
};

const TRIP_STATUS_CONFIG: Record<TripStatus, StatusConfig> = {
  upcoming:  { label: "กำลังจะถึง",   tone: "blue" },
  active:    { label: "กำลังเดินทาง", tone: "emerald" },
  completed: { label: "เสร็จสิ้น",    tone: "slate" },
};

const CURRENCY_OPTIONS: SelectOption[] = [
  { label: "THB", value: "THB" },
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "JPY", value: "JPY" },
  { label: "KRW", value: "KRW" },
  { label: "SGD", value: "SGD" },
];

function fmtAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FollowingDetailPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<TripPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState("itinerary");

  // Live itinerary (lat/lng from live table, not published snapshot)
  const [liveDays, setLiveDays] = useState<LiveDay[] | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Expenses state
  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [travelTimes, setTravelTimes] = useState<(string | null)[]>([]);
  const [leftPanelEl, setLeftPanelEl] = useState<HTMLDivElement | null>(null);
  const [mapHeight, setMapHeight] = useState(600);

  const defaultForm = (): ExpenseFormState => ({
    paidByFollowerId: "",
    amount: "",
    currency: "THB",
    description: "",
    occurredOn: new Date().toISOString().slice(0, 10),
    splitMode: "equal",
    selectedParticipants: [],
    exactAmounts: {},
  });
  const [form, setForm] = useState<ExpenseFormState>(defaultForm());

  usePageTitle(trip?.title ?? "รายละเอียดทริป");

  // Compute driving travel times between consecutive pinned activities
  useEffect(() => {
    setTravelTimes([]);
    if (!googleMapsApiKey) return;
    const acts = (liveDays ?? trip?.days ?? [])[selectedDay]?.activities ?? [];
    const pinned = acts.map((a) => (a.lat && a.lng ? { lat: a.lat, lng: a.lng } : null));
    const origins: { lat: number; lng: number }[] = [];
    const destinations: { lat: number; lng: number }[] = [];
    const idxMap: number[] = [];
    for (let i = 0; i < acts.length - 1; i++) {
      const from = pinned[i], to = pinned[i + 1];
      if (from && to) { origins.push(from); destinations.push(to); idxMap.push(i); }
    }
    if (origins.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const compute = (g: any) => {
      new g.maps.DistanceMatrixService().getDistanceMatrix(
        { origins, destinations, travelMode: "DRIVING" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any, status: string) => {
          if (status !== "OK") return;
          const times: (string | null)[] = new Array(acts.length - 1).fill(null);
          idxMap.forEach((actIdx, i) => {
            const el = result.rows[i]?.elements[i];
            if (el?.status === "OK") times[actIdx] = el.duration.text;
          });
          setTravelTimes(times);
        }
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.google?.maps) { compute(w.google); return; }
    if (w._gmapsLoading) { w._gmapsLoading.then(() => compute(w.google)); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, googleMapsApiKey, liveDays, trip]);

  // Sync map height to left panel content height (callback ref fires after DOM mount)
  useEffect(() => {
    if (!leftPanelEl) return;
    const observer = new ResizeObserver(([entry]) => {
      setMapHeight(Math.min(entry.contentRect.height, window.innerHeight - 73));
    });
    observer.observe(leftPanelEl);
    return () => observer.disconnect();
  }, [leftPanelEl]);

  useEffect(() => {
    Promise.all([
      api.get<TripPublicResponse>(`/client/t/${slug}`),
      api.get<{ googleMapsApiKey?: string | null }>("/staff/platform").catch(() => null),
    ])
      .then(([r, platform]) => {
        setTrip(r);
        setSelectedDay(0);
        if (platform?.googleMapsApiKey) setGoogleMapsApiKey(platform.googleMapsApiKey);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [slug]);

  const tripId = trip?.id;

  useEffect(() => {
    if (activeTab !== "expenses" || !tripId) return;
    setExpensesLoading(true);
    setExpensesError(null);
    Promise.all([
      api.get<TripMember[]>(`/member/trips/${tripId}/expenses/members`),
      api.get<Expense[]>(`/member/trips/${tripId}/expenses`),
      api.get<LiveDay[]>(`/member/trips/${tripId}/itinerary`),
    ])
      .then(([m, e, days]) => { setMembers(m); setExpenses(e); setLiveDays(days); })
      .catch((err) => setExpensesError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setExpensesLoading(false));
  }, [activeTab, tripId]);

  const tripStatus = useMemo(() =>
    trip ? deriveStatus(trip.startDate, trip.endDate) : "upcoming",
    [trip]
  );

  // Prefer live itinerary for coordinates (always current), fall back to published snapshot
  const sourceDays = liveDays ?? trip?.days ?? [];

  const toMapActivity = (a: { name: string; lat: number | null; lng: number | null; time?: string | null; type?: string | null; description?: string | null; placeName?: string | null; mapsLink?: string | null }): MapActivity => ({
    name: a.name,
    lat: a.lat!,
    lng: a.lng!,
    time: a.time ?? undefined,
    type: a.type,
    description: a.description ?? undefined,
    placeName: a.placeName ?? undefined,
    mapsLink: a.mapsLink ?? undefined,
  });

  const allMapActivities = useMemo((): MapActivity[] =>
    sourceDays.flatMap((d) =>
      d.activities
        .filter((a) => a.lat != null && a.lng != null)
        .map(toMapActivity)
    ), [sourceDays]);

  const dayMapActivities = useMemo((): MapActivity[] => {
    const day = sourceDays[selectedDay];
    if (!day) return [];
    return day.activities
      .filter((a) => a.lat != null && a.lng != null)
      .map(toMapActivity);
  }, [sourceDays, selectedDay]);

  const mapActivities = dayMapActivities.length > 0 ? dayMapActivities : allMapActivities;
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  // ─── Expense form ───────────────────────────────────────────────────

  function toggleParticipant(id: string) {
    setForm((f) => ({
      ...f,
      selectedParticipants: f.selectedParticipants.includes(id)
        ? f.selectedParticipants.filter((x) => x !== id)
        : [...f.selectedParticipants, id],
    }));
  }

  async function submitExpense() {
    if (!tripId) return;
    setFormError(null);

    const amount = parseFloat(form.amount);
    if (!form.paidByFollowerId) return setFormError("กรุณาเลือกผู้จ่าย");
    if (isNaN(amount) || amount <= 0) return setFormError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
    if (!form.description.trim()) return setFormError("กรุณาระบุรายละเอียด");
    if (form.selectedParticipants.length === 0) return setFormError("กรุณาเลือกผู้ร่วมจ่ายอย่างน้อย 1 คน");

    const participants = form.selectedParticipants.map((id) => ({
      followerId: id,
      share: form.splitMode === "exact"
        ? parseFloat(form.exactAmounts[id] || "0")
        : 1,
    }));

    if (form.splitMode === "exact") {
      const total = participants.reduce((s, p) => s + p.share, 0);
      if (Math.abs(total - amount) > 0.01)
        return setFormError(`ยอดรวมกำหนดเอง (${total}) ต้องเท่ากับจำนวนเงิน (${amount})`);
    }

    setSubmitting(true);
    try {
      const created = await api.post<Expense>(`/member/trips/${tripId}/expenses`, {
        paidByFollowerId: form.paidByFollowerId,
        amount,
        currency: form.currency,
        description: form.description.trim(),
        occurredOn: form.occurredOn,
        splitMode: form.splitMode,
        participants,
      });
      setExpenses((prev) => [...prev, created]);
      setForm(defaultForm());
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!tripId || !deleteTarget) return;
    try {
      await api.delete(`/member/trips/${tripId}/expenses/${deleteTarget}`);
      setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget));
    } finally {
      setDeleteTarget(null);
    }
  }

  // ─── Loading / error ────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (error || !trip) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <ErrorState
        message={error ?? "ไม่พบข้อมูลทริป"}
        onRetry={() => router.back()}
        retryLabel="กลับ"
      />
    </div>
  );

  const currentDay = trip.days[selectedDay];

  const tabItems: TabItem[] = [
    { id: "itinerary", label: "แผนการเดินทาง", icon: "map" },
    { id: "expenses",  label: "ค่าใช้จ่าย",    icon: "receipt_long" },
  ];

  const memberOptions: SelectOption[] = members.map((m) => ({ label: m.displayName, value: m.id }));

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-(--surface-container-lowest)">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-(--outline-variant)/20 px-4 md:px-8 py-3 flex items-center gap-2">
        <IconButton icon="arrow_back" variant="ghost" onClick={() => router.back()} />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm md:text-base text-(--on-surface) truncate">{trip.title}</h1>
          <p className="text-xs text-(--on-surface-variant) truncate">{trip.destination}</p>
        </div>
        <StatusBadge status={tripStatus} config={TRIP_STATUS_CONFIG} />
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton
            text={`${typeof window !== "undefined" ? window.location.origin : ""}/t/${trip.slug}`}
            label="คัดลอกลิงก์"
            copiedLabel="คัดลอกแล้ว!"
            variant="icon"
          />
          <IconButton icon="qr_code_2" variant="ghost" onClick={() => setShowQR(true)} />
        </div>
      </div>

      <div className="p-4 md:p-8">

        {/* Cover + meta */}
        <div className="rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
          {trip.coverImageUrl ? (
            <div className="relative aspect-[21/9] md:aspect-[3/1]">
              <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow">{trip.title}</h2>
                <p className="text-white/80 text-sm mt-1">{trip.destination}</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-2xl font-black text-(--on-surface)">{trip.title}</h2>
              <p className="text-(--on-surface-variant) text-sm mt-1">{trip.destination}</p>
            </div>
          )}
          <div className="px-5 md:px-8 py-4 flex flex-wrap gap-3 border-t border-(--outline-variant)/20">
            <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-lg text-(--primary)">calendar_today</span>
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-lg text-(--primary)">group</span>
              <span>{trip.travelersCount} คน</span>
            </div>
            {trip.company?.name && (
              <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
                <span className="material-symbols-outlined text-lg text-(--primary)">business</span>
                <span>{trip.company.name}</span>
              </div>
            )}
            {tripStatus === "upcoming" && getDaysUntil(trip.startDate) > 0 && (
              <span className="text-xs font-bold text-(--primary) flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">timer</span>
                อีก {getDaysUntil(trip.startDate)} วัน
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} />
        </div>

        {/* ── Itinerary tab ── */}
        {activeTab === "itinerary" && trip.days.length > 0 && (
          <div className="flex gap-8 items-start -mx-4 md:-mx-8 px-4 md:px-8">

            {/* ── Left: activity list (normal page flow) ── */}
            <div ref={setLeftPanelEl} className="w-[360px] xl:w-[420px] shrink-0 pb-8">

              {/* Day pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {trip.days.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(i)}
                    className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl border transition-all ${
                      selectedDay === i
                        ? "bg-(--primary) text-white border-(--primary) shadow-md"
                        : "bg-white text-(--on-surface-variant) border-(--outline-variant)/30 hover:border-(--primary)/30"
                    }`}
                  >
                    <span className="text-sm font-bold">Day {d.dayNumber}</span>
                    {d.date && (
                      <span className={`text-[10px] font-medium mt-0.5 ${selectedDay === i ? "text-white/70" : "text-(--outline)"}`}>
                        {new Date(d.date + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Day cover + title */}
              {currentDay && (
                <div className="mb-4 rounded-2xl overflow-hidden bg-white shadow-sm border border-(--outline-variant)/20">
                  {currentDay.coverImageUrl && (
                    <div className="relative h-36">
                      <img src={currentDay.coverImageUrl} alt={currentDay.title ?? ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4">
                        <p className="text-white font-bold text-base">{currentDay.title}</p>
                        {currentDay.subtitle && <p className="text-white/70 text-xs mt-0.5">{currentDay.subtitle}</p>}
                        {currentDay.date && <p className="text-white/60 text-xs">{formatDate(currentDay.date)}</p>}
                      </div>
                    </div>
                  )}
                  {!currentDay.coverImageUrl && (
                    <div className="px-5 py-4">
                      <p className="font-bold text-(--on-surface) text-base">{currentDay.title}</p>
                      {currentDay.subtitle && <p className="text-xs text-(--on-surface-variant) mt-0.5">{currentDay.subtitle}</p>}
                      {currentDay.date && <p className="text-xs text-(--outline) mt-1">{formatDate(currentDay.date)}</p>}
                    </div>
                  )}

                  {/* Activities */}
                  {currentDay.activities.length > 0 ? (
                    <div className="p-4 space-y-1">
                      {currentDay.activities.map((a, idx) => {
                        const color = MARKER_COLOR[a.type?.toLowerCase() ?? "other"] ?? MARKER_COLOR.other;
                        const hasPin = !!(a.lat && a.lng);
                        return (
                          <div key={a.id ?? idx} className="flex gap-3 py-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: hasPin ? color : "#cbd5e1" }}
                              >
                                {idx + 1}
                              </div>
                              {idx < currentDay.activities.length - 1 && (
                                <div className="flex flex-col items-center mt-2 flex-1 min-h-[24px]">
                                  <div className="w-px flex-1 bg-(--outline-variant)/25" />
                                  {travelTimes[idx] && (
                                    <div className="flex items-center gap-0.5 my-1 text-[10px] text-(--outline) whitespace-nowrap">
                                      <span className="material-symbols-outlined text-[11px]">directions_car</span>
                                      {travelTimes[idx]}
                                    </div>
                                  )}
                                  <div className="w-px flex-1 bg-(--outline-variant)/25" />
                                </div>
                              )}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-2">
                              {a.time && (
                                <span className="text-xs font-bold text-(--outline) tabular-nums mb-1 block">
                                  {a.time}
                                </span>
                              )}
                              <div className="flex gap-2 items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-(--on-surface) text-sm leading-snug">{a.name}</p>
                                  {a.placeName && a.placeName !== a.name && (
                                    <p className="text-xs text-(--on-surface-variant) mt-0.5 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                                      {a.placeName}
                                    </p>
                                  )}
                                  {a.description && (
                                    <p className="text-xs text-(--on-surface-variant) mt-1.5 leading-relaxed line-clamp-2">
                                      {a.description}
                                    </p>
                                  )}
                                  {a.mapsLink && (
                                    <a href={a.mapsLink} target="_blank" rel="noreferrer"
                                       className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#4285F4] hover:underline">
                                      <span className="material-symbols-outlined text-[13px]">map</span>
                                      Google Maps
                                    </a>
                                  )}
                                </div>
                                {a.imageUrl && (
                                  <img
                                    src={a.imageUrl}
                                    alt={a.name}
                                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6">
                      <EmptyState icon="event_busy" title="ไม่มีกิจกรรม" description="" />
                    </div>
                  )}
                </div>
              )}

              {/* Mobile: map button */}
              {(mapActivities.length > 0 || (trip.days[selectedDay]?.activities ?? []).some(a => a.mapsLink)) && (
                <button
                  onClick={() => setShowMapMobile(true)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-[#4285F4] text-white rounded-2xl font-semibold text-sm shadow-md"
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                  ดูแผนที่
                  {mapActivities.length > 0 && <span className="text-white/70 text-xs">({mapActivities.length} จุด)</span>}
                </button>
              )}
            </div>

            {/* ── Right: sticky Google Map ── */}
            <div className="hidden lg:block flex-1 min-w-0 sticky top-[73px]" style={{ height: `${mapHeight}px` }}>
              {mapActivities.length > 0 && googleMapsApiKey ? (
                <div className="h-full overflow-hidden rounded-2xl shadow-md">
                  <TripDayMapLazy activities={mapActivities} height="100%" apiKey={googleMapsApiKey} />
                </div>
              ) : (() => {
                const dayActs = (trip.days[selectedDay]?.activities ?? []).filter((a) => a.mapsLink);
                return (
                  <div className="h-full overflow-y-auto rounded-2xl bg-white border border-(--outline-variant)/20 shadow-sm">
                    {dayActs.length > 0 ? (
                      <div className="p-5 space-y-2">
                        <p className="text-sm font-semibold text-(--on-surface) mb-3">แผนที่ Day {currentDay?.dayNumber}</p>
                        <p className="text-xs text-(--outline) flex items-center gap-1.5 mb-4 bg-(--surface-container) rounded-xl px-3 py-2">
                          <span className="material-symbols-outlined text-sm">info</span>
                          ไม่มีพิกัด GPS — กดเปิดแต่ละจุดผ่าน Google Maps
                        </p>
                        {dayActs.map((a, i) => (
                          <a key={i} href={a.mapsLink!} target="_blank" rel="noreferrer"
                             className="flex items-center gap-3 p-3 bg-(--surface-container) rounded-xl hover:bg-(--surface-container-high) transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-[#4285F4] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              {a.time && <span className="text-[10px] font-mono text-(--outline)">{a.time} · </span>}
                              <p className="text-sm font-medium text-(--on-surface) truncate">{a.name}</p>
                              {a.placeName && <p className="text-xs text-(--on-surface-variant) truncate">{a.placeName}</p>}
                            </div>
                            <span className="material-symbols-outlined text-sm text-(--outline) group-hover:text-(--primary)">open_in_new</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <EmptyState icon="map" title="ไม่มีข้อมูลพิกัดสถานที่" description="ผู้ประกอบการยังไม่ได้เพิ่มข้อมูลแผนที่" />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Mobile map modal */}
        {showMapMobile && activeTab === "itinerary" && (
          <div className="fixed inset-0 z-50 bg-black/60 flex flex-col lg:hidden" onClick={() => setShowMapMobile(false)}>
            <div className="flex-1" />
            <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-(--outline-variant)/20">
                <p className="font-bold text-(--on-surface) text-sm">แผนที่ Day {currentDay?.dayNumber}</p>
                <button onClick={() => setShowMapMobile(false)} className="w-8 h-8 rounded-full bg-(--surface-container) flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="flex-1">
                {mapActivities.length > 0 && googleMapsApiKey ? (
                  <TripDayMapLazy activities={mapActivities} height="100%" apiKey={googleMapsApiKey} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <EmptyState icon="map" title="ไม่มีข้อมูลพิกัดสถานที่" description="ผู้ประกอบการยังไม่ได้เพิ่มข้อมูลแผนที่" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Expenses tab ── */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            {expensesLoading ? (
              <div className="py-16 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : expensesError ? (
              <div className="py-8 flex justify-center">
                <ErrorState message={`ไม่มีสิทธิ์เข้าถึง — คุณต้องเป็นสมาชิกทริป (Member) ที่ได้รับอนุมัติแล้ว`} />
              </div>
            ) : members.length === 0 ? (
              <EmptyState icon="group_off" title="ยังไม่มีสมาชิกในทริปนี้" description="" />
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard title="ยอดรวมทั้งหมด" value={fmtAmount(totalSpent, "THB")} icon="payments" tone="primary" />
                  <StatCard title="จำนวนรายการ" value={String(expenses.length)} icon="receipt_long" />
                  <div className="col-span-2 md:col-span-1"><StatCard title="สมาชิก" value={`${members.length} คน`} icon="group" /></div>
                </div>

                {/* Add button */}
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    icon="add"
                    onClick={() => { setForm(defaultForm()); setFormError(null); setShowForm(true); }}
                  >
                    บันทึกค่าใช้จ่าย
                  </Button>
                </div>

                {/* Expense list */}
                {expenses.length === 0 ? (
                  <EmptyState icon="receipt_long" title="ยังไม่มีรายการค่าใช้จ่าย" description="กดบันทึกค่าใช้จ่ายด้านบนเพื่อเริ่มต้น" onAction={() => setShowForm(true)} actionLabel="บันทึกรายการแรก" />
                ) : (
                  <div className="space-y-3">
                    {expenses.map((e) => (
                      <div key={e.id} className="bg-white rounded-2xl shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={e.paidByName} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-(--on-surface) text-sm leading-snug">{e.description}</p>
                              <p className="text-xs text-(--on-surface-variant) mt-0.5">
                                จ่ายโดย {e.paidByName} · {new Date(e.occurredOn + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-(--on-surface) text-sm">{fmtAmount(e.amount, e.currency)}</span>
                            <IconButton
                              icon="delete"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(e.id)}
                            />
                          </div>
                        </div>
                        {e.participants.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-(--outline-variant)/20 flex flex-wrap gap-2">
                            {e.participants.map((p) => (
                              <span key={p.followerId} className="text-[11px] bg-(--surface-variant) text-(--on-surface-variant) px-2.5 py-1 rounded-full">
                                {p.displayName} · {fmtAmount(p.owedAmount, e.currency)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Important notes */}
        {trip.importantNotes && activeTab === "itinerary" && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <h3 className="font-semibold text-amber-800 text-sm">หมายเหตุสำคัญ</h3>
            </div>
            <p className="text-sm text-amber-700 whitespace-pre-line">{trip.importantNotes}</p>
          </div>
        )}
      </div>

      {/* ── Expense Form Drawer ── */}
      <Drawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="บันทึกค่าใช้จ่าย"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} onClick={submitExpense}>
              บันทึก
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              {formError}
            </div>
          )}

          {/* Paid by */}
          <SelectPicker
            label="ผู้จ่าย"
            options={memberOptions}
            value={form.paidByFollowerId}
            onChange={(v) => setForm((f) => ({ ...f, paidByFollowerId: v as string }))}
            placeholder="-- เลือกผู้จ่าย --"
            searchable={false}
          />

          {/* Amount + currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <FormInput
                label="จำนวนเงิน"
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                min={0.01}
                step={0.01}
              />
            </div>
            <div className="w-28">
              <SelectPicker
                label="สกุลเงิน"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={(v) => setForm((f) => ({ ...f, currency: v as string }))}
                searchable={false}
              />
            </div>
          </div>

          {/* Description */}
          <FormInput
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="เช่น อาหารเย็น, ค่าแท็กซี่"
            maxLength={512}
          />

          {/* Date */}
          <DatePicker
            label="วันที่"
            value={form.occurredOn}
            onChange={(v) => setForm((f) => ({ ...f, occurredOn: v }))}
          />

          {/* Split mode */}
          <div>
            <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">วิธีหาร</p>
            <SegmentedControl<"equal" | "shares" | "exact">
              value={form.splitMode}
              onChange={(v) => setForm((f) => ({ ...f, splitMode: v }))}
              options={[
                { label: "หารเท่า", value: "equal" },
                { label: "ตามสัดส่วน", value: "shares" },
                { label: "กำหนดเอง", value: "exact" },
              ]}
            />
          </div>

          {/* Participants */}
          <div>
            <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">ผู้ร่วมจ่าย</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {members.map((m) => {
                const checked = form.selectedParticipants.includes(m.id);
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-(--surface-variant)">
                    <Checkbox
                      checked={checked}
                      onChange={(_checked) => toggleParticipant(m.id)}
                      label={m.displayName}
                    />
                    {form.splitMode === "exact" && checked && (
                      <div className="ml-auto w-24">
                        <FormInput
                          type="number"
                          value={form.exactAmounts[m.id] ?? ""}
                          onChange={(e) => setForm((f) => ({
                            ...f,
                            exactAmounts: { ...f.exactAmounts, [m.id]: e.target.value },
                          }))}
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบรายการ"
        description="ต้องการลบรายการค่าใช้จ่ายนี้?"
        confirmLabel="ลบ"
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* QR Code Modal */}
      <Modal open={showQR} onClose={() => setShowQR(false)} title="แชร์ทริปนี้" size="sm">
        <div className="flex flex-col items-center gap-5 py-2">
          <QRCodeDisplay
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/t/${trip.slug}`}
            size={220}
            icon="travel_explore"
          />
          <div className="w-full space-y-2">
            <p className="text-xs text-(--on-surface-variant) text-center">ลิงก์สาธารณะ</p>
            <div className="flex items-center gap-2 bg-(--surface-variant) rounded-xl px-3 py-2">
              <span className="text-xs text-(--on-surface) flex-1 truncate font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}/t/{trip.slug}
              </span>
              <CopyButton
                text={`${typeof window !== "undefined" ? window.location.origin : ""}/t/${trip.slug}`}
                variant="icon"
                size="sm"
              />
            </div>
          </div>
          <p className="text-xs text-(--outline) text-center">
            แชร์ลิงก์หรือ QR Code นี้ให้ผู้ที่ต้องการเข้าร่วมทริปสแกนเพื่อดูรายละเอียด
          </p>
        </div>
      </Modal>
    </div>
  );
}
