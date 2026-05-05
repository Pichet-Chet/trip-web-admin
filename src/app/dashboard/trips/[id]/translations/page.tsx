"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useLanguages } from "@/lib/hooks/use-languages";
import { useToast } from "@/components/shared/toast";
import { ROUTES } from "@/constants/routes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranslationItem {
  id?: string;
  field: string;
  targetId?: string | null;
  value: string;
  source: "manual" | "auto";
}

interface TripData {
  title: string;
  destination: string;
  importantNotes?: string | null;
  language: string;
  days: {
    id: string;
    dayNumber: number;
    title: string;
    subtitle?: string | null;
    activities: {
      id: string;
      name: string;
      description?: string | null;
      placeName?: string | null;
      emoji?: string | null;
    }[];
  }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TranslationsPage(): React.ReactNode {
  const { id: tripId } = useParams<{ id: string }>();
  usePageTitle("คำแปล");
  const { toast } = useToast();
  const { languages } = useLanguages();

  const [tripData, setTripData] = useState<TripData | null>(null);
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [activeLang, setActiveLang] = useState<string>("");
  const [translations, setTranslations] = useState<Record<string, TranslationItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [dirty, setDirty] = useState(false);

  const makeKey = (field: string, targetId?: string | null) =>
    `${field}::${targetId ?? ""}`;

  // Load trip data + supported languages
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    Promise.all([
      api.get<TripData>(`/admin/trips/${tripId}`),
      api.get<{ languageCodes: string[] }>(`/admin/trips/${tripId}/translations/supported`),
    ])
      .then(([trip, suppResp]) => {
        setTripData(trip);
        const langs = suppResp.languageCodes ?? [];
        setSupportedLangs(langs);
        if (langs.length > 0) setActiveLang(langs[0]);
      })
      .catch(() => toast("ไม่สามารถโหลดข้อมูลได้", "error"))
      .finally(() => setLoading(false));
  }, [tripId]);

  // Reload translations when active language changes
  useEffect(() => {
    if (!tripId || !activeLang) return;
    api
      .get<{ languageCode: string; items: TranslationItem[] }[]>(
        `/admin/trips/${tripId}/translations?lang=${activeLang}`
      )
      .then((groups) => {
        const group = groups.find((g) => g.languageCode === activeLang);
        const map: Record<string, TranslationItem> = {};
        (group?.items ?? []).forEach((item) => {
          map[makeKey(item.field, item.targetId)] = item;
        });
        setTranslations(map);
        setDirty(false);
      })
      .catch(() => toast("ไม่สามารถโหลดคำแปลได้", "error"));
  }, [tripId, activeLang]);

  const getValue = (field: string, targetId?: string | null): string =>
    translations[makeKey(field, targetId)]?.value ?? "";

  const getSource = (field: string, targetId?: string | null): "manual" | "auto" | undefined =>
    translations[makeKey(field, targetId)]?.source;

  const setValue = (field: string, targetId: string | null | undefined, value: string) => {
    const key = makeKey(field, targetId);
    setTranslations((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { field, targetId }), value, source: "manual" },
    }));
    setDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (!tripId || !activeLang || !dirty) return;
    setSaving(true);
    try {
      const items = Object.values(translations).map((item) => ({
        field: item.field,
        targetId: item.targetId ?? null,
        value: item.value,
        source: item.source ?? "manual",
      }));
      await api.put(`/admin/trips/${tripId}/translations`, { languageCode: activeLang, items });
      setDirty(false);
      toast("บันทึกคำแปลเรียบร้อย", "success");
    } catch {
      toast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setSaving(false);
    }
  }, [tripId, activeLang, translations, dirty]);

  const handleAutoTranslate = useCallback(async (forceRefresh = false) => {
    if (!tripId || !activeLang) return;
    setAutoTranslating(true);
    try {
      const resp = await api.post<{
        translatedCount: number;
        skippedCount: number;
        items: TranslationItem[];
      }>(`/admin/trips/${tripId}/translations/auto`, {
        targetLanguage: activeLang,
        forceRefresh,
      });
      const map: Record<string, TranslationItem> = {};
      (resp.items ?? []).forEach((item) => {
        map[makeKey(item.field, item.targetId)] = item;
      });
      setTranslations(map);
      setDirty(false);
      toast(
        `แปลอัตโนมัติเสร็จ: ${resp.translatedCount} ช่อง, ข้าม ${resp.skippedCount} ช่อง`,
        "success"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "แปลอัตโนมัติไม่สำเร็จ";
      toast(msg, "error");
    } finally {
      setAutoTranslating(false);
    }
  }, [tripId, activeLang]);

  const langMeta = (code: string) => languages.find((l) => l.code === code);

  // ─── Sub-component: field row ────────────────────────────────────────

  function FieldRow({
    label,
    original,
    field,
    targetId,
    multiline = false,
  }: {
    label: string;
    original: string;
    field: string;
    targetId?: string | null;
    multiline?: boolean;
  }) {
    const val = getValue(field, targetId);
    const src = getSource(field, targetId);
    const inputClass =
      "w-full px-3 py-2 rounded-xl border border-(--outline-variant)/40 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary)/30 bg-white";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-b border-(--outline-variant)/20 last:border-0">
        {/* Original */}
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-(--on-surface-variant) uppercase tracking-widest">{label}</p>
          {multiline ? (
            <div className="text-sm text-(--on-surface-variant) bg-(--surface-container-low) rounded-xl px-3 py-2 whitespace-pre-wrap min-h-[4rem]">
              {original || <span className="opacity-40 italic">ไม่มีข้อมูล</span>}
            </div>
          ) : (
            <p className="text-sm text-(--on-surface) font-medium px-1">
              {original || <span className="text-(--on-surface-variant) italic opacity-60">ไม่มีข้อมูล</span>}
            </p>
          )}
        </div>

        {/* Translation */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-(--primary) uppercase tracking-widest flex-1">
              {langMeta(activeLang)?.flag} {langMeta(activeLang)?.nameNative ?? activeLang.toUpperCase()}
            </p>
            {src && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  src === "auto"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {src === "auto" ? "แปลอัตโนมัติ" : "แก้ด้วยตนเอง"}
              </span>
            )}
          </div>
          {multiline ? (
            <textarea
              className={inputClass}
              rows={4}
              placeholder="พิมพ์คำแปล..."
              value={val}
              onChange={(e) => setValue(field, targetId, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className={inputClass}
              placeholder="พิมพ์คำแปล..."
              value={val}
              onChange={(e) => setValue(field, targetId, e.target.value)}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── Loading / empty states ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-(--on-surface-variant)">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        กำลังโหลด...
      </div>
    );
  }

  if (!tripData) return null;

  if (supportedLangs.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <span className="material-symbols-outlined text-5xl text-(--on-surface-variant)">translate</span>
        <h2 className="text-xl font-bold text-(--on-surface)">ยังไม่ได้เปิดภาษาเพิ่มเติม</h2>
        <p className="text-(--on-surface-variant)">ไปที่หน้าแก้ไขทริป เพื่อเลือกภาษาที่ต้องการรองรับ</p>
        <Link
          href={`/dashboard/trips/new?id=${tripId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-(--primary) text-(--on-primary) text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          ไปหน้าแก้ไข
        </Link>
      </div>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.tripManage(tripId)}
            className="p-2 rounded-xl hover:bg-(--surface-variant) transition-colors"
          >
            <span className="material-symbols-outlined text-(--on-surface-variant)">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-(--on-surface)">คำแปลทริป</h1>
            <p className="text-sm text-(--on-surface-variant)">{tripData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-translate dropdown */}
          <div className="relative group">
            <button
              type="button"
              disabled={autoTranslating || !activeLang}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-(--outline-variant)/40 bg-white text-(--on-surface) text-sm font-semibold hover:bg-(--surface-container-low) disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                {autoTranslating ? "hourglass_empty" : "auto_fix_high"}
              </span>
              {autoTranslating ? "กำลังแปล..." : "แปลอัตโนมัติ"}
              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 bg-white border border-(--outline-variant)/30 rounded-2xl shadow-lg py-1 min-w-[180px] z-10 hidden group-hover:block group-focus-within:block">
              <button
                type="button"
                onClick={() => handleAutoTranslate(false)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-container-low) flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-(--primary)">auto_fix_high</span>
                แปลเฉพาะช่องที่ยังไม่มี
              </button>
              <button
                type="button"
                onClick={() => handleAutoTranslate(true)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-container-low) flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base text-amber-600">refresh</span>
                แปลใหม่ทั้งหมด
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-(--primary) text-(--on-primary) text-sm font-semibold disabled:opacity-40 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">{saving ? "hourglass_empty" : "save"}</span>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-2 mb-6 border-b border-(--outline-variant)/30 pb-1 overflow-x-auto">
        {supportedLangs.map((code) => {
          const meta = langMeta(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => { if (code !== activeLang) { setActiveLang(code); setDirty(false); } }}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-xl whitespace-nowrap transition-colors ${
                code === activeLang
                  ? "bg-white border border-b-white border-(--outline-variant)/30 -mb-px text-(--primary)"
                  : "text-(--on-surface-variant) hover:text-(--on-surface)"
              }`}
            >
              {meta?.flag && <span>{meta.flag}</span>}
              {meta?.nameNative ?? code.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 text-xs text-(--on-surface-variant)">
        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">แปลอัตโนมัติ</span>
        <span>= ผลจาก AI (แก้ไขได้)</span>
        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold ml-2">แก้ด้วยตนเอง</span>
        <span>= บันทึกโดย operator</span>
      </div>

      {/* Trip-level fields */}
      <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-(--primary) text-base">info</span>
          ข้อมูลหลักข��งทริป
        </h2>
        <FieldRow label="ชื่อทริป" original={tripData.title} field="title" />
        <FieldRow label="จุดหมาย" original={tripData.destination} field="destination" />
        {tripData.importantNotes && (
          <FieldRow label="หมายเหตุสำคัญ" original={tripData.importantNotes} field="importantNotes" multiline />
        )}
      </section>

      {/* Per-day / per-activity fields */}
      {tripData.days.map((day) => (
        <section key={day.id} className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm p-6 mb-4">
          <h2 className="font-bold text-(--on-surface) mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-(--primary) text-base">calendar_today</span>
            วันที่ {day.dayNumber} ��� {day.title}
          </h2>
          <FieldRow label="ชื่อวัน" original={day.title} field="day.title" targetId={day.id} />
          {day.subtitle && (
            <FieldRow label="คำอธิบายวัน" original={day.subtitle} field="day.subtitle" targetId={day.id} />
          )}

          {day.activities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-(--outline-variant)/20 space-y-4">
              {day.activities.map((act) => (
                <div key={act.id} className="bg-(--surface-container-low) rounded-2xl p-4">
                  <p className="text-sm font-semibold text-(--on-surface) mb-2">
                    {act.emoji && <span className="mr-1">{act.emoji}</span>}
                    {act.name}
                  </p>
                  <FieldRow label="ชื่อกิจกรรม" original={act.name} field="activity.name" targetId={act.id} />
                  {act.description && (
                    <FieldRow label="รายละเอียด" original={act.description} field="activity.description" targetId={act.id} multiline />
                  )}
                  {act.placeName && (
                    <FieldRow label="ชื่อสถานที่" original={act.placeName} field="activity.placeName" targetId={act.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Floating save */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-(--primary) text-(--on-primary) text-sm font-bold shadow-lg disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{saving ? "hourglass_empty" : "save"}</span>
            {saving ? "กำลังบันทึก..." : "บันทึกคำแปล"}
          </button>
        </div>
      )}
    </div>
  );
}
