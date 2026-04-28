"use client";

import Link from "next/link";

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "overview",
    title: "ภาพรวม",
    body: (
      <>
        <p>เราต้องการให้ผู้ประกอบการได้รับความเป็นธรรม — แต่ก็ต้องป้องกันการใช้สิทธิ์คืนเงินที่ทำให้เกิดความเสียหายต่อระบบและผู้ใช้รายอื่น นโยบายนี้ออกแบบให้โปร่งใส ตรวจสอบได้ และบังคับใช้โดยระบบอัตโนมัติ</p>
        <p className="mt-2">การขอคืนเงินทุกกรณีจะถูกส่งให้เจ้าหน้าที่ตรวจสอบก่อน ไม่มีการคืนเงินอัตโนมัติแบบทันที</p>
      </>
    ),
  },
  {
    id: "credits",
    title: "การคืนเงินค่าเครดิต (Per-Trip / Pack 5)",
    body: (
      <ul className="space-y-2 list-disc pl-5">
        <li><strong>เครดิตที่ยังไม่ใช้:</strong> ขอคืนเต็มจำนวนได้ภายใน <strong>14 วัน</strong> หลังชำระเงิน</li>
        <li><strong>Pack 5 ที่ใช้บางส่วน:</strong> ภายใน 14 วัน คืนแบบ pro-rata เฉพาะส่วนที่ยังไม่ใช้ (เช่น ใช้ 2/5 → คืน 60%)</li>
        <li><strong>เครดิตที่ใช้ครบแล้ว:</strong> ไม่สามารถคืนเงินตามนโยบายปกติ</li>
        <li><strong>เกิน 14 วัน:</strong> ต้องผ่านกระบวนการพิเศษ ติดต่อ Support พร้อมเหตุผลละเอียด</li>
      </ul>
    ),
  },
  {
    id: "subscription",
    title: "การคืนเงิน Subscription รายเดือน",
    body: (
      <ul className="space-y-2 list-disc pl-5">
        <li><strong>ภายใน 24 ชม.หลังชำระ + ยังไม่ใช้:</strong> คืนเต็มจำนวน (cooling-off period)</li>
        <li><strong>หลัง 24 ชม.:</strong> ไม่คืนเงินค่ารอบที่ใช้แล้ว — ใช้ฟังก์ชัน &quot;ยกเลิก Subscription&quot; แทน เพื่อใช้งานต่อจนหมดรอบและไม่ต่ออายุ</li>
        <li>การคืนเงินรอบที่ผ่านมาแล้วต้องดำเนินการผ่าน Stripe Dashboard (staff)</li>
      </ul>
    ),
  },
  {
    id: "blocked",
    title: "กรณีที่ขอคืนเงินไม่ได้",
    body: (
      <ul className="space-y-2 list-disc pl-5">
        <li>ทริปที่ใช้เครดิตได้ถูก publish หรืออยู่ระหว่างรอตรวจสอบแล้ว</li>
        <li>เครดิตที่ซื้อถูกใช้ครบจำนวน</li>
        <li>เกินระยะเวลา 14 วันหลังชำระ (สำหรับเครดิต)</li>
        <li>Subscription ที่เกิน 24 ชั่วโมงจาก charge ล่าสุด</li>
      </ul>
    ),
  },
  {
    id: "force-majeure",
    title: "กรณีพิเศษ (Force Majeure)",
    body: (
      <>
        <p>ในกรณีพิเศษเช่น ระบบล่มที่ทำให้ใช้บริการไม่ได้ การชำระเงินผิดพลาดทางเทคนิค หรือ charge ซ้ำซ้อน เจ้าหน้าที่ระดับ <strong>Staff Admin</strong> สามารถพิจารณาคืนเงินนอกเหนือนโยบายปกติ</p>
        <p className="mt-2">การ override ทุกครั้งจะถูกบันทึก audit log ถาวรพร้อมเหตุผลละเอียด ≥ 30 ตัวอักษร เพื่อความโปร่งใส</p>
        <p className="mt-2 text-sm text-slate-600">ติดต่อขอ Force Majeure ได้ผ่านระบบ Ticket ที่ <Link href="/dashboard/support" className="text-rose-600 font-bold hover:underline">/dashboard/support</Link></p>
      </>
    ),
  },
  {
    id: "process",
    title: "ขั้นตอนการขอคืนเงิน",
    body: (
      <ol className="space-y-2 list-decimal pl-5">
        <li>ไปที่ <Link href="/dashboard/billing" className="text-rose-600 font-bold hover:underline">/dashboard/billing</Link> เลือกรายการที่ต้องการคืนเงิน</li>
        <li>กดปุ่ม &quot;ขอเงินคืน&quot; → ระบบจะแสดงสถานะคำขอ (eligible / partial / blocked) ทันที</li>
        <li>ระบุเหตุผลละเอียด (≥ 10 ตัวอักษร) → ส่งคำขอ</li>
        <li>เจ้าหน้าที่จะตรวจสอบภายใน 1-3 วันทำการ และส่งอีเมลแจ้งผล</li>
        <li>หาก approve เงินจะคืนเข้าบัตร/บัญชีเดิมภายใน 5-10 วันทำการ (ขึ้นกับธนาคาร)</li>
      </ol>
    ),
  },
  {
    id: "audit",
    title: "การตรวจสอบและบันทึก",
    body: (
      <p>คำขอคืนเงินทุกรายการ การตัดสินใจของเจ้าหน้าที่ และการ override ในกรณีพิเศษ จะถูกเก็บไว้ในระบบ audit log อย่างถาวรตามข้อกำหนด PDPA และข้อกำหนดทางบัญชี ผู้ใช้สามารถขอ export log การตัดสินใจของบัญชีตัวเองได้ผ่าน Support ticket</p>
    ),
  },
];

export default function RefundPolicyPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">นโยบายคืนเงิน</h1>
        <p className="text-on-surface-variant mt-2 text-base md:text-lg">นโยบายฉบับใช้งานปัจจุบัน — บังคับใช้กับการขอคืนเงินทุกกรณี</p>
        <p className="text-xs text-on-surface-variant mt-1">อัปเดตล่าสุด: 2026-04-28 · Policy Version 1</p>
      </div>

      {/* Quick reference card */}
      <div className="bg-white rounded-2xl border border-(--surface-container-high) shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-bold text-on-surface mb-4">สรุปสั้น</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-emerald-600 mt-0.5">check_circle</span>
            <div>
              <p className="font-bold text-on-surface">เครดิตยังไม่ใช้ + ภายใน 14 วัน</p>
              <p className="text-on-surface-variant text-xs mt-0.5">คืนเต็มจำนวน</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 mt-0.5">pie_chart</span>
            <div>
              <p className="font-bold text-on-surface">Pack 5 ใช้บางส่วน + ภายใน 14 วัน</p>
              <p className="text-on-surface-variant text-xs mt-0.5">คืน pro-rata เฉพาะส่วนที่เหลือ</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-rose-600 mt-0.5">block</span>
            <div>
              <p className="font-bold text-on-surface">Trip publish แล้ว / เกิน 14 วัน</p>
              <p className="text-on-surface-variant text-xs mt-0.5">ขอผ่าน Force Majeure (ติดต่อ Support)</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-600 mt-0.5">workspace_premium</span>
            <div>
              <p className="font-bold text-on-surface">Subscription ภายใน 24 ชม.</p>
              <p className="text-on-surface-variant text-xs mt-0.5">คืนเต็ม — เกินนั้นใช้ &quot;ยกเลิก&quot; แทน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full sections */}
      <div className="space-y-6">
        {sections.map(s => (
          <section key={s.id} id={s.id} className="bg-white rounded-2xl border border-(--outline-variant) p-6 md:p-7">
            <h2 className="text-lg font-bold text-on-surface mb-3">{s.title}</h2>
            <div className="text-sm text-slate-700 leading-relaxed">{s.body}</div>
          </section>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link href="/dashboard/billing" className="inline-flex items-center gap-2 text-sm font-bold text-(--primary) hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          กลับไปหน้า Billing
        </Link>
      </div>
    </div>
  );
}
