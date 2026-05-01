"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import dynamic from "next/dynamic";

// DevAutoFill is dev-only — dynamic import + NODE_ENV gate keeps it
// out of the production bundle.
const DevAutoFill = process.env.NODE_ENV === "development"
  ? dynamic(() => import("@/components/shared/dev-auto-fill").then((m) => ({ default: m.DevAutoFill })), { ssr: false })
  : null;
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FooterActionBar, EmptyState, Skeleton, ConfirmDialog } from "@/components/shared";
import { ActivityEditorCard } from "./_components/activity-editor-card";
import { DayContextPanel } from "./_components/day-context-panel";
import { useToast } from "@/components/shared/toast";
import type { TripDay, TripActivity } from "@/types";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";

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
  // Title hook moved to bottom of state declarations — uses tripTitle.
  const [saving, setSaving] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  usePageTitle(tripTitle ? `แก้ไข: ${tripTitle}` : "แก้ไขทริป");
  const [tripStatus, setTripStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [days, setDays] = useState<TripDay[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [accommodations, setAccommodations] = useState<AccommodationApi[]>([]);
  const [addingActivity, setAddingActivity] = useState(false);

  // Warn before tab close while an explicit save (handleSaveDraft /
  // handleNext) is in flight. Per-field auto-saves on blur complete
  // synchronously enough that they don't need separate guarding.
  useUnsavedChanges(saving);

  /* ─── Derived: total days from trip dates ─── */
  const totalTripDays = startDate && endDate
    ? Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
    : 0;

  /* ─── Confirm Dialog State ─── */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDesc, setConfirmDesc] = useState("");
  const confirmActionRef = useRef<() => void>(() => {});

  const currentDay = days[activeDay] ?? null;

  function openConfirm(title: string, desc: string, action: () => void) {
    setConfirmTitle(title);
    setConfirmDesc(desc);
    confirmActionRef.current = action;
    setConfirmOpen(true);
  }

  /* ─── Trip loader (used for initial load + rollback after save failures) ─── */
  const loadTrip = useCallback(async (): Promise<void> => {
    const tripData = await api.get<TripDetailApi>(`/admin/trips/${id}`);

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

    const tripTotalDays = tripData.startDate && tripData.endDate
      ? Math.max(1, Math.floor((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / 86400000) + 1)
      : allDays.length;
    setDays(allDays.slice(0, tripTotalDays));
  }, [id]);

  /* On any auto-save failure, refetch trip to guarantee local state matches
     DB. Safer than partial rollback — saves can race when the user blurs
     several fields quickly. Best-effort: if refetch fails, we keep stale
     local state but the user already saw a save-failure toast. */
  const rollbackOnFailure = useCallback(async (): Promise<void> => {
    try { await loadTrip(); } catch { /* best-effort */ }
  }, [loadTrip]);

  /* ─── Initial load ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadTrip();
      } catch (err) {
        if (!cancelled) toast(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลทริปได้", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadTrip, toast]);

  /* ─── Day Update ─── */
  const updateDayField = useCallback(async (dayId: string, field: string, value: string) => {
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { [field]: value === "" ? "" : value });
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, [field]: value === "" ? null : value } : d));
    } catch {
      toast("ไม่สามารถบันทึกได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [id, toast, rollbackOnFailure]);

  /* ─── Activity CRUD ─── */
  const addActivity = useCallback(async () => {
    if (!currentDay || addingActivity) return;
    setAddingActivity(true);
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
      await rollbackOnFailure();
    } finally {
      setAddingActivity(false);
    }
  }, [currentDay, addingActivity, toast, rollbackOnFailure]);

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
        await rollbackOnFailure();
      }
    });
  }, [toast, rollbackOnFailure]);

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
      toast("ไม่สามารถบันทึกกิจกรรมได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [toast, rollbackOnFailure]);

  /* ─── Day Cover Image ─── */
  const handleDayCoverChange = useCallback(async (dayId: string, url: string | null) => {
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, coverImageUrl: url } : d));
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { coverImageUrl: url ?? "" });
    } catch {
      toast("ไม่สามารถบันทึกภาพปกได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [id, toast, rollbackOnFailure]);

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
                  disabled={addingActivity}
                  className="flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--on-primary) rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingActivity ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                  )}
                  {addingActivity ? "กำลังเพิ่ม..." : "เพิ่มกิจกรรม"}
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
                    <ActivityEditorCard
                      key={act.id}
                      activity={act}
                      onLocalChange={(patch) =>
                        setDays((prev) =>
                          prev.map((d) =>
                            d.id === currentDay.id
                              ? { ...d, activities: d.activities.map((a) => a.id === act.id ? { ...a, ...patch } : a) }
                              : d
                          )
                        )
                      }
                      onCommit={(field, value) => updateActivityField(currentDay.id, act.id, field as string, value)}
                      onRemove={() => removeActivity(currentDay.id, act.id)}
                    />
                  ))
                )}
              </div>
            </div>

            <DayContextPanel
              coverImageUrl={currentDay.coverImageUrl}
              tripStartDate={startDate}
              activeDayIndex={activeDay}
              accommodations={accommodations}
              tripId={id}
              totalTripDays={totalTripDays}
              daysCount={days.length}
              totalActivities={days.reduce((s, d) => s + d.activities.length, 0)}
              travelersCount={travelersCount}
              onCoverChange={(url) => handleDayCoverChange(currentDay.id, url)}
            />

          </div>
        )}
      </div>

      {/* ═══ Dev Auto Fill ═══ */}
      {DevAutoFill && <DevAutoFill onFill={handleAutoFill} label="Auto Fill 3 Days" />}

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
