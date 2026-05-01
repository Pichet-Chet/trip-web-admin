"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FormTextarea, SectionHeader, DashedAddButton, FooterActionBar, ImageUpload, DatePicker, Banner, SegmentedControl, ConfirmDialog } from "@/components/shared";
import { TransportSection, type TransportSegment, type TransportType, makeSegment } from "./_components/transport-section";
import { type TripScopeLocal } from "./_components/scope-selector";
import { HotelCard } from "./_components/hotel-card";
import { EmergencyContactCard, type EmergencyContactRow } from "./_components/emergency-contact-card";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { tripBasicsSchema, hotelSchema, emergencyContactSchema } from "@/lib/validation/trip";
import { lookupEmergencyPrefill } from "@/lib/emergency-contacts";
import dynamic from "next/dynamic";

// DevAutoFill is dev-only — dynamic import + NODE_ENV gate keeps it
// out of the production bundle (process.env.NODE_ENV is statically
// replaced at build time, so this branch becomes dead code in prod).
const DevAutoFill = process.env.NODE_ENV === "development"
  ? dynamic(() => import("@/components/shared/dev-auto-fill").then((m) => ({ default: m.DevAutoFill })), { ssr: false })
  : null;
import { useToast } from "@/components/shared/toast";
import type { Accommodation, TripPlan } from "@/types";

const emptyHotel: Accommodation = { name: "", address: "", phone: "", checkIn: "", checkOut: "", nights: 1 };

type FieldErrors = Record<string, string>;

// All form fields owned by react-hook-form. UI/derived state (loading,
// apiError, draftId, etc.) stays in useState because it's not part of
// what the operator types.
interface TripFormValues {
  scope: TripScopeLocal;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  // String because <input type=number> binds as string; the basics
  // schema coerces on validate.
  travelersCount: string;
  language: string;
  coverUrl: string | null;
  notes: string;
  segments: TransportSegment[];
  hotels: Accommodation[];
  emergencyContacts: EmergencyContactRow[];
}

const FORM_DEFAULTS: TripFormValues = {
  // Default to domestic so the basics form is usable immediately. The
  // scope toggle on the page lets the operator switch — there is no
  // separate scope-picker step any more.
  scope: "domestic",
  title: "",
  destination: "",
  startDate: "",
  endDate: "",
  travelersCount: "",
  language: "th",
  coverUrl: null,
  notes: "",
  // Domestic defaults: 2 van segments + 2 universal Thai emergency
  // numbers. Same data the old selectScope("domestic") populated.
  segments: [makeSegment("outbound", "van"), makeSegment("return", "van")],
  hotels: [{ ...emptyHotel }],
  emergencyContacts: [
    { name: "ตำรวจท่องเที่ยว", phone: "1155", note: "" },
    { name: "แพทย์ฉุกเฉิน", phone: "1669", note: "" },
  ],
};

export default function NewTripPage(): React.ReactNode {
  usePageTitle("สร้างทริปใหม่");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ─── Draft state (URL/UI, not part of the form) ───
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("id"));
  const [savingDraft, setSavingDraft] = useState(false);
  const [tripStatus, setTripStatus] = useState("");
  const [dateChangeCount, setDateChangeCount] = useState(0);
  const [maxDateChanges, setMaxDateChanges] = useState(99);
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ─── Form (react-hook-form) ───
  // One useForm owns every field the operator can edit. useFieldArray
  // gives us insert/remove/replace primitives for the three repeating
  // sections so we don't hand-roll array splicing. Snapshot-based dirty
  // tracking is replaced by formState.isDirty — RHF flips it on the
  // first edit and we reset() after each successful save to clear it.
  const form = useForm<TripFormValues>({ defaultValues: FORM_DEFAULTS, mode: "onSubmit" });
  const { control, watch, setValue, getValues, reset, formState } = form;
  const segmentsField = useFieldArray({ control, name: "segments" });
  const hotelsField = useFieldArray({ control, name: "hotels" });
  const contactsField = useFieldArray({ control, name: "emergencyContacts" });

  // Watched values used by conditional rendering / effects below. RHF
  // re-renders the page when any of these change because we read them
  // here at the top level.
  const tripScope = watch("scope");
  const title = watch("title");
  const destination = watch("destination");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const travelersCount = watch("travelersCount");
  const language = watch("language");
  const coverUrl = watch("coverUrl");
  const notes = watch("notes");
  const segments = watch("segments");
  const hotels = watch("hotels");
  const emergencyContacts = watch("emergencyContacts");

  useUnsavedChanges(formState.isDirty);

  // Pending scope swap — confirm before resetting segments/contacts.
  const [pendingScope, setPendingScope] = useState<"domestic" | "international" | null>(null);

  // Field-level helper: set a form value AND clear any inline error
  // displayed for that key. Wrapping the pattern keeps the JSX terse.
  // The cast on `value` lets us keep a clean public signature — RHF's
  // own generic surfaces a deeply nested PathValue type that doesn't
  // narrow through `TripFormValues[K]`.
  const updateField = <K extends keyof TripFormValues>(name: K, value: TripFormValues[K]): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(name, value as any, { shouldDirty: true });
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // (Scope picker step removed — basics renders immediately. Scope
  // switch is handled via the segmented control below; pushState/
  // popstate dance from the old "back to picker" UX is no longer
  // needed.)

  // ─── Emergency contacts: country-aware prefill ───
  // For international trips, when the destination resolves to a country
  // we have data for AND the operator hasn't filled any phone yet, auto-
  // prefill embassy / police / medical numbers. Once any phone is set
  // we leave them alone — overwriting hand-entered data would be hostile
  // even if the user edits the destination later.
  useEffect(() => {
    if (tripScope !== "international") return;
    const current = getValues("emergencyContacts");
    const allPhonesEmpty = current.every((c) => !c.phone.trim());
    if (!allPhonesEmpty) return;
    const prefill = lookupEmergencyPrefill(destination);
    if (!prefill) return;

    const next: EmergencyContactRow[] = [
      { name: prefill.embassy.name, phone: prefill.embassy.phone, note: "", serverId: current[0]?.serverId },
      { name: prefill.police.name, phone: prefill.police.phone, note: "", serverId: current[1]?.serverId },
      { name: prefill.medical.name, phone: prefill.medical.phone, note: "", serverId: current[2]?.serverId },
    ];
    // Skip the replace when the data is identical — prevents an infinite
    // loop when the effect re-runs from unrelated re-renders.
    const same = current.length === next.length
      && current.every((p, i) => p.name === next[i].name && p.phone === next[i].phone);
    if (!same) contactsField.replace(next);
    // contactsField is stable across renders — the early return above is
    // what guards against a rerun loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripScope, destination, getValues]);

  // ─── Load draft ───
  useEffect(() => {
    if (!draftId) return;

    // Local DTOs mirror the BE shape (TripChildController + TripService)
    // — kept narrow to what this page reads, not exhaustive.
    type TripDraftDto = {
      scope?: string; status?: string; dateChangeCount?: number;
      title?: string; destination?: string;
      startDate?: string; endDate?: string;
      travelersCount?: number; language?: string;
      coverImageUrl?: string | null; importantNotes?: string | null;
    };
    type AirlineDto = {
      id: string; type: string; transportType: string;
      departureAirport?: string; departureDetail?: string;
      arrivalAirport?: string; arrivalDetail?: string;
      departureDate?: string; departureTime?: string;
      arrivalDate?: string; arrivalTime?: string;
      airline?: string; flightNumber?: string;
      operator?: string; vehicleInfo?: string;
      bookingRef?: string; baggage?: string;
      meetingPoint?: string; note?: string;
    };
    type AccommodationDto = {
      id: string; name?: string; address?: string; phone?: string;
      checkIn?: string; checkOut?: string; nights?: number;
    };
    type EmergencyContactDto = {
      id: string; name?: string; phone?: string;
    };

    (async () => {
      try {
        const trip = await api.get<TripDraftDto>(`/admin/trips/${draftId}`);
        setTripStatus(trip.status || "");
        setDateChangeCount(trip.dateChangeCount || 0);

        // Load max date changes from system config
        try {
          const usage = await api.get<{ maxDateChanges?: number }>("/admin/usage");
          if (typeof usage.maxDateChanges === "number") setMaxDateChanges(usage.maxDateChanges);
        } catch { /* use default */ }

        // Children loaded in parallel — they're independent.
        const [airlines, accoms, contacts] = await Promise.all([
          api.get<AirlineDto[]>(`/admin/trips/${draftId}/airlines`),
          api.get<AccommodationDto[]>(`/admin/trips/${draftId}/accommodations`),
          api.get<EmergencyContactDto[]>(`/admin/trips/${draftId}/emergency-contacts`),
        ]);

        // One reset() seeds the entire form and clears isDirty in a single
        // commit, avoiding the flicker from per-field setValue calls.
        reset({
          scope: (trip.scope || "domestic") as TripScopeLocal,
          title: trip.title || "",
          destination: trip.destination || "",
          startDate: trip.startDate || "",
          endDate: trip.endDate || "",
          travelersCount: String(trip.travelersCount || ""),
          language: trip.language?.toLowerCase() || "th",
          coverUrl: trip.coverImageUrl || null,
          notes: trip.importantNotes || "",
          segments: airlines.length > 0
            ? airlines.map((a) => ({
                ...makeSegment(a.type === "return" ? "return" : "outbound", (a.transportType || "flight") as TransportType),
                serverId: a.id,
                from: a.departureAirport || "", fromDetail: a.departureDetail || "",
                to: a.arrivalAirport || "", toDetail: a.arrivalDetail || "",
                departureDate: a.departureDate || "", departureTime: a.departureTime || "",
                arrivalDate: a.arrivalDate || "", arrivalTime: a.arrivalTime || "",
                airline: a.airline || "", flightNumber: a.flightNumber || "",
                operator: a.operator || "", vehicleInfo: a.vehicleInfo || "",
                bookingRef: a.bookingRef || "", baggage: a.baggage || "",
                meetingPoint: a.meetingPoint || "", note: a.note || "",
              }))
            : [],
          hotels: accoms.length > 0
            ? accoms.map((h) => ({
                id: h.id,
                name: h.name || "", address: h.address || "", phone: h.phone || "",
                checkIn: h.checkIn || "", checkOut: h.checkOut || "", nights: h.nights || 1,
              }))
            : [{ ...emptyHotel }],
          emergencyContacts: contacts.length > 0
            ? contacts.map((c) => ({
                serverId: c.id,
                name: c.name || "", phone: c.phone || "", note: "",
              }))
            : [],
        });
      } catch {
        setApiError("ไม่สามารถโหลดข้อมูล draft ได้");
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftId, reset]);

  const selectScope = useCallback((scope: TripScopeLocal): void => {
    setValue("scope", scope, { shouldDirty: true });
    if (scope === "domestic") {
      segmentsField.replace([makeSegment("outbound", "van"), makeSegment("return", "van")]);
      setValue("language", "th", { shouldDirty: true });
      // Two universal Thai numbers — same regardless of province, real
      // phones (not placeholders), so seeding them saves the operator
      // typing on every domestic trip.
      contactsField.replace([
        { name: "ตำรวจท่องเที่ยว", phone: "1155", note: "" },
        { name: "แพทย์ฉุกเฉิน", phone: "1669", note: "" },
      ]);
    } else if (scope === "international") {
      segmentsField.replace([makeSegment("outbound", "flight"), makeSegment("return", "flight")]);
      // Start empty for international — the country-prefill effect fills
      // 3 real entries the moment the operator types a recognised
      // destination, and showing 3 phoneless "สถานทูตไทย / ตำรวจ /
      // แพทย์" placeholder cards before that just looks like work
      // waiting to be done.
      contactsField.replace([]);
    }
  }, [setValue, segmentsField, contactsField]);

  // ─── Dev Auto Fill ───
  function autoFill() {
    const isDomestic = tripScope === "domestic";
    const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Basic info
    const domesticDests = ["เชียงใหม่", "ภูเก็ต", "กระบี่", "เกาะสมุย", "เขาใหญ่", "หัวหิน"];
    const internationalDests = ["Japan, Tokyo", "Korea, Seoul", "Singapore", "Bali, Indonesia"];
    const dest = isDomestic ? rand(domesticDests) : rand(internationalDests);
    const start = new Date();
    start.setDate(start.getDate() + Math.floor(Math.random() * 60) + 14);
    const nights = Math.floor(Math.random() * 5) + 3;
    const end = new Date(start);
    end.setDate(end.getDate() + nights);

    setValue("title", isDomestic ? `ทริป${dest} ${new Date().getFullYear() + 543}` : `${dest.split(",")[0]} Trip ${new Date().getFullYear()}`, { shouldDirty: true });
    setValue("destination", dest, { shouldDirty: true });
    setValue("travelersCount", String(Math.floor(Math.random() * 25) + 5), { shouldDirty: true });
    setValue("language", isDomestic ? "th" : rand(["en", "ja", "th"]), { shouldDirty: true });
    setValue("startDate", fmt(start), { shouldDirty: true });
    setValue("endDate", fmt(end), { shouldDirty: true });
    setValue("coverUrl", null, { shouldDirty: true });

    // Transport — ทุก field
    if (!isDomestic) {
      const airlineName = rand(["Thai Airways", "AirAsia X", "EVA Air", "Japan Airlines"]);
      const destCode = rand(["NRT", "ICN", "SIN", "DPS"]);
      segmentsField.replace([
        {
          ...makeSegment("outbound", "flight"),
          airline: airlineName, flightNumber: `TG${Math.floor(Math.random() * 900) + 100}`,
          from: "กรุงเทพฯ", fromDetail: "สุวรรณภูมิ Terminal 1", to: dest.split(",")[0].trim(), toDetail: `${destCode} Terminal 1`,
          departureDate: fmt(start), departureTime: "08:30", arrivalDate: fmt(start), arrivalTime: "16:45",
          bookingRef: `BK${Math.random().toString(36).slice(2, 8).toUpperCase()}`, baggage: "30kg",
          meetingPoint: "เคาน์เตอร์เช็คอิน Row D ชั้น 4", note: "นัดรวมพล 3 ชม. ก่อนบิน",
        },
        {
          ...makeSegment("return", "flight"),
          airline: airlineName, flightNumber: `TG${Math.floor(Math.random() * 900) + 100}`,
          from: dest.split(",")[0].trim(), fromDetail: `${destCode} Terminal 1`, to: "กรุงเทพฯ", toDetail: "สุวรรณภูมิ Terminal 1",
          departureDate: fmt(end), departureTime: "22:00", arrivalDate: fmt(new Date(end.getTime() + 86400000)), arrivalTime: "02:30",
          bookingRef: `BK${Math.random().toString(36).slice(2, 8).toUpperCase()}`, baggage: "30kg",
          meetingPoint: `ล็อบบี้โรงแรม เวลา 18:00`, note: "ออกจากโรงแรม 4 ชม. ก่อนบิน",
        },
      ]);
    } else {
      const vanOp = rand(["รถตู้สมชาย ทัวร์", "เที่ยวทั่วไทย", "ไทยทราเวล"]);
      segmentsField.replace([
        {
          ...makeSegment("outbound", "van"),
          from: "กรุงเทพฯ", fromDetail: "ปั๊ม ปตท. พหลโยธิน", to: dest, toDetail: "โรงแรม",
          departureDate: fmt(start), departureTime: "06:00", arrivalDate: fmt(start), arrivalTime: "12:00",
          operator: vanOp, vehicleInfo: `ทะเบียน ${rand(["กข", "ขค", "คง"])} ${Math.floor(Math.random() * 9000) + 1000}`,
          meetingPoint: "ปั๊ม ปตท. ถนนพหลโยธิน กม.12", note: "กรุณามาก่อนเวลา 15 นาที",
        },
        {
          ...makeSegment("return", "van"),
          from: dest, fromDetail: "โรงแรม", to: "กรุงเทพฯ", toDetail: "ปั๊ม ปตท. พหลโยธิน",
          departureDate: fmt(end), departureTime: "14:00", arrivalDate: fmt(end), arrivalTime: "20:00",
          operator: vanOp, vehicleInfo: `ทะเบียน ${rand(["กข", "ขค", "คง"])} ${Math.floor(Math.random() * 9000) + 1000}`,
          meetingPoint: "ล็อบบี้โรงแรม", note: "",
        },
      ]);
    }

    // Accommodation — checkIn/Out เป็น date format ตาม UI
    const checkInDate = new Date(start);
    const checkOutDate = new Date(end);
    const hotelNames = isDomestic
      ? ["โรงแรมเชียงใหม่แกรนด์วิว", "The Sea House Krabi", "Pullman Phuket", "บ้านปลายหาด รีสอร์ท"]
      : ["Park Hyatt Tokyo", "Lotte Hotel Seoul", "Marina Bay Sands", "Four Seasons Bali"];
    hotelsField.replace([{
      name: rand(hotelNames),
      address: isDomestic ? `${Math.floor(Math.random() * 200) + 1} ถ.${rand(["เจริญเมือง", "ช้างคลาน", "นิมมาน", "ราชดำเนิน"])} ` : "3-7-1-2 Nishi Shinjuku, Tokyo",
      phone: isDomestic ? `0${Math.floor(Math.random() * 9) + 2}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : `+81-3-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      checkIn: `${fmt(checkInDate)}T15:00`,
      checkOut: `${fmt(checkOutDate)}T12:00`,
      nights,
    }]);

    // Emergency contacts
    if (isDomestic) {
      contactsField.replace([
        { name: "ตำรวจท่องเที่ยว", phone: "1155", note: "" },
        { name: "แพทย์ฉุกเฉิน (สพฉ.)", phone: "1669", note: "" },
        { name: "สายด่วนกรมควบคุมโรค", phone: "1422", note: "" },
      ]);
    } else {
      const embassies: Record<string, { name: string; phone: string }> = {
        "Japan": { name: "สถานเอกอัครราชทูตไทย ณ กรุงโตเกียว", phone: "+81-3-2207-9100" },
        "Korea": { name: "สถานเอกอัครราชทูตไทย ณ กรุงโซล", phone: "+82-2-795-3098" },
        "Singapore": { name: "สถานเอกอัครราชทูตไทย ณ สิงคโปร์", phone: "+65-6737-2644" },
        "Bali": { name: "สถานกงสุลใหญ่ไทย ณ บาหลี", phone: "+62-361-263-5327" },
      };
      const country = dest.split(",")[0].trim();
      const embassy = embassies[country] || { name: `สถานทูตไทย ณ ${country}`, phone: "+66-2-203-5000" };
      contactsField.replace([
        { name: embassy.name, phone: embassy.phone, note: "" },
        { name: `ตำรวจท้องถิ่น ${country}`, phone: country === "Japan" ? "110" : country === "Korea" ? "112" : "911", note: "" },
        { name: `แพทย์ฉุกเฉิน ${country}`, phone: country === "Japan" ? "119" : country === "Korea" ? "119" : "995", note: "" },
      ]);
    }

    // Notes
    setValue("notes", isDomestic
      ? `สิ่งที่ต้องเตรียม:\n• ครีมกันแดด\n• ยากันยุง\n• เสื้อผ้าสบายๆ\n\nนัดหมาย:\n• จุดรับ-ส่ง: ปั๊ม ปตท. ถนนพหลโยธิน กม.12\n• เวลา 05:30 น.`
      : `สิ่งที่ต้องเตรียม:\n• พาสปอร์ต (อายุเหลือ 6 เดือนขึ้นไป)\n• ประกันการเดินทาง\n• เงินสด ¥30,000 ต่อคน\n• เสื้อกันหนาว (อุณหภูมิ 5-10°C)\n\nนัดหมาย:\n• สนามบินสุวรรณภูมิ ชั้น 4 เคาน์เตอร์ D\n• 3 ชม. ก่อนเวลาบิน`,
      { shouldDirty: true });
  }

  // Outbound/return projection used by the JSX. Recomputed each render
  // off the watched array — cheap, no need to memo.
  const outbound = segments.filter((s) => s.direction === "outbound");
  const returnSegs = segments.filter((s) => s.direction === "return");

  function addSegment(direction: "outbound" | "return"): void {
    segmentsField.append(makeSegment(direction, "flight"));
  }
  function removeSegment(id: string): void {
    const idx = getValues("segments").findIndex((s) => s.id === id);
    if (idx >= 0) segmentsField.remove(idx);
  }
  function updateSegment(id: string, patch: Partial<TransportSegment>): void {
    const idx = getValues("segments").findIndex((s) => s.id === id);
    if (idx < 0) return;
    const current = getValues(`segments.${idx}`);
    segmentsField.update(idx, { ...current, ...patch });
  }

  function updateHotel(index: number, patch: Partial<Accommodation>): void {
    const current = getValues(`hotels.${index}`);
    hotelsField.update(index, { ...current, ...patch });
  }

  function updateContact(index: number, patch: Partial<EmergencyContactRow>): void {
    const current = getValues(`emergencyContacts.${index}`);
    contactsField.update(index, { ...current, ...patch });
  }

  // ─── Validation ───
  // Reads from form state via getValues() so it stays in sync without
  // depending on stale closure captures of every individual watch.
  function validate(): boolean {
    const v = getValues();
    const errors: FieldErrors = {};

    // Basics — Zod schema. First error per path wins.
    const basics = tripBasicsSchema.safeParse({
      title: v.title, destination: v.destination, startDate: v.startDate,
      endDate: v.endDate, travelersCount: v.travelersCount, notes: v.notes,
    });
    if (!basics.success) {
      for (const issue of basics.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errors[key]) errors[key] = issue.message;
      }
    }

    // Hotels: validate every non-empty row. First failing row blocks save
    // and surfaces a single banner-level error.
    for (let i = 0; i < v.hotels.length; i++) {
      const h = v.hotels[i];
      if (!h.name.trim()) continue;
      const r = hotelSchema.safeParse(h);
      if (!r.success) {
        errors._hotels = `ที่พัก #${i + 1}: ${r.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"}`;
        break;
      }
    }

    // Emergency contacts: same pattern.
    for (let i = 0; i < v.emergencyContacts.length; i++) {
      const c = v.emergencyContacts[i];
      if (!c.name.trim()) continue;
      const r = emergencyContactSchema.safeParse(c);
      if (!r.success) {
        errors._contacts = `เบอร์ฉุกเฉิน #${i + 1}: ${r.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"}`;
        break;
      }
    }

    setFieldErrors(errors);
    if (errors._hotels) toast(errors._hotels, "error");
    if (errors._contacts) toast(errors._contacts, "error");
    return Object.keys(errors).length === 0;
  }

  // ─── Submit ───
  /**
   * Save trip — ใช้ทั้ง save draft + submit
   * ถ้ามี draftId → PUT update, ถ้าไม่มี → POST create
   */
  async function saveTrip(redirectToEdit: boolean): Promise<void> {
    setApiError(null);

    if (redirectToEdit && !validate()) return;

    const isSaving = !redirectToEdit;
    if (isSaving) setSavingDraft(true); else setLoading(true);

    try {
      let tripId = draftId;
      const v = getValues();

      // Step 1: Create or Update trip
      const tripPayload = {
        scope: v.scope,
        title: v.title.trim() || "Untitled Trip",
        destination: v.destination.trim() || "TBD",
        startDate: v.startDate || new Date().toISOString().split("T")[0],
        endDate: v.endDate || new Date().toISOString().split("T")[0],
        travelersCount: Number(v.travelersCount) || 1,
        language: v.language,
        coverImageUrl: v.coverUrl,
        importantNotes: v.notes.trim() || undefined,
      };

      if (tripId) {
        await api.put(`/admin/trips/${tripId}`, tripPayload);
      } else {
        const trip = await api.post<TripPlan>("/admin/trips", tripPayload);
        tripId = trip.id;
        setDraftId(tripId);
        // Persist the new id in the URL without scrolling. Lets refresh
        // restore the draft and survives back/forward navigation.
        router.replace(`/dashboard/trips/new?id=${tripId}`, { scroll: false });
      }

      // Step 2-4: Bulk-diff each child collection. The server diffs the
      // incoming list against DB (UPDATE matched ids, INSERT null ids,
      // DELETE missing ids) inside one transaction per collection. We
      // run all 3 in parallel — they touch independent tables.
      const filteredHotels = v.hotels.filter((h) => h.name.trim());
      const filteredContacts = v.emergencyContacts.filter((c) => c.name.trim());

      const [airlinesRes, hotelsRes, contactsRes] = await Promise.all([
        api.put<Array<{ id: string }>>(`/admin/trips/${tripId}/airlines/bulk`, {
          items: v.segments.map((seg) => ({
            id: seg.serverId ?? null,
            transportType: seg.type,
            type: seg.direction === "outbound" ? "departure" : "return",
            departureAirport: seg.from, departureDetail: seg.fromDetail,
            arrivalAirport: seg.to, arrivalDetail: seg.toDetail,
            departureDate: seg.departureDate, departureTime: seg.departureTime,
            arrivalDate: seg.arrivalDate, arrivalTime: seg.arrivalTime,
            airline: seg.airline, flightNumber: seg.flightNumber,
            operator: seg.operator, vehicleInfo: seg.vehicleInfo,
            bookingRef: seg.bookingRef, baggage: seg.baggage,
            meetingPoint: seg.meetingPoint, note: seg.note,
          })),
        }),
        api.put<Array<{ id: string }>>(`/admin/trips/${tripId}/accommodations/bulk`, {
          items: filteredHotels.map((h) => ({
            id: h.id ?? null,
            name: h.name.trim(),
            address: h.address,
            phone: h.phone,
            checkIn: h.checkIn,
            checkOut: h.checkOut,
            nights: h.nights,
          })),
        }),
        api.put<Array<{ id: string }>>(`/admin/trips/${tripId}/emergency-contacts/bulk`, {
          items: filteredContacts.map((c) => ({
            id: c.serverId ?? null,
            name: c.name.trim(),
            phone: c.phone,
            icon: "emergency",
          })),
        }),
      ]);

      // Adopt server-assigned ids back into the form so subsequent saves
      // UPDATE in place instead of re-INSERTing. We reset() with the
      // freshly-saved values so formState.isDirty flips back to false —
      // RHF's natural way to mark "current state matches DB".
      const nextSegments = v.segments.map((seg, i) => ({ ...seg, serverId: airlinesRes[i]?.id ?? seg.serverId }));
      let savedHotelIdx = 0;
      const nextHotels = v.hotels.map((h) => {
        if (!h.name.trim()) return h;
        const id = hotelsRes[savedHotelIdx++]?.id;
        return id ? { ...h, id } : h;
      });
      let savedContactIdx = 0;
      const nextContacts = v.emergencyContacts.map((c) => {
        if (!c.name.trim()) return c;
        const id = contactsRes[savedContactIdx++]?.id;
        return id ? { ...c, serverId: id } : c;
      });
      reset({
        ...v,
        segments: nextSegments,
        hotels: nextHotels,
        emergencyContacts: nextContacts,
      }, { keepDirty: false });

      if (redirectToEdit) {
        router.push(ROUTES.tripEdit(tripId!));
      } else {
        toast("บันทึกร่างแล้ว", "success");
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง";
      setApiError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    await saveTrip(true);
  }

  async function handleSaveDraft(): Promise<void> {
    await saveTrip(false);
  }

  if (loadingDraft) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400 animate-pulse">กำลังโหลด draft...</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={1} tripId="new" subtitle="ข้อมูลทริป" />

      <FooterActionBar
        backHref={ROUTES.myTrips}
        backLabel="ย้อนกลับ"
        backIcon="arrow_back"
        onSaveDraft={handleSaveDraft}
        savingDraft={savingDraft}
        saveDraftLabel={draftId ? "อัพเดทร่าง" : "บันทึกร่าง"}
        nextLabel={loading ? "กำลังบันทึก..." : "ถัดไป: เพิ่มกิจกรรม"}
        onNext={handleSubmit}
        loading={loading}
        disabled={loading || savingDraft}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {apiError && (
          <Banner variant="danger" title="เกิดข้อผิดพลาด" onDismiss={() => setApiError(null)} className="mb-6">
            {apiError}
          </Banner>
        )}

        <form noValidate className="space-y-12 md:space-y-20" onSubmit={(e) => e.preventDefault()}>
          {/* Scope toggle — was a separate step in the old flow. Toggling
              after data has been entered resets segments + emergency
              contacts to the chosen scope's defaults; we confirm first. */}
          <div className="max-w-md">
            <SegmentedControl
              label="ประเภททริป"
              value={(tripScope ?? "domestic") as "domestic" | "international"}
              onChange={(next) => {
                if (next === tripScope) return;
                setPendingScope(next);
              }}
              options={[
                { value: "domestic", label: "ในประเทศ", icon: "holiday_village" },
                { value: "international", label: "ต่างประเทศ", icon: "flight_takeoff" },
              ]}
            />
          </div>

          {/* ═══ Section 1: Cover Image ═══ */}
          <section className="space-y-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-(--on-surface)">ภาพปกทริป</h3>
              <p className="text-(--on-surface-variant) text-sm">เลือกภาพปกเพื่อสร้างบรรยากาศให้ลูกทริป</p>
            </div>
            <ImageUpload
              value={coverUrl}
              onChange={(url) => updateField("coverUrl", url)}
              folder="covers"
              aspect="wide"
              label="อัปโหลดหรือลากรูปภาพปกมาวาง"
              hint="แนะนำ: 1920x800px ขึ้นไป"
            />
          </section>

          {/* ═══ Section 2: ข้อมูลทริป ═══ */}
          <section className="space-y-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-(--on-surface)">ข้อมูลทริป</h3>
              <p className="text-(--on-surface-variant) text-sm">กรอกข้อมูลพื้นฐานของทริป</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-6 md:gap-y-10 bg-white p-6 md:p-10 rounded-3xl border border-(--outline-variant)/30 shadow-sm">
              <div className="md:col-span-2 lg:col-span-8">
                <FormInput label="ชื่อทริป" placeholder="เช่น ทริปเชียงใหม่ 3 วัน 2 คืน" required value={title} onChange={(e) => updateField("title", e.target.value)} error={fieldErrors.title} />
              </div>
              <div className="md:col-span-1 lg:col-span-4">
                <SegmentedControl
                  label="ภาษาหลัก"
                  value={language}
                  onChange={(v) => updateField("language", v)}
                  options={[
                    { value: "th", label: "ไทย" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>
              <div className="md:col-span-1 lg:col-span-6">
                <FormInput label="จุดหมายปลายทาง" placeholder="จังหวัด หรือ ประเทศ" icon="location_on" required value={destination} onChange={(e) => updateField("destination", e.target.value)} error={fieldErrors.destination} />
              </div>
              {(() => {
                const isPublished = tripStatus === "Published" || tripStatus === "Unpublished";
                const isDateLocked = isPublished && dateChangeCount >= maxDateChanges;
                const remaining = maxDateChanges - dateChangeCount;
                const dateHint = isPublished && !isDateLocked ? `เปลี่ยนวันได้อีก ${remaining} ครั้ง` : isDateLocked ? "ล็อค — ใช้สิทธิ์เปลี่ยนวันหมดแล้ว" : "";
                return (
                  <>
                    <div className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}>
                      <DatePicker label={`วันเดินทาง${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required value={startDate} onChange={(v) => updateField("startDate", v)} error={fieldErrors.startDate} />
                    </div>
                    <div className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}>
                      <DatePicker label={`วันกลับ${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required min={startDate} value={endDate} onChange={(v) => updateField("endDate", v)} error={fieldErrors.endDate} />
                      {dateHint && <p className="text-[10px] text-(--on-surface-variant) mt-1 px-1">{dateHint}</p>}
                    </div>
                  </>
                );
              })()}
              <div className="md:col-span-2 lg:col-span-4">
                <FormInput label="จำนวนผู้เดินทาง" placeholder="จำนวนคน" type="number" icon="group" required value={travelersCount} onChange={(e) => updateField("travelersCount", e.target.value)} error={fieldErrors.travelersCount} />
              </div>
            </div>
          </section>

          {/* ═══ Section 3: Logistics ═══ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Transportation */}
            <div className="space-y-6">
              <SectionHeader title="การเดินทาง" icon="route" variant="icon" />

              {/* ── ขาไป (Outbound) ── */}
              <TransportSection
                label="ขาไป"
                icon="arrow_forward"
                segments={outbound}
                onAdd={() => addSegment("outbound")}
                onRemove={removeSegment}
                onUpdate={updateSegment}
              />

              {/* ── ขากลับ (Return) ── */}
              <TransportSection
                label="ขากลับ"
                icon="arrow_back"
                segments={returnSegs}
                onAdd={() => addSegment("return")}
                onRemove={removeSegment}
                onUpdate={updateSegment}
              />
            </div>

            {/* Accommodation */}
            <div className="space-y-6">
              <SectionHeader title="Accommodation" icon="hotel" variant="icon" />
              <div className="space-y-4">
                {hotels.map((hotel, i) => (
                  <HotelCard
                    key={i}
                    hotel={hotel}
                    index={i}
                    showRemove={hotels.length > 1}
                    startDate={startDate}
                    endDate={endDate}
                    onUpdate={(patch) => updateHotel(i, patch)}
                    onRemove={() => hotelsField.remove(i)}
                  />
                ))}
                <DashedAddButton onClick={() => hotelsField.append({ ...emptyHotel })}>
                  เพิ่มที่พัก
                </DashedAddButton>
              </div>
            </div>
          </section>

          {/* ═══ Section 4: Emergency Contacts ═══ */}
          <section className="space-y-6">
            <SectionHeader title="เบอร์ฉุกเฉิน" icon="emergency" variant="icon" subtitle="ข้อมูลสำหรับลูกทริปเมื่อเกิดเหตุฉุกเฉิน และใช้ยื่น ตม." />

            {tripScope === "international" && (() => {
              const matched = lookupEmergencyPrefill(destination);
              if (matched) {
                return (
                  <Banner variant="success" icon="check_circle" title="เบอร์ฉุกเฉินถูก pre-fill ตามประเทศปลายทางแล้ว">
                    กรุณาตรวจสอบและแก้ไขให้ตรงกับเมืองและสถานทูตที่ใกล้ที่สุดจริง ๆ
                  </Banner>
                );
              }
              return (
                <Banner variant="warning" icon="tips_and_updates" title="พิมพ์ชื่อประเทศในจุดหมายปลายทางเพื่อ pre-fill เบอร์ฉุกเฉิน">
                  รองรับ Japan, Korea, Singapore, Taiwan, Vietnam, Malaysia, Indonesia, Bali, China, Hong Kong, Australia (รวมชื่อภาษาไทย)
                </Banner>
              );
            })()}

            <div className="space-y-3">
              {emergencyContacts.map((contact, i) => (
                <EmergencyContactCard
                  key={i}
                  contact={contact}
                  showRemove={emergencyContacts.length > 1}
                  onUpdate={(patch) => updateContact(i, patch)}
                  onRemove={() => contactsField.remove(i)}
                />
              ))}
              <DashedAddButton onClick={() => contactsField.append({ name: "", phone: "", note: "" })}>
                เพิ่มเบอร์ฉุกเฉิน
              </DashedAddButton>
            </div>
          </section>

          {/* ═══ Section 5: Important Notes ═══ */}
          <section className="space-y-6">
            <SectionHeader title="หมายเหตุสำคัญ" icon="sticky_note_2" variant="icon" subtitle="ข้อมูลที่ลูกทริปต้องรู้ก่อนเดินทาง" />

            <div className="bg-white p-5 md:p-7 rounded-2xl border border-(--outline-variant)/30 shadow-sm space-y-4">
              <FormTextarea
                placeholder={"ข้อมูลที่ลูกทริปต้องรู้ก่อนเดินทาง เช่น สิ่งที่ต้องเตรียม อุณหภูมิ การแลกเงิน เอกสาร เวลานัดพบ"}
                value={notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={6}
              />
              <div className="flex items-start gap-2 text-xs text-(--on-surface-variant)">
                <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                <span>หมายเหตุนี้จะแสดงบนหน้าทริปให้ลูกทริปทุกคนเห็น</span>
              </div>
            </div>
          </section>

          {apiError && (
            <Banner variant="danger" title="เกิดข้อผิดพลาด" onDismiss={() => setApiError(null)}>
              {apiError}
            </Banner>
          )}
        </form>
      </div>

      {DevAutoFill && <DevAutoFill onFill={autoFill} />}

      {/* Confirm before swapping scope — segments + emergency contacts
          reset to the new scope's defaults via selectScope(). */}
      <ConfirmDialog
        open={pendingScope !== null}
        onClose={() => setPendingScope(null)}
        onConfirm={() => {
          if (pendingScope) selectScope(pendingScope);
          setPendingScope(null);
        }}
        title="เปลี่ยนประเภททริป?"
        description="ข้อมูลการเดินทางและเบอร์ฉุกเฉินจะถูกรีเซ็ตตามประเภทใหม่ — แน่ใจหรือไม่?"
        confirmLabel="เปลี่ยน"
        variant="danger"
      />
    </div>
  );
}
