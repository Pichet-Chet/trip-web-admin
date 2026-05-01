"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormTextarea, Modal, SectionHeader, ConfirmDialog, useToast } from "@/components/shared";
import { NotificationPreferencesSection } from "@/components/notification-preferences-section";
import { SecuritySection } from "@/components/security-section";
import { api, ApiError } from "@/lib/api";
import { getUser, logout, type UserInfo } from "@/lib/auth";

export default function SettingsPage(): React.ReactNode {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserInfo | null>(null);
  useEffect(() => {
    setUser(getUser());
  }, []);

  // Change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleChangePassword() {
    setPwError("");
    if (!oldPassword || !newPassword) {
      setPwError("กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("รหัสผ่านยืนยันไม่ตรงกัน");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/admin/me/change-password", {
        oldPassword,
        newPassword,
      });
      toast("เปลี่ยนรหัสผ่านเรียบร้อย", "success");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setPwSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const data = await api.get<unknown>("/admin/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tripapp-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast("ส่งออกข้อมูลเรียบร้อย", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "ส่งออกข้อมูลไม่สำเร็จ", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("กรุณากรอกรหัสผ่านเพื่อยืนยัน");
      return;
    }
    setDeleting(true);
    try {
      await api.delete("/admin/me", {
        password: deletePassword,
        reason: deleteReason.trim() || undefined,
      });
      await logout().catch(() => {});
      toast("ลบบัญชีเรียบร้อย", "success");
      router.push("/login");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "ลบบัญชีไม่สำเร็จ");
      setDeleting(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ตั้งค่าบัญชี</h1>
        <p className="text-slate-500 mt-2 text-sm">จัดการบัญชี รหัสผ่าน และสิทธิ์ข้อมูลส่วนบุคคล (PDPA)</p>
      </div>

      {/* Email (read-only for now — change-email flow not implemented) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <SectionHeader title="อีเมล" variant="bar" />
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-900">{user?.email ?? "—"}</p>
            <p className="text-xs text-slate-400 mt-0.5">อีเมลที่ใช้เข้าสู่ระบบ</p>
          </div>
          <span className="text-xs text-slate-400">การเปลี่ยนอีเมลจะเปิดให้ใช้เร็วๆ นี้</span>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        <SectionHeader title="รหัสผ่าน" variant="bar" />
        <div className="space-y-4">
          <FormInput
            label="รหัสผ่านปัจจุบัน"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <FormInput
            label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <FormInput
            label="ยืนยันรหัสผ่านใหม่"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {pwError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-sm text-red-700">{pwError}</p>
            </div>
          )}
          <button
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="px-6 py-3 bg-(--primary) text-white rounded-xl text-sm font-bold hover:opacity-95 transition-colors disabled:opacity-50"
          >
            {pwSaving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </button>
        </div>
      </div>

      <SecuritySection />

      <NotificationPreferencesSection />

      {/* Export Data — PDPA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <SectionHeader title="ส่งออกข้อมูล (PDPA)" variant="bar" />
        <p className="text-sm text-slate-500">
          ดาวน์โหลดข้อมูลทั้งหมดของคุณเป็นไฟล์ JSON — บัญชี, บริษัท, ทริป, แพ็กเกจ, ประวัติชำระเงิน
          ตามสิทธิ์ที่บัญญัติใน PDPA / GDPR
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">download</span>
          {exporting ? "กำลังเตรียมไฟล์..." : "ส่งออกข้อมูลทั้งหมด"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 p-6 space-y-4">
        <h3 className="text-lg font-bold text-red-600">ลบบัญชี</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          เมื่อลบบัญชีแล้ว ข้อมูลส่วนตัวของคุณจะถูก anonymize ทันที (ชื่อ, อีเมล, เบอร์โทร)
          ระบบจะคงเฉพาะประวัติทางการเงินและ audit logs เท่านั้นตามกฎหมายบัญชีไทย (5 ปี).
          <strong className="text-red-600"> หากคุณเป็นเจ้าของบริษัทเพียงคนเดียว ต้องโอนความเป็นเจ้าของก่อน</strong>
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
        >
          ลบบัญชีของฉัน
        </button>
      </div>

      {showDelete && (
        <DeleteAccountModal
          onClose={() => { if (!deleting) { setShowDelete(false); setDeletePassword(""); setDeleteReason(""); setDeleteError(""); } }}
          onConfirm={handleDelete}
          password={deletePassword}
          setPassword={setDeletePassword}
          reason={deleteReason}
          setReason={setDeleteReason}
          error={deleteError}
          deleting={deleting}
        />
      )}
    </div>
  );
}

interface DeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  password: string;
  setPassword: (s: string) => void;
  reason: string;
  setReason: (s: string) => void;
  error: string;
  deleting: boolean;
}

function DeleteAccountModal({ onClose, onConfirm, password, setPassword, reason, setReason, error, deleting }: DeleteModalProps): React.ReactNode {
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      blocking={deleting}
      title="ลบบัญชีถาวร?"
      subtitle="ข้อมูลส่วนตัวจะถูก anonymize ทันที — กรุณายืนยันด้วยรหัสผ่าน"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "กำลังลบ..." : "ลบบัญชีถาวร"}
          </button>
        </div>
      }
    >
      <div className="px-6 py-5 space-y-5">
        <FormInput
          label="รหัสผ่าน"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormTextarea
          label="เหตุผล (ไม่บังคับ)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ช่วยให้เราพัฒนาบริการดีขึ้น"
          rows={3}
          maxLength={500}
        />
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
