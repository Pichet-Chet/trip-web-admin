export function TermsContent(): React.ReactNode {
  return (
    <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">1. คำนิยาม</h2>
        <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
          <li><strong>&quot;แพลตฟอร์ม&quot;</strong> หมายถึง ระบบ TripApp รวมถึงเว็บไซต์ แอปพลิเคชัน และ API</li>
          <li><strong>&quot;ผู้ใช้งาน&quot;</strong> หมายถึง บริษัททัวร์ ไกด์อิสระ หรือบุคคลที่สมัครใช้งาน</li>
          <li><strong>&quot;ลูกทริป&quot;</strong> หมายถึง บุคคลที่ได้รับลิงก์ทริปและเข้าดูแผนการเดินทาง</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">2. การยอมรับเงื่อนไข</h2>
        <p>เมื่อคุณสมัครสมาชิก เข้าสู่ระบบ หรือใช้งานแพลตฟอร์ม ถือว่าคุณยอมรับเงื่อนไขทั้งหมดที่ระบุไว้</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">3. ขอบเขตการให้บริการ</h2>
        <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
          <li>สร้าง แก้ไข และเผยแพร่แผนทริปพร้อมรายละเอียดกิจกรรม ที่พัก สายการบิน</li>
          <li>แชร์ลิงก์ทริปและ QR Code</li>
          <li>ระบบแจ้งเตือนอัตโนมัติผ่าน LINE หรือ Web Push</li>
          <li>ติดตามสถานะการรับทราบ (Read Receipt)</li>
          <li>ประกาศแพ็กเกจทัวร์บน Marketplace</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">4. ประเภทบัญชี</h2>
        <p>รองรับ 3 ประเภท: บริษัททัวร์ (Company), ไกด์อิสระ (Freelance Guide), ส่วนตัว (Personal)</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">5. แพลนและการชำระเงิน</h2>
        <p>ผู้ใช้ใหม่ได้รับทริปฟรี 3 ทริป ซื้อเพิ่มแบบ Pay-as-you-go เมื่อชำระแล้วไม่สามารถขอคืนเงินได้ ทริปที่ซื้อไม่มีวันหมดอายุ</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">6. หน้าที่ของผู้ใช้งาน</h2>
        <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
          <li>ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน</li>
          <li>รักษาความลับของรหัสผ่าน</li>
          <li>ไม่ใช้แพลตฟอร์มเพื่อกิจกรรมที่ผิดกฎหมาย</li>
          <li>ปฏิบัติตามกฎหมายเกี่ยวกับการท่องเที่ยวและใบอนุญาตนำเที่ยว</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-red-700 mb-2">7. นโยบายเนื้อหาและรูปภาพ</h2>
        <p className="font-semibold text-slate-700 mb-2">ผู้ใช้งานเป็นผู้รับผิดชอบแต่เพียงผู้เดียวต่อเนื้อหาทั้งหมดที่อัปโหลด</p>
        <h3 className="font-bold text-slate-700 mt-3 mb-1">7.1 ลิขสิทธิ์รูปภาพ</h3>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>ต้องเป็นเจ้าของหรือได้รับอนุญาตให้ใช้รูปภาพทุกรูปที่อัปโหลด</li>
          <li>ห้ามนำรูปภาพจากอินเทอร์เน็ตมาใช้โดยไม่ได้รับอนุญาต</li>
          <li>หากเจ้าของลิขสิทธิ์แจ้ง [บริษัท] จะนำเนื้อหาออกทันทีและอาจระงับบัญชี</li>
        </ul>
        <h3 className="font-bold text-slate-700 mt-3 mb-1">7.2 สิทธิ์ในภาพถ่ายของลูกทริป</h3>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 mt-1">
          <p className="font-bold mb-1">สำคัญ:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>การนำภาพของลูกทริปมาลงต้องได้รับความยินยอมจากบุคคลในภาพ ตาม PDPA</li>
            <li>ภาพของเด็กอายุต่ำกว่า 20 ปีต้องได้รับความยินยอมจากผู้ปกครอง</li>
            <li>หากบุคคลในภาพร้องขอให้นำภาพออก ต้องดำเนินการทันที</li>
          </ul>
        </div>
        <h3 className="font-bold text-slate-700 mt-3 mb-1">7.3 เนื้อหาที่ห้ามเผยแพร่</h3>
        <ul className="space-y-1 ml-5 list-disc text-slate-500 text-xs">
          <li>เนื้อหาที่ผิดกฎหมาย หลอกลวง ลามกอนาจาร</li>
          <li>เนื้อหาที่ละเมิดสิทธิ์ส่วนบุคคล หมิ่นประมาท</li>
          <li>ข้อมูลเท็จเกี่ยวกับราคา สถานที่ หรือบริการ</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-red-700 mb-2">8. ข้อจำกัดความรับผิดชอบ (Platform Liability)</h2>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs mb-3">
          <p className="text-red-800 font-bold">TripApp เป็นแพลตฟอร์มกลางให้บริการเครื่องมือเท่านั้น</p>
        </div>
        <ul className="space-y-1.5 ml-5 list-disc text-slate-500">
          <li>[บริษัท] <strong>ไม่รับผิดชอบ</strong>ต่อเนื้อหา ข้อมูล รูปภาพ หรืออัลบั้มภาพที่ผู้ใช้งานสร้างขึ้น</li>
          <li>[บริษัท] <strong>ไม่ใช่คู่สัญญา</strong>ระหว่างผู้ใช้งานกับลูกทริป</li>
          <li>หากเกิดข้อพิพาท ทั้งสองฝ่าย<strong>ต้องตกลงกันเอง</strong>โดย [บริษัท] ไม่มีส่วนเกี่ยวข้อง</li>
          <li>ผู้ใช้งานต้องรับผิดชอบต่อการละเมิดลิขสิทธิ์และสิทธิ์ส่วนบุคคลแต่เพียงผู้เดียว</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">9. การระงับบัญชี</h2>
        <p>[บริษัท] ขอสงวนสิทธิ์ระงับบัญชีที่ละเมิดเงื่อนไข สร้างเนื้อหาที่ไม่เหมาะสม หรือใช้งานผิดกฎหมาย</p>
      </section>
      <section>
        <h2 className="text-base font-bold text-slate-900 mb-2">10. กฎหมายที่ใช้บังคับ</h2>
        <p>เงื่อนไขนี้อยู่ภายใต้กฎหมายแห่งราชอาณาจักรไทย ศาลที่มีเขตอำนาจในกรุงเทพมหานคร</p>
      </section>
      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-300">
        TripApp Terms of Service v1.0 — Draft
      </div>
    </div>
  );
}
