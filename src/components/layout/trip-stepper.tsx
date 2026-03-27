"use client";

import Link from "next/link";

const steps = [
  { num: 1, label: "ประเภททริป", href: () => "/dashboard/trips/new" },
  { num: 2, label: "ข้อมูลทริป", href: (id: string) => id === "new" ? "/dashboard/trips/new" : `/dashboard/trips/new?scope=edit&id=${id}` },
  { num: 3, label: "กิจกรรม", href: (id: string) => `/dashboard/trips/${id}/edit` },
  { num: 4, label: "ดูตัวอย่าง", href: (id: string) => `/dashboard/trips/${id}/preview` },
] as const;

interface TripStepperHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
  tripId: string;
  subtitle?: string;
}

export function TripStepperHeader({ currentStep, tripId, subtitle }: TripStepperHeaderProps): React.ReactNode {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl px-4 md:px-8 lg:px-12 h-20 flex items-center justify-between border-b border-(--outline-variant)/30">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg md:text-xl font-bold text-(--on-surface) tracking-tight whitespace-nowrap">สร้างทริป</h2>
        {subtitle && (
          <>
            <span className="hidden sm:block h-4 w-px bg-(--outline-variant) opacity-30" />
            <span className="hidden sm:block text-(--primary) font-semibold text-sm truncate">{subtitle}</span>
          </>
        )}
      </div>

      {/* Right: Stepper */}
      <div className="flex items-center gap-2 md:gap-4">
        {steps.map((step, i) => {
          const isActive = step.num === currentStep;
          const isCompleted = step.num < currentStep;
          const isFuture = step.num > currentStep;
          const href = step.href(tripId);

          return (
            <div key={step.num} className="flex items-center gap-2 md:gap-4">
              <Link
                href={href}
                className={`flex items-center gap-1.5 ${isFuture ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div
                  className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${
                    isActive
                      ? "bg-(--primary) text-(--on-primary) shadow-lg shadow-(--primary)/20"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-(--surface-container-high) text-(--on-surface)"
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`hidden lg:block text-[11px] font-bold tracking-wide ${
                    isActive ? "text-(--primary)" : isCompleted ? "text-green-600" : "text-(--on-surface)"
                  }`}
                >
                  {step.label}
                </span>
              </Link>

              {i < steps.length - 1 && (
                <div className={`w-4 md:w-8 h-px ${isCompleted ? "bg-green-400" : "bg-(--outline-variant) opacity-30"}`} />
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}
