# NatGan — System Development Blueprint

> เอกสารนี้คือ "พิมพ์เขียว" ของระบบ NatGan ทั้งหมด — ครอบคลุมตั้งแต่ภาพรวมระบบ, แผนพัฒนา, ฐานข้อมูล, API, หน้าจอ, การเชื่อมต่อ Button → API, Security, Permission, และ Workflow
>
> **Version:** 1.0
> **Last Updated:** 17 March 2026
> **Status:** MVP Blueprint — 10-Week Sprint
> **Tech Stack:** Next.js 15 · PostgreSQL 16 (Self-host) · Auth.js · Drizzle ORM · Cloudflare R2 · LINE Messaging API

---

## สารบัญ

1. [System Overview](#1-system-overview)
2. [Phase Development Plan](#2-phase-development-plan)
3. [Database Design](#3-database-design)
4. [API Design](#4-api-design)
5. [Frontend Page Structure](#5-frontend-page-structure)
6. [API & Frontend Interaction Map](#6-api--frontend-interaction-map)
7. [Security Architecture](#7-security-architecture)
8. [Permission Model](#8-permission-model)
9. [System Workflow](#9-system-workflow)
10. [Deliverables & Definition of Done](#10-deliverables--definition-of-done)

---

## 1. System Overview

### 1.1 NatGan คืออะไร

NatGan (นัดกัน) เป็น **Trip Communication Tool** สำหรับบริษัททัวร์และไกด์ฟรีแลนซ์ในไทย ช่วยแก้ปัญหา:

> "แผนเปลี่ยน แต่ลูกทัวร์ไม่รู้"

ระบบช่วยให้ทัวร์ลีดเดอร์สร้างแผนการเดินทาง → แชร์ลิงก์ให้ลูกทัวร์ → เมื่อแก้ไขแผน ระบบแจ้งเตือนอัตโนมัติ พร้อมติดตามว่าใครอ่านแล้ว/ยังไม่อ่าน

### 1.2 Design Philosophy

```
"อยากรับรู้ แต่ไม่อยากรับเรื่อง"
(Want awareness without burden)
```

- **สำหรับทัวร์ลีดเดอร์:** สร้าง/แก้ไขแผนง่าย → ระบบจัดการแจ้งเตือนให้
- **สำหรับลูกทัวร์:** เปิดลิงก์ → ดูแผน → กดรับทราบ (ไม่ต้องสมัคร/ล็อกอิน)

### 1.3 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  Admin Dashboard  │  │   Guest View     │  │  LINE App      │ │
│  │  (CSR + Auth)     │  │   (SSR + Public) │  │  (Messaging)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
┌───────────┼─────────────────────┼─────────────────────┼──────────┐
│           ▼                     ▼                     ▼          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 API Routes (Vercel)                 │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │ │
│  │  │ Auth │  │ Trip │  │ Noti │  │Upload│  │Public│        │ │
│  │  │Routes│  │Routes│  │Routes│  │Routes│  │Routes│        │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────┼───────────────────────────────────┐ │
│  │              MIDDLEWARE LAYER                                │ │
│  │  ┌────────┐  ┌────────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │Auth.js │  │Rate Limiter│  │Zod Valid.│  │CORS/CSRF   │ │ │
│  │  │  JWT   │  │            │  │          │  │            │ │ │
│  │  └────────┘  └────────────┘  └──────────┘  └────────────┘ │ │
│  └─────────────────────────┬───────────────────────────────────┘ │
│                            │                                     │
│  ┌─────────────────────────┼───────────────────────────────────┐ │
│  │              DATA LAYER                                     │ │
│  │  ┌───────────┐  ┌────────────┐  ┌──────────────────┐      │ │
│  │  │PostgreSQL │  │Cloudflare  │  │LINE Messaging API│      │ │
│  │  │16 (Docker)│  │R2 Storage  │  │+ Web Push        │      │ │
│  │  │Self-host  │  │Free 10GB   │  │Free 500 msg/mo   │      │ │
│  │  └───────────┘  └────────────┘  └──────────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                        SERVER LAYER                              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Tech Stack Summary

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 15 + Tailwind CSS v4 | SSR + CSR, Thai ecosystem |
| Hosting | Vercel (Free) | Zero-config deploy, edge CDN |
| Database | PostgreSQL 16 (Docker, VPS) | Self-host, Thai DC, ~150-250 บ/เดือน |
| ORM | Drizzle ORM | Type-safe, lightweight, SQL-like |
| Auth | Auth.js (NextAuth v5) | Credentials + LINE Login, JWT |
| Storage | Cloudflare R2 | S3-compatible, free 10GB, no egress fee |
| Notification | LINE Messaging API | Free 500 msg/month via LINE OA |
| Notification | Web Push API | Free, unlimited, browser-native |
| Validation | Zod | Runtime type checking, API validation |
| Encryption | AES-256-GCM | All stored data encrypted at rest |

### 1.5 Monthly Cost

| Item | Cost |
|------|------|
| VPS (1 vCPU, 1GB RAM, Thai DC) | ~150-250 บ/เดือน |
| Vercel (Hobby) | ฟรี |
| Cloudflare R2 (10GB) | ฟรี |
| LINE Messaging API (500 msg) | ฟรี |
| Domain (natgan.com) | ~400 บ/ปี |
| **รวม** | **~200-300 บ/เดือน** |

---

## 2. Phase Development Plan

### 2.1 Sprint Overview (10 Weeks)

```
Week 01-02: Foundation     ████████░░░░░░░░░░░░  20%
Week 03-04: Trip Builder   ████████████████░░░░  40%
Week 05-06: Guest & Share  ████████████████████  60%
Week 07-08: Notification   ██████████████████████████  80%
Week 09-10: Polish & Ship  ██████████████████████████████  100%
```

### 2.2 Phase Details

#### Phase 1 — Foundation (Week 1-2)

| Task | Details | Deliverable |
|------|---------|-------------|
| Project Setup | Next.js 15, Tailwind v4, Drizzle, Auth.js | Repo + CI/CD |
| Database | PostgreSQL Docker, Drizzle schema, migrations | 8 tables ready |
| Auth System | Register, Login, JWT, session middleware | /login, /register working |
| Company Profile | CRUD company info, logo upload to R2 | /dashboard/profile |
| API Foundation | Error handling, Zod validation, rate limiting | Middleware stack |

**Definition of Done:** สมัครสมาชิก → ล็อกอิน → แก้ไขโปรไฟล์บริษัท → อัปโหลดโลโก้ได้

---

#### Phase 2 — Trip Builder (Week 3-4)

| Task | Details | Deliverable |
|------|---------|-------------|
| Trip CRUD | Create/Read/Update/Delete trips | /dashboard/trips |
| Day Management | Add/Edit/Delete/Reorder days | Day tabs with drag |
| Activity Management | Add/Edit/Delete/Reorder activities | Activity editor |
| Image Upload | Cover images for trips, days | R2 upload pipeline |
| Auto-save | Draft auto-save every 30s | Unsaved indicator |
| JSONB Fields | Airline info, accommodations, emergency contacts | Collapsible editors |

**Definition of Done:** สร้างทริป → เพิ่มวัน/กิจกรรม → ลากจัดลำดับ → บันทึกร่าง → ดูตัวอย่าง

---

#### Phase 3 — Guest View & Share (Week 5-6)

| Task | Details | Deliverable |
|------|---------|-------------|
| Publish Flow | Generate slug, set status | /publish page |
| Guest View (SSR) | Public trip page, mobile-first | /t/{slug} |
| Immigration View | Passport-friendly version | /t/{slug}/imm |
| QR Code | Generate + download QR with logo | QR component |
| Share Template | Copy URL, LINE share message | Share buttons |
| View Counter | Increment on guest visit | Analytics display |

**Definition of Done:** Publish ทริป → แชร์ลิงก์/QR → ลูกทัวร์เปิดดู → มี view count

---

#### Phase 4 — Notification Engine (Week 7-8)

| Task | Details | Deliverable |
|------|---------|-------------|
| Change Detection | Diff old vs new on trip edit | noti_change_logs |
| LINE Messaging API | Webhook, Add Friend flow | Follow via LINE |
| Web Push | VAPID, subscription, push | Follow via browser |
| Follow System | Follow/Unfollow per trip | Follower management |
| Notification Dispatch | Send to LINE + Web Push | /api/notify/send |
| Acknowledge System | Read receipts per change | ack tracking |
| Read Receipt Dashboard | Who read/didn't read | /receipts page |

**Definition of Done:** แก้ไขทริป → ระบบ detect การเปลี่ยนแปลง → ส่ง LINE/Push → ลูกทัวร์กด "รับทราบ" → ทัวร์ลีดเดอร์ดู read receipt

---

#### Phase 5 — Polish & Launch (Week 9-10)

| Task | Details | Deliverable |
|------|---------|-------------|
| Usage & Limits | Free tier limits, upgrade prompts | /dashboard/usage |
| Error States | Empty states, loading, 404, offline | UX polish |
| SEO | Meta tags, OG images for shared links | Social previews |
| Performance | Image optimization, lazy load, caching | Lighthouse 90+ |
| Security Audit | OWASP checklist, penetration test | Security report |
| Beta Launch | 1-5 pilot companies | Live system |

**Definition of Done:** ระบบพร้อมใช้งานจริง, ไม่มี critical bugs, 5 บริษัทนำร่องเข้าใช้

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
mst_companies ─────────┬──────────────── mst_users
     │ (1)              │ (1:Many)            │
     │                  │                     │
     └──── (1:Many) ────┤                     │
                        │                     │
                   trip_plans ────────────────┘ (changed_by)
                     │ (1)
                     │
          ┌──────────┼──────────┐
          │          │          │
     (1:Many)   (1:Many)   (1:Many)
          │          │          │
     trip_days  noti_followers  noti_change_logs
       │ (1)        │               │ (1)
       │            │               │
    (1:Many)        │          (1:Many)
       │            │               │
  trip_activities   └───── noti_acknowledgements
```

### 3.2 Table Definitions

#### Naming Convention
- **Prefix `mst_`** = Master data (companies, users)
- **Prefix `trip_`** = Trip-related data (plans, days, activities)
- **Prefix `noti_`** = Notification-related data (followers, changelogs, acks)

---

#### 3.2.1 mst_companies

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| name | text | NOT NULL | ชื่อบริษัท/ไกด์ |
| logo_url | text | nullable | URL โลโก้ (R2) |
| phone | text | nullable | เบอร์ติดต่อ |
| line_id | text | nullable | LINE ID |
| facebook | text | nullable | Facebook URL |
| instagram | text | nullable | Instagram URL |
| website | text | nullable | เว็บไซต์ |
| tat_license | text | nullable | ใบอนุญาต ททท. |
| tier | subscription_tier | default 'free' | แพ็กเกจ: free/pro/business |
| created_at | timestamptz | default now() | วันสร้าง |
| updated_at | timestamptz | default now() | วันแก้ไขล่าสุด |

**Indexes:** PK(id)

---

#### 3.2.2 mst_users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| company_id | uuid | FK → mst_companies(id) ON DELETE SET NULL | บริษัทที่สังกัด |
| email | text | UNIQUE, NOT NULL | อีเมลล็อกอิน |
| password_hash | text | NOT NULL | รหัสผ่าน (bcrypt) |
| name | text | nullable | ชื่อแสดง |
| role | user_role | default 'owner' | บทบาท: owner/editor |
| created_at | timestamptz | default now() | วันสร้าง |

**Indexes:** PK(id), UNIQUE(email), FK(company_id)

---

#### 3.2.3 trip_plans

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| company_id | uuid | FK → mst_companies(id) ON DELETE CASCADE | บริษัทเจ้าของทริป |
| title | text | NOT NULL | ชื่อทริป |
| slug | text | UNIQUE, NOT NULL | URL slug สำหรับ guest view |
| destination | text | nullable | ประเทศ/ภูมิภาค |
| start_date | date | nullable | วันออกเดินทาง |
| end_date | date | nullable | วันกลับ |
| cover_image_url | text | nullable | ภาพปก |
| travelers_count | integer | default 0 | จำนวนผู้เดินทาง |
| language | text | default 'th' | ภาษาหลัก: th/en/ja |
| airline_info | jsonb | default '[]' | ข้อมูลสายการบิน |
| accommodations | jsonb | default '[]' | ข้อมูลที่พัก |
| emergency_contacts | jsonb | default '[]' | เบอร์ฉุกเฉิน |
| notes | text | nullable | หมายเหตุทริป |
| status | trip_status | default 'draft' | สถานะ: draft/published/unpublished |
| edit_count | integer | default 0 | จำนวนครั้งที่แก้ไข |
| view_count | integer | default 0 | จำนวนครั้งที่ดู |
| published_at | timestamptz | nullable | วันที่ publish |
| created_at | timestamptz | default now() | วันสร้าง |
| updated_at | timestamptz | default now() | วันแก้ไขล่าสุด |

**Indexes:** PK(id), UNIQUE(slug), INDEX(company_id), INDEX(status)

**JSONB: airline_info**
```json
[
  {
    "airline": "Xiamen Air",
    "flight_number": "MF834",
    "departure_time": "17:40",
    "arrival_time": "22:05",
    "departure_airport": "BKK",
    "arrival_airport": "XMN",
    "type": "departure"
  }
]
```

**JSONB: accommodations**
```json
[
  {
    "name": "The QUBE Hotel Chiba",
    "address": "1-2-3 Chiba, Japan",
    "phone": "+81-XX-XXXX-XXXX",
    "check_in": "15:00",
    "check_out": "11:00",
    "nights": 5
  }
]
```

**JSONB: emergency_contacts**
```json
[
  {
    "name": "สถานทูตไทย โตเกียว",
    "phone": "+81-3-2207-9100",
    "icon": "🏥",
    "sort_order": 1
  }
]
```

---

#### 3.2.4 trip_days

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| trip_id | uuid | FK → trip_plans(id) ON DELETE CASCADE | ทริปต้นสังกัด |
| day_number | integer | NOT NULL | ลำดับวัน (1-indexed) |
| title | text | nullable | ชื่อวัน |
| subtitle | text | nullable | คำบรรยาย/อิโมจิ |
| cover_image_url | text | nullable | ภาพปกวัน |
| date | date | nullable | วันที่จริง |
| sort_order | integer | default 0 | ลำดับ (สำหรับ drag-reorder) |
| created_at | timestamptz | default now() | วันสร้าง |

**Indexes:** PK(id), FK(trip_id), INDEX(trip_id, day_number)

---

#### 3.2.5 trip_activities

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| day_id | uuid | FK → trip_days(id) ON DELETE CASCADE | วันต้นสังกัด |
| time | time | nullable | เวลาเริ่ม (HH:MM) |
| name | text | NOT NULL | ชื่อกิจกรรม/สถานที่ |
| description | text | nullable | รายละเอียด |
| type | activity_type | default 'attraction' | ประเภท |
| place_name | text | nullable | ชื่อสถานที่ (สำหรับ maps) |
| lat | decimal(10,7) | nullable | ละติจูด |
| lng | decimal(10,7) | nullable | ลองจิจูด |
| maps_link | text | nullable | Google Maps URL |
| image_url | text | nullable | รูปภาพกิจกรรม |
| emoji | text | default '📍' | ไอคอน |
| sort_order | integer | default 0 | ลำดับภายในวัน |
| created_at | timestamptz | default now() | วันสร้าง |
| updated_at | timestamptz | default now() | วันแก้ไขล่าสุด |

**Indexes:** PK(id), FK(day_id), INDEX(day_id, sort_order)

**Enum activity_type:** `attraction` | `restaurant` | `hotel` | `transport` | `shopping` | `other`

---

#### 3.2.6 noti_followers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| trip_id | uuid | FK → trip_plans(id) ON DELETE CASCADE | ทริปที่ติดตาม |
| display_name | text | NOT NULL, default 'Guest' | ชื่อเล่น |
| channel | follow_channel | NOT NULL | ช่องทาง: line/web_push |
| line_user_id | text | nullable | LINE User ID |
| web_push_subscription | jsonb | nullable | Web Push subscription |
| followed_at | timestamptz | default now() | วันที่ follow |

**Indexes:** PK(id), FK(trip_id), INDEX(trip_id)

---

#### 3.2.7 noti_change_logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| trip_id | uuid | FK → trip_plans(id) ON DELETE CASCADE | ทริปที่เปลี่ยนแปลง |
| changed_by | uuid | FK → mst_users(id) nullable | ผู้แก้ไข |
| changes | jsonb | NOT NULL | รายละเอียดการเปลี่ยนแปลง |
| summary_text | text | NOT NULL | สรุปเป็นภาษาคน |
| noti_sent | boolean | default false | ส่งแจ้งเตือนแล้วหรือยัง |
| noti_sent_at | timestamptz | nullable | เวลาที่ส่ง |
| created_at | timestamptz | default now() | เวลาที่ตรวจพบ |

**Indexes:** PK(id), FK(trip_id), INDEX(trip_id, created_at DESC)

**JSONB: changes**
```json
[
  {
    "type": "update",
    "entity": "activity",
    "day_number": 2,
    "field": "time",
    "old_value": "08:30",
    "new_value": "09:00",
    "description": "เปลี่ยนเวลา teamLab: 08:30 → 09:00"
  },
  {
    "type": "add",
    "entity": "activity",
    "day_number": 2,
    "description": "เพิ่มกิจกรรม: 'แวะ 7-Eleven' เวลา 08:00"
  },
  {
    "type": "delete",
    "entity": "activity",
    "day_number": 3,
    "description": "ยกเลิกกิจกรรม: 'ตลาดวโรรส' (ปิดปรับปรุง)"
  }
]
```

---

#### 3.2.8 noti_acknowledgements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Primary key |
| changelog_id | uuid | FK → noti_change_logs(id) ON DELETE CASCADE | การเปลี่ยนแปลงที่รับทราบ |
| follower_id | uuid | FK → noti_followers(id) ON DELETE CASCADE | ผู้ที่รับทราบ |
| acknowledged_at | timestamptz | default now() | เวลาที่กดรับทราบ |

**Indexes:** PK(id), FK(changelog_id), FK(follower_id), UNIQUE(changelog_id, follower_id)

---

### 3.3 Enums

```sql
CREATE TYPE trip_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE activity_type AS ENUM ('attraction', 'restaurant', 'hotel', 'transport', 'shopping', 'other');
CREATE TYPE follow_channel AS ENUM ('line', 'web_push');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'business');
CREATE TYPE user_role AS ENUM ('owner', 'editor');
```

### 3.4 Drizzle Schema (TypeScript)

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, integer, boolean, date, time,
         decimal, timestamp, jsonb, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';

// Enums
export const tripStatusEnum = pgEnum('trip_status', ['draft', 'published', 'unpublished']);
export const activityTypeEnum = pgEnum('activity_type', ['attraction', 'restaurant', 'hotel', 'transport', 'shopping', 'other']);
export const followChannelEnum = pgEnum('follow_channel', ['line', 'web_push']);
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'business']);
export const userRoleEnum = pgEnum('user_role', ['owner', 'editor']);

// Tables
export const mstCompanies = pgTable('mst_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  phone: text('phone'),
  lineId: text('line_id'),
  facebook: text('facebook'),
  instagram: text('instagram'),
  website: text('website'),
  tatLicense: text('tat_license'),
  tier: subscriptionTierEnum('tier').default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const mstUsers = pgTable('mst_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => mstCompanies.id, { onDelete: 'set null' }),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: userRoleEnum('role').default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tripPlans = pgTable('trip_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => mstCompanies.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').unique().notNull(),
  destination: text('destination'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  coverImageUrl: text('cover_image_url'),
  travelersCount: integer('travelers_count').default(0),
  language: text('language').default('th'),
  airlineInfo: jsonb('airline_info').default([]),
  accommodations: jsonb('accommodations').default([]),
  emergencyContacts: jsonb('emergency_contacts').default([]),
  notes: text('notes'),
  status: tripStatusEnum('status').default('draft'),
  editCount: integer('edit_count').default(0),
  viewCount: integer('view_count').default(0),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const tripDays = pgTable('trip_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').references(() => tripPlans.id, { onDelete: 'cascade' }).notNull(),
  dayNumber: integer('day_number').notNull(),
  title: text('title'),
  subtitle: text('subtitle'),
  coverImageUrl: text('cover_image_url'),
  date: date('date'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tripActivities = pgTable('trip_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayId: uuid('day_id').references(() => tripDays.id, { onDelete: 'cascade' }).notNull(),
  time: time('time'),
  name: text('name').notNull(),
  description: text('description'),
  type: activityTypeEnum('type').default('attraction'),
  placeName: text('place_name'),
  lat: decimal('lat', { precision: 10, scale: 7 }),
  lng: decimal('lng', { precision: 10, scale: 7 }),
  mapsLink: text('maps_link'),
  imageUrl: text('image_url'),
  emoji: text('emoji').default('📍'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const notiFollowers = pgTable('noti_followers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').references(() => tripPlans.id, { onDelete: 'cascade' }).notNull(),
  displayName: text('display_name').notNull().default('Guest'),
  channel: followChannelEnum('channel').notNull(),
  lineUserId: text('line_user_id'),
  webPushSubscription: jsonb('web_push_subscription'),
  followedAt: timestamp('followed_at', { withTimezone: true }).defaultNow(),
});

export const notiChangeLogs = pgTable('noti_change_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').references(() => tripPlans.id, { onDelete: 'cascade' }).notNull(),
  changedBy: uuid('changed_by').references(() => mstUsers.id),
  changes: jsonb('changes').notNull(),
  summaryText: text('summary_text').notNull(),
  notiSent: boolean('noti_sent').default(false),
  notiSentAt: timestamp('noti_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notiAcknowledgements = pgTable('noti_acknowledgements', {
  id: uuid('id').primaryKey().defaultRandom(),
  changelogId: uuid('changelog_id').references(() => notiChangeLogs.id, { onDelete: 'cascade' }).notNull(),
  followerId: uuid('follower_id').references(() => notiFollowers.id, { onDelete: 'cascade' }).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueAck: uniqueIndex('unique_ack').on(table.changelogId, table.followerId),
}));
```

---

## 4. API Design

### 4.1 Base URL & Convention

```
Base URL: https://natgan.com/api
Content-Type: application/json
Auth: Bearer JWT via httpOnly cookie (next-auth.session-token)
```

### 4.2 Complete API Catalog

#### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | - | สมัครสมาชิก |
| POST | `/api/auth/login` | - | ล็อกอิน |
| POST | `/api/auth/logout` | JWT | ล็อกเอาท์ |
| GET | `/api/auth/session` | JWT | ดึง session ปัจจุบัน |
| POST | `/api/auth/refresh` | JWT | ต่ออายุ token |

**POST /api/auth/register**
```json
// Request
{ "email": "admin@amazingtour.com", "password": "SecureP@ss123", "company_name": "Amazing Tour Co." }

// Response 201
{ "user": { "id": "uuid", "email": "...", "name": null, "role": "owner" },
  "company": { "id": "uuid", "name": "Amazing Tour Co.", "tier": "free" } }
```

**POST /api/auth/login**
```json
// Request
{ "email": "admin@amazingtour.com", "password": "SecureP@ss123" }

// Response 200 — Sets httpOnly cookie: next-auth.session-token
{ "user": { "id": "uuid", "email": "...", "name": "...", "role": "owner" },
  "company": { "id": "uuid", "name": "Amazing Tour Co.", "tier": "free" } }
```

---

#### 🏢 Company Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/company/me` | JWT | ดึงข้อมูลบริษัท |
| PUT | `/api/company/me` | JWT | แก้ไขข้อมูลบริษัท |
| POST | `/api/company/me/logo` | JWT | อัปโหลดโลโก้ |

---

#### ✈️ Trips CRUD

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips` | JWT | รายการทริปของบริษัท |
| POST | `/api/trips` | JWT | สร้างทริปใหม่ (auto-generate days) |
| GET | `/api/trips/:id` | JWT | ดึงรายละเอียดทริป |
| PUT | `/api/trips/:id` | JWT | แก้ไขทริป + สร้าง change log |
| DELETE | `/api/trips/:id` | JWT | ลบทริป (draft only) |
| POST | `/api/trips/:id/publish` | JWT | เผยแพร่ทริป |
| POST | `/api/trips/:id/unpublish` | JWT | ยกเลิกเผยแพร่ |

**POST /api/trips** — สร้างทริปใหม่
```json
// Request
{
  "title": "Tokyo Winter Trip 2026",
  "destination": "Japan",
  "start_date": "2026-04-15",
  "end_date": "2026-04-22",
  "travelers_count": 25,
  "language": "th",
  "airline_info": [{ "airline": "Xiamen Air", "flight_number": "MF834", ... }],
  "accommodations": [{ "name": "The QUBE Hotel Chiba", ... }]
}

// Response 201 — Auto-generates 8 days from date range
{
  "id": "uuid",
  "title": "Tokyo Winter Trip 2026",
  "slug": "tokyo-winter-trip-2026",
  "status": "draft",
  "days": [
    { "id": "uuid", "day_number": 1, "date": "2026-04-15", "activities": [] },
    { "id": "uuid", "day_number": 2, "date": "2026-04-16", "activities": [] },
    ...
  ]
}
```

**POST /api/trips/:id/publish**
```json
// Request
{ "slug": "tokyo-winter-2026" }  // optional custom slug

// Response 200
{
  "id": "uuid",
  "slug": "tokyo-winter-2026",
  "url": "https://natgan.com/t/tokyo-winter-2026",
  "qr_code": "data:image/png;base64,..."
}
```

---

#### 📅 Days Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:tripId/days` | JWT | ดึงวันทั้งหมด |
| POST | `/api/trips/:tripId/days` | JWT | เพิ่มวัน |
| PUT | `/api/trips/:tripId/days/:dayId` | JWT | แก้ไขวัน |
| DELETE | `/api/trips/:tripId/days/:dayId` | JWT | ลบวัน |
| PUT | `/api/trips/:tripId/days/reorder` | JWT | จัดลำดับวันใหม่ |

---

#### 📌 Activities Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/trips/:dayId/activities` | JWT | เพิ่มกิจกรรม |
| PUT | `/api/trips/:dayId/activities/:actId` | JWT | แก้ไขกิจกรรม |
| DELETE | `/api/trips/:dayId/activities/:actId` | JWT | ลบกิจกรรม |
| PUT | `/api/trips/:dayId/activities/reorder` | JWT | จัดลำดับกิจกรรม |

**POST /api/trips/:dayId/activities**
```json
// Request
{
  "time": "13:00",
  "name": "teamLab Planets",
  "description": "Digital art museum",
  "type": "attraction",
  "place_name": "teamLab Planets Tokyo",
  "lat": 35.6729,
  "lng": 139.7447,
  "emoji": "🎨"
}

// Response 201
{ "id": "uuid", "day_id": "uuid", "time": "13:00", "name": "teamLab Planets", ... }
```

---

#### 👥 Followers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:tripId/followers` | JWT | ดูรายชื่อ follower |
| GET | `/api/trips/:tripId/followers/:changelogId` | JWT | ดูสถานะ ack ต่อ change |

---

#### 📋 Change Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:tripId/changelog` | JWT | ประวัติการเปลี่ยนแปลง |
| GET | `/api/trips/:tripId/changelog/:id/ack` | JWT | สถานะรับทราบ |

---

#### 📊 Trip Stats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trips/:tripId/stats` | JWT | สถิติ: views, followers, ack rate |

---

#### 🌐 Public / Guest Access (ไม่ต้อง login)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/t/:slug` | - | ดูทริป (guest view) |
| GET | `/api/public/t/:slug/imm` | - | ดูทริป (immigration view) |
| POST | `/api/public/t/:slug/view` | - | นับ view count |

---

#### 🔔 Follow / Subscribe (ไม่ต้อง login)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/follow/line/webhook` | Signature | LINE Messaging API webhook |
| POST | `/api/follow/web-push/subscribe` | - | สมัคร Web Push |
| DELETE | `/api/follow/:followerId/unfollow` | - | ยกเลิกติดตาม |

---

#### ✅ Acknowledge (ไม่ต้อง login)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/acknowledge/:changelogId` | - | กดรับทราบ |

---

#### 📤 Notification Dispatch

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/notify/send/:changelogId` | JWT | ส่งแจ้งเตือนทุก follower |
| POST | `/api/notify/resend/:changelogId` | JWT | ส่งซ้ำเฉพาะคนที่ยังไม่อ่าน |

---

#### 🖼 Image Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | JWT | อัปโหลดรูปไป R2 |

**Bucket Paths:**
- `company-logos/{company_id}/logo.{ext}`
- `trip-covers/{trip_id}/cover.{ext}`
- `day-covers/{day_id}/cover.{ext}`

**Constraints:** Logo max 2MB, Covers max 5MB, Types: jpg/png/webp

---

#### 🏥 Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | - | ตรวจสอบสถานะระบบ |

---

### 4.3 Response Status Codes

| Code | Meaning | เมื่อไหร่ |
|------|---------|----------|
| 200 | OK | สำเร็จ |
| 201 | Created | สร้างสำเร็จ |
| 204 | No Content | ลบสำเร็จ |
| 400 | Bad Request | Zod validation failed |
| 401 | Unauthorized | ไม่มี JWT หรือ JWT หมดอายุ |
| 403 | Forbidden | ไม่มีสิทธิ์ (ไม่ใช่ owner ของ resource) |
| 404 | Not Found | ไม่พบ หรือ trip unpublished |
| 409 | Conflict | ซ้ำ (เช่น duplicate slug) |
| 429 | Too Many Requests | Rate limit เกิน |
| 500 | Server Error | Internal error |

### 4.4 Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

---

## 5. Frontend Page Structure

### 5.1 Page Map (13 screens)

```
/                          → Landing page (marketing)
/register                  → สมัครสมาชิก (A1)
/login                     → ล็อกอิน (A2)
/dashboard                 → รายการทริป (A3)
/dashboard/profile         → โปรไฟล์บริษัท (A4)
/dashboard/trips/new       → สร้างทริป Step 1 (A5)
/dashboard/trips/[id]/edit → แก้ไขวัน/กิจกรรม (A6)
/dashboard/trips/[id]/preview → ดูตัวอย่าง (A7)
/dashboard/trips/[id]/publish → Publish & Share (A8)
/dashboard/trips/[id]/receipts → Read Receipt (A9)
/dashboard/usage           → Usage & Limits (A10)
/t/[slug]                  → Guest View (G1)
/t/[slug]/imm              → Immigration View (G2)
```

### 5.2 Page Details

#### A1: Register (`/register`) — Public

| Element | Type | Action |
|---------|------|--------|
| Email field | input | - |
| Password field | input | - |
| Company name field | input | - |
| Terms checkbox | checkbox | - |
| **[สมัครสมาชิก]** | button | `POST /api/auth/register` → redirect `/dashboard` |
| Link "มีบัญชีแล้ว? เข้าสู่ระบบ" | link | navigate `/login` |

---

#### A2: Login (`/login`) — Public

| Element | Type | Action |
|---------|------|--------|
| Email field | input | - |
| Password field | input | - |
| **[เข้าสู่ระบบ]** | button | `POST /api/auth/login` → redirect `/dashboard` |
| Link "ยังไม่มีบัญชี? สมัครเลย" | link | navigate `/register` |

---

#### A3: Dashboard (`/dashboard`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| **[+ สร้างทริปแรก]** | button (CTA) | navigate `/dashboard/trips/new` |
| Trip card (each) | card | navigate `/dashboard/trips/[id]/edit` |
| Status badge | badge | display only |
| Follower count | text | display only |
| View count | text | display only |
| **[⚙️ ตั้งค่า]** | button | navigate `/dashboard/profile` |
| **[🚪 ออกจากระบบ]** | button | `POST /api/auth/logout` → redirect `/login` |

**Data:** `GET /api/trips` on mount

---

#### A4: Company Profile (`/dashboard/profile`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Company name | input | - |
| Logo upload | file input / drag-drop | `POST /api/company/me/logo` |
| Phone | input | - |
| LINE ID | input | - |
| Facebook | input | - |
| Instagram | input | - |
| Website | input | - |
| TAT License | input | - |
| Tier display | badge | display only |
| **[บันทึก]** | button | `PUT /api/company/me` |

**Data:** `GET /api/company/me` on mount

---

#### A5: Trip Builder Step 1 (`/dashboard/trips/new`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Cover image | file input / preset picker | client-side resize → hold |
| Trip title | input | - |
| Destination | dropdown | - |
| Start date | date picker | - |
| End date | date picker | - |
| Traveler count | number input | - |
| Language | select (TH/EN/JP) | - |
| Airline info | collapsible section | - |
| [+ เพิ่มเที่ยวบิน] | button | add airline row |
| Accommodation info | collapsible section | - |
| [+ เพิ่มที่พัก] | button | add accommodation row |
| **[ถัดไป]** | button | `POST /api/trips` + `POST /api/upload/image` → redirect `/dashboard/trips/[id]/edit` |

---

#### A6: Trip Builder Step 2 — Edit (`/dashboard/trips/[id]/edit`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Day tab (each) | tab / drag | select day; drag to reorder → `PUT /api/trips/:tripId/days/reorder` |
| **[+ วัน]** | button | `POST /api/trips/:tripId/days` |
| Day title | input | auto-save → `PUT /api/trips/:tripId/days/:dayId` |
| Day subtitle | input | auto-save |
| Day cover image | file input | `POST /api/upload/image` + `PUT /api/trips/:tripId/days/:dayId` |
| Activity card (each) | card / drag | drag to reorder → `PUT /api/trips/:dayId/activities/reorder` |
| Activity time | time picker | auto-save → `PUT /api/trips/:dayId/activities/:actId` |
| Activity name | input | auto-save |
| Activity emoji | picker | auto-save |
| Activity description | textarea | auto-save |
| Activity place | input (autocomplete) | auto-save + generate maps_link |
| Activity image | file input | `POST /api/upload/image` + update activity |
| **[🗑 ลบกิจกรรม]** | button | `DELETE /api/trips/:dayId/activities/:actId` |
| **[+ เพิ่มกิจกรรม]** | button | `POST /api/trips/:dayId/activities` |
| Emergency contacts | input section | update via trip JSONB |
| Notes | textarea | update via trip |
| **[← กลับ]** | button | navigate back |
| **[👁 ดูตัวอย่าง]** | button | navigate `/dashboard/trips/[id]/preview` |

**Data:** `GET /api/trips/:id` on mount (full trip with days + activities)
**Auto-save:** Debounce 30s, PATCH individual fields

---

#### A7: Preview (`/dashboard/trips/[id]/preview`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Mobile frame | container | shows Guest View simulation |
| **[← แก้ไข]** | button | navigate `/dashboard/trips/[id]/edit` |
| **[🚀 เผยแพร่]** | button | `POST /api/trips/:id/publish` → redirect `/dashboard/trips/[id]/publish` |

---

#### A8: Publish & Share (`/dashboard/trips/[id]/publish`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| ✅ Published message | display | - |
| URL display | text | `natgan.com/t/{slug}` |
| **[✏️ แก้ slug]** | button | inline edit → `PUT /api/trips/:id` |
| **[📋 Copy URL]** | button | clipboard copy |
| QR Code | image | auto-generated |
| **[📥 Download QR]** | button | download PNG |
| **[📥 Download QR + Logo]** | button | download PNG with company logo |
| Share message | textarea | pre-filled template |
| **[📋 Copy Message]** | button | clipboard copy |
| **[← กลับ Dashboard]** | button | navigate `/dashboard` |

---

#### A9: Read Receipt Dashboard (`/dashboard/trips/[id]/receipts`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Change list | list (desc by date) | display changes with ack status |
| Each change: summary | text | display |
| Each change: ack count | badge | "15/30 รับทราบแล้ว" |
| Each change: ✅ list | accordion | names + timestamps |
| Each change: ❌ list | accordion | names (pending) |
| **[🔄 ส่งซ้ำ]** | button | `POST /api/notify/resend/:changelogId` |

**Data:** `GET /api/trips/:tripId/changelog` + `GET /api/trips/:tripId/followers/:changelogId`

---

#### A10: Usage & Limits (`/dashboard/usage`) — Auth Required

| Element | Type | Action |
|---------|------|--------|
| Current tier | badge | display |
| Trip slots | progress bar | "2/3 ทริปที่ใช้งาน" |
| Edit count | counter | per trip |
| LINE message usage | counter | monthly |
| **[อัปเกรด]** | button | navigate to pricing (Phase 2) |

---

#### G1: Guest View (`/t/[slug]`) — Public, SSR

| Element | Type | Action |
|---------|------|--------|
| Company header | display | logo + name + contacts |
| Trip cover image | image | display |
| Trip title + dates | text | display |
| Day navigation | tabs / scroll | select day |
| Activity timeline | list | display with emoji, time, map link |
| Map link per activity | link | open Google Maps |
| Airline info | collapsible | display |
| Accommodation info | collapsible | display |
| Emergency contacts | collapsible | display |
| Notes | text | display |
| **[🔔 ติดตามทริปนี้]** | button | open Follow Modal |
| Follow Modal: LINE | button | redirect to LINE Add Friend |
| Follow Modal: Web Push | button | request push permission → `POST /api/follow/web-push/subscribe` |
| Pending change banner | banner | "มีการเปลี่ยนแปลง" + **[รับทราบ]** → `POST /api/acknowledge/:changelogId` |

**Data:** `GET /api/public/t/:slug` (SSR) + `POST /api/public/t/:slug/view`

---

#### G2: Immigration View (`/t/[slug]/imm`) — Public, SSR

| Element | Type | Action |
|---------|------|--------|
| Passport-friendly layout | display | minimal, black/white optimized |
| Trip title + dates | text | large font |
| Hotel names + addresses | list | full address, no truncation |
| Flight numbers + times | list | departure/arrival |
| Emergency contacts | list | phone numbers prominent |
| **[🖨 พิมพ์]** | button | `window.print()` |

**Data:** `GET /api/public/t/:slug/imm`

---

## 6. API & Frontend Interaction Map

### 6.1 Button → API Mapping (Complete)

```
┌─────────────────────────────────────────────────────────────────┐
│  BUTTON / ACTION                     API ENDPOINT               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── AUTHENTICATION ──                                           │
│  [สมัครสมาชิก]                       POST /api/auth/register    │
│  [เข้าสู่ระบบ]                       POST /api/auth/login       │
│  [ออกจากระบบ]                       POST /api/auth/logout      │
│  Page load (auth pages)              GET  /api/auth/session     │
│                                                                 │
│  ── COMPANY ──                                                  │
│  Page load (profile)                 GET  /api/company/me       │
│  [บันทึก] (profile)                  PUT  /api/company/me       │
│  Logo drag-drop                      POST /api/company/me/logo  │
│                                                                 │
│  ── TRIPS ──                                                    │
│  Page load (dashboard)               GET  /api/trips            │
│  [+ สร้างทริป] → [ถัดไป]             POST /api/trips            │
│  Page load (edit/preview)            GET  /api/trips/:id        │
│  Auto-save (edit)                    PUT  /api/trips/:id        │
│  [🗑 ลบทริป]                        DELETE /api/trips/:id      │
│  [🚀 เผยแพร่]                       POST /api/trips/:id/publish│
│  [ยกเลิกเผยแพร่]                    POST /api/trips/:id/unpub  │
│                                                                 │
│  ── DAYS ──                                                     │
│  [+ วัน]                             POST /api/trips/:t/days    │
│  Auto-save (day fields)              PUT  /api/trips/:t/days/:d │
│  [🗑 ลบวัน]                         DELETE /api/trips/:t/days/:d│
│  Drag reorder (day tabs)             PUT  /api/trips/:t/days/re │
│                                                                 │
│  ── ACTIVITIES ──                                               │
│  [+ เพิ่มกิจกรรม]                    POST /api/trips/:d/act     │
│  Auto-save (activity fields)         PUT  /api/trips/:d/act/:a  │
│  [🗑 ลบกิจกรรม]                     DELETE /api/trips/:d/act/:a│
│  Drag reorder (activities)           PUT  /api/trips/:d/act/re  │
│                                                                 │
│  ── IMAGES ──                                                   │
│  Any image upload                    POST /api/upload/image     │
│                                                                 │
│  ── PUBLIC / GUEST ──                                           │
│  Page load (/t/slug)                 GET  /api/public/t/:slug   │
│  Page load (imm)                     GET  /api/public/t/:s/imm  │
│  Auto (on visit)                     POST /api/public/t/:s/view │
│                                                                 │
│  ── FOLLOW / SUBSCRIBE ──                                       │
│  LINE Add Friend → webhook           POST /api/follow/line/wh   │
│  [🔔 Web Push]                       POST /api/follow/web-push  │
│  [ยกเลิกติดตาม]                     DELETE /api/follow/:f/un   │
│                                                                 │
│  ── NOTIFICATIONS ──                                            │
│  Auto (after trip edit save)         POST /api/notify/send/:c   │
│  [🔄 ส่งซ้ำ]                        POST /api/notify/resend/:c │
│                                                                 │
│  ── ACKNOWLEDGE ──                                              │
│  [✅ รับทราบ]                        POST /api/acknowledge/:c   │
│                                                                 │
│  ── ANALYTICS ──                                                │
│  Page load (receipts)                GET  /api/trips/:t/changelog│
│  Page load (receipts detail)         GET  /api/trips/:t/foll/:c │
│  Page load (stats)                   GET  /api/trips/:t/stats   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Flow Sequences

#### 6.2.1 Create Trip Flow

```
User: Fill form → [ถัดไป]
  │
  ├─ 1. POST /api/upload/image (cover image, if any)
  │     → returns { url: "https://cdn.natgan.com/trip-covers/..." }
  │
  ├─ 2. POST /api/trips
  │     → body: { title, destination, start_date, end_date, cover_image_url, ... }
  │     → server: auto-creates N days from date range
  │     → returns: trip object with empty days[]
  │
  └─ 3. Redirect → /dashboard/trips/[id]/edit
```

#### 6.2.2 Edit & Notify Flow

```
User: Edit activity time 08:30 → 09:00
  │
  ├─ 1. PUT /api/trips/:dayId/activities/:actId
  │     → body: { time: "09:00" }
  │     → server: update + increment edit_count + create noti_change_logs entry
  │     → returns: updated activity
  │
  ├─ 2. (Automatic) POST /api/notify/send/:changelogId
  │     → server: query noti_followers WHERE trip_id
  │     → for each LINE follower: LINE Messaging API push message
  │     → for each Web Push follower: web-push notification
  │     → returns: { sent: { line: 18, web_push: 12 } }
  │
  └─ 3. Follower receives notification
        │
        ├─ LINE: Tap link → /t/slug → see changes → [รับทราบ]
        │     → POST /api/acknowledge/:changelogId { line_user_id: "U..." }
        │
        └─ Web Push: Click notification → /t/slug → [รับทราบ]
              → POST /api/acknowledge/:changelogId { web_push_endpoint: "..." }
```

#### 6.2.3 Follow via LINE Flow

```
Guest View: [ติดตามทริปนี้] → [LINE]
  │
  ├─ 1. Redirect to LINE Add Friend URL
  │     → https://line.me/R/ti/p/@natgan-oa
  │     → User adds friend
  │
  ├─ 2. LINE Platform sends "follow" event to webhook
  │     → POST /api/follow/line/webhook
  │     → body: { events: [{ type: "follow", source: { userId: "U..." } }] }
  │     → server: verify LINE signature
  │     → server: create noti_followers entry
  │     → server: reply "สวัสดี! กำลังติดตามทริป: Tokyo Winter 2026"
  │
  └─ 3. Follower is now subscribed to trip changes
```

---

## 7. Security Architecture

### 7.1 OWASP Top 10 Checklist

| # | Threat | Mitigation | Implementation |
|---|--------|-----------|----------------|
| A01 | Broken Access Control | App-level auth via Drizzle middleware | ทุก query ต้อง filter `WHERE company_id = user.company_id` |
| A02 | Cryptographic Failures | AES-256-GCM encryption at rest | ข้อมูลทั้งหมดเข้ารหัสใน DB, TLS in transit |
| A03 | Injection | Parameterized queries via Drizzle ORM | ไม่มี raw SQL, Zod validates all input |
| A04 | Insecure Design | Principle of least privilege | Guest เห็นแค่ published trips, ไม่มี admin API |
| A05 | Security Misconfiguration | Hardened HTTP headers | CSP, X-Frame-Options, HSTS |
| A06 | Vulnerable Components | npm audit + Dependabot | Automated dependency updates |
| A07 | Auth Failures | Auth.js with bcrypt + JWT | Password min 8 chars, account lockout after 5 fails |
| A08 | Software Integrity | Vercel deployment, no custom build scripts | Signed deployments, env vars in Vercel |
| A09 | Logging Failures | Structured logging | Log auth events, API errors, rate limit hits |
| A10 | SSRF | No user-controlled URLs fetched server-side | Maps links generated, not fetched |

### 7.2 Authentication Security

```
┌──────────────────────────────────────────────────────────────┐
│                    AUTH FLOW                                  │
│                                                              │
│  Client                    Server                            │
│  ──────                    ──────                            │
│  POST /login               │                                │
│  {email, password}  ──────►│ 1. Zod validate                │
│                            │ 2. Find user by email           │
│                            │ 3. bcrypt.compare(password)     │
│                            │ 4. Generate JWT (exp: 7d)       │
│                            │ 5. Set httpOnly cookie          │
│  ◄──── 200 + Set-Cookie    │    (next-auth.session-token)    │
│                            │                                │
│  GET /api/trips             │                                │
│  Cookie: next-auth...──────►│ 1. Verify JWT signature        │
│                            │ 2. Check expiry                 │
│                            │ 3. Extract user.id, company_id  │
│                            │ 4. Query WHERE company_id =     │
│  ◄──── 200 {trips}        │                                │
│                            │                                │
│  (Token expired)           │                                │
│  POST /refresh      ──────►│ 1. Validate old JWT             │
│                            │ 2. Issue new JWT                │
│  ◄──── 200 + Set-Cookie    │ 3. Set new cookie              │
└──────────────────────────────────────────────────────────────┘
```

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "email": "admin@amazingtour.com",
  "name": "สมชาย",
  "role": "owner",
  "company_id": "company-uuid",
  "iat": 1710000000,
  "exp": 1710604800
}
```

**Cookie Configuration:**
```typescript
{
  name: "next-auth.session-token",
  httpOnly: true,
  secure: true,          // HTTPS only
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60  // 7 days
}
```

### 7.3 Rate Limiting

| Endpoint Group | Limit | Window | Action on Exceed |
|---------------|-------|--------|-----------------|
| `/api/auth/login` | 5 req | 15 min | 429 + 15 min lockout |
| `/api/auth/register` | 3 req | 1 hour | 429 + block IP |
| `/api/trips/*` (write) | 60 req | 1 min | 429 |
| `/api/trips/*` (read) | 120 req | 1 min | 429 |
| `/api/upload/image` | 20 req | 1 min | 429 |
| `/api/public/*` | 300 req | 1 min | 429 |
| `/api/follow/*` | 30 req | 1 min | 429 |
| `/api/notify/*` | 10 req | 1 min | 429 |
| `/api/acknowledge/*` | 60 req | 1 min | 429 |

**Implementation:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Alternative: in-memory rate limiting for self-host
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

### 7.4 Input Validation (Zod)

```typescript
// lib/validations/trip.ts
import { z } from 'zod';

export const createTripSchema = z.object({
  title: z.string().min(1).max(200),
  destination: z.string().max(100).optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  cover_image_url: z.string().url().optional(),
  travelers_count: z.number().int().min(0).max(999).optional(),
  language: z.enum(['th', 'en', 'ja']).default('th'),
  airline_info: z.array(z.object({
    airline: z.string().max(100),
    flight_number: z.string().max(20),
    departure_time: z.string(),
    arrival_time: z.string(),
    departure_airport: z.string().max(10),
    arrival_airport: z.string().max(10),
    type: z.enum(['departure', 'return', 'domestic']),
  })).optional(),
  accommodations: z.array(z.object({
    name: z.string().max(200),
    address: z.string().max(500).optional(),
    phone: z.string().max(50).optional(),
    check_in: z.string().optional(),
    check_out: z.string().optional(),
    nights: z.number().int().min(1).optional(),
  })).optional(),
});

export const createActivitySchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['attraction', 'restaurant', 'hotel', 'transport', 'shopping', 'other']).default('attraction'),
  place_name: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  emoji: z.string().max(10).default('📍'),
});
```

### 7.5 Encryption at Rest (AES-256-GCM)

```typescript
// lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(data: string): string {
  const [ivHex, authTagHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### 7.6 HTTP Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' https://cdn.natgan.com; script-src 'self' 'unsafe-inline'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### 7.7 LINE Webhook Signature Verification

```typescript
// lib/line.ts
import crypto from 'crypto';

export function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64');
  return hash === signature;
}
```

---

## 8. Permission Model

### 8.1 Role-Based Access Matrix

```
┌────────────────────────────────┬───────┬────────┬───────┬──────────┐
│ Action                         │ Owner │ Editor │ Guest │ No Auth  │
├────────────────────────────────┼───────┼────────┼───────┼──────────┤
│ Register                       │   -   │   -    │   -   │    ✅    │
│ Login                          │   -   │   -    │   -   │    ✅    │
│ View dashboard                 │  ✅   │   ✅   │   -   │    -     │
│ Create trip                    │  ✅   │   ✅   │   -   │    -     │
│ Edit trip                      │  ✅   │   ✅   │   -   │    -     │
│ Delete trip                    │  ✅   │   ❌   │   -   │    -     │
│ Publish/Unpublish trip         │  ✅   │   ❌   │   -   │    -     │
│ Edit company profile           │  ✅   │   ❌   │   -   │    -     │
│ Upload logo                    │  ✅   │   ❌   │   -   │    -     │
│ View read receipts             │  ✅   │   ✅   │   -   │    -     │
│ Send/Resend notifications      │  ✅   │   ✅   │   -   │    -     │
│ View usage & limits            │  ✅   │   ✅   │   -   │    -     │
│ View published trip (/t/slug)  │  ✅   │   ✅   │  ✅   │    ✅    │
│ View immigration view          │  ✅   │   ✅   │  ✅   │    ✅    │
│ Follow trip (LINE/Push)        │   -   │   -    │  ✅   │    ✅    │
│ Acknowledge change             │   -   │   -    │  ✅   │    -     │
│ Unfollow trip                  │   -   │   -    │  ✅   │    -     │
└────────────────────────────────┴───────┴────────┴───────┴──────────┘
```

### 8.2 Data Isolation (Multi-tenant)

```typescript
// lib/middleware/auth.ts — ทุก API route ที่ต้อง JWT

export async function withAuth(req: Request): Promise<AuthContext> {
  const session = await getServerSession(authOptions);
  if (!session) throw new ApiError(401, "Unauthorized");

  return {
    userId: session.user.id,
    companyId: session.user.company_id,
    role: session.user.role,
  };
}

// ทุก query ต้องมี company_id filter
// ป้องกัน IDOR (Insecure Direct Object Reference)

// ❌ WRONG — ไม่ filter company
const trip = await db.select().from(tripPlans).where(eq(tripPlans.id, tripId));

// ✅ CORRECT — filter company เสมอ
const trip = await db.select().from(tripPlans).where(
  and(
    eq(tripPlans.id, tripId),
    eq(tripPlans.companyId, auth.companyId)
  )
);
```

### 8.3 API Permission Matrix

| API Endpoint | No Auth | JWT (Owner) | JWT (Editor) |
|-------------|---------|-------------|--------------|
| POST /auth/register | ✅ | - | - |
| POST /auth/login | ✅ | - | - |
| POST /auth/logout | - | ✅ | ✅ |
| GET /auth/session | - | ✅ | ✅ |
| GET /company/me | - | ✅ | ✅ (read only) |
| PUT /company/me | - | ✅ | ❌ 403 |
| POST /company/me/logo | - | ✅ | ❌ 403 |
| GET /trips | - | ✅ | ✅ |
| POST /trips | - | ✅ | ✅ |
| GET /trips/:id | - | ✅ | ✅ |
| PUT /trips/:id | - | ✅ | ✅ |
| DELETE /trips/:id | - | ✅ | ❌ 403 |
| POST /trips/:id/publish | - | ✅ | ❌ 403 |
| POST /trips/:id/unpublish | - | ✅ | ❌ 403 |
| GET /trips/:t/days | - | ✅ | ✅ |
| POST /trips/:t/days | - | ✅ | ✅ |
| PUT /trips/:t/days/:d | - | ✅ | ✅ |
| DELETE /trips/:t/days/:d | - | ✅ | ✅ |
| PUT /trips/:t/days/reorder | - | ✅ | ✅ |
| POST /trips/:d/activities | - | ✅ | ✅ |
| PUT /trips/:d/activities/:a | - | ✅ | ✅ |
| DELETE /trips/:d/activities/:a | - | ✅ | ✅ |
| GET /trips/:t/followers | - | ✅ | ✅ |
| GET /trips/:t/changelog | - | ✅ | ✅ |
| GET /trips/:t/stats | - | ✅ | ✅ |
| POST /notify/send/:c | - | ✅ | ✅ |
| POST /notify/resend/:c | - | ✅ | ✅ |
| POST /upload/image | - | ✅ | ✅ |
| GET /public/t/:slug | ✅ | ✅ | ✅ |
| GET /public/t/:slug/imm | ✅ | ✅ | ✅ |
| POST /public/t/:slug/view | ✅ | ✅ | ✅ |
| POST /follow/line/webhook | ✅* | - | - |
| POST /follow/web-push/subscribe | ✅ | - | - |
| DELETE /follow/:f/unfollow | ✅ | - | - |
| POST /acknowledge/:c | ✅ | - | - |
| GET /health | ✅ | ✅ | ✅ |

> *LINE webhook ใช้ signature verification แทน JWT

### 8.4 Free Tier Limits

| Resource | Free | Pro (299 บ/เดือน) | Business (999 บ/เดือน) |
|----------|------|-------------------|----------------------|
| Active trips | 3 | 20 | Unlimited |
| Edits per trip | 50 | Unlimited | Unlimited |
| Followers per trip | 50 | 500 | Unlimited |
| Image storage | 100 MB | 1 GB | 10 GB |
| LINE messages/month | 500 (platform limit) | 5,000 | 25,000 |
| Custom slug | ❌ | ✅ | ✅ |
| Remove NatGan branding | ❌ | ❌ | ✅ |
| Team members (editors) | 1 | 3 | 10 |

---

## 9. System Workflow

### 9.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  1. REGISTER & SETUP                                                    │
│  ════════════════                                                       │
│  ทัวร์ลีดเดอร์สมัครสมาชิก → กรอก email + password + ชื่อบริษัท         │
│  → ระบบสร้าง mst_companies + mst_users                                  │
│  → redirect ไป /dashboard                                               │
│  → กรอก Company Profile (โลโก้, เบอร์, LINE ID)                         │
│                                                                         │
│  2. CREATE TRIP                                                         │
│  ════════════                                                           │
│  [+ สร้างทริป] → กรอก Step 1: ชื่อ, จุดหมาย, วันที่, สายการบิน, ที่พัก  │
│  → [ถัดไป] → ระบบ auto-generate วันตามจำนวนคืน                          │
│  → Step 2: เพิ่มกิจกรรมทีละวัน (เวลา, สถานที่, รูป, แผนที่)              │
│  → ลาก drag-drop จัดลำดับ                                                │
│  → auto-save ทุก 30 วินาที                                               │
│                                                                         │
│  3. PREVIEW & PUBLISH                                                   │
│  ═══════════════                                                        │
│  [ดูตัวอย่าง] → เห็นหน้า Guest View ในกรอบมือถือ                         │
│  → [เผยแพร่] → ระบบ generate slug + QR Code                             │
│  → ได้ลิงก์ natgan.com/t/{slug}                                         │
│  → Copy URL / Download QR / Copy ข้อความแชร์                             │
│                                                                         │
│  4. SHARE & FOLLOW                                                      │
│  ═══════════════                                                        │
│  ทัวร์ลีดเดอร์แชร์ลิงก์/QR ให้ลูกทัวร์                                  │
│  → ลูกทัวร์เปิดลิงก์ → เห็น Guest View                                   │
│  → [ติดตามทริปนี้] → เลือก LINE หรือ Web Push                            │
│     ├─ LINE: Add Friend → webhook → create follower                      │
│     └─ Web Push: Allow → subscribe → create follower                     │
│  → view_count +1                                                        │
│                                                                         │
│  5. EDIT & NOTIFY                                                       │
│  ═══════════════                                                        │
│  ทัวร์ลีดเดอร์แก้ไขกิจกรรม (เปลี่ยนเวลา/เพิ่ม/ลบ)                      │
│  → ระบบ detect changes → สร้าง noti_change_logs                          │
│  → ส่งแจ้งเตือนอัตโนมัติ:                                                │
│     ├─ LINE: Push Message → "มีการเปลี่ยนแปลง: ..." + ลิงก์              │
│     └─ Web Push: Notification → "แผนเปลี่ยน" + ลิงก์                     │
│  → edit_count +1 (free tier: max 50)                                     │
│                                                                         │
│  6. ACKNOWLEDGE & TRACK                                                 │
│  ═════════════════════                                                  │
│  ลูกทัวร์เห็นแจ้งเตือน → เปิดลิงก์ → เห็น banner "มีการเปลี่ยนแปลง"      │
│  → [รับทราบ] → สร้าง noti_acknowledgements                               │
│  → ทัวร์ลีดเดอร์ดู Read Receipt Dashboard:                               │
│     ├─ ✅ "สมชาย" รับทราบแล้ว 11:05                                      │
│     ├─ ✅ "นิดา" รับทราบแล้ว 11:12                                       │
│     └─ ❌ "พี่ตุ้ย" ยังไม่อ่าน → [ส่งซ้ำ]                                │
│                                                                         │
│  7. IMMIGRATION VIEW                                                    │
│  ═══════════════════                                                    │
│  ลูกทัวร์ที่สนามบิน → เปิด /t/{slug}/imm                                 │
│  → เห็นข้อมูลสำคัญ: โรงแรม, เที่ยวบิน, เบอร์ฉุกเฉิน                      │
│  → [พิมพ์] → print-friendly layout                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Notification Engine Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                  NOTIFICATION ENGINE                         │
│                                                              │
│  Trip Edit Saved                                             │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────┐                                            │
│  │ Diff Engine   │ Compare old vs new state                  │
│  │              │ Generate changes[] JSONB                   │
│  │              │ Generate summary_text (Thai)               │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Change Log   │ INSERT INTO noti_change_logs               │
│  │              │ { trip_id, changed_by, changes, summary }  │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ Dispatcher   │ Query noti_followers WHERE trip_id         │
│  │              │ Group by channel                           │
│  └──────┬───────┘                                            │
│         │                                                    │
│    ┌────┴────┐                                               │
│    ▼         ▼                                               │
│  ┌──────┐ ┌──────────┐                                       │
│  │ LINE │ │ Web Push │                                       │
│  │ API  │ │ API      │                                       │
│  │      │ │          │                                       │
│  │ Push │ │ Push     │                                       │
│  │ Msg  │ │ Notif.   │                                       │
│  └──┬───┘ └────┬─────┘                                       │
│     │          │                                             │
│     ▼          ▼                                             │
│  ┌──────────────────┐                                        │
│  │ Update change_log│                                        │
│  │ noti_sent = true │                                        │
│  │ noti_sent_at     │                                        │
│  └──────────────────┘                                        │
│                                                              │
│  ── ACK FLOW ──                                              │
│                                                              │
│  Follower taps [รับทราบ]                                     │
│       │                                                      │
│       ▼                                                      │
│  POST /api/acknowledge/:changelogId                          │
│       │                                                      │
│       ▼                                                      │
│  INSERT INTO noti_acknowledgements                           │
│  (changelog_id, follower_id, acknowledged_at)                │
│       │                                                      │
│       ▼                                                      │
│  Dashboard auto-refreshes ack count                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 LINE Notification Message Format

```
🔔 NatGan — Tokyo Winter 2026

⚠️ มีการเปลี่ยนแปลง:
• Day 2: เปลี่ยนเวลา teamLab 08:30 → 09:00
• Day 2: เพิ่ม 'แวะ 7-Eleven' เวลา 08:00
• Day 3: ยกเลิก 'ตลาดวโรรส' (ปิดปรับปรุง)

👉 ดูรายละเอียด + กดรับทราบ:
natgan.com/t/tokyo-winter-2026
```

---

## 10. Deliverables & Definition of Done

### 10.1 Sprint Deliverables Checklist

#### Week 1-2: Foundation
- [ ] Next.js 15 project initialized with Tailwind v4
- [ ] PostgreSQL Docker running on VPS
- [ ] Drizzle schema + migrations for all 8 tables
- [ ] Auth.js configured (credentials provider)
- [ ] Register + Login pages working
- [ ] Company Profile page with logo upload
- [ ] Cloudflare R2 integration
- [ ] Rate limiting middleware
- [ ] Zod validation on all endpoints
- [ ] Error handling middleware

#### Week 3-4: Trip Builder
- [ ] Trip list on dashboard
- [ ] Create trip wizard (Step 1)
- [ ] Trip editor (Step 2) with day tabs
- [ ] Activity CRUD with drag-reorder
- [ ] JSONB editors (airlines, hotels, contacts)
- [ ] Image upload for covers
- [ ] Auto-save draft every 30s
- [ ] Trip deletion (draft only)

#### Week 5-6: Guest & Share
- [ ] Publish flow with slug generation
- [ ] Guest View page (SSR, mobile-first)
- [ ] Immigration View page
- [ ] QR Code generation + download
- [ ] Share template with copy
- [ ] View counter
- [ ] OG meta tags for social sharing

#### Week 7-8: Notification
- [ ] Change detection engine (diff)
- [ ] LINE Messaging API integration
- [ ] Web Push integration (VAPID)
- [ ] Follow modal on guest page
- [ ] Follower management
- [ ] Notification dispatch
- [ ] Acknowledge system
- [ ] Read Receipt dashboard

#### Week 9-10: Polish & Launch
- [ ] Usage & Limits page
- [ ] Free tier enforcement
- [ ] Empty states & error pages
- [ ] Loading skeletons
- [ ] Performance optimization (Lighthouse 90+)
- [ ] OWASP security audit
- [ ] AES-256 encryption verified
- [ ] HTTP security headers
- [ ] 5 pilot companies onboarded
- [ ] Production deployment

### 10.2 File Structure

```
natgan/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Auth guard + sidebar
│   │   ├── dashboard/page.tsx      # Trip list
│   │   ├── dashboard/profile/page.tsx
│   │   ├── dashboard/usage/page.tsx
│   │   └── dashboard/trips/
│   │       ├── new/page.tsx        # Step 1
│   │       └── [id]/
│   │           ├── edit/page.tsx   # Step 2
│   │           ├── preview/page.tsx
│   │           ├── publish/page.tsx
│   │           └── receipts/page.tsx
│   ├── t/
│   │   └── [slug]/
│   │       ├── page.tsx            # Guest View (SSR)
│   │       └── imm/page.tsx        # Immigration View
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── company/me/route.ts
│   │   ├── company/me/logo/route.ts
│   │   ├── trips/route.ts
│   │   ├── trips/[id]/route.ts
│   │   ├── trips/[id]/publish/route.ts
│   │   ├── trips/[id]/unpublish/route.ts
│   │   ├── trips/[tripId]/days/route.ts
│   │   ├── trips/[tripId]/days/[dayId]/route.ts
│   │   ├── trips/[tripId]/days/reorder/route.ts
│   │   ├── trips/[dayId]/activities/route.ts
│   │   ├── trips/[dayId]/activities/[actId]/route.ts
│   │   ├── trips/[dayId]/activities/reorder/route.ts
│   │   ├── trips/[tripId]/followers/route.ts
│   │   ├── trips/[tripId]/changelog/route.ts
│   │   ├── trips/[tripId]/stats/route.ts
│   │   ├── public/t/[slug]/route.ts
│   │   ├── public/t/[slug]/imm/route.ts
│   │   ├── public/t/[slug]/view/route.ts
│   │   ├── follow/line/webhook/route.ts
│   │   ├── follow/web-push/subscribe/route.ts
│   │   ├── follow/[followerId]/unfollow/route.ts
│   │   ├── acknowledge/[changelogId]/route.ts
│   │   ├── notify/send/[changelogId]/route.ts
│   │   ├── notify/resend/[changelogId]/route.ts
│   │   ├── upload/image/route.ts
│   │   └── health/route.ts
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── lib/
│   ├── db/
│   │   ├── index.ts                # Drizzle client
│   │   ├── schema.ts               # All table definitions
│   │   └── migrate.ts              # Migration runner
│   ├── auth/
│   │   ├── options.ts              # Auth.js config
│   │   └── session.ts              # getSession helper
│   ├── storage/
│   │   └── r2.ts                   # Cloudflare R2 client
│   ├── notifications/
│   │   ├── line.ts                 # LINE Messaging API
│   │   ├── web-push.ts             # Web Push
│   │   └── dispatcher.ts           # Send to all channels
│   ├── crypto.ts                   # AES-256-GCM
│   ├── rate-limit.ts               # Rate limiter
│   └── validations/
│       ├── auth.ts                 # Zod: register, login
│       ├── trip.ts                 # Zod: trip, day, activity
│       └── follow.ts              # Zod: follow, ack
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── trip/                       # Trip-specific components
│   ├── dashboard/                  # Dashboard components
│   └── guest/                      # Guest view components
├── drizzle/
│   └── migrations/                 # SQL migration files
├── public/
│   └── images/                     # Static assets
├── .env.local                      # Environment variables
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 10.3 Environment Variables

```bash
# .env.local

# Database
DATABASE_URL=postgresql://natgan:password@vps-ip:5432/natgan

# Auth.js
NEXTAUTH_URL=https://natgan.com
NEXTAUTH_SECRET=random-32-char-secret

# Encryption
ENCRYPTION_KEY=random-64-hex-chars

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=natgan-assets
R2_PUBLIC_URL=https://cdn.natgan.com

# LINE Messaging API
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-access-token

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@natgan.com
```

### 10.4 Key npm Dependencies

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0",
    "drizzle-orm": "^0.35.0",
    "postgres": "^3.4.0",
    "zod": "^3.23.0",
    "@aws-sdk/client-s3": "^3.600.0",
    "bcrypt": "^5.1.0",
    "web-push": "^3.6.0",
    "qrcode": "^1.5.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.25.0",
    "typescript": "^5.5.0",
    "tailwindcss": "^4.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/web-push": "^3.6.0"
  }
}
```

---

> 📌 **เอกสารนี้เป็น Living Document** — จะอัปเดตตามการพัฒนาจริง
> 🎯 **เป้าหมาย:** อ่านเอกสารนี้แล้วมองเห็นภาพรวมทั้งโปรเจค ทุกปุ่ม ทุก API ทุก table ทุก permission
> 🔐 **Security First:** ทุก endpoint มี Zod validation + rate limiting + company_id isolation
