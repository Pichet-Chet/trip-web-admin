"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { ErrorState, LoadingState, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface ExportPayload {
  generatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    createdAt: string;
  };
  companies: {
    id: string;
    name: string;
    tier: string;
    phone: string | null;
    lineId: string | null;
    role: string;
    joinedAt: string;
  }[];
  trips: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    publishedAt: string | null;
  }[];
  posts: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }[];
  payments: {
    id: string;
    planCode: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
}

export default function MyDataPage(): React.ReactNode {
  const { toast } = useToast();
  const [data, setData] = useState<ExportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle("ข้อมูลของฉัน");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ExportPayload>("/admin/me/export");
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function downloadJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripapp-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("ดาวน์โหลดข้อมูลเรียบร้อย", "success");
  }

  if (loading) return <LoadingState message="กำลังรวบรวมข้อมูลของคุณ..." />;
  if (error || !data) return <ErrorState message={error ?? "ไม่พบข้อมูล"} onRetry={load} />;

  const tripsByStatus = groupBy(data.trips, (t) => t.status);
  const postsByStatus = groupBy(data.posts, (p) => p.status);
  const totalSpent = data.payments
    .filter((p) => p.status === "succeeded" || p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const currency = data.payments[0]?.currency ?? "THB";

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-(--on-surface) tracking-tight">ข้อมูลของฉัน</h1>
          <p className="text-(--on-surface-variant) mt-2 text-sm">
            สรุปข้อมูลทั้งหมดที่ TripApp เก็บเกี่ยวกับคุณ — สิทธิ์ตาม PDPA มาตรา 30
          </p>
        </div>
        <button
          type="button"
          onClick={downloadJson}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-(--primary) text-white text-sm font-semibold hover:brightness-110"
        >
          <span className="material-symbols-outlined text-base">download</span>
          ดาวน์โหลด JSON
        </button>
      </div>

      <p className="text-xs text-(--outline)">
        สร้างเมื่อ {new Date(data.generatedAt).toLocaleString("th-TH")}
      </p>

      <Block icon="person" title="ข้อมูลบัญชี">
        <Field label="อีเมล" value={data.user.email} />
        <Field label="ชื่อ-นามสกุล" value={`${data.user.firstName} ${data.user.lastName}`} />
        <Field label="ยืนยันอีเมล" value={data.user.isEmailVerified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"} />
        <Field label="สมัครเมื่อ" value={new Date(data.user.createdAt).toLocaleString("th-TH")} />
        <Field label="User ID" value={<code className="text-xs">{data.user.id}</code>} mono />
      </Block>

      <Block icon="business" title={`บริษัท / ทีม (${data.companies.length})`}>
        {data.companies.length === 0 ? (
          <p className="text-sm text-(--outline)">ไม่มี</p>
        ) : (
          <div className="space-y-3 -mx-1">
            {data.companies.map((c) => (
              <div key={c.id} className="px-3 py-2.5 bg-(--surface-container-low) rounded-lg">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="font-semibold text-(--on-surface) text-sm">{c.name}</p>
                  <span className="text-xs font-bold text-(--primary) uppercase">{c.tier}</span>
                  <span className="text-xs text-(--on-surface-variant)">บทบาท: {c.role}</span>
                </div>
                <p className="text-xs text-(--outline) mt-1">
                  {c.phone && <>โทร {c.phone} · </>}
                  {c.lineId && <>LINE {c.lineId} · </>}
                  เข้าร่วม {new Date(c.joinedAt).toLocaleDateString("th-TH")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Block>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Block icon="flight_takeoff" title="ทริปที่สร้าง">
          <Stat label="ทั้งหมด" value={data.trips.length.toLocaleString()} />
          {Object.entries(tripsByStatus).map(([status, list]) => (
            <Stat key={status} label={status} value={list.length.toLocaleString()} />
          ))}
        </Block>

        <Block icon="article" title="โพสต์ Marketplace">
          <Stat label="ทั้งหมด" value={data.posts.length.toLocaleString()} />
          {Object.entries(postsByStatus).map(([status, list]) => (
            <Stat key={status} label={status} value={list.length.toLocaleString()} />
          ))}
        </Block>
      </div>

      <Block icon="payments" title={`ประวัติชำระเงิน (${data.payments.length})`}>
        {data.payments.length === 0 ? (
          <p className="text-sm text-(--outline)">ยังไม่มีรายการ</p>
        ) : (
          <>
            <Stat label="ยอดชำระสำเร็จรวม" value={`${totalSpent.toLocaleString()} ${currency}`} />
            <div className="mt-3 -mx-1 max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-(--surface-container-low) text-(--on-surface-variant)">
                  <tr>
                    <th className="text-left px-3 py-2">วันที่</th>
                    <th className="text-left px-3 py-2">แพ็กเกจ</th>
                    <th className="text-right px-3 py-2">ยอดเงิน</th>
                    <th className="text-left px-3 py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--outline-variant)/20">
                  {data.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-1.5">{new Date(p.createdAt).toLocaleDateString("th-TH")}</td>
                      <td className="px-3 py-1.5 font-mono">{p.planCode}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{p.amount.toLocaleString()} {p.currency}</td>
                      <td className="px-3 py-1.5">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Block>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
        <p className="font-bold mb-1">หมายเหตุ:</p>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>ข้อมูล Sensitive (เบอร์โทร, LINE ID, IP address ในประวัติ) ถูกเข้ารหัส AES-256 ใน database</li>
          <li>หน้านี้คือสรุปสำหรับดู — ไฟล์ JSON ที่ดาวน์โหลดประกอบด้วยข้อมูลครบถ้วนตามที่ระบบเก็บ</li>
          <li>ตามมาตรา 32 PDPA หากต้องการแก้ไข/ลบข้อมูล ติดต่อ <a className="underline" href="mailto:dpo@tripapp.co">dpo@tripapp.co</a></li>
        </ul>
      </div>
    </div>
  );
}

function Block({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-(--outline-variant)/30 overflow-hidden">
      <div className="px-5 py-3 border-b border-(--outline-variant)/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-(--on-surface-variant) text-lg">{icon}</span>
        <h2 className="text-sm font-bold text-(--on-surface)">{title}</h2>
      </div>
      <div className="p-5 space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 flex-wrap">
      <span className="text-xs text-(--on-surface-variant)">{label}</span>
      <span className={`text-sm text-(--on-surface) ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-xs text-(--on-surface-variant)">{label}</span>
      <span className="text-base font-bold text-(--on-surface) tabular-nums">{value}</span>
    </div>
  );
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
