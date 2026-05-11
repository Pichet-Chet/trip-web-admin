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

// UI strings per language
export type UIStrings = {
  followTrip: string;
  scrollDown: string;
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
};

export const UI_STRINGS: Record<string, UIStrings> = {
  th: {
    followTrip: "เข้าร่วมทริปนี้",
    scrollDown: "เลื่อนลงเพื่อดูรายละเอียด",
    travelers: "คน",
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
    travelers: "Travelers",
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
    travelers: "人",
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
