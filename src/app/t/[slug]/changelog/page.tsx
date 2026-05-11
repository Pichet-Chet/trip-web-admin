"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchChangelog, type PublicChangelog } from "@/lib/trip-api";
import { ApiError } from "@/lib/client-api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ChangelogPage({ params }: PageProps): React.JSX.Element {
  const { slug } = use(params);
  const [logs, setLogs] = useState<PublicChangelog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChangelog(slug)
      .then(setLogs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "ไม่สามารถโหลดประวัติได้"));
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

  if (!logs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-blue-500">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="natgan-bg min-h-screen text-on-surface pb-24">
      {/* ── Nav ── */}
      <nav className="bg-white border-b border-outline-variant/20 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/t/${slug}`} className="material-symbols-outlined text-on-surface-variant hover:text-brand-blue transition-colors text-xl">arrow_back</Link>
            <span className="font-headline font-bold text-base sm:text-lg">ประวัติการเปลี่ยนแปลง</span>
          </div>
          <span className="rounded-full bg-brand-blue/8 px-3 py-1 text-xs font-bold text-brand-blue">
            {logs.length} อัปเดต
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3 block opacity-40">history</span>
            <p className="text-sm">ยังไม่มีการเปลี่ยนแปลงใดๆ ให้ดู</p>
            <p className="text-xs mt-1">เมื่อไกด์ปรับเปลี่ยนแผนการเดินทาง คุณจะเห็นที่นี่</p>
          </div>
        ) : (
          <div className="relative">
            {logs.map((log, idx) => (
              <ChangelogEntry
                key={log.id}
                log={log}
                version={logs.length - idx}
                isFirst={idx === 0}
                isLast={idx === logs.length - 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ChangelogEntry({ log, version, isFirst, isLast }: {
  log: PublicChangelog;
  version: number;
  isFirst: boolean;
  isLast: boolean;
}): React.JSX.Element {
  const date = new Date(log.createdAt);
  const dateStr = date.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="relative pl-7 pb-8 last:pb-0">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="relative z-10 mt-1 shrink-0 rounded-full h-3 w-3 border-2 border-brand-blue-light bg-white" />
        {!isLast && <div className="w-0.5 flex-1 bg-brand-blue/12 mt-1" />}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold text-on-surface tabular-nums">{dateStr} · {timeStr}</p>
          {isFirst && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">ล่าสุด</span>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-4 border-outline-variant/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue/8 text-xs font-bold text-brand-blue">
              v{version}
            </span>
            <h3 className="text-sm font-bold text-on-surface">{log.summaryText}</h3>
          </div>

          <div className="space-y-2">
            {log.changes.map((change) => {
              const cls = change.type === "add" ? "bg-green-500"
                : change.type === "update" ? "bg-amber-500"
                : "bg-red-500";
              const icon = change.type === "add" ? "add" : change.type === "update" ? "edit" : "remove";
              return (
                <div key={change.id} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${cls}`}>
                    <span className="material-symbols-outlined text-[12px]">{icon}</span>
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{change.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
