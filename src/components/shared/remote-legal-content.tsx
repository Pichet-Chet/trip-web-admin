"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface LegalDocResponse {
  id: string;
  slug: string;
  version: string;
  title: string;
  contentHtml: string;
  effectiveAt: string;
}

interface Props {
  slug: "privacy" | "terms" | "refund_policy" | "cookie_policy";
  onLoaded?: (doc: { id: string; version: string }) => void;
}

/**
 * Fetches the *current* version of a legal document and renders the sanitized HTML.
 * Used in agreement modals + standalone /dashboard/{slug} pages so all surfaces stay
 * in sync with what staff publishes via /dashboard/legal.
 */
export function RemoteLegalContent({ slug, onLoaded }: Props): React.ReactNode {
  const [doc, setDoc] = useState<LegalDocResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<LegalDocResponse>(`/legal/${slug}/current`);
        if (!mounted) return;
        setDoc(res);
        onLoaded?.({ id: res.id, version: res.version });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.message : "โหลดเอกสารไม่สำเร็จ");
      }
    })();
    return () => { mounted = false; };
  }, [slug, onLoaded]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400">
        เวอร์ชั่น {doc.version} · มีผลตั้งแต่ {new Date(doc.effectiveAt).toLocaleDateString("th-TH")}
      </div>
      <div
        className="prose prose-sm max-w-none prose-slate prose-headings:font-bold prose-h2:text-base prose-h2:text-slate-900 prose-h3:text-sm prose-h3:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900"
        dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
      />
    </div>
  );
}
