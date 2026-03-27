"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { getMockTrip, mockChangeLogs, mockAcknowledgements } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { IconWrapper, ChannelBadge } from "@/components/shared";

export default function TripReceiptsPage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const trip = getMockTrip(id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  const changelog = mockChangeLogs.find((cl) => cl.tripId === id);
  const acks = mockAcknowledgements;
  const acknowledged = acks.filter((a) => a.acknowledgedAt !== null);
  const pending = acks.filter((a) => a.acknowledgedAt === null);

  return (
    <>
      <Header
        title="Read Receipt"
        subtitle={trip.title}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        actions={
          <Link href={ROUTES.tripPublish(id)} className="text-sm text-(--primary) font-medium hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            กลับ
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {/* Change Summary Banner */}
          {changelog && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
              <IconWrapper icon="campaign" color="bg-blue-100 text-blue-700" className="rounded-full! shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-blue-900 text-sm">การเปลี่ยนแปลง</h3>
                  <span className="text-xs text-blue-600">
                    {new Date(changelog.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-blue-800 text-sm mt-1">{changelog.summaryText}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper icon="check_circle" color="bg-green-100 text-green-700" filled />
              </div>
              <p className="text-3xl font-bold text-(--on-surface)">
                {acknowledged.length}<span className="text-lg text-(--on-surface-variant) font-normal">/{acks.length}</span>
              </p>
              <p className="text-xs text-(--on-surface-variant) mt-1">รับทราบแล้ว</p>
            </div>
            <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 p-6">
              <div className="flex items-center gap-3 mb-3">
                <IconWrapper icon="schedule" color="bg-amber-100 text-amber-700" />
              </div>
              <p className="text-3xl font-bold text-(--on-surface)">
                {pending.length}<span className="text-lg text-(--on-surface-variant) font-normal">/{acks.length}</span>
              </p>
              <p className="text-xs text-(--on-surface-variant) mt-1">ยังไม่เห็น</p>
            </div>
          </div>

          {/* Acknowledged List */}
          <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-(--outline-variant)/10 flex items-center justify-between">
              <h3 className="font-bold text-(--on-surface)">✅ รับทราบแล้ว ({acknowledged.length})</h3>
            </div>
            <div className="divide-y divide-(--outline-variant)/10">
              {acknowledged.map((ack) => (
                <div key={ack.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-(--primary-container) flex items-center justify-center text-sm font-bold text-(--on-primary-container)">
                    {ack.followerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--on-surface) truncate">{ack.followerName}</p>
                    <ChannelBadge channel={ack.channel} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">Acknowledged</span>
                    <p className="text-[10px] text-(--on-surface-variant) mt-1 tabular-nums">
                      {ack.acknowledgedAt && new Date(ack.acknowledgedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending List */}
          <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant)/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-(--outline-variant)/10 flex items-center justify-between">
              <h3 className="font-bold text-(--on-surface)">⏳ ยังไม่เห็น ({pending.length})</h3>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--primary) text-(--on-primary) text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all">
                <span className="material-symbols-outlined text-sm">refresh</span>
                ส่ง noti ซ้ำ
              </button>
            </div>
            <div className="divide-y divide-(--outline-variant)/10">
              {pending.map((ack) => (
                <div key={ack.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">
                    {ack.followerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-(--on-surface) truncate">{ack.followerName}</p>
                    <ChannelBadge channel={ack.channel} />
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Pending</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
