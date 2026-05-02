"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { FormInput, FormTextarea, LoadingState, ToggleSwitch, useToast } from "@/components/shared";
import { usePageTitle } from "@/lib/hooks/use-page-title";

interface BillingProfile {
  legalName: string;
  taxId: string | null;
  branchCode: string | null;
  address: string | null;
  wantsTaxInvoice: boolean;
  updatedAt: string;
}

export default function BillingProfilePage(): React.ReactNode {
  usePageTitle("ข้อมูลผู้เสียภาษี");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [branchCode, setBranchCode] = useState("00000");
  const [address, setAddress] = useState("");
  const [wants, setWants] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<BillingProfile | null>("/admin/billing/billing-profile")
      .then(p => {
        if (p) {
          setLegalName(p.legalName);
          setTaxId(p.taxId ?? "");
          setBranchCode(p.branchCode ?? "00000");
          setAddress(p.address ?? "");
          setWants(p.wantsTaxInvoice);
          setHasProfile(true);
        }
      })
      .catch((e: ApiError) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!legalName.trim()) next.legalName = "กรุณาระบุชื่อบริษัท";
    if (taxId && !/^\d{13}$/.test(taxId)) next.taxId = "ต้องเป็นตัวเลข 13 หลัก";
    if (branchCode && !/^\d{5}$/.test(branchCode)) next.branchCode = "ต้องเป็นตัวเลข 5 หลัก";
    if (wants && (!taxId || !address.trim())) {
      if (!taxId) next.taxId = next.taxId ?? "จำเป็นเมื่อเปิด ออกใบกำกับภาษี";
      if (!address.trim()) next.address = "จำเป็นเมื่อเปิด ออกใบกำกับภาษี";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put("/admin/billing/billing-profile", {
        legalName: legalName.trim(),
        taxId: taxId.trim() || null,
        branchCode: branchCode.trim() || null,
        address: address.trim() || null,
        wantsTaxInvoice: wants,
      });
      setHasProfile(true);
      toast("บันทึกแล้ว", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "บันทึกไม่สำเร็จ", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/billing" className="inline-flex items-center gap-1 text-xs text-(--on-surface-variant) hover:text-(--primary) mb-2">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          กลับไป Billing
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold text-(--on-surface) tracking-tight">ข้อมูลใบกำกับภาษี</h1>
        <p className="text-(--on-surface-variant) mt-2 text-base md:text-lg">ระบบออกใบเสร็จของเราให้ทุกการชำระเงินอยู่แล้ว — กรอกข้อมูลภาษีเพื่อให้ใบเสร็จเป็นใบกำกับภาษีที่นำไปใช้เครดิตภาษีได้</p>
      </div>

      <section className="bg-white rounded-2xl border border-(--surface-container-high) shadow-sm p-6 md:p-8 space-y-5">
        {/* Toggle — opt-in */}
        <div className="bg-(--primary-container)/40 border border-(--primary-container) rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="material-symbols-outlined text-(--primary) mt-0.5">receipt_long</span>
            <div>
              <p className="font-bold text-(--on-surface) text-sm">ขอใบกำกับภาษี (แทนใบเสร็จปกติ)</p>
              <p className="text-xs text-(--on-surface-variant) mt-1">เปิดเมื่อบริษัทคุณจด VAT และต้องการ TIN/สาขาแสดงในเอกสารเพื่อยื่นเครดิตภาษีซื้อ</p>
            </div>
          </div>
          <ToggleSwitch
            checked={wants}
            onChange={setWants}
            ariaLabel="เปิด/ปิด ขอใบกำกับภาษี"
          />
        </div>

        {/* Form */}
        <FormInput
          label="ชื่อบริษัทตามทะเบียน"
          required
          error={errors.legalName}
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          maxLength={256}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <FormInput
              label="เลขประจำตัวผู้เสียภาษี (13 หลัก)"
              error={errors.taxId}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value.replace(/[^\d]/g, ""))}
              maxLength={13}
              inputMode="numeric"
              placeholder="0105500000000"
              className="font-mono"
            />
          </div>
          <FormInput
            label="รหัสสาขา (5 หลัก)"
            error={errors.branchCode}
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.replace(/[^\d]/g, ""))}
            maxLength={5}
            inputMode="numeric"
            hint="00000 = สำนักงานใหญ่"
            className="font-mono"
          />
        </div>

        <FormTextarea
          label="ที่อยู่บริษัท"
          required={wants}
          error={errors.address}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={1024}
          rows={3}
          placeholder="123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110"
        />

        <div className="bg-(--surface-container-low) border border-(--outline-variant)/30 rounded-xl p-3 text-xs text-(--on-surface-variant) leading-relaxed flex items-start gap-2">
          <span className="material-symbols-outlined text-(--outline) text-base mt-0.5">lock</span>
          <span>ข้อมูลนี้ถูกเข้ารหัส AES-256 ก่อนเก็บใน database ตามข้อกำหนด PDPA</span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) text-white rounded-xl font-bold text-sm shadow-lg shadow-(--primary)/20 hover:opacity-95 disabled:opacity-60 cursor-pointer transition-all"
          >
            {saving && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
            {hasProfile ? "บันทึกการเปลี่ยนแปลง" : "บันทึกข้อมูล"}
          </button>
        </div>
      </section>

      {hasProfile && (
        <p className="text-xs text-(--on-surface-variant) text-center">
          ใบกำกับภาษีฉบับเก่าจะใช้ข้อมูลที่บันทึกไว้ก่อนแก้ไข — หากต้องการออกใหม่ด้วยข้อมูลปัจจุบัน ใช้ปุ่ม &quot;ออกใหม่&quot; ในหน้า Billing
        </p>
      )}
    </div>
  );
}
