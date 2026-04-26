# 13. มาตรฐานประสิทธิภาพฐานข้อมูล

> Database Performance, Integrity & Optimization Standard
> เอกสารกำหนดมาตรฐานการออกแบบฐานข้อมูล, Foreign Key, Index และการ optimize query

**Version:** 1.0
**อัปเดตล่าสุด:** 31 มีนาคม 2569
**ผู้จัดทำ:** TripApp Development Team

---

## 1. Database Overview

| รายการ | ค่า |
|--------|-----|
| **DBMS** | PostgreSQL 16 |
| **ORM** | Entity Framework Core 10 |
| **Provider** | Npgsql.EntityFrameworkCore.PostgreSQL |
| **Connection Pooling** | Npgsql built-in (default 100 connections) |
| **Encoding** | UTF-8 |
| **Timezone** | UTC (timestamp with time zone) |

---

## 2. Foreign Key (FK) — Data Integrity

### 2.1 กฎ FK

- ✅ **ทุก relationship ต้องมี FK constraint** — ไม่ยอมให้มี orphan records
- ✅ **กำหนด OnDelete behavior ชัดเจน** — ทุก FK ต้องระบุ
- ✅ **FK column ต้องมี Index** — EF Core สร้างอัตโนมัติ
- ❌ **ห้ามใช้ soft reference** (เก็บ ID โดยไม่มี FK) ยกเว้นมีเหตุผล

### 2.2 OnDelete Behavior

| Behavior | ใช้เมื่อ | ตัวอย่าง |
|----------|---------|---------|
| **Cascade** | ลบ parent → ลบ child ทั้งหมด | Trip → Days → Activities |
| **Restrict** | ห้ามลบ parent ถ้ายังมี child | Role → StaffUsers |
| **SetNull** | ลบ parent → set child FK เป็น null | Menu.ParentId → null |
| **NoAction** | ไม่ทำอะไร (DB handle) | ใช้น้อย |

### 2.3 FK Mapping ปัจจุบัน

| Parent | Child | FK Column | OnDelete | Index |
|--------|-------|-----------|----------|-------|
| Company | User | CompanyId | Cascade | ✅ |
| Company | TripPlan | CompanyId | Cascade | ✅ |
| Company | Post | CompanyId | Cascade | ✅ |
| Company | SupportTicket | CompanyId | Cascade | ✅ |
| TripPlan | TripDay | TripId | Cascade | ✅ |
| TripDay | TripActivity | DayId | Cascade | ✅ |
| TripPlan | Follower | TripId | Cascade | ✅ |
| TripPlan | ChangeLog | TripId | Cascade | ✅ |
| ChangeLog | Acknowledgement | ChangeLogId | Cascade | ✅ |
| Follower | Acknowledgement | FollowerId | Cascade | ✅ |
| SupportTicket | TicketReply | TicketId | Cascade | ✅ |
| MasterRole | StaffUser | RoleId | **Restrict** | ✅ |
| MasterRole | RoleMenu | RoleId | Cascade | ✅ |
| MasterMenu | RoleMenu | MenuId | Cascade | ✅ |
| MasterMenu | MasterMenu | ParentId | **Restrict** | ✅ |

---

## 3. Index Strategy

### 3.1 ประเภท Index

| ประเภท | ใช้เมื่อ | ตัวอย่าง |
|--------|---------|---------|
| **Primary Key** | ทุกตาราง (อัตโนมัติ) | Id (UUID) |
| **Unique** | ค่าห้ามซ้ำ | Email, Code, Slug |
| **FK Index** | ทุก FK column (EF Core สร้างอัตโนมัติ) | CompanyId, TripId |
| **Search Index** | Column ที่ใช้ WHERE/LIKE บ่อย | FirstNameIndex, LastNameIndex |
| **Composite** | Query ที่ filter หลาย column | (RoleId, MenuId) |
| **Partial/Filtered** | Unique เฉพาะบาง condition | Slug WHERE Slug IS NOT NULL |

### 3.2 Index ปัจจุบัน

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| mst_users | Email | Unique | Login, duplicate check |
| mst_users | CompanyId | FK Index | Join with Company |
| mst_users | FirstNameIndex | Index | Encrypted name search |
| mst_users | LastNameIndex | Index | Encrypted name search |
| mst_staff_users | Email | Unique | Login |
| mst_staff_users | RoleId | FK Index | Join with Role |
| mst_companies | PortfolioSlug | Unique (filtered) | Portfolio URL |
| trip_plans | Slug | Unique (filtered) | Public trip URL |
| trip_plans | CompanyId | FK Index | Filter by company |
| mst_roles | Code | Unique | Role lookup |
| mst_menus | Code | Unique | Menu lookup |
| mst_role_menus | (RoleId, MenuId) | Unique Composite | Prevent duplicate mapping |
| log_agreements | UserId | Index | Lookup user agreements |
| log_agreements | (UserId, DocumentType) | Composite | Lookup specific agreement |

### 3.3 เมื่อไหร่ควรเพิ่ม Index

```
✅ เพิ่ม Index เมื่อ:
- Column ใช้ใน WHERE clause บ่อย
- Column ใช้ใน JOIN condition
- Column ใช้ใน ORDER BY กับ dataset ใหญ่
- Column ที่ต้อง Unique
- Blind Index column (HMAC hash)

❌ ไม่ควรเพิ่ม Index เมื่อ:
- Table มีข้อมูลน้อย (< 1,000 rows)
- Column มีค่าซ้ำเยอะ (low cardinality) เช่น boolean, status enum
- Column ที่แทบไม่เคย query
- เพิ่ม Index มาก → write performance ลดลง
```

### 3.4 Index Checklist สำหรับ Table ใหม่

```
□ PK มี Index (อัตโนมัติ)
□ ทุก FK column มี Index (EF Core สร้างให้)
□ Unique fields มี Unique Index (Email, Code, Slug)
□ Search fields มี Index (ถ้า dataset > 1,000 rows)
□ Composite index สำหรับ multi-column query ที่ใช้บ่อย
□ Blind Index columns มี Index
□ ไม่มี Index ซ้ำ/ไม่จำเป็น
```

---

## 4. Query Performance Optimization

### 4.1 EF Core Best Practices

#### AsNoTracking — Read-only queries

```csharp
// ❌ Tracked (ช้ากว่า, ใช้ memory มากกว่า)
var trips = await _db.TripPlans.ToListAsync();

// ✅ Untracked (เร็วกว่า 30-50%)
var trips = await _db.TripPlans.AsNoTracking().ToListAsync();
```

**ใช้เมื่อ:** query ที่ไม่ต้อง update entity (list, detail view, report)
**ไม่ใช้เมื่อ:** query ที่ต้อง update แล้ว SaveChanges

#### Select Projection — เลือกเฉพาะ field ที่ต้องการ

```csharp
// ❌ SELECT * (ดึงทุก column รวม encrypted fields)
var users = await _db.Users.ToListAsync();

// ✅ SELECT เฉพาะที่ต้องการ
var users = await _db.Users
    .Select(u => new { u.Id, u.Email, u.FirstName, u.CreatedAt })
    .ToListAsync();
```

#### Include — Eager loading เฉพาะที่จำเป็น

```csharp
// ❌ Load ทุก relation (N+1 problem ถ้าไม่ include)
var trip = await _db.TripPlans.FindAsync(id);
var days = trip.Days; // N+1!

// ❌ Include เกินจำเป็น
var trip = await _db.TripPlans
    .Include(t => t.Days).ThenInclude(d => d.Activities)
    .Include(t => t.Followers)
    .Include(t => t.ChangeLogs).ThenInclude(c => c.Acknowledgements)
    .FirstOrDefaultAsync(t => t.Id == id);

// ✅ Include เฉพาะที่ต้องใช้
var trip = await _db.TripPlans
    .Include(t => t.Days.OrderBy(d => d.SortOrder))
    .FirstOrDefaultAsync(t => t.Id == id);
```

#### Pagination — ทุก list endpoint

```csharp
// ❌ ดึงทั้งหมด
var all = await _db.TripPlans.ToListAsync();

// ✅ Pagination
var items = await _db.TripPlans
    .OrderByDescending(t => t.CreatedAt)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

var totalCount = await _db.TripPlans.CountAsync();
```

**มาตรฐาน Pagination:**

| Parameter | Default | Max | หมายเหตุ |
|-----------|---------|-----|----------|
| page | 1 | — | เริ่มที่ 1 |
| pageSize | 20 | 100 | ห้ามเกิน 100 |

#### Bulk Operations

```csharp
// ❌ Loop update ทีละ record
foreach (var item in items)
{
    item.Status = "Active";
    await _db.SaveChangesAsync(); // N round-trips!
}

// ✅ Bulk update (.NET 7+)
await _db.TripPlans
    .Where(t => t.CompanyId == companyId)
    .ExecuteUpdateAsync(t => t.SetProperty(x => x.Status, TripStatus.Unpublished));
```

### 4.2 N+1 Query Detection

**N+1 Problem:**
```
Query 1: SELECT * FROM trip_plans WHERE company_id = '...'  → 10 trips
Query 2: SELECT * FROM trip_days WHERE trip_id = 'trip-1'
Query 3: SELECT * FROM trip_days WHERE trip_id = 'trip-2'
...
Query 11: SELECT * FROM trip_days WHERE trip_id = 'trip-10'
= 11 queries แทนที่จะเป็น 2
```

**วิธีตรวจจับ:**
- เปิด EF Core logging (Development) → ดูจำนวน query
- SonarQube plugin สำหรับ EF Core
- MiniProfiler (อนาคต)

**วิธีแก้:**
```csharp
// ใช้ Include (Eager Loading)
var trips = await _db.TripPlans
    .Include(t => t.Days)
    .Where(t => t.CompanyId == companyId)
    .ToListAsync();
// = 2 queries (1 for trips, 1 for days)
```

### 4.3 Connection Pool

```
Default: 100 connections
Min: 10 connections

// appsettings.json
"ConnectionStrings": {
    "DefaultConnection": "...;Minimum Pool Size=10;Maximum Pool Size=100;"
}
```

| Metric | เกณฑ์ปกติ | เกณฑ์วิกฤต |
|--------|----------|----------|
| Active connections | < 50 | > 80 |
| Avg query time | < 100ms | > 500ms |
| Slow queries (> 1s) | 0 | > 5/min |

---

## 5. Load Testing Standard

### 5.1 เป้าหมาย Performance

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|-----------|-------------|
| **Response Time (P50)** | < 100ms | < 300ms | > 500ms |
| **Response Time (P95)** | < 300ms | < 1s | > 2s |
| **Response Time (P99)** | < 1s | < 2s | > 5s |
| **Throughput** | > 100 req/s | > 50 req/s | < 20 req/s |
| **Error Rate** | 0% | < 1% | > 5% |
| **CPU Usage** | < 60% | < 80% | > 90% |
| **Memory Usage** | < 70% | < 85% | > 95% |

### 5.2 Load Test Scenarios

| Scenario | Virtual Users | Duration | เป้าหมาย |
|----------|--------------|----------|----------|
| **Smoke Test** | 5 | 1 min | ระบบทำงานได้ |
| **Load Test** | 50 | 10 min | เป้าหมายปกติ |
| **Stress Test** | 200 | 10 min | หาจุดขีดจำกัด |
| **Spike Test** | 10 → 200 → 10 | 5 min | รองรับ traffic spike |
| **Soak Test** | 50 | 1 hour | ไม่มี memory leak |

### 5.3 Critical Endpoints to Test

| Endpoint | Priority | Expected Load |
|----------|----------|--------------|
| GET /api/client/t/{slug} | 🔴 สูงสุด | อ่านบ่อยที่สุด (ลูกทริปเปิดดู) |
| POST /api/admin/auth/login | 🔴 สูง | Login spike ช่วงเช้า |
| GET /api/admin/trips | 🟡 กลาง | Admin ใช้งาน |
| POST /api/admin/trips | 🟢 ต่ำ | สร้างทริปไม่บ่อย |
| POST /api/client/follow | 🟡 กลาง | ลูกทริป follow |
| POST /api/admin/notify | 🟡 กลาง | ส่ง notification |
| GET /api/staff/dashboard | 🟢 ต่ำ | Staff ใช้งาน |

### 5.4 Load Test Tools

| Tool | ใช้ทำอะไร |
|------|----------|
| **k6** (แนะนำ) | Script-based load testing, CI/CD integration |
| **Apache JMeter** | GUI-based, complex scenarios |
| **Artillery** | Node.js based, YAML config |
| **Locust** | Python-based, distributed |

### 5.5 ตัวอย่าง k6 Script

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp up
    { duration: '5m', target: 50 },   // steady
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // P95 < 300ms
    http_req_failed: ['rate<0.01'],    // Error < 1%
  },
};

export default function () {
  const res = http.get('https://api.tripapp.co/api/client/t/tokyo-winter-2026');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 300ms': (r) => r.timings.duration < 300,
  });
  sleep(1);
}
```

---

## 6. Database Monitoring

### 6.1 Metrics to Monitor

| Metric | เครื่องมือ | Alert เมื่อ |
|--------|-----------|-----------|
| Query response time | pg_stat_statements | P95 > 500ms |
| Active connections | pg_stat_activity | > 80% of max |
| Table bloat | pg_stat_user_tables | > 20% dead tuples |
| Index usage | pg_stat_user_indexes | Index scan ratio < 90% |
| Disk usage | OS monitoring | > 80% |
| Replication lag | pg_stat_replication | > 10s (ถ้ามี replica) |

### 6.2 Maintenance Tasks

| Task | ความถี่ | คำสั่ง |
|------|--------|-------|
| VACUUM | อัตโนมัติ (autovacuum) | — |
| ANALYZE | อัตโนมัติ (autovacuum) | — |
| REINDEX | เดือนละ 1 ครั้ง (ถ้าจำเป็น) | `REINDEX INDEX idx_name;` |
| Backup | รายวัน | pg_dump / pg_basebackup |
| Backup test restore | เดือนละ 1 ครั้ง | Restore to test server |

---

## 7. Migration Best Practices

### 7.1 กฎการสร้าง Migration

- ✅ Migration ต้อง reversible (มี Up + Down)
- ✅ Data migration ต้องแยกจาก schema migration (ถ้าเป็นไปได้)
- ✅ ทดสอบ migration บน staging ก่อน production
- ❌ ห้ามแก้ migration ที่ apply แล้ว — สร้าง migration ใหม่แทน
- ❌ ห้าม DROP column โดยไม่ migrate data ก่อน

### 7.2 Zero-Downtime Migration

เมื่อต้อง deploy โดยไม่หยุดระบบ:

```
Step 1: Add new column (nullable) → Deploy
Step 2: Backfill data → Deploy
Step 3: Set NOT NULL constraint → Deploy
Step 4: Drop old column → Deploy (next release)
```

ห้ามทำทีเดียว:
```
❌ Rename column (จะ break running code)
❌ Change column type (จะ lock table)
❌ Add NOT NULL without default (จะ fail ถ้ามี data)
```

---

## 8. Naming Convention

### 8.1 Table Names

| Convention | ตัวอย่าง |
|-----------|---------|
| Prefix `mst_` | Master data: mst_users, mst_companies, mst_roles |
| Prefix `trip_` | Trip data: trip_plans, trip_days, trip_activities |
| Prefix `noti_` | Notification: noti_followers, noti_change_logs |
| Prefix `sup_` | Support: sup_tickets, sup_ticket_replies |
| Prefix `log_` | Logs: log_agreements |
| snake_case | ทุกชื่อตาราง |

### 8.2 Column Names

| Convention | ตัวอย่าง |
|-----------|---------|
| PascalCase | Id, FirstName, CompanyId, CreatedAt |
| FK = ParentTable + "Id" | CompanyId, TripId, RoleId |
| Boolean = Is/Has prefix | IsActive, IsEmailVerified, HasChildren |
| Timestamp = ...At suffix | CreatedAt, UpdatedAt, PublishedAt, VerifiedAt |
| Index column = ...Index suffix | FirstNameIndex, LastNameIndex |

---

## 9. Revision History

| Version | วันที่ | ผู้แก้ไข | รายละเอียด |
|---------|-------|---------|-----------|
| 1.0 | 31 มี.ค. 2569 | Dev Team | ฉบับแรก |
