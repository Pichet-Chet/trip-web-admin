import React from "react";

export default function MaintenancePage(): React.JSX.Element {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--surface)", color: "var(--on-surface)" }}
    >
      {/* Navbar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          borderColor: "var(--outline-variant)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ color: "var(--primary)" }}
            >
              travel_explore
            </span>
            <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
              TripApp
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        {/* Background gradient — same as hero */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, var(--primary-container) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 shadow-sm"
            style={{ backgroundColor: "var(--primary-container)" }}
          >
            <span
              className="material-symbols-outlined text-4xl"
              style={{
                color: "var(--primary)",
                fontVariationSettings: "'FILL' 1",
              }}
            >
              engineering
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--on-surface)" }}>
            ระบบปิดปรับปรุงชั่วคราว
          </h1>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{ color: "var(--on-surface-variant)" }}
          >
            เราอยู่ระหว่างการปรับปรุงระบบเพื่อให้บริการที่ดียิ่งขึ้น
            <br />
            กรุณาลองใหม่อีกครั้งในภายหลัง
          </p>

          {/* Status chip */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              backgroundColor: "var(--surface-container)",
              color: "var(--on-surface-variant)",
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--warning)" }}
            />
            กำลังดำเนินการ...
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-5 text-center text-xs border-t"
        style={{
          color: "var(--on-surface-variant)",
          borderColor: "var(--outline-variant)",
          opacity: 0.7,
        }}
      >
        © {new Date().getFullYear()} TripApp
      </footer>
    </div>
  );
}
