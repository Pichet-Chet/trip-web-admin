import Link from "next/link";

export default function NotFound(): React.ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-8xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">ไม่พบหน้านี้</h1>
      <p className="text-sm text-slate-500 mb-8 max-w-sm">หน้าที่คุณกำลังหาอาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง</p>
      <div className="flex gap-3">
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
          กลับหน้าหลัก
        </Link>
        <Link href="/dashboard/help" className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
          ช่วยเหลือ
        </Link>
      </div>
    </div>
  );
}
