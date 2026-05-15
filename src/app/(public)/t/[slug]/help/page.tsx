"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchTripBySlug, fetchFaq } from "@/lib/trip-api";
import type { FaqCategory } from "@/lib/trip-api";
import { ApiError } from "@/lib/api";
import type { TripPlan } from "@/lib/mock-data";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b border-outline-variant/10 last:border-0 transition-colors ${open ? "bg-slate-50/80" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold text-on-surface leading-snug">{q}</span>
        <span
          className={`material-symbols-outlined text-lg text-on-surface-variant/60 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand-blue" : ""}`}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div
          className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: a }}
        />
      )}
    </div>
  );
}

export default function HelpCenterPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripPlan | null>(null);
  const [faqCategories, setFaqCategories] = useState<FaqCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTripBySlug(slug)
      .then(setTrip)
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดข้อมูลได้"));

    fetchFaq()
      .then(setFaqCategories)
      .catch(() => {});
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

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  const company = trip.company;
  const hasPhone = !!company.phone;
  const hasLine  = !!company.lineId;

  return (
    <div className="natgan-bg min-h-screen text-on-surface pb-28">

      {/* ── Top nav ── */}
      <nav className="bg-white/90 glass-blur border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 sm:px-6 h-14 max-w-3xl mx-auto">
          <Link
            href={`/t/${trip.slug}`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="font-headline font-bold text-base flex-1">ศูนย์ช่วยเหลือ</h1>
          <span className="material-symbols-outlined text-brand-blue text-xl">support_agent</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 space-y-5">

        {/* ── Company card ── */}
        <section className="rounded-2xl overflow-hidden shadow-md">
          {/* Header strip */}
          <div className="bg-brand-blue-deep px-5 pt-5 pb-6 relative overflow-hidden">
            {/* decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/5" />

            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3">ผู้จัดทริป</p>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                {company.logoUrl ? (
                  <img className="w-full h-full object-cover" src={company.logoUrl} alt={company.name} />
                ) : (
                  <span className="material-symbols-outlined text-2xl text-white/70">business</span>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-headline font-bold text-lg leading-tight truncate">{company.name}</h2>
                {company.phone && (
                  <p className="text-white/50 text-xs mt-0.5">{company.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white grid grid-cols-2 divide-x divide-outline-variant/15">
            {hasPhone ? (
              <a
                href={`tel:${company.phone}`}
                className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-brand-blue text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </div>
                <span className="text-xs font-bold text-brand-blue">โทรหาไกด์</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-4 opacity-35">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl">call_end</span>
                </div>
                <span className="text-xs font-medium text-slate-400">ไม่มีเบอร์</span>
              </div>
            )}
            {hasLine ? (
              <a
                href={`https://line.me/R/ti/p/${encodeURIComponent(company.lineId!.replace(/^@/, ""))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-line-green/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-line-green text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <span className="text-xs font-bold text-line-green">LINE OA</span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-4 opacity-35">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 text-xl">chat_bubble</span>
                </div>
                <span className="text-xs font-medium text-slate-400">ไม่มี LINE</span>
              </div>
            )}
          </div>
        </section>

        {/* ── Emergency contacts ── */}
        {trip.emergencyContacts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
              </div>
              <h3 className="font-headline font-bold text-sm text-on-surface">เบอร์ติดต่อฉุกเฉิน</h3>
            </div>

            <div className="space-y-2.5">
              {trip.emergencyContacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone}`}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-outline-variant/15 hover:border-brand-blue/30 hover:shadow-md active:scale-[0.98] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    {/^[a-z0-9_]+$/.test(c.icon ?? "") ? (
                      <span className="material-symbols-outlined text-red-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                    ) : (
                      <span className="text-xl">{c.icon ?? "🚨"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{c.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">แตะเพื่อโทร</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-headline font-extrabold text-brand-blue text-base">{c.phone}</span>
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
                      <span className="material-symbols-outlined text-brand-blue text-base" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        {faqCategories.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>quiz</span>
              </div>
              <h3 className="font-headline font-bold text-sm text-on-surface">คำถามที่พบบ่อย</h3>
            </div>

            {faqCategories.map((cat) => (
              <div key={cat.code}>
                {faqCategories.length > 1 && (
                  <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-2 px-1">{cat.labelTh}</p>
                )}
                <div className="bg-white rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
                  {cat.items.map((item) => (
                    <FaqItem key={item.id} q={item.question} a={item.answerHtml} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Support footer ── */}
        <div className="flex items-center justify-center gap-2.5 py-2">
          <span className="material-symbols-outlined text-slate-300 text-lg">help_center</span>
          <p className="text-center text-xs text-on-surface-variant/60">
            มีปัญหาด้านระบบ?{" "}
            <a href="mailto:support@tripapp.co" className="text-brand-blue font-semibold hover:underline">
              support@tripapp.co
            </a>
          </p>
        </div>

      </main>
    </div>
  );
}
