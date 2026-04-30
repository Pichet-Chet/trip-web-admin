"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, SectionHeader, DashedAddButton, FooterActionBar, IconButton, ImageUpload, DatePicker, TimePicker } from "@/components/shared";
import dynamic from "next/dynamic";

// DevAutoFill is dev-only — dynamic import + NODE_ENV gate keeps it
// out of the production bundle (process.env.NODE_ENV is statically
// replaced at build time, so this branch becomes dead code in prod).
const DevAutoFill = process.env.NODE_ENV === "development"
  ? dynamic(() => import("@/components/shared/dev-auto-fill").then((m) => ({ default: m.DevAutoFill })), { ssr: false })
  : null;
import { useToast } from "@/components/shared/toast";
import type { Accommodation, TripPlan } from "@/types";

type TransportType = "flight" | "van" | "bus" | "train" | "boat" | "car";

type TransportSegment = {
  id: string;
  type: TransportType;
  direction: "outbound" | "return";
  from: string;
  fromDetail: string; // terminal, สถานี, ท่าเรือ
  to: string;
  toDetail: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  // Flight-specific
  airline: string;
  flightNumber: string;
  bookingRef: string;
  baggage: string;
  // General
  operator: string; // ชื่อบริษัทรถตู้, สายการบิน, etc.
  vehicleInfo: string; // ทะเบียนรถ, ชื่อเรือ, etc.
  meetingPoint: string;
  note: string;
};

const transportOptions: { value: TransportType; label: string; icon: string }[] = [
  { value: "flight", label: "เครื่องบิน", icon: "flight" },
  { value: "van", label: "รถตู้", icon: "airport_shuttle" },
  { value: "bus", label: "รถบัส", icon: "directions_bus" },
  { value: "train", label: "รถไฟ", icon: "train" },
  { value: "boat", label: "เรือ", icon: "directions_boat" },
  { value: "car", label: "รถยนต์", icon: "directions_car" },
];

function makeSegment(direction: "outbound" | "return", type: TransportType = "flight"): TransportSegment {
  return {
    id: `seg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, direction, from: "", fromDetail: "", to: "", toDetail: "",
    departureDate: "", departureTime: "", arrivalDate: "", arrivalTime: "",
    airline: "", flightNumber: "", bookingRef: "", baggage: "",
    operator: "", vehicleInfo: "", meetingPoint: "", note: "",
  };
}

const emptyHotel: Accommodation = { name: "", address: "", phone: "", checkIn: "", checkOut: "", nights: 1 };

function TransportSection({ label, icon, segments, onAdd, onRemove, onUpdate }: {
  label: string; icon: string;
  segments: TransportSegment[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TransportSegment>) => void;
}): React.ReactNode {
  const isFlight = (t: TransportType): boolean => t === "flight";
  const fromLabel = (t: TransportType): string =>
    isFlight(t) ? "สนามบิน" : t === "train" ? "สถานี" : t === "boat" ? "ท่าเรือ" : "จุดขึ้นรถ";
  const toLabel = (t: TransportType): string =>
    isFlight(t) ? "สนามบิน" : t === "train" ? "สถานี" : t === "boat" ? "ท่าเรือ" : "จุดลงรถ";

  return (
    <div className="bg-white p-5 md:p-7 rounded-3xl border border-(--outline-variant)/30 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-(--primary)">{icon}</span>
        <h4 className="text-sm font-bold text-(--on-surface)">{label}</h4>
      </div>

      {segments.map((seg) => (
        <div key={seg.id} className="space-y-4 py-4 border-t border-(--outline-variant)/20 first:border-0 first:pt-0">
          {/* Transport type selector + remove */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1 p-0.5 bg-(--surface-container-low) rounded-xl overflow-x-auto scrollbar-hide">
              {transportOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate(seg.id, { type: opt.value })}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    seg.type === opt.value
                      ? "bg-white shadow-sm text-(--primary)"
                      : "text-(--on-surface-variant) hover:text-(--on-surface)"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
            {segments.length > 1 && (
              <IconButton icon="close" variant="danger" size="sm" onClick={() => onRemove(seg.id)} />
            )}
          </div>

          {/* Route: FROM → TO */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FormInput label={`${fromLabel(seg.type)}ต้นทาง`} placeholder={isFlight(seg.type) ? "BKK" : "กรุงเทพ"} value={seg.from} onChange={(e) => onUpdate(seg.id, { from: e.target.value })} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" value={seg.fromDetail} onChange={(e) => onUpdate(seg.id, { fromDetail: e.target.value })} /></div>}
            </div>
            <div className="pt-6 text-(--outline) shrink-0">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            <div className="flex-1">
              <FormInput label={`${toLabel(seg.type)}ปลายทาง`} placeholder={isFlight(seg.type) ? "NRT" : "เชียงใหม่"} value={seg.to} onChange={(e) => onUpdate(seg.id, { to: e.target.value })} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" value={seg.toDetail} onChange={(e) => onUpdate(seg.id, { toDetail: e.target.value })} /></div>}
            </div>
          </div>

          {/* Operator info — different per type */}
          {isFlight(seg.type) ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="สายการบิน" placeholder="Xiamen Air" icon="flight" value={seg.airline} onChange={(e) => onUpdate(seg.id, { airline: e.target.value })} />
                <FormInput label="เที่ยวบิน" placeholder="MF834" icon="confirmation_number" value={seg.flightNumber} onChange={(e) => onUpdate(seg.id, { flightNumber: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="รหัสจอง (PNR)" placeholder="ABC123" icon="bookmark" value={seg.bookingRef} onChange={(e) => onUpdate(seg.id, { bookingRef: e.target.value })} />
                <FormInput label="น้ำหนักกระเป๋า" placeholder="โหลด 20kg, ถือ 7kg" icon="luggage" value={seg.baggage} onChange={(e) => onUpdate(seg.id, { baggage: e.target.value })} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormInput label={seg.type === "train" ? "ขบวนรถไฟ" : seg.type === "boat" ? "ชื่อเรือ/บริษัท" : "บริษัท/ผู้ให้บริการ"} placeholder={seg.type === "van" ? "เช่น ABC Transport" : seg.type === "train" ? "เช่น ขบวน 9" : ""} icon={transportOptions.find((o) => o.value === seg.type)?.icon ?? "info"} value={seg.operator} onChange={(e) => onUpdate(seg.id, { operator: e.target.value })} />
              <FormInput label={seg.type === "car" ? "ทะเบียนรถ" : "รหัสจอง/หมายเลข"} placeholder={seg.type === "car" ? "เช่น กก 1234" : "ถ้ามี"} icon="tag" value={seg.vehicleInfo} onChange={(e) => onUpdate(seg.id, { vehicleInfo: e.target.value })} />
            </div>
          )}

          {/* Departure datetime */}
          <div>
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">ออกเดินทาง</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DatePicker placeholder="วันที่" value={seg.departureDate} onChange={(v) => onUpdate(seg.id, { departureDate: v })} />
              </div>
              <div className="relative">
                <TimePicker placeholder="เวลา" value={seg.departureTime} onChange={(v) => onUpdate(seg.id, { departureTime: v })} />
              </div>
            </div>
          </div>

          {/* Arrival datetime */}
          <div>
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">ถึงปลายทาง</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DatePicker placeholder="วันที่" value={seg.arrivalDate} onChange={(v) => onUpdate(seg.id, { arrivalDate: v })} />
              </div>
              <div className="relative">
                <TimePicker placeholder="เวลา" value={seg.arrivalTime} onChange={(v) => onUpdate(seg.id, { arrivalTime: v })} />
              </div>
            </div>
          </div>

          {/* Meeting point + Note */}
          <FormInput label="จุดนัดพบ" placeholder={isFlight(seg.type) ? "เจอกันที่ประตู 3 เวลา 15:00" : seg.type === "van" ? "เจอกันหน้าบริษัท เวลา 05:00" : "จุดนัดพบ"} icon="groups" value={seg.meetingPoint} onChange={(e) => onUpdate(seg.id, { meetingPoint: e.target.value })} />
          <FormInput label="หมายเหตุ" placeholder={isFlight(seg.type) ? "เช่น Transit ต้องเอากระเป๋าออก" : "เช่น แวะพักระหว่างทาง"} icon="info" value={seg.note} onChange={(e) => onUpdate(seg.id, { note: e.target.value })} />
        </div>
      ))}

      <DashedAddButton onClick={onAdd}>เพิ่มช่วงการเดินทาง</DashedAddButton>
    </div>
  );
}

type TripScopeLocal = "domestic" | "international" | null;

type FieldErrors = Record<string, string>;

export default function NewTripPage(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // ─── Draft state ───
  const [draftId, setDraftId] = useState<string | null>(searchParams.get("id"));
  const [savingDraft, setSavingDraft] = useState(false);

  // ─── Trip scope ───
  const [tripScope, setTripScope] = useState<TripScopeLocal>(null);

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
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string; note: string }[]>([]);

  // ─── Notes ───
  const [notes, setNotes] = useState("");

  // ─── UI state ───
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ─── Load draft ───
  useEffect(() => {
    if (!draftId) return;
    (async () => {
      try {
        const trip = await api.get<any>(`/admin/trips/${draftId}`);
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

        // Load airlines/transport
        const airlines = await api.get<any[]>(`/admin/trips/${draftId}/airlines`);
        if (airlines.length > 0) {
          setSegments(airlines.map((a: any) => ({
            ...makeSegment(a.type === "return" ? "return" : "outbound", a.transportType || "flight"),
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
        const accoms = await api.get<any[]>(`/admin/trips/${draftId}/accommodations`);
        if (accoms.length > 0) {
          setHotels(accoms.map((h: any) => ({
            name: h.name || "", address: h.address || "", phone: h.phone || "",
            checkIn: h.checkIn || "", checkOut: h.checkOut || "", nights: h.nights || 1,
          })));
        }

        // Load emergency contacts
        const contacts = await api.get<any[]>(`/admin/trips/${draftId}/emergency-contacts`);
        if (contacts.length > 0) {
          setEmergencyContacts(contacts.map((c: any) => ({
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

    if (!title.trim()) errors.title = "กรุณากรอกชื่อทริป";
    if (!destination.trim()) errors.destination = "กรุณากรอกจุดหมายปลายทาง";
    if (!startDate) errors.startDate = "กรุณาเลือกวันเดินทาง";
    if (!endDate) errors.endDate = "กรุณาเลือกวันกลับ";
    if (startDate && endDate && endDate < startDate) errors.endDate = "วันกลับต้องไม่ก่อนวันเดินทาง";
    if (!travelersCount || Number(travelersCount) < 1) errors.travelersCount = "กรุณากรอกจำนวนผู้เดินทาง";

    setFieldErrors(errors);
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
        // เปลี่ยน URL ให้มี id (ไม่ reload)
        window.history.replaceState(null, "", `/dashboard/trips/new?id=${tripId}`);
      }

      // Step 2: ลบ children เดิม แล้วสร้างใหม่ (simple approach สำหรับ draft)
      if (draftId) {
        // ลบ airlines เดิม
        const oldAirlines = await api.get<any[]>(`/admin/trips/${tripId}/airlines`);
        for (const a of oldAirlines) await api.delete(`/admin/trips/${tripId}/airlines/${a.id}`);
        // ลบ accommodations เดิม
        const oldAccoms = await api.get<any[]>(`/admin/trips/${tripId}/accommodations`);
        for (const a of oldAccoms) await api.delete(`/admin/trips/${tripId}/accommodations/${a.id}`);
        // ลบ emergency contacts เดิม
        const oldContacts = await api.get<any[]>(`/admin/trips/${tripId}/emergency-contacts`);
        for (const c of oldContacts) await api.delete(`/admin/trips/${tripId}/emergency-contacts/${c.id}`);
      }

      // Step 3: Add airline/transport segments
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        await api.post(`/admin/trips/${tripId}/airlines`, {
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
          sortOrder: i,
        });
      }

      // Step 4: Add accommodations
      for (let i = 0; i < hotels.length; i++) {
        const hotel = hotels[i];
        if (hotel.name.trim()) {
          await api.post(`/admin/trips/${tripId}/accommodations`, {
            name: hotel.name.trim(),
            address: hotel.address,
            phone: hotel.phone,
            checkIn: hotel.checkIn,
            checkOut: hotel.checkOut,
            nights: hotel.nights,
            sortOrder: i,
          });
        }
      }

      // Step 5: Add emergency contacts
      for (let i = 0; i < emergencyContacts.length; i++) {
        const contact = emergencyContacts[i];
        if (contact.name.trim()) {
          await api.post(`/admin/trips/${tripId}/emergency-contacts`, {
            name: contact.name.trim(),
            phone: contact.phone,
            icon: "emergency",
            sortOrder: i,
          });
        }
      }

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
          onBack={() => setTripScope(null)}
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
        {/* ═══ Step 0: Trip Scope Selector ═══ */}
        {!tripScope && (
          <section className="min-h-[70vh] flex flex-col justify-center">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-(--primary)/10 text-(--primary) text-[10px] font-black uppercase tracking-widest mb-6">เริ่มต้นสร้างทริป</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) tracking-tight mb-3">ทริปนี้เดินทางไปที่ไหน?</h2>
              <p className="text-(--on-surface-variant) text-base">เลือกประเภทเพื่อให้ระบบแสดงฟอร์มที่เหมาะกับทริปของคุณ</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
              {/* ── ในประเทศ ── */}
              <button
                type="button"
                onClick={() => selectScope("domestic")}
                className="group relative overflow-hidden rounded-4xl aspect-4/3 md:aspect-3/4 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500 via-emerald-700 to-teal-800" />
                <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)" }} />
                <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <pattern id="domestic-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#domestic-dots)" />
                </svg>
                <div className="absolute inset-0 bg-linear-to-t from-emerald-900/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-left">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🚐 รถตู้</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🚌 รถบัส</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🚆 รถไฟ</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">⛴️ เรือ</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">ในประเทศ</h3>
                  <p className="text-white/70 text-sm leading-relaxed">ทริปภายในประเทศไทย — เชียงใหม่, กระบี่, ภูเก็ต, เกาะต่างๆ</p>
                  <div className="mt-4 w-fit bg-white text-emerald-800 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 group-hover:bg-emerald-50 transition-colors shadow-lg">
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    เลือก
                  </div>
                </div>
              </button>

              {/* ── ต่างประเทศ ── */}
              <button
                type="button"
                onClick={() => selectScope("international")}
                className="group relative overflow-hidden rounded-4xl aspect-4/3 md:aspect-3/4 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-blue-700 to-indigo-900" />
                <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)" }} />
                <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <pattern id="intl-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#intl-dots)" />
                </svg>
                <div className="absolute inset-0 bg-linear-to-t from-blue-900/70 via-transparent to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-left">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">✈️ เครื่องบิน</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🛂 Immigration</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🧳 PNR</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🌏 Multi-lang</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">ต่างประเทศ</h3>
                  <p className="text-white/70 text-sm leading-relaxed">ทริปต่างประเทศ — ญี่ปุ่น, เกาหลี, ยุโรป พร้อมข้อมูลเที่ยวบิน & ตม.</p>
                  <div className="mt-4 w-fit bg-white text-(--primary) px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 group-hover:bg-(--primary-container)/40 transition-colors shadow-lg">
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    เลือก
                  </div>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* ═══ Main Form (shows after scope selected) ═══ */}
        {tripScope && (
        <form noValidate className="space-y-12 md:space-y-20" onSubmit={(e) => e.preventDefault()}>
          {/* Scope badge + change */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tripScope === "domestic" ? "bg-green-100 text-green-700" : "bg-(--primary-container) text-(--primary)"}`}>
              <span className="material-symbols-outlined text-sm">{tripScope === "domestic" ? "holiday_village" : "flight_takeoff"}</span>
              {tripScope === "domestic" ? "ทริปในประเทศ" : "ทริปต่างประเทศ"}
            </span>
            <button type="button" onClick={() => setTripScope(null)} className="text-xs text-(--on-surface-variant) hover:text-(--primary) underline">เปลี่ยน</button>
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
              <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-2">
                <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">ภาษาหลัก</label>
                <div className="flex bg-(--surface-container-low) rounded-xl p-1 h-14">
                  {[{ v: "th", l: "ไทย" }, { v: "en", l: "English" }].map((lang) => (
                    <button key={lang.v} type="button" onClick={() => setLanguage(lang.v)} className={`flex-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${language === lang.v ? "bg-white shadow-sm text-(--primary)" : "text-(--on-surface-variant) hover:text-(--on-surface)"}`}>
                      {lang.l}
                    </button>
                  ))}
                </div>
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
                  <div key={i} className="bg-white p-5 md:p-7 rounded-3xl border border-(--outline-variant)/30 shadow-sm space-y-5 relative">
                    {hotels.length > 1 && (
                      <div className="absolute top-4 right-4">
                        <IconButton icon="close" variant="danger" size="sm" onClick={() => setHotels(hotels.filter((_, j) => j !== i))} />
                      </div>
                    )}
                    {/* Hotel badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-(--on-surface-variant) bg-(--surface-container-low) px-2.5 py-1 rounded-full">ที่พัก {i + 1}</span>
                    </div>
                    <FormInput label="ชื่อที่พัก" placeholder="e.g., The QUBE Hotel Chiba" value={hotel.name} onChange={(e) => updateHotel(i, { name: e.target.value })} />
                    <FormInput label="ที่อยู่" placeholder="1-2-3 Chiba, Japan" icon="location_on" value={hotel.address} onChange={(e) => updateHotel(i, { address: e.target.value })} />
                    <FormInput label="เบอร์โทร" placeholder="+81-43-XXX-XXXX" type="tel" icon="call" value={hotel.phone} onChange={(e) => updateHotel(i, { phone: e.target.value })} />

                    {/* Check-in: วันที่ + เวลา */}
                    <div>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คอิน</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <DatePicker placeholder="วันที่เข้า" min={startDate} max={endDate} value={hotel.checkIn?.split("T")[0] || ""} onChange={(v) => updateHotel(i, { checkIn: v })} />
                        </div>
                        <div className="relative">
                          <TimePicker placeholder="เวลา" value={hotel.checkIn?.includes("T") ? hotel.checkIn.split("T")[1] : ""} onChange={(v) => { const dateVal = hotel.checkIn?.split("T")[0] || ""; updateHotel(i, { checkIn: dateVal ? `${dateVal}T${v}` : v }); }} />
                        </div>
                      </div>
                    </div>

                    {/* Check-out: วันที่ + เวลา */}
                    <div>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คเอาท์</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <DatePicker placeholder="วันที่ออก" min={hotel.checkIn?.split("T")[0] || startDate} max={endDate} value={hotel.checkOut?.split("T")[0] || ""} onChange={(v) => updateHotel(i, { checkOut: v })} />
                        </div>
                        <div className="relative">
                          <TimePicker placeholder="เวลา" value={hotel.checkOut?.includes("T") ? hotel.checkOut.split("T")[1] : ""} onChange={(v) => { const dateVal = hotel.checkOut?.split("T")[0] || ""; updateHotel(i, { checkOut: dateVal ? `${dateVal}T${v}` : v }); }} />
                        </div>
                      </div>
                    </div>

                    {/* Auto-calculated nights hint */}
                    <div className="flex items-center gap-2 px-1 text-xs text-(--on-surface-variant)">
                      <span className="material-symbols-outlined text-sm">info</span>
                      <span>จำนวนคืนจะคำนวณอัตโนมัติจากวันเช็คอิน — เช็คเอาท์</span>
                    </div>
                  </div>
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
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">tips_and_updates</span>
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">เบอร์ฉุกเฉินจะถูก pre-fill ตามประเทศปลายทาง</p>
                  <p className="text-xs text-amber-600 mt-0.5">กรุณาตรวจสอบและแก้ไขให้ถูกต้องตามจุดหมายจริง</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {emergencyContacts.map((contact, i) => (
                <div key={i} className="bg-white p-4 md:p-5 rounded-2xl border border-(--outline-variant)/30 shadow-sm">
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                      <span className="material-symbols-outlined">emergency</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormInput label="ชื่อ / หน่วยงาน" placeholder="เช่น สถานทูตไทย โตเกียว" value={contact.name} onChange={(e) => updateContact(i, { name: e.target.value })} />
                      <FormInput label="เบอร์โทร" placeholder="เช่น +81-3-2207-9100" type="tel" icon="call" value={contact.phone} onChange={(e) => updateContact(i, { phone: e.target.value })} />
                    </div>
                    {emergencyContacts.length > 1 && (
                      <IconButton icon="close" variant="danger" size="sm" onClick={() => setEmergencyContacts(emergencyContacts.filter((_, j) => j !== i))} />
                    )}
                  </div>
                  {contact.note && (
                    <p className="text-[11px] text-amber-600 mt-2 ml-13 pl-0.5">{contact.note}</p>
                  )}
                </div>
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
              <textarea
                className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none resize-none min-h-32"
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

          {/* ═══ API Error Alert ═══ */}
          {apiError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <span className="material-symbols-outlined text-red-600 text-lg mt-0.5">error</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">เกิดข้อผิดพลาด</p>
                <p className="text-sm text-red-600 mt-0.5">{apiError}</p>
              </div>
              <button type="button" onClick={() => setApiError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          )}
        </form>
        )}
      </div>

      {tripScope && DevAutoFill && <DevAutoFill onFill={autoFill} />}
    </div>
  );
}
