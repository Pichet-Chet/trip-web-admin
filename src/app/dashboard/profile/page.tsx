"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FormInput, FormTextarea, ImageUpload, PageSkeleton, SectionHeader, ToggleSwitch, useToast } from "@/components/shared";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { api, ApiError } from "@/lib/api";
import { usePageTitle } from "@/lib/hooks/use-page-title";

type AccountType = "company" | "freelance" | "personal";

interface CompanyData {
  id: string;
  name: string;
  accountType: string;
  logoUrl: string | null;
  phone: string | null;
  lineId: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  tatLicense: string | null;
  portfolioEnabled: boolean;
  portfolioSlug: string | null;
  portfolioBio: string | null;
  tier: string;
  tripQuotaUsed: number;
}

interface UsageSummary {
  tier: string | null;
  tripQuotaUsed: number;
  tripQuotaLimit: number;
  remainingTrips: number;
  hasActiveSubscription: boolean;
}

interface FormState {
  name: string;
  accountType: AccountType;
  logoUrl: string | null;
  phone: string;
  lineId: string;
  facebookUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  tatLicense: string;
  portfolioEnabled: boolean;
  portfolioSlug: string;
  portfolioBio: string;
}

const accountTypes: { value: AccountType; label: string; desc: string; icon: string }[] = [
  { value: "company",   label: "บริษัททัวร์",   desc: "มีใบอนุญาต ททท. และทีมงาน",  icon: "business" },
  { value: "freelance", label: "ไกด์ฟรีแลนซ์", desc: "ไกด์อิสระ รับจัดทริปเอง",       icon: "person" },
  { value: "personal",  label: "ส่วนตัว",       desc: "ทำแพลนทริปแชร์ให้เพื่อน",      icon: "favorite" },
];

const TIER_LABEL: Record<string, string> = {
  free: "Free",
  per_trip: "จ่ายต่อทริป",
  pack_5: "แพ็ค 5 ทริป",
  subscription: "Subscription",
};

const EMPTY_FORM: FormState = {
  name: "",
  accountType: "company",
  logoUrl: null,
  phone: "",
  lineId: "",
  facebookUrl: "",
  instagramUrl: "",
  websiteUrl: "",
  tatLicense: "",
  portfolioEnabled: false,
  portfolioSlug: "",
  portfolioBio: "",
};

export default function ProfilePage(): React.ReactNode {
  usePageTitle("ข้อมูลบริษัท");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [original, setOriginal] = useState<FormState>(EMPTY_FORM);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [showAccountType, setShowAccountType] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<CompanyData>("/admin/company"),
      api.get<UsageSummary>("/admin/usage").catch(() => null),
    ]).then(([data, u]) => {
      const next: FormState = {
        name: data.name,
        accountType: (data.accountType?.toLowerCase() || "company") as AccountType,
        logoUrl: data.logoUrl,
        phone: data.phone || "",
        lineId: data.lineId || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        websiteUrl: data.websiteUrl || "",
        tatLicense: data.tatLicense || "",
        portfolioEnabled: data.portfolioEnabled,
        portfolioSlug: data.portfolioSlug || "",
        portfolioBio: data.portfolioBio || "",
      };
      setForm(next);
      setOriginal(next);
      if (u) setUsage(u);
      setLoading(false);
    });
  }, []);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);
  const isCompany = form.accountType === "company";
  const isPersonal = form.accountType === "personal";

  // Block accidental navigation while there are unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Profile completeness — counts filled-in fields among the relevant set.
  const completeness = useMemo(() => {
    const checks: boolean[] = [
      !!form.name,
      !!form.logoUrl,
      !!form.phone,
      !!form.lineId,
      !!(form.facebookUrl || form.instagramUrl || form.websiteUrl),
    ];
    if (!isPersonal) checks.push(!!form.tatLicense);
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length, pct: Math.round((done / checks.length) * 100) };
  }, [form, isPersonal]);

  function validate(): string | null {
    if (isCompany && !form.name.trim()) return "กรุณากรอกชื่อบริษัท";
    if (form.portfolioEnabled) {
      if (!form.portfolioSlug.trim()) return "เปิด Portfolio แล้ว — กรุณาตั้ง slug";
      if (!/^[a-z0-9-]+$/i.test(form.portfolioSlug.trim())) return "Slug ต้องเป็นตัวอักษร a-z, 0-9, หรือ - เท่านั้น";
      if (!form.portfolioBio.trim()) return "เปิด Portfolio แล้ว — กรุณากรอก Bio";
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setSaveError(err); return; }
    setSaving(true);
    setSaveError("");
    try {
      await api.put("/admin/company", {
        name: form.name || undefined,
        accountType: form.accountType,
        phone: form.phone || undefined,
        lineId: form.lineId || undefined,
        facebookUrl: form.facebookUrl || undefined,
        instagramUrl: form.instagramUrl || undefined,
        websiteUrl: form.websiteUrl || undefined,
        tatLicense: form.tatLicense || undefined,
        portfolioEnabled: form.portfolioEnabled,
        portfolioSlug: form.portfolioSlug || undefined,
        portfolioBio: form.portfolioBio || undefined,
      });
      setOriginal(form);
      toast("บันทึกสำเร็จ", "success");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setForm(original);
    setSaveError("");
  }

  if (loading) return <PageSkeleton />;

  const currentAccountType = accountTypes.find((t) => t.value === form.accountType) ?? accountTypes[0];

  return (
    <div className="p-4 md:p-8 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ข้อมูลบริษัท</h1>
          <p className="text-slate-500 mt-1 text-sm">ข้อมูลนี้แสดงบนหน้าทริปและลิงก์ที่แชร์ให้ผู้ร่วมเดินทาง</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">ความสมบูรณ์</span>
          <div className="w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all ${completeness.pct >= 80 ? "bg-emerald-500" : completeness.pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
              style={{ width: `${completeness.pct}%` }}
            />
          </div>
          <span className="font-bold text-slate-700 tabular-nums">{completeness.pct}%</span>
        </div>
      </div>

      {/* Identity strip — account type + plan + quota in one place */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account type — visible + editable inline */}
          <div className="flex items-center justify-between gap-3 md:border-r md:border-slate-100 md:pr-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                form.accountType === "company" ? "bg-blue-50 text-blue-600"
                  : form.accountType === "freelance" ? "bg-violet-50 text-violet-600"
                  : "bg-rose-50 text-rose-600"
              }`}>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{currentAccountType.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">ประเภทบัญชี</p>
                <p className="text-base font-bold text-slate-900">{currentAccountType.label}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAccountType((v) => !v)}
              className="text-xs font-semibold text-(--primary) hover:underline whitespace-nowrap shrink-0"
            >
              {showAccountType ? "ปิด" : "เปลี่ยน"}
            </button>
          </div>

          {/* Plan + quota */}
          {usage ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-(--primary-container) flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-(--primary)" style={{ fontVariationSettings: "'FILL' 1" }}>card_membership</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">แพลน · ใช้ทริป</p>
                  <p className="text-base font-bold text-slate-900">
                    {TIER_LABEL[usage.tier ?? "free"] ?? usage.tier ?? "Free"}
                    <span className="ml-2 text-slate-400 font-medium tabular-nums">{usage.tripQuotaUsed}/{usage.hasActiveSubscription ? "∞" : usage.tripQuotaLimit}</span>
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/usage"
                className="text-xs font-semibold text-(--primary) hover:underline whitespace-nowrap shrink-0"
              >
                รายละเอียด →
              </Link>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Account type selector — expanded inline */}
        {showAccountType && (
          <div className="border-t border-slate-100 p-4 md:p-5 bg-slate-50/50">
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              ⚠️ การเปลี่ยนประเภทบัญชีจะเปลี่ยนข้อมูลที่ระบบขอ (เช่น ใบอนุญาต ททท., ทีมงาน) — กดบันทึกเพื่อยืนยัน
            </p>
            <div role="radiogroup" aria-label="ประเภทบัญชี" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {accountTypes.map((t, idx) => {
                const selected = form.accountType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setForm((p) => ({ ...p, accountType: t.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                        e.preventDefault();
                        const next = accountTypes[(idx + 1) % accountTypes.length];
                        setForm((p) => ({ ...p, accountType: next.value }));
                      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const prev = accountTypes[(idx - 1 + accountTypes.length) % accountTypes.length];
                        setForm((p) => ({ ...p, accountType: prev.value }));
                      }
                    }}
                    className={`text-left p-3 rounded-xl border-2 transition-all bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/30 ${
                      selected ? "border-(--primary) bg-(--primary-container)/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`material-symbols-outlined text-base leading-none ${selected ? "text-(--primary)" : "text-slate-400"}`}>{t.icon}</span>
                      <p className={`text-sm font-bold ${selected ? "text-(--primary)" : "text-slate-900"}`}>{t.label}</p>
                    </div>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main form card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">

          {/* Profile image */}
          <ImageUpload
            value={form.logoUrl}
            onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
            uploadUrl={`${process.env.NEXT_PUBLIC_API_URL}/admin/company/logo`}
            aspect="square"
            label={isCompany ? "อัปโหลดโลโก้" : "อัปโหลดรูปโปรไฟล์"}
            hint={isCompany ? "แนะนำ: 512x512px PNG หรือ SVG · ไม่เกิน 5MB" : "แนะนำ: รูปหน้าตรง 512x512px · ไม่เกิน 5MB"}
          />

          {/* Info Section */}
          <section className="space-y-5">
            <SectionHeader
              title={isCompany ? "ข้อมูลบริษัท" : isPersonal ? "ข้อมูลส่วนตัว" : "ข้อมูลไกด์"}
              variant="bar"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isCompany && (
                <div className="md:col-span-2">
                  <FormInput label="ชื่อบริษัท" placeholder="เช่น Amazing Tour Co., Ltd." value={form.name} onChange={set("name")} required />
                </div>
              )}
              {!isPersonal && (
                <FormInput label="เลขใบอนุญาต ททท." placeholder="11/XXXXX (ไม่บังคับ)" value={form.tatLicense} onChange={set("tatLicense")} />
              )}
            </div>
          </section>

          {/* Contact Channels */}
          <section className="space-y-5">
            <SectionHeader title="ช่องทางติดต่อ" subtitle="แสดงบนหน้าทริปให้ลูกทริปติดต่อกลับ" variant="bar" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="เบอร์โทรศัพท์" placeholder="+66 81 234 5678" type="tel" icon="call" value={form.phone} onChange={set("phone")} />
              <FormInput label="LINE ID" placeholder="@yourlineid" icon="forum" value={form.lineId} onChange={set("lineId")} />
              <FormInput label="Facebook Page" placeholder="https://fb.com/yourpage" icon="public" value={form.facebookUrl} onChange={set("facebookUrl")} />
              <FormInput label="Instagram" placeholder="https://instagram.com/yourbrand" icon="public" value={form.instagramUrl} onChange={set("instagramUrl")} />
              <div className="md:col-span-2">
                <FormInput label="เว็บไซต์" placeholder="https://yourwebsite.com" icon="language" value={form.websiteUrl} onChange={set("websiteUrl")} />
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Team Section */}
      {!isPersonal && <TeamSection />}

      {/* Portfolio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Portfolio สาธารณะ</h3>
            <p className="text-xs text-slate-400 mt-0.5">หน้าแสดงผลงานทริปทั้งหมดของคุณ</p>
          </div>
          <ToggleSwitch
            checked={form.portfolioEnabled}
            onChange={(next) => setForm((p) => ({ ...p, portfolioEnabled: next }))}
            ariaLabel="เปิด/ปิด Portfolio สาธารณะ"
          />
        </div>
        {form.portfolioEnabled && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-sm text-slate-500 truncate flex-1 font-mono">tripapp.co/g/{form.portfolioSlug || "your-slug"}</span>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(`tripapp.co/g/${form.portfolioSlug}`); toast("คัดลอกลิงก์แล้ว"); }}
                disabled={!form.portfolioSlug}
                className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                คัดลอก
              </button>
            </div>
            <FormInput
              label="Slug"
              required
              value={form.portfolioSlug}
              onChange={set("portfolioSlug")}
              placeholder="your-company-name"
              hint="ตัวอักษร a-z, 0-9, หรือ - เท่านั้น"
            />
            <FormTextarea
              label="Bio"
              required
              value={form.portfolioBio}
              onChange={(e) => setForm((p) => ({ ...p, portfolioBio: e.target.value }))}
              placeholder="เล่าสั้นๆ เกี่ยวกับตัวคุณหรือบริษัท"
              rows={3}
              maxLength={1024}
              hint={`${form.portfolioBio.length}/1024`}
            />
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 z-40 bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <span className="material-symbols-outlined text-lg leading-none">edit_note</span>
              <span className="font-semibold">มีการแก้ไขที่ยังไม่บันทึก</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-all ${
                  saving
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-(--primary) text-white shadow-md shadow-(--primary)/25 hover:brightness-110 active:scale-95"
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-500 rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base leading-none">check</span>
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
          {saveError && (
            <div className="px-4 md:px-8 pb-3 -mt-1">
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">error</span>
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === Team Section Component ===

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
}

function formatExpiresIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "หมดอายุแล้ว";
  const day = Math.floor(ms / (24 * 3600 * 1000));
  if (day >= 1) return `หมดอายุใน ${day} วัน`;
  const hr = Math.floor(ms / (3600 * 1000));
  return `หมดอายุใน ${hr} ชม.`;
}

function TeamSection(): React.ReactNode {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [invite, setInvite] = useState({ email: "", role: "Editor" });

  useEffect(() => {
    api.get<TeamMember[]>("/admin/company/team").then(setMembers).catch(() => {});
    api.get<PendingInvite[]>("/admin/company/team/invites").then(setPendingInvites).catch(() => {});
  }, []);

  async function handleInvite() {
    setInviteError("");
    if (!invite.email) { setInviteError("กรุณากรอกอีเมล"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) { setInviteError("รูปแบบอีเมลไม่ถูกต้อง"); return; }
    setInviting(true);
    try {
      const inv = await api.post<PendingInvite>("/admin/company/team/invite", invite);
      setPendingInvites((prev) => [inv, ...prev]);
      setShowInvite(false);
      setInvite({ email: "", role: "Editor" });
      toast("ส่งคำเชิญแล้ว", "success");
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvite(id: string) {
    try {
      await api.delete(`/admin/company/team/invite/${id}`);
      setPendingInvites((prev) => prev.filter((i) => i.id !== id));
      toast("ยกเลิกคำเชิญสำเร็จ", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  async function handleRemove(id: string, name: string) {
    const ok = await confirm({
      title: "ลบสมาชิกออกจากทีม?",
      description: `${name} จะไม่สามารถเข้าถึงทริปและข้อมูลของทีมอีก`,
      confirmLabel: "ลบ",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/company/team/${id}`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast("ลบสมาชิกสำเร็จ", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">ทีมงาน</h3>
          <p className="text-xs text-slate-400 mt-0.5">เชิญสมาชิกเพื่อแบ่งปันการจัดการทริป</p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(!showInvite)}
          className="text-sm font-semibold text-(--primary) hover:bg-(--primary-container)/40 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base leading-none">{showInvite ? "close" : "person_add"}</span>
          {showInvite ? "ยกเลิก" : "เชิญ"}
        </button>
      </div>

      {showInvite && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <FormInput
                placeholder="อีเมลที่ต้องการเชิญ"
                type="email"
                icon="mail"
                value={invite.email}
                onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-3">
              <select
                value={invite.role}
                onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
                className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-4 text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all"
              >
                <option value="Editor">Editor</option>
                <option value="Owner">Owner</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleInvite}
                disabled={inviting}
                className="w-full h-full px-4 py-4 bg-(--primary) text-white rounded-xl text-sm font-bold hover:brightness-110 transition-colors disabled:opacity-50 whitespace-nowrap inline-flex items-center justify-center gap-1"
              >
                {inviting ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : "ส่ง"}
              </button>
            </div>
          </div>
          {inviteError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-xs text-red-700">{inviteError}</p>
            </div>
          )}
          <div className="text-[11px] text-slate-500 leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="font-semibold text-slate-700 mb-1">บทบาท:</p>
            <p><strong className="text-slate-700">Editor</strong> — สร้าง/แก้ไขทริปและตอบ ticket แต่จัดการบัญชี/ทีมไม่ได้</p>
            <p><strong className="text-slate-700">Owner</strong> — สิทธิ์เต็ม เชิญ/ลบสมาชิก เปลี่ยนแพ็กเกจได้</p>
            <p className="mt-1 text-slate-400">ระบบจะส่งลิงก์เชิญทางอีเมล · ผู้รับตั้งรหัสผ่านเอง</p>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="border-b border-slate-100">
          <div className="px-6 py-3 bg-amber-50/50">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">รอตอบรับ ({pendingInvites.length})</p>
          </div>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="px-6 py-3 flex items-center justify-between gap-3 border-t border-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-sm leading-none">schedule</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{inv.email}</p>
                  <p className="text-[10px] text-slate-400">
                    {inv.role} · {inv.status === "expired" ? "หมดอายุ" : formatExpiresIn(inv.expiresAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCancelInvite(inv.id)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0"
              >
                ยกเลิก
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                  {m.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${m.role === "Owner" ? "bg-(--primary-container) text-(--on-primary-container) ring-1 ring-(--primary)/20" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
                  {m.role}
                </span>
                {m.role !== "Owner" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id, `${m.firstName} ${m.lastName}`)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    aria-label={`ลบ ${m.firstName} ${m.lastName}`}
                  >
                    <span className="material-symbols-outlined text-lg leading-none">close</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-6 text-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-2xl text-slate-200 block mb-2">group_add</span>
          ยังไม่มีทีมงาน
        </div>
      )}
    </div>
  );
}
