"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { FormInput, Modal, SectionHeader, useToast } from "@/components/shared";
import { getUser } from "@/lib/auth";

interface PendingResponse {
  pendingEmail: string | null;
  sentAt: string | null;
}

export function EmailChangeSection(): React.ReactNode {
  const { toast } = useToast();
  const user = getUser();
  const [pending, setPending] = useState<PendingResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<PendingResponse>("/admin/me/email/pending");
      setPending(res);
    } catch { /* swallow */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const msg = await api.post<string>("/admin/me/email/request-change", { password, newEmail: newEmail.trim() });
      toast(typeof msg === "string" ? msg : "ส่งลิงก์ยืนยันแล้ว", "success");
      setOpen(false);
      setPassword("");
      setNewEmail("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function cancelPending() {
    if (!confirm("ยกเลิกคำขอเปลี่ยนอีเมล?")) return;
    try {
      await api.post("/admin/me/email/cancel-change", {});
      toast("ยกเลิกแล้ว", "success");
      await load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ยกเลิกไม่สำเร็จ", "error");
    }
  }

  return (
    <section>
      <SectionHeader title="อีเมล" variant="bar" />
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-900">{user?.email ?? "—"}</p>
            <p className="text-xs text-slate-400 mt-0.5">อีเมลที่ใช้เข้าสู่ระบบ</p>
          </div>
          {!pending?.pendingEmail && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              เปลี่ยนอีเมล
            </button>
          )}
        </div>

        {pending?.pendingEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 mt-0.5">schedule</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">รอยืนยันการเปลี่ยนอีเมล</p>
              <p className="text-xs text-amber-800 mt-0.5">
                ส่งลิงก์ยืนยันไปยัง <strong>{pending.pendingEmail}</strong> แล้ว — กรุณาเปิดอีเมลและกดลิงก์
                {pending.sentAt && (
                  <span className="text-amber-700"> (ส่งเมื่อ {new Date(pending.sentAt).toLocaleString("th-TH")})</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelPending}
              className="text-xs font-semibold text-red-600 hover:underline shrink-0"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        size="md"
        title="เปลี่ยนอีเมล"
        subtitle="ส่งลิงก์ยืนยันไปยังอีเมลใหม่ — session ทุกเครื่องจะ logout หลังเปลี่ยนสำเร็จ"
        blocking={busy}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy || !newEmail || !password}
              className="flex-1 py-3 bg-(--primary) text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "กำลังส่ง..." : "ส่งลิงก์ยืนยัน"}
            </button>
          </div>
        }
      >
        <div className="px-6 py-5 space-y-4">
          <FormInput
            label="อีเมลใหม่"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            autoFocus
          />
          <FormInput
            label="รหัสผ่านปัจจุบัน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
