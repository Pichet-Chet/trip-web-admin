"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/shared";

interface TripTemplate {
  id: string;
  title: string;
  destination: string;
  coverImageUrl: string | null;
  templateCategory: string | null;
  daysCount: number;
  activitiesCount: number;
  language: string;
  scope: string;
}

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
}

const SCOPE_LABEL: Record<string, string> = { domestic: "ในประเทศ", international: "ต่างประเทศ" };

export function TemplatePickerModal({ open, onClose }: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<TripTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [cloning, setCloning] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get<TripTemplate[]>("/admin/trips/templates")
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSelect(template: TripTemplate) {
    if (cloning) return;
    setCloning(template.id);
    try {
      const result = await api.post<{ id: string; title: string }>(`/admin/trips/${template.id}/clone`);
      toast.success(`สร้างจาก template เรียบร้อย: ${result.title}`);
      onClose();
      router.push(ROUTES.tripEdit(result.id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Clone ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setCloning(null);
    }
  }

  if (!open) return null;

  const categories = [...new Set(templates.map((t) => t.templateCategory ?? "ทั่วไป"))];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-(--surface) rounded-3xl shadow-2xl max-w-2xl mx-auto max-h-[80vh] flex flex-col"
        role="dialog"
        aria-modal
        aria-label="เลือก Template"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--outline-variant)/30 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-(--on-surface)">สร้างจาก Template</h2>
            <p className="text-sm text-(--on-surface-variant)">เลือก template แล้วแก้ไขตามต้องการ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-(--on-surface-variant) hover:bg-(--surface-variant) transition-colors"
            aria-label="ปิด"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-(--primary)/30 border-t-(--primary) rounded-full animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="material-symbols-outlined text-4xl text-(--on-surface-variant)">layers</span>
              <p className="text-sm font-bold text-(--on-surface-variant)">ยังไม่มี template ในระบบ</p>
              <p className="text-xs text-(--on-surface-variant)">ผู้ดูแลระบบสามารถเพิ่ม template ได้ในภายหลัง</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest mb-3">{cat}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates
                      .filter((t) => (t.templateCategory ?? "ทั่วไป") === cat)
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelect(t)}
                          disabled={cloning !== null}
                          className="text-left rounded-2xl border border-(--outline-variant)/40 hover:border-(--primary)/50 hover:shadow-md bg-white transition-all overflow-hidden group disabled:opacity-60 disabled:cursor-wait"
                        >
                          {/* Cover */}
                          <div className="relative aspect-16/7 overflow-hidden bg-(--surface-variant)">
                            {t.coverImageUrl ? (
                              <img src={t.coverImageUrl} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-white/80">map</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-2 left-3 right-3">
                              <p className="text-white text-xs font-bold line-clamp-1">{t.title}</p>
                              <p className="text-white/80 text-[10px]">{t.destination}</p>
                            </div>
                            {cloning === t.id && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="px-3 py-2.5 flex items-center gap-3">
                            <span className="text-[11px] text-(--on-surface-variant)">{SCOPE_LABEL[t.scope] ?? t.scope}</span>
                            <span className="w-1 h-1 rounded-full bg-(--outline-variant)" />
                            <span className="text-[11px] text-(--on-surface-variant)">{t.daysCount} วัน</span>
                            <span className="w-1 h-1 rounded-full bg-(--outline-variant)" />
                            <span className="text-[11px] text-(--on-surface-variant)">{t.activitiesCount} กิจกรรม</span>
                            <div className="ml-auto">
                              <span className="material-symbols-outlined text-sm text-(--primary) opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-(--outline-variant)/30 shrink-0">
          <p className="text-[11px] text-(--on-surface-variant) text-center">
            การเลือก template จะใช้ 1 quota เหมือนการสร้างทริปใหม่
          </p>
        </div>
      </div>
    </>
  );
}
