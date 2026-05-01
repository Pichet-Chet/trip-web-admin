"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

const STORAGE_KEY = "cookie_consent_doc_id";

interface CookieDoc {
  id: string;
  version: string;
}

interface AcceptanceItem {
  documentId: string;
  slug: string;
}

/**
 * PDPA cookie banner. Appears on first-load when the user has not yet accepted
 * the *current* cookie_policy version. Acceptance is logged via /api/me/legal/accept
 * (source='popup_recheck') AND mirrored into localStorage to skip the API
 * round-trip on subsequent loads.
 *
 * If staff publishes a new cookie_policy version, the doc.id changes — the
 * stored ID will mismatch and the banner re-appears. Same trigger as
 * LegalReacceptGuard but localStorage-backed for performance.
 */
export function CookieBanner(): React.ReactNode {
  const [doc, setDoc] = useState<CookieDoc | null>(null);
  const [hidden, setHidden] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const current = await api.get<CookieDoc>("/legal/cookie_policy/current");
        if (!mounted) return;

        const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        if (stored === current.id) return; // already accepted current version

        // Confirm via server in case localStorage was cleared but server has the record
        try {
          const acceptances = await api.get<AcceptanceItem[]>("/me/legal/acceptances");
          const accepted = acceptances.some((a) => a.documentId === current.id);
          if (accepted) {
            localStorage.setItem(STORAGE_KEY, current.id);
            return;
          }
        } catch {
          // not authenticated yet — show the banner anyway as informational
        }

        setDoc(current);
        setHidden(false);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return;
        console.error("[CookieBanner]", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function accept() {
    if (!doc) return;
    setSubmitting(true);
    try {
      // Best-effort log to server; localStorage is the source of truth for UX.
      try {
        await api.post("/me/legal/accept", { documentId: doc.id });
      } catch {
        /* ignore — banner can still dismiss for unauthenticated users */
      }
      localStorage.setItem(STORAGE_KEY, doc.id);
      setHidden(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (hidden || !doc) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div
        role="dialog"
        aria-label="แจ้งการใช้คุกกี้"
        className="mx-auto max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 md:p-5 pointer-events-auto"
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-(--primary) shrink-0">cookie</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 leading-relaxed">
              เว็บไซต์นี้ใช้เฉพาะคุกกี้ที่จำเป็นเพื่อรักษาสถานะการเข้าใช้งานและความปลอดภัย
              <span className="text-slate-500"> ไม่มีคุกกี้โฆษณาหรือติดตามพฤติกรรม</span>
            </p>
            <Link
              href="/dashboard/cookie-policy"
              className="text-xs text-(--primary) font-semibold hover:underline mt-1 inline-block"
            >
              อ่านนโยบายคุกกี้ฉบับเต็ม (v{doc.version})
            </Link>
          </div>
          <button
            type="button"
            onClick={accept}
            disabled={submitting}
            className="shrink-0 px-4 py-2 rounded-lg bg-(--primary) text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "..." : "ยอมรับ"}
          </button>
        </div>
      </div>
    </div>
  );
}
