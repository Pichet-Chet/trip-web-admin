import type {
  Company, User, TripPlan, TripDay, TripActivity,
  Follower, ChangeLog, Acknowledgement, UsageStats,
} from "@/types";

// ─── Current User & Company ───
export const mockUser: User = {
  id: "user-001",
  companyId: "comp-001",
  email: "admin@amazingtour.com",
  name: "สมชาย ใจดี",
  role: "owner",
  createdAt: "2026-01-15T00:00:00Z",
};

export const mockCompany: Company = {
  id: "comp-001",
  name: "Amazing Tour Co.",
  logoUrl: null,
  phone: "02-345-6789",
  lineId: "@amazingtour",
  facebook: "AmazingTourThailand",
  instagram: "amazingtour_th",
  website: "https://amazingtour.co.th",
  tatLicense: "11/09876",
  tier: "free",
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-03-20T00:00:00Z",
};

// ─── Activities for Trip 1 ───
const trip1Day1Activities: TripActivity[] = [
  { id: "act-101", dayId: "day-101", time: "15:40", name: "เช็คอินสนามบินสุวรรณภูมิ", description: "เช็คอิน counter E", type: "transport", placeName: "Suvarnabhumi Airport", lat: 13.6900, lng: 100.7501, mapsLink: "https://maps.google.com/?q=Suvarnabhumi+Airport", imageUrl: null, emoji: "🧳", sortOrder: 0 },
  { id: "act-102", dayId: "day-101", time: "17:40", name: "ออกเดินทาง MF834", description: "Xiamen Air → เซียเมิน", type: "transport", placeName: null, lat: null, lng: null, mapsLink: null, imageUrl: null, emoji: "✈️", sortOrder: 1 },
  { id: "act-103", dayId: "day-101", time: "22:05", name: "ถึงเซียเมิน", description: "Transit 2 ชม.", type: "transport", placeName: "Xiamen Gaoqi Airport", lat: 24.5440, lng: 118.1277, mapsLink: null, imageUrl: null, emoji: "🛬", sortOrder: 2 },
];

const trip1Day2Activities: TripActivity[] = [
  { id: "act-201", dayId: "day-102", time: "09:00", name: "teamLab Planets", description: "Digital art museum — ใส่กางเกงขาสั้น", type: "attraction", placeName: "teamLab Planets Tokyo", lat: 35.6729, lng: 139.7447, mapsLink: "https://maps.google.com/?q=teamLab+Planets+Tokyo", imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400", emoji: "🎨", sortOrder: 0 },
  { id: "act-202", dayId: "day-102", time: "12:00", name: "อาหารกลางวัน ร้าน Ichiran Ramen", description: "ราเมนต้นตำรับ", type: "restaurant", placeName: "Ichiran Shibuya", lat: 35.6595, lng: 139.7005, mapsLink: "https://maps.google.com/?q=Ichiran+Shibuya", imageUrl: null, emoji: "🍜", sortOrder: 1 },
  { id: "act-203", dayId: "day-102", time: "14:00", name: "Tokyo Disneyland", description: "เล่นจนปิด!", type: "attraction", placeName: "Tokyo Disneyland", lat: 35.6329, lng: 139.8804, mapsLink: "https://maps.google.com/?q=Tokyo+Disneyland", imageUrl: "https://images.unsplash.com/photo-1624601573012-efb68931cc8f?w=400", emoji: "🏰", sortOrder: 2 },
];

const trip1Day3Activities: TripActivity[] = [
  { id: "act-301", dayId: "day-103", time: "07:00", name: "นัดพบล็อบบี้โรงแรม", description: "ใส่เสื้อกันหนาว รองเท้าผ้าใบ", type: "transport", placeName: null, lat: null, lng: null, mapsLink: null, imageUrl: null, emoji: "🎒", sortOrder: 0 },
  { id: "act-302", dayId: "day-103", time: "10:00", name: "ภูเขาไฟฟูจิ สถานี 5", description: "ถ่ายรูป ชมวิว", type: "attraction", placeName: "Mt. Fuji 5th Station", lat: 35.3606, lng: 138.7274, mapsLink: "https://maps.google.com/?q=Mt+Fuji+5th+Station", imageUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", emoji: "🗻", sortOrder: 1 },
  { id: "act-303", dayId: "day-103", time: "13:00", name: "อาหารกลางวัน Houtou Fudou", description: "เส้น Houtou ขึ้นชื่อ", type: "restaurant", placeName: "Houtou Fudou", lat: 35.5004, lng: 138.7569, mapsLink: null, imageUrl: null, emoji: "🍲", sortOrder: 2 },
  { id: "act-304", dayId: "day-103", time: "15:00", name: "ทะเลสาบคาวากูจิ", description: "ล่องเรือ ชมวิวฟูจิ", type: "attraction", placeName: "Lake Kawaguchi", lat: 35.5147, lng: 138.7540, mapsLink: "https://maps.google.com/?q=Lake+Kawaguchi", imageUrl: null, emoji: "🚢", sortOrder: 3 },
];

// ─── Days for Trip 1 ───
export const mockTrip1Days: TripDay[] = [
  { id: "day-101", tripId: "trip-001", dayNumber: 1, title: "เดินทาง กรุงเทพ → โตเกียว", subtitle: "✈️ ออกเดินทาง", coverImageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=800", date: "2026-04-15", sortOrder: 0, activities: trip1Day1Activities },
  { id: "day-102", tripId: "trip-001", dayNumber: 2, title: "โตเกียว — teamLab & Disneyland", subtitle: "🗼 วันสนุก!", coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", date: "2026-04-16", sortOrder: 1, activities: trip1Day2Activities },
  { id: "day-103", tripId: "trip-001", dayNumber: 3, title: "ภูเขาไฟฟูจิ & ทะเลสาบคาวากูจิ", subtitle: "🗻 Day trip", coverImageUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800", date: "2026-04-17", sortOrder: 2, activities: trip1Day3Activities },
];

// ─── Trip Plans ───
export const mockTrips: TripPlan[] = [
  {
    id: "trip-001",
    companyId: "comp-001",
    title: "Tokyo Winter Trip 2026",
    slug: "tokyo-winter-2026",
    scope: "international",
    transportType: "flight",
    destination: "Japan",
    startDate: "2026-04-15",
    endDate: "2026-04-22",
    coverImageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    travelersCount: 25,
    language: "th",
    airlineInfo: [
      { airline: "Xiamen Air", flightNumber: "MF834", departureTime: "17:40", arrivalTime: "22:05", departureAirport: "BKK", arrivalAirport: "XMN", type: "departure" },
      { airline: "Xiamen Air", flightNumber: "MF833", arrivalTime: "11:20", departureTime: "08:50", departureAirport: "NRT", arrivalAirport: "BKK", type: "return" },
    ],
    accommodations: [
      { name: "The QUBE Hotel Chiba", address: "1-2-3 Chiba, Japan", phone: "+81-43-XXX-XXXX", checkIn: "15:00", checkOut: "11:00", nights: 5 },
      { name: "Hakone Ryokan", address: "4-5-6 Hakone, Japan", phone: "+81-460-XX-XXXX", checkIn: "14:00", checkOut: "10:00", nights: 2 },
    ],
    emergencyContacts: [
      { name: "สถานทูตไทย โตเกียว", phone: "+81-3-2207-9100", icon: "🏥", sortOrder: 0 },
      { name: "ตำรวจญี่ปุ่น", phone: "110", icon: "🚓", sortOrder: 1 },
      { name: "รถพยาบาล", phone: "119", icon: "🚑", sortOrder: 2 },
    ],
    notes: "เตรียมเสื้อกันหนาว อุณหภูมิ 5-10°C\nเงินสด ¥30,000 ต่อคน\nพาสปอร์ตต้องมีอายุเหลือ 6 เดือนขึ้นไป",
    status: "published", visibility: "marketplace", reviewStatus: "approved",
    dayCount: 8,
    activityCount: 24,
    editCount: 1,
    viewCount: 342,
    followerCount: 18,
    albumImages: [],
    publishedAt: "2026-03-10T00:00:00Z",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-20T14:32:00Z",
  },
  {
    id: "trip-002",
    companyId: "comp-001",
    title: "เชียงใหม่ 3 วัน 2 คืน",
    slug: "chiangmai-3d2n",
    scope: "domestic",
    transportType: "van",
    destination: "Chiang Mai",
    startDate: "2026-05-01",
    endDate: "2026-05-03",
    coverImageUrl: "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800",
    travelersCount: 15,
    language: "th",
    airlineInfo: [
      { airline: "Thai AirAsia", flightNumber: "FD3432", departureTime: "06:30", arrivalTime: "07:50", departureAirport: "DMK", arrivalAirport: "CNX", type: "departure" },
    ],
    accommodations: [
      { name: "Nimman Mai Design Hotel", address: "Nimman Rd, Chiang Mai", phone: "053-XXX-XXX", checkIn: "14:00", checkOut: "12:00", nights: 2 },
    ],
    emergencyContacts: [
      { name: "ร.พ.มหาราชนครเชียงใหม่", phone: "053-936-150", icon: "🏥", sortOrder: 0 },
    ],
    notes: "ทริปสบายๆ เน้นคาเฟ่ + ธรรมชาติ",
    status: "draft", visibility: "link_only", reviewStatus: null,
    dayCount: 3,
    activityCount: 8,
    editCount: 0,
    viewCount: 0,
    followerCount: 0,
    albumImages: [],
    publishedAt: null,
    createdAt: "2026-03-18T00:00:00Z",
    updatedAt: "2026-03-22T00:00:00Z",
  },
  {
    id: "trip-003",
    companyId: "comp-001",
    title: "Krabi Island Hopping",
    slug: "krabi-island-hopping",
    scope: "domestic",
    transportType: "boat",
    destination: "Krabi",
    startDate: "2026-06-10",
    endDate: "2026-06-14",
    coverImageUrl: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800",
    travelersCount: 30,
    language: "en",
    airlineInfo: [],
    accommodations: [],
    emergencyContacts: [],
    notes: null,
    status: "draft", visibility: "link_only", reviewStatus: null,
    dayCount: 5,
    activityCount: 0,
    editCount: 0,
    viewCount: 0,
    followerCount: 0,
    albumImages: [],
    publishedAt: null,
    createdAt: "2026-03-25T00:00:00Z",
    updatedAt: "2026-03-25T00:00:00Z",
  },
  {
    id: "trip-004",
    companyId: "comp-001",
    title: "Seoul Autumn 5 วัน 4 คืน",
    slug: "seoul-autumn-5d4n",
    scope: "international",
    transportType: "flight",
    destination: "South Korea",
    startDate: "2025-10-20",
    endDate: "2025-10-24",
    coverImageUrl: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800",
    travelersCount: 20,
    language: "th",
    airlineInfo: [
      { airline: "Korean Air", flightNumber: "KE654", departureTime: "09:00", arrivalTime: "16:30", departureAirport: "BKK", arrivalAirport: "ICN", type: "departure" },
    ],
    accommodations: [
      { name: "Myeongdong Lotte Hotel", address: "30 Eulji-ro, Seoul", phone: "+82-2-771-1000", checkIn: "15:00", checkOut: "11:00", nights: 4 },
    ],
    emergencyContacts: [
      { name: "สถานทูตไทย โซล", phone: "+82-2-795-3098", icon: "🏥", sortOrder: 0 },
    ],
    notes: "ทริปจบแล้ว — ใบไม้เปลี่ยนสีสวยมาก",
    albumImages: [
      "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=600",
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600",
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600",
      "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=600",
      "https://images.unsplash.com/photo-1583400225507-3add10a0818e?w=600",
      "https://images.unsplash.com/photo-1578469645742-46cae010e5d6?w=600",
    ],
    status: "unpublished", visibility: "link_only", reviewStatus: null,
    dayCount: 5,
    activityCount: 18,
    editCount: 2,
    viewCount: 856,
    followerCount: 16,
    publishedAt: "2025-10-01T00:00:00Z",
    createdAt: "2025-09-15T00:00:00Z",
    updatedAt: "2025-10-25T00:00:00Z",
  },
  {
    id: "trip-005",
    companyId: "comp-001",
    title: "เขาใหญ่ Weekend Trip",
    slug: "khaoyai-weekend",
    scope: "domestic",
    transportType: "van",
    destination: "นครราชสีมา",
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    coverImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
    travelersCount: 12,
    language: "th",
    airlineInfo: [],
    accommodations: [
      { name: "Kirimaya Golf Resort", address: "Khao Yai, Nakhon Ratchasima", phone: "044-XXX-XXX", checkIn: "14:00", checkOut: "12:00", nights: 2 },
    ],
    emergencyContacts: [],
    notes: "ทริปจบแล้ว — ลูกทริปชอบมาก",
    albumImages: [
      "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600",
    ],
    status: "unpublished", visibility: "link_only", reviewStatus: null,
    dayCount: 3,
    activityCount: 9,
    editCount: 1,
    viewCount: 234,
    followerCount: 10,
    publishedAt: "2026-01-05T00:00:00Z",
    createdAt: "2025-12-20T00:00:00Z",
    updatedAt: "2026-01-13T00:00:00Z",
  },
];

// ─── Followers for Trip 1 ───
export const mockFollowers: Follower[] = [
  // Approved members
  { id: "fol-01", tripId: "trip-001", displayName: "สมชาย", channel: "line", status: "approved", followedAt: "2026-03-11T10:00:00Z" },
  { id: "fol-02", tripId: "trip-001", displayName: "นิดา", channel: "web_push", status: "approved", followedAt: "2026-03-11T10:05:00Z" },
  { id: "fol-03", tripId: "trip-001", displayName: "แพท", channel: "line", status: "approved", followedAt: "2026-03-11T11:00:00Z" },
  { id: "fol-04", tripId: "trip-001", displayName: "วิชัย", channel: "line", status: "approved", followedAt: "2026-03-12T08:00:00Z" },
  { id: "fol-05", tripId: "trip-001", displayName: "อรทัย", channel: "web_push", status: "approved", followedAt: "2026-03-12T09:00:00Z" },
  { id: "fol-06", tripId: "trip-001", displayName: "ธนา", channel: "line", status: "approved", followedAt: "2026-03-12T10:30:00Z" },
  { id: "fol-07", tripId: "trip-001", displayName: "พิม", channel: "line", status: "approved", followedAt: "2026-03-12T11:00:00Z" },
  { id: "fol-08", tripId: "trip-001", displayName: "กิตติ", channel: "web_push", status: "approved", followedAt: "2026-03-13T08:00:00Z" },
  { id: "fol-09", tripId: "trip-001", displayName: "สุดา", channel: "line", status: "approved", followedAt: "2026-03-13T09:30:00Z" },
  { id: "fol-10", tripId: "trip-001", displayName: "ปราโมทย์", channel: "line", status: "approved", followedAt: "2026-03-13T10:00:00Z" },
  { id: "fol-11", tripId: "trip-001", displayName: "มาลี", channel: "line", status: "approved", followedAt: "2026-03-14T07:00:00Z" },
  { id: "fol-12", tripId: "trip-001", displayName: "Tom", channel: "web_push", status: "approved", followedAt: "2026-03-14T08:00:00Z" },
  // Pending requests (recent)
  { id: "fol-13", tripId: "trip-001", displayName: "Anna", channel: "web_push", status: "pending", followedAt: "2026-03-27T09:15:00Z" },
  { id: "fol-14", tripId: "trip-001", displayName: "เอก", channel: "line", status: "pending", followedAt: "2026-03-27T08:30:00Z" },
  { id: "fol-15", tripId: "trip-001", displayName: "จิรา", channel: "line", status: "pending", followedAt: "2026-03-26T23:45:00Z" },
  { id: "fol-16", tripId: "trip-001", displayName: "ขวัญ", channel: "line", status: "pending", followedAt: "2026-03-26T18:20:00Z" },
  { id: "fol-17", tripId: "trip-001", displayName: "บอย", channel: "web_push", status: "approved", followedAt: "2026-03-16T09:00:00Z" },
  { id: "fol-18", tripId: "trip-001", displayName: "เกด", channel: "line", status: "approved", followedAt: "2026-03-16T10:00:00Z" },
];

// ─── Change Logs for Trip 1 ───
export const mockChangeLogs: ChangeLog[] = [
  {
    id: "cl-002",
    tripId: "trip-001",
    changedBy: "user-001",
    changes: [
      { type: "update", entity: "activity", dayNumber: 2, field: "time", oldValue: "08:30", newValue: "09:00", description: "เปลี่ยนเวลา teamLab: 08:30 → 09:00" },
      { type: "add", entity: "activity", dayNumber: 2, description: "เพิ่มกิจกรรม: 'แวะ 7-Eleven' เวลา 08:00" },
    ],
    summaryText: "Day 2: เปลี่ยนเวลา teamLab 08:30 → 09:00, เพิ่ม 'แวะ 7-Eleven' เวลา 08:00",
    notiSent: true,
    notiSentAt: "2026-03-27T14:35:00Z",
    createdAt: "2026-03-27T14:32:00Z",
  },
  {
    id: "cl-001",
    tripId: "trip-001",
    changedBy: "user-001",
    changes: [
      { type: "add", entity: "activity", dayNumber: 3, description: "เพิ่มกิจกรรม: 'ทะเลสาบคาวากูจิ' เวลา 15:00" },
      { type: "delete", entity: "activity", dayNumber: 3, description: "ยกเลิก: 'ออนเซ็น' (ปิดปรับปรุง)" },
    ],
    summaryText: "Day 3: เพิ่ม 'ทะเลสาบคาวากูจิ', ยกเลิก 'ออนเซ็น'",
    notiSent: true,
    notiSentAt: "2026-03-15T10:05:00Z",
    createdAt: "2026-03-15T10:00:00Z",
  },
];

// ─── Acknowledgements for ChangeLog cl-001 ───
export const mockAcknowledgements: Acknowledgement[] = [
  { id: "ack-01", changelogId: "cl-002", followerId: "fol-01", followerName: "สมชาย", channel: "line", acknowledgedAt: "2026-03-20T14:35:00Z" },
  { id: "ack-02", changelogId: "cl-002", followerId: "fol-02", followerName: "นิดา", channel: "web_push", acknowledgedAt: "2026-03-20T14:36:00Z" },
  { id: "ack-03", changelogId: "cl-002", followerId: "fol-03", followerName: "แพท", channel: "line", acknowledgedAt: "2026-03-20T14:40:00Z" },
  { id: "ack-04", changelogId: "cl-002", followerId: "fol-06", followerName: "ธนา", channel: "line", acknowledgedAt: "2026-03-20T15:00:00Z" },
  { id: "ack-05", changelogId: "cl-002", followerId: "fol-07", followerName: "พิม", channel: "line", acknowledgedAt: "2026-03-20T15:10:00Z" },
  { id: "ack-06", changelogId: "cl-002", followerId: "fol-08", followerName: "กิตติ", channel: "web_push", acknowledgedAt: "2026-03-20T15:20:00Z" },
  { id: "ack-07", changelogId: "cl-002", followerId: "fol-09", followerName: "สุดา", channel: "line", acknowledgedAt: "2026-03-20T15:30:00Z" },
  { id: "ack-08", changelogId: "cl-002", followerId: "fol-10", followerName: "ปราโมทย์", channel: "line", acknowledgedAt: "2026-03-20T15:45:00Z" },
  { id: "ack-09", changelogId: "cl-002", followerId: "fol-11", followerName: "มาลี", channel: "line", acknowledgedAt: "2026-03-20T16:00:00Z" },
  { id: "ack-10", changelogId: "cl-002", followerId: "fol-12", followerName: "Tom", channel: "web_push", acknowledgedAt: "2026-03-20T16:10:00Z" },
  { id: "ack-11", changelogId: "cl-002", followerId: "fol-13", followerName: "Anna", channel: "web_push", acknowledgedAt: "2026-03-20T16:15:00Z" },
  { id: "ack-12", changelogId: "cl-002", followerId: "fol-14", followerName: "เอก", channel: "line", acknowledgedAt: "2026-03-20T16:30:00Z" },
  // cl-002 Pending (no acknowledgedAt)
  { id: "ack-13", changelogId: "cl-002", followerId: "fol-04", followerName: "วิชัย", channel: "line", acknowledgedAt: null },
  { id: "ack-14", changelogId: "cl-002", followerId: "fol-05", followerName: "อรทัย", channel: "web_push", acknowledgedAt: null },
  { id: "ack-15", changelogId: "cl-002", followerId: "fol-15", followerName: "จิรา", channel: "line", acknowledgedAt: null },
  { id: "ack-16", changelogId: "cl-002", followerId: "fol-16", followerName: "ขวัญ", channel: "line", acknowledgedAt: null },
  { id: "ack-17", changelogId: "cl-002", followerId: "fol-17", followerName: "บอย", channel: "web_push", acknowledgedAt: null },
  { id: "ack-18", changelogId: "cl-002", followerId: "fol-18", followerName: "เกด", channel: "line", acknowledgedAt: null },

  // cl-001 (older change — all acknowledged)
  { id: "ack-19", changelogId: "cl-001", followerId: "fol-01", followerName: "สมชาย", channel: "line", acknowledgedAt: "2026-03-15T11:00:00Z" },
  { id: "ack-20", changelogId: "cl-001", followerId: "fol-02", followerName: "นิดา", channel: "web_push", acknowledgedAt: "2026-03-15T11:05:00Z" },
  { id: "ack-21", changelogId: "cl-001", followerId: "fol-03", followerName: "แพท", channel: "line", acknowledgedAt: "2026-03-15T11:10:00Z" },
  { id: "ack-22", changelogId: "cl-001", followerId: "fol-04", followerName: "วิชัย", channel: "line", acknowledgedAt: "2026-03-15T12:00:00Z" },
  { id: "ack-23", changelogId: "cl-001", followerId: "fol-05", followerName: "อรทัย", channel: "web_push", acknowledgedAt: "2026-03-15T12:30:00Z" },
  { id: "ack-24", changelogId: "cl-001", followerId: "fol-06", followerName: "ธนา", channel: "line", acknowledgedAt: "2026-03-15T13:00:00Z" },
];

// ─── Usage Stats ───
export const mockUsage: UsageStats = {
  tripSlots: { used: 2, limit: 3 },
  editsPerTrip: [
    { tripId: "trip-001", tripTitle: "Tokyo Winter Trip 2026", used: 1, limit: 2 },
  ],
  followersPerTrip: [
    { tripId: "trip-001", tripTitle: "Tokyo Winter Trip 2026", used: 18, limit: 30 },
  ],
  notificationsPerMonth: { used: 3, limit: 10 },
};

// ─── Helper: get days for a trip ───
export function getMockDays(tripId: string): TripDay[] {
  if (tripId === "trip-001") return mockTrip1Days;
  return [];
}

// ─── Helper: get trip by id ───
export function getMockTrip(tripId: string): TripPlan | undefined {
  return mockTrips.find((t) => t.id === tripId);
}

// ─── Helper: get trip by slug ───
export function getMockTripBySlug(slug: string): TripPlan | undefined {
  return mockTrips.find((t) => t.slug === slug);
}
