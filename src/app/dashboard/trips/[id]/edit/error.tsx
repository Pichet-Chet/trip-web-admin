"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TripEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactNode {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-amber-500">edit_off</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-lg font-bold text-(--on-surface)">ไม่สามารถโหลดหน้าแก้ไขทริปได้</h1>
        <p className="text-sm text-(--outline) max-w-xs">
          เกิดข้อผิดพลาดขณะโหลดข้อมูลทริป กรุณาลองใหม่หรือกลับไปหน้ารายการ
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/dashboard/my-trips")}
          className="px-5 py-2.5 border border-(--outline-variant) text-(--on-surface) rounded-xl text-sm font-semibold hover:bg-(--surface-variant) transition-colors"
        >
          กลับหน้ารายการ
        </button>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-(--primary) text-(--on-primary) rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}
