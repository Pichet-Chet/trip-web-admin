"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";
import { useLanguages } from "@/lib/hooks/use-languages";
import {
  useToast,
  PageSkeleton,
  EmptyState,
  PageHeader,
  FilterTabs,
  SectionHeader,
  FormInput,
  FormTextarea,
  Badge,
  ConfirmDialog,
} from "@/components/shared";
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

// ─── FieldRow ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  original: string;
  multiline?: boolean;
  value: string;
  source?: "manual" | "auto";
  langLabel: string;
  onChange: (value: string) => void;
}

function FieldRow({ label, original, multiline, value, source, langLabel, onChange }: FieldRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-b border-(--outline-variant)/20 last:border-0">
      {/* Original */}
      <div className="space-y-1">
        <p className="text-[11px] font-bold text-(--on-surface-variant) uppercase tracking-widest">{label}</p>
        {multiline ? (
          <div className="text-sm text-(--on-surface-variant) bg-(--surface-container-low) rounded-xl px-3 py-2 whitespace-pre-wrap min-h-16">
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
          <p className="text-[11px] font-bold text-(--primary) uppercase tracking-widest flex-1">{langLabel}</p>
          {source && (
            <Badge variant={source === "auto" ? "warning" : "success"}>
              {source === "auto" ? "แปลอัตโนมัติ" : "แก้ด้วยตนเอง"}
            </Badge>
          )}
        </div>
        {multiline ? (
          <FormTextarea
            rows={4}
            placeholder="พิมพ์คำแปล..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <FormInput
            type="text"
            placeholder="พิมพ์คำแปล..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TranslationsPage(): React.ReactNode {
  const { id: tripId } = useParams<{ id: string }>();
  usePageTitle("คำแปล");
  const { toast } = useToast();
  const { languages } = useLanguages();

  const [tripData, setTripData] = useState<TripData | null>(null);
  const [supportedLangs, setSupportedLangs] = useState<string[]>([]);
  const [activeLang, setActiveLang] = useState<string>("");
  const [pendingLang, setPendingLang] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, TranslationItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [autoMenuOpen, setAutoMenuOpen] = useState(false);

  const makeKey = (field: string, targetId?: string | null) => `${field}::${targetId ?? ""}`;

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
      .catch(() => toast.error("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, [tripId]);

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
      .catch(() => toast.error("ไม่สามารถโหลดคำแปลได้"));
  }, [tripId, activeLang]);

  const getValue = (field: string, targetId?: string | null) =>
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
      toast.success("บันทึกคำแปลเรียบร้อย");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }, [tripId, activeLang, translations, dirty]);

  const handleAutoTranslate = useCallback(async (forceRefresh = false) => {
    if (!tripId || !activeLang) return;
    setAutoMenuOpen(false);
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
      toast.success(`แปลอัตโนมัติเสร็จ: ${resp.translatedCount} ช่อง, ข้าม ${resp.skippedCount} ช่อง`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "แปลอัตโนมัติไม่สำเร็จ");
    } finally {
      setAutoTranslating(false);
    }
  }, [tripId, activeLang]);

  const langMeta = (code: string) => languages.find((l) => l.code === code);

  const langLabel = (code: string) => {
    const meta = langMeta(code);
    return `${meta?.flag ?? ""} ${meta?.nameNative ?? code.toUpperCase()}`.trim();
  };

  const handleTabChange = (code: string) => {
    if (code === activeLang) return;
    if (dirty) {
      setPendingLang(code);
    } else {
      setActiveLang(code);
    }
  };

  const confirmTabSwitch = () => {
    if (!pendingLang) return;
    setActiveLang(pendingLang);
    setPendingLang(null);
    setDirty(false);
  };

  // ─── States ───────────────────────────────────────────────────────────

  if (loading) return <PageSkeleton />;

  if (!tripData) return null;

  if (supportedLangs.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <EmptyState
          icon="translate"
          title="ยังไม่ได้เปิดภาษาเพิ่มเติม"
          description="ไปที่หน้าแก้ไขทริป เพื่อเลือกภาษาที่ต้องการรองรับ"
          actionLabel="ไปหน้าแก้ไข"
          actionHref={ROUTES.tripEdit(tripId)}
          actionIcon="edit"
        />
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────

  const autoTranslateMenu = (
    <div className="relative">
      <button
        type="button"
        disabled={autoTranslating || !activeLang}
        onClick={() => setAutoMenuOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-(--outline-variant)/40 bg-white text-(--on-surface) text-sm font-semibold hover:bg-(--surface-container-low) disabled:opacity-40 transition-colors"
      >
        <span className="material-symbols-outlined text-base">
          {autoTranslating ? "hourglass_empty" : "auto_fix_high"}
        </span>
        {autoTranslating ? "กำลังแปล..." : "แปลอัตโนมัติ"}
        <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
      </button>
      {autoMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAutoMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-(--outline-variant)/30 rounded-2xl shadow-lg py-1 min-w-50 z-20">
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
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-24">
      <PageHeader
        title="คำแปลทริป"
        description={tripData.title}
        breadcrumbs={[
          { label: "จัดการทริป", href: ROUTES.tripManage(tripId) },
          { label: "คำแปล" },
        ]}
        actions={autoTranslateMenu}
      />

      {/* Language tabs */}
      <FilterTabs
        tabs={supportedLangs.map((code) => ({ id: code, label: langLabel(code) }))}
        activeTab={activeLang}
        onTabChange={handleTabChange}
      />

      {/* Legend */}
      <div className="flex items-center gap-3 my-4 text-xs text-(--on-surface-variant)">
        <Badge variant="warning">แปลอัตโนมัติ</Badge>
        <span>= ผลจาก AI (แก้ไขได้)</span>
        <Badge variant="success">แก้ด้วยตนเอง</Badge>
        <span>= บันทึกโดย operator</span>
      </div>

      {/* Trip-level fields */}
      <section className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm p-6 mb-6">
        <div className="mb-4">
          <SectionHeader title="ข้อมูลหลักของทริป" icon="info" variant="icon" />
        </div>
        <FieldRow
          label="ชื่อทริป"
          original={tripData.title}
          value={getValue("title")}
          source={getSource("title")}
          langLabel={langLabel(activeLang)}
          onChange={(v) => setValue("title", null, v)}
        />
        <FieldRow
          label="จุดหมาย"
          original={tripData.destination}
          value={getValue("destination")}
          source={getSource("destination")}
          langLabel={langLabel(activeLang)}
          onChange={(v) => setValue("destination", null, v)}
        />
        {tripData.importantNotes && (
          <FieldRow
            label="หมายเหตุสำคัญ"
            original={tripData.importantNotes}
            multiline
            value={getValue("importantNotes")}
            source={getSource("importantNotes")}
            langLabel={langLabel(activeLang)}
            onChange={(v) => setValue("importantNotes", null, v)}
          />
        )}
      </section>

      {/* Per-day / per-activity fields */}
      {tripData.days.map((day) => (
        <section key={day.id} className="bg-white rounded-3xl border border-(--outline-variant)/30 shadow-sm p-6 mb-4">
          <div className="mb-4">
            <SectionHeader title={`วันที่ ${day.dayNumber} — ${day.title}`} icon="calendar_today" variant="icon" />
          </div>
          <FieldRow
            label="ชื่อวัน"
            original={day.title}
            value={getValue("day.title", day.id)}
            source={getSource("day.title", day.id)}
            langLabel={langLabel(activeLang)}
            onChange={(v) => setValue("day.title", day.id, v)}
          />
          {day.subtitle && (
            <FieldRow
              label="คำอธิบายวัน"
              original={day.subtitle}
              value={getValue("day.subtitle", day.id)}
              source={getSource("day.subtitle", day.id)}
              langLabel={langLabel(activeLang)}
              onChange={(v) => setValue("day.subtitle", day.id, v)}
            />
          )}

          {day.activities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-(--outline-variant)/20 space-y-4">
              {day.activities.map((act) => (
                <div key={act.id} className="bg-(--surface-container-low) rounded-2xl p-4">
                  <p className="text-sm font-semibold text-(--on-surface) mb-2">
                    {act.emoji && <span className="mr-1">{act.emoji}</span>}
                    {act.name}
                  </p>
                  <FieldRow
                    label="ชื่อกิจกรรม"
                    original={act.name}
                    value={getValue("activity.name", act.id)}
                    source={getSource("activity.name", act.id)}
                    langLabel={langLabel(activeLang)}
                    onChange={(v) => setValue("activity.name", act.id, v)}
                  />
                  {act.description && (
                    <FieldRow
                      label="รายละเอียด"
                      original={act.description}
                      multiline
                      value={getValue("activity.description", act.id)}
                      source={getSource("activity.description", act.id)}
                      langLabel={langLabel(activeLang)}
                      onChange={(v) => setValue("activity.description", act.id, v)}
                    />
                  )}
                  {act.placeName && (
                    <FieldRow
                      label="ชื่อสถานที่"
                      original={act.placeName}
                      value={getValue("activity.placeName", act.id)}
                      source={getSource("activity.placeName", act.id)}
                      langLabel={langLabel(activeLang)}
                      onChange={(v) => setValue("activity.placeName", act.id, v)}
                    />
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
            <span className="material-symbols-outlined text-base">
              {saving ? "hourglass_empty" : "save"}
            </span>
            {saving ? "กำลังบันทึก..." : "บันทึกคำแปล"}
          </button>
        </div>
      )}

      {/* Unsaved changes guard on tab switch */}
      <ConfirmDialog
        open={!!pendingLang}
        onOpenChange={(open) => { if (!open) setPendingLang(null); }}
        onConfirm={confirmTabSwitch}
        title="ยังมีคำแปลที่ยังไม่ได้บันทึก"
        description="หากเปลี่ยนภาษาตอนนี้ คำแปลที่แก้ไขไว้จะหายไป ต้องการดำเนินต่อหรือไม่?"
        confirmLabel="เปลี่ยนภาษา"
        cancelLabel="ยกเลิก"
        variant="danger"
      />
    </div>
  );
}
