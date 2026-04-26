/**
 * Branded auth-page hero panel — replaces external Unsplash placeholder.
 * Pure CSS gradient + inline SVG pattern, zero network dependency.
 */
export function AuthHero(): React.ReactNode {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Layered gradient — brand-blue → deep blue */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500 via-blue-700 to-indigo-900" />

      {/* Soft radial highlight */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)",
        }}
      />

      {/* SVG dot pattern — subtle texture */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="hero-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      {/* Decorative airplane silhouette — feels travel-y without copyrighted imagery */}
      <svg
        className="absolute -right-20 -bottom-10 w-[500px] h-[500px] opacity-10 rotate-[-15deg]"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="white"
        aria-hidden="true"
      >
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    </div>
  );
}
