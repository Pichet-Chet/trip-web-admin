"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-red-500">error</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-(--on-surface)">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-(--outline) max-w-xs">
          เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-(--primary) text-(--on-primary) rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        ลองใหม่
      </button>
    </div>
  );
}
