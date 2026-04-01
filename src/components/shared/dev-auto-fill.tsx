"use client";

const isDev = process.env.NODE_ENV === "development";

interface DevAutoFillProps {
  onFill: () => void;
  label?: string;
}

/**
 * ปุ่ม Auto Fill สำหรับ dev mode เท่านั้น
 * ไม่แสดงใน production
 * ใช้ได้ทุกหน้าที่มี form
 */
export function DevAutoFill({ onFill, label = "Auto Fill" }: DevAutoFillProps): React.ReactNode {
  if (!isDev) return null;

  return (
    <button
      type="button"
      onClick={onFill}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-full text-xs font-bold shadow-lg hover:bg-amber-600 active:scale-95 transition-all"
    >
      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
      {label}
    </button>
  );
}
