export type AirlineInfo = {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  type: "departure" | "return" | "transit";
};

export type Accommodation = {
  name: string;
  address: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  icon: string;
  sortOrder: number;
};

export type Activity = {
  id: string;
  time: string;
  name: string;
  description: string;
  type: "attraction" | "restaurant" | "hotel" | "transport" | "shopping" | "other";
  placeName: string;
  mapsLink: string;
  imageUrl: string;
  imageUrls?: string[];
  emoji: string;
  sortOrder: number;
  isNew?: boolean;
  isChanged?: boolean;
};

export type Day = {
  id: string;
  dayNumber: number;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  date: string;
  activities: Activity[];
};

export type Company = {
  name: string;
  logoUrl: string;
  phone: string;
  lineId: string;
  facebook: string;
  instagram: string;
  website: string;
  tatLicense: string;
};

export type PendingChange = {
  changelogId: string;
  summaryText: string;
  changes: {
    type: "add" | "update" | "delete";
    description: string;
  }[];
  createdAt: string;
};

export type Changelog = {
  id: string;
  version: number;
  summaryText: string;
  changes: {
    type: "add" | "update" | "delete";
    description: string;
  }[];
  createdAt: string;
  acknowledgedAt: string | null;
};

export type ChecklistItem = {
  id: string;
  label: string;
  isRequired: boolean;
  sortOrder: number;
};

export type TripPlan = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  travelersCount: number;
  language: string;
  airlineInfo: AirlineInfo[];
  accommodations: Accommodation[];
  emergencyContacts: EmergencyContact[];
  checklistItems: ChecklistItem[];
  notes: string;
  status: "draft" | "published" | "unpublished";
  days: Day[];
  company: Company;
  followerCount: number;
  pendingChange: PendingChange | null;
  changelogs: Changelog[];
  /** H2.1 — Free plan = true, paid plans = false. Renders "Powered by TripApp" badge. */
  showWatermark?: boolean;
  /** Phase 4.3 — additional language codes this trip has translations for. */
  supportedLanguages?: string[];
};
