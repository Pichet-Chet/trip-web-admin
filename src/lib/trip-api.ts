/**
 * Adapter between backend TripPublicResponse and the frontend TripPlan shape
 * defined in lib/mock-data.ts. Keeps the rich UI components untouched while
 * letting them consume real data.
 */

import { api } from "./client-api";
import type { TripPlan, Activity, Day, AirlineInfo, Accommodation, EmergencyContact, ChecklistItem } from "./mock-data";

interface ApiActivity {
  id: string;
  time: string | null;
  name: string;
  description: string | null;
  type: string;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string | null;
  imageUrl: string | null;
  imageUrls: string[] | null;
  emoji: string | null;
}

interface ApiDay {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string | null;
  coverImageUrl: string | null;
  date: string | null;
  activities: ApiActivity[];
}

interface ApiAirline {
  airline?: string | null;
  flightNumber?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  type?: string | null;
}

interface ApiAccommodation {
  name: string;
  address: string | null;
  phone: string | null;
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
}

interface ApiEmergencyContact {
  name: string;
  phone: string;
  icon: string | null;
  sortOrder: number;
}

interface ApiCompany {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  lineId: string | null;
}

interface ApiChecklistItem {
  id: string;
  label: string;
  isRequired: boolean;
  sortOrder: number;
}

export interface TripPublicResponse {
  id: string;
  title: string;
  slug: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string | null;
  travelersCount: number;
  language: string;
  airlineInfo: ApiAirline[];
  accommodations: ApiAccommodation[];
  emergencyContacts: ApiEmergencyContact[];
  checklistItems: ApiChecklistItem[];
  importantNotes: string | null;
  viewCount: number;
  showWatermark: boolean;
  supportedLanguages?: string[];
  company: ApiCompany;
  days: ApiDay[];
}

const ACTIVITY_TYPE_FALLBACK: Activity["type"] = "other";
const VALID_TYPES = new Set<Activity["type"]>([
  "attraction", "restaurant", "hotel", "transport", "shopping", "other",
]);

function mapActivity(a: ApiActivity, idx: number): Activity {
  const t = a.type?.toLowerCase() as Activity["type"] | undefined;
  const urls = a.imageUrls?.filter(Boolean) ?? [];
  return {
    id: a.id,
    time: a.time ?? "",
    name: a.name,
    description: a.description ?? "",
    type: t && VALID_TYPES.has(t) ? t : ACTIVITY_TYPE_FALLBACK,
    placeName: a.placeName ?? "",
    mapsLink: a.mapsLink ?? "",
    imageUrl: a.imageUrl ?? urls[0] ?? "",
    imageUrls: urls,
    emoji: a.emoji ?? "",
    sortOrder: idx,
  };
}

function mapDay(d: ApiDay): Day {
  return {
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    subtitle: d.subtitle ?? "",
    coverImageUrl: d.coverImageUrl ?? "",
    date: d.date ?? "",
    activities: d.activities.map(mapActivity),
  };
}

function mapAirline(a: ApiAirline, idx: number): AirlineInfo {
  const validTypes = new Set<AirlineInfo["type"]>(["departure", "return", "transit"]);
  const t = a.type?.toLowerCase() as AirlineInfo["type"] | undefined;
  return {
    airline: a.airline ?? "",
    flightNumber: a.flightNumber ?? "",
    departureTime: a.departureTime ?? "",
    arrivalTime: a.arrivalTime ?? "",
    departureAirport: a.departureAirport ?? "",
    arrivalAirport: a.arrivalAirport ?? "",
    type: t && validTypes.has(t) ? t : (idx === 0 ? "departure" : "return"),
  };
}

function mapAccommodation(a: ApiAccommodation): Accommodation {
  return {
    name: a.name,
    address: a.address ?? "",
    phone: a.phone ?? "",
    checkIn: a.checkIn ?? "",
    checkOut: a.checkOut ?? "",
    nights: a.nights,
  };
}

function mapEmergency(e: ApiEmergencyContact): EmergencyContact {
  return {
    name: e.name,
    phone: e.phone,
    icon: e.icon ?? "🚨",
    sortOrder: e.sortOrder,
  };
}

export function mapTripResponse(r: TripPublicResponse): TripPlan {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    destination: r.destination,
    startDate: r.startDate,
    endDate: r.endDate,
    coverImageUrl: r.coverImageUrl ?? "",
    travelersCount: r.travelersCount,
    language: r.language?.toLowerCase() ?? "th",
    airlineInfo: r.airlineInfo.map(mapAirline),
    accommodations: r.accommodations.map(mapAccommodation),
    emergencyContacts: r.emergencyContacts.map(mapEmergency),
    checklistItems: (r.checklistItems ?? []).map((c): ChecklistItem => ({
      id: c.id,
      label: c.label,
      isRequired: c.isRequired,
      sortOrder: c.sortOrder,
    })),
    notes: r.importantNotes ?? "",
    status: "published",
    days: r.days.map(mapDay),
    company: {
      name: r.company.name,
      logoUrl: r.company.logoUrl ?? "",
      phone: r.company.phone ?? "",
      lineId: r.company.lineId ?? "",
      facebook: "",
      instagram: "",
      website: "",
      tatLicense: "",
    },
    followerCount: 0,
    pendingChange: null,
    changelogs: [],
    showWatermark: r.showWatermark,
    supportedLanguages: r.supportedLanguages ?? [],
  };
}

export async function fetchTripBySlug(slug: string, lang?: string) {
  const url = lang
    ? `/client/t/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`
    : `/client/t/${encodeURIComponent(slug)}`;
  const res = await api.get<TripPublicResponse>(url);
  return mapTripResponse(res);
}

export interface PublicChangelog {
  id: string;
  summaryText: string;
  changes: { id: string; type: string; description: string; sortOrder: number }[];
  createdAt: string;
}

export async function fetchChangelog(slug: string) {
  return api.get<PublicChangelog[]>(`/client/t/${encodeURIComponent(slug)}/changelog`);
}

export interface FaqCategory {
  code: string;
  labelTh: string;
  labelEn: string;
  items: { id: string; question: string; answerHtml: string }[];
}

export async function fetchFaq() {
  return api.get<FaqCategory[]>("/client/faq");
}

export async function trackView(slug: string) {
  try {
    await api.post(`/client/t/${encodeURIComponent(slug)}/view`);
  } catch {
    // best-effort — don't break the page if view tracking fails
  }
}

export interface FollowWebPushPayload {
  tripId: string;
  displayName: string;
  subscription: { endpoint: string; p256dh: string; auth: string };
}

export async function followWebPush(payload: FollowWebPushPayload) {
  return api.authPost<{ id: string }>("/client/follow/web-push", payload);
}

export async function followMember(tripId: string) {
  return api.authPost<{ id: string; channel: string; status: string; followedAt: string }>("/client/follow/member", { tripId });
}

export interface RatingSummary {
  count: number;
  avgOverall: number | null;
  avgGuide: number | null;
  avgItinerary: number | null;
  avgValue: number | null;
  recentComments: Array<{ comment: string; overallScore: number; createdAt: string; firstName: string }>;
}

export async function fetchRatingSummary(slug: string) {
  return api.get<RatingSummary>(`/client/t/${encodeURIComponent(slug)}/ratings`);
}
