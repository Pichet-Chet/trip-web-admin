# Operator Pricing Plans Specification

> Version: 1.0
> Date: 2026-04-03
> Status: Approved

---

## 1. Overview

กำหนดโครงสร้าง Pricing Plans สำหรับ Operator (บริษัททัวร์ / ไกด์อิสระ) ที่ใช้งานระบบ Trip Communication บนแพลตฟอร์ม

**เป้าหมายหลัก:** ดึง traffic / ผู้ใช้ใหม่เข้าระบบก่อน โดยให้ Free tier ใช้งานได้จริง แต่มี limit ที่กระตุ้นให้ upgrade เมื่อธุรกิจโตขึ้น

---

## 2. แผนทั้งหมด

| | Free | รายทริป | แพ็ก 5 ทริป | Subscription |
|--|------|---------|------------|-------------|
| **ราคา** | ฿0 | ฿49/ทริป | ฿249/5 ทริป | ฿299/เดือน |
| **ทริป** | 3 ทริป (ตลอดชีพ) | ไม่จำกัด | 5 ทริป/แพ็ก | ไม่จำกัด |
| **ผู้เข้าร่วม/ทริป** | 30 คน | ไม่จำกัด | ไม่จำกัด | ไม่จำกัด |
| **การแจ้งเตือน** | 50/เดือน | ไม่จำกัด | ไม่จำกัด | ไม่จำกัด |
| **Watermark** | มี | มี | มี | ไม่มี |

---

## 3. Business Rules รายแผน

### 3.1 Free

- สร้างทริปได้ **3 ทริป ตลอดชีพ** — ไม่ reset ไม่มีโควต้ารายเดือน
- เต็มแล้วต้อง upgrade เท่านั้น จะสร้างทริปใหม่ไม่ได้
- ผู้เข้าร่วมสูงสุด **30 คน/ทริป**
- แจ้งเตือนได้ **50 ครั้ง/เดือน** — reset ทุกต้นเดือน
- แสดง Watermark บนทุก trip page

### 3.2 รายทริป (฿49/ทริป)

- จ่ายต่อทริปที่สร้าง — **ไม่มีวันหมดอายุ**
- ไม่จำกัดผู้เข้าร่วมและการแจ้งเตือน
- สามารถซื้อได้ไม่จำกัดครั้ง
- แสดง Watermark บนทุก trip page

### 3.3 แพ็ก 5 ทริป (฿249/แพ็ก)

- ซื้อ 1 แพ็ก ได้ 5 credit ทริป
- ซื้อได้หลายแพ็ก **credit สะสมได้** (เช่น ซื้อ 2 แพ็ก = 10 credit)
- credit ใช้ได้จนหมด **ไม่มี rollover / ไม่ expire**
- ใช้ 1 credit เมื่อสร้างทริปใหม่
- ไม่จำกัดผู้เข้าร่วมและการแจ้งเตือน
- แสดง Watermark บนทุก trip page

### 3.4 Subscription (฿299/เดือน)

- billing cycle รายเดือน นับจากวันที่สมัคร
- ไม่จำกัดทุกอย่าง
- หมดอายุแล้วกลับไปสถานะ **Free** อัตโนมัติ
- ทริปที่สร้างไว้ยังคงอยู่ แต่จะสร้างทริปใหม่ไม่ได้ถ้า Free quota หมดแล้ว
- **ไม่มี annual discount**
- **ไม่มี Watermark**

---

## 4. Watermark Logic

- ทุก trip response มี field `showWatermark: bool`
- `true` — Free / รายทริป / แพ็ก
- `false` — Subscription เท่านั้น
- หน้าบ้านดึง value ไป display เอง ไม่ได้ embed logic ใน API

---

## 5. Quota Resolution Logic

เมื่อ Operator สร้างทริปใหม่ ระบบตรวจสอบตามลำดับนี้:

```
1. มี Active Subscription อยู่ไหม?
   → ใช่: อนุญาต (ไม่หัก credit)

2. มี Trip Pack credit เหลืออยู่ไหม?
   → ใช่: หัก 1 credit จาก Pack

3. มีการชำระ รายทริป สำหรับทริปนี้ไหม?
   → ใช่: อนุญาต

4. อยู่ใน Free และยังไม่ครบ 3 ทริปไหม?
   → ใช่: อนุญาต (นับ Free quota)

5. ไม่มีสิทธิ์: แสดงหน้า Upgrade Plan
```

---

## 6. Break-even Analysis

| ทริป/เดือน | รายทริป | แพ็ก | Sub ฿299 | แนะนำ |
|-----------|---------|------|---------|-------|
| 1–4 | ฿49–196 | — | ฿299 | รายทริป |
| 5 | ฿245 | ฿249 | ฿299 | รายทริป |
| 6 | ฿294 | ฿298 | ฿299 | รายทริป |
| **7+** | ฿343+ | ฿347+ | **฿299** | **Sub ✓** |

→ Subscription คุ้มค่าชัดเจนที่ **7 ทริป/เดือนขึ้นไป**

---

## 7. Customer Journey ที่คาดไว้

```
ลงทะเบียน → Free (3 ทริปตลอดชีพ)
                │
           ทริปหมด / ผู้เข้าร่วมเกิน 30 คน
                │
     ┌──────────┴──────────┐
  ทำนานๆ ครั้ง          ทำบ่อย 4–6 ทริป/เดือน
  รายทริป ฿49          แพ็ก 5 ทริป ฿249
                                │
                        7+ ทริป/เดือน
                                │
                       Sub ฿299/เดือน
```

---

## 8. DB Schema (เบื้องต้น)

### `mst_plans`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| id | uuid PK | |
| code | varchar(32) | free / per_trip / pack_5 / subscription |
| name | varchar(128) | ชื่อแสดงผล |
| price | decimal(10,2) | ราคา |
| trip_limit | int? | null = ไม่จำกัด |
| participant_limit | int? | null = ไม่จำกัด |
| notification_limit | int? | null = ไม่จำกัด |
| show_watermark | bool | |
| is_subscription | bool | true = รายเดือน |
| is_active | bool | |

### `operator_subscriptions`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| id | uuid PK | |
| company_id | uuid FK | |
| plan_id | uuid FK | |
| started_at | timestamptz | |
| expires_at | timestamptz | |
| status | varchar(32) | active / expired / cancelled |

### `operator_trip_credits`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| id | uuid PK | |
| company_id | uuid FK | |
| credits_total | int | |
| credits_used | int | |
| purchased_at | timestamptz | |
| source | varchar(32) | per_trip / pack_5 |

---

## 9. สิ่งที่ไม่อยู่ใน Scope ตอนนี้

- ❌ Annual discount
- ❌ Enterprise / Custom tier
- ❌ Per-seat pricing
- ❌ Analytics dashboard สำหรับ Operator
- ❌ Priority listing
- ❌ ระบบ Payment Gateway (implement แยกต่างหาก)
