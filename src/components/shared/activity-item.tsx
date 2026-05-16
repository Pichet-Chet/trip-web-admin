"use client";

import { cn, detectMapProvider, getMapButtonLabel, getActivityTypeStyle } from "@/lib/trip-utils";

import type { Activity } from "@/lib/types/trip";
import { useState, useCallback, useEffect } from "react";

type ActivityItemProps = {
  activity: Activity;
};

function ActivityGallery({ images, name }: { images: string[]; name: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = (i: number) => setLightboxIndex(i);
  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() =>
    setLightboxIndex(i => (i != null ? (i - 1 + images.length) % images.length : null)), [images.length]);
  const next = useCallback(() =>
    setLightboxIndex(i => (i != null ? (i + 1) % images.length : null)), [images.length]);

  useEffect(() => {
    if (lightboxIndex == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, close, prev, next]);

  if (images.length === 0) return null;

  const thumbnails = images.slice(0, 6);
  const overflow = images.length - 6;

  return (
    <>
      {/* Thumbnail strip */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {thumbnails.map((url, i) => (
          <button
            key={url}
            onClick={() => open(i)}
            className="relative shrink-0 overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`ดูรูปที่ ${i + 1}`}
          >
            <img
              src={url}
              alt={`${name} รูปที่ ${i + 1}`}
              className="h-20 w-20 object-cover transition-transform duration-300 hover:scale-105 sm:h-24 sm:w-24"
            />
            {i === 5 && overflow > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-sm font-bold text-white">+{overflow}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={close}
        >
          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Close */}
          <button
            onClick={close}
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="ปิด"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:left-6"
              aria-label="ก่อนหน้า"
            >
              <span className="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt={`${name} รูปที่ ${lightboxIndex + 1}`}
            className="max-h-[85dvh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:right-6"
              aria-label="ถัดไป"
            >
              <span className="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
          )}

          {/* Dot indicators */}
          {images.length > 1 && images.length <= 10 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === lightboxIndex ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  )}
                  aria-label={`รูปที่ ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function ActivityItem({ activity }: ActivityItemProps): React.JSX.Element {
  const typeStyle = getActivityTypeStyle(activity.type);

  // Prefer imageUrls array; fall back to single imageUrl if array is empty
  const galleryImages = activity.imageUrls?.length
    ? activity.imageUrls
    : activity.imageUrl
      ? [activity.imageUrl]
      : [];

  const hasGallery = galleryImages.length > 0;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-white p-4 transition-all",
        activity.isNew && "border-success/50 bg-success/5",
        activity.isChanged && "border-warning/50 bg-warning-light/30",
        (activity.isNew || activity.isChanged) && "activity-highlight",
      )}
    >
      <div className="flex gap-3">
        {/* Time badge */}
        <div className="flex shrink-0 flex-col items-center">
          <span className="text-2xl">{activity.emoji}</span>
          <span className={cn("mt-1 rounded-md px-2 py-0.5 text-xs font-bold", typeStyle.bg, typeStyle.text)}>
            {activity.time}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-foreground">{activity.name}</h4>
            <div className="flex shrink-0 gap-1">
              {activity.isNew && (
                <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">
                  NEW
                </span>
              )}
              {activity.isChanged && (
                <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-white">
                  แก้ไข
                </span>
              )}
            </div>
          </div>
          {activity.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activity.description}
            </p>
          )}
          {activity.mapsLink && (
            <a
              href={activity.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-xs">location_on</span>
              {getMapButtonLabel(detectMapProvider(activity.mapsLink))}
            </a>
          )}
        </div>

        {/* Single image thumbnail (only when no gallery, desktop) */}
        {!hasGallery && activity.imageUrl && (
          <div className="hidden shrink-0 sm:block">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
          </div>
        )}
      </div>

      {/* Gallery strip */}
      {hasGallery && <ActivityGallery images={galleryImages} name={activity.name} />}
    </div>
  );
}
