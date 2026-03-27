"use client";

import { useState, use } from "react";
import { Header } from "@/components/layout/header";
import { getMockTrip } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

export default function TripPublishPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const trip = getMockTrip(id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  const tripUrl = `app.example.com/t/${trip.slug}`;
  const shareMessage = `สวัสดีค่ะ 🙏\nทริป ${trip.title} พร้อมแล้วค่ะ\nเปิดดู itinerary ได้ที่:\n👉 ${tripUrl}\n\nกด "ติดตาม" เพื่อรับแจ้งเตือน\nเมื่อมีการเปลี่ยนแปลงค่ะ 🔔`;

  function copyText(text: string, key: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <Header
        title="Publish & Share"
        subtitle={trip.title}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-green-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h3 className="font-bold text-green-900 text-lg">Trip Published!</h3>
              <p className="text-green-700 text-sm mt-1">ทริปของคุณพร้อมให้ลูกทริปเปิดดูแล้ว ส่ง link หรือ QR Code ให้ลูกทริปได้เลย</p>
            </div>
          </div>

          {/* URL Section */}
          <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 p-6 space-y-4">
            <h3 className="font-bold text-(--on-surface)">🔗 Trip URL</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-(--surface-container-low) rounded-xl px-5 py-3.5 text-sm text-(--primary) font-mono truncate">
                {tripUrl}
              </div>
              <button
                onClick={() => copyText(tripUrl, "url")}
                className="shrink-0 flex items-center gap-2 px-4 py-3.5 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-lg">{copied === "url" ? "check" : "content_copy"}</span>
                {copied === "url" ? "Copied!" : "Copy"}
              </button>
            </div>
            <button className="text-sm text-(--primary) font-medium hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">edit</span>
              แก้ slug
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 p-6 space-y-4">
            <h3 className="font-bold text-(--on-surface)">📱 QR Code</h3>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 bg-white border-2 border-(--outline-variant)/20 rounded-2xl flex items-center justify-center">
                {/* Mock QR */}
                <div className="w-36 h-36 bg-[repeating-conic-gradient(#000_0%_25%,#fff_0%_50%)] bg-[length:12px_12px] rounded-lg opacity-80" />
              </div>
              <div className="flex flex-col gap-3">
                <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-(--surface-container-low) text-(--on-surface) text-sm font-medium hover:bg-(--surface-variant) transition-colors">
                  <span className="material-symbols-outlined text-lg">download</span>
                  Download QR (PNG)
                </button>
                <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-(--surface-container-low) text-(--on-surface) text-sm font-medium hover:bg-(--surface-variant) transition-colors">
                  <span className="material-symbols-outlined text-lg">download</span>
                  Download QR + Logo
                </button>
              </div>
            </div>
          </div>

          {/* Share Message */}
          <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 p-6 space-y-4">
            <h3 className="font-bold text-(--on-surface)">💬 ข้อความสำเร็จรูป</h3>
            <p className="text-xs text-(--on-surface-variant)">Copy แปะใน LINE group ให้ลูกทริปได้เลย</p>
            <div className="bg-(--surface-container-low) rounded-xl p-4 text-sm text-(--on-surface) whitespace-pre-line leading-relaxed">
              {shareMessage}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => copyText(shareMessage, "msg")}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-(--primary) text-(--on-primary) text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-lg">{copied === "msg" ? "check" : "content_copy"}</span>
                {copied === "msg" ? "Copied!" : "Copy ข้อความ"}
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#06C755] text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 10.304c0-4.579-5.383-8.304-12-8.304s-12 3.725-12 8.304c0 4.105 4.27 7.545 10.046 8.204.391.084.924.258 1.058.592.121.303.079.777.038 1.082l-.166 1.012c-.05.303-.242 1.188 1.038.647 1.28-.54 6.892-4.06 9.407-6.948 1.74-2.002 2.579-3.488 2.579-4.589z"/></svg>
                Share via LINE
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pb-8">
            <Link
              href={ROUTES.dashboard}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-(--on-surface-variant) bg-(--surface-container-low) hover:bg-(--surface-variant) transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              กลับ Dashboard
            </Link>
            <Link
              href={ROUTES.tripReceipts(id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-(--primary) bg-(--primary-container) hover:opacity-90 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              ดู Read Receipt
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
