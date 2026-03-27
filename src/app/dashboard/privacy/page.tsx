export default function PrivacyPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-slate-400 mt-2 text-sm">อัปเดตล่าสุด: 1 มีนาคม 2569 · สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-10 space-y-8 text-sm text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. ข้อมูลที่เราเก็บ</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">ข้อมูลผู้ดูแลระบบ (Admin)</h3>
                <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
                  <li>อีเมล ชื่อ ข้อมูลบริษัท — เก็บตอนสมัครสมาชิก</li>
                  <li>ช่องทางติดต่อ (โทรศัพท์, LINE, Facebook, Instagram) — กรอกโดยสมัครใจ</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">ข้อมูลลูกทริป (Guest/Follower)</h3>
                <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
                  <li>ชื่อเล่น — กรอกตอนกด "ติดตาม"</li>
                  <li>LINE User ID — เก็บเมื่อเพิ่มเพื่อน LINE OA</li>
                  <li>Web Push Subscription — เก็บเมื่อกด Allow Notification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">ข้อมูลที่ไม่เก็บ</h3>
                <p className="text-slate-500">ระบบไม่เก็บข้อมูลบัตรเครดิต ข้อมูลตำแหน่ง หรือข้อมูลส่วนตัวอื่นๆ ของลูกทริป</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>ส่งแจ้งเตือนเมื่อแผนทริปมีการเปลี่ยนแปลง</li>
              <li>แสดง read receipt ให้ admin เห็นว่าใครรับทราบแล้ว</li>
              <li>แสดงข้อมูลบริษัทบนหน้าทริปที่แชร์ให้ลูกทริป</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. สิทธิ์ของเจ้าของข้อมูล</h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li><strong>สิทธิ์ในการเข้าถึง</strong> — Admin ดูข้อมูลได้ผ่าน Dashboard</li>
              <li><strong>สิทธิ์ในการลบ</strong> — Admin สามารถลบบัญชีได้ ข้อมูลทั้งหมดจะถูกลบ</li>
              <li><strong>สิทธิ์ในการถอนความยินยอม</strong> — ลูกทริปกดยกเลิกติดตามได้ทุกเมื่อ</li>
              <li><strong>สิทธิ์ในการโอนย้ายข้อมูล</strong> — ส่งออกข้อมูลทริปเป็น JSON</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. การรักษาความปลอดภัย</h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>HTTPS ทุกการเชื่อมต่อ</li>
              <li>รหัสผ่านเข้ารหัสด้วย bcrypt</li>
              <li>JWT Session cookie (httpOnly, secure, sameSite)</li>
              <li>เก็บข้อมูลเท่าที่จำเป็น ลบเมื่อไม่ใช้งาน</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. การติดต่อ</h2>
            <p>หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว กรุณาติดต่อผ่านอีเมลหรือช่องทางที่ระบุในหน้าช่วยเหลือ</p>
          </section>

        </div>
      </div>
    </div>
  );
}
