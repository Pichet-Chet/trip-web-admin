"use client";

import { mockCompany } from "@/lib/mock-data";
import { useState } from "react";
import { FormInput, SectionHeader, ImageUpload, useToast } from "@/components/shared";

type AccountType = "company" | "freelance" | "personal";

const accountTypes: { value: AccountType; label: string; desc: string }[] = [
  { value: "company", label: "บริษัททัวร์", desc: "มีใบอนุญาต ททท. และทีมงาน" },
  { value: "freelance", label: "ไกด์ฟรีแลนซ์", desc: "ไกด์อิสระ รับจัดทริปเอง" },
  { value: "personal", label: "ส่วนตัว", desc: "ทำแพลนทริปแชร์ให้เพื่อนๆ" },
];

export default function ProfilePage(): React.ReactNode {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [showInvite, setShowInvite] = useState(false);
  const [portfolioOn, setPortfolioOn] = useState(true);
  const [portfolioSlug, setPortfolioSlug] = useState("amazing-tour");
  const { toast } = useToast();

  const isCompany = accountType === "company";
  const isFreelance = accountType === "freelance";
  const isPersonal = accountType === "personal";

  return (
    <>
      <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          {/* Page Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">โปรไฟล์ของคุณ</h1>
            <p className="text-slate-500 text-sm md:text-lg max-w-lg mx-auto leading-relaxed">ข้อมูลนี้จะแสดงบนหน้าทริปที่แชร์ให้ผู้ร่วมเดินทาง</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-12 space-y-10 md:space-y-12">

              {/* Account Type Selector */}
              <section className="space-y-4">
                <SectionHeader title="ประเภทบัญชี" variant="bar" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {accountTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setAccountType(t.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        accountType === t.value ? "border-blue-600 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className={`text-sm font-bold ${accountType === t.value ? "text-blue-600" : "text-slate-900"}`}>{t.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Profile Image */}
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                aspect="square"
                label={isCompany ? "อัปโหลดโลโก้" : "อัปโหลดรูปโปรไฟล์"}
                hint={isCompany ? "แนะนำ: 512x512px PNG หรือ SVG" : "แนะนำ: รูปหน้าตรง 512x512px"}
              />

              {/* Info Section — adapts to account type */}
              <section className="space-y-6">
                <SectionHeader
                  title={isCompany ? "ข้อมูลบริษัท" : isFreelance ? "ข้อมูลไกด์" : "ข้อมูลส่วนตัว"}
                  variant="bar"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  {isCompany && (
                    <div className="col-span-1 md:col-span-2">
                      <FormInput label="ชื่อบริษัท" placeholder="เช่น Amazing Tour Co., Ltd." defaultValue={mockCompany.name} />
                    </div>
                  )}
                  <FormInput
                    label={isCompany ? "ชื่อผู้จัดการ / ไกด์" : isFreelance ? "ชื่อไกด์" : "ชื่อผู้สร้างทริป"}
                    placeholder={isPersonal ? "เช่น สมชาย" : "เช่น สมชาย ใจดี"}
                  />
                  {!isPersonal && (
                    <FormInput label="เลขใบอนุญาต ททท." placeholder="11/XXXXX (ไม่บังคับ)" defaultValue={isCompany ? mockCompany.tatLicense ?? "" : ""} />
                  )}
                  {isPersonal && (
                    <FormInput label="อีเมลติดต่อ" placeholder="you@example.com" type="email" icon="mail" />
                  )}
                </div>
              </section>

              {/* Contact Channels — not for personal */}
              {!isPersonal && (
                <section className="space-y-6">
                  <SectionHeader title="ช่องทางติดต่อ" subtitle="แสดงบนหน้าทริปให้ลูกทริปติดต่อกลับ" variant="bar" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    <FormInput label="เบอร์โทรศัพท์" placeholder="+66 81 234 5678" type="tel" icon="call" defaultValue={mockCompany.phone ?? ""} />

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">LINE ID</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[#06C755] rounded-lg z-10">
                          <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                        </div>
                        <FormInput placeholder="@yourlineid" defaultValue={mockCompany.lineId ?? ""} className="pl-12" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">Facebook Page</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[#1877F2] rounded-lg z-10">
                          <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                        </div>
                        <FormInput placeholder="fb.com/yourpage" defaultValue={mockCompany.facebook ?? ""} className="pl-12" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">Instagram</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded-lg z-10">
                          <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>camera</span>
                        </div>
                        <FormInput placeholder="@yourbrand_ig" defaultValue={mockCompany.instagram ?? ""} className="pl-12" />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Save */}
              <div className="pt-8 border-t border-slate-100">
                <button className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span>บันทึก</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-staff — only for company/freelance */}
          {!isPersonal && (
            <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">ทีมงาน</h3>
                  <p className="text-xs text-slate-400 mt-0.5">เชิญทีมงานมาช่วยจัดการทริป</p>
                </div>
                <button onClick={() => setShowInvite(!showInvite)} className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                  + เชิญ
                </button>
              </div>

              {showInvite && (
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <FormInput placeholder="อีเมลทีมงาน" type="email" icon="mail" />
                    </div>
                    <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none">
                      <option>Editor</option>
                      <option>Owner</option>
                    </select>
                    <button onClick={() => { setShowInvite(false); toast("ส่งคำเชิญแล้ว"); }} className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                      ส่ง
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Owner = ทำได้ทุกอย่าง · Editor = สร้าง/แก้ทริปได้ ลบ/billing ไม่ได้</p>
                </div>
              )}

              <div className="divide-y divide-slate-50">
                {[
                  { name: "สมชาย ใจดี", email: "admin@amazingtour.com", role: "Owner" },
                  { name: "นิดา วงศ์สุข", email: "nida@amazingtour.com", role: "Editor" },
                ].map((staff) => (
                  <div key={staff.email} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">{staff.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-400">{staff.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${staff.role === "Owner" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{staff.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio สาธารณะ */}
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Portfolio สาธารณะ</h3>
                <p className="text-xs text-slate-400 mt-0.5">หน้าแสดงผลงานทริปทั้งหมดของคุณ</p>
              </div>
              <button
                onClick={() => { setPortfolioOn(!portfolioOn); toast(portfolioOn ? "ปิด Portfolio แล้ว" : "เปิด Portfolio แล้ว"); }}
                className={`relative w-12 h-7 rounded-full transition-colors ${portfolioOn ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${portfolioOn ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>

            {portfolioOn && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-sm text-slate-500 truncate flex-1">app.example.com/g/{portfolioSlug}</span>
                  <button onClick={() => toast("คัดลอกลิงก์แล้ว")} className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">คัดลอก</button>
                </div>
                <FormInput label="Slug" defaultValue={portfolioSlug} onChange={(e) => setPortfolioSlug(e.target.value)} placeholder="your-name" />
                <FormInput label="Bio" placeholder="เล่าสั้นๆ เกี่ยวกับตัวคุณหรือบริษัท" />
                <p className="text-[11px] text-slate-400">Portfolio จะแสดงทริปที่เปิดบน Marketplace และผ่านการตรวจสอบแล้ว</p>
              </div>
            )}
          </div>

          {/* Usage Link */}
          <a href="/dashboard/usage" className="mt-6 block bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">การใช้งาน & แพลน</h3>
                <p className="text-xs text-slate-400 mt-0.5">ดูโควต้า ลิมิต และอัปเกรดแพลน</p>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">arrow_forward</span>
            </div>
          </a>
        </div>
      </main>
    </>
  );
}
