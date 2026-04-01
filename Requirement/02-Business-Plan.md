# Business Plan
# NatGan (นัดกัน) — Trip Communication & Tour Package Listing Platform

**Version:** 2.0
**Date:** 29 March 2026
**Prepared for:** Investor Presentation
**Confidential**

---

## 1. Executive Summary

**NatGan** คือ platform สำหรับบริษัททัวร์ ไกด์อิสระ และคนทั่วไป ที่มี 2 core values:

1. **Trip Communication Tool** — เปลี่ยนวิธีสื่อสาร itinerary กับลูกทริป จากการส่ง PDF/รูปใน LINE ที่จมหาย → เป็นระบบ **live itinerary** ที่แก้ไขได้ แจ้งเตือนอัตโนมัติ และรู้ว่าใครเห็นแล้วใครยังไม่เห็น
2. **Tour Package Listings (Posts)** — พื้นที่สำหรับบริษัททัวร์/ไกด์โปรโมตแพ็คเกจทัวร์ ทดแทนการมีเว็บไซต์ส่วนตัว สร้าง marketplace ที่บริษัทแข่งขันกันบน NatGan

> **Posts กับ Trips เป็นระบบที่แยกจากกันโดยสิ้นเชิง** — Posts ดึงทราฟฟิก, Trips เป็น service tool

### One-line Pitch
> **"แก้ plan เมื่อไหร่ ลูกทริปรู้เมื่อนั้น — โปรโมตทัวร์ได้โดยไม่ต้องมีเว็บตัวเอง"**

### Key Numbers
- ตลาดบริษัททัวร์ไทย: ~8,000-10,000 ราย active
- ไกด์อิสระ: ~20,000+ คน
- คนไทยเที่ยวในประเทศ: ~200 ล้านทริป/ปี
- คนไทยเที่ยวต่างประเทศ: ~10 ล้านทริป/ปี
- **ยังไม่มี solution ที่แก้ปัญหา "แก้ plan แล้วลูกทริปไม่รู้" โดยตรง**
- **ไกด์อิสระไม่มีงบทำเว็บ → NatGan Posts เป็นคำตอบ**

---

## 2. Problem

### 2.1 สถานการณ์จริงที่เกิดขึ้นทุกวัน

**ปัญหาที่ 1: การสื่อสาร Itinerary**

```
บริษัททัวร์ส่ง itinerary ทาง LINE
        ↓
ลูกทัวร์ 30 คน อ่านบ้าง ไม่อ่านบ้าง
        ↓
วันเดินทาง: สถานที่ปิด / ฝนตก / เปลี่ยนร้านอาหาร
        ↓
ไกด์ส่ง LINE: "เปลี่ยนจุดนัดพบนะคะ"
        ↓
5 คนไม่เห็น → ไปผิดที่ → โทรตามกัน
        ↓
ลูกทัวร์หงุดหงิด → ไกด์เหนื่อย → รีวิวไม่ดี
```

**ปัญหาที่ 2: การโปรโมตทัวร์**

```
ไกด์อิสระ / บริษัททัวร์เล็ก
        ↓
ไม่มีงบทำเว็บไซต์ส่วนตัว
        ↓
โพสต์ขายทัวร์ใน Facebook → จมหายในฟีด
        ↓
ไม่มี landing page มืออาชีพให้ส่งลูกค้า
        ↓
เสียโอกาสขาย → ปิดการขายยาก
```

**ปัญหาที่ 3: กลุ่มเพื่อนวางแผนทริป**

```
เพื่อน 8 คนนัดเที่ยว
        ↓
ไม่มีใครวางแผน → "เดี๋ยวไปถึงแล้วค่อยคิด"
        ↓
ถึงที่แล้ว → เสียเวลาหาที่กิน/ที่เที่ยว → ทะเลาะกัน
        ↓
ทริปไม่สนุกเท่าที่ควร
```

### 2.2 ทำไมปัญหานี้ยังไม่ถูกแก้

| Solution ที่มีอยู่ | ทำไมแก้ไม่ได้ |
|---|---|
| **LINE Group** | ข้อมูลจมในแชท, ไม่มี read receipt สำหรับ itinerary, ส่งรูปแล้วหาไม่เจอ |
| **PDF / Canva** | Static, แก้ทีต้องส่งไฟล์ใหม่, ลูกทริปไม่รู้ว่าอันไหนล่าสุด |
| **AI Gen Trip** | สวยแต่เป็นภาพนิ่ง, แก้ไขไม่ได้, ไม่มี notification, ไม่รองรับ B2B |
| **LINE OA** | ค่าใช้จ่ายสูง (1,500+ บ/เดือน), ไม่ได้ออกแบบมาเพื่อ itinerary |
| **Facebook Page** | โพสต์จมในฟีด, ไม่มี structured tour listing, ดูไม่มืออาชีพ |

### 2.3 ขนาดของปัญหา

- บริษัททัวร์เฉลี่ยมีการเปลี่ยน itinerary **3-5 ครั้ง/เดือน** (สภาพอากาศ, สถานที่ปิด, เปลี่ยนร้านอาหาร)
- ไกด์ใช้เวลา **30 นาที - 1 ชั่วโมง/ครั้ง** ในการแจ้งและโทรตามลูกทริป
- **ลูกทริปที่ไม่เห็นข้อความ = ปัญหาหน้างานทุกครั้ง**
- ไกด์อิสระ 20,000+ คนไม่มีเว็บไซต์ส่วนตัว → ขาดช่องทางนำเสนอทัวร์

---

## 3. Solution

### 3.1 NatGan คืออะไร

**2 ระบบหลักที่แยกจากกัน:**

#### 3.1.1 Trip Communication Tool (Trips)

```
Admin (บริษัททัวร์/ไกด์/คนทั่วไป)     ลูกทริป/เพื่อน
┌──────────────────┐            ┌────────────────────┐
│ สร้าง Trip Plan  │            │ เปิด link/QR ดูได้ │
│ Publish → URL+QR │───────────→│ ไม่ต้องสมัคร       │
│                  │            │ ไม่ต้องโหลด app    │
│ แก้ไข Plan       │            │                    │
│      ↓           │            │                    │
│ ระบบตรวจจับ      │  LINE      │ ได้ noti ทันที     │
│ การเปลี่ยนแปลง   │──MSG API─→│ กด "รับทราบ"       │
│      ↓           │            │                    │
│ เห็นว่าใครรู้แล้ว │←──────────│                    │
│ ใครยังไม่รู้      │            │                    │
│ (โทรตามแค่ 2 คน) │            │                    │
└──────────────────┘            └────────────────────┘
```

#### 3.1.2 Tour Package Listings (Posts)

```
Admin (บริษัททัวร์/ไกด์)              Info Website (สาธารณะ)
┌──────────────────┐            ┌────────────────────────┐
│ สร้าง Post       │            │ แสดงรายการทัวร์        │
│ (รายละเอียดทัวร์) │───────────→│ คนทั่วไปเข้าชมได้      │
│ รูปภาพ, ราคา     │            │ เปรียบเทียบแพ็คเกจ     │
│ เส้นทาง, ข้อมูล  │            │                        │
│                  │            │ สนใจ → ติดต่อบริษัทเอง │
│                  │            │ (ไม่มีระบบ booking)     │
└──────────────────┘            └────────────────────────┘

หมายเหตุ: ไม่มีระบบ booking — บริษัทปิดการขายเอง
Posts เป็นพื้นที่นำเสนอ ทดแทนเว็บไซต์ส่วนตัว
```

> **Posts กับ Trips แยกจากกัน** — Posts ดึง traffic + สร้าง marketplace, Trips เป็น service tool สำหรับจัดการทริป

### 3.2 Killer Features

| Feature | ทำไมสำคัญ |
|---|---|
| **Change Notification** | แก้ plan ครั้งเดียว → ลูกทริปทุกคนรู้ทันที ผ่าน LINE + Web Push |
| **Read Receipt + รับทราบ** | รู้ว่าใครเห็นแล้ว ใครยังไม่เห็น → โทรตามแค่คนที่ไม่เห็น |
| **Live Itinerary** | URL เดียว ข้อมูลล่าสุดเสมอ ไม่ต้องส่งไฟล์ใหม่ |
| **แจ้งเตือนก่อนวันถัดไป** | อัตโนมัติ ไกด์ไม่ต้องพิมพ์ LINE ทุกคืน |
| **QR Code** | พิมพ์แจก ณ จุดนัดพบ scan แล้วเห็น plan ทันที |
| **Company Branding** | ใส่ logo + ช่องทางติดต่อ ดูเป็นมืออาชีพ |
| **โหมดยื่น ตม.** | ยื่นหน้าจอแทนปริ้นกระดาษ — แสดงภาษาท้องถิ่น destination อัตโนมัติ ใช้ offline ได้ |
| **Tour Package Posts** | โปรโมตทัวร์บน marketplace สาธารณะ ไม่ต้องมีเว็บส่วนตัว |
| **Portfolio** | หน้าสาธารณะของแต่ละบริษัท/ไกด์ แสดงทริปที่เคยจัด |
| **Support Ticket** | ช่องทางแจ้งปัญหาและขอฟีเจอร์ — ทีมพัฒนาไม่มี use case ตรงในวงการทัวร์ จึงต้องมีช่องทางรับ feedback |

### 3.3 ทำไมต้องเป็นเรา

1. **เข้าใจ pain point จากประสบการณ์ตรง** — ทีมเคยจัดทริปและเจอปัญหานี้เอง
2. **มี working prototype แล้ว** — ไม่ใช่แค่ idea, มี trip plan ที่ใช้งานได้จริง, UX สวย, responsive, รองรับ 3 ภาษา + มี Posts system พร้อมใช้
3. **ต้นทุนพัฒนาต่ำ** — ทีมพัฒนาเองได้ ไม่ต้องจ้าง outsource
4. **ไม่แข่งกับ LINE แต่ใช้ LINE + Web Push** — ส่ง noti ผ่าน LINE Messaging API (LINE OA) + Web Push Notification ลูกทริปไม่ต้องเปลี่ยนพฤติกรรม รองรับทั้งคนไทยและต่างชาติ
5. **Product = Marketing** — ทุก trip plan ที่ถูกแชร์ มี "Powered by NatGan" = viral loop ฟรี
6. **แก้ปัญหาที่ไม่มีใครแก้: ปริ้นเอกสารให้ ตม.** — ลูกทัวร์ยื่นหน้าจอแทนกระดาษ แสดงภาษาท้องถิ่น destination อัตโนมัติ
7. **Posts สร้าง marketplace แข่งขัน** — บริษัททัวร์แข่งกันบน NatGan platform → lock-in effect

---

## 4. Market Analysis

### 4.1 Target Market

**Primary: บริษัททัวร์ขนาดเล็ก-กลาง + ไกด์อิสระ (B2B)**

| Segment | จำนวน | ลักษณะ | ทำไมเป็น target |
|---|---|---|---|
| บริษัททัวร์ SME (มีใบอนุญาต TAT) | ~8,000 ราย | 1-10 คน, จัด 5-20 ทริป/เดือน | ไม่มีระบบ ใช้ LINE + PDF |
| ไกด์อิสระ | ~20,000 คน | ทำคนเดียว, 2-5 ทริป/เดือน | ต้องการเครื่องมือดูเป็นมืออาชีพ + ไม่มีงบทำเว็บ |

**Secondary: คนทั่วไปที่จัดทริปกลุ่ม (B2C)**

| Segment | ลักษณะ | Purpose |
|---|---|---|
| "คนจัดทริป" ในกลุ่มเพื่อน | มีทุกกลุ่ม 1 คน | ใช้ free tier, วางแผนก่อนเดินทาง, สร้าง awareness |
| ผู้จัดงาน outing บริษัท | HR / Admin | อาจ convert เป็น paying user |

#### 4.1.1 Account Types (3 ประเภท)

| ประเภท | ลักษณะ | Use Case |
|---|---|---|
| **Company** | บริษัททัวร์ที่มีใบอนุญาต TAT | จัดทัวร์เชิงพาณิชย์ + โพสต์ขายทัวร์ |
| **Freelance Guide** | ไกด์อิสระ | รับจัดทริป + สร้าง portfolio + โพสต์ขายทัวร์ |
| **Personal** | คนทั่วไป | วางแผนทริปกับเพื่อน (B2C) |

#### 4.1.2 B2C Use Case — กลุ่มเพื่อนวางแผนทริป

**Pain point:** เพื่อนนัดเที่ยวด้วยกัน แต่ไม่มีใครวางแผน → ไปถึงที่แล้วเสียเวลาหาที่กิน/เที่ยว

- ใช้ Trip Builder สร้างแผนและแชร์ให้เพื่อนดู
- เน้นที่การมีแผนพร้อมก่อนออกเดินทาง (ไม่เน้น notification — เพื่อนโทรหากันเองได้)
- เพิ่ม engagement + "Powered by" exposure

### 4.2 Total Addressable Market (TAM)

```
(คำนวณจาก Pay-per-Trip model)

บริษัททัวร์ SME:    8,000 ราย × 10 ทริป/เดือน × ฿49/ทริป × 12  = 47.0 ล้านบาท/ปี
ไกด์อิสระ:         20,000 คน × 3 ทริป/เดือน × ฿49/ทริป × 12    = 35.3 ล้านบาท/ปี
TAM รวม:           ~82 ล้านบาท/ปี

หมายเหตุ: ราคาจริงอาจต่ำกว่า ฿49 เมื่อซื้อ Pack — ตัวเลขนี้เป็น upper bound
```

### 4.3 Serviceable Addressable Market (SAM)

สมมติเข้าถึง 10% ของตลาดใน 3 ปี:
```
SAM = 82 × 10% = 8.2 ล้านบาท/ปี (~683,000 บ/เดือน)
```

### 4.4 Realistic Target (SOM) — ปีที่ 1-3

| ปี | B2B Customers | B2C Users (free) | Monthly Revenue |
|---|---|---|---|
| ปี 1 | 15-30 ราย | 500 คน | 5,000-15,000 บ |
| ปี 2 | 80-150 ราย | 3,000 คน | 30,000-80,000 บ |
| ปี 3 | 300-500 ราย | 10,000 คน | 100,000-250,000 บ |

---

## 5. Competitive Analysis

### 5.1 Competitive Landscape

```
                    สวย/Interactive
                         ↑
                         │
      AI Gen Trip        │       NatGan ★
      (Wanderlog,        │       (Live + Notification
       TripAdvisor AI)   │        + Tour Listings)
                         │
 Static ────────────────┼────────────────── Live/Real-time
                         │
      PDF / Canva        │       LINE OA
      (บริษัททัวร์ใช้อยู่)  │       (แพง, ไม่เหมาะ)
                         │
                         ↓
                    ทางการ/Plain
```

### 5.2 Head-to-head Comparison

| Feature | LINE Group | PDF/Canva | AI Gen Trip | **NatGan** |
|---|---|---|---|---|
| สร้าง itinerary | ❌ พิมพ์ใน chat | ✅ สวย | ✅ สวยมาก | ✅ สวย + functional |
| แก้ไข real-time | ❌ ส่งใหม่ | ❌ ส่งไฟล์ใหม่ | ❌ ไม่ได้ | ✅ **แก้ได้ทันที** |
| แจ้งเตือนเมื่อเปลี่ยน | ❌ พิมพ์เอง | ❌ ไม่มี | ❌ ไม่มี | ✅ **อัตโนมัติ (LINE + Web Push)** |
| รู้ว่าใครเห็นแล้ว | ❌ ไม่รู้ | ❌ ไม่รู้ | ❌ ไม่รู้ | ✅ **read receipt** |
| Google Maps link | ❌ copy เอง | ❌ ไม่มี | ⚠️ บางที | ✅ ทุกสถานที่ |
| Branding บริษัท | ❌ ไม่ได้ | ✅ ได้ | ❌ ไม่ได้ | ✅ logo + contacts |
| QR แชร์ | ❌ ไม่มี | ❌ ไม่มี | ❌ ไม่มี | ✅ **อัตโนมัติ** |
| Tour Listings / Posts | ❌ ไม่มี | ❌ ไม่มี | ❌ ไม่มี | ✅ **marketplace สาธารณะ** |
| Portfolio | ❌ ไม่มี | ❌ ไม่มี | ❌ ไม่มี | ✅ **หน้าสาธารณะ** |
| ราคา | ฟรี | ฟรี-500บ | ฟรี-$10 | **ฟรี 3 ทริป, ฿49/ทริป** |

### 5.3 Competitive Moat (ข้อได้เปรียบที่แข่งยาก)

1. **Network Effect** — ยิ่งมีบริษัทใช้มาก → Posts marketplace ยิ่งแข็ง → ลูกค้าเข้ามาดูมากขึ้น → ดึงบริษัทใหม่
2. **Switching Cost** — เมื่อบริษัทมี trip portfolio + posts บนแพลตฟอร์มแล้ว ไม่อยากย้าย (เสีย portfolio + link เก่าหาย + เสีย marketplace presence)
3. **Viral Distribution** — ทุก trip plan = marketing ฟรี ผ่าน "Powered by" badge
4. **Localization** — ออกแบบมาสำหรับตลาดไทย + ใช้ LINE เป็น delivery channel (คู่แข่งต่างชาติไม่ทำ)
5. **Marketplace Lock-in** — Posts สร้าง competitive marketplace → บริษัทต้องอยู่เพื่อไม่เสียพื้นที่ให้คู่แข่ง

---

## 6. Business Model

### 6.1 Revenue Streams

```
┌────────────────────────────────────────────────────────────┐
│        Revenue Model: Pay-per-Trip + Packs (Hybrid)        │
│                                                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Free    │  │ Pay-per-Trip │  │  Packs               │ │
│  │  3 ทริป  │  │ ฿49/ทริป     │  │  5 ทริป: ฿199        │ │
│  │  ฟรี     │  │              │  │  10 ทริป: ฿349       │ │
│  │          │  │              │  │                      │ │
│  └──────────┘  └──────────────┘  └──────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Subscription — กำลังพิจารณาเป็นตัวเลือกเพิ่มเติม    │  │
│  │  TBD — รอคุยกับทีมการตลาด                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Future: Travel Points / Elite Member                      │
│  (TBD — รอคุยกับทีมการตลาด คำนวณต้นทุนก่อน)              │
└────────────────────────────────────────────────────────────┘
```

### 6.2 Pricing Strategy

| Tier | ราคา | ราคาต่อทริป | Target | จุดขาย |
|---|---|---|---|---|
| **Free** | 0 บาท (3 ทริป) | ฟรี | ทุกคน | ทดลองใช้, สร้าง awareness |
| **Pay-per-Trip** | ฿49/ทริป | ฿49 | ไกด์ที่จัดไม่บ่อย | ยืดหยุ่น ไม่ต้อง commit |
| **Pack 5** | ฿199 | ฿39.8 | ไกด์อิสระ | ประหยัดกว่าซื้อรายทริป |
| **Pack 10** | ฿349 | ฿34.9 | บริษัททัวร์ SME | คุ้มที่สุด |
| **Subscription** | TBD — รอคุยกับทีมการตลาด | TBD | บริษัทที่จัดทริปเยอะ | กำลังพิจารณา |

**หมายเหตุ:** ราคาข้างต้นยังไม่สรุป — รอคุยกับทีมการตลาดและคำนวณต้นทุนก่อน

**Pricing Rationale:**
- ฿49/ทริป = ค่ากาแฟ 1 แก้ว → barrier ต่ำมากสำหรับ B2B
- เทียบกับ LINE OA (1,500+ บ/เดือน) ถูกกว่าหลายเท่า
- เทียบกับเวลาที่ประหยัดได้ (30 นาที/ครั้ง × 5 ครั้ง/เดือน = 2.5 ชม.) → คุ้ม
- Pay-per-trip ตรงกับพฤติกรรมจริง — ไกด์อิสระอาจจัดแค่ 2-3 ทริป/เดือน ไม่อยากจ่ายรายเดือน

### 6.3 Unit Economics

```
Average Revenue Per Trip:
  Pay-per-Trip: ฿49
  Pack 5:       ฿39.8/ทริป
  Pack 10:      ฿34.9/ทริป
  Blended:      ~฿42/ทริป (สมมติ mix)

Average Trips per Account per Month:
  บริษัททัวร์ SME:  ~10 ทริป → ~฿420/เดือน
  ไกด์อิสระ:       ~3 ทริป  → ~฿126/เดือน
  Blended ARPA:    ~฿250/เดือน

Cost Per Account:
  Hosting:        ~5 บ/account/เดือน (at 100 accounts)
  Notification (LINE + Web Push): ฟรี
  Payment fee:    ~9 บ/account/เดือน (3.65% of 250)
  Support:        ~20 บ/account/เดือน (estimated)
  Total:          ~34 บ/account/เดือน

Gross Margin:     (250 - 34) / 250 = 86%

Customer Lifetime Value (LTV):
  สมมติ average lifetime 18 เดือน, churn 5%/เดือน
  LTV = 250 × 18 = 4,500 บาท

Customer Acquisition Cost (CAC):
  Phase 1: ใกล้ 0 (viral + referral + organic)
  Phase 2: ~500-1,000 บ/customer (Facebook ads targeting ทัวร์)

LTV:CAC Ratio: 4.5:1 → 9:1 (ดีมาก, >3:1 ถือว่า healthy)
```

---

## 7. Go-to-Market Strategy

### 7.1 Phase 1: Validate (เดือน 1-3) — งบ: 0 บาท

**เป้าหมาย:** พิสูจน์ว่า pain point แรงพอ + product ใช้ได้จริง

| สัปดาห์ | Action | KPI |
|---|---|---|
| 1-2 | ให้เพื่อน 1 บริษัทใช้ pilot (ทริปในประเทศ) | สร้าง 3 ทริปจริง |
| 3-4 | สังเกต + เก็บ feedback จากเพื่อนและลูกทริป | NPS > 7 |
| 5-8 | ปรับ product ตาม feedback + เปิด Posts ให้ลอง | ลูกทริปเปิดดูจริง > 80% |
| 9-12 | ขอ referral จากเพื่อน → 3-5 บริษัทเพิ่ม | 5 companies, 15+ ทริป |

**คำถามสำคัญที่ต้องได้คำตอบใน Phase 1:**
1. บริษัททัวร์ใช้จริงไหม? (ไม่ใช่แค่ "น่าสนใจ")
2. ลูกทริปเปิดดูจริงไหม? (ไม่ใช่แค่ "ดีนะ")
3. ฟีเจอร์ notification + รับทราบ มีคนใช้จริงไหม?
4. Posts ช่วยดึงทราฟฟิกให้บริษัทจริงไหม?

### 7.2 Phase 2: Early Adopters (เดือน 4-6) — งบ: ~5,000 บาท/เดือน

**เป้าหมาย:** หา 30 paying customers

| Channel | วิธี | งบ |
|---|---|---|
| Facebook Groups | โพสต์ใน "ชมรมไกด์" "กลุ่มบริษัททัวร์" | ฟรี |
| Referral program | ลูกค้าเดิมแนะนำ → ได้ 1 ทริปฟรี | ~1,000 บ/เดือน |
| Facebook Ads | Target: เจ้าของธุรกิจท่องเที่ยว, ไกด์ | ~3,000 บ/เดือน |
| Content marketing | เขียนบทความ "ปัญหาส่ง itinerary" | ~1,000 บ/เดือน |

### 7.3 Phase 3: Growth (เดือน 7-12) — งบ: ~15,000 บาท/เดือน

**เป้าหมาย:** 100+ accounts, product-market fit

| Channel | วิธี | งบ |
|---|---|---|
| Organic (Powered by) | ลูกทริปเห็น → แนะนำบริษัทตัวเอง | ฟรี |
| Info Website (Posts) | บริษัทโพสต์ทัวร์ → คนค้นหาเจอ → organic traffic | ฟรี |
| SEO | "ระบบจัดการทัวร์" "ส่ง itinerary ลูกค้า" | ~3,000 บ/เดือน |
| Partnership | ร่วมมือกับ สมาคมไกด์ / TAT | ~2,000 บ/เดือน |
| Facebook/Google Ads | Scale ads ที่ work จาก Phase 2 | ~10,000 บ/เดือน |

### 7.4 Viral Loop (เครื่องจักรโตฟรี)

```
บริษัททัวร์สร้าง 1 ทริป
  → ลูกทริป 30 คนเปิดดู
    → 10 คนแชร์ให้เพื่อน/ครอบครัว
      → 40+ คนเห็น "Powered by NatGan"
        → บางคนเป็นเจ้าของธุรกิจทัวร์ / ไกด์
          → สมัครใช้งาน → สร้างทริปใหม่ → วงจรซ้ำ

+ Posts บน Info Website
  → คนค้นหาทัวร์เจอ → เห็น platform → บริษัทอื่นเห็น → สมัครโพสต์ด้วย

10 บริษัท × 10 ทริป/เดือน × 40 คนเห็น = 4,000 impressions/เดือน ฟรี
```

---

## 8. Financial Projections

### 8.1 Investment Required

#### เงินลงทุนเริ่มต้น

| รายการ | จำนวน | หมายเหตุ |
|---|---|---|
| จดบริษัท | 15,000 บาท | บจก. หรือ หจก. |
| Domain + Branding | 3,000 บาท | .co domain + logo |
| Infrastructure (6 เดือนแรก) | 12,000 บาท | Hosting + DB + services |
| Marketing (6 เดือนแรก) | 30,000 บาท | Ads + content |
| Legal (PDPA, Terms) | 10,000 บาท | ว่าจ้างทำ |
| Contingency (20%) | 14,000 บาท | สำรอง |
| **รวม** | **~84,000 บาท** | |

**หมายเหตุ:** ต้นทุนพัฒนา = 0 บาท (ทีมพัฒนาเอง) ถ้าต้องจ้าง dev ต้นทุนจะเพิ่ม ~200,000-400,000 บาท

#### ต้นทุนรายเดือน (หลัง launch)

| รายการ | เดือน 1-6 | เดือน 7-12 | ปีที่ 2 |
|---|---|---|---|
| Hosting (Vercel) | 700 | 700 | 1,400 |
| Database (PostgreSQL self-host VPS) | 0 (free) | 900 | 900 |
| Email service | 0 | 300 | 300 |
| Marketing | 5,000 | 15,000 | 20,000 |
| Payment gateway fee | 0 | 500 | 2,000 |
| Misc | 500 | 1,000 | 2,000 |
| **รวม/เดือน** | **~6,200** | **~18,400** | **~26,600** |

### 8.2 Revenue Forecast (3 ปี)

#### Scenario: Conservative (Pay-per-Trip based)

| | ปี 1 | ปี 2 | ปี 3 |
|---|---|---|---|
| Free accounts | 200 | 1,000 | 3,000 |
| Paying accounts | 15 | 80 | 250 |
| Avg trips/account/เดือน | 5 | 6 | 8 |
| Blended price/trip | ฿42 | ฿40 | ฿38 |
| Monthly revenue (ม.ค.) | 1,500 | 12,000 | 45,000 |
| Monthly revenue (ธ.ค.) | 6,000 | 30,000 | 76,000 |
| **Annual revenue** | **~45,000** | **~250,000** | **~725,000** |
| Annual cost | ~180,000 | ~260,000 | ~350,000 |
| **Net P&L** | **-135,000** | **-10,000** | **+375,000** |

#### Scenario: Optimistic

| | ปี 1 | ปี 2 | ปี 3 |
|---|---|---|---|
| Free accounts | 500 | 3,000 | 10,000 |
| Paying accounts | 30 | 200 | 600 |
| Avg trips/account/เดือน | 6 | 8 | 10 |
| Blended price/trip | ฿42 | ฿40 | ฿38 |
| Monthly revenue (ธ.ค.) | 12,000 | 64,000 | 228,000 |
| **Annual revenue** | **~90,000** | **~500,000** | **~1,800,000** |
| Annual cost | ~200,000 | ~350,000 | ~500,000 |
| **Net P&L** | **-110,000** | **+150,000** | **+1,300,000** |

**หมายเหตุ:** ตัวเลข revenue ทั้งหมดเป็นประมาณการเบื้องต้น — ราคาจริง TBD รอคุยกับทีมการตลาด

### 8.3 Break-even Analysis

```
Monthly fixed cost (average year 1): ~12,000 บ/เดือน
Blended revenue/trip: ~฿42
Variable cost per account: ~34 บ/เดือน
Average trips/paying account: ~5 ทริป/เดือน
Revenue per account: ~210 บ/เดือน
Contribution margin: 176 บ/account

Break-even accounts = 12,000 / 176 = ~68 paying accounts

Timeline to break-even:
  Conservative: เดือนที่ 18-24
  Optimistic:   เดือนที่ 10-14
```

---

## 9. Architecture

### 9.1 System Overview (4 ส่วน)

```
┌─────────────────────────────────────────────────────────────┐
│                     NatGan Platform                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ trip-web-    │  │ trip-web-    │  │ trip-web-        │  │
│  │ admin        │  │ client       │  │ staff            │  │
│  │              │  │              │  │                  │  │
│  │ Dashboard    │  │ Guest view   │  │ Backend admin    │  │
│  │ สำหรับบริษัท  │  │ + Member     │  │ (to be           │  │
│  │ /ไกด์/       │  │ dashboard    │  │  developed)      │  │
│  │ personal     │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Info Website (พัฒนาโดย Nes)                          │   │
│  │ เว็บไซต์สาธารณะแสดง Posts (Tour Package Listings)     │   │
│  │ คนทั่วไปเข้าดูได้ → ดึงทราฟฟิกให้บริษัทบน platform   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Client App — 2 ระดับ

| ระดับ | การเข้าถึง | Features |
|---|---|---|
| **Guest** | เปิด URL ดูได้เลย ไม่ต้อง login (core value) | ดู trip plan, QR scan, โหมดยื่น ตม. |
| **Member** | สมัครสมาชิก (optional) | ประวัติทริป, notifications, Travel Points (อนาคต) |

### 9.3 Portfolio

หน้าสาธารณะสำหรับแต่ละบริษัท/ไกด์ แสดง:
- ทริปที่เคยจัดและ publish แล้ว
- ข้อมูลบริษัท, ช่องทางติดต่อ
- สร้างความน่าเชื่อถือ + เป็น sales tool

---

## 10. SWOT Analysis

### Strengths (จุดแข็ง)

| จุดแข็ง | ผลกระทบ |
|---|---|
| **Working prototype พร้อมใช้ (ทั้ง Trips + Posts)** | ลดเวลา go-to-market, demo ได้เลย |
| **ทีมพัฒนาเอง = ต้นทุนต่ำ** | ไม่ต้อง raise fund ก้อนใหญ่ |
| **แก้ pain point ที่ชัดเจน 2 อย่าง** (communication + tour listing) | ตอบโจทย์ครบ ดึงดูดได้กว้าง |
| **Dual notification (LINE + Web Push)** | ไม่ต้องเปลี่ยนพฤติกรรมผู้ใช้ + รองรับต่างชาติ |
| **Product = Marketing (viral loop)** | CAC ต่ำ โตได้แบบ organic |
| **i18n 3 ภาษาพร้อม** | ขยายตลาด inbound tour ได้ |
| **Gross margin สูง (~86%)** | Scale ได้โดยไม่ต้องเพิ่มต้นทุนมาก |
| **Posts สร้าง marketplace effect** | Network effect + lock-in สำหรับบริษัท |
| **รองรับ 3 account types** (Company, Freelance, Personal) | ครอบคลุม B2B + B2C |

### Weaknesses (จุดอ่อน)

| จุดอ่อน | วิธีรับมือ |
|---|---|
| **ทีมเล็ก (1-2 คน)** | เน้น MVP, ไม่ over-build |
| **ไม่มี network ในวงการทัวร์** | ใช้เพื่อน 1 บริษัทเป็น foothold → referral |
| **ยังไม่มี brand awareness** | viral loop + content marketing + Powered by badge + Posts SEO |
| **Revenue per trip ต่ำ (฿34.9-49)** | ต้อง volume สูง หรือ เพิ่ม subscription/enterprise tier |
| **ขึ้นอยู่กับ external API (LINE Messaging API)** | มี Web Push เป็นช่องทางหลักคู่กันตั้งแต่ launch — ไม่พึ่ง LINE อย่างเดียว |
| **Pricing ยังไม่สรุป** | รอคุยกับทีมการตลาด ต้องคำนวณต้นทุนก่อน |
| **ทีมไม่มี use case ตรงในวงการทัวร์** | ใช้ Support Ticket เป็นช่องทางรับ feedback จากผู้ใช้จริง |

### Opportunities (โอกาส)

| โอกาส | ศักยภาพ |
|---|---|
| **ตลาดท่องเที่ยวไทยฟื้นตัวหลัง COVID** | ดีมานด์เพิ่มขึ้นทุกปี |
| **ไกด์อิสระเพิ่มขึ้นมาก** | ตลาดใหม่ที่ต้องการเครื่องมือ + ไม่มีงบทำเว็บ → Posts ตอบโจทย์ |
| **Inbound tourism กลับมา** | ขยายไป multilingual trip plan |
| **ยังไม่มี direct competitor** ในไทย | First mover advantage |
| **ขยายไป SEA** (เวียดนาม, อินโดนีเซีย) | ปัญหาเดียวกัน, ใช้ LINE เหมือนกัน |
| **Partnership กับ TAT / สมาคมไกด์** | Distribution channel ฟรี |
| **Trip plan เก่า = Portfolio / Sales tool** | เพิ่ม value ให้ B2B ยอมจ่ายต่อ |
| **B2C Personal users** | เพิ่ม "Powered by" exposure + อาจ convert เป็น B2B ในอนาคต |
| **Travel Points / Elite Member (อนาคต)** | เพิ่ม engagement + revenue stream ใหม่ (TBD — รอคุยกับทีมการตลาด) |

### Threats (ภัยคุกคาม)

| ภัยคุกคาม | ความรุนแรง | วิธีรับมือ |
|---|---|---|
| **AI Gen Trip พัฒนาเร็ว** จนมี notification | สูง | เน้น B2B + agency branding + marketplace ที่ AI gen ไม่สน |
| **LINE เปิด feature itinerary เอง** | สูง | สร้าง value อื่นที่ LINE ไม่ทำ (analytics, portfolio, branding, posts marketplace) |
| **บริษัททัวร์ไม่เปลี่ยนพฤติกรรม** | สูง | ทำ onboarding ง่ายมาก, ให้ value ตั้งแต่ free tier (3 ทริปฟรี) |
| **คู่แข่งต่างชาติเข้าไทย** | กลาง | Localization + LINE integration + Thai marketplace = moat |
| **Revenue ต่ำเกินกว่าจะ sustain** | กลาง | ปรับ pricing, เพิ่ม subscription tier, เพิ่ม pack sizes |
| **LINE Messaging API เปลี่ยน pricing/policy** (หมายเหตุ: LINE Notify ถูกยกเลิกแล้ว เม.ย. 2025 — ปัจจุบันใช้ LINE Messaging API แทน) | ต่ำ | มี Web Push เป็นช่องทางหลักอยู่แล้ว + เพิ่ม email ในอนาคต |
| **Pay-per-trip model ทำให้ revenue ไม่ predictable** | กลาง | เสนอ pack ที่ซื้อล่วงหน้า + พิจารณา subscription option |

---

## 11. สิ่งที่ตลาดยังมองไม่เห็น (Hidden Insights)

### 11.1 Trip Plan เก่า ≠ ขยะ แต่ = Sales Tool

ทุกคนมอง itinerary เป็น "ของใช้แล้วทิ้ง" — ส่งลูกทริป ใช้เสร็จ ลบทิ้ง

**ความจริง:** Trip plan เก่าที่ยังเข้าถึงได้ = **portfolio ที่ขายตัวเอง**
- ลูกทริปแชร์ให้เพื่อน → เพื่อนเห็น route → สนใจ → ติดต่อบริษัท
- บริษัทส่ง link ทริปเก่าให้ลูกค้าใหม่ดู → "เราจัดแบบนี้ สนใจไหม"
- **ถ้าบริษัทหยุดใช้ → portfolio หาย → เสีย sales tool → ยอมซื้อทริปต่อ**

นี่คือเหตุผลที่ churn จะต่ำ

### 11.2 "คนจัดทริป" ในกลุ่มเพื่อน = Micro-influencer ฟรี

ทุกกลุ่มเพื่อนมี 1 คนที่เป็น "คนจัดทริป" — คนนี้คือ power user ของ free tier (Personal account)
- เขาจัดทริป → 10-15 คนเห็นแพลตฟอร์ม
- ถ้าในกลุ่มมีคนทำธุรกิจทัวร์ → เห็น → สมัคร B2B
- **B2C free users ไม่ได้สร้าง revenue โดยตรง แต่เป็น distribution channel ที่ดีที่สุด**
- Pain point จริง: เพื่อนนัดเที่ยวแต่ไม่มีใครวางแผน → ไปถึงเสียเวลา → NatGan ช่วยให้มีแผนพร้อมก่อนเดินทาง

### 11.3 Notification ≠ Feature แต่ = ความรับผิดชอบ

สำหรับบริษัททัวร์ การไม่แจ้งลูกค้าเมื่อ plan เปลี่ยน = **ความเสี่ยงทางธุรกิจ**
- ลูกทริปไปผิดที่ → complain → รีวิวแย่ → เสียลูกค้า
- กรณีเลวร้าย: อุบัติเหตุ / เหตุฉุกเฉิน ที่ลูกทริปไม่รู้ → ปัญหาทางกฎหมาย

**NatGan เปลี่ยน notification จาก "nice to have" เป็น "ต้องมี" สำหรับบริษัทที่ professional**

Frame การขายไม่ใช่ "ใช้เพื่อความสะดวก" แต่ "ใช้เพื่อความรับผิดชอบต่อลูกค้า"

### 11.4 ตลาด Inbound ที่ยังไม่มีใครจับ

บริษัททัวร์ไทยที่รับลูกค้าต่างชาติ (จีน, ญี่ปุ่น, เกาหลี, ฝรั่ง):
- ต้องส่ง itinerary เป็นภาษาลูกค้า
- ปัจจุบัน: แปลเอง ส่ง PDF ภาษาอังกฤษ
- **NatGan: สร้าง plan เดียว → แสดงหลายภาษา → i18n ที่มีอยู่แล้วตอบโจทย์พอดี**

ตรงนี้ยังไม่มี competitor เลยในตลาดไทย

### 11.5 ยื่นหน้าจอแทนปริ้นกระดาษให้ ตม. — Pain Point ที่ไม่มีใครพูดถึง

ทุกทริปต่างประเทศ บริษัททัวร์ต้อง:
- ปริ้น itinerary 30 ชุด × 5-8 หน้า = **150-240 แผ่น ต่อทริป**
- ถ้ามีเปลี่ยนแปลง → ปริ้นใหม่ทั้งหมด
- ลูกทัวร์ต้องพกกระดาษ → ยับ / หาย / ลืม

**NatGan: ลูกทัวร์เปิด link บนมือถือ → กด "โหมดยื่น ตม." → ยื่นหน้าจอ → จบ**

- แสดงภาษาท้องถิ่นของ destination อัตโนมัติ (ไปญี่ปุ่น → แสดงญี่ปุ่น, ไปอังกฤษ → แสดงอังกฤษ)
- ข้อมูลครบ: เที่ยวบิน, ที่พัก, itinerary รายวัน, ข้อมูลบริษัททัวร์
- ใช้ offline ได้ (cache ไว้ตอนยังมี WiFi)
- **ลดต้นทุนกระดาษ + ลดงานบริษัท + ลูกทัวร์สะดวก → win-win-win**

ฟีเจอร์นี้ทำให้ NatGan ไม่ใช่แค่ "nice to have" แต่เป็น **เครื่องมือที่ขาดไม่ได้สำหรับทริปต่างประเทศ**

### 11.6 Posts Marketplace = ทดแทนเว็บไซต์ส่วนตัว

ไกด์อิสระส่วนใหญ่ไม่มีงบทำเว็บไซต์ → ใช้แค่ Facebook โพสต์ขาย → ไม่มี professional landing page

**NatGan Posts:**
- สร้างพื้นที่แสดงทัวร์แพ็คเกจบน Info Website
- ไม่ต้องทำเว็บเอง ไม่ต้องจ่ายค่า hosting
- บริษัทแข่งขันกันบน NatGan → platform ยิ่งมีคุณค่า
- **ไม่มีระบบ booking** — บริษัทปิดการขายเอง (ลด complexity + บริษัทไม่ต้องจ่ายค่า commission)

---

## 12. Team

### ปัจจุบัน
- **Founder/Developer** — Full-stack developer, มีประสบการณ์พัฒนา web application, เข้าใจ pain point จากการจัดทริปเอง
- **Nes** — พัฒนา Info Website (หน้าเว็บสาธารณะสำหรับ Posts)

### ในอนาคต (เมื่อ revenue > 50,000 บ/เดือน)
- **Part-time BD/Sales** — คนที่มี network ในวงการทัวร์
- **Part-time Designer** — ปรับ UX/UI ตาม user feedback
- **Marketing Team** — คุยเรื่อง pricing strategy + Travel Points

---

## 13. Milestones & Timeline

```
2026 Q2 (เม.ย. - มิ.ย.)
├── MVP development complete (Trips + Posts)
├── Pilot กับเพื่อน 1 บริษัท
├── Collect feedback round 1
├── Info Website launch (by Nes)
└── ✅ Go/No-go decision

2026 Q3 (ก.ค. - ก.ย.)
├── Onboard 5-10 บริษัท (free 3 ทริป)
├── Launch payment system (pay-per-trip + packs)
├── First paying customer
├── สรุป pricing กับทีมการตลาด
└── ✅ Product-market fit signal

2026 Q4 (ต.ค. - ธ.ค.)
├── 30+ paying accounts
├── Launch B2C Personal tier publicly
├── Content marketing + SEO
├── Portfolio feature live
└── ✅ Break-even on infrastructure

2027 H1
├── 80-150 paying accounts
├── Launch template system
├── Partnership with ไกด์ associations
├── พิจารณา subscription option / Travel Points
└── ✅ Net profitable

2027 H2
├── 200-300 paying accounts
├── Multilingual trip plan
├── Explore SEA expansion
├── trip-web-staff development
└── ✅ Monthly revenue > 100,000 บ
```

---

## 14. Ask (สิ่งที่ต้องการ)

### ถ้า Bootstrap (ไม่หานักลงทุน)
- **เงินลงทุน:** ~84,000 บาท (จากเงินตัวเอง)
- **เวลา:** 3-4 เดือน part-time สำหรับ MVP
- **Network:** เพื่อน 1 บริษัท + referral
- **Break-even:** เดือนที่ 18-24
- **ข้อดี:** เป็นเจ้าของ 100%, ตัดสินใจเร็ว, ไม่มีแรงกดดันจากนักลงทุน

### ถ้าหานักลงทุน (Angel / Pre-seed)
- **จำนวนที่ต้องการ:** 300,000 - 500,000 บาท
- **ใช้สำหรับ:**
  - Development acceleration (3 เดือนเต็มเวลาแทน 6 เดือน part-time)
  - Marketing budget 6 เดือน (~90,000 บาท)
  - Runway 6 เดือน (infra + operational)
  - Legal + compliance
- **Equity:** 10-15%
- **Break-even:** เดือนที่ 10-14
- **ข้อดี:** ไปเร็วกว่า, ได้ network จากนักลงทุน

### Recommended: Bootstrap → Validate → Raise (ถ้าจำเป็น)
เหตุผล: ลงทุนเริ่มต้นต่ำพอที่จะ bootstrap ได้ ควร validate ก่อน แล้วค่อย raise เมื่อมี traction จริง → valuation ดีกว่า, เสีย equity น้อยกว่า

---

## 15. Summary

**NatGan แก้ปัญหาที่มีอยู่จริง ในตลาดที่ยังไม่มีใครแก้ — ทั้งการสื่อสาร itinerary และการโปรโมตทัวร์**

| | |
|---|---|
| **ปัญหา** | (1) แก้ plan แล้วลูกทริปไม่รู้ (2) ไกด์ไม่มีเว็บโปรโมตทัวร์ (3) กลุ่มเพื่อนไม่มีใครวางแผน |
| **Solution** | Live itinerary + LINE & Web Push notification + read receipt + Tour Package Listings |
| **ตลาด** | 28,000+ บริษัททัวร์ + ไกด์อิสระในไทย + คนทั่วไป |
| **Account Types** | Company (TAT license), Freelance Guide, Personal |
| **Revenue** | Free 3 ทริป → ฿49/ทริป หรือ Pack 5 (฿199) / Pack 10 (฿349) |
| **ลงทุน** | ~84,000 บาท (bootstrap) |
| **Break-even** | เดือนที่ 18-24 |
| **Moat** | Viral loop + switching cost + dual notification + marketplace lock-in |
| **สิ่งที่ต้องพิสูจน์** | บริษัททัวร์ใช้จริง + ลูกทริปเปิดดูจริง + ยอมจ่าย + Posts ดึงทราฟฟิก |

> **หมายเหตุ:** Pricing ยังไม่สรุป — TBD รอคุยกับทีมการตลาด คำนวณต้นทุนก่อน

> **Next step:** Pilot กับเพื่อน 1 บริษัท — ถ้าเขาใช้แล้วบอกว่า "ดีกว่าส่ง PDF ทาง Line จริงๆ" → เรามี business

---

*Document End — NatGan Business Plan v2.0*
*Confidential — Not for public distribution*
