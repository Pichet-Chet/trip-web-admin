"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { usePageTitle } from "@/lib/hooks/use-page-title";

function SuspendedContent(): React.ReactNode {
  usePageTitle("บัญชีถูกระงับ");
  const params = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 md:p-10 max-w-lg w-full space-y-6">
      <div className="flex items-center gap-3">
        <span
          className="material-symbols-outlined text-3xl text-amber-600"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          gpp_maybe
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">บัญชีถูกระงับ</h1>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">
        ขณะนี้บัญชีของคุณถูกระงับการใช้งานชั่วคราว
        ทำให้ไม่สามารถเข้าสู่ระบบได้
      </p>

      {reason && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">เหตุผล</p>
          <p className="text-sm text-amber-800">{reason}</p>
        </div>
      )}

      <div className="border-t border-slate-100 pt-5 space-y-3">
        <p className="text-sm font-semibold text-slate-800">หากเห็นว่าเป็นความผิดพลาด</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          กรุณาติดต่อทีมงานพร้อมแจ้งอีเมลที่ใช้สมัคร เพื่อให้เราตรวจสอบและช่วยเหลือต่อไป
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href="mailto:support@tripapp.co"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            support@tripapp.co
          </a>
          <a
            href="https://line.me/ti/p/@tripapp"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-base">chat</span>
            LINE @tripapp
          </a>
        </div>
      </div>

      <div className="pt-2 text-center">
        <Link href="/login" className="text-sm text-(--primary) font-semibold hover:underline">
          ← กลับหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}

export default function SuspendedPage(): React.ReactNode {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Suspense fallback={<div className="bg-white rounded-2xl p-8 max-w-lg w-full animate-pulse h-72" />}>
        <SuspendedContent />
      </Suspense>
    </main>
  );
}
