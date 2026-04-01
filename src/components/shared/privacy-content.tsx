export function PrivacyContent(): React.ReactNode {
  return (
    <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800">
        สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
      </div>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">1. ผู้ควบคุมข้อมูลส่วนบุคคล</h2>
        <p>[บริษัท] · อีเมล DPO: dpo@tripapp.co</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">2. ข้อมูลที่เราเก็บรวบรวม</h2>
        <h3 className="font-bold text-slate-700 mt-2 mb-1">ข้อมูล Admin</h3>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>ชื่อ นามสกุล อีเมล รหัสผ่าน(เข้ารหัส) — เก็บตอนสมัคร (ฐาน: สัญญา)</li>
          <li>ชื่อบริษัท เลขใบอนุญาต ททท. — เก็บตอนสมัคร (ฐาน: สัญญา)</li>
          <li>โทรศัพท์ LINE Facebook Instagram — กรอกเอง (ฐาน: ยินยอม)</li>
        </ul>
        <h3 className="font-bold text-slate-700 mt-3 mb-1">ข้อมูลลูกทริป</h3>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>ชื่อเล่น — กดติดตามทริป (ฐาน: ยินยอม)</li>
          <li>LINE User ID / Web Push Subscription — เมื่อเปิดการแจ้งเตือน (ฐาน: ยินยอม)</li>
        </ul>
        <h3 className="font-bold text-red-700 mt-3 mb-1">ข้อมูลที่เราไม่เก็บ</h3>
        <p className="text-xs text-slate-500">บัตรเครดิต, ตำแหน่ง GPS, พาสปอร์ต, Cookie โฆษณา</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">3. วัตถุประสงค์ในการใช้ข้อมูล</h2>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>ให้บริการ: สร้างบัญชี จัดการทริป แสดงข้อมูล</li>
          <li>แจ้งเตือนเมื่อแผนทริปเปลี่ยนแปลง</li>
          <li>แสดง Read Receipt ให้ Admin</li>
          <li>ปรับปรุงบริการ (ไม่ระบุตัวตน)</li>
        </ul>
        <p className="mt-2 font-bold text-slate-700 text-xs">เราจะไม่ขายข้อมูลส่วนบุคคลแก่บุคคลที่สาม</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">4. ระยะเวลาการเก็บรักษา</h2>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>ข้อมูลบัญชี: ตลอดระยะเวลาใช้บริการ ลบเมื่อยกเลิก</li>
          <li>ข้อมูล Follower: จนกว่าจะ unfollow</li>
          <li>Log ทางเทคนิค: 90 วัน</li>
          <li>หลังยกเลิกบัญชี: ลบถาวรภายใน 30 วัน</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">5. สิทธิ์ของเจ้าของข้อมูล (PDPA มาตรา 30-36)</h2>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li><strong>เข้าถึง:</strong> ดูข้อมูลตนเองผ่าน Dashboard</li>
          <li><strong>แก้ไข:</strong> แก้ไขข้อมูลได้ตลอดเวลา</li>
          <li><strong>ลบ:</strong> ลบบัญชีได้ด้วยตนเอง ข้อมูลจะถูกลบถาวร</li>
          <li><strong>โอนย้าย:</strong> ส่งออกข้อมูลเป็น JSON</li>
          <li><strong>ถอนความยินยอม:</strong> ยกเลิกติดตามหรือลบบัญชีได้ทุกเมื่อ</li>
          <li><strong>คัดค้าน:</strong> คัดค้านการประมวลผลที่ใช้ฐานประโยชน์โดยชอบธรรมได้</li>
        </ul>
        <p className="mt-2 text-xs text-slate-400">ติดต่อ dpo@tripapp.co · ดำเนินการภายใน 30 วัน</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">6. การรักษาความปลอดภัย</h2>
        <p className="text-xs text-slate-500">HTTPS (TLS 1.3), BCrypt (work factor 12), JWT token, Rate Limiting, Security Headers, สำรองข้อมูลรายวัน</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">7. Cookie</h2>
        <p className="text-xs text-slate-500">ใช้เฉพาะ Session Cookie และ Preference Cookie (จำเป็น) ไม่ใช้ Cookie โฆษณาหรือติดตามพฤติกรรม</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">8. การเปลี่ยนแปลงนโยบาย</h2>
        <p className="text-xs text-slate-500">จะแจ้งผ่าน Notification และอีเมล พร้อมแสดงวันที่อัปเดตล่าสุด</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">9. ช่องทางติดต่อ DPO</h2>
        <p className="text-xs text-slate-500">dpo@tripapp.co · LINE: @tripapp · จันทร์-ศุกร์ 09:00-18:00</p>
        <p className="text-xs text-slate-400 mt-1">หากเห็นว่าไม่ปฏิบัติตาม PDPA สามารถร้องเรียนต่อ สคส. ได้</p>
      </section>
      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-300">
        TripApp Privacy Policy v1.0 — Draft
      </div>
    </div>
  );
}
