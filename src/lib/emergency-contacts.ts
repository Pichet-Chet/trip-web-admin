/**
 * Country-specific emergency-contact prefill for international trips.
 *
 * Used by /trips/new to populate the Emergency Contacts section once
 * the operator picks an international scope and types a recognised
 * destination. Keys match the first comma-separated token of the
 * destination field so "Japan, Tokyo" and "Japan" both resolve.
 *
 * This is FE-static for now to keep the prefill responsive and let us
 * ship without a BE schema discussion. Long-term home: a `country_
 * emergency_contacts` table on the API so admin staff can curate
 * additions and other tools (mobile app onboarding, exports, ...) can
 * read the same data. Until then, treat this file as the source of
 * truth and PR additions/corrections here.
 *
 * Sources / how to extend:
 *  - Police / medical: each country's official services site.
 *  - Embassy: Royal Thai Embassy / Consulate-General locator at
 *    https://www.thaiembassy.org. Use the 24h emergency hotline
 *    listed for Thai nationals; fall back to the main switchboard.
 *  - Phones include the international dialing prefix so the operator
 *    can copy-paste into a phone app on a roaming SIM without thinking.
 */

export interface EmergencyPrefillEntry {
  /** Display label, e.g. "สถานทูตไทย ณ กรุงโตเกียว". */
  name: string;
  phone: string;
}

export interface EmergencyPrefillSet {
  embassy: EmergencyPrefillEntry;
  police: EmergencyPrefillEntry;
  medical: EmergencyPrefillEntry;
}

const PREFILL_BY_COUNTRY: Record<string, EmergencyPrefillSet> = {
  japan: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงโตเกียว", phone: "+81-3-3441-1386" },
    police: { name: "ตำรวจท้องถิ่น (Japan)", phone: "110" },
    medical: { name: "แพทย์ฉุกเฉิน (Japan)", phone: "119" },
  },
  korea: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงโซล", phone: "+82-2-795-3098" },
    police: { name: "ตำรวจท้องถิ่น (Korea)", phone: "112" },
    medical: { name: "แพทย์ฉุกเฉิน (Korea)", phone: "119" },
  },
  singapore: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ สิงคโปร์", phone: "+65-6737-2475" },
    police: { name: "ตำรวจท้องถิ่น (Singapore)", phone: "999" },
    medical: { name: "แพทย์ฉุกเฉิน (Singapore)", phone: "995" },
  },
  taiwan: {
    embassy: { name: "สำนักงานการค้าและเศรษฐกิจไทย ไทเป", phone: "+886-2-2581-1979" },
    police: { name: "ตำรวจท้องถิ่น (Taiwan)", phone: "110" },
    medical: { name: "แพทย์ฉุกเฉิน (Taiwan)", phone: "119" },
  },
  vietnam: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงฮานอย", phone: "+84-24-3823-5092" },
    police: { name: "ตำรวจท้องถิ่น (Vietnam)", phone: "113" },
    medical: { name: "แพทย์ฉุกเฉิน (Vietnam)", phone: "115" },
  },
  malaysia: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงกัวลาลัมเปอร์", phone: "+60-3-2148-8222" },
    police: { name: "ตำรวจท้องถิ่น (Malaysia)", phone: "999" },
    medical: { name: "แพทย์ฉุกเฉิน (Malaysia)", phone: "999" },
  },
  indonesia: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงจาการ์ตา", phone: "+62-21-2932-8202" },
    police: { name: "ตำรวจท้องถิ่น (Indonesia)", phone: "110" },
    medical: { name: "แพทย์ฉุกเฉิน (Indonesia)", phone: "118" },
  },
  bali: {
    // Bali is in Indonesia; we keep a separate key because the consulate
    // in Bali has a more useful local hotline than the Jakarta number
    // for tourists in Bali.
    embassy: { name: "สถานกงสุลใหญ่ไทย ณ บาหลี", phone: "+62-361-263-310" },
    police: { name: "ตำรวจท้องถิ่น (Bali)", phone: "110" },
    medical: { name: "แพทย์ฉุกเฉิน (Indonesia)", phone: "118" },
  },
  china: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ กรุงปักกิ่ง", phone: "+86-10-8531-8755" },
    police: { name: "ตำรวจท้องถิ่น (China)", phone: "110" },
    medical: { name: "แพทย์ฉุกเฉิน (China)", phone: "120" },
  },
  "hong kong": {
    embassy: { name: "สถานกงสุลใหญ่ไทย ฮ่องกง", phone: "+852-2521-6481" },
    police: { name: "ตำรวจท้องถิ่น (Hong Kong)", phone: "999" },
    medical: { name: "แพทย์ฉุกเฉิน (Hong Kong)", phone: "999" },
  },
  australia: {
    embassy: { name: "สถานเอกอัครราชทูตไทย ณ แคนเบอร์รา", phone: "+61-2-6206-0100" },
    police: { name: "ตำรวจท้องถิ่น (Australia)", phone: "000" },
    medical: { name: "แพทย์ฉุกเฉิน (Australia)", phone: "000" },
  },
};

const ALIASES: Record<string, string> = {
  // Common Thai spellings for the most-trafficked destinations. Resolves
  // before falling through to the English keys.
  ญี่ปุ่น: "japan",
  โตเกียว: "japan",
  เกาหลี: "korea",
  โซล: "korea",
  สิงคโปร์: "singapore",
  ไต้หวัน: "taiwan",
  ไทเป: "taiwan",
  เวียดนาม: "vietnam",
  ฮานอย: "vietnam",
  มาเลเซีย: "malaysia",
  อินโดนีเซีย: "indonesia",
  จาการ์ตา: "indonesia",
  บาหลี: "bali",
  จีน: "china",
  ปักกิ่ง: "china",
  ฮ่องกง: "hong kong",
  ออสเตรเลีย: "australia",
};

/**
 * Resolve an international destination string to a prefill set, or null
 * when no country can be inferred (operator should fill manually).
 *
 * Matching strategy:
 *   1. Take the first comma-separated token (operators commonly write
 *      "Japan, Tokyo" or "Korea, Seoul").
 *   2. Lower-case + trim, check the alias table (Thai names) and the
 *      direct keys.
 *   3. As a final fallback, scan the whole string for any known city
 *      keyword — covers "Tokyo trip 2026" without a country prefix.
 */
export function lookupEmergencyPrefill(destination: string): EmergencyPrefillSet | null {
  const trimmed = destination.trim();
  if (!trimmed) return null;

  const head = trimmed.split(",")[0].trim().toLowerCase();
  if (PREFILL_BY_COUNTRY[head]) return PREFILL_BY_COUNTRY[head];
  if (ALIASES[head]) return PREFILL_BY_COUNTRY[ALIASES[head]];

  // Scan for any keyword anywhere in the string (covers "Tokyo trip").
  const lower = trimmed.toLowerCase();
  for (const [alias, countryKey] of Object.entries(ALIASES)) {
    if (lower.includes(alias.toLowerCase())) return PREFILL_BY_COUNTRY[countryKey];
  }
  for (const country of Object.keys(PREFILL_BY_COUNTRY)) {
    if (lower.includes(country)) return PREFILL_BY_COUNTRY[country];
  }
  return null;
}
