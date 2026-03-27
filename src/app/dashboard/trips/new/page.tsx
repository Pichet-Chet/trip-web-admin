"use client";

import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, SectionHeader, DashedAddButton, FooterActionBar, IconButton, ImageUpload } from "@/components/shared";
import type { Accommodation } from "@/types";

const presetCovers = [
  { label: "Japan", url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800" },
  { label: "Sea", url: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800" },
  { label: "Mountain", url: "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800" },
  { label: "City", url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800" },
];

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

      {segments.map((seg, i) => (
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
              <FormInput label={`${fromLabel(seg.type)}ต้นทาง`} placeholder={isFlight(seg.type) ? "BKK" : "กรุงเทพ"} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" /></div>}
            </div>
            <div className="pt-6 text-(--outline) shrink-0">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            <div className="flex-1">
              <FormInput label={`${toLabel(seg.type)}ปลายทาง`} placeholder={isFlight(seg.type) ? "NRT" : "เชียงใหม่"} />
              {isFlight(seg.type) && <div className="mt-2"><FormInput placeholder="Terminal (ถ้ามี)" /></div>}
            </div>
          </div>

          {/* Operator info — different per type */}
          {isFlight(seg.type) ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="สายการบิน" placeholder="Xiamen Air" icon="flight" />
                <FormInput label="เที่ยวบิน" placeholder="MF834" icon="confirmation_number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="รหัสจอง (PNR)" placeholder="ABC123" icon="bookmark" />
                <FormInput label="น้ำหนักกระเป๋า" placeholder="โหลด 20kg, ถือ 7kg" icon="luggage" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormInput label={seg.type === "train" ? "ขบวนรถไฟ" : seg.type === "boat" ? "ชื่อเรือ/บริษัท" : "บริษัท/ผู้ให้บริการ"} placeholder={seg.type === "van" ? "เช่น ABC Transport" : seg.type === "train" ? "เช่น ขบวน 9" : ""} icon={transportOptions.find((o) => o.value === seg.type)?.icon ?? "info"} />
              <FormInput label={seg.type === "car" ? "ทะเบียนรถ" : "รหัสจอง/หมายเลข"} placeholder={seg.type === "car" ? "เช่น กก 1234" : "ถ้ามี"} icon="tag" />
            </div>
          )}

          {/* Departure datetime */}
          <div>
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">ออกเดินทาง</p>
            <div className="grid grid-cols-2 gap-3">
              <FormInput placeholder="วันที่" type="date" icon="calendar_today" />
              <FormInput placeholder="เวลา" icon="schedule" />
            </div>
          </div>

          {/* Arrival datetime */}
          <div>
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">ถึงปลายทาง</p>
            <div className="grid grid-cols-2 gap-3">
              <FormInput placeholder="วันที่" type="date" icon="calendar_today" />
              <FormInput placeholder="เวลา" icon="schedule" />
            </div>
          </div>

          {/* Meeting point + Note */}
          <FormInput label="จุดนัดพบ" placeholder={isFlight(seg.type) ? "เจอกันที่ประตู 3 เวลา 15:00" : seg.type === "van" ? "เจอกันหน้าบริษัท เวลา 05:00" : "จุดนัดพบ"} icon="groups" />
          <FormInput label="หมายเหตุ" placeholder={isFlight(seg.type) ? "เช่น Transit ต้องเอากระเป๋าออก" : "เช่น แวะพักระหว่างทาง"} icon="info" />
        </div>
      ))}

      <DashedAddButton onClick={onAdd}>เพิ่มช่วงการเดินทาง</DashedAddButton>
    </div>
  );
}

type TripScope = "domestic" | "international" | null;

export default function NewTripPage(): React.ReactNode {
  const [tripScope, setTripScope] = useState<TripScope>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("th");
  const [segments, setSegments] = useState<TransportSegment[]>([]);
  const [hotels, setHotels] = useState<Accommodation[]>([{ ...emptyHotel }]);
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string; note: string }[]>([]);
  const [notes, setNotes] = useState("");

  function selectScope(scope: TripScope): void {
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

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={tripScope ? 2 : 1} tripId="new" subtitle={tripScope ? "ข้อมูลทริป" : "เลือกประเภททริป"} />

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
                <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-linear-to-t from-emerald-900/90 via-emerald-900/40 to-transparent" />
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
                <img src="https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800&q=80" alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-linear-to-t from-blue-900/90 via-blue-900/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-left">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">✈️ เครื่องบิน</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🛂 Immigration</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🧳 PNR</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">🌏 Multi-lang</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">ต่างประเทศ</h3>
                  <p className="text-white/70 text-sm leading-relaxed">ทริปต่างประเทศ — ญี่ปุ่น, เกาหลี, ยุโรป พร้อมข้อมูลเที่ยวบิน & ตม.</p>
                  <div className="mt-4 w-fit bg-white text-blue-800 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 group-hover:bg-blue-50 transition-colors shadow-lg">
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
        <form className="space-y-12 md:space-y-20">
          {/* Scope badge + change */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tripScope === "domestic" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
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
              aspect="wide"
              label="อัปโหลดหรือลากรูปภาพปกมาวาง"
              hint="แนะนำ: 1920x800px ขึ้นไป"
              presets={presetCovers.map((p) => ({ label: p.label, url: p.url }))}
            />
          </section>

          {/* ═══ Section 2: ข้อมูลทริป ═══ */}
          <section className="space-y-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-(--on-surface)">ข้อมูลทริป</h3>
              <p className="text-(--on-surface-variant) text-sm">กรอกข้อมูลพื้นฐานของทริป</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-6 md:gap-y-10 bg-white p-6 md:p-10 rounded-3xl border border-(--outline-variant)/30 shadow-sm">
              <div className="md:col-span-2 lg:col-span-8">
                <FormInput label="ชื่อทริป" placeholder="เช่น ทริปเชียงใหม่ 3 วัน 2 คืน" />
              </div>
              {tripScope === "international" && (
                <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-2">
                  <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">ภาษาของทริป</label>
                  <div className="flex bg-(--surface-container-low) rounded-xl p-1 h-14">
                    {[{ v: "th", l: "ไทย" }, { v: "en", l: "English" }, { v: "ja", l: "日本語" }].map((lang) => (
                      <button key={lang.v} type="button" onClick={() => setLanguage(lang.v)} className={`flex-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${language === lang.v ? "bg-white shadow-sm text-(--primary)" : "text-(--on-surface-variant) hover:text-(--on-surface)"}`}>
                        {lang.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-1 lg:col-span-4">
                <FormInput label="จุดหมายปลายทาง" placeholder="จังหวัด หรือ ประเทศ" icon="location_on" />
              </div>
              <div className="md:col-span-1 lg:col-span-4">
                <FormInput label="วันเดินทาง" placeholder="เลือกวันที่" type="date" icon="calendar_today" />
              </div>
              <div className="md:col-span-1 lg:col-span-4">
                <FormInput label="จำนวนผู้เดินทาง" placeholder="จำนวนคน" type="number" icon="group" />
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
                    <FormInput label="ชื่อที่พัก" placeholder="e.g., The QUBE Hotel Chiba" />
                    <FormInput label="ที่อยู่" placeholder="1-2-3 Chiba, Japan" icon="location_on" />
                    <FormInput label="เบอร์โทร" placeholder="+81-43-XXX-XXXX" type="tel" icon="call" />

                    {/* Check-in: วันที่ + เวลา */}
                    <div>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คอิน</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput placeholder="วันที่เข้า" type="date" icon="calendar_today" />
                        <FormInput placeholder="เวลา" type="time" icon="schedule" defaultValue={hotel.checkIn} />
                      </div>
                    </div>

                    {/* Check-out: วันที่ + เวลา */}
                    <div>
                      <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest px-1 mb-2">เช็คเอาท์</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput placeholder="วันที่ออก" type="date" icon="calendar_today" />
                        <FormInput placeholder="เวลา" type="time" icon="schedule" defaultValue={hotel.checkOut} />
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
                      <FormInput label="ชื่อ / หน่วยงาน" placeholder="เช่น สถานทูตไทย โตเกียว" defaultValue={contact.name} />
                      <FormInput label="เบอร์โทร" placeholder="เช่น +81-3-2207-9100" type="tel" icon="call" defaultValue={contact.phone} />
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
        </form>
        )}
      </div>

      {tripScope && (
        <FooterActionBar
          backHref={ROUTES.dashboard}
          backLabel="ยกเลิก"
          backIcon="delete_sweep"
          nextHref={ROUTES.tripEdit("trip-001")}
          nextLabel="ถัดไป: เพิ่มกิจกรรม"
        />
      )}
    </div>
  );
}
