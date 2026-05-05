"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { SectionHeader, useToast } from "@/components/shared";

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  isCurrent: boolean;
}

interface LoginHistoryItem {
  id: string;
  ipAddress: string;
  userAgent: string;
  isSuccess: boolean;
  failureReason: string | null;
  createdAt: string;
}

interface LoginHistory {
  totalCount: number;
  page: number;
  pageSize: number;
  items: LoginHistoryItem[];
}

function summarizeUA(ua: string): string {
  if (!ua) return "ไม่ทราบอุปกรณ์";
  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser";
  const os =
    /Windows/.test(ua) ? "Windows"
    : /iPhone|iPad|iPod/.test(ua) ? "iOS"
    : /Android/.test(ua) ? "Android"
    : /Mac OS/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : "OS";
  return `${browser} · ${os}`;
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "เมื่อสักครู่";
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d} วันที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH");
}

export function SecuritySection(): React.ReactNode {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<LoginHistory | null>(null);
  const [loadingS, setLoadingS] = useState(true);
  const [loadingH, setLoadingH] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingS(true);
    try {
      const data = await api.get<Session[]>("/me/sessions");
      setSessions(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "โหลด session ไม่สำเร็จ");
    } finally {
      setLoadingS(false);
    }
  }, [toast]);

  const loadHistory = useCallback(async () => {
    setLoadingH(true);
    try {
      const data = await api.get<LoginHistory>("/me/login-history?page=1&pageSize=10");
      setHistory(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "โหลดประวัติไม่สำเร็จ");
    } finally {
      setLoadingH(false);
    }
  }, [toast]);

  useEffect(() => { loadSessions(); loadHistory(); }, [loadSessions, loadHistory]);

  async function revoke(id: string) {
    setRevoking(id);
    try {
      await api.delete(`/me/sessions/${id}`);
      toast.success("เพิกถอนสำเร็จ");
      await loadSessions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "เพิกถอนไม่สำเร็จ");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAll() {
    if (!confirm("ออกจากระบบในอุปกรณ์อื่นทั้งหมด? Session ปัจจุบันจะยังใช้งานได้")) return;
    setRevokingAll(true);
    try {
      await api.post<{ revokedCount: number; message: string }>("/me/sessions/revoke-others", {});
      toast.success("ออกจากระบบในอุปกรณ์อื่นเรียบร้อย");
      await loadSessions();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setRevokingAll(false);
    }
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <>
      <section>
        <SectionHeader title="อุปกรณ์ที่เข้าใช้งาน" variant="bar" />
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-500">
              {sessions.length === 0 && !loadingS ? "ไม่มี session ใช้งานอยู่" :
                `${sessions.length} session — ${otherCount} อุปกรณ์อื่นนอกจากเครื่องนี้`}
            </p>
            {otherCount > 0 && (
              <button
                type="button"
                onClick={revokeAll}
                disabled={revokingAll}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                ออกจากระบบในอุปกรณ์อื่นทั้งหมด
              </button>
            )}
          </div>
          {loadingS ? (
            <div className="p-5 space-y-3 animate-pulse">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-lg" />
              ))}
            </div>
          ) : sessions.length === 0 ? null : (
            <ul className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <li key={s.id} className="p-5 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {summarizeUA(s.userAgent)}
                      </span>
                      {s.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          เครื่องนี้
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {s.ipAddress || "ไม่ทราบ IP"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ใช้งานล่าสุด {s.lastUsedAt ? fmtRelative(s.lastUsedAt) : `เริ่ม ${fmtRelative(s.createdAt)}`}
                      {" · หมดอายุ "}
                      {new Date(s.expiresAt).toLocaleDateString("th-TH")}
                    </p>
                  </div>
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revoke(s.id)}
                      disabled={revoking === s.id}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {revoking === s.id ? "..." : "เพิกถอน"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-2">
          <SectionHeader title="ประวัติการเข้าสู่ระบบ" variant="bar" />
          <a
            href="/dashboard/activity"
            className="text-xs font-semibold text-(--primary) hover:underline mb-2 whitespace-nowrap"
          >
            ดูประวัติการใช้งานทั้งหมด →
          </a>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loadingH ? (
            <div className="p-5 space-y-2 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-slate-50 rounded" />
              ))}
            </div>
          ) : !history || history.items.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 text-center">ยังไม่มีบันทึกการเข้าสู่ระบบ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2.5">เวลา</th>
                    <th className="text-left px-4 py-2.5">อุปกรณ์</th>
                    <th className="text-left px-4 py-2.5">IP</th>
                    <th className="text-left px-4 py-2.5">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{summarizeUA(row.userAgent)}</td>
                      <td className="px-4 py-2 font-mono text-xs text-slate-500">{row.ipAddress}</td>
                      <td className="px-4 py-2">
                        {row.isSuccess ? (
                          <span className="text-xs font-semibold text-emerald-700">สำเร็จ</span>
                        ) : (
                          <span className="text-xs text-red-600">
                            ไม่สำเร็จ
                            {row.failureReason && (
                              <span className="text-slate-400 ml-1">({row.failureReason})</span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.totalCount > history.items.length && (
                <p className="px-4 py-3 text-xs text-slate-400 border-t border-slate-100 text-center">
                  แสดง {history.items.length} รายการล่าสุด — ทั้งหมด {history.totalCount}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
