"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchTripBySlug } from "@/lib/trip-api";
import { ApiError } from "@/lib/api";
import type { TripPlan } from "@/lib/mock-data";
import { formatDateRange, getTripDuration } from "@/lib/utils";
import { getUiStrings, getLangLocale } from "@/lib/i18n-trip";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5100/api";

const LANG_STORAGE_KEY = (slug: string) => `trip_lang_${slug}`;

function formatDateTime(raw: string, locale: string): string {
  if (!raw) return "-";
  try {
    return new Date(raw).toLocaleString(locale, {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function downloadPdf(slug: string, lang: string): Promise<void> {
  const res = await fetch(`${API_URL}/client/t/${slug}/imm/pdf?lang=${lang}`);
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `immigration-${slug}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImmigrationViewPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [activeLang, setActiveLang] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY(slug)) : null;
    fetchTripBySlug(slug)
      .then((data) => {
        const primaryLang = data.language ?? "th";
        const allLangs = [primaryLang, ...(data.supportedLanguages ?? []).filter((l) => l !== primaryLang)];
        const resolvedLang = stored && allLangs.includes(stored) ? stored : primaryLang;
        if (resolvedLang !== primaryLang) {
          return fetchTripBySlug(slug, resolvedLang).then((translated) => {
            setTrip(translated);
            setActiveLang(resolvedLang);
          });
        }
        setTrip(data);
        setActiveLang(primaryLang);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดทริปได้"));
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">error</span>
          <p className="text-slate-500 text-sm">{error}</p>
          <Link href="/" className="inline-block mt-6 text-blue-600 font-semibold text-sm hover:underline">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  if (!trip || !activeLang) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  const t = getUiStrings(activeLang);
  const locale = getLangLocale(activeLang);
  const duration = getTripDuration(trip.startDate, trip.endDate);

  return (
    <div className="bg-[#f4f6f9] text-[#111] antialiased min-h-screen pb-8 print:bg-white print:pb-0">

      {/* ── Print: hidden back button ── */}
      <div className="print:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
        <Link href={`/t/${trip.slug}`} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          {t.immBackToTrip}
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setPdfLoading(true); downloadPdf(trip.slug, activeLang).finally(() => setPdfLoading(false)); }}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1e3a5f] px-4 py-1.5 rounded-full hover:bg-[#162d4a] transition-colors disabled:opacity-60"
          >
            {pdfLoading
              ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-base">picture_as_pdf</span>}
            {t.immSavePdf}
          </button>
        </div>
      </div>

      {/* ── Document wrapper ── */}
      <div className="max-w-[780px] mx-auto my-6 sm:my-10 bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:my-0">

        {/* ── Official Header ── */}
        <header className="bg-[#1e3a5f] text-white px-8 py-7 print:bg-[#1e3a5f]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {trip.company.logoUrl && (
                <img src={trip.company.logoUrl} alt={trip.company.name} className="w-12 h-12 rounded-xl bg-white object-cover shrink-0 ring-2 ring-white/30" />
              )}
              <div>
                <p className="text-white/60 text-sm font-bold uppercase tracking-[0.15em] mb-0.5">{trip.company.name}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{t.immTitle}</h1>
                <p className="text-white/50 text-sm mt-0.5">{t.immSubtitle}</p>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 text-sm font-bold px-3 py-1 rounded-full border border-green-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {t.immConfirmed}
              </span>
              <span className="text-white/30 text-xs">REF: {trip.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 space-y-6">

          {/* ── 1. Trip Overview ── */}
          <section>
            <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <div className="p-4 sm:p-5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">{t.immTourOperator}</p>
                <p className="text-base font-bold text-slate-800">{trip.company.name}</p>
                {trip.company.tatLicense && (
                  <p className="text-sm text-slate-400 mt-0.5">TAT: {trip.company.tatLicense}</p>
                )}
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">{t.immDates}</p>
                <p className="text-base font-bold text-slate-800">{formatDateRange(trip.startDate, trip.endDate, locale)}</p>
                <p className="text-sm text-slate-400 mt-0.5">{duration} {t.immDaysTotal}</p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">{t.immDestination}</p>
                <p className="text-base font-bold text-slate-800">{trip.destination}</p>
                <p className="text-sm text-slate-400 mt-0.5">{trip.travelersCount} {t.travelers}</p>
              </div>
            </div>
          </section>

          {/* ── 2. Flight Information ── */}
          {trip.airlineInfo.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                <span className="material-symbols-outlined text-lg text-[#1e3a5f]">flight</span>
                {t.immFlight}
              </h2>
              <div className="space-y-3">
                {trip.airlineInfo.map((flight, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        flight.type === "departure"
                          ? "bg-blue-100 text-blue-700"
                          : flight.type === "return"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {flight.type === "departure" ? t.immDeparture : t.immReturn}
                      </span>
                      <span className="text-sm text-slate-500 font-medium">{flight.airline}</span>
                      {flight.flightNumber && (
                        <span className="text-sm font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded">{flight.flightNumber}</span>
                      )}
                    </div>
                    <div className="px-5 py-5 flex items-center gap-4">
                      <div className="text-center w-28">
                        {flight.departureAirport.length <= 4 ? (
                          <p className="text-3xl font-black text-[#1e3a5f] tracking-tight uppercase">{flight.departureAirport}</p>
                        ) : (
                          <p className="text-base font-bold text-[#1e3a5f] leading-tight">{flight.departureAirport}</p>
                        )}
                        <p className="text-sm text-slate-400 mt-1 font-medium">{flight.departureTime}</p>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-px bg-slate-200" />
                        <span className="material-symbols-outlined text-slate-300 text-2xl">flight</span>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                      <div className="text-center w-28">
                        {flight.arrivalAirport.length <= 4 ? (
                          <p className="text-3xl font-black text-[#1e3a5f] tracking-tight uppercase">{flight.arrivalAirport}</p>
                        ) : (
                          <p className="text-base font-bold text-[#1e3a5f] leading-tight">{flight.arrivalAirport}</p>
                        )}
                        <p className="text-sm text-slate-400 mt-1 font-medium">{flight.arrivalTime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 3. Accommodation ── */}
          {trip.accommodations.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
                <span className="material-symbols-outlined text-lg text-[#1e3a5f]">hotel</span>
                {t.immAccommodation}
              </h2>
              <div className="space-y-2">
                {trip.accommodations.map((acc, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-base text-slate-800">{acc.name}</p>
                        {acc.address && <p className="text-sm text-slate-400 mt-0.5">{acc.address}</p>}
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#1e3a5f] bg-blue-50 px-3 py-1 rounded-full">{acc.nights} {t.nights}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-sm text-slate-500">
                      <div>
                        <span className="text-slate-400 font-medium">Check-in: </span>
                        <span className="font-semibold text-slate-700">{formatDateTime(acc.checkIn, locale)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Check-out: </span>
                        <span className="font-semibold text-slate-700">{formatDateTime(acc.checkOut, locale)}</span>
                      </div>
                      {acc.phone && (
                        <div className="col-span-2">
                          <span className="text-slate-400 font-medium">{t.immTel}: </span>
                          <span className="font-semibold text-slate-700">{acc.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 4. Daily Schedule ── */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">
              <span className="material-symbols-outlined text-lg text-[#1e3a5f]">calendar_today</span>
              {t.immDailySchedule}
            </h2>
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {trip.days.map((day) => {
                const dateStr = new Date(day.date).toLocaleDateString(locale, {
                  weekday: "short", day: "numeric", month: "short",
                });
                return (
                  <div key={day.id} className="flex gap-4 px-5 py-5">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center text-sm font-black mt-0.5">
                      {day.dayNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-800">
                        {dateStr}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {day.title}
                      </p>
                      {day.activities.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {day.activities.map((a) => (
                            <li key={a.id} className="flex items-baseline gap-2 text-sm text-slate-500">
                              <span className="shrink-0 font-bold text-slate-400 tabular-nums w-12">{a.time ?? ""}</span>
                              <span>{a.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 5. Issuer ── */}
          <section className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            {trip.company.logoUrl && (
              <img src={trip.company.logoUrl} alt={trip.company.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-base text-slate-800">{trip.company.name}</p>
              {trip.company.phone && <p className="text-sm text-slate-500">{t.immTel}: {trip.company.phone}</p>}
              {trip.company.tatLicense && <p className="text-sm text-slate-400">TAT License: {trip.company.tatLicense}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Issued by</p>
              <p className="text-sm font-bold text-[#1e3a5f]">{trip.company.name}</p>
            </div>
          </section>

          {/* ── PDF Button ── */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => { setPdfLoading(true); downloadPdf(trip.slug, activeLang).finally(() => setPdfLoading(false)); }}
              disabled={pdfLoading}
              className="flex items-center gap-2 bg-[#1e3a5f] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-lg hover:bg-[#162d4a] hover:shadow-xl active:scale-95 transition-all disabled:opacity-60"
            >
              {pdfLoading
                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined">picture_as_pdf</span>}
              {t.immSavePdf}
            </button>
          </div>

          {/* ── Footer ── */}
          <footer className="text-center text-slate-300 text-sm pt-4 pb-6 space-y-1">
            <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} {trip.company.name}</p>
            <p>REF: {trip.id.slice(0, 8).toUpperCase()} · {new Date().toLocaleDateString(locale)}</p>
          </footer>

        </div>
      </div>

    </div>
  );
}
