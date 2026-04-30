"use client";

import { useState, useEffect } from "react";
import { FormInput, FormTextarea, LoadingState, SectionHeader, ImageUpload, ToggleSwitch, useToast } from "@/components/shared";
import { useConfirm } from "@/lib/hooks/use-confirm";
import { api, ApiError } from "@/lib/api";

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

const accountTypes: { value: AccountType; label: string; desc: string }[] = [
  { value: "company", label: "บริษัททัวร์", desc: "มีใบอนุญาต ททท. และทีมงาน" },
  { value: "freelance", label: "ไกด์ฟรีแลนซ์", desc: "ไกด์อิสระ รับจัดทริปเอง" },
  { value: "personal", label: "ส่วนตัว", desc: "ทำแพลนทริปแชร์ให้เพื่อนๆ" },
];

export default function ProfilePage(): React.ReactNode {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    name: "",
    accountType: "company" as AccountType,
    logoUrl: null as string | null,
    phone: "",
    lineId: "",
    facebookUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    tatLicense: "",
    portfolioEnabled: false,
    portfolioSlug: "",
    portfolioBio: "",
  });

  useEffect(() => {
    api.get<CompanyData>("/admin/company").then((data) => {
      setForm({
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
      });
      setLoading(false);
    });
  }, []);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSave() {
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
      toast("บันทึกสำเร็จ", "success");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  const isCompany = form.accountType === "company";
  const isPersonal = form.accountType === "personal";

  if (loading) return <LoadingState />;

  return (
    <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        <div className="mb-8 md:mb-12 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">โปรไฟล์ของคุณ</h1>
          <p className="text-slate-500 text-sm md:text-lg max-w-lg mx-auto leading-relaxed">ข้อมูลนี้จะแสดงบนหน้าทริปที่แชร์ให้ผู้ร่วมเดินทาง</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-12 space-y-10 md:space-y-12">

            {/* Account Type Selector */}
            <section className="space-y-4">
              <SectionHeader title="ประเภทบัญชี" variant="bar" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {accountTypes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((p) => ({ ...p, accountType: t.value }))}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.accountType === t.value ? "border-(--primary) bg-(--primary-container)/30" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-sm font-bold ${form.accountType === t.value ? "text-(--primary)" : "text-slate-900"}`}>{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Profile Image */}
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
              uploadUrl={`${process.env.NEXT_PUBLIC_API_URL}/admin/company/logo`}
              aspect="square"
              label={isCompany ? "อัปโหลดโลโก้" : "อัปโหลดรูปโปรไฟล์"}
              hint={isCompany ? "แนะนำ: 512x512px PNG หรือ SVG · ไม่เกิน 5MB" : "แนะนำ: รูปหน้าตรง 512x512px · ไม่เกิน 5MB"}
            />

            {/* Info Section */}
            <section className="space-y-6">
              <SectionHeader
                title={isCompany ? "ข้อมูลบริษัท" : form.accountType === "freelance" ? "ข้อมูลไกด์" : "ข้อมูลส่วนตัว"}
                variant="bar"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {isCompany && (
                  <div className="col-span-1 md:col-span-2">
                    <FormInput label="ชื่อบริษัท" placeholder="เช่น Amazing Tour Co., Ltd." value={form.name} onChange={set("name")} required />
                  </div>
                )}
                {!isPersonal && (
                  <FormInput label="เลขใบอนุญาต ททท." placeholder="11/XXXXX (ไม่บังคับ)" value={form.tatLicense} onChange={set("tatLicense")} />
                )}
              </div>
            </section>

            {/* Contact Channels */}
            <section className="space-y-6">
              <SectionHeader title="ช่องทางติดต่อ" subtitle="แสดงบนหน้าทริปให้ลูกทริปติดต่อกลับ" variant="bar" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                <FormInput label="เบอร์โทรศัพท์" placeholder="+66 81 234 5678" type="tel" icon="call" value={form.phone} onChange={set("phone")} />
                <FormInput label="LINE ID" placeholder="@yourlineid" icon="chat" value={form.lineId} onChange={set("lineId")} />
                <FormInput label="Facebook Page" placeholder="https://fb.com/yourpage" icon="thumb_up" value={form.facebookUrl} onChange={set("facebookUrl")} />
                <FormInput label="Instagram" placeholder="https://instagram.com/yourbrand" icon="camera" value={form.instagramUrl} onChange={set("instagramUrl")} />
                <div className="col-span-1 md:col-span-2">
                  <FormInput label="เว็บไซต์" placeholder="https://yourwebsite.com" icon="language" value={form.websiteUrl} onChange={set("websiteUrl")} />
                </div>
              </div>
            </section>

            {/* Save */}
            <div className="pt-8 border-t border-slate-100 space-y-4">
              {saveError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">error</span>
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 bg-(--primary) text-white rounded-xl font-bold text-sm shadow-lg shadow-(--primary)/20 hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{saving ? "กำลังบันทึก..." : "บันทึก"}</span>
                {!saving && <span className="material-symbols-outlined text-lg">check</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Team Section */}
        {!isPersonal && <TeamSection />}

        {/* Portfolio */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
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
                <span className="text-sm text-slate-500 truncate flex-1">tripapp.co/g/{form.portfolioSlug || "your-slug"}</span>
                <button onClick={() => { navigator.clipboard.writeText(`tripapp.co/g/${form.portfolioSlug}`); toast("คัดลอกลิงก์แล้ว"); }} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">คัดลอก</button>
              </div>
              <FormInput label="Slug" value={form.portfolioSlug} onChange={set("portfolioSlug")} placeholder="your-company-name" />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">Bio</label>
                <textarea
                  value={form.portfolioBio}
                  onChange={(e) => setForm((p) => ({ ...p, portfolioBio: e.target.value }))}
                  placeholder="เล่าสั้นๆ เกี่ยวกับตัวคุณหรือบริษัท"
                  rows={3}
                  maxLength={1024}
                  className="w-full bg-(--surface-container-low) border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:ring-2 focus:ring-(--primary)/20 focus:border-(--primary) transition-all text-(--on-surface) font-medium placeholder:text-(--outline)/40 outline-none resize-none text-sm"
                />
                <p className="text-[11px] text-slate-400 px-1 text-right">{form.portfolioBio.length}/1024</p>
              </div>
            </div>
          )}
        </div>

        {/* Usage Link */}
        <a href="/dashboard/usage" className="mt-6 block bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-(--primary)/30 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">การใช้งาน & แพลน</h3>
              <p className="text-xs text-slate-400 mt-0.5">ดูโควต้า ลิมิต และอัปเกรดแพลน</p>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-(--primary) group-hover:translate-x-1 transition-all">arrow_forward</span>
          </div>
        </a>
      </div>
    </main>
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
    api.get<TeamMember[]>("/admin/company/team").then(setMembers);
    api.get<PendingInvite[]>("/admin/company/team/invites").then(setPendingInvites);
  }, []);

  async function handleInvite() {
    setInviteError("");
    if (!invite.email) {
      setInviteError("กรุณากรอกอีเมล");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)) {
      setInviteError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
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
    <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">ทีมงาน</h3>
          <p className="text-xs text-slate-400 mt-0.5">เชิญทีมงานมาช่วยจัดการทริป</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="text-sm font-semibold text-(--primary) hover:bg-(--primary-container)/40 px-3 py-1.5 rounded-lg transition-colors">
          {showInvite ? "ยกเลิก" : "+ เชิญ"}
        </button>
      </div>

      {showInvite && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FormInput placeholder="อีเมลที่ต้องการเชิญ" type="email" icon="mail" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <select
              value={invite.role}
              onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value }))}
              className="px-4 py-4 bg-white border border-slate-200 rounded-xl text-sm outline-none"
            >
              <option value="Editor">Editor</option>
              <option value="Owner">Owner</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="px-5 py-4 bg-(--primary) text-white rounded-xl text-sm font-bold hover:opacity-95 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {inviting ? "กำลังส่ง..." : "ส่งคำเชิญ"}
            </button>
          </div>
          {inviteError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <span className="material-symbols-outlined text-red-500 text-sm mt-0.5">error</span>
              <p className="text-xs text-red-700">{inviteError}</p>
            </div>
          )}
          <p className="text-[11px] text-slate-400">ระบบจะส่ง link เชิญไปทางอีเมล · ผู้รับเชิญต้องตั้ง password เอง</p>
        </div>
      )}

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="border-b border-slate-100">
          <div className="px-6 py-3 bg-amber-50/50">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">รอตอบรับ ({pendingInvites.length})</p>
          </div>
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="px-6 py-3 flex items-center justify-between border-t border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 text-sm">schedule</span>
                </div>
                <div>
                  <p className="text-sm text-slate-700">{inv.email}</p>
                  <p className="text-[10px] text-slate-400">{inv.role} · {inv.status === "expired" ? "หมดอายุ" : "รอตอบรับ"}</p>
                </div>
              </div>
              <button
                onClick={() => handleCancelInvite(inv.id)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length > 0 ? (
        <div className="divide-y divide-slate-50">
          {members.map((m) => (
            <div key={m.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                  {m.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{m.firstName} {m.lastName}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${m.role === "Owner" ? "bg-(--primary-container)/40 text-(--primary)" : "bg-slate-100 text-slate-500"}`}>
                  {m.role}
                </span>
                {m.role !== "Owner" && (
                  <button
                    onClick={() => handleRemove(m.id, `${m.firstName} ${m.lastName}`)}
                    className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-slate-400">
          <span className="material-symbols-outlined text-2xl text-slate-200 block mb-2">group_add</span>
          ยังไม่มีทีมงาน — เชิญทีมงานมาช่วยจัดการทริป
        </div>
      )}
    </div>
  );
}
