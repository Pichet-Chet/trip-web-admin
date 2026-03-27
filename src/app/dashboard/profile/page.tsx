"use client";

import { mockCompany } from "@/lib/mock-data";
import { useState } from "react";
import { FormInput, SectionHeader, ImageUpload } from "@/components/shared";

export default function ProfilePage(): React.ReactNode {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  return (
    <>
      {/* Header */}

      {/* Content */}
      <main className="min-h-[calc(100vh-4rem)] p-4 md:p-8 lg:p-16 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          {/* Page Header */}
          <div className="mb-8 md:mb-12 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">โปรไฟล์บริษัท</h1>
            <p className="text-slate-500 text-sm md:text-lg max-w-lg mx-auto leading-relaxed">ข้อมูลนี้จะแสดงบนหน้าทริปที่แชร์ให้ลูกทริป</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-12 space-y-10 md:space-y-12">

              {/* Logo Upload */}
              <ImageUpload
                value={logoUrl}
                onChange={setLogoUrl}
                aspect="square"
                label="อัปโหลดโลโก้"
                hint="แนะนำ: 512x512px PNG หรือ SVG"
              />

              {/* Company Info */}
              <section className="space-y-6">
                <SectionHeader title="ข้อมูลบริษัท" variant="bar" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <FormInput label="ชื่อบริษัท" placeholder="เช่น Amazing Tour Co., Ltd." defaultValue={mockCompany.name} />
                  </div>
                  <FormInput label="ชื่อไกด์ / ผู้จัดการ" placeholder="เช่น สมชาย ใจดี" />
                  <FormInput label="เลขใบอนุญาต ททท." placeholder="11/XXXXX" defaultValue={mockCompany.tatLicense ?? ""} />
                </div>
              </section>

              {/* Contact Channels */}
              <section className="space-y-6">
                <SectionHeader title="ช่องทางติดต่อ" variant="bar" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <FormInput label="เบอร์โทรศัพท์" placeholder="+66 81 234 5678" type="tel" icon="call" defaultValue={mockCompany.phone ?? ""} />

                  {/* LINE — custom icon */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">LINE ID</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[#06C755] rounded-lg z-10">
                        <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                      </div>
                      <FormInput placeholder="@yourlineid" defaultValue={mockCompany.lineId ?? ""} className="pl-12" />
                    </div>
                  </div>

                  {/* Facebook — custom icon */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest px-1">Facebook Page</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[#1877F2] rounded-lg z-10">
                        <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                      </div>
                      <FormInput placeholder="fb.com/yourpage" defaultValue={mockCompany.facebook ?? ""} className="pl-12" />
                    </div>
                  </div>

                  {/* Instagram — custom icon */}
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

              {/* Save Button */}
              <div className="pt-8 border-t border-slate-100">
                <button className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <span>บันทึกและไปหน้า Dashboard</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">คุณสามารถแก้ไขข้อมูลเหล่านี้ได้ภายหลังในเมนูโปรไฟล์</p>
              </div>
            </div>
          </div>

          {/* Usage & Plan Link */}
          <a href="/dashboard/usage" className="mt-8 block bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-200 transition-colors group">
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
