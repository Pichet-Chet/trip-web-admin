"use client";

import { Pagination } from "@/components/shared";

type TxStatus = "success" | "pending" | "failed";

const statusStyle: Record<TxStatus, string> = {
  success: "bg-green-50 text-green-600",
  pending: "bg-amber-50 text-amber-600",
  failed: "bg-red-50 text-red-600",
};

const transactions = [
  { id: "INV-2569-004", date: "24 มี.ค. 2569", plan: "Pro (รายเดือน)", amount: 299, method: "PromptPay", status: "success" as TxStatus },
  { id: "INV-2569-003", date: "24 ก.พ. 2569", plan: "Pro (รายเดือน)", amount: 299, method: "Visa •••• 4242", status: "success" as TxStatus },
  { id: "INV-2569-002", date: "24 ม.ค. 2569", plan: "Pro (รายเดือน)", amount: 299, method: "Visa •••• 4242", status: "success" as TxStatus },
  { id: "INV-2569-001", date: "24 ธ.ค. 2568", plan: "Pro (รายเดือน)", amount: 299, method: "PromptPay", status: "pending" as TxStatus },
  { id: "INV-2568-012", date: "24 พ.ย. 2568", plan: "Pro (รายเดือน)", amount: 299, method: "Visa •••• 4242", status: "failed" as TxStatus },
];

export default function BillingPage(): React.ReactNode {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">ประวัติการชำระเงิน</h1>
        <p className="text-slate-500 mt-1 text-sm">ดูและจัดการประวัติการชำระเงินของคุณ</p>
      </div>

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">แพลนปัจจุบัน</p>
            <p className="text-xl font-bold text-slate-900">Pro</p>
            <p className="text-sm text-slate-500">฿299 / เดือน</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-md tracking-wider">Active</span>
          </div>
          <span className="material-symbols-outlined text-blue-600 text-xl">workspace_premium</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">วันเรียกเก็บถัดไป</p>
            <p className="text-xl font-bold text-slate-900">24 เม.ย. 2569</p>
            <p className="text-sm text-slate-500">ต่ออายุอัตโนมัติ</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-xl">calendar_today</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">ยอดชำระรวม</p>
            <p className="text-xl font-bold text-slate-900">฿1,495.00</p>
            <p className="text-sm text-slate-500">ตั้งแต่ ธ.ค. 2568</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 text-xl">receipt_long</span>
        </div>
      </div>

      {/* ═══ Transaction Logs ═══ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">รายการชำระเงิน</h2>
          <button className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">download</span>
            ส่งออกทั้งหมด
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">วันที่</th>
                <th className="px-6 py-4">แพลน</th>
                <th className="px-6 py-4">จำนวนเงิน</th>
                <th className="px-6 py-4">ช่องทาง</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{tx.date}</p>
                    <p className="text-[11px] text-slate-400">{tx.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.plan}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">฿{tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.method}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${statusStyle[tx.status]}`}>
                      {tx.status === "success" ? "สำเร็จ" : tx.status === "pending" ? "รอดำเนินการ" : "ล้มเหลว"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {tx.status === "success" ? (
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    ) : tx.status === "failed" ? (
                      <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                    ) : (
                      <span className="material-symbols-outlined text-amber-400 text-lg">info</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={1} totalPages={1} totalItems={transactions.length} pageSize={10} onPageChange={() => {}} />
      </div>

      {/* ═══ Footer Info ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-blue-600">verified_user</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">การชำระเงินปลอดภัย</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">ข้อมูลการชำระเงินทั้งหมดถูกเข้ารหัสและดำเนินการอย่างปลอดภัย ระบบไม่เก็บข้อมูลบัตรเครดิตของคุณ</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-slate-400">receipt</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">ต้องการใบกำกับภาษี?</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">หากต้องการใบกำกับภาษีหรือเพิ่มข้อมูลบริษัทในใบเสร็จ กรุณาติดต่อฝ่ายสนับสนุน</p>
          </div>
        </div>
      </div>
    </div>
  );
}
