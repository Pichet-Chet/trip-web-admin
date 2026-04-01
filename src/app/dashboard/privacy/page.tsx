export default function PrivacyPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-600">shield</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">นโยบายความเป็นส่วนตัว</h1>
            <p className="text-slate-400 text-xs">Privacy Policy</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm">อัปเดตล่าสุด: 31 มีนาคม 2569 · สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-10 space-y-10 text-sm text-slate-600 leading-relaxed">

          {/* Intro */}
          <section className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-emerald-800">บริษัทให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน นโยบายฉบับนี้อธิบายว่าเราเก็บรวบรวม ใช้ เปิดเผย และปกป้องข้อมูลส่วนบุคคลของท่านอย่างไร ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">1</span>
              ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-slate-500">
              <p><strong className="text-slate-700">ชื่อ:</strong> [บริษัท]</p>
              <p><strong className="text-slate-700">อีเมล DPO:</strong> dpo@tripapp.co</p>
              <p><strong className="text-slate-700">ที่อยู่:</strong> กรุงเทพมหานคร ประเทศไทย</p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">2</span>
              ข้อมูลที่เราเก็บรวบรวม
            </h2>

            <div className="space-y-5">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  ข้อมูลผู้ดูแลระบบ (Admin)
                </h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-blue-600"><th className="py-1 pr-3">ข้อมูล</th><th className="py-1 pr-3">เก็บเมื่อ</th><th className="py-1">ฐานกฎหมาย</th></tr></thead>
                  <tbody className="text-slate-500">
                    <tr><td className="py-1 pr-3">ชื่อ นามสกุล</td><td className="py-1 pr-3">สมัครสมาชิก</td><td className="py-1">สัญญา</td></tr>
                    <tr><td className="py-1 pr-3">อีเมล</td><td className="py-1 pr-3">สมัครสมาชิก</td><td className="py-1">สัญญา</td></tr>
                    <tr><td className="py-1 pr-3">รหัสผ่าน (เข้ารหัส bcrypt)</td><td className="py-1 pr-3">สมัครสมาชิก</td><td className="py-1">สัญญา</td></tr>
                    <tr><td className="py-1 pr-3">ชื่อบริษัท เลขใบอนุญาต ททท.</td><td className="py-1 pr-3">สมัครสมาชิก</td><td className="py-1">สัญญา</td></tr>
                    <tr><td className="py-1 pr-3">โทรศัพท์ LINE Facebook Instagram</td><td className="py-1 pr-3">กรอกเอง (สมัครใจ)</td><td className="py-1">ยินยอม</td></tr>
                    <tr><td className="py-1 pr-3">โลโก้/รูปภาพ</td><td className="py-1 pr-3">อัปโหลดเอง (สมัครใจ)</td><td className="py-1">ยินยอม</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  ข้อมูลลูกทริป (Guest/Follower)
                </h3>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-purple-600"><th className="py-1 pr-3">ข้อมูล</th><th className="py-1 pr-3">เก็บเมื่อ</th><th className="py-1">ฐานกฎหมาย</th></tr></thead>
                  <tbody className="text-slate-500">
                    <tr><td className="py-1 pr-3">ชื่อเล่น/ชื่อที่แสดง</td><td className="py-1 pr-3">กดติดตามทริป</td><td className="py-1">ยินยอม</td></tr>
                    <tr><td className="py-1 pr-3">LINE User ID</td><td className="py-1 pr-3">เพิ่มเพื่อน LINE OA</td><td className="py-1">ยินยอม</td></tr>
                    <tr><td className="py-1 pr-3">Web Push Subscription</td><td className="py-1 pr-3">กด Allow Notification</td><td className="py-1">ยินยอม</td></tr>
                    <tr><td className="py-1 pr-3">สถานะการรับทราบ (Read Receipt)</td><td className="py-1 pr-3">กดรับทราบในทริป</td><td className="py-1">ประโยชน์โดยชอบ</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">devices</span>
                  ข้อมูลทางเทคนิค (เก็บอัตโนมัติ)
                </h3>
                <ul className="space-y-1 text-xs text-slate-500 ml-5 list-disc">
                  <li>IP Address, User-Agent, เวลาเข้าใช้งาน (Log)</li>
                  <li>ข้อมูลการใช้งาน: จำนวนทริป, ครั้งแก้ไข, ครั้งแจ้งเตือน (Analytics)</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">block</span>
                  ข้อมูลที่เรา ไม่ เก็บ
                </h3>
                <ul className="space-y-1 text-xs text-red-700 ml-5 list-disc">
                  <li>ข้อมูลบัตรเครดิต/เดบิต (จัดการโดยผู้ให้บริการชำระเงิน)</li>
                  <li>ข้อมูลตำแหน่ง GPS ของผู้ใช้</li>
                  <li>ข้อมูลพาสปอร์ต วีซ่า หรือเอกสารส่วนตัวของลูกทริป</li>
                  <li>Cookie เพื่อการโฆษณา/ติดตามพฤติกรรมข้ามเว็บไซต์</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">3</span>
              วัตถุประสงค์ในการใช้ข้อมูล
            </h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li><strong>ให้บริการ:</strong> สร้างบัญชี จัดการทริป แสดงข้อมูลบนหน้าทริป</li>
              <li><strong>แจ้งเตือน:</strong> ส่ง notification เมื่อแผนทริปเปลี่ยนแปลง ผ่าน LINE หรือ Web Push</li>
              <li><strong>Read Receipt:</strong> แสดงให้ Admin เห็นว่าลูกทริปคนไหนรับทราบการเปลี่ยนแปลงแล้ว</li>
              <li><strong>แสดงข้อมูลบริษัท:</strong> แสดงชื่อ โลโก้ ช่องทางติดต่อบนหน้าทริปสาธารณะ</li>
              <li><strong>ปรับปรุงบริการ:</strong> วิเคราะห์การใช้งานเพื่อพัฒนาระบบ (ไม่ระบุตัวตน)</li>
              <li><strong>ติดต่อ:</strong> ส่งอีเมลเกี่ยวกับบริการ การอัปเดตระบบ หรือปัญหาบัญชี</li>
            </ul>
            <p className="mt-3 font-semibold text-slate-700">เราจะไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด</p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">4</span>
              การเปิดเผยข้อมูล
            </h2>
            <p>เราอาจเปิดเผยข้อมูลแก่บุคคลที่สามในกรณีต่อไปนี้เท่านั้น:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li><strong>ผู้ให้บริการ:</strong> เช่น ผู้ให้บริการ Cloud (Cloudflare, PostgreSQL), LINE Messaging API — ภายใต้สัญญาคุ้มครองข้อมูล</li>
              <li><strong>การปฏิบัติตามกฎหมาย:</strong> เมื่อได้รับหมายศาลหรือคำสั่งจากหน่วยงานรัฐ</li>
              <li><strong>ป้องกันอันตราย:</strong> เมื่อจำเป็นเพื่อป้องกันการฉ้อโกงหรือภัยคุกคามต่อความปลอดภัย</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">5</span>
              ระยะเวลาการเก็บรักษาข้อมูล
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-slate-200 text-slate-700"><th className="py-2 pr-4">ประเภทข้อมูล</th><th className="py-2 pr-4">ระยะเวลา</th><th className="py-2">เงื่อนไข</th></tr></thead>
                <tbody className="text-slate-500">
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">ข้อมูลบัญชี Admin</td><td className="py-2 pr-4">ตลอดระยะเวลาที่ใช้บริการ</td><td className="py-2">ลบเมื่อยกเลิกบัญชี</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">ข้อมูลทริป</td><td className="py-2 pr-4">ตลอดระยะเวลาที่ใช้บริการ</td><td className="py-2">ลบเมื่อลบทริปหรือยกเลิกบัญชี</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">ข้อมูล Follower</td><td className="py-2 pr-4">จนกว่าจะยกเลิกติดตาม</td><td className="py-2">ลบเมื่อ unfollow หรือลบทริป</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">Log ทางเทคนิค</td><td className="py-2 pr-4">90 วัน</td><td className="py-2">ลบอัตโนมัติ</td></tr>
                  <tr><td className="py-2 pr-4">ข้อมูลหลังยกเลิกบัญชี</td><td className="py-2 pr-4">30 วัน</td><td className="py-2">ลบถาวรหลัง 30 วัน</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">6</span>
              สิทธิ์ของเจ้าของข้อมูล (ตาม PDPA มาตรา 30-36)
            </h2>
            <p>ท่านมีสิทธิ์ดังต่อไปนี้เกี่ยวกับข้อมูลส่วนบุคคลของท่าน:</p>
            <div className="mt-4 grid gap-3">
              {[
                { icon: "visibility", title: "สิทธิ์ในการเข้าถึง", desc: "ดูข้อมูลของตนเองได้ผ่าน Dashboard และหน้าโปรไฟล์" },
                { icon: "edit", title: "สิทธิ์ในการแก้ไข", desc: "แก้ไขข้อมูลส่วนตัวได้ตลอดเวลาผ่านหน้าโปรไฟล์" },
                { icon: "delete", title: "สิทธิ์ในการลบ", desc: "ลบบัญชีได้ด้วยตนเองผ่านหน้าตั้งค่า ข้อมูลทั้งหมดจะถูกลบถาวร" },
                { icon: "download", title: "สิทธิ์ในการโอนย้ายข้อมูล", desc: "ส่งออกข้อมูลทริปของตนเป็นไฟล์ JSON ได้" },
                { icon: "cancel", title: "สิทธิ์ในการถอนความยินยอม", desc: "ลูกทริปกดยกเลิกติดตามได้ทุกเมื่อ Admin ลบบัญชีได้ทุกเมื่อ" },
                { icon: "do_not_disturb_on", title: "สิทธิ์ในการคัดค้าน", desc: "คัดค้านการประมวลผลข้อมูลที่ใช้ฐานประโยชน์โดยชอบธรรมได้" },
              ].map((right) => (
                <div key={right.icon} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="material-symbols-outlined text-emerald-600 mt-0.5">{right.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{right.title}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-slate-500">หากต้องการใช้สิทธิ์ใดๆ กรุณาติดต่อ dpo@tripapp.co เราจะดำเนินการภายใน 30 วัน</p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">7</span>
              การรักษาความปลอดภัยข้อมูล
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: "lock", title: "HTTPS", desc: "การเชื่อมต่อทั้งหมดเข้ารหัสด้วย TLS 1.3" },
                { icon: "password", title: "BCrypt", desc: "รหัสผ่านเข้ารหัสด้วย bcrypt (work factor 12)" },
                { icon: "token", title: "JWT", desc: "Session ใช้ JWT token มีอายุจำกัด" },
                { icon: "shield", title: "Rate Limiting", desc: "จำกัดจำนวน request เพื่อป้องกัน brute force" },
                { icon: "security", title: "Security Headers", desc: "X-Frame-Options, CSP, HSTS" },
                { icon: "database", title: "Database", desc: "เข้ารหัส at rest, สำรองข้อมูลรายวัน" },
              ].map((item) => (
                <div key={item.icon} className="flex gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="material-symbols-outlined text-emerald-600">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{item.title}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">8</span>
              Cookie
            </h2>
            <p>เราใช้ Cookie เฉพาะที่จำเป็นเท่านั้น:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li><strong>Session Cookie:</strong> เก็บ token สำหรับ login (จำเป็น, ไม่ต้องขอยินยอม)</li>
              <li><strong>Preference Cookie:</strong> เก็บภาษา/ธีมที่เลือก (จำเป็น)</li>
            </ul>
            <p className="mt-2 font-semibold text-slate-700">เราไม่ใช้ Cookie สำหรับการโฆษณาหรือติดตามพฤติกรรมข้ามเว็บไซต์</p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">9</span>
              การเปลี่ยนแปลงนโยบาย
            </h2>
            <p>นโยบายนี้อาจมีการเปลี่ยนแปลง เราจะแจ้งให้ทราบผ่าน:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li>แจ้งเตือนในระบบ (Notification)</li>
              <li>อีเมลถึงผู้ใช้ที่ลงทะเบียน</li>
              <li>แสดงวันที่อัปเดตล่าสุดบนหน้านี้</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">10</span>
              ช่องทางติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO)
            </h2>
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-slate-500">
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">mail</span> dpo@tripapp.co</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">support_agent</span> support@tripapp.co</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">chat</span> LINE Official: @tripapp</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">schedule</span> เวลาทำการ: จันทร์ - ศุกร์ 09:00 - 18:00 น.</p>
            </div>
            <p className="mt-3 text-xs text-slate-400">หากท่านเห็นว่าเราไม่ปฏิบัติตาม PDPA ท่านมีสิทธิ์ร้องเรียนต่อคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)</p>
          </section>

        </div>
      </div>

      <p className="text-center text-xs text-slate-300 mt-8">TripApp Privacy Policy v1.0 — Draft สำหรับตรวจสอบ</p>
    </div>
  );
}
