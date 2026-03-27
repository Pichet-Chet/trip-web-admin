"use client";

import { mockUsage } from "@/lib/mock-data";

function ProgressBar({ used, limit }: { used: number; limit: number }): React.ReactNode {
  const pct = Math.round((used / limit) * 100);
  return (
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
      <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function UsagePage(): React.ReactNode {
  const editInfo = mockUsage.editsPerTrip[0];
  const followerInfo = mockUsage.followersPerTrip[0];
  const overallPct = Math.round(((mockUsage.tripSlots.used / mockUsage.tripSlots.limit) + (mockUsage.notificationsPerMonth.used / mockUsage.notificationsPerMonth.limit)) / 2 * 100);

  const metrics = [
    { label: "ทริปที่ใช้งาน", desc: "จำนวนทริปที่สร้างได้", used: mockUsage.tripSlots.used, limit: mockUsage.tripSlots.limit },
    ...(followerInfo ? [{ label: "ผู้ติดตามต่อทริป", desc: followerInfo.tripTitle, used: followerInfo.used, limit: followerInfo.limit }] : []),
    { label: "แจ้งเตือนต่อเดือน", desc: "LINE + Web Push", used: mockUsage.notificationsPerMonth.used, limit: mockUsage.notificationsPerMonth.limit },
    ...(editInfo ? [{ label: "แก้ไขหลัง Publish", desc: editInfo.tripTitle, used: editInfo.used, limit: editInfo.limit }] : []),
  ];

  return (
    <>
      {/* Header */}

      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 lg:space-y-12">

        {/* ═══ Hero ═══ */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2 bg-slate-900 p-6 md:p-8 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between min-h-60 md:min-h-70">
            <div className="relative z-10">
              <span className="px-3 py-1 bg-blue-600 rounded-md text-[10px] font-bold tracking-widest uppercase mb-4 inline-block">แพลนปัจจุบัน</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-2">Free Tier</h2>
              <p className="text-sm opacity-80 max-w-sm">คุณกำลังใช้งานฟีเจอร์พื้นฐาน อัปเกรดเพื่อปลดล็อกทุกความสามารถ</p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
              <a href="/dashboard/upgrade" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform text-center">
                อัปเกรดเป็น Pro
              </a>
              <p className="text-xs opacity-60">เริ่มต้น ฿299/เดือน · ยกเลิกได้ทุกเมื่อ</p>
            </div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
          </div>

          {/* Radial Progress */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="64" cy="64" r="58" fill="transparent" stroke="#1978e5" strokeWidth="8" strokeLinecap="round" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - overallPct / 100)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{overallPct}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">ใช้งานรวม</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">ภาพรวมการใช้งาน</h3>
              <p className="text-sm text-slate-400">ใกล้ถึงลิมิตของแพลน</p>
            </div>
          </div>
        </section>

        {/* ═══ Metrics ═══ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600">
                  <span className="material-symbols-outlined">data_usage</span>
                </div>
                <span className="text-xs font-bold text-slate-400">{m.used} / {m.limit}</span>
              </div>
              <h4 className="font-bold mb-1 text-slate-900">{m.label}</h4>
              <p className="text-xs text-slate-400 mb-6">{m.desc}</p>
              <ProgressBar used={m.used} limit={m.limit} />
            </div>
          ))}
        </section>

        {/* ═══ Plan Comparison ═══ */}
        <section className="mt-16 lg:mt-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4">ปลดล็อกทุกความสามารถ</h2>
            <p className="text-slate-400 max-w-xl mx-auto">เปรียบเทียบแพลนปัจจุบันกับ Pro ที่ไม่มีลิมิต</p>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative min-h-72 md:min-h-96">
                <img className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80" alt="" />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900/90 to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
                  <h3 className="text-2xl font-bold mb-2">ออกแบบมาเพื่อมืออาชีพ</h3>
                  <p className="text-sm opacity-80">Pro Plan ลบทุกข้อจำกัด ให้คุณมุ่งเน้นที่ประสบการณ์ของลูกทริป</p>
                </div>
              </div>
              <div className="p-6 md:p-10 space-y-8 flex flex-col justify-center">
                <div className="space-y-4">
                  {[
                    { title: "แก้ไขไม่จำกัด", desc: "แก้ไข itinerary ได้ไม่จำกัดครั้ง ไม่ต้องนับโควต้า" },
                    { title: "ผู้ติดตาม 100 คน/ทริป", desc: "รองรับกรุ๊ปทัวร์ขนาดใหญ่ได้สบาย" },
                    { title: "แจ้งเตือน 200 ครั้ง/เดือน", desc: "ส่ง LINE + Web Push ได้มากขึ้น 20 เท่า" },
                    { title: "Custom Branding", desc: "โลโก้ของคุณ สีของคุณ ไม่มี Powered By badge" },
                    { title: "Priority Support", desc: "ติดต่อทีมงานได้ทันทีผ่าน LINE และอีเมล" },
                  ].map((f) => (
                    <div key={f.title} className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <span className="material-symbols-outlined text-blue-600 mt-0.5">check_circle</span>
                      <div>
                        <h5 className="font-bold text-slate-900">{f.title}</h5>
                        <p className="text-sm text-slate-400">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-2xl font-black text-slate-900">฿299<span className="text-sm font-normal text-slate-400">/เดือน</span></p>
                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">ราคาช่วงเปิดตัว</p>
                  </div>
                  <a href="/dashboard/upgrade" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all text-center">
                    เปลี่ยนเป็น Pro
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-bold tracking-widest uppercase text-center">
          <span>รีเซ็ตโควต้าล่าสุด: 1 มี.ค. 2569</span>
          <span>รอบบิล: เหลืออีก 4 วัน</span>
        </footer>
      </div>
    </>
  );
}
