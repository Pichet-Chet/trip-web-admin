"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/shared";

interface LegalDocResponse {
  id: string;
  slug: string;
  version: string;
  title: string;
  contentHtml: string;
  effectiveAt: string;
  publishedAt: string | null;
}

const FALLBACK_TITLE: Record<string, string> = {
  privacy: "นโยบายความเป็นส่วนตัว",
  terms: "เงื่อนไขการใช้งาน",
  refund_policy: "นโยบายการคืนเงิน",
  cookie_policy: "นโยบายคุกกี้",
};

interface Props {
  slug: "privacy" | "terms" | "refund_policy" | "cookie_policy";
}

export function LegalDocPage({ slug }: Props): React.ReactNode {
  const [doc, setDoc] = useState<LegalDocResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<LegalDocResponse>(`/legal/${slug}/current`);
        if (!mounted) return;
        setDoc(res);
        document.title = `${res.title} | Trip Admin`;
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.message : "โหลดเอกสารไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  if (loading) return <LoadingState message="กำลังโหลดเอกสาร..." />;
  if (error || !doc) {
    return (
      <ErrorState
        message={error ?? "ไม่พบเอกสารที่เผยแพร่"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const effective = new Date(doc.effectiveAt).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 md:px-10 py-6 border-b border-slate-100 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {doc.title || FALLBACK_TITLE[slug]}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              เวอร์ชั่น {doc.version} · มีผลตั้งแต่ {effective}
            </p>
          </div>
        </div>
        <div
          className="px-6 md:px-10 py-8 prose prose-slate prose-sm md:prose-base max-w-none prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: doc.contentHtml }}
        />
      </div>
    </div>
  );
}
