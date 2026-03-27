export default function TermsPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">เงื่อนไขการใช้งาน</h1>
        <p className="text-slate-400 mt-2 text-sm">อัปเดตล่าสุด: 1 มีนาคม 2569</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-10 space-y-8 text-sm text-slate-600 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. การยอมรับเงื่อนไข</h2>
            <p>เมื่อคุณสมัครสมาชิกและเข้าใช้งานระบบ ถือว่าคุณยอมรับเงื่อนไขการใช้งานทั้งหมดที่ระบุไว้ในเอกสารนี้ หากไม่ยอมรับ กรุณาหยุดใช้งานระบบทันที</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. ขอบเขตการให้บริการ</h2>
            <p>ระบบนี้ให้บริการสร้างและจัดการแผนทริปสำหรับบริษัททัวร์และไกด์อิสระ รวมถึง:</p>
            <ul className="mt-3 space-y-2 ml-5 list-disc text-slate-500">
              <li>สร้าง แก้ไข และเผยแพร่แผนทริป</li>
              <li>แชร์ลิงก์ทริปและ QR Code ให้ลูกทริป</li>
              <li>ระบบแจ้งเตือนเมื่อมีการเปลี่ยนแปลงแผนทริป</li>
              <li>ติดตามสถานะการรับทราบของลูกทริป</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. แพลนและการชำระเงิน</h2>
            <p>ระบบมีแพลนการใช้งาน 3 ระดับ: Free, Pro (฿299/เดือน) และ Business (฿599/เดือน) การชำระเงินเป็นรายเดือนและต่ออายุอัตโนมัติ สามารถยกเลิกได้ทุกเมื่อ</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. ข้อจำกัดของแพลน Free</h2>
            <ul className="space-y-2 ml-5 list-disc text-slate-500">
              <li>สร้างทริปได้ 3 ทริป</li>
              <li>ผู้ติดตามสูงสุด 30 คนต่อทริป</li>
              <li>แก้ไขหลัง publish ได้ 2 ครั้งต่อทริป</li>
              <li>ส่งแจ้งเตือน 10 ครั้งต่อเดือน</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. การระงับบัญชี</h2>
            <p>ทีมงานขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีที่ละเมิดเงื่อนไข ใช้งานในทางที่ไม่เหมาะสม หรือสร้างเนื้อหาที่ผิดกฎหมาย</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. การเปลี่ยนแปลงเงื่อนไข</h2>
            <p>เงื่อนไขอาจมีการเปลี่ยนแปลงเป็นครั้งคราว ระบบจะแจ้งเตือนเมื่อมีการเปลี่ยนแปลงที่สำคัญ การใช้งานต่อหลังจากมีการเปลี่ยนแปลงถือว่าคุณยอมรับเงื่อนไขใหม่</p>
          </section>

        </div>
      </div>
    </div>
  );
}
