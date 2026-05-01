"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorState, LoadingState } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface FaqGroup {
  code: string;
  labelTh: string;
  labelEn: string;
  items: { id: string; question: string; answerHtml: string }[];
}

const contacts = [
  { label: "LINE Official", value: "@tripadmin-support", icon: "chat" },
  { label: "อีเมล", value: "support@example.com", icon: "mail" },
  { label: "เวลาทำการ", value: "จ-ศ 09:00-18:00", icon: "schedule" },
];

export default function HelpPage(): React.ReactNode {
  usePageTitle("ศูนย์ช่วยเหลือ");
  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.get<FaqGroup[]>("/admin/help/faq");
        if (!mounted) return;
        setGroups(data);
        setOpenItemId(data[0]?.items[0]?.id ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <LoadingState message="กำลังโหลดศูนย์ช่วยเหลือ..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ศูนย์ช่วยเหลือ</h1>
        <p className="text-slate-400 mt-2 text-sm">คำถามที่พบบ่อยและช่องทางติดต่อทีมงาน</p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <span className="material-symbols-outlined text-slate-300 text-4xl">help</span>
          <p className="mt-3 text-sm text-slate-500">ยังไม่มีคำถามที่พบบ่อยในขณะนี้</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.code} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{group.labelTh}</h2>
              {group.labelEn && (
                <p className="text-xs text-slate-400 mt-0.5">{group.labelEn}</p>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {group.items.map((item) => (
                <details
                  key={item.id}
                  open={openItemId === item.id}
                  onToggle={(e) => {
                    if ((e.target as HTMLDetailsElement).open) setOpenItemId(item.id);
                    else if (openItemId === item.id) setOpenItemId(null);
                  }}
                  className="group"
                >
                  <summary className="px-6 py-5 cursor-pointer flex items-center justify-between hover:bg-slate-50/50 transition-colors list-none">
                    <span className="font-semibold text-slate-900 text-sm pr-4">{item.question}</span>
                    <span className="material-symbols-outlined text-slate-300 text-lg shrink-0 group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div
                    className="px-6 pb-5 text-sm text-slate-500 leading-relaxed prose prose-sm max-w-none prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                  />
                </details>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">ติดต่อทีมงาน</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {contacts.map((c) => (
            <div key={c.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-slate-400">{c.icon}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <a href="/dashboard/feedback" className="block bg-(--primary) rounded-2xl p-6 text-white hover:bg-(--primary) transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">มีไอเดียหรือพบปัญหา?</h3>
            <p className="text-(--primary-container) text-sm mt-1">แจ้งปัญหาหรือเสนอฟีเจอร์ที่อยากได้ ทีมงานจะนำไปพัฒนาต่อ</p>
          </div>
          <span className="material-symbols-outlined text-3xl text-(--primary-container)">arrow_forward</span>
        </div>
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <a href="/dashboard/terms" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">เงื่อนไขการใช้งาน</h3>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
        <a href="/dashboard/privacy" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">นโยบายความเป็นส่วนตัว</h3>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
        <a href="/dashboard/refund-policy" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">นโยบายการคืนเงิน</h3>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
        <a href="/dashboard/cookie-policy" className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between hover:border-slate-300 transition-colors group">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">นโยบายคุกกี้</h3>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}
