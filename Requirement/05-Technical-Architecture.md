# Technical Architecture Document (TAD)
# NatGan (นัดกัน) — v1.0

**Version:** 1.0
**Date:** 17 March 2026
**Status:** Draft
**Reference:** 01-SRD, 03-MVP-Scope-Lock, 04-UX-Flow

---

## 1. Architecture Overview

### 1.1 Tech Stack Summary

| Layer | Technology | เหตุผล |
|---|---|---|
| **Frontend** | Next.js 16 + React 19 | มี codebase อยู่แล้ว, App Router, Server Components |
| **Styling** | Tailwind CSS 4 | มี codebase อยู่แล้ว, utility-first |
| **Backend** | Next.js API Routes (Route Handlers) | เดียวกับ frontend, serverless |
| **Auth** | Auth.js (NextAuth v5) | ฟรี, email auth + LINE Login, JWT, session management |
| **Database** | PostgreSQL 16 (Docker, self-host VPS) | ~150-250 บ/เดือน (VPS), full control, no latency |
| **ORM** | Drizzle ORM | Type-safe queries, lightweight, SQL-like syntax |
| **Storage** | Cloudflare R2 (S3-compatible) | ฟรี 10GB, no egress fee, เก็บ images (logo, cover) |
| **Hosting** | Vercel | ฟรี tier, Git auto-deploy, Edge Network |
| **Notification** | LINE Messaging API + web-push (npm) | Communication plan (free 500 msg/month), dual channel |
| **QR** | qrcode (npm) | Client-side generation |
| **Maps** | Google Maps URL scheme | ฟรี (ไม่ใช้ API key) |

### 1.2 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  Admin SPA       │  │  Guest View     │  │  Immigration   │ │
│  │  (React 19)      │  │  (SSR + ISR)    │  │  View (SSR)    │ │
│  │  /dashboard/*    │  │  /t/{slug}      │  │  /t/{slug}/imm │ │
│  └────────┬─────────┘  └───────┬─────────┘  └───────┬────────┘ │
│           │                    │                     │          │
│           │  Service Worker (Web Push + Offline Cache)          │
└───────────┼────────────────────┼─────────────────────┼──────────┘
            │                    │                     │
            ▼                    ▼                     ▼
┌────────────────────────────────────────────────────────────────┐
│                    Vercel (Edge Network)                        │
│                                                                │
│  Next.js App Router                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/auth/*          Auth.js (NextAuth v5)              │  │
│  │  /api/trips/*         Trip CRUD                          │  │
│  │  /api/publish/*       Publish + QR generation            │  │
│  │  /api/follow/*        LINE webhook + Web Push sub        │  │
│  │  /api/notify/*        Change detection + send noti       │  │
│  │  /api/acknowledge/*   Acknowledge endpoint               │  │
│  │  /api/upload/*        Image upload → Cloudflare R2       │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
┌──────────────────┐ ┌──────────┐ ┌─────────────────┐
│  VPS (Docker)    │ │ LINE     │ │ Web Push        │
│  ┌────────────┐  │ │ Messaging│ │ (VAPID)         │
│  │ PostgreSQL │  │ │ API      │ │                 │
│  │ 16         │  │ └──────────┘ └─────────────────┘
│  └────────────┘  │
│                  │ ┌─────────────────┐
│  Auth.js         │ │ Cloudflare R2   │
│  (NextAuth v5)   │ │ (S3-compatible) │
│  (in Vercel)     │ │ File Storage    │
│                  │ └─────────────────┘
└──────────────────┘
```

### 1.3 Rendering Strategy

| Page | Strategy | เหตุผล |
|---|---|---|
| `/t/{slug}` (Guest View) | **SSR + ISR** (revalidate 60s) | SEO + fast load + ข้อมูลใกล้ real-time |
| `/t/{slug}/imm` (Immigration) | **SSR** + Service Worker cache | ต้อง fresh + offline capable |
| `/dashboard/*` (Admin) | **CSR** (Client-side SPA) | ต้อง auth + interactive forms |
| `/` (Landing) | **SSG** | Static, SEO, fast |

---

## 2. Database Schema (PostgreSQL 16 — Self-hosted VPS)

### 2.1 Table Naming Convention

```
Prefix Groups:
├── mst_   (Master)       — ข้อมูลหลัก ไม่ค่อยเปลี่ยน
├── trip_  (Trip)         — ข้อมูลทริป (core transaction)
└── noti_  (Notification) — ข้อมูลการแจ้งเตือน + ติดตาม
```

| Prefix | Table Name | คำอธิบาย |
|---|---|---|
| `mst_` | `mst_companies` | บริษัท / ไกด์ |
| `mst_` | `mst_users` | ผู้ใช้ admin (managed by Auth.js) |
| `trip_` | `trip_plans` | แผนทริป |
| `trip_` | `trip_days` | วัน (ย่อยของทริป) |
| `trip_` | `trip_activities` | กิจกรรม (ย่อยของวัน) |
| `noti_` | `noti_followers` | ผู้ติดตาม (LINE / Web Push) |
| `noti_` | `noti_change_logs` | ประวัติการเปลี่ยนแปลง |
| `noti_` | `noti_acknowledgements` | การรับทราบ |

### 2.2 ER Diagram

```
┌──────────────────────┐     ┌──────────────────────┐
│   mst_companies       │     │      mst_users        │
├──────────────────────┤     ├──────────────────────┤
│ id (uuid) PK         │──┐  │ id (uuid) PK         │
│ name                 │  │  │ company_id FK         │──┐
│ logo_url             │  │  │ email                 │  │
│ phone                │  │  │ name                  │  │
│ line_id              │  │  │ role                  │  │
│ facebook             │  │  │ created_at            │  │
│ instagram            │  │  └──────────────────────┘  │
│ website              │  │                             │
│ tat_license          │  │  ┌──────────────────────┐  │
│ tier                 │  ├─▶│     trip_plans        │  │
│ created_at           │  │  ├──────────────────────┤  │
│ updated_at           │  │  │ id (uuid) PK         │  │
└──────────────────────┘  │  │ company_id FK         │──┘
                          │  │ title                 │
                          │  │ slug (unique)         │
                          │  │ destination           │
                          │  │ start_date            │
                          │  │ end_date              │
                          │  │ cover_image_url       │
                          │  │ travelers_count       │
                          │  │ language              │
                          │  │ airline_info (jsonb)   │
                          │  │ accommodations (jsonb) │
                          │  │ emergency_contacts(jsonb)│
                          │  │ notes (text)          │
                          │  │ status (enum)         │
                          │  │ edit_count            │
                          │  │ view_count            │
                          │  │ published_at          │
                          │  │ created_at            │
                          │  │ updated_at            │
                          │  └──────────┬───────────┘
                          │             │
                          │  ┌──────────▼───────────┐
                          │  │     trip_days         │
                          │  ├──────────────────────┤
                          │  │ id (uuid) PK         │
                          │  │ trip_id FK            │
                          │  │ day_number            │
                          │  │ title                 │
                          │  │ subtitle              │
                          │  │ cover_image_url       │
                          │  │ date                  │
                          │  │ sort_order            │
                          │  └──────────┬───────────┘
                          │             │
                          │  ┌──────────▼───────────┐
                          │  │   trip_activities     │
                          │  ├──────────────────────┤
                          │  │ id (uuid) PK         │
                          │  │ day_id FK             │
                          │  │ time (time)           │
                          │  │ name                  │
                          │  │ description           │
                          │  │ type (enum)           │
                          │  │ place_name            │
                          │  │ lat (decimal)         │
                          │  │ lng (decimal)         │
                          │  │ maps_link             │
                          │  │ image_url             │
                          │  │ emoji                 │
                          │  │ sort_order            │
                          │  │ created_at            │
                          │  │ updated_at            │
                          │  └──────────────────────┘
                          │
                          │  ┌──────────────────────┐
                          │  │   noti_followers      │
                          │  ├──────────────────────┤
                          │  │ id (uuid) PK         │
                          ├─▶│ trip_id FK            │
                          │  │ display_name          │
                          │  │ channel (enum)        │
                          │  │ line_user_id          │
                          │  │ web_push_subscription │
                          │  │ followed_at           │
                          │  └──────────┬───────────┘
                          │             │
                          │  ┌──────────┼──────────┐
                          │  │          │           │
                          │  ▼          │           │
                          │ ┌──────────────────────┐│
                          │ │  noti_change_logs     ││
                          │ ├──────────────────────┤│
                          │ │ id (uuid) PK         ││
                          ├▶│ trip_id FK            ││
                             │ changed_by FK (user) ││
                             │ changes (jsonb)      ││
                             │ summary_text         ││
                             │ noti_sent            ││
                             │ noti_sent_at         ││
                             │ created_at           ││
                             └──────────┬───────────┘│
                                        │            │
                             ┌──────────▼───────────┐│
                             │ noti_acknowledgements ││
                             ├──────────────────────┤│
                             │ id (uuid) PK         ││
                             │ changelog_id FK      │┘
                             │ follower_id FK       │
                             │ acknowledged_at      │
                             └──────────────────────┘
```

### 2.3 SQL Schema

```sql
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE trip_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE activity_type AS ENUM ('attraction', 'restaurant', 'hotel', 'transport', 'shopping', 'other');
CREATE TYPE follow_channel AS ENUM ('line', 'web_push');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business');
CREATE TYPE user_role AS ENUM ('owner', 'editor');

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE mst_companies (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  logo_url      text,
  phone         text,
  line_id       text,
  facebook      text,
  instagram     text,
  website       text,
  tat_license   text,
  tier          subscription_tier DEFAULT 'free',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================
-- USERS (managed by Auth.js)
-- ============================================
CREATE TABLE mst_users (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id    uuid REFERENCES mst_companies(id) ON DELETE SET NULL,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text,
  role          user_role DEFAULT 'owner',
  created_at    timestamptz DEFAULT now()
);

-- ============================================
-- TRIP PLANS
-- ============================================
CREATE TABLE trip_plans (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id      uuid NOT NULL REFERENCES mst_companies(id) ON DELETE CASCADE,
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  destination     text,
  start_date      date,
  end_date        date,
  cover_image_url text,
  travelers_count integer DEFAULT 0,
  language        text DEFAULT 'th',
  airline_info    jsonb DEFAULT '[]'::jsonb,
  accommodations  jsonb DEFAULT '[]'::jsonb,
  emergency_contacts jsonb DEFAULT '[]'::jsonb,
  notes           text,
  status          trip_status DEFAULT 'draft',
  edit_count      integer DEFAULT 0,
  view_count      integer DEFAULT 0,
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_trip_plans_slug ON trip_plans(slug);
CREATE INDEX idx_trip_plans_company ON trip_plans(company_id);
CREATE INDEX idx_trip_plans_status ON trip_plans(status);

-- ============================================
-- DAYS
-- ============================================
CREATE TABLE trip_days (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id         uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  day_number      integer NOT NULL,
  title           text,
  subtitle        text,
  cover_image_url text,
  date            date,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_trip_days_trip ON trip_days(trip_id);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE TABLE trip_activities (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id        uuid NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  time          time,
  name          text NOT NULL,
  description   text,
  type          activity_type DEFAULT 'attraction',
  place_name    text,
  lat           decimal(10, 7),
  lng           decimal(10, 7),
  maps_link     text,
  image_url     text,
  emoji         text DEFAULT '📍',
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_trip_activities_day ON trip_activities(day_id);

-- ============================================
-- FOLLOWERS
-- ============================================
CREATE TABLE noti_followers (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id               uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  display_name          text NOT NULL DEFAULT 'Guest',
  channel               follow_channel NOT NULL,
  line_user_id          text,  -- from LINE OA add friend
  web_push_subscription jsonb, -- { endpoint, keys: { p256dh, auth } }
  followed_at           timestamptz DEFAULT now()
);

CREATE INDEX idx_noti_followers_trip ON noti_followers(trip_id);

-- ============================================
-- CHANGE LOGS
-- ============================================
CREATE TABLE noti_change_logs (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id       uuid NOT NULL REFERENCES trip_plans(id) ON DELETE CASCADE,
  changed_by    uuid REFERENCES mst_users(id),
  changes       jsonb NOT NULL,    -- structured diff
  summary_text  text NOT NULL,     -- human-readable summary
  noti_sent     boolean DEFAULT false,
  noti_sent_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_noti_changelogs_trip ON noti_change_logs(trip_id);

-- ============================================
-- ACKNOWLEDGEMENTS
-- ============================================
CREATE TABLE noti_acknowledgements (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  changelog_id    uuid NOT NULL REFERENCES noti_change_logs(id) ON DELETE CASCADE,
  follower_id     uuid NOT NULL REFERENCES noti_followers(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  UNIQUE (changelog_id, follower_id)
);

CREATE INDEX idx_noti_ack_changelog ON noti_acknowledgements(changelog_id);
```

### 2.4 JSONB Field Structures

```typescript
// airline_info: jsonb
type AirlineInfo = {
  airline: string;       // "Xiamen Air"
  flight_number: string; // "MF834"
  departure_time: string;// "17:40"
  arrival_time: string;  // "22:05"
  departure_airport: string; // "BKK"
  arrival_airport: string;   // "XMN"
  type: 'departure' | 'return' | 'transit';
}[];

// accommodations: jsonb
type Accommodation = {
  name: string;         // "The QUBE Hotel Chiba"
  address: string;      // "1-2-3 Chiba, Japan"
  phone: string;        // "+81-XX-XXXX-XXXX"
  check_in: string;     // "15:00"
  check_out: string;    // "11:00"
  nights: number;       // 5
}[];

// emergency_contacts: jsonb
type EmergencyContact = {
  name: string;         // "สถานทูตไทย โตเกียว"
  phone: string;        // "+81-3-2207-9100"
  icon: string;         // "🏥"
  sort_order: number;
}[];

// changes: jsonb (in change_logs)
type ChangeEntry = {
  type: 'add' | 'update' | 'delete';
  entity: 'day' | 'activity' | 'trip_info';
  day_number?: number;
  field?: string;
  old_value?: string;
  new_value?: string;
  description: string; // "เปลี่ยนเวลา teamLab: 08:30 → 09:00"
}[];

// web_push_subscription: jsonb (in followers)
type WebPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};
```

### 2.5 App-level Authorization (Drizzle Middleware + Service Layer)

> **Note:** แทนที่จะใช้ PostgreSQL RLS (ต้องการ Supabase), เราใช้ authorization ที่ service layer ผ่าน Drizzle ORM middleware แทน — ง่ายกว่า debug ได้, test ได้

```typescript
// lib/db/auth-middleware.ts — Authorization helpers

import { db } from './drizzle';
import { mstUsers, tripPlans } from './schema';
import { eq, and } from 'drizzle-orm';

// ─── Get current user's company_id from session ───
export async function getUserCompanyId(userId: string): Promise<string | null> {
  const user = await db.query.mstUsers.findFirst({
    where: eq(mstUsers.id, userId),
    columns: { companyId: true },
  });
  return user?.companyId ?? null;
}

// ─── Verify user owns this company ───
export async function assertCompanyOwner(userId: string, companyId: string) {
  const user = await db.query.mstUsers.findFirst({
    where: and(eq(mstUsers.id, userId), eq(mstUsers.companyId, companyId)),
  });
  if (!user) throw new Error('Forbidden: not company owner');
}

// ─── Verify user owns this trip (via company) ───
export async function assertTripOwner(userId: string, tripId: string) {
  const companyId = await getUserCompanyId(userId);
  if (!companyId) throw new Error('Forbidden: no company');
  const trip = await db.query.tripPlans.findFirst({
    where: and(eq(tripPlans.id, tripId), eq(tripPlans.companyId, companyId)),
  });
  if (!trip) throw new Error('Forbidden: not trip owner');
}

// ─── Public access: only published trips ───
export async function assertTripPublished(tripId: string) {
  const trip = await db.query.tripPlans.findFirst({
    where: and(eq(tripPlans.id, tripId), eq(tripPlans.status, 'published')),
  });
  if (!trip) throw new Error('Not found or not published');
}
```

```
Authorization Rules (enforced at API route / service layer):

MST_COMPANIES:
├── SELECT own company → assertCompanyOwner(userId, companyId)
└── UPDATE own company → assertCompanyOwner(userId, companyId)

TRIP_PLANS:
├── CRUD own trips → assertTripOwner(userId, tripId)
└── Public SELECT published → WHERE status = 'published'

TRIP_DAYS & TRIP_ACTIVITIES:
├── CRUD → assertTripOwner(userId, trip_id of parent)
└── Public SELECT → via published trip check

NOTI_FOLLOWERS:
├── INSERT → assertTripPublished(tripId) — anyone can follow published trip
└── SELECT (admin) → assertTripOwner(userId, tripId)

NOTI_ACKNOWLEDGEMENTS:
├── INSERT → validated at API layer with follower_id
└── SELECT (admin) → assertTripOwner via changelog → trip
```

---

## 3. API Design

### 3.1 API Routes Overview

```
/api
├── /auth
│   ├── POST /register          สมัครสมาชิก
│   ├── POST /login             เข้าสู่ระบบ
│   └── POST /logout            ออกจากระบบ
│
├── /company
│   ├── GET  /me                ข้อมูลบริษัทของตัวเอง
│   ├── PUT  /me                แก้ไขข้อมูลบริษัท
│   └── POST /me/logo           อัปโหลด logo
│
├── /trips
│   ├── GET    /                รายการทริป (dashboard)
│   ├── POST   /                สร้างทริปใหม่
│   ├── GET    /:id             ข้อมูลทริป (admin)
│   ├── PUT    /:id             แก้ไขทริป
│   ├── DELETE /:id             ลบทริป
│   │
│   ├── POST   /:id/publish     Publish ทริป
│   ├── POST   /:id/unpublish   Unpublish ทริป
│   │
│   ├── /days
│   │   ├── GET    /:tripId/days            รายการวัน
│   │   ├── POST   /:tripId/days            เพิ่มวัน
│   │   ├── PUT    /:tripId/days/:dayId     แก้ไขวัน
│   │   ├── DELETE /:tripId/days/:dayId     ลบวัน
│   │   └── PUT    /:tripId/days/reorder    เรียงลำดับวัน
│   │
│   ├── /activities
│   │   ├── POST   /:dayId/activities               เพิ่มกิจกรรม
│   │   ├── PUT    /:dayId/activities/:actId         แก้ไขกิจกรรม
│   │   ├── DELETE /:dayId/activities/:actId         ลบกิจกรรม
│   │   └── PUT    /:dayId/activities/reorder        เรียงลำดับ
│   │
│   ├── /followers
│   │   └── GET    /:tripId/followers        รายการ followers (admin)
│   │
│   ├── /changelog
│   │   ├── GET    /:tripId/changelog        ประวัติการเปลี่ยนแปลง
│   │   └── GET    /:tripId/changelog/:id/ack  สถานะรับทราบ
│   │
│   └── /stats
│       └── GET    /:tripId/stats            Views + Followers count
│
├── /public (ไม่ต้อง auth)
│   ├── GET    /t/:slug                     Guest View data
│   ├── GET    /t/:slug/imm                 Immigration View data
│   └── POST   /t/:slug/view               นับ view (+1)
│
├── /follow (ไม่ต้อง auth)
│   ├── POST   /line/webhook                LINE Messaging API webhook
│   ├── POST   /web-push/subscribe          Web Push subscription
│   └── DELETE /unfollow/:followerId        ยกเลิกติดตาม
│
├── /acknowledge (ไม่ต้อง auth)
│   └── POST   /:changelogId               กดรับทราบ
│
├── /notify (internal)
│   ├── POST   /send/:changelogId          ส่ง noti ให้ followers ทั้งหมด
│   └── POST   /resend/:changelogId        ส่ง noti ซ้ำเฉพาะคนที่ยังไม่รับทราบ
│
└── /upload
    └── POST   /image                      Upload image → Cloudflare R2
```

### 3.2 Key API Contracts

#### POST /api/trips — สร้างทริปใหม่

```typescript
// Request
{
  title: string;
  destination: string;
  start_date: string;       // "2026-04-15"
  end_date: string;         // "2026-04-22"
  cover_image_url?: string;
  travelers_count?: number;
  language?: 'th' | 'en' | 'ja';
  airline_info?: AirlineInfo[];
  accommodations?: Accommodation[];
}

// Response 201
{
  id: string;
  slug: string; // auto-generated
  status: 'draft';
  days: Day[];  // auto-generated from date range
}
```

#### GET /api/public/t/:slug — Guest View Data

```typescript
// Response 200
{
  trip: {
    title: string;
    destination: string;
    start_date: string;
    end_date: string;
    cover_image_url: string;
    travelers_count: number;
    language: string;
    airline_info: AirlineInfo[];
    accommodations: Accommodation[];
    notes: string;
  };
  company: {
    name: string;
    logo_url: string;
    phone: string;
    line_id: string;
    facebook?: string;
    instagram?: string;
  };
  days: {
    day_number: number;
    title: string;
    subtitle: string;
    cover_image_url: string;
    date: string;
    activities: {
      time: string;
      name: string;
      description?: string;
      emoji: string;
      place_name?: string;
      maps_link?: string;
    }[];
  }[];
  emergency_contacts: EmergencyContact[];
  pending_changes?: {
    changelog_id: string;
    summary_text: string;
    created_at: string;
  };
  follower_count: number;
}
```

#### POST /api/follow/line/webhook — LINE Messaging API Webhook

```typescript
// Request (from LINE Platform)
// LINE Messaging API webhook event (follow event)
{
  events: [{
    type: 'follow';
    source: { userId: string };  // LINE userId
    replyToken: string;
  }]
}

// Flow:
// 1. Receive webhook event from LINE, extract userId
// 2. Create follower record with userId
// 3. Reply with welcome message via reply API

// Response: 200 OK
```

#### POST /api/notify/send/:changelogId — ส่ง Notification

```typescript
// Internal endpoint (called after admin saves changes)

// Flow:
// 1. Get changelog + trip data
// 2. Get all followers of this trip
// 3. For each follower:
//    - channel = 'line' → call LINE Messaging API push message
//    - channel = 'web_push' → call web-push library
// 4. Update changelog.noti_sent = true
// 5. Return results

// Response 200
{
  total_followers: number;
  sent: {
    line: number;
    web_push: number;
  };
  failed: {
    line: number;
    web_push: number;
  };
}
```

---

## 4. Authentication Flow

### 4.1 Admin Auth (Auth.js / NextAuth v5)

```
Register Flow:
──────────────
[Admin] → POST /api/auth/register { email, password, company_name }
  │
  ├── 1. Validate input (Zod)
  │
  ├── 2. Hash password (bcrypt via Auth.js)
  │
  ├── 3. Create mst_companies record
  │      → { name: company_name, tier: 'free' }
  │
  ├── 4. Create mst_users record (Drizzle)
  │      → { email, password_hash, company_id, role: 'owner' }
  │
  └── 5. Auto sign-in via Auth.js → Return { user, session }

Login Flow:
───────────
[Admin] → Auth.js Credentials Provider { email, password }
  │
  ├── 1. Auth.js: authorize(email, password)
  │      → Drizzle query: find user by email
  │      → bcrypt.compare(password, password_hash)
  │
  ├── 2. Auth.js sets session cookie (httpOnly, secure, sameSite)
  │      → next-auth.session-token (JWT)
  │
  └── 3. Return { user, company }

Social Login (LINE Login):
──────────────────────────
- Auth.js supports LINE Login provider for social login
- Users can sign in with their LINE account
- Automatic account linking via email

Session Management:
───────────────────
- JWT stored in httpOnly cookie: next-auth.session-token
- Auth.js middleware auto-validates session
- Next.js middleware checks auth on /dashboard/* routes
- Unauthenticated → redirect to /login
```

### 4.2 Guest Access (No Auth)

```
Guest View:
───────────
[Guest] → GET /t/{slug}
  │
  ├── 1. Server: fetch trip_plan WHERE slug = :slug AND status = 'published'
  ├── 2. If not found → 404 page
  ├── 3. If found → SSR render full trip view
  └── 4. Client: increment view_count (debounced, 1 per session)

Follow (LINE OA):
─────────────────
[Guest] → กดปุ่ม "ติดตาม (LINE)"
  │
  ├── 1. User เพิ่มเพื่อน LINE OA
  │      (via LINE OA link / QR code on trip page)
  │
  ├── 2. LINE Platform sends follow event webhook
  │      POST /api/follow/line/webhook
  │
  ├── 3. Webhook: follow event → userId
  │      Extract userId from event.source.userId
  │
  ├── 4. Server: save userId to noti_followers table
  │
  └── 5. Reply welcome message with trip link

Follow (Web Push):
──────────────────
[Guest] → กดปุ่ม "ติดตาม (Web Push)"
  │
  ├── 1. Request notification permission
  │      Notification.requestPermission()
  │
  ├── 2. Subscribe to push service
  │      registration.pushManager.subscribe({
  │        userVisibleOnly: true,
  │        applicationServerKey: VAPID_PUBLIC_KEY
  │      })
  │
  ├── 3. POST /api/follow/web-push/subscribe
  │      { trip_id, display_name, subscription }
  │
  └── 4. Save to followers table
```

---

## 5. Notification Architecture

### 5.1 Change Detection Flow

```
Admin แก้ไข Trip → กด "บันทึก"
│
▼
[API: PUT /api/trips/:id]
│
├── 1. Load current trip data (snapshot BEFORE)
│
├── 2. Apply changes → save to DB
│
├── 3. Compare BEFORE vs AFTER → generate diff
│      diffTrip(before, after) → ChangeEntry[]
│
├── 4. Generate human-readable summary
│      "Day 2: เปลี่ยนเวลา teamLab 08:30 → 09:00"
│
├── 5. Save to noti_change_logs table
│      { trip_id, changes: diff, summary_text }
│
├── 6. Increment edit_count (free tier tracking)
│
├── 7. Return { changelog_id, summary, edit_count }
│
▼
[Frontend: แสดง Change Summary Modal]
│
├── Admin กด "ส่งแจ้งเตือน"
│   └── POST /api/notify/send/:changelogId
│
└── Admin กด "บันทึกอย่างเดียว"
    └── (ไม่ส่ง noti)
```

### 5.2 Notification Sending Flow

```
POST /api/notify/send/:changelogId
│
├── 1. Load changelog + trip data
│
├── 2. Load all followers WHERE trip_id = :tripId
│
├── 3. Prepare message
│      ┌──────────────────────────────┐
│      │ 🔔 NatGan - {trip.title}      │
│      │                              │
│      │ ⚠️ มีการเปลี่ยนแปลง:          │
│      │ {summary_text}               │
│      │                              │
│      │ 👉 ดูรายละเอียด + กดรับทราบ:   │
│      │ natgan.com/t/{slug}           │
│      └──────────────────────────────┘
│
├── 4. Send concurrently (Promise.allSettled)
│      ┌─── LINE Messaging API ─────────────────────┐
│      │  POST https://api.line.me/v2/bot/message/push│
│      │  Authorization: Bearer {channel_access_token}│
│      │  to: {userId}, messages: [{formatted_message}]│
│      └──────────────────────────────────────────────┘
│      ┌─── Web Push ─────────────────────────────────┐
│      │  webpush.sendNotification(subscription, {    │
│      │    title: "{trip.title} มีการเปลี่ยน",        │
│      │    body: summary_text.substring(0, 100),     │
│      │    icon: company.logo_url,                   │
│      │    data: { url: "/t/{slug}" }                │
│      │  })                                          │
│      └──────────────────────────────────────────────┘
│
├── 5. Handle failures
│      - LINE API error → mark follower as inactive
│      - Web Push subscription invalid → delete follower
│
├── 6. Update changelog: noti_sent = true, noti_sent_at = now()
│
└── 7. Return send results
```

### 5.3 Service Worker (Web Push + Offline)

```javascript
// public/sw.js

// ─── Web Push Handler ───
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/natgan-192.png',
      badge: '/icons/natgan-badge.png',
      data: { url: data.data?.url },
      vibrate: [100, 50, 100], // haptic feedback
    })
  );
});

// ─── Click Handler ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(`https://natgan.com${url}`)
  );
});

// ─── Offline Cache (Immigration View) ───
const IMM_CACHE = 'natgan-imm-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache immigration view pages
  if (url.pathname.endsWith('/imm')) {
    event.respondWith(
      caches.open(IMM_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          cache.put(event.request, response.clone());
          return response;
        } catch {
          return cache.match(event.request);
        }
      })
    );
  }
});
```

---

## 6. File Storage Architecture

### 6.1 Cloudflare R2 Storage (S3-compatible)

> **Note:** Cloudflare R2 ฟรี 10GB storage, ไม่มี egress fee (ต่างจาก S3/Supabase)

```
R2 Bucket: natgan-uploads
├── company-logos/
│   └── {company_id}/logo.{ext}
│       Max: 2MB, Types: jpg/png/webp
│       Access: public (แสดงบน trip view)
│
├── trip-covers/
│   └── {trip_id}/cover.{ext}
│       Max: 5MB, Types: jpg/png/webp
│       Access: public (แสดงบน trip view)
│
├── day-covers/
│   └── {day_id}/cover.{ext}
│       Max: 5MB, Types: jpg/png/webp
│       Access: public
│
└── preset-covers/
    └── japan-01.jpg, korea-01.jpg, beach-01.jpg...
    Pre-uploaded, read-only
    Access: public

R2 Free Tier:
├── Storage: 10 GB/month
├── Class A operations: 1M/month (PUT, POST)
├── Class B operations: 10M/month (GET)
└── Egress: Free (ไม่มีค่า bandwidth)
```

### 6.2 Image Optimization

```
Upload Flow:
[Admin uploads image]
  │
  ├── 1. Client-side: resize + compress (max 1920px, quality 80%)
  │      using browser Canvas API
  │
  ├── 2. Upload to Cloudflare R2 via API route
  │      POST /api/upload/image { file, bucket, path }
  │      (uses @aws-sdk/client-s3 with R2 endpoint)
  │
  ├── 3. Get public URL
  │      https://{custom-domain}.r2.dev/{bucket}/{path}
  │
  └── 4. Save URL to trip_plan/day record

Serving:
- Cloudflare R2 serves via Cloudflare CDN (global edge)
- Next.js <Image> component handles:
  - Lazy loading
  - Responsive srcset
  - WebP conversion
  - Blur placeholder (shimmer)
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
Layer 1: Network
├── HTTPS everywhere (Vercel auto-SSL)
├── CORS: only natgan.com origin
└── Rate limiting: Vercel Edge middleware
    ├── /api/auth/*: 10 req/min per IP
    ├── /api/notify/*: 5 req/min per user
    └── /api/public/*: 100 req/min per IP

Layer 2: Authentication
├── Auth.js session + JWT (NextAuth v5)
├── httpOnly cookie: next-auth.session-token (SameSite)
├── Session auto-validation via Auth.js middleware
└── CSRF protection via SameSite cookies

Layer 3: Authorization
├── Drizzle middleware + service-layer auth checks
├── API route middleware: verify auth + company ownership
└── Rate limit per tier (free: 10 noti/month)

Layer 4: Data Protection
├── LINE User IDs: stored securely
│   (not secret data, no encryption needed)
├── Web Push subscriptions: stored as-is (not secret)
├── Passwords: Auth.js handles (bcrypt)
├── PostgreSQL + VPS disk encryption
└── PII minimal: only display_name for followers

Layer 5: Input Validation
├── Zod schema validation on all API inputs
├── Slug: alphanumeric + hyphen only, max 60 chars
├── HTML sanitization on notes/description fields
└── File upload: type + size validation
```

### 7.2 PDPA Compliance

```
ข้อมูลที่เก็บ:
├── Admin: email, company name, contacts → consent at registration
├── Follower: display_name, LINE userId/Web Push sub → consent at follow
└── Guest (anonymous): view count only, no PII

สิทธิ์ของเจ้าของข้อมูล:
├── สิทธิ์ในการเข้าถึง → Admin: dashboard, Follower: ไม่เก็บ PII มาก
├── สิทธิ์ในการลบ → Admin: delete account, Follower: unfollow
├── สิทธิ์ในการถอนความยินยอม → Unfollow button on trip page
└── สิทธิ์ในการโอนย้าย → Export trip data as JSON (Phase 2)

Implementation:
├── Privacy Policy page: /privacy
├── Terms of Service page: /terms
├── Consent checkboxes at registration + follow
├── LINE User ID → deleted when unfollowed
└── Admin delete account → cascade delete all data
```

---

## 8. Environment Variables

```bash
# ─── Database (PostgreSQL on VPS) ───
DATABASE_URL=postgresql://user:pass@vps-ip:5432/natgan

# ─── Auth.js (NextAuth v5) ───
NEXTAUTH_SECRET=xxx                     # Random secret for JWT signing
NEXTAUTH_URL=https://natgan.com         # Canonical URL

# ─── LINE Messaging API ───
LINE_CHANNEL_ID=xxxxx
LINE_CHANNEL_SECRET=xxxxx
LINE_CHANNEL_ACCESS_TOKEN=xxxxx

# ─── LINE Login (Auth.js provider) ───
LINE_LOGIN_CHANNEL_ID=xxxxx
LINE_LOGIN_CHANNEL_SECRET=xxxxx

# ─── Cloudflare R2 ───
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=natgan-uploads
R2_PUBLIC_URL=https://cdn.natgan.com    # Custom domain or R2.dev URL

# ─── Web Push (VAPID) ───
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BL...      # Public, used in client
VAPID_PRIVATE_KEY=xxx                   # Server-side only
VAPID_SUBJECT=mailto:admin@natgan.com

# ─── Encryption ───
ENCRYPTION_KEY=xxx                      # AES-256 key (reserved for future use)

# ─── App ───
NEXT_PUBLIC_BASE_URL=https://natgan.com
NODE_ENV=production
```

---

## 9. Deployment Architecture

### 9.1 Infrastructure

```
┌─────────────────────────────────────────────────┐
│                    Vercel                         │
│                                                  │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Edge Network │  │ Serverless│  │ Static     │ │
│  │ (CDN)        │  │ Functions │  │ Assets     │ │
│  │              │  │ (API)     │  │ (images,   │ │
│  │ - HTML cache │  │           │  │  JS, CSS)  │ │
│  │ - ISR pages  │  │ Region:   │  │            │ │
│  │              │  │ sin1      │  │            │ │
│  │              │  │ (Singapore)│  │            │ │
│  └─────────────┘  └──────────┘  └────────────┘ │
│                                                  │
│  Git: main → auto deploy                        │
│  Preview: PR → preview URL                       │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│ VPS (Docker) │ │ LINE     │ │ Web Push │
│ PostgreSQL 16│ │ Messaging│ │ Services │
│              │ │ (Japan)  │ │ (Google/ │
│ Vultr/Hetzner│ │          │ │  Apple)  │
│ SG or Thai DC│ └──────────┘ └──────────┘
│              │ ┌──────────────────┐
│ ~150-250 บ/mo│ │ Cloudflare R2    │
│ 1 vCPU, 1GB │ │ File Storage     │
│              │ │ Free 10GB        │
└──────────────┘ └──────────────────┘
```

### 9.2 CI/CD Pipeline

```
GitHub Repository
│
├── main branch → Vercel Production (natgan.com)
│
├── develop branch → Vercel Preview (develop.natgan.vercel.app)
│
└── PR branches → Vercel Preview (pr-{n}.natgan.vercel.app)

Deploy Steps (automatic):
1. Push to GitHub
2. Vercel detects change
3. Install dependencies (npm ci)
4. Build (next build)
5. Deploy to edge network
6. Health check
7. Alias to production domain

Database Migrations (Drizzle):
- drizzle/migrations/*.sql (auto-generated by drizzle-kit)
- Run via: npx drizzle-kit push (dev) / npx drizzle-kit migrate (prod)
- Automate with GitHub Actions in Phase 2

VPS Setup:
- Docker Compose: PostgreSQL 16 + automated backup
- Backup: pg_dump cron (daily → Cloudflare R2)
- VPS providers: Vultr/Hetzner Singapore or Thai DC
- SSH key-only access, UFW firewall (allow 5432 from Vercel IPs only)
```

### 9.3 Monitoring (MVP — ใช้ของฟรี)

```
Performance:
├── Vercel Analytics (built-in, free)
│   - Web Vitals (LCP, FID, CLS)
│   - Page load times
│   - Error rates
└── Vercel Speed Insights

Errors:
├── Vercel Logs (built-in)
│   - API route errors
│   - Build errors
└── console.error → Vercel log stream

Database:
├── PostgreSQL pg_stat_statements (query performance)
├── Docker health checks
├── Disk usage monitoring (VPS)
└── Row counts via admin dashboard

Uptime:
└── ใช้ free tier monitoring (e.g. UptimeRobot)
    - natgan.com/api/health → 200 OK
    - Alert via LINE Messaging API to admin
```

---

## 10. Project Structure

```
natgan/
├── public/
│   ├── sw.js                      # Service Worker
│   ├── icons/                     # PWA icons
│   └── preset-covers/             # Preset images (local dev)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── page.tsx               # Landing page (SSG)
│   │   ├── globals.css            # Tailwind + custom theme
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── dashboard/             # Admin area (CSR, auth required)
│   │   │   ├── layout.tsx         # Sidebar + auth check
│   │   │   ├── page.tsx           # Trip list
│   │   │   ├── profile/page.tsx   # Company profile
│   │   │   ├── trips/
│   │   │   │   ├── new/page.tsx   # Trip builder step 1
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── edit/page.tsx    # Trip builder step 2
│   │   │   │   │   ├── preview/page.tsx # Preview
│   │   │   │   │   ├── publish/page.tsx # Publish & share
│   │   │   │   │   └── receipts/page.tsx# Read receipts
│   │   │   │   └── page.tsx       # Redirect to list
│   │   │   └── usage/page.tsx     # Usage & limits
│   │   │
│   │   ├── t/[slug]/              # Guest view (SSR + ISR)
│   │   │   ├── page.tsx           # Full trip view
│   │   │   └── imm/page.tsx       # Immigration view
│   │   │
│   │   ├── api/                   # API routes
│   │   │   ├── auth/
│   │   │   ├── company/
│   │   │   ├── trips/
│   │   │   ├── public/
│   │   │   ├── follow/
│   │   │   ├── acknowledge/
│   │   │   ├── notify/
│   │   │   ├── upload/
│   │   │   └── health/route.ts
│   │   │
│   │   └── privacy/page.tsx       # Privacy policy
│   │
│   ├── components/
│   │   ├── admin/                 # Admin-only components
│   │   │   ├── TripForm.tsx
│   │   │   ├── DayEditor.tsx
│   │   │   ├── ActivityEditor.tsx
│   │   │   ├── ReceiptDashboard.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── guest/                 # Guest view components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── DayCard.tsx
│   │   │   ├── ActivityItem.tsx
│   │   │   ├── DayNav.tsx
│   │   │   ├── FollowButton.tsx
│   │   │   ├── AcknowledgeBanner.tsx
│   │   │   ├── CompanyFooter.tsx
│   │   │   ├── CountdownBadge.tsx
│   │   │   └── EmergencySection.tsx
│   │   │
│   │   ├── immigration/
│   │   │   └── ImmigrationView.tsx
│   │   │
│   │   └── shared/                # Shared components
│   │       ├── QRCode.tsx
│   │       ├── ImageUpload.tsx
│   │       ├── LangSwitcher.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── drizzle.ts         # Drizzle ORM client
│   │   │   ├── schema.ts          # Drizzle table definitions
│   │   │   └── auth-middleware.ts  # Authorization helpers
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.ts            # Auth.js (NextAuth v5) config
│   │   │   └── providers.ts       # Credentials + LINE Login providers
│   │   │
│   │   ├── storage/
│   │   │   └── r2.ts              # Cloudflare R2 client (S3-compatible)
│   │   │
│   │   ├── notifications/
│   │   │   ├── line-messaging.ts   # LINE Messaging API wrapper
│   │   │   ├── web-push.ts        # web-push wrapper
│   │   │   └── change-detector.ts # Diff engine
│   │   │
│   │   ├── encryption.ts          # AES-256-GCM (reserved for future use)
│   │   ├── slug.ts                # Slug generation + validation
│   │   ├── i18n.ts                # Platform i18n
│   │   └── utils.ts               # Shared utilities
│   │
│   ├── types/
│   │   ├── database.ts            # Drizzle inferred types
│   │   ├── api.ts                 # API request/response types
│   │   └── trip.ts                # Domain types
│   │
│   └── middleware.ts              # Next.js middleware (auth, i18n)
│
├── drizzle/
│   ├── migrations/                # Auto-generated by drizzle-kit
│   │   ├── 0000_initial_schema.sql
│   │   └── 0001_indexes.sql
│   ├── seed.ts                    # Test data (TypeScript)
│   └── drizzle.config.ts          # Drizzle Kit config
│
├── docker/
│   ├── docker-compose.yml         # PostgreSQL 16 + backup
│   └── backup.sh                  # pg_dump cron script → R2
│
├── .env.local                     # Local env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 11. Key Technical Decisions

| # | Decision | เหตุผล | Alternative ที่ตัด |
|---|---|---|---|
| T1 | PostgreSQL self-host + Auth.js + Drizzle ORM | ไม่มี subscription cost (~150-250 บ/mo VPS), ไม่มี latency (เลือก Thai DC ได้), full control, no vendor lock-in | Supabase (free tier limit, SG latency), Firebase (vendor lock-in) |
| T2 | Next.js API Routes แทน separate backend | Monorepo, deploy เดียว, shared types | Separate NestJS/Express (complexity + cost) |
| T3 | SSR + ISR สำหรับ Guest View | SEO + fast first load + fresh data | CSR (ช้า FCP), SSG (ข้อมูลไม่ fresh) |
| T4 | JSONB สำหรับ airline/accommodation | Flexible schema, ไม่ต้องสร้าง table เพิ่ม | Normalized tables (over-engineering สำหรับ MVP) |
| T5 | LINE User ID stored (no encryption needed - not secret) | userId ไม่ใช่ secret, ไม่ต้อง encrypt | Encrypt userId (unnecessary overhead) |
| T6 | Service Worker สำหรับ Immigration + Push | Offline + push noti ใน file เดียว | ไม่ทำ offline (bad UX ตอนยื่น ตม.) |
| T7 | Client-side image resize ก่อน upload | ลด upload time + storage cost | Server-side resize (ช้า, ใช้ compute) |
| T8 | Vercel Singapore region | ใกล้ไทยที่สุด, latency ~30ms | US (latency ~200ms) |
| T9 | Slug-based URL (/t/{slug}) | จำง่าย, SEO-friendly, share ง่าย | UUID-based URL (/t/{uuid}) — น่าเกลียด |
| T10 | Change detection at API layer | Control เมื่อไหร่จะ diff, ไม่ต้อง trigger | DB trigger (complex, hard to debug) |

---

## 12. Free Tier Limits & Enforcement

### 12.1 VPS + PostgreSQL (Self-hosted)

| Resource | Spec | Cost | หมายเหตุ |
|---|---|---|---|
| VPS (Vultr/Hetzner) | 1 vCPU, 1GB RAM, 25GB SSD | ~150-250 บ/เดือน (flat) | SG or Thai DC |
| PostgreSQL 16 | Docker container | included | Unlimited DB size (limited by disk) |
| Backup | pg_dump → Cloudflare R2 | ฟรี (R2 free tier) | Daily cron |

### 12.1.1 Cloudflare R2 Free Tier

| Resource | Free Limit | MVP Usage Estimate | เพียงพอ? |
|---|---|---|---|
| Storage | 10 GB/month | ~100 MB (images) | ✅ เหลือเฟือ |
| Class A ops (PUT) | 1M/month | ~1K | ✅ |
| Class B ops (GET) | 10M/month | ~10K | ✅ |
| Egress | Unlimited (free) | — | ✅ |

### 12.2 Vercel Free Tier

| Resource | Free Limit | MVP Usage Estimate | เพียงพอ? |
|---|---|---|---|
| Bandwidth | 100 GB/month | ~5 GB | ✅ |
| Serverless Functions | 100 GB-hrs | ~2 GB-hrs | ✅ |
| Builds | 6,000 min/month | ~60 min | ✅ |
| Edge Middleware | 1M invocations | ~10K | ✅ |

### 12.3 App-level Limits (Free Tier)

```typescript
// lib/limits.ts

import { db } from './db/drizzle';
import { tripPlans } from './db/schema';
import { eq, ne, and, count } from 'drizzle-orm';

const FREE_TIER_LIMITS = {
  trip_slots: 3,
  edits_per_trip: 2,          // after publish
  followers_per_trip: 30,
  notifications_per_month: 10,
};

// Enforcement: check before action
async function checkTripSlotLimit(companyId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(tripPlans)
    .where(and(
      eq(tripPlans.companyId, companyId),
      ne(tripPlans.status, 'unpublished')
    ));

  return (result?.count ?? 0) < FREE_TIER_LIMITS.trip_slots;
}

async function checkEditLimit(tripId: string): Promise<boolean> {
  const trip = await db.query.tripPlans.findFirst({
    where: eq(tripPlans.id, tripId),
    columns: { editCount: true, status: true },
  });

  if (trip?.status !== 'published') return true; // draft = unlimited
  return (trip?.editCount ?? 0) < FREE_TIER_LIMITS.edits_per_trip;
}
```

---

## 13. Performance Optimization

### 13.1 Guest View (Critical Path)

```
Target: First Contentful Paint < 2 seconds on 3G

Strategies:
├── SSR + Streaming (React Server Components)
│   - Hero section renders first (above the fold)
│   - Day cards stream progressively
│
├── Image Optimization
│   - Cover images: WebP, max 1200px width
│   - Lazy load below-the-fold images
│   - Blur placeholder (base64 embedded)
│   - Next.js <Image> with sizes + srcset
│
├── JavaScript Optimization
│   - Minimal client JS on guest view
│   - Map links = plain <a> tags (no JS needed)
│   - Follow button = only interactive component
│   - Code split: follow modal loads on click
│
├── Caching
│   - ISR: revalidate every 60 seconds
│   - CDN: Vercel Edge caches HTML
│   - Browser: static assets cache 1 year
│
└── LINE In-app Browser Specific
    - Test on LINE iOS + Android
    - Avoid features not supported (e.g. Web Share API)
    - Minimal viewport animations (LINE browser may lag)
```

### 13.2 Admin Dashboard

```
Strategies:
├── Auto-save drafts (debounced 2 seconds)
│   - Never lose work
│   - No explicit "save" button in edit mode
│
├── Optimistic updates
│   - Reorder days/activities → UI updates immediately
│   - Background sync to DB
│
└── Image upload
    - Client-side resize before upload
    - Show preview immediately from local file
    - Upload in background
```

---

## 14. Development Sequence (สอดคล้องกับ Sprint Plan)

```
สัปดาห์ 1-2: Foundation
━━━━━━━━━━━━━━━━━━━━━━
├── [x] VPS setup (Vultr/Hetzner SG or Thai DC)
├── [x] Docker + PostgreSQL 16 setup
├── [x] Drizzle ORM schema + initial migration
├── [x] Next.js project setup (from existing codebase)
├── [x] Auth.js (NextAuth v5) integration (Credentials + LINE Login)
├── [x] Login / Register pages
├── [x] Company Profile CRUD (Drizzle)
├── [x] Auth middleware (/dashboard/* protection)
└── [x] Basic dashboard layout (sidebar)

สัปดาห์ 3-4: Trip Builder
━━━━━━━━━━━━━━━━━━━━━━━━
├── [ ] Trip CRUD API routes
├── [ ] Trip form (step 1: general info)
├── [ ] Auto-generate days from date range
├── [ ] Day editor (add/remove/reorder)
├── [ ] Activity editor (add/remove/reorder/drag)
├── [ ] Image upload component + Cloudflare R2
├── [ ] Preset cover images
├── [ ] Emergency contacts editor
└── [ ] Notes editor

สัปดาห์ 5-6: Guest View + Publishing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── [ ] Publish flow (generate slug, update status)
├── [ ] Guest View SSR page (/t/[slug])
├── [ ] Adapt Demo App components for dynamic data
├── [ ] QR Code generation + download
├── [ ] Company branding on guest view
├── [ ] Powered by NatGan badge
├── [ ] Immigration View (/t/[slug]/imm)
├── [ ] Service Worker (offline cache for imm)
├── [ ] Auto-highlight current activity
├── [ ] Trip countdown badge
├── [ ] Publish & Share page (URL + QR + message template)
└── [ ] View count tracking

สัปดาห์ 7-8: Notification System ⭐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── [ ] LINE OA + Messaging API setup
├── [ ] Follow button + modal (LINE / Web Push)
├── [ ] LINE webhook handler + userId storage
├── [ ] Web Push VAPID setup + Service Worker push handler
├── [ ] Web Push subscribe flow
├── [ ] Change detection engine (diffTrip)
├── [ ] Change summary generation (human-readable)
├── [ ] Send notification (LINE + Web Push parallel)
├── [ ] Acknowledge banner + button
├── [ ] Read Receipt dashboard
├── [ ] Resend to un-acknowledged
└── [ ] Follower name collection

สัปดาห์ 9: Dashboard + Limits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── [ ] Admin dashboard (trip list + stats)
├── [ ] Change log view (admin)
├── [ ] Free tier limit checks (slots, edits, followers, noti)
├── [ ] Usage display component
├── [ ] Platform i18n (TH/EN/JP)
└── [ ] Unpublish flow

สัปดาห์ 10: Testing + Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── [ ] End-to-end testing (create → publish → follow → noti → ack)
├── [ ] Mobile testing (LINE browser, iOS Safari, Android Chrome)
├── [ ] Immigration view testing (offline cache)
├── [ ] Custom domain: natgan.com
├── [ ] Production env vars
├── [ ] VPS production PostgreSQL + pg_dump backup cron
├── [ ] Health check endpoint
├── [ ] Onboard pilot company
└── [ ] Seed data cleanup
```

---

## 15. npm Dependencies

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.x",
    "drizzle-orm": "^0.x",
    "@aws-sdk/client-s3": "^3.x",
    "bcrypt": "^5.x",
    "web-push": "^3.x",
    "qrcode": "^1.x",
    "zod": "^3.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^4.x",
    "@types/web-push": "^3.x",
    "@types/qrcode": "^1.x",
    "@types/bcrypt": "^5.x",
    "drizzle-kit": "^0.x"
  }
}
```

**หมายเหตุ dependencies:**
- `@dnd-kit` — drag-and-drop สำหรับ reorder days/activities
- `zod` — input validation ทุก API route
- `web-push` — server-side push notification
- `qrcode` — QR code generation
- `next-auth` — Auth.js (NextAuth v5) สำหรับ authentication
- `drizzle-orm` + `drizzle-kit` — type-safe ORM + migration tool
- `@aws-sdk/client-s3` — Cloudflare R2 client (S3-compatible)
- `bcrypt` — password hashing

---

*Document End — NatGan Technical Architecture v1.0*
