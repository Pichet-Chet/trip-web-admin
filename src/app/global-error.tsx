"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="th">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center font-sans">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <span style={{ fontSize: "2rem" }}>⚠️</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">เกิดข้อผิดพลาดร้ายแรง</h1>
            <p className="text-sm text-slate-500 max-w-xs">
              แอปพลิเคชันเกิดข้อผิดพลาดที่ไม่สามารถกู้คืนได้ กรุณาโหลดหน้าใหม่
            </p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            โหลดหน้าใหม่
          </button>
        </div>
      </body>
    </html>
  );
}
