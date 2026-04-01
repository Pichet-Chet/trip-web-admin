"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { DevAutoFill } from "@/components/shared/dev-auto-fill";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FormTextarea, IconButton, IconWrapper, StatsSummary, FooterActionBar, EmptyState, Skeleton, ConfirmDialog, ImageUpload, TimePicker, SelectPicker } from "@/components/shared";
import { useToast } from "@/components/shared/toast";
import type { TripDay, TripActivity } from "@/types";

/* ─── API response types ─── */
interface TripDetailApi {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  travelersCount: number;
  followerCount: number;
  days: DayDetailApi[];
  accommodations: AccommodationApi[];
}

interface AccommodationApi {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
  sortOrder: number;
}

interface DayDetailApi {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  date: string | null;
  sortOrder: number;
  activities: ActivityDetailApi[];
}

interface ActivityDetailApi {
  id: string;
  time: string | null;
  name: string;
  description: string | null;
  type: string;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string | null;
  imageUrl: string | null;
  emoji: string | null;
  sortOrder: number;
}

/* ─── Activity Types ─── */
const ACTIVITY_TYPES = [
  { value: "attraction", label: "สถานที่ท่องเที่ยว", icon: "landscape" },
  { value: "restaurant", label: "ร้านอาหาร", icon: "restaurant" },
  { value: "hotel", label: "ที่พัก", icon: "hotel" },
  { value: "transport", label: "การเดินทาง", icon: "directions_car" },
  { value: "shopping", label: "ช้อปปิ้ง", icon: "shopping_bag" },
  { value: "other", label: "อื่นๆ", icon: "category" },
] as const;

/* ─── Emoji Picker ─── */
const EMOJI_OPTIONS = [
  "📍", "✈️", "🏨", "🍜", "🍱", "🍽️", "☕",
  "⛩️", "🏛️", "🛍️", "🛒", "🌅", "🏖️", "⛰️",
  "🎡", "🎭", "🚌", "🚢", "🚂", "🏥", "📸",
  "🎶", "🙏", "🐘", "🌊", "🌴", "🗺️", "🎒",
];

/* ─── Map API → local state ─── */
function mapActivity(a: ActivityDetailApi, dayId: string): TripActivity {
  return {
    id: a.id,
    dayId,
    time: a.time ?? null,
    name: a.name,
    description: a.description,
    type: (a.type?.toLowerCase() ?? "attraction") as TripActivity["type"],
    placeName: a.placeName,
    lat: a.lat,
    lng: a.lng,
    mapsLink: a.mapsLink,
    imageUrl: a.imageUrl,
    emoji: a.emoji ?? "📍",
    sortOrder: a.sortOrder,
  };
}

function mapDay(d: DayDetailApi, tripId: string): TripDay {
  return {
    id: d.id,
    tripId,
    dayNumber: d.dayNumber,
    title: d.title,
    subtitle: d.subtitle,
    coverImageUrl: d.coverImageUrl,
    date: d.date,
    sortOrder: d.sortOrder,
    activities: d.activities
      .map((a) => mapActivity(a, d.id))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

/* ─── Auto-fill data ─── */
const autoFillDays = [
  {
    title: "วันแรก - เดินทางถึง",
    activities: [
      { time: "08:00", name: "ออกเดินทางจากสนามบิน", emoji: "✈️", type: "Transport", placeName: "สนามบินสุวรรณภูมิ", description: "นัดรวมพล 3 ชม. ก่อนเวลาบิน เคาน์เตอร์เช็คอิน Row D ชั้น 4" },
      { time: "11:30", name: "เช็คอินโรงแรม", emoji: "🏨", type: "Hotel", placeName: "โรงแรมที่พัก", description: "ฝากกระเป๋าไว้ที่ล็อบบี้ ถ้าห้องยังไม่พร้อม" },
      { time: "12:30", name: "รับประทานอาหารกลางวัน", emoji: "🍜", type: "Restaurant", placeName: "ร้านอาหารท้องถิ่น", description: "ร้านแนะนำ ใกล้โรงแรม เดินไป 5 นาที" },
      { time: "15:00", name: "เดินเล่นตลาดเย็น", emoji: "🛍️", type: "Shopping", placeName: "ตลาดกลางคืน", description: "เตรียมเงินสดไว้ ร้านส่วนใหญ่ไม่รับบัตร" },
    ],
  },
  {
    title: "วันที่สอง - เที่ยวชมสถานที่",
    activities: [
      { time: "08:00", name: "เยี่ยมชมวัดสำคัญ", emoji: "⛩️", type: "Attraction", placeName: "วัดพระธาตุ", description: "สวมกางเกงขายาว ห้ามใส่รองเท้าเข้าโบสถ์" },
      { time: "10:30", name: "ชมพิพิธภัณฑ์", emoji: "🏛️", type: "Attraction", placeName: "พิพิธภัณฑ์แห่งชาติ", description: "ค่าเข้าชม 200 บาท/คน รวมในแพ็กเกจแล้ว" },
      { time: "12:00", name: "รับประทานอาหารกลางวัน", emoji: "🍱", type: "Restaurant", placeName: "ร้านอาหารแนะนำ", description: "เมนูแนะนำ: ข้าวซอย, ขนมจีนน้ำเงี้ยว" },
      { time: "14:00", name: "ช้อปปิ้ง", emoji: "🛒", type: "Shopping", placeName: "ห้างสรรพสินค้า", description: "มีจุดแลกเงิน และตู้ ATM ชั้น 1" },
      { time: "18:00", name: "รับประทานอาหารเย็น", emoji: "🍽️", type: "Restaurant", placeName: "ร้านอาหารริมน้ำ", description: "จองโต๊ะริมน้ำไว้แล้ว แจ้งชื่อกรุ๊ปได้เลย" },
    ],
  },
  {
    title: "วันสุดท้าย - เดินทางกลับ",
    activities: [
      { time: "07:00", name: "ชมพระอาทิตย์ขึ้น", emoji: "🌅", type: "Attraction", placeName: "จุดชมวิว", description: "เตรียมเสื้อกันหนาว อากาศเย็นช่วงเช้า" },
      { time: "09:00", name: "แวะคาเฟ่", emoji: "☕", type: "Restaurant", placeName: "คาเฟ่วิวสวย", description: "มีขนมเค้กและเบเกอรี่ ค่าใช้จ่ายส่วนตัว" },
      { time: "12:00", name: "เดินทางกลับสนามบิน", emoji: "✈️", type: "Transport", placeName: "สนามบิน", description: "เช็คเอาท์ก่อน 11:00 น. รถรับหน้าล็อบบี้" },
    ],
  },
];

export default function TripEditPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  /* ─── State ─── */
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [tripStatus, setTripStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [days, setDays] = useState<TripDay[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [accommodations, setAccommodations] = useState<AccommodationApi[]>([]);

  /* ─── Derived: total days from trip dates ─── */
  const totalTripDays = startDate && endDate
    ? Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
    : 0;

  /* ─── Confirm Dialog State ─── */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const confirmActionRef = useRef<() => void>(() => {});

  /* ─── Emoji Picker State ─── */
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);

  const currentDay = days[activeDay] ?? null;

  function openConfirm(title: string, desc: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    confirmActionRef.current = action;
    setConfirmOpen(true);
  }

  /* ─── Load trip detail ─── */
  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const tripData = await api.get<TripDetailApi>(`/admin/trips/${id}`);
        if (cancelled) return;

        setTripTitle(tripData.title);
        setTripStatus(tripData.status);
        setStartDate(tripData.startDate);
        setEndDate(tripData.endDate);
        setTravelersCount(tripData.travelersCount);
        setFollowerCount(tripData.followerCount);
        setAccommodations(tripData.accommodations ?? []);

        const allDays = (tripData.days ?? [])
          .map((d) => mapDay(d, id))
          .sort((a, b) => a.sortOrder - b.sortOrder);

        // Only show days within the trip date range
        const tripTotalDays = tripData.startDate && tripData.endDate
          ? Math.max(1, Math.floor((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / 86400000) + 1)
          : allDays.length;
        setDays(allDays.slice(0, tripTotalDays));
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลทริปได้";
          toast(msg, "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, toast]);

  /* ─── Day Update ─── */
  const updateDayField = useCallback(async (dayId: string, field: string, value: string) => {
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { [field]: value === "" ? "" : value });
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, [field]: value === "" ? null : value } : d));
    } catch {
      toast("ไม่สามารถบันทึกได้", "error");
    }
  }, [id, toast]);

  /* ─── Activity CRUD ─── */
  const addActivity = useCallback(async () => {
    if (!currentDay) return;
    try {
      const res = await api.post<ActivityDetailApi>(`/admin/days/${currentDay.id}/activities`, {
        name: "กิจกรรมใหม่",
        type: "Attraction",
        emoji: "📍",
      });
      const newAct = mapActivity(res, currentDay.id);
      setDays((prev) =>
        prev.map((d) =>
          d.id === currentDay.id ? { ...d, activities: [...d.activities, newAct] } : d
        )
      );
    } catch {
      toast("ไม่สามารถเพิ่มกิจกรรมได้", "error");
    }
  }, [currentDay, toast]);

  const removeActivity = useCallback(async (dayId: string, actId: string) => {
    openConfirm("ลบกิจกรรม", "คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?", async () => {
      try {
        await api.delete(`/admin/days/${dayId}/activities/${actId}`);
        setDays((prev) =>
          prev.map((d) =>
            d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d
          )
        );
        toast("ลบกิจกรรมสำเร็จ");
      } catch {
        toast("ไม่สามารถลบกิจกรรมได้", "error");
      }
    });
  }, [toast]);

  const updateActivityField = useCallback(async (dayId: string, actId: string, field: string, value: string | null) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, activities: d.activities.map((a) => a.id === actId ? { ...a, [field]: value === "" ? null : value } : a) }
          : d
      )
    );
    try {
      await api.put(`/admin/days/${dayId}/activities/${actId}`, { [field]: value === "" ? "" : value });
    } catch {
      toast("ไม่สามารถบันทึกกิจกรรมได้", "error");
    }
  }, [toast]);

  /* ─── Day Cover Image ─── */
  const handleDayCoverChange = useCallback((dayId: string, url: string | null) => {
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, coverImageUrl: url } : d));
    api.put(`/admin/trips/${id}/days/${dayId}`, { coverImageUrl: url ?? "" }).catch(() => {
      toast("ไม่สามารถบันทึกภาพปกได้", "error");
    });
  }, [id, toast]);

  /* ─── Save Draft (parallel) ─── */
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const day of days) {
        promises.push(
          api.put(`/admin/trips/${id}/days/${day.id}`, {
            title: day.title,
            subtitle: day.subtitle,
            coverImageUrl: day.coverImageUrl,
            date: day.date,
          })
        );
        for (const act of day.activities) {
          promises.push(
            api.put(`/admin/days/${day.id}/activities/${act.id}`, {
              time: act.time,
              name: act.name,
              description: act.description,
              type: act.type,
              placeName: act.placeName,
              mapsLink: act.mapsLink,
              emoji: act.emoji,
            })
          );
        }
      }
      await Promise.all(promises);
      toast("บันทึกร่างสำเร็จ");
    } catch {
      toast("ไม่สามารถบันทึกร่างได้", "error");
    } finally {
      setSaving(false);
    }
  }, [id, days, toast]);

  /* ─── Navigate Next (save first) ─── */
  const handleNext = useCallback(async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const day of days) {
        promises.push(
          api.put(`/admin/trips/${id}/days/${day.id}`, {
            title: day.title,
            subtitle: day.subtitle,
            coverImageUrl: day.coverImageUrl,
            date: day.date,
          })
        );
        for (const act of day.activities) {
          promises.push(
            api.put(`/admin/days/${day.id}/activities/${act.id}`, {
              time: act.time,
              name: act.name,
              description: act.description,
              type: act.type,
              placeName: act.placeName,
              mapsLink: act.mapsLink,
              emoji: act.emoji,
            })
          );
        }
      }
      await Promise.all(promises);
      router.push(ROUTES.tripPreview(id));
    } catch {
      toast("ไม่สามารถบันทึกได้ กรุณาลองอีกครั้ง", "error");
    } finally {
      setSaving(false);
    }
  }, [id, days, router, toast]);

  /* ─── Auto Fill (fill activities into existing days) ─── */
  const handleAutoFill = useCallback(async () => {
    if (days.length === 0) {
      toast("ยังไม่มีวัน กรุณาตรวจสอบวันเดินทาง", "error");
      return;
    }

    const hasActivities = days.some((d) => d.activities.length > 0);
    if (hasActivities) {
      openConfirm("เพิ่มข้อมูลตัวอย่าง", "มีกิจกรรมอยู่แล้ว ต้องการเพิ่มข้อมูลตัวอย่างเข้าไปอีกหรือไม่?", () => doAutoFill());
      return;
    }
    doAutoFill();

    async function doAutoFill() {
      try {
        const updatedDays = [...days];

        for (let i = 0; i < Math.min(days.length, autoFillDays.length); i++) {
          const day = days[i];
          const template = autoFillDays[i];

          // Update day title
          await api.put(`/admin/trips/${id}/days/${day.id}`, { title: template.title });
          updatedDays[i] = { ...updatedDays[i], title: template.title };

          // Add activities to existing day
          const activities: TripActivity[] = [];
          for (const tplAct of template.activities) {
            const actRes = await api.post<ActivityDetailApi>(`/admin/days/${day.id}/activities`, {
              time: tplAct.time,
              name: tplAct.name,
              description: tplAct.description,
              type: tplAct.type,
              emoji: tplAct.emoji,
              placeName: tplAct.placeName,
            });
            activities.push(mapActivity(actRes, day.id));
          }

          updatedDays[i] = { ...updatedDays[i], activities: [...updatedDays[i].activities, ...activities] };
        }

        setDays(updatedDays);
        toast("เพิ่มข้อมูลตัวอย่างสำเร็จ");
      } catch {
        toast("ไม่สามารถเพิ่มข้อมูลตัวอย่างได้", "error");
      }
    }
  }, [id, days, toast]);

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TripStepperHeader currentStep={3} tripId={id} subtitle="กิจกรรม" />
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-60 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={3} tripId={id} subtitle="กิจกรรม" />

      {/* ═══ Action Bar (sticky under stepper) ═══ */}
      <FooterActionBar
        backLabel="ย้อนกลับ"
        onBack={() => router.push(`/dashboard/trips/new?scope=edit&id=${id}`)}
        onSaveDraft={handleSaveDraft}
        savingDraft={saving}
        nextLabel="ถัดไป: ดูตัวอย่าง"
        onNext={handleNext}
        loading={saving}
      />

      {/* ═══ Content Canvas ═══ */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Day Tabs (fixed: matches travel dates) */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1.5 p-1 bg-(--surface-variant)/50 border border-(--outline-variant)/30 rounded-2xl overflow-x-auto scrollbar-hide">
            {days.map((day, i) => {
              const dayDate = startDate ? new Date(new Date(startDate).getTime() + i * 86400000) : null;
              const shortDate = dayDate ? dayDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "";
              return (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-lg font-bold flex flex-col items-center gap-0.5 whitespace-nowrap transition-all text-sm ${
                    activeDay === i
                      ? "bg-white text-(--on-surface) shadow-sm border border-(--outline-variant)/30"
                      : "text-(--on-surface-variant) hover:bg-white/50"
                  }`}
                >
                  <span>Day {i + 1}</span>
                  {shortDate && <span className="text-[10px] font-medium opacity-60">{shortDate}</span>}
                </button>
              );
            })}
          </div>
          {currentDay && startDate && (
            <span className="text-sm font-semibold text-(--on-surface-variant)">
              {new Date(new Date(startDate).getTime() + activeDay * 86400000).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Empty state when no days */}
        {days.length === 0 && (
          <div className="bg-white rounded-2xl border border-(--outline-variant)/30">
            <EmptyState icon="calendar_month" title="ยังไม่มีวัน" description="กดปุ่ม + เพื่อเพิ่มวันแรก" />
          </div>
        )}

        {/* Editor Grid */}
        {currentDay && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: Itinerary List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-(--on-surface) tracking-tight">
                  Day {activeDay + 1} — ตารางกิจกรรม
                </h2>
                <button
                  onClick={addActivity}
                  className="flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--on-primary) rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  เพิ่มกิจกรรม
                </button>
              </div>

              {/* Day Title Input */}
              <div className="mb-4">
                <FormInput
                  label="ชื่อวัน"
                  value={currentDay.title ?? ""}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((d) => d.id === currentDay.id ? { ...d, title: e.target.value } : d)
                    )
                  }
                  onBlur={() => updateDayField(currentDay.id, "title", currentDay.title ?? "")}
                  placeholder={`Day ${currentDay.dayNumber}`}
                  icon="edit_calendar"
                />
              </div>

              {/* Activity Cards */}
              <div className="space-y-4">
                {currentDay.activities.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-(--outline-variant)/30">
                    <EmptyState icon="event_note" title="ยังไม่มีกิจกรรม" description="เพิ่มกิจกรรมสำหรับวันนี้" />
                  </div>
                ) : (
                  currentDay.activities.map((act) => (
                    <div key={act.id} className="group bg-white rounded-2xl border border-(--outline-variant)/30 hover:border-(--primary)/30 shadow-sm transition-all p-5 md:p-6">
                      <div className="flex gap-3 items-start">
                        {/* Emoji Selector */}
                        <div className="mt-6 relative shrink-0">
                          <button
                            onClick={() => setEmojiPickerFor(emojiPickerFor === act.id ? null : act.id)}
                            className="w-10 h-10 rounded-xl bg-(--surface-variant)/50 hover:bg-(--surface-variant) flex items-center justify-center text-xl transition-all"
                            title="เลือก Emoji"
                          >
                            {act.emoji}
                          </button>
                          {emojiPickerFor === act.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setEmojiPickerFor(null)} />
                              <div className="absolute left-0 top-12 z-40 bg-white rounded-xl shadow-xl border border-(--outline-variant)/30 p-3 grid grid-cols-7 gap-1 w-64">
                                {EMOJI_OPTIONS.map((em) => (
                                  <button
                                    key={em}
                                    onClick={() => {
                                      updateActivityField(currentDay.id, act.id, "emoji", em);
                                      setEmojiPickerFor(null);
                                    }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-(--surface-variant) transition-all ${act.emoji === em ? "bg-(--primary-container) ring-2 ring-(--primary)" : ""}`}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 relative">
                              <TimePicker
                                label="เวลา"
                                value={act.time ?? ""}
                                onChange={(v) => {
                                  setDays((prev) =>
                                    prev.map((d) =>
                                      d.id === currentDay.id
                                        ? { ...d, activities: d.activities.map((a) => a.id === act.id ? { ...a, time: v } : a) }
                                        : d
                                    )
                                  );
                                }}
                                onBlur={() => updateActivityField(currentDay.id, act.id, "time", act.time ?? "")}
                              />
                            </div>
                            <div className="col-span-2">
                              <FormInput
                                label="ชื่อกิจกรรม"
                                value={act.name}
                                onChange={(e) =>
                                  setDays((prev) =>
                                    prev.map((d) =>
                                      d.id === currentDay.id
                                        ? { ...d, activities: d.activities.map((a) => a.id === act.id ? { ...a, name: e.target.value } : a) }
                                        : d
                                    )
                                  )
                                }
                                onBlur={() => updateActivityField(currentDay.id, act.id, "name", act.name)}
                                placeholder="ชื่อสถานที่ / กิจกรรม"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1 relative">
                              <SelectPicker
                                label="ประเภท"
                                value={act.type}
                                onChange={(v) => updateActivityField(currentDay.id, act.id, "type", v)}
                                options={ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
                                searchable={false}
                              />
                            </div>
                            <div className="col-span-2">
                              <FormInput
                                label="สถานที่ / Google Maps"
                                placeholder="ชื่อสถานที่ หรือ link Google Maps"
                                value={act.placeName ?? act.mapsLink ?? ""}
                                onChange={(e) =>
                                  setDays((prev) =>
                                    prev.map((d) =>
                                      d.id === currentDay.id
                                        ? { ...d, activities: d.activities.map((a) => a.id === act.id ? { ...a, placeName: e.target.value } : a) }
                                        : d
                                    )
                                  )
                                }
                                onBlur={() => updateActivityField(currentDay.id, act.id, "placeName", act.placeName ?? "")}
                                icon="location_on"
                              />
                            </div>
                          </div>

                          <FormTextarea
                            label="หมายเหตุถึงลูกทัวร์"
                            rows={2}
                            value={act.description ?? ""}
                            onChange={(e) =>
                              setDays((prev) =>
                                prev.map((d) =>
                                  d.id === currentDay.id
                                    ? { ...d, activities: d.activities.map((a) => a.id === act.id ? { ...a, description: e.target.value } : a) }
                                    : d
                                )
                              )
                            }
                            onBlur={() => updateActivityField(currentDay.id, act.id, "description", act.description ?? "")}
                            placeholder="เช่น ใส่กางเกงขาสั้น, เตรียมเสื้อกันหนาว..."
                          />
                        </div>

                        <div className="mt-6 shrink-0">
                          <IconButton icon="delete" variant="danger" onClick={() => removeActivity(currentDay.id, act.id)} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Context Panel */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-36">
              {/* Day Cover Image Upload */}
              <ImageUpload
                value={currentDay.coverImageUrl ?? ""}
                onChange={(url) => handleDayCoverChange(currentDay.id, url)}
                uploadUrl="/admin/upload"
                folder="day-covers"
                label="ภาพปกประจำวัน"
                hint="แนะนำ 1920x1080 px"
                aspect="video"
              />

              {/* Accommodations Card — show hotels with check-in/check-out context */}
              {(() => {
                const dayDate = startDate ? new Date(new Date(startDate).getTime() + activeDay * 86400000) : null;
                if (!dayDate) return null;

                const dayStr = dayDate.toISOString().split("T")[0];

                // Find check-outs on this day
                const checkOuts = accommodations.filter((acc) => {
                  const co = acc.checkOut?.split("T")[0];
                  return co === dayStr;
                });

                // Find check-ins on this day
                const checkIns = accommodations.filter((acc) => {
                  const ci = acc.checkIn?.split("T")[0];
                  return ci === dayStr;
                });

                // Find staying (checked in before, checks out after)
                const staying = accommodations.filter((acc) => {
                  const ci = acc.checkIn ? new Date(acc.checkIn.split("T")[0]) : null;
                  const co = acc.checkOut ? new Date(acc.checkOut.split("T")[0]) : null;
                  if (!ci) return false;
                  return dayDate > ci && (!co || dayDate < co);
                });

                const hasAny = checkOuts.length > 0 || checkIns.length > 0 || staying.length > 0;
                if (!hasAny) return null;

                const timeStr = (dt: string | null) => {
                  if (!dt || !dt.includes("T")) return "";
                  return dt.split("T")[1]?.slice(0, 5) || "";
                };

                // Merge all into a single list with status
                type AccomEntry = { acc: AccommodationApi; status: "check-in" | "check-out" | "staying" };
                const entries: AccomEntry[] = [
                  ...checkOuts.map((acc) => ({ acc, status: "check-out" as const })),
                  ...checkIns.map((acc) => ({ acc, status: "check-in" as const })),
                  ...staying.map((acc) => ({ acc, status: "staying" as const })),
                ];

                const statusConfig = {
                  "check-in": { label: "เช็คอิน", icon: "login", timeFn: (a: AccommodationApi) => timeStr(a.checkIn) },
                  "check-out": { label: "เช็คเอาท์", icon: "logout", timeFn: (a: AccommodationApi) => timeStr(a.checkOut) },
                  "staying": { label: "พักต่อเนื่อง", icon: "bed", timeFn: () => "" },
                };

                return (
                  <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <IconWrapper icon="hotel" size="sm" />
                      <h4 className="text-sm font-bold text-(--on-surface)">ที่พักวันนี้</h4>
                    </div>
                    <div className="space-y-3">
                      {entries.map(({ acc, status }) => {
                        const cfg = statusConfig[status];
                        const time = cfg.timeFn(acc);
                        return (
                          <div key={`${status}-${acc.id}`} className="bg-(--surface-container-low) rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-(--on-surface) truncate">{acc.name}</p>
                                {acc.address && <p className="text-xs text-(--on-surface-variant) mt-0.5 truncate">{acc.address}</p>}
                                {acc.phone && <p className="text-xs text-(--on-surface-variant) truncate">{acc.phone}</p>}
                              </div>
                              <span className="material-symbols-outlined text-(--on-surface-variant) text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-(--outline-variant)/20">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                status === "check-in" ? "bg-(--primary-container) text-(--on-primary-container)"
                                : status === "check-out" ? "bg-(--surface-variant) text-(--on-surface-variant)"
                                : "bg-(--surface-variant) text-(--on-surface-variant)"
                              }`}>
                                <span className="material-symbols-outlined text-xs">{cfg.icon}</span>
                                {cfg.label}
                              </span>
                              {time && (
                                <span className="text-xs text-(--on-surface-variant) font-medium">
                                  {time} น.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Summary Stats */}
              <div className="bg-white rounded-2xl border border-(--outline-variant)/30 p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-(--on-surface-variant) mb-4">สรุปทริป</h4>
                <StatsSummary stats={[
                  { value: totalTripDays || days.length, label: "วัน" },
                  { value: days.reduce((s, d) => s + d.activities.length, 0), label: "กิจกรรม" },
                  { value: travelersCount, label: "ผู้เดินทาง" },
                ]} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Dev Auto Fill ═══ */}
      <DevAutoFill onFill={handleAutoFill} label="Auto Fill 3 Days" />

      {/* ═══ Confirm Dialog ═══ */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          confirmActionRef.current();
          setConfirmOpen(false);
        }}
        title={confirmTitle}
        description={confirmDesc}
        variant="danger"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
      />
    </div>
  );
}
