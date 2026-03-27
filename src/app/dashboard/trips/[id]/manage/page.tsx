"use client";

import { useState, use } from "react";
import Link from "next/link";
import { getMockTrip, getMockDays, mockFollowers, mockChangeLogs, mockAcknowledgements } from "@/lib/mock-data";
import { ROUTES } from "@/constants/routes";
import { FilterTabs, ChannelBadge, IconButton, ConfirmDialog, useToast } from "@/components/shared";

type Tab = "pending" | "approved" | "followers" | "receipts" | "album";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

export default function TripManagePage({ params }: { params: Promise<{ id: string }> }): React.ReactNode {
  const { id } = use(params);
  const trip = getMockTrip(id);
  const days = getMockDays(id);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showUnpublish, setShowUnpublish] = useState(false);
  const [slugEdit, setSlugEdit] = useState(false);
  const { toast } = useToast();

  if (!trip) return <div className="p-12 text-center text-slate-400">ไม่พบทริปนี้</div>;

  const isEnded = trip.endDate ? new Date(trip.endDate) < new Date() : false;

  // Real data from mock
  const allFollowers = mockFollowers.filter((f) => f.tripId === id);
  const pendingList = allFollowers.filter((f) => f.status === "pending");
  const approvedList = allFollowers.filter((f) => f.status === "approved");
  const changelogs = mockChangeLogs.filter((c) => c.tripId === id);
  const acked = mockAcknowledgements.filter((a) => a.acknowledgedAt !== null);
  const pendingAck = mockAcknowledgements.filter((a) => a.acknowledgedAt === null);
  const activityCount = days.reduce((s, d) => s + d.activities.length, 0);

  const tabs: { value: Tab; label: string }[] = [
    { value: "pending", label: `คำขอเข้าร่วม (${pendingList.length})` },
    { value: "approved", label: `สมาชิก (${approvedList.length})` },
    { value: "receipts", label: `สถานะรับทราบ` },
    { value: "followers", label: `ทั้งหมด (${allFollowers.length})` },
    ...(isEnded ? [{ value: "album" as Tab, label: `อัลบั้ม (${trip.albumImages.length})` }] : []),
  ];

  return (
    <>
      {/* Header */}

      <div className="p-4 md:p-8 space-y-8">
        {/* Title + Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">จัดการทริป</h2>
            <p className="text-slate-500 mt-1 text-sm">จัดการคำขอเข้าร่วม สมาชิก และผู้ติดตามทริปนี้</p>
          </div>
          <FilterTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* ═══ Bento Grid ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left: Main Content (8 cols) ── */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

            {/* ─── Tab: Pending Requests ─── */}
            {activeTab === "pending" && (
              <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                    <h3 className="text-lg font-bold text-slate-900">คำขอเข้าร่วมทริป</h3>
                  </div>
                  {pendingList.length > 0 && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{pendingList.length} ใหม่</span>
                  )}
                </div>
                {pendingList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                    <p className="text-sm">ไม่มีคำขอเข้าร่วมใหม่</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {pendingList.map((f) => (
                      <div key={f.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-base font-bold text-slate-500">
                            {f.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{f.displayName}</div>
                            <div className="text-sm text-slate-400 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">schedule</span>
                              {timeAgo(f.followedAt)}
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <ChannelBadge channel={f.channel} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">ปฏิเสธ</button>
                          <button className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all">อนุมัติ</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ─── Tab: Approved Members ─── */}
            {activeTab === "approved" && (
              <>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    <h3 className="text-lg font-bold text-slate-900">สมาชิกที่อนุมัติแล้ว</h3>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span> ส่งออก
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">ชื่อสมาชิก</th>
                        <th className="px-6 py-4">ช่องทาง</th>
                        <th className="px-6 py-4">การรับทราบ</th>
                        <th className="px-6 py-4">วันที่เข้าร่วม</th>
                        <th className="px-6 py-4 text-right">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {approvedList.map((f) => {
                        const ackRecord = mockAcknowledgements.find((a) => a.followerId === f.id);
                        const isAcked = ackRecord?.acknowledgedAt != null;
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{f.displayName.charAt(0)}</div>
                                <span className="font-medium text-slate-900">{f.displayName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <ChannelBadge channel={f.channel} />
                            </td>
                            <td className="px-6 py-4">
                              {isAcked ? (
                                <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                                  <span className="material-symbols-outlined text-sm">done_all</span> รับทราบแล้ว
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold">
                                  <span className="material-symbols-outlined text-sm">hourglass_empty</span> ยังไม่เห็น
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {new Date(f.followedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <IconButton icon="edit" size="sm" />
                                <IconButton icon="person_remove" variant="danger" size="sm" />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ─── Tab: Read Receipts ─── */}
            {activeTab === "receipts" && (() => {
              const activeLog = changelogs.find((l) => l.id === selectedLogId) ?? changelogs[0];
              if (!activeLog) return (
                <div className="p-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <p className="text-sm">ยังไม่มีการเปลี่ยนแปลง</p>
                </div>
              );

              const logAcks = mockAcknowledgements.filter((a) => a.changelogId === activeLog.id);
              const logAcked = logAcks.filter((a) => a.acknowledgedAt !== null);
              const logPending = logAcks.filter((a) => a.acknowledgedAt === null);

              return (
                <>
                  {/* Change Summary Banner */}
                  <div className="p-6 border-b border-slate-100">
                    {/* Changelog selector (if multiple) */}
                    {changelogs.length > 1 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                        {changelogs.map((log, i) => {
                          const la = mockAcknowledgements.filter((a) => a.changelogId === log.id);
                          const laDone = la.filter((a) => a.acknowledgedAt !== null);
                          const pct = la.length > 0 ? Math.round((laDone.length / la.length) * 100) : 0;
                          return (
                            <button
                              key={log.id}
                              onClick={() => setSelectedLogId(log.id)}
                              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeLog.id === log.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                            >
                              ครั้งที่ {changelogs.length - i} · {pct === 100 ? "✓ ครบ" : `${pct}%`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                          <h3 className="font-bold text-blue-700 uppercase tracking-wider text-xs">รายละเอียดการเปลี่ยนแปลง</h3>
                          <span className="text-xs text-blue-500">
                            {new Date(activeLog.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {activeLog.changes.map((c, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                              <p className="text-slate-700 text-sm font-medium">{c.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {logPending.length > 0 && (
                        <button className="bg-blue-600 text-white rounded-lg px-6 py-3 font-bold text-sm shadow-md flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shrink-0">
                          <span className="material-symbols-outlined">send</span>
                          ส่งซ้ำเฉพาะคนที่ยังไม่เห็น
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">รับทราบแล้ว</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{logAcked.length}<span className="text-lg font-normal opacity-40">/{logAcks.length}</span></h2>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm font-medium">ยังไม่เห็น</p>
                        <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{logPending.length}<span className="text-lg font-normal opacity-40">/{logAcks.length}</span></h2>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-400 text-2xl">hourglass_empty</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-400">ชื่อลูกทริป</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-400 text-center">ช่องทาง</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-400">สถานะ</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-400">เวลา</th>
                          <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-slate-400 text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {logAcks.map((a) => {
                          const isDone = a.acknowledgedAt !== null;
                          return (
                            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isDone ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{a.followerName.charAt(0)}</div>
                                  <span className="font-bold text-slate-900">{a.followerName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <ChannelBadge channel={a.channel} />
                              </td>
                              <td className="px-6 py-4">
                                {isDone ? (
                                  <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">รับทราบแล้ว</span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">ยังไม่เห็น</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {isDone ? (
                                  <span className="text-slate-500 text-sm tabular-nums">
                                    {new Date(a.acknowledgedAt!).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}, {new Date(a.acknowledgedAt!).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ) : (
                                  <span className="italic text-slate-300 text-sm">รอ...</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isDone ? (
                                  <IconButton icon="more_vert" size="sm" />
                                ) : (
                                  <button className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-1.5 ml-auto">
                                    <span className="text-xs font-bold">ส่งซ้ำ</span>
                                    <span className="material-symbols-outlined text-lg">replay</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-4 bg-slate-50/50 flex justify-between items-center border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">แสดง {logAcks.length} จาก {logAcks.length} คน</p>
                  </div>
                </>
              );
            })()}

            {/* ─── Tab: Album ─── */}
            {activeTab === "album" && isEnded && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">อัลบั้มทริป</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{trip.albumImages.length} รูป · แชร์ให้ลูกทริปดูผ่านลิงก์ทริป</p>
                  </div>
                </div>

                {/* Upload area */}
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center transition-colors hover:bg-blue-50/30">
                    <span className="material-symbols-outlined text-3xl text-slate-300 mb-2">add_photo_alternate</span>
                    <p className="text-sm font-semibold text-slate-600">อัปโหลดรูปภาพ</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG ไม่เกิน 5MB ต่อรูป</p>
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </label>

                {/* Image grid */}
                {trip.albumImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {trip.albumImages.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                        <img src={img} alt={`อัลบั้ม ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => toast("ลบรูปเรียบร้อย")}
                            className="bg-white/90 text-red-500 p-2 rounded-lg shadow-sm hover:bg-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">photo_library</span>
                    <p className="text-sm">ยังไม่มีรูปในอัลบั้ม</p>
                    <p className="text-xs mt-1">อัปโหลดรูปเพื่อแชร์ความทรงจำให้ลูกทริป</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: All Followers ─── */}
            {activeTab === "followers" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">group</span>
                    <h3 className="text-lg font-bold text-slate-900">ทุกคนที่ติดตามทริปนี้</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allFollowers.map((f) => (
                    <div key={f.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                          {f.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{f.displayName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ChannelBadge channel={f.channel} />
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${f.status === "approved" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                              {f.status === "approved" ? "สมาชิก" : "รอนุมัติ"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {f.status === "pending" && (
                        <button className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                          <span className="material-symbols-outlined text-sm">person_add</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Right: Summary Cards (4 cols) ── */}
          <section className="lg:col-span-4 space-y-6">
            {/* Capacity Card */}
            <div className="bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-600/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-white/80 font-medium text-sm">สมาชิกทริปนี้</h4>
                <div className="text-4xl font-black mt-1">{approvedList.length} / {trip.travelersCount}</div>
                <p className="text-xs text-white/70 mt-4 leading-relaxed">
                  เหลืออีก {trip.travelersCount - approvedList.length} ที่ · {days.length} วัน · {activityCount} กิจกรรม
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: "120px" }}>groups</span>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4">สรุปข้อมูล</h4>
              <div className="space-y-3">
                {[
                  { icon: "notification_important", color: "text-amber-500", label: "ยังไม่เห็นอัปเดต", value: `${pendingAck.length} คน` },
                  { icon: "check_circle", color: "text-emerald-500", label: "รับทราบแล้ว", value: `${acked.length} คน` },
                  { icon: "visibility", color: "text-blue-500", label: "เข้าชมทั้งหมด", value: String(trip.viewCount) },
                  { icon: "edit_note", color: "text-purple-500", label: "แก้ไขแล้ว", value: `${trip.editCount} / 2 ครั้ง` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Link + Slug */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">ลิงก์ทริป</h4>
                <button onClick={() => setSlugEdit(!slugEdit)} className="text-xs text-blue-600 hover:underline">
                  {slugEdit ? "เสร็จ" : "แก้ไข slug"}
                </button>
              </div>
              {slugEdit ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>app.example.com/t/</span>
                  </div>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    defaultValue={trip.slug}
                    placeholder="custom-slug"
                  />
                  <button onClick={() => { setSlugEdit(false); toast("บันทึก slug เรียบร้อย"); }} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                    บันทึก
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-500 truncate flex-1">app.example.com/t/{trip.slug}</span>
                  <button onClick={() => toast("คัดลอกลิงก์แล้ว")} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">คัดลอก</button>
                </div>
              )}
              <div className="flex gap-2">
                <Link href={ROUTES.tripPreview(id)} className="flex-1 py-2.5 text-center rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                  แชร์ทริป
                </Link>
              </div>
            </div>

            {/* Unpublish */}
            <button
              onClick={() => setShowUnpublish(true)}
              className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              ยกเลิกเผยแพร่ทริปนี้
            </button>

            {/* Changelog */}
            {changelogs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4">การเปลี่ยนแปลงล่าสุด</h4>
                {changelogs.slice(0, 2).map((log) => (
                  <div key={log.id} className="space-y-2">
                    <p className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {log.notiSent && <span className="ml-2 text-emerald-500 font-semibold">· ส่งแจ้งเตือนแล้ว</span>}
                    </p>
                    {log.changes.map((c, i) => (
                      <p key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                        <span className={`material-symbols-outlined text-sm mt-0.5 ${c.type === "add" ? "text-emerald-500" : c.type === "delete" ? "text-red-400" : "text-blue-500"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {c.type === "add" ? "add_circle" : c.type === "delete" ? "remove_circle" : "edit"}
                        </span>
                        {c.description}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={showUnpublish}
        onClose={() => setShowUnpublish(false)}
        onConfirm={() => toast("ยกเลิกเผยแพร่เรียบร้อยแล้ว")}
        title="ยกเลิกเผยแพร่ทริปนี้?"
        description="ลิงก์ทริปจะไม่สามารถเข้าถึงได้อีก ลูกทริปจะเห็นหน้า 'ทริปนี้ไม่เปิดให้ดูแล้ว'"
        confirmLabel="ยกเลิกเผยแพร่"
        variant="danger"
      />
    </>
  );
}
