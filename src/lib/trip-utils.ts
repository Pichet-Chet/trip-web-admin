import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = "th-TH"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string, locale = "th-TH"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const year = e.getFullYear();

  if (sMonth === eMonth) {
    return `${s.getDate()} – ${e.getDate()} ${sMonth} ${year}`;
  }
  return `${s.getDate()} ${sMonth} – ${e.getDate()} ${eMonth} ${year}`;
}

export function getDaysUntil(date: string): number {
  const target = new Date(date);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getTripDuration(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getDayGradientClass(dayNumber: number): string {
  const index = ((dayNumber - 1) % 8) + 1;
  return `day-gradient-${index}`;
}

// Activity type accent colors
export type ActivityType = "attraction" | "restaurant" | "hotel" | "transport" | "shopping" | "other";

const ACTIVITY_TYPE_STYLES: Record<ActivityType, { bg: string; text: string; border: string }> = {
  attraction: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  restaurant: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  transport:  { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
  shopping:   { bg: "bg-fuchsia-50", text: "text-fuchsia-600", border: "border-fuchsia-200" },
  hotel:      { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  other:      { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" },
};

export function getActivityTypeStyle(type: string): { bg: string; text: string; border: string } {
  return ACTIVITY_TYPE_STYLES[type as ActivityType] ?? ACTIVITY_TYPE_STYLES.other;
}

const ACTIVITY_TYPE_EMOJI: Record<string, string> = {
  attraction: "🏛️",
  restaurant: "🍽️",
  hotel:      "🏨",
  transport:  "🚌",
  shopping:   "🛍️",
  other:      "📌",
};

export function getActivityEmoji(emoji: string | undefined, type: string): string {
  if (emoji?.trim()) return emoji;
  return ACTIVITY_TYPE_EMOJI[type] ?? "📌";
}

const DAY_EMOJIS = ["🌅", "🗺️", "🏖️", "🌆", "🌄", "🎭", "🏔️", "✨"];

/** Returns the first emoji from subtitle, or a sequential travel emoji by day index. */
export function getDayEmoji(subtitle: string | undefined, dayIndex: number): string {
  const first = subtitle?.trim().split(" ")[0] ?? "";
  // Check if it's actually an emoji (non-ASCII or emoji char)
  if (first && !/^[a-zA-Z0-9]/.test(first)) return first;
  return DAY_EMOJIS[dayIndex % DAY_EMOJIS.length] ?? "📅";
}

// Map provider detection & route URL builder
export type MapProvider = "google" | "baidu" | "amap" | "apple" | "unknown";

export function detectMapProvider(mapsLink: string): MapProvider {
  if (!mapsLink) return "unknown";
  if (mapsLink.includes("google.com/maps") || mapsLink.includes("maps.google.com")) return "google";
  if (mapsLink.includes("map.baidu.com") || mapsLink.includes("baidu.com/map")) return "baidu";
  if (mapsLink.includes("amap.com") || mapsLink.includes("gaode.com")) return "amap";
  if (mapsLink.includes("maps.apple.com")) return "apple";
  return "unknown";
}

export function detectMapProviderFromActivities(
  activities: { mapsLink: string; placeName: string }[],
): MapProvider {
  const withLink = activities.filter((a) => a.mapsLink);
  const first = withLink[0];
  if (!first) return "unknown";
  return detectMapProvider(first.mapsLink);
}

export function buildRouteUrl(
  places: string[],
  provider: MapProvider,
): string | null {
  if (places.length < 2) return null;

  const origin = places[0] as string;
  const destination = places[places.length - 1] as string;
  const waypoints = places.slice(1, -1);

  switch (provider) {
    case "google":
      return `https://www.google.com/maps/dir/${places.map(encodeURIComponent).join("/")}`;
    case "baidu":
      return `https://map.baidu.com/direction?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints.length > 0 ? `&viaPoints=${waypoints.map(encodeURIComponent).join("|")}` : ""}&mode=transit&coord_type=keyword`;
    case "amap":
      return `https://uri.amap.com/navigation?from=${encodeURIComponent(origin)}&to=${encodeURIComponent(destination)}&mode=bus&coordinate=keyword`;
    case "apple":
      return `https://maps.apple.com/?dirflg=r&saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}`;
    default:
      return `https://www.google.com/maps/dir/${places.map(encodeURIComponent).join("/")}`;
  }
}

export function getMapProviderLabel(provider: MapProvider): string {
  switch (provider) {
    case "google": return "Google Maps";
    case "baidu": return "百度地图";
    case "amap": return "高德地图";
    case "apple": return "Apple Maps";
    default: return "แผนที่";
  }
}

export function getMapButtonLabel(provider: MapProvider): string {
  switch (provider) {
    case "baidu": return "เปิดแผนที่ (百度)";
    case "amap": return "เปิดแผนที่ (高德)";
    case "apple": return "เปิดแผนที่ (Apple)";
    default: return "เปิดแผนที่";
  }
}

export function getRouteButtonLabel(provider: MapProvider): string {
  switch (provider) {
    case "baidu": return "ดูเส้นทางทั้งวัน (百度地图)";
    case "amap": return "ดูเส้นทางทั้งวัน (高德地图)";
    case "apple": return "ดูเส้นทางทั้งวัน (Apple Maps)";
    default: return "ดูเส้นทางทั้งวัน";
  }
}
