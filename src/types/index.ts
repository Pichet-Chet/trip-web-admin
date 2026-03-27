// ─── Enums ───
export type TripStatus = "draft" | "published" | "unpublished";
export type ActivityType = "attraction" | "restaurant" | "hotel" | "transport" | "shopping" | "other";
export type FollowChannel = "line" | "web_push";
export type SubscriptionTier = "free" | "pro" | "business";
export type UserRole = "owner" | "editor";

// ─── Company ───
export type Company = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  lineId: string | null;
  facebook: string | null;
  instagram: string | null;
  website: string | null;
  tatLicense: string | null;
  tier: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
};

// ─── User ───
export type User = {
  id: string;
  companyId: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
};

// ─── Trip Plan ───
export type TripScope = "domestic" | "international";
export type TransportType = "flight" | "van" | "bus" | "train" | "boat" | "car";

export type TripPlan = {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  scope: TripScope;
  transportType: TransportType;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  coverImageUrl: string | null;
  travelersCount: number;
  language: string;
  airlineInfo: AirlineInfo[];
  accommodations: Accommodation[];
  emergencyContacts: EmergencyContact[];
  notes: string | null;
  status: TripStatus;
  dayCount: number;
  activityCount: number;
  editCount: number;
  viewCount: number;
  followerCount: number;
  albumImages: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Day ───
export type TripDay = {
  id: string;
  tripId: string;
  dayNumber: number;
  title: string | null;
  subtitle: string | null;
  coverImageUrl: string | null;
  date: string | null;
  sortOrder: number;
  activities: TripActivity[];
};

// ─── Activity ───
export type TripActivity = {
  id: string;
  dayId: string;
  time: string | null;
  name: string;
  description: string | null;
  type: ActivityType;
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string | null;
  imageUrl: string | null;
  emoji: string;
  sortOrder: number;
};

// ─── JSONB fields ───
export type AirlineInfo = {
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  type: "departure" | "return" | "domestic";
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

// ─── Notification ───
export type FollowerStatus = "pending" | "approved" | "declined";

export type Follower = {
  id: string;
  tripId: string;
  displayName: string;
  channel: FollowChannel;
  status: FollowerStatus;
  followedAt: string;
};

export type ChangeLog = {
  id: string;
  tripId: string;
  changedBy: string | null;
  changes: ChangeEntry[];
  summaryText: string;
  notiSent: boolean;
  notiSentAt: string | null;
  createdAt: string;
};

export type ChangeEntry = {
  type: "add" | "update" | "delete";
  entity: "day" | "activity" | "trip_info";
  dayNumber?: number;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
};

export type Acknowledgement = {
  id: string;
  changelogId: string;
  followerId: string;
  followerName: string;
  channel: FollowChannel;
  acknowledgedAt: string | null;
};

// ─── Usage ───
export type UsageStats = {
  tripSlots: { used: number; limit: number };
  editsPerTrip: { tripId: string; tripTitle: string; used: number; limit: number }[];
  followersPerTrip: { tripId: string; tripTitle: string; used: number; limit: number }[];
  notificationsPerMonth: { used: number; limit: number };
};
