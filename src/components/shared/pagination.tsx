"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }: PaginationProps): React.ReactNode {
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="px-6 py-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
      <p className="text-xs text-slate-500">แสดง {from}-{to} จาก {totalItems} รายการ</p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ก่อนหน้า
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              page === currentPage ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-xs font-medium text-slate-400 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
