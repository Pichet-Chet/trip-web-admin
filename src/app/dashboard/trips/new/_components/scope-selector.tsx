"use client";

export type TripScopeLocal = "domestic" | "international" | null;

interface ScopeSelectorProps {
  onSelect: (scope: "domestic" | "international") => void;
}

/**
 * Step 0 of the trip wizard — picks domestic vs international before any
 * fields render. The choice drives default segment type, language, and
 * pre-filled emergency contacts in the parent page.
 */
export function ScopeSelector({ onSelect }: ScopeSelectorProps): React.ReactNode {
  return (
    <section className="min-h-[70vh] flex flex-col justify-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) tracking-tight mb-10 text-center">
        ทริปนี้เดินทางไปที่ไหน?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
        <ScopeCard
          tone="emerald"
          title="ในประเทศ"
          subtitle="ทริปภายในประเทศไทย"
          patternId="domestic-dots"
          dotPosition="70% 30%"
          onClick={() => onSelect("domestic")}
        />
        <ScopeCard
          tone="blue"
          title="ต่างประเทศ"
          subtitle="รวมข้อมูลเที่ยวบินและตรวจคนเข้าเมือง"
          patternId="intl-dots"
          dotPosition="30% 30%"
          onClick={() => onSelect("international")}
        />
      </div>
    </section>
  );
}

interface ScopeCardProps {
  tone: "emerald" | "blue";
  title: string;
  subtitle: string;
  patternId: string;
  dotPosition: string;
  onClick: () => void;
}

function ScopeCard({ tone, title, subtitle, patternId, dotPosition, onClick }: ScopeCardProps): React.ReactNode {
  const gradient = tone === "emerald"
    ? "from-emerald-500 via-emerald-700 to-teal-800"
    : "from-blue-500 via-blue-700 to-indigo-900";
  const overlayFrom = tone === "emerald" ? "from-emerald-900/70" : "from-blue-900/70";
  const ctaText = tone === "emerald"
    ? "text-emerald-800 group-hover:bg-emerald-50"
    : "text-(--primary) group-hover:bg-(--primary-container)/40";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-4xl aspect-4/3 md:aspect-3/4 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--primary)"
    >
      <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at ${dotPosition}, rgba(255,255,255,0.4) 0%, transparent 50%)` }} />
      <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <pattern id={patternId} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className={`absolute inset-0 bg-linear-to-t ${overlayFrom} via-transparent to-transparent`} />
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-left">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{title}</h3>
        <p className="text-white/70 text-sm leading-relaxed">{subtitle}</p>
        <div className={`mt-4 w-fit bg-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors shadow-lg ${ctaText}`}>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          เลือก
        </div>
      </div>
    </button>
  );
}
