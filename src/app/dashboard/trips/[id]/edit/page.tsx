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
  isFreeDay: boolean;
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
    isFreeDay: !!d.isFreeDay,
    sortOrder: d.sortOrder,
    activities: d.activities
      .map((a) => mapActivity(a, d.id))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

/* ─── Auto-fill (dev only) ───
 * Generates a plausible itinerary for any number of days. Day 1 is
 * arrival, the last day is departure, and the middle days rotate
 * through varied sightseeing templates so a 7-day trip doesn't end up
 * with the same content on day 2 and day 5. Activity `type` values
 * follow the lowercase convention used by the chip strip
 * (ACTIVITY_TYPES in activity-editor-card); a PascalCase mismatch with
 * earlier seed data was hiding the chip selection on auto-filled rows.
 */
type AutoFillActivity = {
  time: string;
  name: string;
  emoji: string;
  type: string;
  placeName: string;
  mapsLink?: string;
  description: string;
};

const FIRST_DAY: AutoFillActivity[] = [
  { time: "08:00", name: "ออกเดินทางจากสนามบิน", emoji: "✈️", type: "transport", placeName: "สนามบินสุวรรณภูมิ", description: "นัดรวมพล 3 ชม. ก่อนเวลาบิน เคาน์เตอร์เช็คอิน Row D ชั้น 4" },
  { time: "11:30", name: "เช็คอินโรงแรม", emoji: "🏨", type: "hotel", placeName: "โรงแรมที่พัก", description: "ฝากกระเป๋าไว้ที่ล็อบบี้ ถ้าห้องยังไม่พร้อม" },
  { time: "12:30", name: "รับประทานอาหารกลางวัน", emoji: "🍜", type: "restaurant", placeName: "ร้านอาหารท้องถิ่น", description: "ร้านแนะนำ ใกล้โรงแรม เดินไป 5 นาที" },
  { time: "15:00", name: "เดินเล่นตลาดเย็น", emoji: "🛍️", type: "shopping", placeName: "ตลาดกลางคืน", description: "เตรียมเงินสดไว้ ร้านส่วนใหญ่ไม่รับบัตร" },
  { time: "19:00", name: "อาหารเย็น", emoji: "🍽️", type: "restaurant", placeName: "ร้านในเมือง", description: "เมนูแนะนำ: ของท้องถิ่น" },
];

const LAST_DAY: AutoFillActivity[] = [
  { time: "07:00", name: "ชมพระอาทิตย์ขึ้น", emoji: "🌅", type: "attraction", placeName: "จุดชมวิว", description: "เตรียมเสื้อกันหนาว อากาศเย็นช่วงเช้า" },
  { time: "09:00", name: "แวะคาเฟ่", emoji: "☕", type: "restaurant", placeName: "คาเฟ่วิวสวย", description: "มีขนมเค้กและเบเกอรี่ ค่าใช้จ่ายส่วนตัว" },
  { time: "12:00", name: "เดินทางกลับสนามบิน", emoji: "✈️", type: "transport", placeName: "สนามบิน", description: "เช็คเอาท์ก่อน 11:00 น. รถรับหน้าล็อบบี้" },
];

// Middle-day templates — rotated by index so successive days look
// different even on long trips. Each template aims for 4-5 activities
// covering breakfast/lunch/dinner + sightseeing/shopping.
const MIDDLE_TEMPLATES: { title: string; activities: AutoFillActivity[] }[] = [
  {
    title: "เที่ยวชมสถานที่สำคัญ",
    activities: [
      { time: "08:00", name: "เยี่ยมชมวัดสำคัญ", emoji: "⛩️", type: "attraction", placeName: "วัดพระธาตุ", description: "สวมกางเกงขายาว ห้ามใส่รองเท้าเข้าโบสถ์" },
      { time: "10:30", name: "ชมพิพิธภัณฑ์", emoji: "🏛️", type: "attraction", placeName: "พิพิธภัณฑ์แห่งชาติ", description: "ค่าเข้าชม 200 บาท/คน รวมในแพ็กเกจแล้ว" },
      { time: "12:00", name: "รับประทานอาหารกลางวัน", emoji: "🍱", type: "restaurant", placeName: "ร้านอาหารแนะนำ", description: "เมนูแนะนำ: ข้าวซอย, ขนมจีนน้ำเงี้ยว" },
      { time: "14:00", name: "ช้อปปิ้ง", emoji: "🛒", type: "shopping", placeName: "ห้างสรรพสินค้า", description: "มีจุดแลกเงิน และตู้ ATM ชั้น 1" },
      { time: "18:00", name: "รับประทานอาหารเย็น", emoji: "🍽️", type: "restaurant", placeName: "ร้านอาหารริมน้ำ", description: "จองโต๊ะริมน้ำไว้แล้ว แจ้งชื่อกรุ๊ปได้เลย" },
    ],
  },
  {
    title: "ธรรมชาติ + ตลาดท้องถิ่น",
    activities: [
      { time: "07:30", name: "อาหารเช้า", emoji: "☕", type: "restaurant", placeName: "โรงแรม", description: "บุฟเฟ่ต์เช้าที่ห้องอาหาร" },
      { time: "09:00", name: "เดินป่าเล่นน้ำตก", emoji: "🌊", type: "attraction", placeName: "อุทยานแห่งชาติ", description: "ใส่รองเท้าผ้าใบ เตรียมยากันยุง" },
      { time: "12:30", name: "อาหารกลางวัน", emoji: "🍜", type: "restaurant", placeName: "ร้านอาหารชาวเขา", description: "เมนูพื้นถิ่น เผ็ดร้อนระดับ 2" },
      { time: "15:00", name: "ตลาดท้องถิ่น", emoji: "🛍️", type: "shopping", placeName: "ตลาดสด", description: "ของฝากแนะนำ ผ้าทอ + ของแห้ง" },
      { time: "19:00", name: "อาหารเย็น", emoji: "🍱", type: "restaurant", placeName: "Street Food Hub", description: "ลองหลายร้าน หาที่ถูกปาก" },
    ],
  },
  {
    title: "ทริปทะเล / ชายหาด",
    activities: [
      { time: "08:00", name: "เดินทางสู่ท่าเรือ", emoji: "🚌", type: "transport", placeName: "ท่าเรือ", description: "นั่งรถจากโรงแรม ~30 นาที" },
      { time: "09:30", name: "นั่งเรือเที่ยวเกาะ", emoji: "🚢", type: "attraction", placeName: "เกาะใกล้เคียง", description: "เตรียมครีมกันแดด แว่นกันแดด" },
      { time: "12:00", name: "อาหารกลางวันบนเกาะ", emoji: "🍽️", type: "restaurant", placeName: "ร้านอาหารทะเล", description: "อาหารทะเลสด ๆ ราคาในแพ็กเกจ" },
      { time: "14:00", name: "ดำน้ำดูปะการัง", emoji: "🏖️", type: "attraction", placeName: "จุดดำน้ำ", description: "อุปกรณ์ดำน้ำมีให้ยืม" },
      { time: "18:00", name: "อาหารเย็นริมหาด", emoji: "🌅", type: "restaurant", placeName: "ร้านริมหาด", description: "เห็นพระอาทิตย์ตก จองโต๊ะนอกแล้ว" },
    ],
  },
  {
    title: "City Tour + Cafe Hop",
    activities: [
      { time: "09:00", name: "อาหารเช้าคาเฟ่", emoji: "☕", type: "restaurant", placeName: "คาเฟ่ใจกลางเมือง", description: "ขนมปังและกาแฟพิเศษ" },
      { time: "10:30", name: "ชมเมืองเก่า", emoji: "🏛️", type: "attraction", placeName: "ย่านเมืองเก่า", description: "ใส่รองเท้าเดินสบาย แดดร้อน เตรียมร่ม" },
      { time: "13:00", name: "อาหารกลางวัน", emoji: "🍜", type: "restaurant", placeName: "ร้านในย่านเก่า", description: "ของพื้นถิ่นแนะนำ" },
      { time: "15:30", name: "Cafe Hop", emoji: "🎶", type: "attraction", placeName: "ย่านคาเฟ่", description: "เลือก 2-3 ร้านยอดนิยม" },
      { time: "19:00", name: "อาหารเย็นรูฟท็อป", emoji: "🍽️", type: "restaurant", placeName: "Rooftop Restaurant", description: "วิวเมืองยามค่ำ" },
    ],
  },
];

function generateAutoFillDays(count: number): { title: string; activities: AutoFillActivity[] }[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [{ title: "ทริปไปกลับวันเดียว", activities: [...FIRST_DAY.slice(0, 3), ...LAST_DAY.slice(-1)] }];
  }
  const out: { title: string; activities: AutoFillActivity[] }[] = [];
  out.push({ title: "วันแรก - เดินทางถึง", activities: FIRST_DAY });
  for (let i = 1; i < count - 1; i++) {
    const tpl = MIDDLE_TEMPLATES[(i - 1) % MIDDLE_TEMPLATES.length];
    out.push({ title: `วันที่ ${i + 1} - ${tpl.title}`, activities: tpl.activities });
  }
  out.push({ title: "วันสุดท้าย - เดินทางกลับ", activities: LAST_DAY });
  return out;
}

export default function TripEditPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  /* ─── State ─── */
  const [loading, setLoading] = useState(true);
  // Title hook moved to bottom of state declarations — uses tripTitle.
  const [saving, setSaving] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  // Skip the placeholder title while loading so the tab doesn't flash
  // "แก้ไขทริป" → "แก้ไข: <title>" right after mount.
  usePageTitle(tripTitle ? `แก้ไข: ${tripTitle}` : null);
  const [tripStatus, setTripStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [days, setDays] = useState<TripDay[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [accommodations, setAccommodations] = useState<AccommodationApi[]>([]);
  const [addingActivity, setAddingActivity] = useState(false);

  /* ─── Auto-save status ───
   * Per-field commits (blur on activity / day fields, cover image
   * upload, etc.) flip this so the operator can see whether their
   * latest edit is still in flight, just landed, or failed. "saved"
   * auto-decays back to "idle" via setTimeout to keep the indicator
   * unobtrusive once it's done its job.
   */
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inFlightRef = useRef(0);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beginAutoSave = useCallback((): void => {
    inFlightRef.current += 1;
    setSaveStatus("saving");
    if (savedFadeRef.current) {
      clearTimeout(savedFadeRef.current);
      savedFadeRef.current = null;
    }
  }, []);
  const endAutoSave = useCallback((ok: boolean): void => {
    inFlightRef.current = Math.max(0, inFlightRef.current - 1);
    if (inFlightRef.current > 0) return; // still other saves running
    if (!ok) {
      setSaveStatus("error");
      return;
    }
    setSaveStatus("saved");
    savedFadeRef.current = setTimeout(() => {
      setSaveStatus("idle");
      savedFadeRef.current = null;
    }, 2000);
  }, []);

  // Warn before tab close while an explicit save (handleSaveDraft /
  // handleNext) is in flight, OR while any per-field auto-save hasn't
  // landed yet — closing during the saving window would lose the edit.
  useUnsavedChanges(saving || saveStatus === "saving");

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
    beginAutoSave();
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { [field]: value === "" ? "" : value });
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, [field]: value === "" ? null : value } : d));
      endAutoSave(true);
    } catch {
      endAutoSave(false);
      toast("ไม่สามารถบันทึกได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [id, toast, rollbackOnFailure, beginAutoSave, endAutoSave]);

  const toggleFreeDay = useCallback(async (dayId: string, next: boolean) => {
    // Optimistic flip — single boolean, easy to revert via refetch on
    // failure. Reuses the day-update endpoint with isFreeDay in body.
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, isFreeDay: next } : d));
    beginAutoSave();
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { isFreeDay: next });
      endAutoSave(true);
    } catch {
      endAutoSave(false);
      toast("ไม่สามารถบันทึกได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [id, toast, rollbackOnFailure, beginAutoSave, endAutoSave]);

  /* ─── Activity CRUD ─── */
  const addActivity = useCallback(async () => {
    if (!currentDay || addingActivity) return;
    setAddingActivity(true);
    try {
      const res = await api.post<ActivityDetailApi>(`/admin/days/${currentDay.id}/activities`, {
        name: "กิจกรรมใหม่",
        // Lowercase to match the chip strip's value set so the new
        // row shows the right chip selected immediately.
        type: "attraction",
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

  /* Activity delete: fire DELETE immediately so a browser refresh
     before the toast expires reflects the operator's intent. Undo
     re-creates the row via POST — the server id changes, but every
     field is restored verbatim and the row goes back at its original
     index. The trade-off (new id on undo) is acceptable for a
     UI-level undo since the deleted activity hadn't been referenced
     elsewhere yet. */
  const removeActivity = useCallback(async (dayId: string, actId: string) => {
    // Snapshot before optimistic remove so undo has the data to
    // re-create.
    const sourceDay = days.find((d) => d.id === dayId);
    const removedIndex = sourceDay?.activities.findIndex((a) => a.id === actId) ?? -1;
    const removedActivity = removedIndex >= 0 ? sourceDay!.activities[removedIndex] : null;
    if (!removedActivity) return;

    setDays((prev) => prev.map((d) =>
      d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d
    ));

    try {
      await api.delete(`/admin/days/${dayId}/activities/${actId}`);
    } catch {
      toast("ไม่สามารถลบกิจกรรมได้", "error");
      await rollbackOnFailure();
      return;
    }

    toast("ลบกิจกรรมแล้ว", "info", {
      durationMs: 5000,
      action: {
        label: "ยกเลิก",
        onClick: async (dismiss) => {
          dismiss();
          // Re-create with all fields from the deleted snapshot. Server
          // assigns a fresh id; we splice the new row back in at the
          // original index so visual order is preserved.
          try {
            const created = await api.post<ActivityDetailApi>(
              `/admin/days/${dayId}/activities`,
              {
                time: removedActivity.time,
                name: removedActivity.name,
                description: removedActivity.description,
                type: removedActivity.type,
                placeName: removedActivity.placeName,
                mapsLink: removedActivity.mapsLink,
                emoji: removedActivity.emoji,
              },
            );
            const restored = mapActivity(created, dayId);
            setDays((prev) => prev.map((d) => {
              if (d.id !== dayId) return d;
              const next = [...d.activities];
              next.splice(Math.max(0, Math.min(removedIndex, next.length)), 0, restored);
              return { ...d, activities: next };
            }));
          } catch {
            toast("ไม่สามารถกู้คืนได้", "error");
            await rollbackOnFailure();
          }
        },
      },
    });
  }, [days, toast, rollbackOnFailure]);

  const updateActivityField = useCallback(async (dayId: string, actId: string, field: string, value: string | null) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, activities: d.activities.map((a) => a.id === actId ? { ...a, [field]: value === "" ? null : value } : a) }
          : d
      )
    );
    beginAutoSave();
    try {
      await api.put(`/admin/days/${dayId}/activities/${actId}`, { [field]: value === "" ? "" : value });
      endAutoSave(true);
    } catch {
      endAutoSave(false);
      toast("ไม่สามารถบันทึกกิจกรรมได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [toast, rollbackOnFailure, beginAutoSave, endAutoSave]);

  /* ─── Day Cover Image ─── */
  const handleDayCoverChange = useCallback(async (dayId: string, url: string | null) => {
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, coverImageUrl: url } : d));
    beginAutoSave();
    try {
      await api.put(`/admin/trips/${id}/days/${dayId}`, { coverImageUrl: url ?? "" });
      endAutoSave(true);
    } catch {
      endAutoSave(false);
      toast("ไม่สามารถบันทึกภาพปกได้ กำลังโหลดข้อมูลล่าสุด...", "error");
      await rollbackOnFailure();
    }
  }, [id, toast, rollbackOnFailure, beginAutoSave, endAutoSave]);

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
        // Generate templates that match the actual trip length so a 5-day
        // trip gets 5 days of content (not capped at the previous 3).
        const templates = generateAutoFillDays(days.length);
        const updatedDays = [...days];

        for (let i = 0; i < days.length; i++) {
          const day = days[i];
          const template = templates[i];
          if (!template) continue;

          // Update day title
          await api.put(`/admin/trips/${id}/days/${day.id}`, { title: template.title });
          updatedDays[i] = { ...updatedDays[i], title: template.title };

          // Add activities — send every field the editor reads from
          // (placeName, mapsLink, description) so reload looks the same
          // as freshly-typed data.
          const activities: TripActivity[] = [];
          for (const tplAct of template.activities) {
            const actRes = await api.post<ActivityDetailApi>(`/admin/days/${day.id}/activities`, {
              time: tplAct.time,
              name: tplAct.name,
              description: tplAct.description,
              type: tplAct.type,
              emoji: tplAct.emoji,
              placeName: tplAct.placeName,
              mapsLink: tplAct.mapsLink ?? "",
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
        <TripStepperHeader currentStep={2} tripId={id} subtitle="กิจกรรม" />
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
      <TripStepperHeader currentStep={2} tripId={id} subtitle="กิจกรรม" />

      {/* ═══ Action Bar (sticky under stepper) ═══ */}
      <FooterActionBar
        backLabel="ย้อนกลับ"
        onBack={() => router.push(`/dashboard/trips/new?id=${id}`)}
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
          <div
            role="tablist"
            aria-label="เลือกวันที่"
            className="flex gap-1.5 p-1 bg-(--surface-variant)/50 border border-(--outline-variant)/30 rounded-2xl overflow-x-auto scrollbar-hide"
            onKeyDown={(e) => {
              // Arrow-key navigation per ARIA tablist pattern. Wraps at
              // ends so users can keep pressing → past the last tab.
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
              e.preventDefault();
              const next =
                e.key === "Home" ? 0
                : e.key === "End" ? days.length - 1
                : e.key === "ArrowLeft" ? (activeDay - 1 + days.length) % days.length
                : (activeDay + 1) % days.length;
              setActiveDay(next);
            }}
          >
            {days.map((day, i) => {
              const dayDate = startDate ? new Date(new Date(startDate).getTime() + i * 86400000) : null;
              const shortDate = dayDate ? dayDate.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "";
              const selected = activeDay === i;
              const activityCount = day.activities.length;
              const isEmpty = activityCount === 0;
              return (
                <button
                  key={day.id}
                  role="tab"
                  aria-selected={selected}
                  // Roving tabindex: only the active tab is focusable via Tab,
                  // arrow keys move focus between tabs (handled at parent).
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveDay(i)}
                  className={`px-4 py-2 rounded-lg font-bold flex flex-col items-center gap-0.5 whitespace-nowrap transition-all text-sm focus-visible:outline-2 focus-visible:outline-(--primary) focus-visible:outline-offset-2 ${
                    selected
                      ? "bg-white text-(--on-surface) shadow-sm border border-(--outline-variant)/30"
                      : "text-(--on-surface-variant) hover:bg-white/50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Day {i + 1}</span>
                    {day.isFreeDay
                      ? (
                        // Palm icon — intentional empty (free day), not
                        // "needs attention". Distinct from the amber dot
                        // so the operator can tell at a glance.
                        <span
                          className="material-symbols-outlined text-sm text-(--on-surface-variant)"
                          aria-label="วันอิสระ"
                          title="วันอิสระ"
                        >beach_access</span>
                      )
                      : isEmpty
                        ? (
                          // Amber dot for "needs attention" — at-a-glance
                          // hint that the day has no activities yet.
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-400"
                            aria-label="ยังไม่มีกิจกรรม"
                          />
                        )
                        : (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                              selected
                                ? "bg-(--primary-container) text-(--on-primary-container)"
                                : "bg-(--surface-variant) text-(--on-surface-variant)"
                            }`}
                            aria-label={`${activityCount} กิจกรรม`}
                          >
                            {activityCount}
                          </span>
                        )}
                  </div>
                  {shortDate && <span className="text-[10px] font-medium opacity-60">{shortDate}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator — appears next to the day's full-date
                label so it's visible without scrolling to the action bar.
                Idle state renders nothing to keep the chrome quiet. */}
            {saveStatus !== "idle" && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  saveStatus === "saving"
                    ? "bg-(--surface-variant) text-(--on-surface-variant)"
                    : saveStatus === "saved"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                }`}
                role="status"
                aria-live="polite"
              >
                {saveStatus === "saving" && (
                  <>
                    <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    กำลังบันทึก…
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    บันทึกอัตโนมัติแล้ว
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <span className="material-symbols-outlined text-sm">error</span>
                    บันทึกไม่สำเร็จ
                  </>
                )}
              </span>
            )}
            {currentDay && startDate && (
              <span className="text-sm font-semibold text-(--on-surface-variant)">
                {new Date(new Date(startDate).getTime() + activeDay * 86400000).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>
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
              <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
                <div className="min-w-0">
                  {/* Header shows the day's actual title when it has one
                      (less repetition with the tab strip above), falling
                      back to "Day N" only when the operator hasn't set a
                      title yet. Subtitle keeps the section clearly the
                      activity editor. */}
                  <h2 className="text-xl md:text-2xl font-extrabold text-(--on-surface) tracking-tight truncate">
                    {currentDay.title?.trim() || `Day ${activeDay + 1}`}
                  </h2>
                  <p className="text-xs text-(--on-surface-variant) mt-0.5">
                    {currentDay.isFreeDay ? "วันอิสระ" : "ตารางกิจกรรม"}
                  </p>
                </div>
                {/* Schedule controls live together — the free-day toggle
                    is a schedule-mode switch (no schedule vs scheduled),
                    not a property of the day's title. Placing it next to
                    the add-activity button makes that relationship clear. */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleFreeDay(currentDay.id, !currentDay.isFreeDay)}
                    aria-pressed={currentDay.isFreeDay}
                    title={currentDay.isFreeDay
                      ? "ปิดวันอิสระ — กลับสู่โหมดตารางกิจกรรม"
                      : "เปิดวันอิสระ — ลูกทัวร์เลือกกิจกรรมเอง"}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                      currentDay.isFreeDay
                        ? "bg-(--primary-container) text-(--on-primary-container) border-(--primary)/30"
                        : "bg-white text-(--on-surface-variant) border-(--outline-variant)/40 hover:border-(--primary)/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base" style={currentDay.isFreeDay ? { fontVariationSettings: "'FILL' 1" } : undefined}>beach_access</span>
                    วันอิสระ
                  </button>
                  {/* Add-activity button hidden on free days — having both
                      "วันอิสระ" and an active "เพิ่มกิจกรรม" affordance was
                      contradictory; if the operator wants to schedule
                      activities they untick the free-day toggle first. */}
                  {!currentDay.isFreeDay && (
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
                  )}
                </div>
              </div>

              {/* Day Title Input — clearly labelled as a description, not
                  a system day number, with an example placeholder so the
                  operator knows what's expected. */}
              <div className="mb-4">
                <FormInput
                  label="หัวข้อวันนี้"
                  hint={`เว้นว่างได้ — จะแสดงเป็น "Day ${activeDay + 1}"`}
                  value={currentDay.title ?? ""}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((d) => d.id === currentDay.id ? { ...d, title: e.target.value } : d)
                    )
                  }
                  onBlur={() => updateDayField(currentDay.id, "title", currentDay.title ?? "")}
                  placeholder="เช่น เดินทางถึงโตเกียว / เที่ยวชมเมืองเก่า"
                  icon="edit_calendar"
                />
              </div>

              {/* Activity Cards — hidden entirely on a free day. */}
              {currentDay.isFreeDay ? (
                <div className="bg-white rounded-2xl border border-(--outline-variant)/30">
                  <EmptyState
                    icon="beach_access"
                    title="วันอิสระ"
                    description={
                      currentDay.activities.length > 0
                        ? `บันทึกกิจกรรม ${currentDay.activities.length} รายการไว้ — ปิด "วันอิสระ" เพื่อแสดงและแก้ไข`
                        : "ลูกทัวร์เลือกกิจกรรมเองในวันนี้"
                    }
                  />
                </div>
              ) : (
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
              )}
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
              emptyDaysCount={days.filter((d) => d.activities.length === 0 && !d.isFreeDay).length}
              travelersCount={travelersCount}
              onCoverChange={(url) => handleDayCoverChange(currentDay.id, url)}
            />

          </div>
        )}
      </div>

      {/* ═══ Dev Auto Fill ═══ */}
      {DevAutoFill && <DevAutoFill onFill={handleAutoFill} label="กรอกข้อมูลตัวอย่าง" />}

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
