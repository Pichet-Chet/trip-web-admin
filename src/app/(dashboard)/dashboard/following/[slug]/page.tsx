"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  useToast,
  SectionHeader,
  Accordion,
  Card, CardBody,
  Badge,
  Divider,
  Rating,
  ImageUpload,
} from "@/components/shared";
import type { TripPublicResponse } from "@/lib/trip-api";
import { PlaceAutocompleteInput, type PlaceResult } from "@/app/(dashboard)/dashboard/trips/[id]/edit/_components/place-autocomplete-input";

// ─── Types ───────────────────────────────────────────────────────────────────

type TripStatus = "upcoming" | "active" | "completed";

interface TripMember { id: string; displayName: string; logoUrl: string | null; groupRole: string | null; joinedAt: string; isMe: boolean }

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
  isPersonal: boolean;
  createdAt: string;
  participants: ExpenseParticipant[];
}

interface BalanceSummary {
  followerId: string;
  displayName: string;
  netBalance: number;
  totalPaid: number;
  totalOwed: number;
}
interface SettlementTransaction {
  fromFollowerId: string;
  fromName: string;
  toFollowerId: string;
  toName: string;
  amount: number;
  currency: string;
}
interface SettlementResponse {
  balances: BalanceSummary[];
  transactions: SettlementTransaction[];
}

interface Recommendation {
  id: string;
  category: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string | null;
  googlePlaceId: string | null;
  createdByFollowerId: string;
  createdByName: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

interface SavedPlaceOption {
  id: string;
  name: string;
  location: string | null;
  category: string;
  mapsLink: string | null;
}

type RecommendationCategory = "all" | "restaurant" | "cafe" | "attraction" | "hotel" | "shopping" | "transport" | "nature" | "other";

interface ExpenseFormState {
  paidByFollowerId: string;
  amount: string;
  currency: string;
  description: string;
  occurredOn: string;
  splitMode: "equal" | "shares" | "exact";
  isPersonal: boolean;
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

const ACTIVITY_TYPE_META: Record<string, { icon: string; label: string }> = {
  restaurant: { icon: "restaurant",    label: "ร้านอาหาร" },
  cafe:       { icon: "coffee",        label: "คาเฟ่" },
  attraction: { icon: "place",         label: "สถานที่ท่องเที่ยว" },
  hotel:      { icon: "hotel",         label: "ที่พัก" },
  shopping:   { icon: "shopping_bag",  label: "ช้อปปิ้ง" },
  transport:  { icon: "directions_bus",label: "การเดินทาง" },
  nature:     { icon: "forest",        label: "ธรรมชาติ" },
  other:      { icon: "category",      label: "อื่น ๆ" },
};

const MARKER_COLOR: Record<string, string> = {
  restaurant: "#E53935",
  cafe:       "#F57C00",
  attraction: "#00897B",
  hotel:      "#8E24AA",
  shopping:   "#FB8C00",
  transport:  "#1E88E5",
  nature:     "#43A047",
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

const REC_CATEGORIES: { id: RecommendationCategory; label: string; icon: string }[] = [
  { id: "all",        label: "ทั้งหมด",            icon: "apps" },
  { id: "restaurant", label: "ร้านอาหาร",           icon: "restaurant" },
  { id: "cafe",       label: "คาเฟ่",               icon: "coffee" },
  { id: "attraction", label: "สถานที่ท่องเที่ยว",    icon: "place" },
  { id: "hotel",      label: "ที่พัก",               icon: "hotel" },
  { id: "shopping",   label: "ช้อปปิ้ง",            icon: "shopping_bag" },
  { id: "transport",  label: "การเดินทาง",           icon: "directions_bus" },
  { id: "nature",     label: "ธรรมชาติ",             icon: "forest" },
  { id: "other",      label: "อื่น ๆ",               icon: "category" },
];

function fmtAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FollowingDetailPage(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [trip, setTrip] = useState<TripPublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(Math.max(0, parseInt(searchParams.get("day") ?? "0", 10)));
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "itinerary");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`?tab=${tab}&day=${selectedDay}`, { scroll: false });
  };
  const handleDayChange = (i: number) => {
    setSelectedDay(i);
    router.replace(`?tab=${activeTab}&day=${i}`, { scroll: false });
  };

  // Live itinerary (lat/lng from live table, not published snapshot)
  const [liveDays, setLiveDays] = useState<LiveDay[] | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);

  // Expenses state
  const [myFollowerId, setMyFollowerId] = useState<string>("");
  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [settlement, setSettlement] = useState<SettlementResponse | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [travelTimes, setTravelTimes] = useState<(string | null)[]>([]);

  // Review state
  const [myRating, setMyRating] = useState<{ id: string; overallScore: number; guideScore: number | null; itineraryScore: number | null; valueScore: number | null; comment: string | null; imageUrls: string[] } | null | undefined>(undefined);
  const [ratingAgg, setRatingAgg] = useState<{ count: number; avgOverall: number | null; avgGuide: number | null; avgItinerary: number | null; avgValue: number | null; comments: { items: { comment: string; overallScore: number; createdAt: string; firstName: string; imageUrls: string[] }[]; totalCount: number; hasNext: boolean } } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ overall: 0, guide: 0, itinerary: 0, value: 0, comment: "", imageUrls: [] as string[] });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recCategory, setRecCategory] = useState<RecommendationCategory>("all");
  const [showRecForm, setShowRecForm] = useState(false);
  const [recFormError, setRecFormError] = useState<string | null>(null);
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recForm, setRecForm] = useState({ name: "", description: "", category: "restaurant", mapsLink: "", lat: null as number | null, lng: null as number | null, googlePlaceId: "", imageUrl: "" });
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceOption[]>([]);
  const [recDeleteTarget, setRecDeleteTarget] = useState<string | null>(null);
  const [leftPanelEl, setLeftPanelEl] = useState<HTMLDivElement | null>(null);
  const [mapHeight, setMapHeight] = useState(450);

  const defaultForm = (): ExpenseFormState => ({
    paidByFollowerId: "",
    amount: "",
    currency: "THB",
    description: "",
    occurredOn: new Date().toISOString().slice(0, 10),
    splitMode: "equal",
    isPersonal: false,
    selectedParticipants: [],
    exactAmounts: {},
  });
  const [form, setForm] = useState<ExpenseFormState>(defaultForm());
  const [formSnapshot, setFormSnapshot] = useState<string>("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

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
      setMapHeight(Math.min(entry.contentRect.height, window.innerHeight * 0.9));
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

  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "members" || !tripId || members.length > 0) return;
    setMembersLoading(true);
    api.get<{ myFollowerId: string; totalCount: number; members: TripMember[] }>(`/member/trips/${tripId}/members`)
      .then((res) => { setMyFollowerId(res.myFollowerId); setMembers(res.members); })
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [activeTab, tripId]);

  useEffect(() => {
    if (activeTab !== "expenses" || !tripId) return;
    setExpensesLoading(true);
    setExpensesError(null);
    Promise.all([
      api.get<{ myFollowerId: string; members: TripMember[] }>(`/member/trips/${tripId}/expenses/members`),
      api.get<Expense[]>(`/member/trips/${tripId}/expenses`),
      api.get<LiveDay[]>(`/member/trips/${tripId}/itinerary`),
    ])
      .then(([res, e, days]) => { setMyFollowerId(res.myFollowerId); setMembers(res.members); setExpenses(e); setLiveDays(days); })
      .catch((err) => setExpensesError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setExpensesLoading(false));
  }, [activeTab, tripId]);

  useEffect(() => {
    if (activeTab !== "settlement" || !tripId || settlement) return;
    setSettlementLoading(true);
    api.get<SettlementResponse>(`/member/trips/${tripId}/expenses/settlement`)
      .then(setSettlement)
      .catch(() => setSettlement(null))
      .finally(() => setSettlementLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tripId]);

  useEffect(() => {
    if (activeTab !== "recommendations" || !tripId) return;
    setRecLoading(true);
    Promise.all([
      api.get<Recommendation[]>(`/member/trips/${tripId}/recommendations`),
      api.get<SavedPlaceOption[]>(`/member/trips/${tripId}/recommendations/saved-places`),
    ])
      .then(([recs, places]) => { setRecommendations(recs); setSavedPlaces(places); })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [activeTab, tripId]);

  // Review data fetch
  useEffect(() => {
    if (activeTab !== "review" || !tripId) return;
    setReviewLoading(true);
    Promise.all([
      api.get<typeof myRating>(`/member/trips/${tripId}/rating/me`),
      api.get<typeof ratingAgg>(`/member/trips/${tripId}/rating`),
    ])
      .then(([mine, agg]: [any, any]) => {
        setMyRating(mine ?? null);
        if (agg && (agg as any).recentComments && !agg.comments) {
          agg.comments = { items: (agg as any).recentComments, totalCount: (agg as any).recentComments.length, hasNext: false };
        }
        setRatingAgg(agg);
        if (mine) {
          setReviewForm({ overall: mine.overallScore, guide: mine.guideScore ?? 0, itinerary: mine.itineraryScore ?? 0, value: mine.valueScore ?? 0, comment: mine.comment ?? "", imageUrls: mine.imageUrls ?? [] });
        }
      })
      .catch(() => {})
      .finally(() => setReviewLoading(false));
  }, [activeTab, tripId]);

  const tripStatus = useMemo(() =>
    trip ? deriveStatus(trip.startDate, trip.endDate) : "upcoming",
    [trip]
  );

  // Prefer live itinerary for coordinates (always current), fall back to published snapshot
  const sourceDays = liveDays ?? trip?.days ?? [];

  const toMapActivity = (a: { name: string; lat: number | null; lng: number | null; time?: string | null; type?: string | null; description?: string | null; placeName?: string | null; mapsLink?: string | null; imageUrl?: string | null }): MapActivity => ({
    name: a.name,
    lat: a.lat!,
    lng: a.lng!,
    time: a.time ?? undefined,
    type: a.type,
    description: a.description ?? undefined,
    placeName: a.placeName ?? undefined,
    mapsLink: a.mapsLink ?? undefined,
    imageUrl: a.imageUrl ?? undefined,
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

  function openEdit(e: Expense) {
    setEditingId(e.id);
    const f: ExpenseFormState = {
      paidByFollowerId: e.paidByFollowerId,
      amount: String(e.amount),
      currency: e.currency,
      description: e.description,
      occurredOn: e.occurredOn,
      splitMode: e.splitMode as "equal" | "shares" | "exact",
      isPersonal: e.isPersonal,
      selectedParticipants: e.participants.map((p) => p.followerId),
      exactAmounts: Object.fromEntries(e.participants.map((p) => [p.followerId, String(p.share)])),
    };
    setForm(f);
    setFormSnapshot(JSON.stringify(f));
    setFormError(null);
    setShowForm(true);
  }

  function handleCloseForm() {
    const isDirty = JSON.stringify(form) !== formSnapshot;
    if (isDirty && (form.description || form.amount || form.paidByFollowerId)) {
      setShowDiscardConfirm(true);
    } else {
      setShowForm(false);
      setEditingId(null);
    }
  }

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
    const effectivePayer = form.isPersonal ? myFollowerId : form.paidByFollowerId;
    if (!effectivePayer) return setFormError("กรุณาเลือกผู้จ่าย");
    if (isNaN(amount) || amount <= 0) return setFormError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
    if (!form.description.trim()) return setFormError("กรุณาระบุรายละเอียด");

    const effectiveParticipants = form.isPersonal ? [myFollowerId] : form.selectedParticipants;
    if (effectiveParticipants.length === 0) return setFormError("กรุณาเลือกผู้ร่วมจ่ายอย่างน้อย 1 คน");

    const participants = effectiveParticipants.map((id) => ({
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
      const body = {
        paidByFollowerId: effectivePayer,
        amount,
        currency: form.currency,
        description: form.description.trim(),
        occurredOn: form.occurredOn,
        splitMode: form.isPersonal ? "equal" : form.splitMode,
        isPersonal: form.isPersonal,
        participants,
      };
      if (editingId) {
        const updated = await api.put<Expense>(`/member/trips/${tripId}/expenses/${editingId}`, body);
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
        toast.success("อัปเดตเรียบร้อย");
      } else {
        const created = await api.post<Expense>(`/member/trips/${tripId}/expenses`, body);
        setExpenses((prev) => [...prev, created]);
        toast.success("บันทึกเรียบร้อย");
      }
      setEditingId(null);
      setForm(defaultForm());
      setShowForm(false);
      setSettlement(null);
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
      setSettlement(null);
      toast.success("ลบเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleteTarget(null);
    }
  }

  // ─── Recommendation helpers ──────────────────────────────────────────

  async function submitRecommendation() {
    if (!tripId) return;
    setRecFormError(null);
    if (!recForm.name.trim()) return setRecFormError("กรุณาระบุชื่อสถานที่");

    setRecSubmitting(true);
    try {
      const created = await api.post<Recommendation>(`/member/trips/${tripId}/recommendations`, {
        name: recForm.name.trim(),
        description: recForm.description.trim() || null,
        category: recForm.category,
        mapsLink: recForm.mapsLink.trim() || null,
        lat: recForm.lat,
        lng: recForm.lng,
        googlePlaceId: recForm.googlePlaceId.trim() || null,
        imageUrl: recForm.imageUrl.trim() || null,
      });
      setRecommendations((prev) => [created, ...prev]);
      setRecForm({ name: "", description: "", category: "restaurant", mapsLink: "", lat: null, lng: null, googlePlaceId: "", imageUrl: "" });
      setShowRecForm(false);
      toast.success("เพิ่มรายการแนะนำแล้ว");
    } catch (err) {
      setRecFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setRecSubmitting(false);
    }
  }

  async function toggleLike(recId: string) {
    if (!tripId) return;
    const rec = recommendations.find((r) => r.id === recId);
    if (!rec) return;

    try {
      if (rec.likedByMe) {
        const res = await api.delete<{ liked: boolean; likeCount: number }>(`/member/trips/${tripId}/recommendations/${recId}/like`);
        setRecommendations((prev) => prev.map((r) => r.id === recId ? { ...r, likedByMe: false, likeCount: res.likeCount } : r));
      } else {
        const res = await api.post<{ liked: boolean; likeCount: number }>(`/member/trips/${tripId}/recommendations/${recId}/like`);
        setRecommendations((prev) => prev.map((r) => r.id === recId ? { ...r, likedByMe: true, likeCount: res.likeCount } : r));
      }
    } catch { /* ignore */ }
  }

  async function confirmDeleteRecommendation() {
    if (!tripId || !recDeleteTarget) return;
    try {
      await api.delete(`/member/trips/${tripId}/recommendations/${recDeleteTarget}`);
      setRecommendations((prev) => prev.filter((r) => r.id !== recDeleteTarget));
      toast.success("ลบเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setRecDeleteTarget(null);
    }
  }

  function fillFromSavedPlace(place: SavedPlaceOption) {
    setRecForm((f) => ({
      ...f,
      name: place.name,
      category: ["restaurant", "cafe", "attraction", "shopping"].includes(place.category) ? place.category : "other",
      mapsLink: place.mapsLink ?? "",
      lat: null,
      lng: null,
      googlePlaceId: "",
    }));
  }

  function handlePlaceSelect(result: PlaceResult) {
    setRecForm((f) => ({
      ...f,
      name: result.placeName,
      lat: result.lat,
      lng: result.lng,
      mapsLink: result.mapsLink,
      imageUrl: result.imageUrl ?? "",
    }));
  }

  const filteredRecs = recCategory === "all"
    ? recommendations
    : recommendations.filter((r) => r.category === recCategory);

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
    { id: "members",   label: "สมาชิก",       icon: "group" },
    { id: "tripinfo",  label: "เตรียมเดินทาง",  icon: "luggage" },
    { id: "recommendations", label: "แนะนำ",     icon: "thumb_up" },
    { id: "expenses",  label: "ค่าใช้จ่าย",    icon: "receipt_long" },
    { id: "settlement", label: "คำนวณหนี้",     icon: "calculate" },
    ...(tripStatus === "completed" ? [{ id: "review", label: "รีวิว", icon: "star" } as TabItem] : []),
  ];

  const memberOptions: SelectOption[] = members.map((m) => ({ label: m.displayName, value: m.id }));

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-(--surface-container-lowest)">

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-(--outline-variant)/20 px-4 md:px-8 py-3 flex items-center gap-2">
        <IconButton icon="arrow_back" variant="ghost" onClick={() => router.back()} aria-label="กลับ" />
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
          <IconButton icon="qr_code_2" variant="ghost" onClick={() => setShowQR(true)} aria-label="แสดง QR Code" />
        </div>
      </header>

      <main className="p-4 md:p-8">

        {/* Cover + meta */}
        <div className="rounded-2xl overflow-hidden bg-white shadow-sm mb-6">
          {trip.coverImageUrl ? (
            <div className="relative aspect-[21/9] md:aspect-[3/1]">
              <img src={trip.coverImageUrl} alt={trip.title} className="w-full h-full object-cover" width={1200} height={400} loading="lazy" />
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
              <span className="material-symbols-outlined text-lg text-(--primary)" aria-hidden="true">calendar_today</span>
              <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
              <span className="material-symbols-outlined text-lg text-(--primary)" aria-hidden="true">group</span>
              <span>{trip.travelersCount} คน</span>
            </div>
            {trip.company?.name && (
              <div className="flex items-center gap-2 text-sm text-(--on-surface-variant)">
                <span className="material-symbols-outlined text-lg text-(--primary)" aria-hidden="true">business</span>
                <span>{trip.company.name}</span>
              </div>
            )}
            {tripStatus === "upcoming" && getDaysUntil(trip.startDate) > 0 && (
              <span className="text-xs font-bold text-(--primary) flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">timer</span>
                อีก <span className="tabular-nums">{getDaysUntil(trip.startDate)}</span> วัน
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs items={tabItems} value={activeTab} onChange={handleTabChange} />
        </div>

        {/* ── Itinerary tab ── */}
        {activeTab === "itinerary" && (
          trip.days.length === 0 ? (
            <EmptyState icon="map" title="ยังไม่มีแผนการเดินทาง" description="ผู้ประกอบการยังไม่ได้เพิ่มข้อมูลแผนการเดินทาง" />
          ) : (
          <div className="flex gap-8 items-start -mx-4 md:-mx-8 px-4 md:px-8">

            {/* ── Left: activity list (normal page flow) ── */}
            <div ref={setLeftPanelEl} className="w-full lg:w-[360px] xl:w-[420px] shrink-0 pb-8">

              {/* Day pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide" role="tablist" aria-label="เลือกวัน">
                {trip.days.map((d, i) => (
                  <button
                    key={d.id}
                    role="tab"
                    aria-selected={selectedDay === i}
                    onClick={() => handleDayChange(i)}
                    aria-label={`วันที่ ${d.dayNumber}${d.date ? ` - ${d.date}` : ''}`}
                    className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-2xl border cursor-pointer transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none ${
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
                      <img src={currentDay.coverImageUrl} alt={currentDay.title ?? ""} className="w-full h-full object-cover" width={400} height={144} loading="lazy" />
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
                    <div className="px-4 pt-2 pb-4">
                      {currentDay.activities.map((a, idx) => {
                        const typeKey = a.type?.toLowerCase() ?? "other";
                        const typeMeta = ACTIVITY_TYPE_META[typeKey] ?? ACTIVITY_TYPE_META.other;
                        const hasPin = !!(a.lat && a.lng);
                        const color = "#1978e5";
                        const isLast = idx === currentDay.activities.length - 1;
                        return (
                          <div key={a.id ?? idx} className="flex gap-3">
                            {/* Timeline column */}
                            <div className="flex flex-col items-center shrink-0 pt-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                                style={{ backgroundColor: hasPin ? color : "#e2e8f0" }}
                              >
                                {a.emoji ?? idx + 1}
                              </div>
                              {!isLast && (
                                <div className="flex flex-col items-center flex-1 min-h-[32px] mt-1">
                                  <div className="w-px flex-1 bg-(--outline-variant)/50" />
                                  {travelTimes[idx] && (
                                    <div className="flex items-center gap-0.5 my-1 px-1.5 py-0.5 rounded-full bg-(--surface-variant) text-[10px] text-(--on-surface-variant) whitespace-nowrap">
                                      <span className="material-symbols-outlined text-[11px]" aria-hidden="true">directions_car</span>
                                      {travelTimes[idx]}
                                    </div>
                                  )}
                                  <div className="w-px flex-1 bg-(--outline-variant)/50" />
                                </div>
                              )}
                            </div>

                            {/* Card */}
                            <div className={`flex-1 min-w-0 ${isLast ? "pb-2" : "pb-1"}`}>
                              <div className="rounded-xl border border-(--outline-variant)/40 bg-(--surface) overflow-hidden mt-2 mb-1">
                                {a.imageUrl && (
                                  <img
                                    src={a.imageUrl}
                                    alt={a.name}
                                    className="w-full h-32 object-cover"
                                    width={320}
                                    height={128}
                                    loading="lazy"
                                  />
                                )}
                                <div className="p-3">
                                  {/* Time + name */}
                                  {a.time && (
                                    <p className="text-[11px] font-bold tabular-nums mb-0.5" style={{ color }}>
                                      {a.time}
                                    </p>
                                  )}
                                  <p className="font-semibold text-(--on-surface) text-sm leading-snug">{a.name}</p>

                                  {/* Type badge */}
                                  <span
                                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                    style={{ backgroundColor: `${color}18`, color }}
                                  >
                                    <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{typeMeta.icon}</span>
                                    {typeMeta.label}
                                  </span>

                                  {/* Place name */}
                                  {a.placeName && a.placeName !== a.name && (
                                    <p className="flex items-center gap-1 mt-2 text-xs font-medium text-(--on-surface-variant)">
                                      <span className="material-symbols-outlined text-[13px] text-(--outline)" aria-hidden="true">location_on</span>
                                      {a.placeName}
                                    </p>
                                  )}

                                  {/* Description */}
                                  {a.description && (
                                    <p className="mt-1.5 text-[11px] text-(--outline) leading-relaxed line-clamp-2">
                                      {a.description}
                                    </p>
                                  )}

                                  {/* Maps link chip */}
                                  {a.mapsLink && (
                                    <a
                                      href={a.mapsLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-1"
                                      style={{ backgroundColor: "#4285F4" }}
                                      aria-label={`เปิด ${a.name} ใน Google Maps`}
                                    >
                                      <span className="material-symbols-outlined text-[12px]" aria-hidden="true">map</span>
                                      Google Maps
                                    </a>
                                  )}
                                </div>
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
                  className="lg:hidden w-full flex items-center justify-center gap-2 py-3 bg-[#4285F4] text-white rounded-2xl font-semibold text-sm shadow-md focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">map</span>
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
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">info</span>
                          ไม่มีพิกัด GPS — กดเปิดแต่ละจุดผ่าน Google Maps
                        </p>
                        {dayActs.map((a, i) => (
                          <a key={a.mapsLink ?? i} href={a.mapsLink!} target="_blank" rel="noreferrer"
                             className="flex items-center gap-3 p-3 bg-(--surface-container) rounded-xl hover:bg-(--surface-container-high) transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-[#4285F4] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              {a.time && <span className="text-[10px] font-mono text-(--outline)">{a.time} · </span>}
                              <p className="text-sm font-medium text-(--on-surface) truncate">{a.name}</p>
                              {a.placeName && <p className="text-xs text-(--on-surface-variant) truncate">{a.placeName}</p>}
                            </div>
                            <span className="material-symbols-outlined text-sm text-(--outline) group-hover:text-(--primary)" aria-hidden="true">open_in_new</span>
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
          )
        )}

        {/* Mobile map modal */}
        {showMapMobile && activeTab === "itinerary" && (
          <div className="fixed inset-0 z-50 bg-black/60 flex flex-col lg:hidden" role="dialog" aria-modal="true" aria-label="แผนที่" onClick={() => setShowMapMobile(false)}>
            <div className="flex-1" />
            <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-(--outline-variant)/20">
                <p className="font-bold text-(--on-surface) text-sm">แผนที่ Day {currentDay?.dayNumber}</p>
                <button onClick={() => setShowMapMobile(false)} aria-label="ปิดแผนที่" className="w-8 h-8 rounded-full bg-(--surface-container) flex items-center justify-center focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none">
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
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

        {/* ── Members tab ── */}
        {activeTab === "members" && (
          membersLoading ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-3 border-(--primary) border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <EmptyState icon="group" title="ยังไม่มีสมาชิก" description="ยังไม่มีใครเข้าร่วมทริปนี้" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-(--on-surface)">สมาชิกทั้งหมด ({members.length})</h2>
              </div>
              {members.map((m) => {
                const roleLabels: Record<string, { label: string; color: string }> = {
                  head_of_group: { label: "หัวหน้ากลุ่ม", color: "bg-amber-100 text-amber-800" },
                  expense_keeper: { label: "ดูแลค่าใช้จ่าย", color: "bg-emerald-100 text-emerald-800" },
                  driver: { label: "คนขับ", color: "bg-blue-100 text-blue-800" },
                };
                const role = m.groupRole ? roleLabels[m.groupRole] ?? { label: m.groupRole, color: "bg-slate-100 text-slate-700" } : null;
                return (
                  <div key={m.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${m.isMe ? "bg-(--primary-container)/20 border-(--primary)/30" : "bg-white border-(--outline-variant)/20"}`}>
                    {m.logoUrl ? (
                      <img src={m.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-slate-100" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${m.isMe ? "bg-(--primary) text-white" : "bg-slate-100 text-slate-500"}`}>
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-(--on-surface) truncate">{m.displayName}</span>
                        {m.isMe && <span className="text-[10px] font-bold text-(--primary) bg-(--primary-container)/40 px-1.5 py-0.5 rounded-full">ฉัน</span>}
                        {role && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${role.color}`}>{role.label}</span>}
                      </div>
                      <p className="text-xs text-(--outline) mt-0.5">
                        เข้าร่วมเมื่อ {new Date(m.joinedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── Trip Info tab ── */}
        {activeTab === "tripinfo" && (
          <div className="space-y-6">

            {/* ── Flights / Transport ── */}
            {trip.airlineInfo.length > 0 && (
              <section>
                <SectionHeader title="เที่ยวบิน / การเดินทาง" icon="flight" variant="icon" color="blue" />
                <div className="mt-3 space-y-3">
                  {trip.airlineInfo.map((a, i) => {
                    const isReturn = a.type?.toLowerCase() === "return";
                    return (
                      <Card key={i} padding="none">
                        <CardBody>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={isReturn ? "info" : "primary"} icon={isReturn ? "flight_land" : "flight_takeoff"}>
                              {isReturn ? "ขากลับ" : "ขาไป"}
                            </Badge>
                            {a.airline && <span className="text-xs font-semibold text-(--on-surface)">{a.airline}</span>}
                            {a.flightNumber && <span className="text-xs text-(--on-surface-variant)">({a.flightNumber})</span>}
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Departure */}
                            <div className="flex-1 text-center">
                              <p className="text-lg font-black text-(--on-surface) tabular-nums">{a.departureTime || "--:--"}</p>
                              <p className="text-xs font-semibold text-(--on-surface-variant) mt-0.5">{a.departureAirport || "ต้นทาง"}</p>
                            </div>

                            {/* Arrow */}
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <div className="w-16 h-px bg-(--outline-variant)" />
                              <span className="material-symbols-outlined text-sm text-(--outline)" aria-hidden="true">
                                {isReturn ? "flight_land" : "flight_takeoff"}
                              </span>
                              <div className="w-16 h-px bg-(--outline-variant)" />
                            </div>

                            {/* Arrival */}
                            <div className="flex-1 text-center">
                              <p className="text-lg font-black text-(--on-surface) tabular-nums">{a.arrivalTime || "--:--"}</p>
                              <p className="text-xs font-semibold text-(--on-surface-variant) mt-0.5">{a.arrivalAirport || "ปลายทาง"}</p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Accommodations ── */}
            {trip.accommodations.length > 0 && (
              <section>
                <SectionHeader title="ที่พัก" icon="hotel" variant="icon" color="violet" />
                <div className="mt-3 space-y-3">
                  {trip.accommodations.map((acc, i) => (
                    <Card key={i} padding="none">
                      <CardBody>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-violet-600" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }} aria-hidden="true">hotel</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-(--on-surface) text-sm">{acc.name}</p>
                            {acc.address && (
                              <p className="text-xs text-(--on-surface-variant) mt-1 flex items-start gap-1">
                                <span className="material-symbols-outlined text-xs mt-0.5 shrink-0" aria-hidden="true">location_on</span>
                                {acc.address}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              {acc.checkIn && (
                                <span className="text-xs text-(--on-surface-variant) flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs" aria-hidden="true">login</span>
                                  เช็คอิน {acc.checkIn}
                                </span>
                              )}
                              {acc.checkOut && (
                                <span className="text-xs text-(--on-surface-variant) flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs" aria-hidden="true">logout</span>
                                  เช็คเอาต์ {acc.checkOut}
                                </span>
                              )}
                              {acc.nights > 0 && (
                                <span className="text-xs text-(--on-surface-variant) flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs" aria-hidden="true">dark_mode</span>
                                  {acc.nights} คืน
                                </span>
                              )}
                            </div>
                            {acc.phone && (
                              <a href={`tel:${acc.phone}`} className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-(--primary)">
                                <span className="material-symbols-outlined text-xs" aria-hidden="true">call</span>
                                {acc.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ── Emergency Contacts ── */}
            {trip.emergencyContacts.length > 0 && (
              <section>
                <SectionHeader title="เบอร์ฉุกเฉิน" icon="emergency" variant="icon" color="rose" />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trip.emergencyContacts.map((ec, i) => (
                    <Card key={i} padding="none">
                      <CardBody>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-rose-600" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }} aria-hidden="true">
                              {ec.icon && !ec.icon.startsWith("�") ? ec.icon : "call"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-(--on-surface) text-sm">{ec.name}</p>
                            <a href={`tel:${ec.phone}`} className="text-xs font-semibold text-(--primary) flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-xs" aria-hidden="true">call</span>
                              {ec.phone}
                            </a>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* ── Checklist ── */}
            {trip.checklistItems && trip.checklistItems.length > 0 && (
              <section>
                <SectionHeader title="สิ่งที่ต้องเตรียม" subtitle="เช็คลิสต์ก่อนออกเดินทาง" icon="checklist" variant="icon" color="amber" />
                <div className="mt-3">
                  <Card padding="none">
                    <CardBody>
                      <ul className="space-y-2.5">
                        {trip.checklistItems.map((item) => (
                          <li key={item.id} className="flex items-start gap-3 text-sm">
                            <span className="material-symbols-outlined text-base text-(--outline) mt-0.5 shrink-0" aria-hidden="true">check_box_outline_blank</span>
                            <span className="text-(--on-surface)">
                              {item.label}
                              {item.isRequired && <span className="text-rose-500 ml-1 text-xs font-bold">*จำเป็น</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                </div>
              </section>
            )}

            {/* Empty state if nothing */}
            {trip.airlineInfo.length === 0 && trip.accommodations.length === 0 && trip.emergencyContacts.length === 0 && (!trip.checklistItems || trip.checklistItems.length === 0) && (
              <EmptyState icon="info" title="ยังไม่มีข้อมูลทริป" description="ผู้ประกอบการยังไม่ได้เพิ่มข้อมูลเที่ยวบิน ที่พัก หรือเบอร์ฉุกเฉิน" />
            )}
          </div>
        )}

        {/* ── Recommendations tab ── */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            {recLoading ? (
              <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Category filter pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {REC_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setRecCategory(cat.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
                        recCategory === cat.id
                          ? "bg-(--primary) text-white border-(--primary)"
                          : "bg-white text-(--on-surface-variant) border-(--outline-variant)/30 hover:border-(--primary)/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={recCategory === cat.id ? { fontVariationSettings: "'FILL' 1" } : {}} aria-hidden="true">{cat.icon}</span>
                      {cat.label}
                      {cat.id === "all" && recommendations.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${recCategory === "all" ? "bg-white/20" : "bg-(--surface-variant)"}`}>
                          {recommendations.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Add button */}
                <div className="flex justify-end">
                  <Button variant="primary" icon="add" onClick={() => { setRecFormError(null); setShowRecForm(true); }}>
                    แนะนำสถานที่
                  </Button>
                </div>

                {/* Recommendation cards */}
                {filteredRecs.length === 0 ? (
                  <EmptyState
                    icon="explore"
                    title="ยังไม่มีรายการแนะนำ"
                    description="แนะนำร้านอาหาร คาเฟ่ หรือสถานที่ท่องเที่ยวให้เพื่อนร่วมทริป"
                    onAction={() => setShowRecForm(true)}
                    actionLabel="แนะนำสถานที่แรก"
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecs.map((rec) => {
                      const catMeta = REC_CATEGORIES.find((c) => c.id === rec.category) ?? REC_CATEGORIES[5];
                      return (
                        <Card key={rec.id} padding="none">
                          {rec.imageUrl && (
                            <div className="relative aspect-[16/9] overflow-hidden">
                              <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute top-2 left-2">
                                <Badge variant="default">{catMeta.label}</Badge>
                              </div>
                            </div>
                          )}
                          <CardBody>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-(--primary)/10 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }} aria-hidden="true">{catMeta.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-(--on-surface) text-sm leading-snug">{rec.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="default">{catMeta.label}</Badge>
                                </div>
                                {rec.description && (
                                  <p className="text-xs text-(--on-surface-variant) mt-1.5 line-clamp-2">{rec.description}</p>
                                )}
                              </div>
                            </div>

                            <Divider className="my-3" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={rec.createdByName} size="xs" />
                                <span className="text-[11px] text-(--on-surface-variant) truncate">{rec.createdByName}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {rec.mapsLink && (
                                  <button
                                    onClick={() => window.open(rec.mapsLink!, "_blank", "noopener,noreferrer")}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-(--primary) hover:bg-(--primary)/10 transition-colors"
                                    aria-label="เปิด Google Maps"
                                  >
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">map</span>
                                    แผนที่
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleLike(rec.id)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    rec.likedByMe
                                      ? "bg-rose-50 text-rose-600"
                                      : "hover:bg-(--surface-variant) text-(--on-surface-variant)"
                                  }`}
                                  aria-label={rec.likedByMe ? "เลิกถูกใจ" : "ถูกใจ"}
                                >
                                  <span
                                    className="material-symbols-outlined text-sm"
                                    style={rec.likedByMe ? { fontVariationSettings: "'FILL' 1" } : {}}
                                    aria-hidden="true"
                                  >
                                    favorite
                                  </span>
                                  {rec.likeCount > 0 && <span className="tabular-nums">{rec.likeCount}</span>}
                                </button>
                                <IconButton icon="delete" variant="ghost" onClick={() => setRecDeleteTarget(rec.id)} aria-label="ลบ" />
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
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
                    onClick={() => { setEditingId(null); const f = defaultForm(); setForm(f); setFormSnapshot(JSON.stringify(f)); setFormError(null); setShowForm(true); }}
                  >
                    บันทึกค่าใช้จ่าย
                  </Button>
                </div>

                {/* Expense list */}
                {expenses.length === 0 ? (
                  <EmptyState icon="receipt_long" title="ยังไม่มีรายการค่าใช้จ่าย" description="กดบันทึกค่าใช้จ่ายด้านบนเพื่อเริ่มต้น" onAction={() => { const f = defaultForm(); setForm(f); setFormSnapshot(JSON.stringify(f)); setFormError(null); setEditingId(null); setShowForm(true); }} actionLabel="บันทึกรายการแรก" />
                ) : (
                  <div className="space-y-3">
                    {expenses.map((e) => (
                      <div key={e.id} className="bg-white rounded-2xl shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar name={e.paidByName} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-(--on-surface) text-sm leading-snug">{e.description}</p>
                                {e.isPersonal && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold shrink-0">
                                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">lock</span>
                                    ส่วนตัว
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-(--on-surface-variant) mt-0.5">
                                จ่ายโดย {e.paidByName} · {new Date(e.occurredOn + "T00:00:00").toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                                {" · "}
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[11px]" aria-hidden="true">
                                    {e.splitMode === "equal" ? "drag_handle" : e.splitMode === "shares" ? "pie_chart" : "edit_note"}
                                  </span>
                                  {e.splitMode === "equal" ? "หารเท่า" : e.splitMode === "shares" ? "ตามสัดส่วน" : "กำหนดเอง"}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-black text-(--on-surface) text-sm mr-1">{fmtAmount(e.amount, e.currency)}</span>
                            <IconButton icon="edit" variant="ghost" onClick={() => openEdit(e)} aria-label="แก้ไข" />
                            <IconButton icon="delete" variant="ghost" onClick={() => setDeleteTarget(e.id)} aria-label="ลบ" />
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

        {/* ── Settlement tab ── */}
        {activeTab === "settlement" && (
          <div className="space-y-4">
            {settlementLoading ? (
              <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
            ) : !settlement || settlement.balances.length === 0 ? (
              <EmptyState icon="calculate" title="ยังไม่มีข้อมูล" description="เพิ่มค่าใช้จ่ายก่อนเพื่อคำนวณหนี้" />
            ) : (
              <div className="space-y-6">
                <section className="bg-white rounded-2xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-(--on-surface) mb-4">ยอดคงค้างต่อคน</h2>
                  <div className="space-y-2">
                    {settlement.balances.map((b) => (
                      <div key={b.followerId} className="flex items-center gap-3">
                        <Avatar name={b.displayName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-(--on-surface) truncate">{b.displayName}</p>
                          <p className="text-[11px] text-(--on-surface-variant)">
                            จ่าย {fmtAmount(b.totalPaid, "THB")} · แชร์ {fmtAmount(b.totalOwed, "THB")}
                          </p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 flex items-center gap-1 ${b.netBalance > 0.005 ? "text-emerald-600" : b.netBalance < -0.005 ? "text-rose-600" : "text-(--on-surface-variant)"}`}>
                          {b.netBalance > 0.005 && <span className="material-symbols-outlined text-sm" aria-hidden="true">trending_up</span>}
                          {b.netBalance < -0.005 && <span className="material-symbols-outlined text-sm" aria-hidden="true">trending_down</span>}
                          {b.netBalance > 0.005 ? "+" : ""}{fmtAmount(b.netBalance, "THB")}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-2xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-(--on-surface) mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-(--primary)">swap_horiz</span>
                    วิธีชำระให้จบ ({settlement.transactions.length} รายการ)
                  </h2>
                  {settlement.transactions.length === 0 ? (
                    <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      ทุกคนสะอาดแล้ว ไม่มีหนี้ค้าง
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {settlement.transactions.map((t, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-(--surface-container-low) rounded-xl">
                          <span className="text-sm font-semibold text-(--on-surface) truncate flex-1">{t.fromName}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-(--primary)">{fmtAmount(t.amount, t.currency)}</span>
                            <span className="material-symbols-outlined text-base text-(--on-surface-variant)">arrow_forward</span>
                          </div>
                          <span className="text-sm font-semibold text-(--on-surface) truncate flex-1 text-right">{t.toName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {/* ── Review tab ── */}
        {activeTab === "review" && tripStatus === "completed" && (
          <div className="space-y-6">
            {reviewLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <>
                {/* My review form */}
                <section className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
                  <h2 className="text-sm font-bold text-(--on-surface) flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    {myRating ? "แก้ไขรีวิวของฉัน" : "ให้คะแนนทริปนี้"}
                  </h2>

                  {/* Star inputs */}
                  {([
                    { key: "overall" as const, label: "คะแนนรวม *" },
                    { key: "guide" as const, label: "ไกด์ / ผู้นำเที่ยว" },
                    { key: "itinerary" as const, label: "แผนการเดินทาง" },
                    { key: "value" as const, label: "ความคุ้มค่า" },
                  ] as const).map(({ key, label }) => (
                    <Rating
                      key={key}
                      label={label}
                      value={reviewForm[key]}
                      onChange={(v: number) => setReviewForm((p) => ({ ...p, [key]: v }))}
                      size="lg"
                      showValue
                    />
                  ))}

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-(--on-surface-variant) mb-1.5 block">ความคิดเห็น</label>
                    <textarea
                      className="w-full border border-(--outline-variant)/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) resize-none"
                      rows={3}
                      placeholder="แชร์ประสบการณ์ของคุณ..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    />
                  </div>

                  {/* Images */}
                  <ImageUpload
                    values={reviewForm.imageUrls}
                    onMultiChange={(urls: string[]) => setReviewForm((p) => ({ ...p, imageUrls: urls }))}
                    maxImages={5}
                    folder={`ratings/${tripId}`}
                    uploadUrl={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api"}/member/trips/${tripId}/rating/upload`}
                    label="แนบรูปภาพ"
                  />

                  <Button
                    disabled={reviewForm.overall === 0 || reviewSubmitting}
                    onClick={async () => {
                      if (reviewForm.overall === 0 || !tripId) return;
                      setReviewSubmitting(true);
                      try {
                        await api.post(`/member/trips/${tripId}/rating`, {
                          overallScore: reviewForm.overall,
                          guideScore: reviewForm.guide || null,
                          itineraryScore: reviewForm.itinerary || null,
                          valueScore: reviewForm.value || null,
                          comment: reviewForm.comment.trim() || null,
                          imageUrls: reviewForm.imageUrls.length > 0 ? reviewForm.imageUrls : null,
                        });
                        toast.success(myRating ? "อัปเดตรีวิวแล้ว" : "ส่งรีวิวแล้ว ขอบคุณ!");
                        // Refresh
                        const [mine, agg]: [any, any] = await Promise.all([
                          api.get<typeof myRating>(`/member/trips/${tripId}/rating/me`),
                          api.get<typeof ratingAgg>(`/member/trips/${tripId}/rating`),
                        ]);
                        setMyRating(mine ?? null);
                        if (agg && (agg as any).recentComments && !agg.comments) {
                          agg.comments = { items: (agg as any).recentComments, totalCount: (agg as any).recentComments.length, hasNext: false };
                        }
                        setRatingAgg(agg);
                      } catch {
                        toast.error("ส่งรีวิวไม่สำเร็จ");
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                  >
                    {reviewSubmitting ? "กำลังส่ง..." : myRating ? "อัปเดตรีวิว" : "ส่งรีวิว"}
                  </Button>
                </section>

                {/* Aggregated scores */}
                {ratingAgg && ratingAgg.count > 0 && (
                  <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                    <h2 className="text-sm font-bold text-(--on-surface) flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      คะแนนจากสมาชิก ({ratingAgg.count} รีวิว)
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([
                        { label: "คะแนนรวม", val: ratingAgg.avgOverall },
                        { label: "ไกด์", val: ratingAgg.avgGuide },
                        { label: "แผนเดินทาง", val: ratingAgg.avgItinerary },
                        { label: "ความคุ้มค่า", val: ratingAgg.avgValue },
                      ]).map(({ label, val }) => (
                        <div key={label} className="flex flex-col items-center p-3 rounded-xl bg-(--surface-container-lowest)">
                          <p className="text-2xl font-black text-(--on-surface)">{val != null ? val.toFixed(1) : "—"}</p>
                          <p className="text-[10px] text-(--on-surface-variant) mt-0.5">{label}</p>
                          {val != null && (
                            <div className="mt-1">
                              <Rating value={val} readOnly size="sm" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Recent comments */}
                    {ratingAgg.comments?.items?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-(--on-surface-variant)">ความคิดเห็นล่าสุด ({ratingAgg.comments?.totalCount ?? 0})</h3>
                        {ratingAgg.comments.items.map((c, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-xl bg-(--surface-container-lowest)">
                            <Avatar name={c.firstName} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-(--on-surface)">{c.firstName}</span>
                                <Rating value={c.overallScore} readOnly size="sm" />
                                <span className="text-[10px] text-(--outline)">{new Date(c.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </div>
                              <p className="text-xs text-(--on-surface-variant) mt-1 leading-relaxed">{c.comment}</p>
                              {c.imageUrls?.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                  {c.imageUrls.map((url, imgIdx) => (
                                    <img key={imgIdx} src={url} alt="" className="w-14 h-14 rounded-lg object-cover" loading="lazy" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Empty state when no reviews yet and user hasn't reviewed */}
                {ratingAgg && ratingAgg.count === 0 && !myRating && (
                  <EmptyState
                    icon="rate_review"
                    title="ยังไม่มีรีวิว"
                    description="เป็นคนแรกที่ให้คะแนนและแชร์ประสบการณ์ทริปนี้!"
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Important notes */}
        {trip.importantNotes && activeTab === "itinerary" && (() => {
          const lines = trip.importantNotes.split("\n").filter((l) => l.trim());
          const sections: { title: string; items: string[] }[] = [];
          let current: { title: string; items: string[] } | null = null;
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("•") && !trimmed.startsWith("-") && trimmed.endsWith(":")) {
              current = { title: trimmed.replace(/:$/, ""), items: [] };
              sections.push(current);
            } else if (current && (trimmed.startsWith("•") || trimmed.startsWith("-"))) {
              current.items.push(trimmed.replace(/^[•\-]\s*/, ""));
            } else {
              current = { title: "", items: [trimmed] };
              sections.push(current);
            }
          }
          const sectionIcons: Record<string, string> = {
            "สิ่งที่ต้องเตรียม": "checklist",
            "นัดหมาย": "schedule",
            "การแต่งกาย": "checkroom",
            "อาหาร": "restaurant",
            "ยา": "medication",
            "เอกสาร": "description",
            "ข้อห้าม": "block",
            "ข้อควรระวัง": "warning",
          };
          const getIcon = (title: string) => {
            for (const [key, icon] of Object.entries(sectionIcons)) {
              if (title.includes(key)) return icon;
            }
            return "sticky_note_2";
          };

          const accordionItems = sections
            .filter((sec) => sec.title)
            .map((sec, i) => ({
              id: `note-${i}`,
              title: sec.title,
              icon: getIcon(sec.title),
              badge: `${sec.items.length} รายการ`,
              children: (
                <ul className="space-y-2">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-(--on-surface-variant)">
                      <span className="material-symbols-outlined text-sm text-amber-500 mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ),
            }));

          const plainItems = sections.filter((sec) => !sec.title).flatMap((sec) => sec.items);

          return (
            <div className="mt-6">
              <SectionHeader
                title="หมายเหตุสำคัญ"
                subtitle="กรุณาอ่านก่อนออกเดินทาง"
                icon="priority_high"
                variant="icon"
                color="amber"
              />
              <div className="mt-3">
                {plainItems.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    {plainItems.map((item, i) => (
                      <p key={i} className="flex items-start gap-2 text-sm text-(--on-surface-variant)">
                        <span className="material-symbols-outlined text-sm text-(--outline) mt-0.5 shrink-0" aria-hidden="true">arrow_right</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                )}
                {accordionItems.length > 0 && (
                  <Accordion
                    items={accordionItems}
                    defaultOpen={accordionItems.map((item) => item.id)}
                    allowMultiple
                  />
                )}
              </div>
            </div>
          );
        })()}
      </main>

      {/* ── Expense Form Drawer ── */}
      <Drawer
        open={showForm}
        onClose={handleCloseForm}
        title={editingId ? "แก้ไขค่าใช้จ่าย" : "บันทึกค่าใช้จ่าย"}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseForm}>
              ยกเลิก
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} onClick={submitExpense}>
              {editingId ? "บันทึก" : "เพิ่มรายการ"}
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

          {/* Personal toggle — top of form */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
              form.isPersonal
                ? "border-(--primary)/40 bg-(--primary)/5"
                : "border-(--outline-variant)/30 bg-white"
            }`}
            onClick={() => {
              setForm((f) => {
                const next = !f.isPersonal;
                return {
                  ...f,
                  isPersonal: next,
                  paidByFollowerId: next ? myFollowerId : f.paidByFollowerId,
                  selectedParticipants: next ? [myFollowerId] : f.selectedParticipants,
                  splitMode: next ? "equal" as const : f.splitMode,
                };
              });
            }}
          >
            <Checkbox
              checked={form.isPersonal}
              onChange={() => {}}
              label=""
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-(--on-surface)">ค่าใช้จ่ายส่วนตัว</p>
              <p className="text-[11px] text-(--on-surface-variant)">เฉพาะคุณเท่านั้นที่เห็น ไม่รวมในการคำนวณหนี้กลุ่ม</p>
            </div>
            <span className="material-symbols-outlined text-base" style={form.isPersonal ? { fontVariationSettings: "'FILL' 1", color: "var(--primary)" } : { color: "var(--on-surface-variant)" }} aria-hidden="true">
              {form.isPersonal ? "lock" : "group"}
            </span>
          </div>

          {/* Paid by */}
          {form.isPersonal ? (
            <div>
              <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">ผู้จ่าย</p>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-(--surface-variant)/40 border border-(--outline-variant)/30 rounded-xl">
                <span className="material-symbols-outlined text-sm text-(--on-surface-variant)" aria-hidden="true">person</span>
                <span className="text-sm text-(--on-surface)">{members.find((m) => m.id === myFollowerId)?.displayName ?? "ฉัน"}</span>
                <span className="ml-auto text-[10px] text-(--on-surface-variant)">ตั้งค่าอัตโนมัติ</span>
              </div>
            </div>
          ) : (
            <SelectPicker
              label="ผู้จ่าย" required
              options={memberOptions}
              value={form.paidByFollowerId}
              onChange={(v) => setForm((f) => ({ ...f, paidByFollowerId: v as string }))}
              placeholder="-- เลือกผู้จ่าย --"
              searchable={false}
            />
          )}

          {/* Amount + currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <FormInput
                label="จำนวนเงิน" required
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
            label="รายละเอียด" required
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

          {/* Split mode — hidden for personal expenses */}
          {!form.isPersonal && (
          <>
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
            <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">ผู้ร่วมจ่าย <span className="text-red-500">*</span></p>
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
          </>
          )}
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

      {/* Recommendation delete confirm */}
      <ConfirmDialog
        open={!!recDeleteTarget}
        title="ลบรายการแนะนำ"
        description="ต้องการลบรายการแนะนำนี้?"
        confirmLabel="ลบ"
        variant="danger"
        onConfirm={confirmDeleteRecommendation}
        onClose={() => setRecDeleteTarget(null)}
      />

      {/* Discard changes confirm */}
      <ConfirmDialog
        open={showDiscardConfirm}
        title="ยกเลิกการแก้ไข?"
        description="คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการยกเลิกหรือไม่?"
        confirmLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => { setShowDiscardConfirm(false); setShowForm(false); setEditingId(null); }}
        onClose={() => setShowDiscardConfirm(false)}
      />

      {/* ── Recommendation Form Drawer ── */}
      <Drawer
        open={showRecForm}
        onClose={() => setShowRecForm(false)}
        title="แนะนำสถานที่"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowRecForm(false)}>
              ยกเลิก
            </Button>
            <Button variant="primary" className="flex-1" loading={recSubmitting} onClick={submitRecommendation}>
              เพิ่มรายการ
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {recFormError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              {recFormError}
            </div>
          )}

          {/* Saved places picker */}
          {savedPlaces.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">ดึงจากสถานที่บันทึกไว้</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {savedPlaces.slice(0, 10).map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => fillFromSavedPlace(place)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-(--outline-variant)/30 bg-white text-xs text-(--on-surface) hover:border-(--primary)/40 hover:bg-(--primary)/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-(--primary)" aria-hidden="true">bookmark</span>
                    <span className="max-w-[120px] truncate">{place.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-(--on-surface-variant) mb-1.5">ชื่อสถานที่ <span className="text-red-500">*</span></p>
            <PlaceAutocompleteInput
              value={recForm.name}
              apiKey={googleMapsApiKey}
              onPlaceSelect={handlePlaceSelect}
              onTextChange={(text) => setRecForm((f) => ({ ...f, name: text }))}
              onBlur={() => {}}
            />
            {recForm.lat && recForm.lng && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-(--on-surface-variant)">
                <span className="material-symbols-outlined text-xs text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
                ดึงพิกัดจาก Google Maps แล้ว
              </div>
            )}
          </div>

          {recForm.imageUrl && (
            <div className="relative rounded-xl overflow-hidden">
              <img
                src={recForm.imageUrl}
                alt={recForm.name}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => setRecForm((f) => ({ ...f, imageUrl: "" }))}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/40 text-[10px] text-white/80">
                รูปปกจาก Google Maps
              </div>
            </div>
          )}

          <SelectPicker
            label="หมวดหมู่"
            options={REC_CATEGORIES.filter((c) => c.id !== "all").map((c) => ({ label: c.label, value: c.id }))}
            value={recForm.category}
            onChange={(v) => setRecForm((f) => ({ ...f, category: v as string }))}
            searchable={false}
          />

          <FormInput
            label="รายละเอียด"
            value={recForm.description}
            onChange={(e) => setRecForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="อาหารอร่อย บรรยากาศดี..."
            maxLength={1024}
          />

          <FormInput
            label="ลิงก์ Google Maps"
            value={recForm.mapsLink}
            onChange={(e) => setRecForm((f) => ({ ...f, mapsLink: e.target.value }))}
            placeholder="https://maps.google.com/..."
            maxLength={1024}
          />
        </div>
      </Drawer>

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
