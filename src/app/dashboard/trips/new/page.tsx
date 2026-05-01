"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FormTextarea, SectionHeader, DashedAddButton, FooterActionBar, ImageUpload, DatePicker, Banner, SegmentedControl } from "@/components/shared";
import { TransportSection, type TransportSegment, type TransportType, makeSegment } from "./_components/transport-section";
import { ScopeSelector, type TripScopeLocal } from "./_components/scope-selector";
import { HotelCard } from "./_components/hotel-card";
import { EmergencyContactCard, type EmergencyContactRow } from "./_components/emergency-contact-card";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { tripBasicsSchema, hotelSchema, emergencyContactSchema } from "@/lib/validation/trip";
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

export default function NewTripPage(): React.ReactNode {
  usePageTitle("สร้างทริปใหม่");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ─── Draft state ───
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("id"));
  const [savingDraft, setSavingDraft] = useState(false);

  // ─── Trip scope ───
  const [tripScope, setTripScope] = useState<TripScopeLocal>(null);

  // Push a history entry when the user advances from scope picker → form
  // so the browser Back button reliably returns to the scope picker
  // (was: state-only, Back would skip past the picker entirely).
  // Only relevant before a draft exists; once draftId is set, the URL is
  // owned by the saved-draft path.
  useEffect(() => {
    if (!draftId && tripScope) {
      window.history.pushState({ wizardStep: "basics" }, "", "/dashboard/trips/new?step=basics");
    }
  }, [tripScope, draftId]);

  useEffect(() => {
    const onPopState = (): void => {
      // If the user popped back to a URL without ?step=basics and we
      // haven't saved a draft yet, drop the scope so the picker shows.
      if (draftId) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("step") !== "basics") setTripScope(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [draftId]);

  // ─── Trip status (for date lock) ───
  const [tripStatus, setTripStatus] = useState("");
  const [dateChangeCount, setDateChangeCount] = useState(0);
  const [maxDateChanges, setMaxDateChanges] = useState(99);

  // ─── Basic info ───
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelersCount, setTravelersCount] = useState("");
  const [language, setLanguage] = useState("th");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // ─── Transport ───
  const [segments, setSegments] = useState<TransportSegment[]>([]);

  // ─── Accommodation ───
  const [hotels, setHotels] = useState<Accommodation[]>([{ ...emptyHotel }]);

  // ─── Emergency contacts ───
  // serverId is the DB-assigned id (undefined for unsaved rows); needed
  // by the bulk-diff save endpoint to distinguish UPDATE from INSERT.
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContactRow[]>([]);

  // ─── Notes ───
  const [notes, setNotes] = useState("");

  // ─── UI state ───
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ─── Unsaved-changes tracking ───
  // savedSnapshot mirrors the last persisted form state; dirty = current
  // state differs. Saves snapshot on load + after a successful save.
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const currentSnapshot = JSON.stringify({
    tripScope, title, destination, startDate, endDate, travelersCount,
    language, coverUrl, segments, hotels, emergencyContacts, notes,
  });
  const isDirty = tripScope !== null && savedSnapshot !== "" && currentSnapshot !== savedSnapshot;
  useUnsavedChanges(isDirty);

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
        setTripScope((trip.scope || "domestic") as TripScopeLocal);
        setTripStatus(trip.status || "");
        setDateChangeCount(trip.dateChangeCount || 0);

        // Load max date changes from system config
        try {
          const usage = await api.get<{ maxDateChanges?: number }>("/admin/usage");
          if (typeof usage.maxDateChanges === "number") setMaxDateChanges(usage.maxDateChanges);
        } catch { /* use default */ }

        setTitle(trip.title || "");
        setDestination(trip.destination || "");
        setStartDate(trip.startDate || "");
        setEndDate(trip.endDate || "");
        setTravelersCount(String(trip.travelersCount || ""));
        setLanguage(trip.language?.toLowerCase() || "th");
        setCoverUrl(trip.coverImageUrl || null);
        setNotes(trip.importantNotes || "");

        // Load airlines/transport (preserve server id for bulk-diff save)
        const airlines = await api.get<AirlineDto[]>(`/admin/trips/${draftId}/airlines`);
        if (airlines.length > 0) {
          setSegments(airlines.map((a) => ({
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
          })));
        }

        // Load accommodations
        const accoms = await api.get<AccommodationDto[]>(`/admin/trips/${draftId}/accommodations`);
        if (accoms.length > 0) {
          setHotels(accoms.map((h) => ({
            id: h.id,
            name: h.name || "", address: h.address || "", phone: h.phone || "",
            checkIn: h.checkIn || "", checkOut: h.checkOut || "", nights: h.nights || 1,
          })));
        }

        // Load emergency contacts
        const contacts = await api.get<EmergencyContactDto[]>(`/admin/trips/${draftId}/emergency-contacts`);
        if (contacts.length > 0) {
          setEmergencyContacts(contacts.map((c) => ({
            serverId: c.id,
            name: c.name || "", phone: c.phone || "", note: "",
          })));
        }
      } catch {
        setApiError("ไม่สามารถโหลดข้อมูล draft ได้");
      } finally {
        setLoadingDraft(false);
      }
    })();
  }, [draftId]);

  // Snapshot the loaded form (or empty form for fresh trips) once
  // loading settles, so dirty-tracking has a baseline to compare against.
  useEffect(() => {
    if (loadingDraft) return;
    setSavedSnapshot(JSON.stringify({
      tripScope, title, destination, startDate, endDate, travelersCount,
      language, coverUrl, segments, hotels, emergencyContacts, notes,
    }));
    // Run only when loading completes — subsequent updates flow through
    // saveTrip's success path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingDraft]);

  function selectScope(scope: TripScopeLocal): void {
    setTripScope(scope);
    if (scope === "domestic") {
      setSegments([makeSegment("outbound", "van"), makeSegment("return", "van")]);
      setLanguage("th");
      setEmergencyContacts([
        { name: "ตำรวจท่องเที่ยว", phone: "1155", note: "" },
        { name: "แพทย์ฉุกเฉิน", phone: "1669", note: "" },
      ]);
    } else {
      setSegments([makeSegment("outbound", "flight"), makeSegment("return", "flight")]);
      setEmergencyContacts([
        { name: "สถานทูตไทย", phone: "", note: "กรอกเบอร์ตามประเทศปลายทาง" },
        { name: "ตำรวจท้องถิ่น", phone: "", note: "" },
        { name: "แพทย์ฉุกเฉิน", phone: "", note: "" },
      ]);
    }
  }

  // ─── Dev Auto Fill ───
  function autoFill() {
    const isDomestic = tripScope === "domestic";
    const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Basic info
    const domesticDests = ["เชียงใหม่", "ภูเก็ต", "กระบี่", "เกาะสมุย", "เขาใหญ่", "หัวหิน"];
    const internationalDests = ["Japan, Tokyo", "Korea, Seoul", "Singapore", "Bali, Indonesia"];
    const dest = isDomestic ? rand(domesticDests) : rand(internationalDests);

    setTitle(isDomestic ? `ทริป${dest} ${new Date().getFullYear() + 543}` : `${dest.split(",")[0]} Trip ${new Date().getFullYear()}`);
    setDestination(dest);
    setTravelersCount(String(Math.floor(Math.random() * 25) + 5));
    setLanguage(isDomestic ? "th" : rand(["en", "ja", "th"]));

    // Dates
    const start = new Date();
    start.setDate(start.getDate() + Math.floor(Math.random() * 60) + 14);
    const nights = Math.floor(Math.random() * 5) + 3;
    const end = new Date(start);
    end.setDate(end.getDate() + nights);
    setStartDate(fmt(start));
    setEndDate(fmt(end));

    // Cover image — left empty in dev auto-fill (operator uploads real image
    // via media library; placeholder URLs would fail with 404 on Unsplash CDN
    // changes anyway).
    setCoverUrl(null);

    // Transport — ทุก field
    if (!isDomestic) {
      const airlineName = rand(["Thai Airways", "AirAsia X", "EVA Air", "Japan Airlines"]);
      const destCode = rand(["NRT", "ICN", "SIN", "DPS"]);
      setSegments([
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
      setSegments([
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
    setHotels([{
      name: rand(hotelNames),
      address: isDomestic ? `${Math.floor(Math.random() * 200) + 1} ถ.${rand(["เจริญเมือง", "ช้างคลาน", "นิมมาน", "ราชดำเนิน"])} ` : "3-7-1-2 Nishi Shinjuku, Tokyo",
      phone: isDomestic ? `0${Math.floor(Math.random() * 9) + 2}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : `+81-3-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      checkIn: `${fmt(checkInDate)}T15:00`,
      checkOut: `${fmt(checkOutDate)}T12:00`,
      nights,
    }]);

    // Emergency contacts
    if (isDomestic) {
      setEmergencyContacts([
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
      setEmergencyContacts([
        { name: embassy.name, phone: embassy.phone, note: "" },
        { name: `ตำรวจท้องถิ่น ${country}`, phone: country === "Japan" ? "110" : country === "Korea" ? "112" : "911", note: "" },
        { name: `แพทย์ฉุกเฉิน ${country}`, phone: country === "Japan" ? "119" : country === "Korea" ? "119" : "995", note: "" },
      ]);
    }

    // Notes
    setNotes(isDomestic
      ? `สิ่งที่ต้องเตรียม:\n• ครีมกันแดด\n• ยากันยุง\n• เสื้อผ้าสบายๆ\n\nนัดหมาย:\n• จุดรับ-ส่ง: ปั๊ม ปตท. ถนนพหลโยธิน กม.12\n• เวลา 05:30 น.`
      : `สิ่งที่ต้องเตรียม:\n• พาสปอร์ต (อายุเหลือ 6 เดือนขึ้นไป)\n• ประกันการเดินทาง\n• เงินสด ¥30,000 ต่อคน\n• เสื้อกันหนาว (อุณหภูมิ 5-10°C)\n\nนัดหมาย:\n• สนามบินสุวรรณภูมิ ชั้น 4 เคาน์เตอร์ D\n• 3 ชม. ก่อนเวลาบิน`
    );
  }

  const outbound = segments.filter((s) => s.direction === "outbound");
  const returnSegs = segments.filter((s) => s.direction === "return");

  function addSegment(direction: "outbound" | "return"): void {
    setSegments([...segments, makeSegment(direction, "flight")]);
  }
  function removeSegment(id: string): void {
    setSegments(segments.filter((s) => s.id !== id));
  }
  function updateSegment(id: string, patch: Partial<TransportSegment>): void {
    setSegments(segments.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function updateHotel(index: number, patch: Partial<Accommodation>): void {
    setHotels(hotels.map((h, i) => i === index ? { ...h, ...patch } : h));
  }

  function updateContact(index: number, patch: Partial<{ name: string; phone: string; note: string }>): void {
    setEmergencyContacts(emergencyContacts.map((c, i) => i === index ? { ...c, ...patch } : c));
  }

  // ─── Validation ───
  function validate(): boolean {
    const errors: FieldErrors = {};

    // Basics — Zod schema. First error per path wins.
    const basics = tripBasicsSchema.safeParse({
      title, destination, startDate, endDate, travelersCount, notes,
    });
    if (!basics.success) {
      for (const issue of basics.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !errors[key]) errors[key] = issue.message;
      }
    }

    // Hotels: validate every non-empty row. First failing row blocks save
    // and surfaces a single banner-level error.
    for (let i = 0; i < hotels.length; i++) {
      const h = hotels[i];
      if (!h.name.trim()) continue;
      const r = hotelSchema.safeParse(h);
      if (!r.success) {
        errors._hotels = `ที่พัก #${i + 1}: ${r.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง"}`;
        break;
      }
    }

    // Emergency contacts: same pattern.
    for (let i = 0; i < emergencyContacts.length; i++) {
      const c = emergencyContacts[i];
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

      // Step 1: Create or Update trip
      const tripPayload = {
        scope: tripScope,
        title: title.trim() || "Untitled Trip",
        destination: destination.trim() || "TBD",
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || new Date().toISOString().split("T")[0],
        travelersCount: Number(travelersCount) || 1,
        language,
        coverImageUrl: coverUrl,
        importantNotes: notes.trim() || undefined,
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
      const filteredHotels = hotels.filter((h) => h.name.trim());
      const filteredContacts = emergencyContacts.filter((c) => c.name.trim());

      const [airlinesRes, hotelsRes, contactsRes] = await Promise.all([
        api.put<Array<{ id: string }>>(`/admin/trips/${tripId}/airlines/bulk`, {
          items: segments.map((seg) => ({
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

      // Adopt server-assigned ids back into local state so subsequent
      // saves UPDATE in place instead of re-INSERTing.
      setSegments((prev) => prev.map((seg, i) => ({ ...seg, serverId: airlinesRes[i]?.id ?? seg.serverId })));
      // Map hotel ids back through the filtered list — local state may
      // contain blank rows that were dropped from the payload.
      setHotels((prev) => {
        let savedIdx = 0;
        return prev.map((h) => {
          if (!h.name.trim()) return h;
          const id = hotelsRes[savedIdx++]?.id;
          return id ? { ...h, id } : h;
        });
      });
      setEmergencyContacts((prev) => {
        let savedIdx = 0;
        return prev.map((c) => {
          if (!c.name.trim()) return c;
          const id = contactsRes[savedIdx++]?.id;
          return id ? { ...c, serverId: id } : c;
        });
      });

      // Refresh dirty-tracking baseline so we don't warn on the way out
      // when the user has just saved.
      setSavedSnapshot(JSON.stringify({
        tripScope, title, destination, startDate, endDate, travelersCount,
        language, coverUrl, segments, hotels, emergencyContacts, notes,
      }));

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
      <TripStepperHeader currentStep={tripScope ? 2 : 1} tripId="new" subtitle={tripScope ? "ข้อมูลทริป" : "เลือกประเภททริป"} />

      {tripScope && (
        <FooterActionBar
          backHref="#"
          backLabel="ย้อนกลับ"
          backIcon="arrow_back"
          // Use browser back when no draft yet so we pop the ?step=basics
          // entry we pushed and the scope picker reappears naturally. With
          // a saved draft, the URL is anchored by ?id= so just clear state.
          onBack={() => (draftId ? setTripScope(null) : window.history.back())}
          onSaveDraft={handleSaveDraft}
          savingDraft={savingDraft}
          saveDraftLabel={draftId ? "อัพเดทร่าง" : "บันทึกร่าง"}
          nextLabel={loading ? "กำลังบันทึก..." : "ถัดไป: เพิ่มกิจกรรม"}
          onNext={handleSubmit}
          loading={loading}
          disabled={loading || savingDraft}
        />
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {!tripScope && apiError && (
          <Banner variant="danger" title="เกิดข้อผิดพลาด" onDismiss={() => setApiError(null)} className="mb-6">
            {apiError}
          </Banner>
        )}

        {/* ═══ Step 0: Trip Scope Selector ═══ */}
        {!tripScope && <ScopeSelector onSelect={selectScope} />}

        {/* ═══ Main Form (shows after scope selected) ═══ */}
        {tripScope && (
        <form noValidate className="space-y-12 md:space-y-20" onSubmit={(e) => e.preventDefault()}>
          {/* Scope badge + change */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tripScope === "domestic" ? "bg-green-100 text-green-700" : "bg-(--primary-container) text-(--primary)"}`}>
              <span className="material-symbols-outlined text-sm">{tripScope === "domestic" ? "holiday_village" : "flight_takeoff"}</span>
              {tripScope === "domestic" ? "ทริปในประเทศ" : "ทริปต่างประเทศ"}
            </span>
            <button
              type="button"
              onClick={() => (draftId ? setTripScope(null) : window.history.back())}
              className="text-xs text-(--on-surface-variant) hover:text-(--primary) underline"
            >
              เปลี่ยน
            </button>
          </div>

          {/* ═══ Section 1: Cover Image ═══ */}
          <section className="space-y-6">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-(--on-surface)">ภาพปกทริป</h3>
              <p className="text-(--on-surface-variant) text-sm">เลือกภาพปกเพื่อสร้างบรรยากาศให้ลูกทริป</p>
            </div>
            <ImageUpload
              value={coverUrl}
              onChange={setCoverUrl}
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
                <FormInput label="ชื่อทริป" placeholder="เช่น ทริปเชียงใหม่ 3 วัน 2 คืน" required value={title} onChange={(e) => { setTitle(e.target.value); setFieldErrors((prev) => ({ ...prev, title: "" })); }} error={fieldErrors.title} />
              </div>
              <div className="md:col-span-1 lg:col-span-4">
                <SegmentedControl
                  label="ภาษาหลัก"
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: "th", label: "ไทย" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>
              <div className="md:col-span-1 lg:col-span-6">
                <FormInput label="จุดหมายปลายทาง" placeholder="จังหวัด หรือ ประเทศ" icon="location_on" required value={destination} onChange={(e) => { setDestination(e.target.value); setFieldErrors((prev) => ({ ...prev, destination: "" })); }} error={fieldErrors.destination} />
              </div>
              {(() => {
                const isPublished = tripStatus === "Published" || tripStatus === "Unpublished";
                const isDateLocked = isPublished && dateChangeCount >= maxDateChanges;
                const remaining = maxDateChanges - dateChangeCount;
                const dateHint = isPublished && !isDateLocked ? `เปลี่ยนวันได้อีก ${remaining} ครั้ง` : isDateLocked ? "ล็อค — ใช้สิทธิ์เปลี่ยนวันหมดแล้ว" : "";
                return (
                  <>
                    <div className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}>
                      <DatePicker label={`วันเดินทาง${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required value={startDate} onChange={(v) => { setStartDate(v); setFieldErrors((prev) => ({ ...prev, startDate: "" })); }} error={fieldErrors.startDate} />
                    </div>
                    <div className={`md:col-span-1 lg:col-span-3 relative ${isDateLocked ? "opacity-60 pointer-events-none" : ""}`}>
                      <DatePicker label={`วันกลับ${isDateLocked ? " (ล็อค)" : ""}`} placeholder="เลือกวันที่" required min={startDate} value={endDate} onChange={(v) => { setEndDate(v); setFieldErrors((prev) => ({ ...prev, endDate: "" })); }} error={fieldErrors.endDate} />
                      {dateHint && <p className="text-[10px] text-(--on-surface-variant) mt-1 px-1">{dateHint}</p>}
                    </div>
                  </>
                );
              })()}
              <div className="md:col-span-2 lg:col-span-4">
                <FormInput label="จำนวนผู้เดินทาง" placeholder="จำนวนคน" type="number" icon="group" required value={travelersCount} onChange={(e) => { setTravelersCount(e.target.value); setFieldErrors((prev) => ({ ...prev, travelersCount: "" })); }} error={fieldErrors.travelersCount} />
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
                    onRemove={() => setHotels(hotels.filter((_, j) => j !== i))}
                  />
                ))}
                <DashedAddButton onClick={() => setHotels([...hotels, { ...emptyHotel }])}>
                  เพิ่มที่พัก
                </DashedAddButton>
              </div>
            </div>
          </section>

          {/* ═══ Section 4: Emergency Contacts ═══ */}
          <section className="space-y-6">
            <SectionHeader title="เบอร์ฉุกเฉิน" icon="emergency" variant="icon" subtitle="ข้อมูลสำหรับลูกทริปเมื่อเกิดเหตุฉุกเฉิน และใช้ยื่น ตม." />

            {tripScope === "international" && (
              <Banner variant="warning" icon="tips_and_updates" title="เบอร์ฉุกเฉินจะถูก pre-fill ตามประเทศปลายทาง">
                กรุณาตรวจสอบและแก้ไขให้ถูกต้องตามจุดหมายจริง
              </Banner>
            )}

            <div className="space-y-3">
              {emergencyContacts.map((contact, i) => (
                <EmergencyContactCard
                  key={i}
                  contact={contact}
                  showRemove={emergencyContacts.length > 1}
                  onUpdate={(patch) => updateContact(i, patch)}
                  onRemove={() => setEmergencyContacts(emergencyContacts.filter((_, j) => j !== i))}
                />
              ))}
              <DashedAddButton onClick={() => setEmergencyContacts([...emergencyContacts, { name: "", phone: "", note: "" }])}>
                เพิ่มเบอร์ฉุกเฉิน
              </DashedAddButton>
            </div>
          </section>

          {/* ═══ Section 5: Important Notes ═══ */}
          <section className="space-y-6">
            <SectionHeader title="หมายเหตุสำคัญ" icon="sticky_note_2" variant="icon" subtitle="ข้อมูลที่ลูกทริปต้องรู้ก่อนเดินทาง" />

            <div className="bg-white p-5 md:p-7 rounded-2xl border border-(--outline-variant)/30 shadow-sm space-y-4">
              <FormTextarea
                placeholder={"เช่น\n• เตรียมเสื้อกันหนาว อุณหภูมิ 5-10°C\n• เงินสด ¥30,000 ต่อคน\n• พาสปอร์ตต้องมีอายุเหลือ 6 เดือนขึ้นไป\n• นัดรวมพลที่สนามบิน 3 ชม. ก่อนบิน"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
        )}
      </div>

      {tripScope && DevAutoFill && <DevAutoFill onFill={autoFill} />}
    </div>
  );
}
