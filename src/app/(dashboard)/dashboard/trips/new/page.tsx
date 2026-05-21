"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FormTextarea, SectionHeader, DashedAddButton, FooterActionBar, ImageUpload, DatePicker, Banner, SegmentedControl, SelectPicker, ConfirmDialog } from "@/components/shared";
import { useLanguages } from "@/lib/hooks/use-languages";
import { TransportSection, type TransportSegment, type TransportType, makeSegment } from "./_components/transport-section";
import { type TripScopeLocal } from "./_components/scope-selector";
import { HotelCard } from "./_components/hotel-card";
import { EmergencyContactCard, type EmergencyContactRow } from "./_components/emergency-contact-card";
import { ChecklistItemCard, type ChecklistRow } from "./_components/checklist-item-card";
import { CollapsibleSection } from "./_components/collapsible-section";
import { TemplatePickerModal } from "./_components/template-picker-modal";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { tripBasicsSchema, hotelSchema, emergencyContactSchema } from "@/lib/validation/trip";
import { lookupEmergencyPrefill } from "@/lib/emergency-contacts";
import dynamic from "next/dynamic";

// DevAutoFill is gated by NEXT_PUBLIC_DEV_TOOLS so it can be enabled
// in any environment via .env.local without requiring `npm run dev`.
const DevAutoFill = process.env.NEXT_PUBLIC_DEV_TOOLS === "true"
  ? dynamic(() => import("@pichetch08/trip-ui").then((m) => ({ default: m.DevAutoFill })), { ssr: false })
  : null;
import { useToast } from "@/components/shared";
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
  countryCode: string;
  startDate: string;
  endDate: string;
  // String because <input type=number> binds as string; the basics
  // schema coerces on validate.
  travelersCount: string;
  language: string;
  coverUrl: string | null;
  notes: string;
  lineGroupUrl: string;
  whatsappGroupUrl: string;
  telegramGroupUrl: string;
  segments: TransportSegment[];
  hotels: Accommodation[];
  emergencyContacts: EmergencyContactRow[];
  checklist: ChecklistRow[];
}

const FORM_DEFAULTS: TripFormValues = {
  // Default to domestic so the basics form is usable immediately. The
  // scope toggle on the page lets the operator switch — there is no
  // separate scope-picker step any more.
  scope: "domestic",
  title: "",
  destination: "",
  countryCode: "",
  startDate: "",
  endDate: "",
  travelersCount: "",
  language: "th",
  coverUrl: null,
  notes: "",
  lineGroupUrl: "",
  whatsappGroupUrl: "",
  telegramGroupUrl: "",
  // Domestic defaults: 2 van segments. Emergency contacts always start
  // empty — guessing what numbers the operator wants is presumptive
  // regardless of scope.
  segments: [makeSegment("outbound", "van"), makeSegment("return", "van")],
  hotels: [{ ...emptyHotel }],
  emergencyContacts: [],
  checklist: [],
};

export default function NewTripPage(): React.ReactNode {
  usePageTitle("สร้างทริปใหม่");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ─── Draft state (URL/UI, not part of the form) ───
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("id"));
  const [tripStatus, setTripStatus] = useState("");
  const [rejectionItems, setRejectionItems] = useState<{ itemId: string; itemLabel: string; reason: string }[]>([]);
  const [hasPublishedSnapshot, setHasPublishedSnapshot] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);


  // ─── Auto-save state ───
  type SaveStatus = "idle" | "saving" | "saved" | "error";
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inFlightRef = useRef(0);
  const savedFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beginAutoSave = useCallback((): void => {
    inFlightRef.current += 1;
    setSaveStatus("saving");
    if (savedFadeRef.current) { clearTimeout(savedFadeRef.current); savedFadeRef.current = null; }
  }, []);

  const endAutoSave = useCallback((ok: boolean): void => {
    inFlightRef.current = Math.max(0, inFlightRef.current - 1);
    if (inFlightRef.current > 0) return;
    if (!ok) { setSaveStatus("error"); return; }
    setSaveStatus("saved");
    savedFadeRef.current = setTimeout(() => { setSaveStatus("idle"); savedFadeRef.current = null; }, 2000);
  }, []);
  const [dateChangeCount, setDateChangeCount] = useState(0);
  const [maxDateChanges, setMaxDateChanges] = useState(99);
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [reloadKey, setReloadKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [countries, setCountries] = useState<{ code: string; nameTh: string; flag: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; slug: string; nameTh: string; icon?: string }[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [maxCategoriesPerTrip, setMaxCategoriesPerTrip] = useState(3);

  useEffect(() => {
    api.get<{ code: string; nameTh: string; flag: string }[]>("/meta/countries")
      .then(setCountries)
      .catch(() => {});
    api.get<{ id: string; slug: string; nameTh: string; icon?: string }[]>("/meta/trip-categories")
      .then(setCategories)
      .catch(() => {});
    api.get<{ maxCategoriesPerTrip: number }>("/meta/app-config")
      .then((cfg) => setMaxCategoriesPerTrip(cfg.maxCategoriesPerTrip ?? 3))
      .catch(() => {});
  }, []);

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
  const checklistField = useFieldArray({ control, name: "checklist" });

  // Watched values used by conditional rendering / effects below. RHF
  // re-renders the page when any of these change because we read them
  // here at the top level.
  const tripScope = watch("scope");
  const title = watch("title");
  const destination = watch("destination");
  const countryCode = watch("countryCode");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const travelersCount = watch("travelersCount");
  const language = watch("language");
  const coverUrl = watch("coverUrl");
  const notes = watch("notes");
  const lineGroupUrl = watch("lineGroupUrl");
  const whatsappGroupUrl = watch("whatsappGroupUrl");
  const telegramGroupUrl = watch("telegramGroupUrl");
  const segments = watch("segments");
  const hotels = watch("hotels");
  const emergencyContacts = watch("emergencyContacts");
  const checklist = watch("checklist");

  useUnsavedChanges(formState.isDirty || saveStatus === "saving");

  // When the user navigates to /trips/new (no ?id=) while the component
  // stays mounted (same pathname, only searchParams changed), useState
  // won't reinitialize. Use the string value as dep so this fires on
  // actual ID change rather than object reference change.
  const urlDraftId = searchParams.get("id");
  useEffect(() => {
    if (!urlDraftId && draftId) {
      setDraftId(null);
      setLoadingDraft(false);
      setTripStatus("");
      setDateChangeCount(0);
      reset(FORM_DEFAULTS);
    }
    // draftId is intentionally read via closure — we only care when urlDraftId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlDraftId]);

  // ─── Debounced auto-save (1 500 ms after last edit) ───
  // Runs after every render. Since every watched field causes a re-render,
  // this resets the 1 500 ms window on each keystroke — classic debounce.
  // Only fires when the form is dirty AND a trip already exists.
  useEffect(() => {
    if (!formState.isDirty || !draftId) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave();
      autoSaveTimerRef.current = null;
    }, 1500);
  }); // intentionally no deps — fires on every render triggered by watched field changes

  // Pending scope swap — confirm before resetting segments/contacts.
  const [pendingScope, setPendingScope] = useState<"domestic" | "international" | null>(null);

  // Master languages list for the primary-language picker. Falls back
  // to th/en silently if /admin/languages fails — language is rarely
  // the blocking field.
  const { languages: availableLanguages } = useLanguages();
  const languageOptions = availableLanguages.map((l) => {
    const name = l.nameNative === l.nameEn ? l.nameNative : `${l.nameNative} · ${l.nameEn}`;
    return {
      value: l.code,
      label: l.flag ? `${l.flag}  ${name}` : name,
    };
  });

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
      title?: string; destination?: string; countryCode?: string | null;
      categories?: { id: string }[];
      startDate?: string; endDate?: string;
      travelersCount?: number; language?: string;
      coverImageUrl?: string | null; importantNotes?: string | null;
      lineGroupUrl?: string | null; whatsappGroupUrl?: string | null; telegramGroupUrl?: string | null;
      rejectionItems?: { itemId: string; itemLabel: string; reason: string }[];
      publishedAt?: string | null;
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
    type ChecklistItemDto = {
      id: string; label: string; isRequired: boolean;
    };

    (async () => {
      try {
        const trip = await api.get<TripDraftDto>(`/admin/trips/${draftId}`);
        setTripStatus(trip.status || "");
        setDateChangeCount(trip.dateChangeCount || 0);
        setRejectionItems(trip.rejectionItems ?? []);
        setHasPublishedSnapshot(!!trip.publishedAt);
        if (trip.categories) setSelectedCategoryIds(trip.categories.map((c) => c.id));

        // Load max date changes from system config
        try {
          const usage = await api.get<{ maxDateChanges?: number }>("/admin/usage");
          if (typeof usage.maxDateChanges === "number") setMaxDateChanges(usage.maxDateChanges);
        } catch { /* use default */ }

        // Children loaded in parallel — they're independent.
        const [airlines, accoms, contacts, checklistItems, supportedLangsResp] = await Promise.all([
          api.get<AirlineDto[]>(`/admin/trips/${draftId}/airlines`),
          api.get<AccommodationDto[]>(`/admin/trips/${draftId}/accommodations`),
          api.get<EmergencyContactDto[]>(`/admin/trips/${draftId}/emergency-contacts`),
          api.get<ChecklistItemDto[]>(`/admin/trips/${draftId}/checklist`),
          api.get<{ languageCodes: string[] }>(`/admin/trips/${draftId}/translations/supported`).catch(() => ({ languageCodes: [] })),
        ]);
        setSupportedLangs(supportedLangsResp.languageCodes ?? []);

        // One reset() seeds the entire form and clears isDirty in a single
        // commit, avoiding the flicker from per-field setValue calls.
        reset({
          scope: (trip.scope || "domestic") as TripScopeLocal,
          title: trip.title || "",
          destination: trip.destination || "",
          countryCode: trip.countryCode || "",
          startDate: trip.startDate || "",
          endDate: trip.endDate || "",
          travelersCount: String(trip.travelersCount || ""),
          language: trip.language?.toLowerCase() || "th",
          coverUrl: trip.coverImageUrl || null,
          notes: trip.importantNotes || "",
          lineGroupUrl: trip.lineGroupUrl || "",
          whatsappGroupUrl: trip.whatsappGroupUrl || "",
          telegramGroupUrl: trip.telegramGroupUrl || "",
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
          checklist: checklistItems.map((c) => ({
            serverId: c.id,
            label: c.label,
            isRequired: c.isRequired,
          })),
        });
      } catch {
        setApiError("ไม่สามารถโหลดข้อมูล draft ได้");
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftId, reset, reloadKey]);

  const selectScope = useCallback((scope: TripScopeLocal): void => {
    setValue("scope", scope, { shouldDirty: true });
    if (scope === "domestic") {
      segmentsField.replace([makeSegment("outbound", "van"), makeSegment("return", "van")]);
      setValue("language", "th", { shouldDirty: true });
      // Empty start — operator adds the universal numbers via the
      // quick-action below if they want them. Same UX rationale as
      // international: don't fill data the operator didn't ask for.
      contactsField.replace([]);
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

    // Notes — randomize details each time
    const meetTime = rand(["05:00", "05:30", "06:00", "06:30"]);
    const meetPoints = ["ปั๊ม ปตท. ถนนพหลโยธิน กม.12", "ลานจอดรถห้างเซ็นทรัล ลาดพร้าว", "หน้า 7-11 ถนนรัชดา", "อนุสาวรีย์ชัยสมรภูมิ ทางออก 4"];
    const cashAmounts = ["¥20,000", "¥30,000", "¥40,000"];
    const temps = ["5-10°C", "10-15°C", "0-5°C"];
    const counters = ["D", "E", "F", "G"];
    setValue("notes", isDomestic
      ? `สิ่งที่ต้องเตรียม:\n• ครีมกันแดด SPF50+\n• ยากันยุง\n• เสื้อผ้าสบายๆ\n\nนัดหมาย:\n• จุดรับ-ส่ง: ${rand(meetPoints)}\n• เวลา ${meetTime} น.`
      : `สิ่งที่ต้องเตรียม:\n• พาสปอร์ต (อายุเหลือ 6 เดือนขึ้นไป)\n• ประกันการเดินทาง\n• เงินสด ${rand(cashAmounts)} ต่อคน\n• เสื้อกันหนาว (อุณหภูมิ ${rand(temps)})\n\nนัดหมาย:\n• สนามบินสุวรรณภูมิ ชั้น 4 เคาน์เตอร์ ${rand(counters)}\n• 3 ชม. ก่อนเวลาบิน`,
      { shouldDirty: true });

    // Checklist — สุ่มจาก pool ใหญ่
    const domesticPool = [
      { label: "บัตรประชาชน / พาสปอร์ต", isRequired: true },
      { label: "ครีมกันแดด SPF50+", isRequired: false },
      { label: "ยากันยุง", isRequired: false },
      { label: "เสื้อผ้าสำหรับ 3 วัน", isRequired: false },
      { label: "รองเท้าสบาย", isRequired: false },
      { label: "หมวกกันแดด", isRequired: false },
      { label: "ร่ม / เสื้อกันฝน", isRequired: false },
      { label: "ยาแก้ท้องเสีย", isRequired: false },
      { label: "กระเป๋าเป้ใบเล็ก", isRequired: false },
      { label: "ธนบัตรย่อย", isRequired: false },
    ];
    const intlPool = [
      { label: "พาสปอร์ต (อายุเหลือ 6 เดือนขึ้นไป)", isRequired: true },
      { label: "ประกันการเดินทาง", isRequired: true },
      { label: "วีซ่า (ถ้าจำเป็น)", isRequired: true },
      { label: "เงินสด / บัตรเครดิต", isRequired: false },
      { label: "ปลั๊กแปลง", isRequired: false },
      { label: "ยาประจำตัว", isRequired: false },
      { label: "หูฟัง / ที่อุดหู", isRequired: false },
      { label: "Pocket WiFi / SIM ต่างประเทศ", isRequired: false },
      { label: "กระเป๋าล็อคซิป", isRequired: false },
      { label: "แจ็คเก็ตกันหนาว", isRequired: false },
    ];
    const pickRandom = <T,>(pool: T[], min: number, max: number): T[] => {
      const count = min + Math.floor(Math.random() * (max - min + 1));
      return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
    };
    checklistField.replace(isDomestic ? pickRandom(domesticPool, 4, 6) : pickRandom(intlPool, 5, 7));

    // Group channels
    setValue("lineGroupUrl", `https://line.me/R/ti/g/${Math.random().toString(36).slice(2, 12)}`, { shouldDirty: true });
    setValue("whatsappGroupUrl", "", { shouldDirty: true });
    setValue("telegramGroupUrl", "", { shouldDirty: true });

    // Supported translation languages
    setSupportedLangs(isDomestic ? ["en"] : ["th"]);
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
    if (errors._hotels) toast.error(errors._hotels);
    if (errors._contacts) toast.error(errors._contacts);
    return Object.keys(errors).length === 0;
  }

  // ─── Submit ───
  /**
   * Core save — ใช้ทั้ง submit (redirectToEdit=true) + manual draft + auto-save.
   * silent=true → ใช้ beginAutoSave/endAutoSave แทน loading spinner, ไม่ toast สำเร็จ
   */
  async function saveTrip(redirectToEdit: boolean, silent = false): Promise<void> {
    setApiError(null);

    if (redirectToEdit && !validate()) return;

    if (silent) { beginAutoSave(); } else if (redirectToEdit) { setLoading(true); }

    try {
      let tripId = draftId;
      const v = getValues();

      // Step 1: Create or Update trip
      const tripPayload = {
        scope: v.scope,
        title: v.title.trim() || "Untitled Trip",
        destination: v.destination.trim() || "TBD",
        countryCode: v.countryCode || undefined,
        categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
        startDate: v.startDate || new Date().toISOString().split("T")[0],
        endDate: v.endDate || new Date().toISOString().split("T")[0],
        travelersCount: Number(v.travelersCount) || 1,
        language: v.language,
        coverImageUrl: v.coverUrl,
        importantNotes: v.notes.trim() || undefined,
        lineGroupUrl: v.lineGroupUrl.trim() || undefined,
        whatsappGroupUrl: v.whatsappGroupUrl.trim() || undefined,
        telegramGroupUrl: v.telegramGroupUrl.trim() || undefined,
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

      // Save supported languages (fire-and-forget — non-blocking for UX)
      if (tripId && supportedLangs.length >= 0) {
        api.put(`/admin/trips/${tripId}/translations/supported`, { languageCodes: supportedLangs }).catch(() => { /* silent */ });
      }

      // Step 2-4: Bulk-diff each child collection. The server diffs the
      // incoming list against DB (UPDATE matched ids, INSERT null ids,
      // DELETE missing ids) inside one transaction per collection. We
      // run all 3 in parallel — they touch independent tables.
      const filteredHotels = v.hotels.filter((h) => h.name.trim());
      const filteredContacts = v.emergencyContacts.filter((c) => c.name.trim());
      const filteredChecklist = v.checklist.filter((c) => c.label.trim());

      const [airlinesRes, hotelsRes, contactsRes, checklistRes] = await Promise.all([
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
        api.put<Array<{ id: string }>>(`/admin/trips/${tripId}/checklist/bulk`, {
          items: filteredChecklist.map((c) => ({
            id: c.serverId ?? null,
            label: c.label.trim(),
            isRequired: c.isRequired,
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
      let savedChecklistIdx = 0;
      const nextChecklist = v.checklist.map((c) => {
        if (!c.label.trim()) return c;
        const id = checklistRes[savedChecklistIdx++]?.id;
        return id ? { ...c, serverId: id } : c;
      });
      reset({
        ...v,
        segments: nextSegments,
        hotels: nextHotels,
        emergencyContacts: nextContacts,
        checklist: nextChecklist,
      }, { keepDirty: false });

      if (redirectToEdit) {
        router.push(ROUTES.tripEdit(tripId!));
      } else if (silent) {
        endAutoSave(true);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง";
      if (silent) {
        endAutoSave(false);
      } else {
        setApiError(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function autoSave(): Promise<void> {
    await saveTrip(false, true);
  }

  async function handleSubmit(): Promise<void> {
    await saveTrip(true);
  }

  async function handleRestorePublished(): Promise<void> {
    if (!draftId || restoring) return;
    setRestoring(true);
    try {
      await api.post(`/admin/trips/${draftId}/restore-published`, {});
      toast.success("กู้คืนข้อมูลสำเร็จ — โหลดข้อมูลล่าสุดที่ Publish แล้ว");
      setLoadingDraft(true);
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("ไม่สามารถกู้คืนข้อมูลได้");
    } finally {
      setRestoring(false);
      setShowRestoreConfirm(false);
    }
  }

  if (loadingDraft) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400 animate-pulse">กำลังโหลด draft...</div>
    </div>
  );

  /* ─── Trip ended flag (read-only mode) ─── */
  const isEnded = endDate && new Date(endDate + "T23:59:59") < new Date() && tripStatus !== "Draft";

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={1} tripId={draftId || "new"} subtitle="ข้อมูลทริป" allStepsClickable={!!isEnded} />

      {/* ═══ Ended banner ═══ */}
      {isEnded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-amber-600 text-xl">lock</span>
          <span className="text-sm font-medium text-amber-800">ทริปนี้สิ้นสุดแล้ว — ดูข้อมูลได้อย่างเดียว ไม่สามารถแก้ไขได้</span>
          <button
            onClick={() => router.push("/dashboard/my-trips")}
            className="ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-amber-600 text-white hover:bg-amber-700 transition"
          >
            กลับ
          </button>
        </div>
      )}

      {!isEnded && (
      <FooterActionBar
        backHref={ROUTES.myTrips}
        backLabel="ย้อนกลับ"
        backIcon="arrow_back"
        middleSlot={(
          <div className="flex items-center gap-3">
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
                {saveStatus === "saving" && <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />กำลังบันทึก…</>}
                {saveStatus === "saved" && <><span className="material-symbols-outlined text-sm">check_circle</span>บันทึกอัตโนมัติแล้ว</>}
                {saveStatus === "error" && <><span className="material-symbols-outlined text-sm">error</span>บันทึกไม่สำเร็จ</>}
              </span>
            )}
          </div>
        )}
        nextLabel={loading ? "กำลังบันทึก..." : "ถัดไป"}
        onNext={handleSubmit}
        loading={loading}
        disabled={loading || saveStatus === "saving"}
      />
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {apiError && (
          <Banner variant="danger" title="เกิดข้อผิดพลาด" onDismiss={() => setApiError(null)} className="mb-6">
            {apiError}
          </Banner>
        )}

        {/* Rejection items banner — shown when trip was sent back by staff */}
        {tripStatus === "Draft" && rejectionItems.length > 0 && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-red-100">
              <span className="material-symbols-outlined text-red-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
              <p className="font-bold text-red-800 text-sm flex-1">ทริปไม่ผ่านการตรวจสอบ — กรุณาแก้ไขรายการด้านล่าง</p>
            </div>
            <div className="divide-y divide-red-100">
              {rejectionItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="material-symbols-outlined text-red-400 text-base shrink-0 mt-0.5">error</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-red-800">{item.itemLabel}</p>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restore published banner — shown when trip is Draft but has a published snapshot */}
        {tripStatus === "Draft" && hasPublishedSnapshot && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
            <span className="material-symbols-outlined text-amber-500 text-xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">ทริปนี้มีข้อมูลที่ Publish ล่าสุดอยู่</p>
              <p className="text-xs text-amber-700 mt-0.5">หากต้องการยกเลิกการแก้ไขและกลับไปยังข้อมูลที่ Publish ไว้ สามารถกู้คืนได้</p>
            </div>
            <button
              onClick={() => setShowRestoreConfirm(true)}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">restore</span>
              กู้คืน
            </button>
          </div>
        )}

        {/* Restore confirmation modal */}
        {showRestoreConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 mx-auto mb-5">
                <span className="material-symbols-outlined text-amber-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>restore</span>
              </div>
              <h3 className="text-center text-lg font-bold text-slate-900 mb-2">กู้คืนข้อมูลที่ Publish ล่าสุด?</h3>
              <p className="text-center text-sm text-slate-500 mb-8 leading-relaxed">
                การดำเนินการนี้จะแทนที่ข้อมูล Draft ปัจจุบันทั้งหมดด้วยข้อมูลที่ Publish ล่าสุด<br />
                <span className="font-semibold text-slate-700">ข้อมูลที่แก้ไขไว้จะหายทั้งหมด</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  disabled={restoring}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleRestorePublished}
                  disabled={restoring}
                  className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {restoring
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังกู้คืน...</>
                    : <><span className="material-symbols-outlined text-sm">restore</span>กู้คืนเลย</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template picker shortcut — only shown when no draft exists yet */}
        {!draftId && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setTemplatePickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-(--outline-variant)/40 hover:border-(--primary)/50 text-sm font-bold text-(--on-surface-variant) hover:text-(--primary) bg-white transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-base">layers</span>
              สร้างจาก Template
            </button>
          </div>
        )}

        <form noValidate className="space-y-8 md:space-y-10" onSubmit={(e) => e.preventDefault()}>
          {/* Scope toggle — was a separate step in the old flow. Toggling
              after data has been entered resets segments + emergency
              contacts to the chosen scope's defaults; we confirm first.
              Wrapped in the same white card pattern as the sections
              below so it doesn't look like floating chrome. */}
          <section className="bg-white p-5 md:p-7 rounded-3xl border border-(--outline-variant)/30 shadow-sm">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-(--on-surface)">ประเภททริป</h3>
                <p className="text-xs text-(--on-surface-variant) mt-0.5">
                  เปลี่ยนได้ — ระบบจะรีเซ็ตข้อมูลเดินทาง / เบอร์ฉุกเฉินตามประเภทใหม่ (มีคำเตือนก่อน)
                </p>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[280px]">
                <SegmentedControl
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
            </div>
          </section>

          {/* ═══ Section 1: Cover Image ═══ */}
          <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 pt-5 pb-4 border-b border-(--outline-variant)/20">
              <SectionHeader title="ภาพปกทริป" icon="image" variant="icon" subtitle="เลือกภาพปกเพื่อสร้างบรรยากาศให้ลูกทริป" />
            </div>
            <ImageUpload
              value={coverUrl}
              onChange={(url) => updateField("coverUrl", url)}
              folder="covers"
              aspect="wide"
              label="อัปโหลดหรือลากรูปภาพปกมาวาง"
              hint="แนะนำ: 1920x1080 px (อัตราส่วน 16:9)"
              containerClassName="!rounded-none !border-0"
            />
          </section>

          {/* ═══ Section 2: ข้อมูลทริป ═══ */}
          <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm">
            <div className="px-6 md:px-8 pt-6 md:pt-7 pb-4 border-b border-(--outline-variant)/20">
              <SectionHeader title="ข้อมูลทริป" icon="info" variant="icon" subtitle="กรอกข้อมูลพื้นฐานของทริป" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-6 md:gap-y-8 p-6 md:p-8">
              <div className="md:col-span-2 lg:col-span-8">
                <FormInput label="ชื่อทริป" placeholder="เช่น ทริปเชียงใหม่ 3 วัน 2 คืน" required value={title} onChange={(e) => updateField("title", e.target.value)} error={fieldErrors.title} />
              </div>
              <div className="md:col-span-1 lg:col-span-4 space-y-3">
                <SelectPicker
                  label="ภาษาหลัก"
                  value={language}
                  onChange={(v) => updateField("language", v)}
                  options={languageOptions}
                  searchable={languageOptions.length > 6}
                />
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                <FormInput label="จุดหมายปลายทาง" placeholder="จังหวัด หรือ ประเทศ" icon="location_on" required value={destination} onChange={(e) => updateField("destination", e.target.value)} error={fieldErrors.destination} />
              </div>
              <div className="md:col-span-1 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  ประเทศ{tripScope === "international" && <span className="ml-1 text-rose-500">*</span>}
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => updateField("countryCode", e.target.value)}
                  className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all"
                >
                  <option value="">— เลือกประเทศ —{tripScope === "domestic" ? " (auto จากโปรไฟล์)" : ""}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.nameTh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category multi-select chips (max 3) */}
              {categories.length > 0 && (
                <div className="md:col-span-2 lg:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    ประเภททริป
                    <span className="ml-2 font-normal normal-case text-slate-400">(เลือกได้สูงสุด {maxCategoriesPerTrip} ประเภท)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = selectedCategoryIds.includes(cat.id);
                      const disabled = !selected && selectedCategoryIds.length >= maxCategoriesPerTrip;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedCategoryIds((prev) =>
                              prev.includes(cat.id)
                                ? prev.filter((id) => id !== cat.id)
                                : prev.length < maxCategoriesPerTrip ? [...prev, cat.id] : prev
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            selected
                              ? "bg-(--primary) text-white border-(--primary) shadow-sm"
                              : disabled
                                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                : "bg-white text-slate-700 border-slate-200 hover:border-(--primary)/50 hover:text-(--primary)"
                          }`}
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.nameTh}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {(() => {
                const isPublished = tripStatus === "Published" || tripStatus === "Unpublished";
                const isDateLocked = isPublished && dateChangeCount >= maxDateChanges;
                const remaining = maxDateChanges - dateChangeCount;
                // Native title= gives a hover/long-press tooltip without
                // pulling in a tooltip component. Lock state always
                // surfaces both the reason ("สิทธิ์เปลี่ยนวันหมด") and
                // the next step ("ติดต่อทีมงาน") so a stuck operator
                // doesn't have to guess.
                const lockTooltip = "ใช้สิทธิ์เปลี่ยนวันเดินทางครบจำนวนแล้ว — กรุณาติดต่อทีมงานหากต้องเปลี่ยนเพิ่ม";
                const dateHint = isPublished && !isDateLocked
                  ? `เปลี่ยนวันได้อีก ${remaining} ครั้ง`
                  : isDateLocked
                    ? "ล็อค — ใช้สิทธิ์เปลี่ยนวันหมดแล้ว"
                    : "";
                return (
                  <>
                    <div
                      className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}
                      title={isDateLocked ? lockTooltip : undefined}
                    >
                      <DatePicker label={`วันเดินทาง${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required value={startDate} onChange={(v) => updateField("startDate", v)} error={fieldErrors.startDate} />
                    </div>
                    <div
                      className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}
                      title={isDateLocked ? lockTooltip : undefined}
                    >
                      <DatePicker label={`วันกลับ${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required min={startDate} value={endDate} onChange={(v) => updateField("endDate", v)} error={fieldErrors.endDate} />
                      {dateHint && (
                        <p className={`text-[10px] mt-1 px-1 ${isDateLocked ? "text-rose-600 font-semibold" : "text-(--on-surface-variant)"}`}>
                          {dateHint}
                          {isDateLocked && <span className="block mt-0.5 font-normal text-(--on-surface-variant)">ติดต่อทีมงานหากต้องเปลี่ยนเพิ่ม</span>}
                        </p>
                      )}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Transportation */}
            <CollapsibleSection
              title="การเดินทาง"
              icon="route"
              summary={segments.length > 0 ? `${segments.length} ขา` : undefined}
            >
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
            </CollapsibleSection>

            {/* Accommodation */}
            <CollapsibleSection
              title="ที่พัก"
              icon="hotel"
              summary={hotels.filter((h) => h.name).length > 0 ? `${hotels.filter((h) => h.name).length} แห่ง` : undefined}
            >
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
            </CollapsibleSection>
          </div>

          {/* ═══ Section 4: Emergency Contacts ═══ */}
          <CollapsibleSection
            title="เบอร์ฉุกเฉิน"
            icon="emergency"
            subtitle="ข้อมูลสำหรับลูกทริปเมื่อเกิดเหตุฉุกเฉิน และใช้ยื่น ตม."
            summary={emergencyContacts.filter((c) => c.name).length > 0 ? `${emergencyContacts.filter((c) => c.name).length} เบอร์` : undefined}
          >
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
          </CollapsibleSection>

          {/* ═══ Section 5: Checklist ═══ */}
          <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm">
            <div className="px-6 md:px-8 pt-5 pb-4 border-b border-(--outline-variant)/20">
              <SectionHeader title="สิ่งที่ต้องเตรียม" icon="checklist" variant="icon" subtitle="รายการของที่ลูกทริปต้องเตรียมก่อนเดินทาง" />
            </div>
            <div className="p-6 md:p-8 space-y-3">
              {checklist.map((item, i) => (
                <ChecklistItemCard
                  key={i}
                  item={item}
                  onUpdate={(patch) => {
                    const current = getValues(`checklist.${i}`);
                    setValue(`checklist.${i}`, { ...current, ...patch }, { shouldDirty: true });
                  }}
                  onRemove={() => checklistField.remove(i)}
                />
              ))}
              <DashedAddButton onClick={() => checklistField.append({ label: "", isRequired: false })}>
                เพิ่มรายการ
              </DashedAddButton>
            </div>
          </section>

          {/* ═══ Section 6: Important Notes ═══ */}
          <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm">
            <div className="px-6 md:px-8 pt-5 pb-4 border-b border-(--outline-variant)/20">
              <SectionHeader title="หมายเหตุสำคัญ" icon="sticky_note_2" variant="icon" subtitle="ข้อมูลที่ลูกทริปต้องรู้ก่อนเดินทาง" />
            </div>
            <div className="p-6 md:p-8 space-y-4">
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

          {/* ═══ Section 7: Group Communication Channels ═══ */}
          <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm">
            <div className="px-6 md:px-8 pt-5 pb-4 border-b border-(--outline-variant)/20">
              <SectionHeader title="ช่องทางกลุ่ม" icon="groups" variant="icon" subtitle="ลิงก์กลุ่มสำหรับสมาชิกทริป (ไม่บังคับ)" />
            </div>
            <div className="p-6 md:p-8 space-y-5">
              {([
                { key: "lineGroupUrl", label: "LINE กลุ่ม", placeholder: "https://line.me/R/ti/g/...", icon: "chat", iconColor: "text-green-500", value: lineGroupUrl },
                { key: "whatsappGroupUrl", label: "WhatsApp กลุ่ม", placeholder: "https://chat.whatsapp.com/...", icon: "phone_in_talk", iconColor: "text-green-600", value: whatsappGroupUrl },
                { key: "telegramGroupUrl", label: "Telegram กลุ่ม", placeholder: "https://t.me/joinchat/...", icon: "send", iconColor: "text-blue-500", value: telegramGroupUrl },
              ] as const).map(({ key, label, placeholder, icon, iconColor, value }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">{label}</label>
                  <div className="relative">
                    <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl select-none pointer-events-none ${iconColor}`}>{icon}</span>
                    <input
                      type="url"
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 pl-12 pr-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-[border-color,box-shadow,background-color] text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none text-sm"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-(--on-surface-variant) flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                ลิงก์เหล่านี้จะแสดงบนหน้าทริปให้สมาชิกกดเข้ากลุ่มได้ทันที
              </p>
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

      {/* ═══ Template Picker ═══ */}
      <TemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
      />


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
