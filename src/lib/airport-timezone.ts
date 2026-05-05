/**
 * Static map of the ~60 most-common IATA airport codes → IANA timezone.
 * Used only for display (UTC offset label). Falls back to undefined when unknown.
 */
const AIRPORT_TZ: Record<string, string> = {
  // Thailand
  BKK: "Asia/Bangkok", DMK: "Asia/Bangkok", HKT: "Asia/Bangkok",
  CNX: "Asia/Bangkok", CEI: "Asia/Bangkok", HDY: "Asia/Bangkok",
  USM: "Asia/Bangkok", KBV: "Asia/Bangkok", UTP: "Asia/Bangkok",
  // Japan
  NRT: "Asia/Tokyo", HND: "Asia/Tokyo", KIX: "Asia/Tokyo",
  CTS: "Asia/Tokyo", FUK: "Asia/Tokyo", NGO: "Asia/Tokyo",
  // Singapore
  SIN: "Asia/Singapore",
  // South Korea
  ICN: "Asia/Seoul", GMP: "Asia/Seoul", PUS: "Asia/Seoul",
  // China
  PEK: "Asia/Shanghai", PKX: "Asia/Shanghai", PVG: "Asia/Shanghai",
  SHA: "Asia/Shanghai", CAN: "Asia/Shanghai", SZX: "Asia/Shanghai",
  CTU: "Asia/Shanghai",
  // Hong Kong
  HKG: "Asia/Hong_Kong",
  // Taiwan
  TPE: "Asia/Taipei", TSA: "Asia/Taipei",
  // Vietnam
  SGN: "Asia/Ho_Chi_Minh", HAN: "Asia/Bangkok", DAD: "Asia/Bangkok",
  // Indonesia
  CGK: "Asia/Jakarta", DPS: "Asia/Makassar", SUB: "Asia/Jakarta",
  // Malaysia
  KUL: "Asia/Kuala_Lumpur", PEN: "Asia/Kuala_Lumpur",
  // Philippines
  MNL: "Asia/Manila", CEB: "Asia/Manila",
  // India
  DEL: "Asia/Kolkata", BOM: "Asia/Kolkata", MAA: "Asia/Kolkata",
  BLR: "Asia/Kolkata",
  // UAE
  DXB: "Asia/Dubai", AUH: "Asia/Dubai",
  // Europe
  LHR: "Europe/London", LGW: "Europe/London", CDG: "Europe/Paris",
  ORY: "Europe/Paris", AMS: "Europe/Amsterdam", FRA: "Europe/Berlin",
  MUC: "Europe/Berlin", ZRH: "Europe/Zurich", FCO: "Europe/Rome",
  BCN: "Europe/Madrid", MAD: "Europe/Madrid", ATH: "Europe/Athens",
  // USA
  LAX: "America/Los_Angeles", SFO: "America/Los_Angeles",
  JFK: "America/New_York",  EWR: "America/New_York",
  ORD: "America/Chicago", DFW: "America/Chicago",
  // Australia / NZ
  SYD: "Australia/Sydney", MEL: "Australia/Melbourne",
  AKL: "Pacific/Auckland",
  // Saudi Arabia
  RUH: "Asia/Riyadh", JED: "Asia/Riyadh",
};

/** Returns the IANA timezone for a given IATA airport code, or undefined. */
export function airportTimezone(iataCode: string): string | undefined {
  return AIRPORT_TZ[iataCode?.toUpperCase().trim()];
}

/** Returns a short UTC offset label, e.g. "UTC+7" or "UTC+9:30". */
export function utcOffsetLabel(ianaZone: string, date?: Date): string {
  try {
    const d = date ?? new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(d);
    const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // "GMT+7" → "UTC+7"
    return tz.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

/** Given an airport code and a time string (HH:mm), returns "HH:mm (UTC+N)" or just "HH:mm". */
export function timeWithZone(iataCode: string, time: string, date?: Date): string {
  if (!time) return "";
  const tz = airportTimezone(iataCode);
  if (!tz) return time;
  const offset = utcOffsetLabel(tz, date);
  return offset ? `${time} (${offset})` : time;
}
