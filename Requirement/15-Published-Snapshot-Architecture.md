# 15. Published Snapshot Architecture

> Version: 1.0
> Date: 2026-04-02
> Status: Draft

---

## 1. Overview

แยกข้อมูลที่ admin แก้ไข (Draft) ออกจากข้อมูลที่ลูกทริปเห็น (Published) เพื่อให้:
- Admin แก้ไขได้อิสระ ลูกทริปไม่เห็นจนกว่าจะกด Publish
- Date change policy เช็คตอน Publish เท่านั้น
- ลูกทริปเห็นเฉพาะข้อมูลที่ publish แล้ว ไม่เห็น draft ที่กำลังแก้

---

## 2. Architecture

```
Admin แก้ไข → trip_plans + child tables (Draft)
                    ↓ [Publish]
              trip_published + child tables (Snapshot)
                    ↓ [Client API]
              ลูกทริปเห็นข้อมูลจาก published tables
```

### Data Flow

| Action | อ่านจาก | เขียนลง |
|---|---|---|
| Admin สร้าง/แก้ไข | trip_plans | trip_plans + children |
| Admin กด Publish | trip_plans | trip_published + children (copy) |
| Admin กด อัปเดตการเผยแพร่ | trip_plans | trip_published + children (overwrite) |
| Client เปิดดูทริป | trip_published | — (read-only) |
| Client ดู follower/changelog | trip_published | noti_* tables |

---

## 3. Database Tables

### 3.1 Published Tables (ใหม่ทั้งหมด)

#### `trip_published`

| Column | Type | Source |
|---|---|---|
| id | UUID PK | = trip_plans.id (ใช้ ID เดียวกัน) |
| company_id | UUID FK | trip_plans.company_id |
| title | VARCHAR(256) | trip_plans.title |
| slug | VARCHAR(256) UNIQUE | trip_plans.slug |
| scope | VARCHAR(32) | trip_plans.scope |
| destination | VARCHAR(256) | trip_plans.destination |
| start_date | DATE | trip_plans.start_date |
| end_date | DATE | trip_plans.end_date |
| cover_image_url | TEXT | trip_plans.cover_image_url |
| travelers_count | INT | trip_plans.travelers_count |
| language | VARCHAR(32) | trip_plans.language |
| important_notes | TEXT | trip_plans.important_notes |
| original_start_date | DATE | trip_plans.original_start_date |
| original_end_date | DATE | trip_plans.original_end_date |
| date_change_count | INT | trip_plans.date_change_count |
| view_count | INT | 0 (reset ทุกครั้ง หรือ carry over) |
| published_at | TIMESTAMPTZ | NOW() |
| published_version | INT | +1 ทุกครั้งที่ publish |
| created_at | TIMESTAMPTZ | trip_plans.created_at |

#### `trip_published_days`

| Column | Type |
|---|---|
| id | UUID PK (gen ใหม่) |
| published_trip_id | UUID FK → trip_published.id |
| day_number | INT |
| title | VARCHAR(256) |
| subtitle | VARCHAR(512) |
| cover_image_url | TEXT |
| date | DATE |
| sort_order | INT |

#### `trip_published_activities`

| Column | Type |
|---|---|
| id | UUID PK (gen ใหม่) |
| published_day_id | UUID FK → trip_published_days.id |
| time | VARCHAR(16) |
| name | VARCHAR(256) |
| description | VARCHAR(4096) |
| type | VARCHAR(32) |
| place_name | VARCHAR(256) |
| lat | DOUBLE |
| lng | DOUBLE |
| maps_link | VARCHAR(1024) |
| image_url | TEXT |
| emoji | VARCHAR(32) |
| sort_order | INT |

#### `trip_published_airlines`

| Column | Type |
|---|---|
| id | UUID PK (gen ใหม่) |
| published_trip_id | UUID FK → trip_published.id |
| transport_type | VARCHAR(32) |
| type | VARCHAR(32) |
| departure_airport | VARCHAR(256) |
| departure_detail | VARCHAR(256) |
| arrival_airport | VARCHAR(256) |
| arrival_detail | VARCHAR(256) |
| departure_date | VARCHAR(32) |
| departure_time | VARCHAR(16) |
| arrival_date | VARCHAR(32) |
| arrival_time | VARCHAR(16) |
| airline | VARCHAR(128) |
| flight_number | VARCHAR(32) |
| operator | VARCHAR(128) |
| vehicle_info | VARCHAR(128) |
| booking_ref | VARCHAR(64) |
| baggage | VARCHAR(64) |
| meeting_point | VARCHAR(512) |
| note | VARCHAR(512) |
| sort_order | INT |

#### `trip_published_accommodations`

| Column | Type |
|---|---|
| id | UUID PK (gen ใหม่) |
| published_trip_id | UUID FK → trip_published.id |
| name | VARCHAR(256) |
| address | VARCHAR(512) |
| phone | VARCHAR(64) |
| check_in | VARCHAR(32) |
| check_out | VARCHAR(32) |
| nights | INT |
| sort_order | INT |

#### `trip_published_emergency_contacts`

| Column | Type |
|---|---|
| id | UUID PK (gen ใหม่) |
| published_trip_id | UUID FK → trip_published.id |
| name | VARCHAR(256) |
| phone | VARCHAR(64) |
| icon | VARCHAR(64) |
| sort_order | INT |

### 3.2 FK & Cascade

| Parent | Child | OnDelete |
|---|---|---|
| trip_published | trip_published_days | Cascade |
| trip_published_days | trip_published_activities | Cascade |
| trip_published | trip_published_airlines | Cascade |
| trip_published | trip_published_accommodations | Cascade |
| trip_published | trip_published_emergency_contacts | Cascade |
| mst_companies | trip_published | Cascade |

### 3.3 Indexes

| Table | Column(s) | Type |
|---|---|---|
| trip_published | slug | Unique |
| trip_published | company_id | FK Index |
| trip_published_days | published_trip_id, sort_order | Composite |
| trip_published_activities | published_day_id, sort_order | Composite |

---

## 4. Publish Flow

### 4.1 PublishAsync (เปลี่ยนจากเดิม)

```
1. Load trip_plans + ทุก child tables
2. Date change policy:
   - ถ้ามี original dates → เช็ค overlap
   - ไม่ซ้อน → เช็ค dateChangeCount < limit → increment
3. Lock original dates (ถ้ายังไม่มี)
4. Generate slug (ถ้ายังไม่มี)
5. Set trip_plans.status = Published
6. ลบ trip_published + children เก่า (ถ้ามี) — cascade delete
7. Copy trip_plans → trip_published
8. Copy trip_days → trip_published_days
9. Copy trip_activities → trip_published_activities
10. Copy trip_airlines → trip_published_airlines
11. Copy trip_accommodations → trip_published_accommodations
12. Copy trip_emergency_contacts → trip_published_emergency_contacts
13. Increment published_version
14. SaveChanges (ทุกอย่างใน transaction เดียว)
```

### 4.2 UnpublishAsync

```
1. Set trip_plans.status = Unpublished
2. ลบ trip_published + children (cascade)
3. ลูกทริปเข้าดูไม่ได้อีก
```

### 4.3 ArchiveAsync (auto)

```
1. Set trip_plans.status = Archived
2. trip_published ยังอยู่ (ลูกทริปยังดูได้ read-only)
3. Admin แก้ไขไม่ได้
```

---

## 5. API Changes

### 5.1 Client API (trip-web-client)

**เปลี่ยนจาก** อ่าน `trip_plans` + children
**เป็น** อ่าน `trip_published` + children

```
GET /api/client/t/{slug}
  → SELECT FROM trip_published WHERE slug = {slug}
  → JOIN trip_published_days
  → JOIN trip_published_activities
  → JOIN trip_published_airlines
  → JOIN trip_published_accommodations
  → JOIN trip_published_emergency_contacts
```

### 5.2 Admin API

**ไม่เปลี่ยน** — ยังอ่าน/เขียน trip_plans + children เหมือนเดิม

### 5.3 Publish API

```
POST /api/admin/trips/{id}/publish
  → เพิ่ม logic copy ไป published tables
```

### 5.4 Preview API (Admin ดูก่อน publish)

```
GET /api/admin/trips/{id}
  → อ่านจาก trip_plans (draft) เหมือนเดิม
  → Admin เห็น draft ที่กำลังแก้
```

---

## 6. Frontend Impact

### 6.1 Admin (trip-web-admin)

**ไม่เปลี่ยน** — ทุก CRUD ยังใช้ trip_plans เหมือนเดิม

### 6.2 Preview Page

เพิ่มข้อความแจ้ง:
- ถ้ามีการแก้ไขหลัง publish → แสดง badge "มีการเปลี่ยนแปลงที่ยังไม่ได้เผยแพร่"
- ปุ่ม "อัปเดตการเผยแพร่" → re-publish (copy ใหม่)

### 6.3 Client (trip-web-client)

**ไม่เปลี่ยน** — อ่านจาก API เหมือนเดิม แค่ backend เปลี่ยนจาก trip_plans เป็น trip_published

---

## 7. Migration Strategy

### 7.1 สร้างตารางใหม่

```sql
-- 6 ตารางใหม่
CREATE TABLE trip_published (...)
CREATE TABLE trip_published_days (...)
CREATE TABLE trip_published_activities (...)
CREATE TABLE trip_published_airlines (...)
CREATE TABLE trip_published_accommodations (...)
CREATE TABLE trip_published_emergency_contacts (...)
```

### 7.2 Migrate ข้อมูลเดิม

ทริปที่ Published อยู่แล้ว → copy ไป published tables

```sql
INSERT INTO trip_published SELECT ... FROM trip_plans WHERE status = 'Published';
-- แล้ว copy children ตาม
```

---

## 8. ข้อดีของ Architecture นี้

| ข้อดี | รายละเอียด |
|---|---|
| **แก้ไขอิสระ** | Admin แก้ draft ได้เลย ลูกทริปไม่เห็นจนกว่าจะ publish |
| **Rollback ง่าย** | ถ้าแก้ผิด ลูกทริปยังเห็นของเดิม |
| **Date change ปลอดภัย** | เช็คตอน publish เท่านั้น ไม่ใช่ตอน save |
| **Performance** | Client API query จาก published tables ที่มีข้อมูลน้อยกว่า |
| **RDBMS เต็มรูปแบบ** | ไม่มี JSON, ทุก field มี FK + Index |
| **Audit trail** | published_version ติดตามว่า publish กี่ครั้ง |

---

## 9. Revision History

| Version | วันที่ | ผู้แก้ไข | รายละเอียด |
|---------|-------|---------|-----------|
| 1.0 | 2 เม.ย. 2569 | Dev Team | ฉบับแรก |
