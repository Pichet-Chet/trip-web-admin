export default function TermsPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600">gavel</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">เงื่อนไขการใช้งาน</h1>
            <p className="text-slate-400 text-xs">Terms of Service</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm">อัปเดตล่าสุด: 31 มีนาคม 2569 · มีผลบังคับใช้ตั้งแต่วันที่ลงทะเบียน</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-10 space-y-10 text-sm text-slate-600 leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</span>
              คำนิยาม
            </h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li><strong>&quot;แพลตฟอร์ม&quot;</strong> หมายถึง ระบบ TripApp รวมถึงเว็บไซต์ แอปพลิเคชัน และ API ทั้งหมด</li>
              <li><strong>&quot;ผู้ใช้งาน&quot;</strong> หรือ <strong>&quot;Admin&quot;</strong> หมายถึง บริษัททัวร์ ไกด์อิสระ หรือบุคคลที่สมัครใช้งานระบบเพื่อสร้างและจัดการทริป</li>
              <li><strong>&quot;ลูกทริป&quot;</strong> หรือ <strong>&quot;Guest&quot;</strong> หมายถึง บุคคลที่ได้รับลิงก์ทริปและเข้าดูแผนการเดินทาง</li>
              <li><strong>&quot;ทริป&quot;</strong> หมายถึง แผนการเดินทางที่ผู้ใช้งานสร้างขึ้นบนแพลตฟอร์ม</li>
              <li><strong>&quot;แพ็กเกจทัวร์&quot;</strong> หรือ <strong>&quot;Post&quot;</strong> หมายถึง ประกาศโปรโมทแพ็กเกจท่องเที่ยวบน Marketplace</li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">2</span>
              การยอมรับเงื่อนไข
            </h2>
            <p>เมื่อคุณสมัครสมาชิก เข้าสู่ระบบ หรือใช้งานแพลตฟอร์มในรูปแบบใดก็ตาม ถือว่าคุณได้อ่าน เข้าใจ และยอมรับเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ รวมถึง<a href="/dashboard/privacy" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a></p>
            <p className="mt-2">หากคุณไม่ยอมรับเงื่อนไขข้อใดข้อหนึ่ง กรุณาหยุดใช้งานระบบทันที</p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">3</span>
              ขอบเขตการให้บริการ
            </h2>
            <p>แพลตฟอร์มให้บริการเครื่องมือในการจัดการแผนการเดินทาง ได้แก่:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li>สร้าง แก้ไข และเผยแพร่แผนทริป (Itinerary) พร้อมรายละเอียดกิจกรรม ที่พัก สายการบิน และข้อมูลฉุกเฉิน</li>
              <li>แชร์ลิงก์ทริปและ QR Code ให้ลูกทริปเข้าดูได้ทันที</li>
              <li>ระบบแจ้งเตือนอัตโนมัติเมื่อมีการเปลี่ยนแปลงแผนทริป ผ่าน LINE หรือ Web Push Notification</li>
              <li>ติดตามสถานะการรับทราบ (Read Receipt) ของลูกทริป</li>
              <li>ประกาศแพ็กเกจทัวร์บน Marketplace (ถ้ามี)</li>
              <li>จัดการโปรไฟล์บริษัทและ Portfolio สาธารณะ</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">4</span>
              ประเภทบัญชีและการสมัครสมาชิก
            </h2>
            <p>แพลตฟอร์มรองรับ 3 ประเภทบัญชี:</p>
            <div className="mt-3 grid gap-3">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-800">บริษัททัวร์ (Company)</h3>
                <p className="text-slate-500 mt-1">สำหรับบริษัทนำเที่ยวที่จดทะเบียนกับ ททท. สามารถเพิ่มทีมงาน (Editor) ได้</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-800">ไกด์อิสระ (Freelance Guide)</h3>
                <p className="text-slate-500 mt-1">สำหรับมัคคุเทศก์อิสระที่มีใบอนุญาตนำเที่ยว</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-slate-800">ส่วนตัว (Personal)</h3>
                <p className="text-slate-500 mt-1">สำหรับบุคคลทั่วไปที่ต้องการจัดทริปส่วนตัว (ไม่ต้องมีใบอนุญาต)</p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">5</span>
              แพลนการใช้งานและการชำระเงิน
            </h2>
            <div className="mt-3 space-y-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <h3 className="font-bold text-green-800">ทริปฟรี</h3>
                <p className="text-green-700 mt-1">ผู้ใช้ใหม่ทุกคนได้รับทริปฟรี 3 ทริป ไม่มีค่าใช้จ่าย ใช้ได้ไม่จำกัดเวลา</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800">ซื้อเพิ่ม (Pay-as-you-go)</h3>
                <p className="text-blue-700 mt-1">ซื้อทริปเพิ่มเมื่อต้องการ ไม่มีค่ารายเดือน ราคาขึ้นอยู่กับแพ็กที่เลือก</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 ml-5 list-disc text-slate-500">
              <li>การชำระเงินทำผ่านระบบที่ได้รับการรับรองความปลอดภัย</li>
              <li>เมื่อชำระเงินแล้วไม่สามารถขอคืนเงินได้ ยกเว้นกรณีที่ระบบมีข้อผิดพลาดจากฝั่งเรา</li>
              <li>ทริปที่ซื้อแล้วไม่มีวันหมดอายุ</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">6</span>
              ข้อจำกัดของแพลนฟรี
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-4 font-bold text-slate-700">รายการ</th>
                    <th className="py-2 pr-4 font-bold text-slate-700">ฟรี</th>
                    <th className="py-2 font-bold text-slate-700">ซื้อเพิ่ม</th>
                  </tr>
                </thead>
                <tbody className="text-slate-500">
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">จำนวนทริป</td><td className="py-2 pr-4">3 ทริป</td><td className="py-2">ไม่จำกัด</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">ผู้ติดตามต่อทริป</td><td className="py-2 pr-4">30 คน</td><td className="py-2">ไม่จำกัด</td></tr>
                  <tr className="border-b border-slate-50"><td className="py-2 pr-4">แก้ไขหลัง publish</td><td className="py-2 pr-4">5 ครั้ง/ทริป</td><td className="py-2">ไม่จำกัด</td></tr>
                  <tr><td className="py-2 pr-4">แจ้งเตือน</td><td className="py-2 pr-4">10 ครั้ง/เดือน</td><td className="py-2">ไม่จำกัด</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">7</span>
              หน้าที่ของผู้ใช้งาน
            </h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบันในการสมัครสมาชิก</li>
              <li>รักษาความลับของรหัสผ่าน ไม่แชร์บัญชีกับบุคคลอื่น</li>
              <li>ไม่ใช้แพลตฟอร์มเพื่อกิจกรรมที่ผิดกฎหมาย หลอกลวง หรือละเมิดสิทธิ์ผู้อื่น</li>
              <li>ไม่สร้างเนื้อหาที่ไม่เหมาะสม หมิ่นประมาท หรือเป็นภัยต่อสาธารณะ</li>
              <li>ให้ข้อมูลทริปที่ถูกต้องและตรงกับความเป็นจริงแก่ลูกทริป</li>
              <li>ปฏิบัติตามกฎหมายเกี่ยวกับการท่องเที่ยวและใบอนุญาตนำเที่ยว</li>
            </ul>
          </section>

          {/* 8 — Content Policy */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs font-black">8</span>
              นโยบายเนื้อหาและรูปภาพ (Content Policy)
            </h2>
            <p>ผู้ใช้งานเป็นผู้รับผิดชอบแต่เพียงผู้เดียวต่อเนื้อหาทั้งหมดที่อัปโหลดหรือเผยแพร่บนแพลตฟอร์ม ได้แก่ ข้อความ รูปภาพ อัลบั้มภาพ และข้อมูลแพ็กเกจทัวร์</p>

            <h3 className="font-bold text-slate-800 mt-5 mb-2">8.1 ลิขสิทธิ์รูปภาพ</h3>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>ผู้ใช้งาน <strong>ต้องเป็นเจ้าของ</strong> หรือ <strong>ได้รับอนุญาต</strong> ให้ใช้รูปภาพทุกรูปที่อัปโหลด</li>
              <li>ห้ามนำรูปภาพจากอินเทอร์เน็ต, Google, เว็บไซต์อื่น หรือแหล่งที่มีลิขสิทธิ์มาใช้โดยไม่ได้รับอนุญาต</li>
              <li>หากเจ้าของลิขสิทธิ์แจ้งเรื่อง [บริษัท] จะดำเนินการนำเนื้อหาออกทันที และอาจระงับบัญชีผู้ใช้ที่ละเมิด</li>
              <li>ผู้ใช้ต้องรับผิดชอบค่าเสียหายที่เกิดจากการละเมิดลิขสิทธิ์ด้วยตนเอง</li>
            </ul>

            <h3 className="font-bold text-slate-800 mt-5 mb-2">8.2 สิทธิ์ในภาพถ่ายของลูกทริป</h3>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mt-2">
              <p className="text-amber-800 font-semibold mb-2">สำคัญ: การใช้ภาพถ่ายของบุคคลอื่น</p>
              <ul className="space-y-2 ml-5 list-disc text-amber-700">
                <li>การนำภาพถ่ายของลูกทริปหรือบุคคลอื่นมาลงในอัลบั้มภาพ, หน้าทริป หรือแพ็กเกจทัวร์ <strong>ต้องได้รับความยินยอม</strong>จากบุคคลในภาพ</li>
                <li>ผู้ใช้งานต้องขออนุญาตจากลูกทริปก่อนนำภาพมาใช้ในทุกกรณี ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</li>
                <li>ภาพถ่ายของเด็กอายุต่ำกว่า 20 ปี ต้องได้รับความยินยอมจากผู้ปกครอง</li>
                <li>หากบุคคลในภาพร้องขอให้นำภาพออก ผู้ใช้ต้องดำเนินการโดยทันที</li>
              </ul>
            </div>

            <h3 className="font-bold text-slate-800 mt-5 mb-2">8.3 เนื้อหาที่ห้ามเผยแพร่</h3>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>เนื้อหาที่ผิดกฎหมาย หลอกลวง หรือทำให้เข้าใจผิดเกี่ยวกับบริการท่องเที่ยว</li>
              <li>เนื้อหาที่ไม่เหมาะสม ลามกอนาจาร หรือเป็นภัยต่อสาธารณะ</li>
              <li>เนื้อหาที่ละเมิดสิทธิ์ส่วนบุคคล หมิ่นประมาท หรือสร้างความเกลียดชัง</li>
              <li>ข้อมูลเท็จเกี่ยวกับราคา สถานที่ หรือบริการที่ไม่ตรงกับความเป็นจริง</li>
              <li>สแปม โฆษณาที่ไม่เกี่ยวข้อง หรือเนื้อหาเพื่อหลอกลวงผู้บริโภค</li>
            </ul>

            <h3 className="font-bold text-slate-800 mt-5 mb-2">8.4 การแจ้งเนื้อหาที่ละเมิด</h3>
            <p className="text-slate-500">หากท่านพบเนื้อหาที่ละเมิดลิขสิทธิ์ สิทธิ์ส่วนบุคคล หรือไม่เหมาะสม สามารถแจ้งได้ที่ report@tripapp.co โดยระบุ:</p>
            <ul className="mt-2 space-y-1 ml-5 list-disc text-slate-500">
              <li>URL ของเนื้อหาที่ต้องการแจ้ง</li>
              <li>เหตุผลที่ต้องการให้นำออก</li>
              <li>หลักฐานแสดงสิทธิ์ (กรณีลิขสิทธิ์)</li>
            </ul>
            <p className="mt-2 text-slate-500">[บริษัท] จะตรวจสอบและดำเนินการภายใน 7 วันทำการ</p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">9</span>
              ทรัพย์สินทางปัญญา
            </h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>เนื้อหาทริปที่คุณสร้าง (ข้อความ รูปภาพ ข้อมูล) เป็นทรัพย์สินของคุณ</li>
              <li>คุณให้สิทธิ์แพลตฟอร์มในการแสดงผลเนื้อหาตามวัตถุประสงค์ของบริการเท่านั้น</li>
              <li>แพลตฟอร์ม โลโก้ และระบบต่างๆ เป็นทรัพย์สินของ [บริษัท]</li>
              <li>ห้ามคัดลอก ดัดแปลง หรือนำระบบไปใช้โดยไม่ได้รับอนุญาต</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">10</span>
              การระงับและยกเลิกบัญชี
            </h2>
            <p>[บริษัท] ขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีในกรณี:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li>ละเมิดเงื่อนไขการใช้งาน</li>
              <li>ใช้งานในทางที่ไม่เหมาะสมหรือผิดกฎหมาย</li>
              <li>สร้างเนื้อหาที่เป็นอันตรายหรือหลอกลวง</li>
              <li>พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</li>
              <li>ไม่มีการใช้งานเกิน 12 เดือน (จะแจ้งเตือนก่อนดำเนินการ)</li>
            </ul>
            <p className="mt-3">ผู้ใช้สามารถลบบัญชีด้วยตนเองได้ทุกเมื่อผ่านหน้าตั้งค่า ข้อมูลทั้งหมดจะถูกลบภายใน 30 วัน</p>
          </section>

          {/* 11 — Platform Liability */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs font-black">11</span>
              ข้อจำกัดความรับผิดชอบ (Platform Liability)
            </h2>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
              <p className="text-red-800 font-bold mb-2">TripApp เป็นแพลตฟอร์มกลางให้บริการเครื่องมือเท่านั้น</p>
              <p className="text-red-700 text-xs">[บริษัท] ไม่ได้เป็นบริษัทนำเที่ยว ตัวแทนจำหน่ายทัวร์ สายการบิน โรงแรม หรือผู้ให้บริการท่องเที่ยว</p>
            </div>
            <ul className="space-y-3 ml-5 list-disc text-slate-500">
              <li>[บริษัท] <strong>ไม่รับผิดชอบ</strong>ต่อเนื้อหา ข้อมูล รูปภาพ หรืออัลบั้มภาพที่ผู้ใช้งานสร้างขึ้นหรืออัปโหลดบนแพลตฟอร์ม</li>
              <li>[บริษัท] <strong>ไม่รับผิดชอบ</strong>ต่อความถูกต้องของข้อมูลทริป ราคาแพ็กเกจ หรือบริการที่ผู้ใช้งานเสนอแก่ลูกทริป</li>
              <li>[บริษัท] <strong>ไม่ใช่คู่สัญญา</strong>ระหว่างผู้ใช้งาน (บริษัททัวร์/ไกด์) กับลูกทริป ข้อตกลงทางธุรกิจระหว่างทั้งสองฝ่ายเป็นความรับผิดชอบของแต่ละฝ่ายเอง</li>
              <li>หากเกิดข้อพิพาทระหว่างผู้ใช้งานกับลูกทริป หรือระหว่างผู้ใช้งานกับบุคคลที่สาม (เช่น เจ้าของลิขสิทธิ์ภาพ) ทั้งสองฝ่าย<strong>ต้องตกลงกันเอง</strong>โดย [บริษัท] ไม่มีส่วนเกี่ยวข้อง</li>
              <li>หากเกิดความเสียหายจากการใช้ภาพที่ละเมิดลิขสิทธิ์ หรือภาพที่ไม่ได้รับอนุญาตจากบุคคลในภาพ ผู้ใช้งานต้องรับผิดชอบแต่เพียงผู้เดียว</li>
              <li>[บริษัท] ไม่รับประกันว่าระบบจะทำงานได้ตลอดเวลาโดยไม่มีข้อผิดพลาด แต่จะพยายามแก้ไขโดยเร็วที่สุดหากเกิดปัญหา</li>
            </ul>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">12</span>
              การเปลี่ยนแปลงเงื่อนไข
            </h2>
            <p>เงื่อนไขอาจมีการเปลี่ยนแปลงเป็นครั้งคราว เมื่อมีการเปลี่ยนแปลงที่สำคัญ:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li>ระบบจะแจ้งเตือนผ่านอีเมลหรือ Notification ในระบบ</li>
              <li>จะแสดงวันที่อัปเดตล่าสุดด้านบนของเอกสาร</li>
              <li>การใช้งานต่อหลังจากวันที่มีผลบังคับใช้ถือว่าคุณยอมรับเงื่อนไขใหม่</li>
            </ul>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">13</span>
              กฎหมายที่ใช้บังคับ
            </h2>
            <p>เงื่อนไขการใช้งานนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย หากมีข้อพิพาทที่ไม่สามารถตกลงกันได้ ให้ใช้ศาลที่มีเขตอำนาจในกรุงเทพมหานครเป็นศาลที่มีอำนาจพิจารณา</p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">14</span>
              ช่องทางติดต่อ
            </h2>
            <p>หากมีคำถามเกี่ยวกับเงื่อนไขการใช้งาน สามารถติดต่อได้ที่:</p>
            <div className="mt-3 p-4 bg-slate-50 rounded-xl space-y-2 text-slate-500">
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">mail</span> support@tripapp.co</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">chat</span> LINE Official: @tripapp</p>
              <p className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-slate-400">schedule</span> เวลาทำการ: จันทร์ - ศุกร์ 09:00 - 18:00 น.</p>
            </div>
          </section>

        </div>
      </div>

      <p className="text-center text-xs text-slate-300 mt-8">TripApp Terms of Service v1.0 — Draft สำหรับตรวจสอบ</p>
    </div>
  );
}
