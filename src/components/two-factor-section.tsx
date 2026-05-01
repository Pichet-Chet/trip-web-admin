"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { api, ApiError } from "@/lib/api";
import { FormInput, Modal, SectionHeader, useToast } from "@/components/shared";

interface Status {
  isEnabled: boolean;
  enabledAt: string | null;
  remainingBackupCodes: number;
}

interface SetupInit {
  secret: string;
  otpAuthUri: string;
}

type Mode = "idle" | "setup" | "showCodes" | "disable" | "regen";

export function TwoFactorSection(): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("idle");
  const [setupData, setSetupData] = useState<SetupInit | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Status>("/admin/me/2fa/status");
      setStatus(res);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "โหลด 2FA status ไม่สำเร็จ", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  function reset() {
    setMode("idle");
    setSetupData(null);
    setQrDataUrl(null);
    setCode("");
    setPassword("");
    setError(null);
    setBackupCodes(null);
  }

  async function startSetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<SetupInit>("/admin/me/2fa/setup-init", {});
      setSetupData(res);
      const dataUrl = await QRCode.toDataURL(res.otpAuthUri, { margin: 1, width: 220 });
      setQrDataUrl(dataUrl);
      setMode("setup");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เริ่มตั้งค่าไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
    }
  }

  async function verifySetup() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ backupCodes: string[] }>("/admin/me/2fa/setup-verify", { code });
      setBackupCodes(res.backupCodes);
      setMode("showCodes");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "รหัสไม่ถูกต้อง");
    } finally {
      setBusy(false);
    }
  }

  async function disable2FA() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/me/2fa/disable", { password, code });
      toast("ปิดใช้งาน 2FA เรียบร้อย", "success");
      reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ปิดใช้งานไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ backupCodes: string[] }>("/admin/me/2fa/backup-codes/regenerate", { code });
      setBackupCodes(res.backupCodes);
      setMode("showCodes");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "สร้างใหม่ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function downloadCodes() {
    if (!backupCodes) return;
    const content =
      "TripApp 2FA Backup Codes\n" +
      "========================\n" +
      `สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}\n\n` +
      "เก็บไว้ในที่ปลอดภัย (เช่น Password Manager) — แต่ละรหัสใช้ได้เพียง 1 ครั้ง\n\n" +
      backupCodes.map((c, i) => `${(i + 1).toString().padStart(2)}. ${c}`).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripapp-2fa-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <SectionHeader title="ยืนยันตัวตน 2 ขั้นตอน (2FA)" variant="bar" />
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6">
        {loading || !status ? (
          <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
        ) : status.isEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <p className="text-sm font-bold text-emerald-700">เปิดใช้งานอยู่</p>
              {status.enabledAt && (
                <span className="text-xs text-slate-400">
                  ตั้งแต่ {new Date(status.enabledAt).toLocaleDateString("th-TH")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              บัญชีคุณถูกปกป้องด้วยรหัส 6 หลักจาก authenticator app
              ทุกครั้งที่เข้าสู่ระบบจะต้องป้อนรหัสนี้
            </p>
            <p className="text-xs text-slate-500">
              รหัสสำรองคงเหลือ <strong className="text-slate-800">{status.remainingBackupCodes}/8</strong> รหัส
              {status.remainingBackupCodes <= 2 && (
                <span className="text-amber-600 ml-1">— ใกล้หมดแล้ว แนะนำให้สร้างใหม่</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("regen")}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                สร้างรหัสสำรองใหม่
              </button>
              <button
                type="button"
                onClick={() => setMode("disable")}
                className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                ปิดใช้งาน 2FA
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              เพิ่มความปลอดภัยให้บัญชีด้วยรหัสยืนยันจากแอป Authenticator
              (Google Authenticator, Authy, 1Password, ฯลฯ)
            </p>
            <ul className="text-xs text-slate-500 list-disc ml-5 space-y-0.5">
              <li>รหัสเปลี่ยนทุก 30 วินาที — แม้ password รั่ว แฮกเกอร์ก็เข้าระบบไม่ได้</li>
              <li>มีรหัสสำรอง 8 ชุดให้ใช้กรณีมือถือหาย</li>
            </ul>
            <button
              type="button"
              onClick={startSetup}
              disabled={busy}
              className="px-5 py-2.5 rounded-lg bg-(--primary) text-white text-sm font-semibold hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "..." : "เปิดใช้งาน 2FA"}
            </button>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      <Modal
        open={mode === "setup"}
        onClose={() => !busy && reset()}
        size="md"
        title="ตั้งค่า 2FA"
      >
        {setupData && qrDataUrl && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              <strong>ขั้นที่ 1:</strong> สแกน QR code ด้วยแอป Authenticator
            </p>
            <div className="flex justify-center bg-white border border-slate-200 rounded-xl p-4">
              <img src={qrDataUrl} alt="2FA QR" className="w-48 h-48" />
            </div>
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-700">หรือป้อนรหัสด้วยมือ</summary>
              <p className="mt-2 font-mono break-all bg-slate-50 p-2 rounded">{setupData.secret}</p>
            </details>
            <p className="text-sm text-slate-700 mt-3">
              <strong>ขั้นที่ 2:</strong> ป้อนรหัส 6 หลักจากแอปเพื่อยืนยัน
            </p>
            <FormInput
              label="รหัส 6 หลัก"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={verifySetup}
                disabled={busy || code.length !== 6}
                className="px-4 py-2 rounded-lg bg-(--primary) text-white font-semibold disabled:opacity-50"
              >
                {busy ? "กำลังยืนยัน..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        open={mode === "showCodes"}
        onClose={reset}
        size="md"
        title="รหัสสำรอง"
        blocking
      >
        {backupCodes && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
              <strong>สำคัญ:</strong> เก็บรหัสเหล่านี้ไว้ในที่ปลอดภัย —
              แต่ละรหัสใช้ได้เพียง 1 ครั้ง ใช้แทน TOTP เมื่อมือถือไม่อยู่ <br />
              <strong>รหัสนี้จะแสดงเพียงครั้งเดียว</strong> หากปิดหน้าต่างจะไม่สามารถดูได้อีก
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-50 rounded-lg p-3">
              {backupCodes.map((c, i) => (
                <div key={i} className="px-2 py-1 bg-white rounded text-slate-800 text-center tracking-wider">
                  {c}
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={downloadCodes}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-base align-middle mr-1">download</span>
                ดาวน์โหลด .txt
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-(--primary) text-white font-semibold"
              >
                เก็บไว้แล้ว — ปิด
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Disable Modal */}
      <Modal
        open={mode === "disable"}
        onClose={() => !busy && reset()}
        size="sm"
        title="ปิดใช้งาน 2FA"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            การปิด 2FA จะลดความปลอดภัยของบัญชี — กรุณาป้อนรหัสผ่านและรหัส 2FA ปัจจุบันเพื่อยืนยัน
          </p>
          <FormInput label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormInput
            label="รหัส 2FA (6 หลัก)"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={reset} disabled={busy} className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100">ยกเลิก</button>
            <button
              type="button"
              onClick={disable2FA}
              disabled={busy || !password || code.length !== 6}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
            >
              {busy ? "..." : "ปิดใช้งาน"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Regenerate Modal */}
      <Modal
        open={mode === "regen"}
        onClose={() => !busy && reset()}
        size="sm"
        title="สร้างรหัสสำรองใหม่"
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            รหัสเก่าจะถูกยกเลิกทั้งหมด — ป้อนรหัส 2FA ปัจจุบันเพื่อยืนยัน
          </p>
          <FormInput
            label="รหัส 2FA (6 หลัก)"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={reset} disabled={busy} className="px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100">ยกเลิก</button>
            <button
              type="button"
              onClick={regenerate}
              disabled={busy || code.length !== 6}
              className="px-4 py-2 rounded-lg bg-(--primary) text-white font-semibold disabled:opacity-50"
            >
              {busy ? "..." : "สร้างใหม่"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
