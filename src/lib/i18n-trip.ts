export type TripLang = string;

export type TripTranslations = {
  label: string;
  flag: string;
};

// Known language display metadata — extend as needed.
// Falls back to uppercase code + 🌐 for unknown codes.
export const TRIP_LANGUAGES: Record<string, TripTranslations> = {
  th: { label: "ไทย", flag: "🇹🇭" },
  en: { label: "English", flag: "🇬🇧" },
  ja: { label: "日本語", flag: "🇯🇵" },
  ko: { label: "한국어", flag: "🇰🇷" },
  "zh-cn": { label: "中文(简)", flag: "🇨🇳" },
  "zh-tw": { label: "中文(繁)", flag: "🇹🇼" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  fr: { label: "Français", flag: "🇫🇷" },
  es: { label: "Español", flag: "🇪🇸" },
  ru: { label: "Русский", flag: "🇷🇺" },
  ar: { label: "العربية", flag: "🇸🇦" },
};

export function getLangMeta(code: string): TripTranslations {
  return TRIP_LANGUAGES[code.toLowerCase()] ?? { label: code.toUpperCase(), flag: "🌐" };
}

const LANG_LOCALE: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ru: "ru-RU",
  ar: "ar-SA",
};

export function getLangLocale(code: string): string {
  return LANG_LOCALE[code.toLowerCase()] ?? "en-US";
}

// UI strings per language
export type UIStrings = {
  followTrip: string;
  scrollDown: string;
  daysToGo: (n: number) => string;
  onTrip: string;
  travelers: string;
  hotels: string;
  days: string;
  activities: string;
  viewRoute: string;
  tripSummary: string;
  duration: string;
  airline: string;
  accommodation: string;
  checkIn: string;
  nights: string;
  guideNotes: string;
  emergency: string;
  immigrationMode: string;
  helpCenter: string;
  poweredBy: string;
  acknowledge: string;
  tripUpdate: string;
  map: string;
  // Immigration mode
  immTitle: string;
  immSubtitle: string;
  immConfirmed: string;
  immTourOperator: string;
  immDates: string;
  immDestination: string;
  immFlight: string;
  immDeparture: string;
  immReturn: string;
  immAccommodation: string;
  immTel: string;
  immDailySchedule: string;
  immDaysTotal: string;
  immOfficial: string;
  immBackToTrip: string;
  immSavePdf: string;
};

export const UI_STRINGS: Record<string, UIStrings> = {
  th: {
    followTrip: "เข้าร่วมทริปนี้",
    scrollDown: "เลื่อนลงเพื่อดูรายละเอียด",
    daysToGo: (n) => `อีก ${n} วัน!`,
    onTrip: "กำลังเดินทาง!",
    travelers: "คน",
    immTitle: "แผนการเดินทาง", immSubtitle: "สำหรับยื่นตรวจคนเข้าเมือง / วีซ่า",
    immConfirmed: "ยืนยันแล้ว", immTourOperator: "บริษัททัวร์", immDates: "วันเดินทาง",
    immDestination: "จุดหมาย", immFlight: "ข้อมูลเที่ยวบิน", immDeparture: "ขาไป",
    immReturn: "ขากลับ", immAccommodation: "ที่พัก", immTel: "โทร",
    immDailySchedule: "กำหนดการรายวัน", immDaysTotal: "วัน", immOfficial: "เอกสารทางการ",
    immBackToTrip: "← กลับหน้าทริป", immSavePdf: "บันทึก PDF",
    hotels: "ที่พัก",
    days: "วัน",
    activities: "กิจกรรม",
    viewRoute: "ดูเส้นทางทั้งวัน",
    tripSummary: "📊 สรุปข้อมูลทริป",
    duration: "ระยะเวลา",
    airline: "สายการบิน",
    accommodation: "ที่พัก",
    checkIn: "เช็คอิน",
    nights: "คืน",
    guideNotes: "หมายเหตุจากไกด์",
    emergency: "เบอร์ฉุกเฉิน",
    immigrationMode: "โหมดยื่น ตม.",
    helpCenter: "Help Center",
    poweredBy: "Powered by App",
    acknowledge: "รับทราบ",
    tripUpdate: "มีการเปลี่ยนแปลง:",
    map: "แผนที่",
  },
  en: {
    followTrip: "Join this Trip",
    scrollDown: "Scroll to explore",
    daysToGo: (n) => `${n} days to go!`,
    onTrip: "On the trip!",
    travelers: "Travelers",
    immTitle: "Travel Itinerary", immSubtitle: "For Immigration & Visa Application Purposes",
    immConfirmed: "Confirmed", immTourOperator: "Tour Operator", immDates: "Travel Dates",
    immDestination: "Destination", immFlight: "Flight Details", immDeparture: "Departure",
    immReturn: "Return", immAccommodation: "Accommodation", immTel: "Tel",
    immDailySchedule: "Daily Activity Schedule", immDaysTotal: "Days Total", immOfficial: "Official",
    immBackToTrip: "← Back to Trip", immSavePdf: "Save as PDF",
    hotels: "Hotels",
    days: "Days",
    activities: "Activities",
    viewRoute: "View full day route",
    tripSummary: "📊 Trip Summary",
    duration: "Duration",
    airline: "Airline",
    accommodation: "Accommodation",
    checkIn: "Check-in",
    nights: "Nights",
    guideNotes: "Notes from Guide",
    emergency: "Emergency Contacts",
    immigrationMode: "Immigration Mode",
    helpCenter: "Help Center",
    poweredBy: "Powered by App",
    acknowledge: "Acknowledge",
    tripUpdate: "Trip Update:",
    map: "Map",
  },
  ja: {
    followTrip: "このトリップに参加",
    scrollDown: "下にスクロールして詳細を見る",
    daysToGo: (n) => `あと${n}日！`,
    onTrip: "旅行中！",
    travelers: "人",
    immTitle: "旅行日程表", immSubtitle: "入国審査・ビザ申請用",
    immConfirmed: "確認済み", immTourOperator: "ツアーオペレーター", immDates: "旅行期間",
    immDestination: "目的地", immFlight: "フライト情報", immDeparture: "出発",
    immReturn: "帰国", immAccommodation: "宿泊先", immTel: "電話",
    immDailySchedule: "日別スケジュール", immDaysTotal: "日間", immOfficial: "公式",
    immBackToTrip: "← 旅程に戻る", immSavePdf: "PDFで保存",
    hotels: "ホテル",
    days: "日間",
    activities: "アクティビティ",
    viewRoute: "一日のルートを見る",
    tripSummary: "📊 旅行概要",
    duration: "期間",
    airline: "航空会社",
    accommodation: "宿泊先",
    checkIn: "チェックイン",
    nights: "泊",
    guideNotes: "ガイドからのメモ",
    emergency: "緊急連絡先",
    immigrationMode: "入国審査モード",
    helpCenter: "ヘルプセンター",
    poweredBy: "Powered by App",
    acknowledge: "確認済み",
    tripUpdate: "旅程が更新されました：",
    map: "地図",
  },
};

/** Returns UI strings for the given lang code, falling back to Thai. */
export function getUiStrings(lang: string): UIStrings {
  return UI_STRINGS[lang.toLowerCase()] ?? UI_STRINGS["en"] ?? UI_STRINGS["th"]!;
}
