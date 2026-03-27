"use client";

import { useState, use } from "react";
import { getMockDays, getMockTrip } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { TripStepperHeader } from "@/components/layout/trip-stepper";
import { FormInput, FormTextarea, IconButton, IconWrapper, StatsSummary, FooterActionBar, ChangeSummaryModal } from "@/components/shared";
import { mockChangeLogs } from "@/lib/mock-data";
import type { TripDay, TripActivity } from "@/types";

export default function TripEditPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const trip = getMockTrip(id);
  const initialDays = getMockDays(id);

  const [days, setDays] = useState<TripDay[]>(initialDays.length > 0 ? initialDays : [
    { id: "new-day-1", tripId: id, dayNumber: 1, title: "", subtitle: "", coverImageUrl: null, date: null, sortOrder: 0, activities: [] },
  ]);
  const [activeDay, setActiveDay] = useState(0);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const currentDay = days[activeDay];
  const isPublished = trip?.status === "published";

  function addActivity(): void {
    if (!currentDay) return;
    const newAct: TripActivity = {
      id: `new-act-${Date.now()}`, dayId: currentDay.id, time: "", name: "", description: null,
      type: "attraction", placeName: null, lat: null, lng: null, mapsLink: null, imageUrl: null,
      emoji: "📍", sortOrder: currentDay.activities.length,
    };
    const updated = [...days];
    updated[activeDay] = { ...currentDay, activities: [...currentDay.activities, newAct] };
    setDays(updated);
  }

  function removeActivity(actId: string): void {
    if (!currentDay) return;
    const updated = [...days];
    updated[activeDay] = { ...currentDay, activities: currentDay.activities.filter((a) => a.id !== actId) };
    setDays(updated);
  }

  function addDay(): void {
    const newDay: TripDay = {
      id: `new-day-${Date.now()}`, tripId: id, dayNumber: days.length + 1, title: "",
      subtitle: "", coverImageUrl: null, date: null, sortOrder: days.length, activities: [],
    };
    setDays([...days, newDay]);
    setActiveDay(days.length);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TripStepperHeader currentStep={3} tripId={id} subtitle="กิจกรรม" />

      {/* ═══ Content Canvas ═══ */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Day Tabs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1.5 p-1 bg-(--surface-variant)/50 border border-(--outline-variant) rounded-xl overflow-x-auto scrollbar-hide">
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => setActiveDay(i)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap transition-all text-sm ${
                  activeDay === i
                    ? "bg-white text-(--on-surface) shadow-sm border border-(--outline-variant)"
                    : "text-(--on-surface-variant) hover:bg-white/50"
                }`}
              >
                Day {day.dayNumber}
                <span className="text-base">{day.subtitle?.slice(0, 2) || "📅"}</span>
              </button>
            ))}
            <button
              onClick={addDay}
              className="w-9 h-9 flex items-center justify-center text-(--on-surface-variant) hover:bg-white hover:text-(--primary) rounded-lg transition-all border border-transparent hover:border-(--outline-variant)"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
          {currentDay?.date && (
            <span className="text-sm font-semibold text-(--on-surface-variant)">
              {new Date(currentDay.date).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Editor Grid */}
        {currentDay && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Itinerary List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-(--on-surface) tracking-tight">ตารางกิจกรรมประจำวัน</h2>
                <button
                  onClick={addActivity}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  เพิ่มกิจกรรม
                </button>
              </div>

              {/* Activity Cards */}
              <div className="space-y-4">
                {currentDay.activities.length === 0 ? (
                  <div className="bg-white rounded-xl border border-(--outline-variant) p-12 text-center">
                    <span className="material-symbols-outlined text-(--outline) text-4xl mb-2">event_note</span>
                    <p className="text-sm text-(--on-surface-variant) mb-3">ยังไม่มีกิจกรรม</p>
                    <button onClick={addActivity} className="text-sm font-bold text-blue-600 hover:underline">+ เพิ่มกิจกรรมแรก</button>
                  </div>
                ) : (
                  currentDay.activities.map((act) => (
                    <div key={act.id} className="group bg-white rounded-xl border border-(--outline-variant) hover:border-blue-500/40 shadow-sm transition-all p-4 md:p-6">
                      <div className="flex gap-3 md:gap-4 items-start">
                        {/* Drag Handle */}
                        <div className="mt-5 text-(--outline-variant)/30 cursor-grab active:cursor-grabbing hidden md:block">
                          <span className="material-symbols-outlined">drag_indicator</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                              <FormInput label="เวลา" type="time" defaultValue={act.time ?? ""} icon="schedule" />
                            </div>
                            <div className="md:col-span-3">
                              <FormInput label="ชื่อกิจกรรม" defaultValue={act.name} placeholder="ชื่อสถานที่ / กิจกรรม" icon={act.emoji === "📍" ? undefined : undefined} />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <FormInput label="สถานที่ / Google Maps" placeholder="ชื่อสถานที่ หรือ link Google Maps" defaultValue={act.placeName ?? act.mapsLink ?? ""} icon="location_on" />
                            </div>
                            <div className="pt-7">
                              <IconButton icon="image" variant="default" />
                            </div>
                          </div>
                          <FormTextarea label="หมายเหตุถึงลูกทัวร์" rows={2} defaultValue={act.description ?? ""} placeholder="เช่น ใส่กางเกงขาสั้น, เตรียมเสื้อกันหนาว..." />
                        </div>
                        <div className="pt-5">
                          <IconButton icon="delete" variant="danger" onClick={() => removeActivity(act.id)} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Context Panel */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              {/* Day Image */}
              {currentDay.coverImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden aspect-4/3">
                  <img src={currentDay.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-lg font-bold">{currentDay.title || `Day ${currentDay.dayNumber}`}</p>
                    <p className="text-sm text-white/70">{currentDay.activities.length} กิจกรรม</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl aspect-4/3 bg-linear-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center text-center p-6">
                  <span className="material-symbols-outlined text-blue-400 text-5xl mb-3">photo_camera</span>
                  <p className="text-sm text-(--on-surface-variant)">เพิ่มภาพปกสำหรับวันนี้</p>
                </div>
              )}

              {/* ที่พัก Card */}
              {trip && trip.accommodations.length > 0 && (
                <div className="bg-white rounded-xl border border-(--outline-variant) p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <IconWrapper icon="hotel" size="sm" color="bg-blue-100 text-blue-600" />
                    <h4 className="text-sm font-bold text-(--on-surface)">ที่พัก</h4>
                  </div>
                  {trip.accommodations.map((acc, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-semibold text-(--on-surface)">{acc.name}</p>
                      <p className="text-(--on-surface-variant) text-xs">{acc.address}</p>
                      <p className="text-(--on-surface-variant) text-xs">{acc.phone}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary Stats */}
              <div className="bg-white rounded-xl border border-(--outline-variant) p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-widest text-(--on-surface-variant) mb-4">สรุปทริป</h4>
                <StatsSummary stats={[
                  { value: days.length, label: "วัน" },
                  { value: days.reduce((s, d) => s + d.activities.length, 0), label: "กิจกรรม" },
                  { value: trip?.travelersCount ?? 0, label: "Guests" },
                ]} />
              </div>
            </div>
          </div>
        )}
      </div>

      <FooterActionBar
        backHref={ROUTES.tripNew}
        backLabel="กลับหน้าข้อมูลทริป"
        onSaveDraft={isPublished ? () => setShowChangeModal(true) : undefined}
        nextHref={ROUTES.tripPreview(id)}
        nextLabel="ถัดไป: ดูตัวอย่าง"
      />

      {/* Change Summary Modal — shows when saving a published trip */}
      <ChangeSummaryModal
        open={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        tripTitle={trip?.title ?? ""}
        followerCount={trip?.followerCount ?? 0}
        changes={mockChangeLogs[0]?.changes ?? []}
      />
    </div>
  );
}
