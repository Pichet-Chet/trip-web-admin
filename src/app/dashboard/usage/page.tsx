"use client";

export default function UsagePage(): React.ReactNode {
  // Mock usage data — pay-as-you-go model
  const freeTripsUsed = 2;
  const freeTripsLimit = 3;
  const paidTrips = 0;
  const totalTrips = freeTripsUsed + paidTrips;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 lg:space-y-12">

      {/* ═══ Hero ═══ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Account Status */}
        <div className="lg:col-span-2 bg-slate-900 p-6 md:p-8 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between min-h-60 md:min-h-70">
          <div className="relative z-10">
            <span className="px-3 py-1 bg-blue-600 rounded-md text-[10px] font-bold tracking-widest uppercase mb-4 inline-block">บัญชีของคุณ</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-2">สร้างแล้ว {totalTrips} ทริป</h2>
            <p className="text-sm opacity-80 max-w-sm">ฟรี {freeTripsLimit} ทริปแรก หลังจากนั้นจ่ายเฉพาะทริปที่สร้าง</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
            <a href="/dashboard/upgrade" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-600/20 hover:scale-105 transition-transform text-center">
              ซื้อทริปเพิ่ม
            </a>
            <p className="text-xs opacity-60">เริ่มต้น ฿49/ทริป</p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        {/* Free Trips Counter */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center space-y-4">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="64" cy="64" r="58" fill="transparent" stroke="#1978e5" strokeWidth="8" strokeLinecap="round" strokeDasharray="364.4" strokeDashoffset={364.4 * (1 - freeTripsUsed / freeTripsLimit)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{freeTripsUsed}/{freeTripsLimit}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">ทริปฟรี</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">ทริปฟรีที่เหลือ</h3>
            <p className="text-sm text-slate-400">เหลืออีก {freeTripsLimit - freeTripsUsed} ทริป</p>
          </div>
        </div>
      </section>

      {/* ═══ Pricing — Pay as you go ═══ */}
      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900">จ่ายเฉพาะทริปที่สร้าง</h2>
          <p className="text-slate-400 mt-1 text-sm">ไม่มี subscription ไม่ผูกมัด จ่ายเมื่อใช้</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">เริ่มต้น</span>
              <p className="text-3xl font-black text-slate-900 mt-2">ฟรี</p>
              <p className="text-sm text-slate-400 mt-1">3 ทริปแรก ไม่เสียค่าใช้จ่าย</p>
            </div>
            <ul className="space-y-3 flex-1">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                3 ทริปฟรี ต่อบัญชี
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ผู้ติดตาม 30 คน/ทริป
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                แจ้งเตือน LINE + Web Push
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <span className="material-symbols-outlined text-slate-300 text-lg mt-0.5">remove_circle_outline</span>
                มี "Powered by" badge
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400">แพลนปัจจุบัน</span>
            </div>
          </div>

          {/* Per Trip */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 flex flex-col relative">
            <span className="absolute -top-3 right-6 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">แนะนำ</span>
            <div className="mb-6">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">จ่ายต่อทริป</span>
              <p className="text-3xl font-black text-slate-900 mt-2">฿49 <span className="text-sm font-normal text-slate-400">/ ทริป</span></p>
              <p className="text-sm text-slate-400 mt-1">จ่ายเฉพาะทริปที่สร้างเพิ่ม</p>
            </div>
            <ul className="space-y-3 flex-1">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ทุกฟีเจอร์ไม่จำกัด
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ผู้ติดตามไม่จำกัด
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                แก้ไขไม่จำกัด
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ไม่มี "Powered by" badge
              </li>
            </ul>
            <div className="mt-6">
              <a href="/dashboard/upgrade" className="block w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm text-center hover:bg-blue-700 transition-colors shadow-sm">
                ซื้อทริป
              </a>
            </div>
          </div>

          {/* Pack */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">แพ็คสุดคุ้ม</span>
              <p className="text-3xl font-black text-slate-900 mt-2">฿199 <span className="text-sm font-normal text-slate-400">/ 5 ทริป</span></p>
              <p className="text-sm text-slate-400 mt-1">ประหยัด 19% เหมาะกับคนจัดบ่อย</p>
            </div>
            <ul className="space-y-3 flex-1">
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                5 ทริป (฿39.8/ทริป)
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ทุกฟีเจอร์เหมือนจ่ายต่อทริป
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                ไม่มีวันหมดอายุ
              </li>
            </ul>
            <div className="mt-6">
              <a href="/dashboard/upgrade" className="block w-full py-3.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm text-center hover:bg-slate-50 transition-colors">
                ซื้อแพ็ค
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Usage History ═══ */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">ประวัติการใช้งาน</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            { trip: "Tokyo Winter Trip 2026", type: "ฟรี", date: "1 มี.ค. 2569", status: "ใช้งานอยู่" },
            { trip: "เชียงใหม่ 3 วัน 2 คืน", type: "ฟรี", date: "18 มี.ค. 2569", status: "ร่าง" },
            { trip: "Seoul Autumn 5 วัน", type: "ฟรี", date: "15 ก.ย. 2568", status: "จบแล้ว" },
            { trip: "เขาใหญ่ Weekend", type: "ฟรี", date: "20 ธ.ค. 2568", status: "จบแล้ว" },
          ].map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.trip}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{item.type}</span>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
