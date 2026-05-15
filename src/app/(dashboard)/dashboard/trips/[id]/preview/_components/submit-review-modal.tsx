"use client";

interface SubmitReviewModalProps {
  open: boolean;
  isPublished: boolean;
  isPendingReview: boolean;
  visibility: "link_only" | "marketplace";
  onVisibilityChange: (v: "link_only" | "marketplace") => void;
  /** Pre-rendered link preview (e.g. "https://trip.example/t/xxx"). */
  linkPreview: string;
  /** Quota source from the previous publish, if any — drives the "ส่งใหม่ฟรี" copy. */
  publishedQuotaSource: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

const tierLabel = (source: string): string => {
  switch (source) {
    case "subscription": return "Subscription";
    case "per_trip": return "เครดิต Per-Trip";
    case "pack_5": return "เครดิต Pack 5";
    case "free": return "ทริปฟรี";
    case "grandfather": return "Grandfather (ก่อนเริ่มเก็บค่าใช้จ่าย)";
    default: return source;
  }
};

/**
 * "Submit for review" dialog. Visibility radio + link preview + a credit-
 * policy notice that swaps copy depending on whether this is a first
 * publish or a re-submit after reject.
 */
export function SubmitReviewModal({
  open, isPublished, isPendingReview, visibility, onVisibilityChange,
  linkPreview, publishedQuotaSource, submitting, onSubmit, onClose,
}: SubmitReviewModalProps): React.ReactNode {
  if (!open) return null;

  const showFirstPublishCopy = !isPublished && !isPendingReview;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-orange-600 text-4xl">send</span>
            </div>
            <h3 className="text-lg font-bold text-(--on-surface)">ส่งตรวจสอบ</h3>
            <p className="text-sm text-(--on-surface-variant) mt-1">
              {isPublished
                ? "ส่งเวอร์ชันใหม่ให้ทีมงานตรวจสอบก่อนอัปเดต"
                : "ส่งทริปให้ทีมงานตรวจสอบก่อนเผยแพร่"}
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">
              การมองเห็นหลังอนุมัติ
            </label>
            <VisibilityOption
              checked={visibility === "link_only"}
              onClick={() => onVisibilityChange("link_only")}
              title="เฉพาะคนที่มีลิงก์"
              subtitle="แชร์ให้เฉพาะลูกทริปผ่านลิงก์หรือ QR Code"
            />
            <VisibilityOption
              checked={visibility === "marketplace"}
              onClick={() => onVisibilityChange("marketplace")}
              title="เปิดบน Marketplace"
              subtitle="แสดงบนเว็บไซต์ เพิ่มโอกาสให้ลูกค้าค้นหาพบ"
            />
          </div>

          <div className="bg-(--surface-container-low) rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold text-(--on-surface-variant) uppercase tracking-widest">
              ลิงก์ทริป (สร้างอัตโนมัติหลังอนุมัติ)
            </p>
            <p className="text-sm font-medium text-(--on-surface) break-all">{linkPreview}</p>
          </div>

          {/* Credit policy notice — different copy for first vs re-submit */}
          {showFirstPublishCopy && publishedQuotaSource ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-lg flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-bold text-emerald-900">ส่งใหม่ได้เลย — ไม่หักเครดิตเพิ่ม</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    ทริปนี้เคยถูก reject — เครดิตที่ใช้ตอนส่งครั้งแรก ({tierLabel(publishedQuotaSource)}) ผูกกับทริปนี้ตลอดอายุ
                  </p>
                </div>
              </div>
            </div>
          ) : showFirstPublishCopy ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-600 text-lg flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div className="flex-1 space-y-1.5">
                  <p className="text-sm font-bold text-amber-900">การใช้เครดิต</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    การส่งตรวจสอบครั้งแรก <strong>หัก 1 เครดิต</strong> จากแพลนของคุณ (per_trip / pack_5 / Subscription) — ระบบจะใช้เครดิตที่ซื้อเก่าก่อน (FIFO)
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 ml-3 list-disc list-inside marker:text-amber-500">
                    <li>ถ้า staff reject → แก้ไขแล้ว <strong>ส่งใหม่ฟรี</strong> (ไม่หักเครดิตเพิ่ม)</li>
                    <li>เครดิตที่ใช้ผูกกับทริปนี้ตลอดอายุ — re-publish ฟรีหลัง unpublish</li>
                    <li>หากต้องการขอคืนเงิน กรุณาติดต่อทีมงาน</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-(--outline-variant)/30 text-sm font-bold text-(--on-surface-variant) hover:bg-(--surface-variant)/50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-bold hover:opacity-90 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-lg">send</span>
              )}
              {submitting ? "กำลังส่ง..." : "ส่งตรวจสอบ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VisibilityOptionProps {
  checked: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}

function VisibilityOption({ checked, onClick, title, subtitle }: VisibilityOptionProps): React.ReactNode {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
        checked ? "border-(--primary) bg-(--primary-container)/20" : "border-(--outline-variant)/30 hover:border-(--outline-variant)/60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-lg" style={checked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
          {checked ? "radio_button_checked" : "radio_button_unchecked"}
        </span>
        <div>
          <p className={`text-sm font-bold ${checked ? "text-(--primary)" : "text-(--on-surface)"}`}>{title}</p>
          <p className="text-xs text-(--on-surface-variant) mt-0.5">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}
