"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { SectionHeader, ToggleSwitch, useToast } from "@/components/shared";

interface CategoryDto {
  code: string;
  labelTh: string;
  description: string;
  channels: Record<string, boolean>;
}

interface PreferencesResponse {
  availableChannels: string[];
  categories: CategoryDto[];
}

const CHANNEL_LABEL: Record<string, string> = {
  email: "อีเมล",
  line: "LINE",
  web_push: "Web Push",
};

const CHANNEL_ICON: Record<string, string> = {
  email: "mail",
  line: "chat",
  web_push: "notifications",
};

export function NotificationPreferencesSection(): React.ReactNode {
  const { toast } = useToast();
  const [data, setData] = useState<PreferencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PreferencesResponse>("/me/notification-preferences");
      setData(res);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "โหลดไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  function setLocal(category: string, channel: string, enabled: boolean) {
    setData((prev) => prev && {
      ...prev,
      categories: prev.categories.map((c) =>
        c.code === category ? { ...c, channels: { ...c.channels, [channel]: enabled } } : c
      ),
    });
  }

  async function save(category: string, channel: string, enabled: boolean) {
    if (saving) return;
    setLocal(category, channel, enabled);
    setSaving(true);
    try {
      await api.put("/me/notification-preferences", {
        items: [{ category, channel, enabled }],
      });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "บันทึกไม่สำเร็จ", "error");
      setLocal(category, channel, !enabled); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <SectionHeader title="การแจ้งเตือน" variant="bar" />
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
        <p className="text-xs text-slate-500 mb-4">
          เลือกช่องทางที่ต้องการรับการแจ้งเตือนแต่ละประเภท
          <span className="ml-1 text-slate-400">— อีเมลความปลอดภัยจะเปิดอยู่เสมอเพื่อความปลอดภัยของบัญชี</span>
        </p>

        {loading || !data ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-2 py-3 font-semibold">ประเภท</th>
                  {data.availableChannels.map((ch) => (
                    <th key={ch} className="px-2 py-3 font-semibold text-center w-24">
                      <span className="material-symbols-outlined text-slate-400 text-base align-middle mr-1">{CHANNEL_ICON[ch] ?? "circle"}</span>
                      {CHANNEL_LABEL[ch] ?? ch}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.categories.map((cat) => (
                  <tr key={cat.code}>
                    <td className="px-2 py-3 align-top">
                      <p className="font-semibold text-slate-800">{cat.labelTh}</p>
                      <p className="text-xs text-slate-400 mt-0.5 max-w-md">{cat.description}</p>
                    </td>
                    {data.availableChannels.map((ch) => {
                      const isLocked = cat.code === "security" && ch === "email";
                      return (
                        <td key={ch} className="px-2 py-3 text-center align-top">
                          <div className="flex justify-center">
                            <ToggleSwitch
                              checked={cat.channels[ch] ?? false}
                              onChange={(v) => !isLocked && save(cat.code, ch, v)}
                              disabled={isLocked}
                              ariaLabel={`${cat.labelTh} - ${CHANNEL_LABEL[ch] ?? ch}`}
                            />
                          </div>
                          {isLocked && (
                            <p className="text-[10px] text-slate-400 mt-1">บังคับเปิด</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
