"use client";

interface DayLite {
  id: string;
  title: string;
  date: string | null;
  coverImageUrl: string | null;
  activities: { id: string; time: string | null; name: string; description: string | null; emoji: string | null }[];
}

interface MobilePreviewProps {
  title: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  travelersCount: number;
  coverImageUrl: string | null;
  airlineName: string | null;
  accommodationsCount: number;
  countdownDays: number;
  days: DayLite[];
  activeDayIndex: number;
  onActiveDayChange: (i: number) => void;
}

const DAY_GRADIENTS = [
  "from-blue-600 to-indigo-700",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-blue-600",
];

const formatDateTH = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short" });

/**
 * Phone-frame mockup of the public-facing trip page. Pure presentation:
 * receives display data and an active-day callback, owns no business
 * logic. The frame itself is decorative — labelled "ตัวอย่างหน้าตาบนมือถือ"
 * by the caller so users don't mistake it for an actual device.
 */
export function MobilePreview({
  title, startDate, endDate, totalDays, travelersCount, coverImageUrl,
  airlineName, accommodationsCount, countdownDays, days, activeDayIndex, onActiveDayChange,
}: MobilePreviewProps): React.ReactNode {
  const currentDay = days[activeDayIndex] ?? days[0];

  return (
    <div className="relative w-full max-w-[320px] aspect-320/650 bg-slate-900 rounded-[3rem] p-3 border-8 border-slate-800 shadow-2xl overflow-hidden">
      <div className="w-full h-full bg-white rounded-4xl overflow-hidden flex flex-col relative">
        {/* iOS-style status bar — purely decorative */}
        <div className="h-8 w-full flex justify-between items-center px-6 pt-2">
          <span className="text-[10px] font-bold text-(--on-surface)">9:41</span>
          <div className="flex gap-1 text-(--on-surface)">
            <span className="material-symbols-outlined text-[10px]">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-[10px]">wifi</span>
            <span className="material-symbols-outlined text-[10px]">battery_full</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* Hero */}
          <div className="relative h-52 w-full overflow-hidden">
            {coverImageUrl ? (
              <img className="w-full h-full object-cover" src={coverImageUrl} alt="" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-400 to-indigo-600" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              {countdownDays > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[8px] font-bold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  อีก {countdownDays} วัน
                </div>
              )}
              <h3 className="text-base font-extrabold leading-tight">{title}</h3>
              <p className="text-[9px] text-white/80 mt-0.5">
                {formatDateTH(startDate)} — {formatDateTH(endDate)} · {totalDays} วัน
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90">👥 {travelersCount}</span>
                {airlineName && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90">✈️ {airlineName}</span>
                )}
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[7px] text-white/90">🏨 {accommodationsCount}</span>
              </div>
              <button className="mt-2.5 w-full py-1.5 rounded-full bg-linear-to-r from-(--primary) to-blue-500 text-[9px] font-bold text-white flex items-center justify-center gap-1 shadow-lg">
                ⭐ ติดตามทริปนี้
              </button>
            </div>
          </div>

          {/* Day Nav */}
          <div className="sticky top-0 z-10 bg-white border-b border-(--outline-variant)/20 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {days.map((day, i) => (
              <button
                key={day.id}
                onClick={() => onActiveDayChange(i)}
                className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-bold whitespace-nowrap transition-all ${
                  activeDayIndex === i ? "bg-(--primary) text-white" : "bg-(--surface-variant)/50 text-(--on-surface-variant)"
                }`}
              >
                D{i + 1}
              </button>
            ))}
          </div>

          {/* Day Content */}
          {currentDay && (
            <div className="px-3 py-4 space-y-4">
              <div className="rounded-xl overflow-hidden border border-(--outline-variant)/20 shadow-sm bg-white">
                <div className={`relative h-16 bg-linear-to-r ${DAY_GRADIENTS[activeDayIndex % DAY_GRADIENTS.length]} p-3 flex flex-col justify-end`}>
                  {currentDay.coverImageUrl && <img className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" src={currentDay.coverImageUrl} alt="" />}
                  <div className="relative flex items-center gap-2 text-white">
                    <div>
                      <p className="text-[8px] font-medium text-white/70">
                        {currentDay.date && formatDateTH(currentDay.date)}
                      </p>
                      <h4 className="text-[11px] font-extrabold leading-tight">{currentDay.title || `Day ${activeDayIndex + 1}`}</h4>
                    </div>
                    <span className="ml-auto bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[7px] font-bold text-white">
                      {currentDay.activities.length} กิจกรรม
                    </span>
                  </div>
                </div>
                <div className="p-2.5 space-y-2">
                  {currentDay.activities.length === 0 ? (
                    <p className="text-center text-[9px] text-(--on-surface-variant) py-4">ยังไม่มีกิจกรรม</p>
                  ) : (
                    currentDay.activities.map((act, actIdx) => (
                      <div key={act.id} className="flex gap-2 items-start">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-2 h-2 rounded-full bg-(--primary) mt-1" />
                          {actIdx < currentDay.activities.length - 1 && <div className="w-px flex-1 bg-(--outline-variant)/30" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{act.emoji || "📍"}</span>
                            {act.time && <span className="text-[8px] font-bold text-(--primary) bg-(--primary-container) px-1 py-0.5 rounded">{act.time}</span>}
                          </div>
                          <p className="text-[10px] font-bold text-(--on-surface) leading-tight mt-0.5">{act.name}</p>
                          {act.description && <p className="text-[8px] text-(--on-surface-variant) line-clamp-1">{act.description}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-6 px-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-(--primary-container) flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-(--primary) text-sm">business</span>
            </div>
            <p className="text-[8px] text-(--on-surface-variant)">Powered by Trip Platform</p>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="h-14 border-t border-(--outline-variant)/20 bg-white flex justify-around items-center px-4 shrink-0">
          <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="material-symbols-outlined text-(--outline-variant)">calendar_month</span>
          <span className="material-symbols-outlined text-(--outline-variant)">map</span>
          <span className="material-symbols-outlined text-(--outline-variant)">chat</span>
        </div>
      </div>
    </div>
  );
}
