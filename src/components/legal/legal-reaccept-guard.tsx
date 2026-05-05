"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Modal } from "@/components/shared";
import { RemoteLegalContent } from "@/components/legal/remote-legal-content";

interface LegalDocResponse {
  id: string;
  slug: string;
  version: string;
  title: string;
  effectiveAt: string;
}

interface AcceptanceItem {
  documentId: string;
  slug: string;
  version: string;
  agreedAt: string;
}

const SLUGS_TO_CHECK = ["terms", "privacy", "refund_policy"] as const;
type Slug = (typeof SLUGS_TO_CHECK)[number];

interface Pending {
  slug: Slug;
  doc: LegalDocResponse;
  scrolledToBottom: boolean;
  readAt: string | null;
}

/**
 * Mounted in the dashboard layout. After login, compares the user's most recent
 * acceptance per slug against the *currently effective* document version. If the
 * user has not yet accepted the current version, shows a blocking modal that
 * forces them to scroll-to-bottom + click accept (PDPA Agreement UX rule).
 *
 * Each accept POSTs /api/me/legal/accept with source='popup_recheck' — recorded
 * for downstream compliance reports.
 */
export function LegalReacceptGuard(): React.ReactNode {
  const [pendingList, setPendingList] = useState<Pending[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const checked = useRef(false);

  const check = useCallback(async () => {
    try {
      const [terms, privacy, refund, mine] = await Promise.all([
        api.get<LegalDocResponse>("/legal/terms/current").catch(() => null),
        api.get<LegalDocResponse>("/legal/privacy/current").catch(() => null),
        api.get<LegalDocResponse>("/legal/refund_policy/current").catch(() => null),
        api.get<AcceptanceItem[]>("/me/legal/acceptances"),
      ]);

      const acceptedDocIds = new Set(mine.map((a) => a.documentId));
      const pending: Pending[] = [];
      for (const [slug, doc] of [["terms", terms], ["privacy", privacy], ["refund_policy", refund]] as const) {
        if (!doc) continue;
        if (!acceptedDocIds.has(doc.id)) {
          pending.push({ slug, doc, scrolledToBottom: false, readAt: null });
        }
      }
      setPendingList(pending);
      setActiveIndex(0);
    } catch (err) {
      // Auth not ready yet or server error — fail open. Will retry next time
      // user navigates to dashboard.
      if (!(err instanceof ApiError)) console.error("[ReacceptGuard]", err);
    }
  }, []);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    // Defer slightly to let auth settle after login.
    const t = setTimeout(check, 800);
    return () => clearTimeout(t);
  }, [check]);

  const current = pendingList[activeIndex];

  async function accept() {
    if (!current) return;
    setSubmitting(true);
    try {
      await api.post("/me/legal/accept", {
        documentId: current.doc.id,
        readAt: current.readAt ?? new Date().toISOString(),
      });
      const remaining = pendingList.slice(activeIndex + 1);
      if (remaining.length > 0) {
        setActiveIndex(activeIndex + 1);
      } else {
        setPendingList([]);
        setActiveIndex(0);
      }
    } catch (err) {
      console.error("[ReacceptGuard] accept failed", err);
      // Leave modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  }

  function markScrolled() {
    setPendingList((prev) => prev.map((p, i) =>
      i === activeIndex && !p.scrolledToBottom
        ? { ...p, scrolledToBottom: true, readAt: new Date().toISOString() }
        : p
    ));
  }

  if (!current) return null;

  const totalCount = pendingList.length;
  const stepLabel = totalCount > 1 ? ` (${activeIndex + 1}/${totalCount})` : "";

  return (
    <Modal
      open
      onClose={() => { /* blocking — user must accept to dismiss */ }}
      blocking
      hideCloseButton
      size="xl"
      title={`อัปเดตเอกสารทางกฎหมาย${stepLabel}`}
      subtitle={
        <span className="text-xs text-slate-500">
          {current.doc.title} ได้รับการอัปเดตเป็นเวอร์ชั่น {current.doc.version} —
          กรุณาอ่านและยอมรับเพื่อใช้งานต่อ
        </span>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-slate-500">
            {current.scrolledToBottom
              ? "อ่านครบแล้ว สามารถยอมรับได้"
              : "เลื่อนลงไปจนสุดเอกสารเพื่อเปิดใช้ปุ่มยอมรับ"}
          </p>
          <button
            type="button"
            onClick={accept}
            disabled={!current.scrolledToBottom || submitting}
            className="px-5 py-2 rounded-lg bg-(--primary) text-white font-semibold disabled:opacity-50 hover:brightness-110"
          >
            {submitting ? "กำลังบันทึก..." : "ยอมรับและดำเนินการต่อ"}
          </button>
        </div>
      }
    >
      <ScrollableContent slug={current.slug} onReachBottom={markScrolled} />
    </Modal>
  );
}

interface ScrollableContentProps {
  slug: Slug;
  onReachBottom: () => void;
}

function ScrollableContent({ slug, onReachBottom }: ScrollableContentProps): React.ReactNode {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      const reached = el.scrollHeight - el.scrollTop - el.clientHeight < 16;
      if (reached) onReachBottom();
    };
    el.addEventListener("scroll", handler);
    // Trigger on mount in case content fits without scrolling
    setTimeout(handler, 600);
    return () => el.removeEventListener("scroll", handler);
  }, [onReachBottom]);

  return (
    <div ref={ref} className="max-h-[60vh] overflow-y-auto px-1">
      <RemoteLegalContent slug={slug} />
    </div>
  );
}
