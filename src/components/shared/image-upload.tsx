"use client";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  aspect?: "square" | "video" | "wide";
  presets?: { label: string; url: string }[];
}

const aspectClass = {
  square: "aspect-square w-32 md:w-40",
  video: "aspect-video w-full",
  wide: "aspect-video lg:aspect-21/9 w-full",
};

export function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
  presets,
}: ImageUploadProps): React.ReactNode {
  const isSquare = aspect === "square";

  return (
    <div className={isSquare ? "flex flex-col items-center gap-4" : "space-y-4"}>
      {/* Upload Area */}
      <div className={isSquare ? "" : "grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        <div
          className={`${isSquare ? "" : "lg:col-span-8"} group relative overflow-hidden rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer ${aspectClass[aspect]}`}
        >
          {value ? (
            <>
              <img src={value} alt={label ?? "Upload"} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="bg-white/90 text-slate-900 px-4 py-2 rounded-full text-sm font-bold"
                >
                  เปลี่ยนรูป
                </button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-2 z-10 p-4">
              <span className="material-symbols-outlined text-3xl text-slate-300">add_photo_alternate</span>
              {label && <p className="text-sm font-semibold text-slate-700">{label}</p>}
              {hint && <p className="text-xs text-slate-400">{hint}</p>}
            </div>
          )}
          {/* Edit badge — only square + has image */}
          {isSquare && value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-blue-600 text-white p-2 md:p-2.5 rounded-full shadow-lg border-4 border-white hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xs md:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>edit</span>
            </button>
          )}
        </div>

        {/* Presets (only for non-square) */}
        {presets && !isSquare && (
          <div className="lg:col-span-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">ภาพสำเร็จรูป</p>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange(p.url)}
                  className="group/preset relative h-24 rounded-xl overflow-hidden shadow-sm hover:ring-2 ring-blue-600 ring-offset-2 transition-all"
                >
                  <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover/preset:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{p.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
