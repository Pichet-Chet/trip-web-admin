# Trip Lifecycle & Quota Management Specification

> Version: 1.0
> Date: 2026-04-02
> Status: Approved

---

## 1. Overview

กำหนดวงจรชีวิตของทริป (Trip Lifecycle) และกลไกการจัดการ Quota เพื่อป้องกันการนำทริปเดิมมาใช้ซ้ำโดยไม่ซื้อ Quota เพิ่ม โดยยังคงความยืดหยุ่นสำหรับกรณีเลื่อนไฟลท์หรือแก้ไขข้อมูลระหว่างเดินทาง

---

## 2. Trip Status Lifecycle

```
Draft → Published → Archived
          ↓
      Unpublished → Published (re-publish)
                     ↓
                  Archived
```

| สถานะ | คำอธิบาย | นับ Quota |
|---|---|---|
| **Draft** | ฉบับร่าง ยังไม่เผยแพร่ | ✅ นับ |
| **Published** | เผยแพร่แล้ว ลูกทริปเข้าดูได้ | ✅ นับ |
| **Unpublished** | ยกเลิกเผยแพร่ชั่วคราว | ✅ นับ |
| **Archived** | เดินทางเสร็จแล้ว (อัตโนมัติ) | ❌ ไม่นับ |

---

## 3. Auto-Archive

### เงื่อนไข
- สถานะปัจจุบันเป็น **Published** หรือ **Unpublished**
- `endDate + 7 วัน` ผ่านไปแล้ว (นับจากวันกลับ)

### พฤติกรรม
- ระบบเปลี่ยนสถานะเป็น **Archived** อัตโนมัติ
- ลูกทริปยังเข้าดูข้อมูลได้ (read-only)
- เจ้าของทริปแก้ไขไม่ได้ทุกอย่าง
- **ไม่นับ Quota** → user สร้างทริปใหม่ได้

### การ Implement
- Background Job (IHostedService) ทำงานทุกวัน เวลา 00:00 UTC
- Query: `WHERE status IN ('Published', 'Unpublished') AND endDate < now() - interval '7 days'`
- Update: `SET status = 'Archived', updatedAt = now()`

---

## 4. สิทธิ์การแก้ไขตามสถานะ

### 4.1 Draft

| ข้อมูล | แก้ไขได้ |
|---|---|
| วันเดินทาง (startDate, endDate) | ✅ ไม่จำกัด |
| ชื่อ, จุดหมาย, ภาษา, ปก | ✅ |
| การเดินทาง, ที่พัก, เบอร์ฉุกเฉิน | ✅ |
| กิจกรรม (Days, Activities) | ✅ |
| หมายเหตุ | ✅ |
| ลบทริป | ✅ |

### 4.2 Published / Unpublished

| ข้อมูล | แก้ไขได้ | เงื่อนไข |
|---|---|---|
| **วันเดินทาง (startDate, endDate)** | ⚠️ มีเงื่อนไข | ดูหัวข้อ 5 |
| ชื่อ, จุดหมาย, ภาษา, ปก | ✅ | — |
| การเดินทาง, ที่พัก, เบอร์ฉุกเฉิน | ✅ | — |
| กิจกรรม (Days, Activities) | ✅ | Days จะถูก sync ตามวันเดินทาง |
| หมายเหตุ | ✅ | — |
| ลบทริป | ❌ | ต้อง unpublish + สร้างใหม่ |

### 4.3 Archived

| ข้อมูล | แก้ไขได้ |
|---|---|
| ทุกอย่าง | ❌ ห้ามแก้ไขทั้งหมด |
| ลบทริป | ❌ |
| ลูกทริปเข้าดู | ✅ read-only |

---

## 5. การแก้ไขวันเดินทาง (Date Change Policy)

### 5.1 หลักการ

เมื่อทริปถูก Publish ครั้งแรก ระบบจะบันทึก **วันเดินทางต้นฉบับ (Original Dates)** ไว้ การแก้ไขวันเดินทางหลังจากนั้นจะถูกเทียบกับวันต้นฉบับเสมอ

### 5.2 Fields ที่เพิ่ม

```
TripPlan:
  OriginalStartDate  DateOnly?   — วันเดินทางตอน publish ครั้งแรก
  OriginalEndDate    DateOnly?   — วันกลับตอน publish ครั้งแรก
```

- ถูก set ครั้งเดียวตอน `PublishAsync()` เมื่อยังเป็น `null`
- ไม่เปลี่ยนแปลงอีกตลอดชีวิตของทริป

### 5.3 การเช็ค "ซ้อนกัน" (Overlap)

```
วันเดิม (Original):  |------- A -------|
วันใหม่ (New):              |------- B -------|

ซ้อนกัน = NewStart <= OriginalEnd AND NewEnd >= OriginalStart
```

### 5.4 ผลลัพธ์

| กรณี | ซ้อนกัน | ผลลัพธ์ | Quota |
|---|---|---|---|
| เลื่อน 1-2 วัน | ✅ | อนุญาต | ฟรี |
| เลื่อนเป็นเดือนหน้า | ❌ | ต้องมี quota เหลือ | กิน 1 |
| Quota เต็ม + ไม่ซ้อน | ❌ | ❌ Reject | — |

### 5.5 ตัวอย่าง

```
Publish ครั้งแรก: 15-18 เม.ย. 2569 (Original locked)

Case 1: แก้เป็น 16-19 เม.ย.
  → 16 <= 18 AND 19 >= 15 → ซ้อนกัน → ✅ ฟรี

Case 2: แก้เป็น 19-22 เม.ย.
  → 19 <= 18? → NO → ไม่ซ้อน → ⚠️ กิน quota 1

Case 3: แก้เป็น 1-4 พ.ค.
  → 1 <= 18? → NO → ไม่ซ้อน → ⚠️ กิน quota 1

Case 4: เลื่อนทีละวัน (15→16→17→18→19...)
  → เทียบกับ Original (15-18) เสมอ
  → 19 <= 18? → NO → ไม่ซ้อน → ⚠️ กิน quota ตั้งแต่ครั้งที่เลื่อนเกิน
```

### 5.6 Algorithm (Pseudocode)

```
function UpdateTripDates(trip, newStart, newEnd):
    if trip.status == 'Draft':
        // Draft = แก้ได้เสรี
        trip.startDate = newStart
        trip.endDate = newEnd
        syncDays(trip)
        return OK

    if trip.status == 'Archived':
        return ERROR("ทริปที่ archived แล้วแก้ไขไม่ได้")

    // Published or Unpublished
    if trip.originalStartDate == null:
        return ERROR("ข้อมูลไม่ถูกต้อง")

    // Check overlap with original dates
    isOverlap = (newStart <= trip.originalEndDate) AND (newEnd >= trip.originalStartDate)

    if isOverlap:
        // ซ้อนกัน → ฟรี
        trip.startDate = newStart
        trip.endDate = newEnd
        syncDays(trip)
        return OK

    // ไม่ซ้อน → ต้องมี quota
    currentQuota = countTrips(trip.companyId, excludeArchived=true)
    limit = getQuotaLimit(trip.companyId)

    // ทริปนี้นับอยู่แล้ว ไม่ต้อง +1
    // แต่ถ้า quota เต็มอยู่แล้ว (เท่ากับ limit) = ไม่มีที่ว่าง
    // จริงๆ ทริปนี้ใช้ quota อยู่แล้ว ดังนั้นไม่ต้องเช็คเพิ่ม
    // แค่นับว่าเป็น "date change" → consume 1 DateChangeCount

    if trip.dateChangeCount >= MAX_DATE_CHANGES:
        return ERROR("เปลี่ยนวันเดินทางได้สูงสุด X ครั้ง")

    trip.startDate = newStart
    trip.endDate = newEnd
    trip.dateChangeCount += 1
    syncDays(trip)
    return OK
```

---

## 6. Quota Calculation

### 6.1 สูตรนับ Quota

```
Quota ใช้ = จำนวนทริปที่สถานะ Draft + Published + Unpublished
Quota คงเหลือ = Limit - Quota ใช้
```

**Archived ไม่นับ Quota**

### 6.2 Free Plan Limit

| Plan | Limit | หมายเหตุ |
|---|---|---|
| Free | 3 ทริป | ค่าจาก system_configs `app.free_trip_limit` |
| Pro | 20 ทริป | อนาคต |
| Business | ไม่จำกัด | อนาคต |

### 6.3 ป้องกันการสร้างทริปเกิน Quota

**Backend** (TripService.CreateAsync):
```
tripCount = COUNT(*) WHERE companyId = X AND status != 'Archived'
IF tripCount >= limit → throw QuotaExceededException
```

**Frontend**:
- หน้า Dashboard: ปุ่ม "สร้างทริป" → แสดง warning เมื่อ quota เต็ม
- หน้า My Trips: card "สร้างทริปใหม่" → เปลี่ยนเป็น "โควต้าเต็ม" เมื่อ quota เต็ม

---

## 7. Date Change Quota (ไม่ซ้อน)

### 7.1 Field ที่เพิ่ม

```
TripPlan:
  DateChangeCount  int  DEFAULT 0  — จำนวนครั้งที่เปลี่ยนวันแบบไม่ซ้อน
```

### 7.2 Limit

| Plan | จำนวนครั้งที่เปลี่ยนวันแบบไม่ซ้อนได้ |
|---|---|
| Free | 1 ครั้ง |
| Pro | 3 ครั้ง |
| Business | ไม่จำกัด |

ค่า config: `system_configs` → `app.max_date_changes`

### 7.3 UX เมื่อเปลี่ยนวันไม่ซ้อน

แสดง Confirm Dialog:
```
"วันเดินทางใหม่ไม่ซ้อนกับวันเดิม"
"ระบบจะนับเป็นการใช้สิทธิ์เปลี่ยนวัน (ครั้งที่ 1/1)"
"ต้องการดำเนินการหรือไม่?"
[ยกเลิก] [ยืนยัน]
```

---

## 8. API Changes

### 8.1 UpdateAsync (TripService)

เพิ่ม logic:
1. ถ้า status == Archived → reject ทุก field
2. ถ้า startDate/endDate เปลี่ยน + status != Draft → เช็ค overlap กับ original
3. ไม่ซ้อน → เช็ค dateChangeCount < limit → increment + save
4. syncDays เมื่อวันเปลี่ยน

### 8.2 PublishAsync (TripService)

เพิ่ม:
```csharp
if (trip.OriginalStartDate is null)
{
    trip.OriginalStartDate = trip.StartDate;
    trip.OriginalEndDate = trip.EndDate;
}
```

### 8.3 UsageController

แก้ Quota calculation:
```csharp
var tripCount = await _db.TripPlans
    .CountAsync(t => t.CompanyId == companyId && t.Status != TripStatus.Archived);
```

### 8.4 CreateAsync (TripService)

แก้ Quota check:
```csharp
var tripCount = await _db.TripPlans
    .CountAsync(t => t.CompanyId == companyId && t.Status != TripStatus.Archived);
```

---

## 9. Database Migration

### 9.1 TripPlan — เพิ่ม Columns

```sql
ALTER TABLE trip_plans ADD COLUMN "OriginalStartDate" date;
ALTER TABLE trip_plans ADD COLUMN "OriginalEndDate" date;
ALTER TABLE trip_plans ADD COLUMN "DateChangeCount" integer NOT NULL DEFAULT 0;
```

### 9.2 TripStatus Enum — เพิ่ม Archived

```csharp
public enum TripStatus
{
    Draft,
    Published,
    Unpublished,
    Archived    // เพิ่มใหม่
}
```

### 9.3 system_configs — เพิ่ม Config

```sql
INSERT INTO system_configs (category, key, value, description)
VALUES ('app', 'max_date_changes', '1', 'จำนวนครั้งที่เปลี่ยนวันเดินทางแบบไม่ซ้อนได้ (Free plan)');
```

---

## 10. Background Job — Auto Archive

### ArchiveService (IHostedService)

```csharp
// ทำงานทุกวัน 00:00 UTC
await _db.TripPlans
    .Where(t => (t.Status == TripStatus.Published || t.Status == TripStatus.Unpublished)
             && t.EndDate < DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-7)))
    .ExecuteUpdateAsync(s => s
        .SetProperty(t => t.Status, TripStatus.Archived)
        .SetProperty(t => t.UpdatedAt, DateTime.UtcNow));
```

---

## 11. Frontend Impact

### 11.1 หน้าแก้ไขทริป (trips/new?scope=edit)

- ถ้า Archived → redirect ไป preview (read-only)
- ถ้า Published + แก้วัน → เช็ค overlap → แสดง Confirm ถ้าไม่ซ้อน

### 11.2 หน้า My Trips

- ทริป Archived → badge "จบแล้ว" + ไม่มีปุ่มแก้ไข/ลบ → กดดูได้อย่างเดียว
- Quota นับเฉพาะ Draft + Published + Unpublished

### 11.3 หน้า Dashboard

- Quota card → แก้สูตรนับเฉพาะ non-archived
- ทริป Archived → แสดงแยก section "ทริปที่เสร็จแล้ว"

---

## 12. Security Considerations

- **Backend enforce ทุกเงื่อนไข** — frontend เป็นแค่ UX ช่วย
- **Original dates เป็น immutable** — set ครั้งเดียวตอน publish
- **Archived trip ห้ามแก้ไข** — API reject ทุก PUT/POST ที่เกี่ยวกับ archived trip
- **Date change count ห้าม reset** — แม้ unpublish แล้ว publish ใหม่
