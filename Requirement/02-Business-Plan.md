# Business Plan
# NatGan (นัดกัน) — Trip Communication Platform

**Version:** 1.0
**Date:** 17 March 2026
**Prepared for:** Investor Presentation
**Confidential**

---

## 1. Executive Summary

**NatGan** คือ SaaS platform สำหรับบริษัททัวร์และไกด์อิสระ ที่เปลี่ยนวิธีสื่อสาร itinerary กับลูกทริป จากการส่ง PDF/รูปใน LINE ที่จมหาย → เป็นระบบ **live itinerary** ที่แก้ไขได้ แจ้งเตือนอัตโนมัติ และรู้ว่าใครเห็นแล้วใครยังไม่เห็น

### One-line Pitch
> **"แก้ plan เมื่อไหร่ ลูกทริปรู้เมื่อนั้น"**

### Key Numbers
- ตลาดบริษัททัวร์ไทย: ~8,000-10,000 ราย active
- ไกด์อิสระ: ~20,000+ คน
- คนไทยเที่ยวในประเทศ: ~200 ล้านทริป/ปี
- คนไทยเที่ยวต่างประเทศ: ~10 ล้านทริป/ปี
- **ยังไม่มี solution ที่แก้ปัญหา "แก้ plan แล้วลูกทริปไม่รู้" โดยตรง**

---

## 2. Problem

### 2.1 สถานการณ์จริงที่เกิดขึ้นทุกวัน

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

### 2.2 ทำไมปัญหานี้ยังไม่ถูกแก้

| Solution ที่มีอยู่ | ทำไมแก้ไม่ได้ |
|---|---|
| **LINE Group** | ข้อมูลจมในแชท, ไม่มี read receipt สำหรับ itinerary, ส่งรูปแล้วหาไม่เจอ |
| **PDF / Canva** | Static, แก้ทีต้องส่งไฟล์ใหม่, ลูกทริปไม่รู้ว่าอันไหนล่าสุด |
| **AI Gen Trip** | สวยแต่เป็นภาพนิ่ง, แก้ไขไม่ได้, ไม่มี notification, ไม่รองรับ B2B |
| **LINE OA** | ค่าใช้จ่ายสูง (1,500+ บ/เดือน), ไม่ได้ออกแบบมาเพื่อ itinerary |

### 2.3 ขนาดของปัญหา

- บริษัททัวร์เฉลี่ยมีการเปลี่ยน itinerary **3-5 ครั้ง/เดือน** (สภาพอากาศ, สถานที่ปิด, เปลี่ยนร้านอาหาร)
- ไกด์ใช้เวลา **30 นาที - 1 ชั่วโมง/ครั้ง** ในการแจ้งและโทรตามลูกทริป
- **ลูกทริปที่ไม่เห็นข้อความ = ปัญหาหน้างานทุกครั้ง**

---

## 3. Solution

### 3.1 NatGan คืออะไร

**Trip Communication Tool** — ไม่ใช่แค่ trip planner

```
Admin (บริษัททัวร์/ไกด์)          ลูกทริป
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

### 3.3 ทำไมต้องเป็นเรา

1. **เข้าใจ pain point จากประสบการณ์ตรง** — ทีมเคยจัดทริปและเจอปัญหานี้เอง
2. **มี working prototype แล้ว** — ไม่ใช่แค่ idea, มี trip plan ที่ใช้งานได้จริง, UX สวย, responsive, รองรับ 3 ภาษา
3. **ต้นทุนพัฒนาต่ำ** — ทีมพัฒนาเองได้ ไม่ต้องจ้าง outsource
4. **ไม่แข่งกับ LINE แต่ใช้ LINE + Web Push** — ส่ง noti ผ่าน LINE Messaging API (LINE OA) + Web Push Notification ลูกทริปไม่ต้องเปลี่ยนพฤติกรรม รองรับทั้งคนไทยและต่างชาติ
5. **Product = Marketing** — ทุก trip plan ที่ถูกแชร์ มี "Powered by NatGan" = viral loop ฟรี
6. **แก้ปัญหาที่ไม่มีใครแก้: ปริ้นเอกสารให้ ตม.** — ลูกทัวร์ยื่นหน้าจอแทนกระดาษ แสดงภาษาท้องถิ่น destination อัตโนมัติ

---

## 4. Market Analysis

### 4.1 Target Market

**Primary: บริษัททัวร์ขนาดเล็ก-กลาง + ไกด์อิสระ (B2B)**

| Segment | จำนวน | ลักษณะ | ทำไมเป็น target |
|---|---|---|---|
| บริษัททัวร์ SME | ~8,000 ราย | 1-10 คน, จัด 5-20 ทริป/เดือน | ไม่มีระบบ ใช้ LINE + PDF |
| ไกด์อิสระ | ~20,000 คน | ทำคนเดียว, 2-5 ทริป/เดือน | ต้องการเครื่องมือดูเป็นมืออาชีพ |

**Secondary: คนทั่วไปที่จัดทริปกลุ่ม (B2C)**

| Segment | ลักษณะ | Purpose |
|---|---|---|
| "คนจัดทริป" ในกลุ่มเพื่อน | มีทุกกลุ่ม 1 คน | ใช้ free tier, สร้าง awareness |
| ผู้จัดงาน outing บริษัท | HR / Admin | อาจ convert เป็น paying user |

### 4.2 Total Addressable Market (TAM)

```
บริษัททัวร์ SME:    8,000 × 299 บ/เดือน × 12  = 28.7 ล้านบาท/ปี
ไกด์อิสระ:         20,000 × 39 บ/เดือน × 12   = 9.4 ล้านบาท/ปี
TAM รวม:           ~38 ล้านบาท/ปี
```

### 4.3 Serviceable Addressable Market (SAM)

สมมติเข้าถึง 10% ของตลาดใน 3 ปี:
```
SAM = 38 × 10% = 3.8 ล้านบาท/ปี (~317,000 บ/เดือน)
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
      (Wanderlog,        │       (Live + Notification)
       TripAdvisor AI)   │
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
| ราคา | ฟรี | ฟรี-500บ | ฟรี-$10 | **ฟรี-599บ** |

### 5.3 Competitive Moat (ข้อได้เปรียบที่แข่งยาก)

1. **Network Effect** — ยิ่งมีบริษัทใช้มาก → ลูกทริปเห็นแพลตฟอร์มมากขึ้น → แนะนำบริษัทอื่น → วงจรโต
2. **Switching Cost** — เมื่อบริษัทมี trip portfolio บนแพลตฟอร์มแล้ว ไม่อยากย้าย (เสีย portfolio + link เก่าหาย)
3. **Viral Distribution** — ทุก trip plan = marketing ฟรี ผ่าน "Powered by" badge
4. **Localization** — ออกแบบมาสำหรับตลาดไทย + ใช้ LINE เป็น delivery channel (คู่แข่งต่างชาติไม่ทำ)

---

## 6. Business Model

### 6.1 Revenue Streams

```
┌────────────────────────────────────────────────────┐
│              Revenue Model: SaaS + Usage            │
│                                                    │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Subscription │  │ Pay-per- │  │ Future:      │ │
│  │ (Monthly)    │  │ slot     │  │ Enterprise   │ │
│  │              │  │          │  │ API license  │ │
│  │ Pro: 299 บ   │  │ 39 บ/   │  │              │ │
│  │ Biz: 599 บ   │  │ slot    │  │ Custom       │ │
│  └──────────────┘  └──────────┘  └──────────────┘ │
│       70%              20%            10%          │
│    (target mix at scale)                           │
└────────────────────────────────────────────────────┘
```

### 6.2 Pricing Strategy

| Tier | ราคา | Target | จุดขาย |
|---|---|---|---|
| **Free** | 0 บาท | ไกด์เล็กๆ, คนทั่วไป | ทดลองใช้, สร้าง awareness |
| **Pro** | 299 บ/เดือน | ไกด์อิสระ, ทัวร์เล็ก | Unlimited edits, 30 slots, analytics |
| **Business** | 599 บ/เดือน | บริษัททัวร์ SME | Unlimited slots, white-label, priority support |
| **Pay-per-slot** | 39 บ/slot | Free user ที่ต้องการ slot เพิ่ม | ยืดหยุ่น ไม่ต้อง commit |

**Pricing Rationale:**
- 299 บาท/เดือน < ค่ากาแฟ 2 แก้ว → barrier ต่ำมากสำหรับ B2B
- เทียบกับ LINE OA (1,500+ บ/เดือน) ถูกกว่า 5 เท่า
- เทียบกับเวลาที่ประหยัดได้ (30 นาที/ครั้ง × 5 ครั้ง/เดือน = 2.5 ชม.) → คุ้ม

### 6.3 Unit Economics

```
Average Revenue Per Account (ARPA):
  Pro:      299 บ/เดือน
  Business: 599 บ/เดือน
  Blended:  ~400 บ/เดือน (สมมติ 60% Pro, 40% Business)

Cost Per Account:
  Hosting:        ~5 บ/account/เดือน (at 100 accounts)
  Notification (LINE + Web Push): ฟรี
  Payment fee:    ~15 บ/account/เดือน (3.65% of 400)
  Support:        ~20 บ/account/เดือน (estimated)
  Total:          ~40 บ/account/เดือน

Gross Margin:     (400 - 40) / 400 = 90%

Customer Lifetime Value (LTV):
  สมมติ average lifetime 18 เดือน, churn 5%/เดือน
  LTV = 400 × 18 = 7,200 บาท

Customer Acquisition Cost (CAC):
  Phase 1: ใกล้ 0 (viral + referral + organic)
  Phase 2: ~500-1,000 บ/customer (Facebook ads targeting ทัวร์)

LTV:CAC Ratio: 7.2:1 → 14.4:1 (ดีมาก, >3:1 ถือว่า healthy)
```

---

## 7. Go-to-Market Strategy

### 7.1 Phase 1: Validate (เดือน 1-3) — งบ: 0 บาท

**เป้าหมาย:** พิสูจน์ว่า pain point แรงพอ + product ใช้ได้จริง

| สัปดาห์ | Action | KPI |
|---|---|---|
| 1-2 | ให้เพื่อน 1 บริษัทใช้ pilot (ทริปในประเทศ) | สร้าง 3 ทริปจริง |
| 3-4 | สังเกต + เก็บ feedback จากเพื่อนและลูกทริป | NPS > 7 |
| 5-8 | ปรับ product ตาม feedback | ลูกทริปเปิดดูจริง > 80% |
| 9-12 | ขอ referral จากเพื่อน → 3-5 บริษัทเพิ่ม | 5 companies, 15+ ทริป |

**คำถามสำคัญที่ต้องได้คำตอบใน Phase 1:**
1. บริษัททัวร์ใช้จริงไหม? (ไม่ใช่แค่ "น่าสนใจ")
2. ลูกทริปเปิดดูจริงไหม? (ไม่ใช่แค่ "ดีนะ")
3. ฟีเจอร์ notification + รับทราบ มีคนใช้จริงไหม?

### 7.2 Phase 2: Early Adopters (เดือน 4-6) — งบ: ~5,000 บาท/เดือน

**เป้าหมาย:** หา 30 paying customers

| Channel | วิธี | งบ |
|---|---|---|
| Facebook Groups | โพสต์ใน "ชมรมไกด์" "กลุ่มบริษัททัวร์" | ฟรี |
| Referral program | ลูกค้าเดิมแนะนำ → ได้ 1 เดือนฟรี | ~1,000 บ/เดือน |
| Facebook Ads | Target: เจ้าของธุรกิจท่องเที่ยว, ไกด์ | ~3,000 บ/เดือน |
| Content marketing | เขียนบทความ "ปัญหาส่ง itinerary" | ~1,000 บ/เดือน |

### 7.3 Phase 3: Growth (เดือน 7-12) — งบ: ~15,000 บาท/เดือน

**เป้าหมาย:** 100+ accounts, product-market fit

| Channel | วิธี | งบ |
|---|---|---|
| Organic (Powered by) | ลูกทริปเห็น → แนะนำบริษัทตัวเอง | ฟรี |
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

#### Scenario: Conservative

| | ปี 1 | ปี 2 | ปี 3 |
|---|---|---|---|
| Free accounts | 200 | 1,000 | 3,000 |
| Paying accounts | 15 | 80 | 250 |
| ARPA | 300 บ | 350 บ | 400 บ |
| Monthly revenue (ม.ค.) | 1,500 | 12,000 | 50,000 |
| Monthly revenue (ธ.ค.) | 8,000 | 35,000 | 100,000 |
| **Annual revenue** | **~60,000** | **~280,000** | **~900,000** |
| Annual cost | ~180,000 | ~260,000 | ~350,000 |
| **Net P&L** | **-120,000** | **+20,000** | **+550,000** |

#### Scenario: Optimistic

| | ปี 1 | ปี 2 | ปี 3 |
|---|---|---|---|
| Free accounts | 500 | 3,000 | 10,000 |
| Paying accounts | 30 | 200 | 600 |
| ARPA | 350 บ | 400 บ | 450 บ |
| Monthly revenue (ธ.ค.) | 15,000 | 80,000 | 270,000 |
| **Annual revenue** | **~120,000** | **~650,000** | **~2,400,000** |
| Annual cost | ~200,000 | ~350,000 | ~500,000 |
| **Net P&L** | **-80,000** | **+300,000** | **+1,900,000** |

### 8.3 Break-even Analysis

```
Monthly fixed cost (average year 1): ~12,000 บ/เดือน
ARPA: ~350 บ/เดือน
Variable cost per account: ~40 บ/เดือน
Contribution margin: 310 บ/account

Break-even accounts = 12,000 / 310 = ~39 paying accounts

Timeline to break-even:
  Conservative: เดือนที่ 14-18
  Optimistic:   เดือนที่ 8-12
```

---

## 9. SWOT Analysis

### Strengths (จุดแข็ง)

| จุดแข็ง | ผลกระทบ |
|---|---|
| **Working prototype พร้อมใช้** | ลดเวลา go-to-market, demo ได้เลย |
| **ทีมพัฒนาเอง = ต้นทุนต่ำ** | ไม่ต้อง raise fund ก้อนใหญ่ |
| **แก้ pain point ที่ชัดเจนและเฉพาะเจาะจง** | Message ชัด ขายง่าย |
| **Dual notification (LINE + Web Push)** | ไม่ต้องเปลี่ยนพฤติกรรมผู้ใช้ + รองรับต่างชาติ |
| **Product = Marketing (viral loop)** | CAC ต่ำ โตได้แบบ organic |
| **i18n 3 ภาษาพร้อม** | ขยายตลาด inbound tour ได้ |
| **Gross margin สูง (~90%)** | Scale ได้โดยไม่ต้องเพิ่มต้นทุนมาก |

### Weaknesses (จุดอ่อน)

| จุดอ่อน | วิธีรับมือ |
|---|---|
| **ทีมเล็ก (1-2 คน)** | เน้น MVP, ไม่ over-build |
| **ไม่มี network ในวงการทัวร์** | ใช้เพื่อน 1 บริษัทเป็น foothold → referral |
| **ยังไม่มี brand awareness** | viral loop + content marketing + Powered by badge |
| **Revenue per account ต่ำ (299-599 บ)** | ต้อง volume สูง หรือ เพิ่ม enterprise tier |
| **ขึ้นอยู่กับ external API (LINE Messaging API)** | มี Web Push เป็นช่องทางหลักคู่กันตั้งแต่ launch — ไม่พึ่ง LINE อย่างเดียว |

### Opportunities (โอกาส)

| โอกาส | ศักยภาพ |
|---|---|
| **ตลาดท่องเที่ยวไทยฟื้นตัวหลัง COVID** | ดีมานด์เพิ่มขึ้นทุกปี |
| **ไกด์อิสระเพิ่มขึ้นมาก** | ตลาดใหม่ที่ต้องการเครื่องมือ |
| **Inbound tourism กลับมา** | ขยายไป multilingual trip plan |
| **ยังไม่มี direct competitor** ในไทย | First mover advantage |
| **ขยายไป SEA** (เวียดนาม, อินโดนีเซีย) | ปัญหาเดียวกัน, ใช้ LINE เหมือนกัน |
| **Partnership กับ TAT / สมาคมไกด์** | Distribution channel ฟรี |
| **Trip plan เก่า = Portfolio / Sales tool** | เพิ่ม value ให้ B2B ยอมจ่ายต่อ |

### Threats (ภัยคุกคาม)

| ภัยคุกคาม | ความรุนแรง | วิธีรับมือ |
|---|---|---|
| **AI Gen Trip พัฒนาเร็ว** จนมี notification | สูง | เน้น B2B + agency branding ที่ AI gen ไม่สน |
| **LINE เปิด feature itinerary เอง** | สูง | สร้าง value อื่นที่ LINE ไม่ทำ (analytics, portfolio, branding) |
| **บริษัททัวร์ไม่เปลี่ยนพฤติกรรม** | สูง | ทำ onboarding ง่ายมาก, ให้ value ตั้งแต่ free tier |
| **คู่แข่งต่างชาติเข้าไทย** | กลาง | Localization + LINE integration = moat |
| **Revenue ต่ำเกินกว่าจะ sustain** | กลาง | ปรับ pricing, เพิ่ม enterprise tier, หาช่องทาง upsell |
| **LINE Messaging API เปลี่ยน pricing/policy** (หมายเหตุ: LINE Notify ถูกยกเลิกแล้ว เม.ย. 2025 — ปัจจุบันใช้ LINE Messaging API แทน) | ต่ำ | มี Web Push เป็นช่องทางหลักอยู่แล้ว + เพิ่ม email ในอนาคต |

---

## 10. สิ่งที่ตลาดยังมองไม่เห็น (Hidden Insights)

### 10.1 Trip Plan เก่า ≠ ขยะ แต่ = Sales Tool

ทุกคนมอง itinerary เป็น "ของใช้แล้วทิ้ง" — ส่งลูกทริป ใช้เสร็จ ลบทิ้ง

**ความจริง:** Trip plan เก่าที่ยังเข้าถึงได้ = **portfolio ที่ขายตัวเอง**
- ลูกทริปแชร์ให้เพื่อน → เพื่อนเห็น route → สนใจ → ติดต่อบริษัท
- บริษัทส่ง link ทริปเก่าให้ลูกค้าใหม่ดู → "เราจัดแบบนี้ สนใจไหม"
- **ถ้าบริษัทหยุดจ่าย subscription → portfolio หาย → เสีย sales tool → ยอมจ่ายต่อ**

นี่คือเหตุผลที่ churn จะต่ำ

### 10.2 "คนจัดทริป" ในกลุ่มเพื่อน = Micro-influencer ฟรี

ทุกกลุ่มเพื่อนมี 1 คนที่เป็น "คนจัดทริป" — คนนี้คือ power user ของ free tier
- เขาจัดทริป → 10-15 คนเห็นแพลตฟอร์ม
- ถ้าในกลุ่มมีคนทำธุรกิจทัวร์ → เห็น → สมัคร B2B
- **B2C free users ไม่ได้สร้าง revenue โดยตรง แต่เป็น distribution channel ที่ดีที่สุด**

### 10.3 Notification ≠ Feature แต่ = ความรับผิดชอบ

สำหรับบริษัททัวร์ การไม่แจ้งลูกค้าเมื่อ plan เปลี่ยน = **ความเสี่ยงทางธุรกิจ**
- ลูกทริปไปผิดที่ → complain → รีวิวแย่ → เสียลูกค้า
- กรณีเลวร้าย: อุบัติเหตุ / เหตุฉุกเฉิน ที่ลูกทริปไม่รู้ → ปัญหาทางกฎหมาย

**NatGan เปลี่ยน notification จาก "nice to have" เป็น "ต้องมี" สำหรับบริษัทที่ professional**

Frame การขายไม่ใช่ "ใช้เพื่อความสะดวก" แต่ "ใช้เพื่อความรับผิดชอบต่อลูกค้า"

### 10.4 ตลาด Inbound ที่ยังไม่มีใครจับ

บริษัททัวร์ไทยที่รับลูกค้าต่างชาติ (จีน, ญี่ปุ่น, เกาหลี, ฝรั่ง):
- ต้องส่ง itinerary เป็นภาษาลูกค้า
- ปัจจุบัน: แปลเอง ส่ง PDF ภาษาอังกฤษ
- **NatGan: สร้าง plan เดียว → แสดงหลายภาษา → i18n ที่มีอยู่แล้วตอบโจทย์พอดี**

ตรงนี้ยังไม่มี competitor เลยในตลาดไทย

### 10.5 ยื่นหน้าจอแทนปริ้นกระดาษให้ ตม. — Pain Point ที่ไม่มีใครพูดถึง

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

---

## 11. Team

### ปัจจุบัน
- **Founder/Developer** — Full-stack developer, มีประสบการณ์พัฒนา web application, เข้าใจ pain point จากการจัดทริปเอง

### ในอนาคต (เมื่อ revenue > 50,000 บ/เดือน)
- **Part-time BD/Sales** — คนที่มี network ในวงการทัวร์
- **Part-time Designer** — ปรับ UX/UI ตาม user feedback

---

## 12. Milestones & Timeline

```
2026 Q2 (เม.ย. - มิ.ย.)
├── MVP development complete
├── Pilot กับเพื่อน 1 บริษัท
├── Collect feedback round 1
└── ✅ Go/No-go decision

2026 Q3 (ก.ค. - ก.ย.)
├── Onboard 5-10 บริษัท (free)
├── Launch payment system
├── First paying customer
└── ✅ Product-market fit signal

2026 Q4 (ต.ค. - ธ.ค.)
├── 30+ paying accounts
├── Launch B2C free tier publicly
├── Content marketing + SEO
└── ✅ Break-even on infrastructure

2027 H1
├── 80-150 paying accounts
├── Launch template system
├── Partnership with ไกด์ associations
└── ✅ Net profitable

2027 H2
├── 200-300 paying accounts
├── Multilingual trip plan
├── Explore SEA expansion
└── ✅ Monthly revenue > 100,000 บ
```

---

## 13. Ask (สิ่งที่ต้องการ)

### ถ้า Bootstrap (ไม่หานักลงทุน)
- **เงินลงทุน:** ~84,000 บาท (จากเงินตัวเอง)
- **เวลา:** 3-4 เดือน part-time สำหรับ MVP
- **Network:** เพื่อน 1 บริษัท + referral
- **Break-even:** เดือนที่ 14-18
- **ข้อดี:** เป็นเจ้าของ 100%, ตัดสินใจเร็ว, ไม่มีแรงกดดันจากนักลงทุน

### ถ้าหานักลงทุน (Angel / Pre-seed)
- **จำนวนที่ต้องการ:** 300,000 - 500,000 บาท
- **ใช้สำหรับ:**
  - Development acceleration (3 เดือนเต็มเวลาแทน 6 เดือน part-time)
  - Marketing budget 6 เดือน (~90,000 บาท)
  - Runway 6 เดือน (infra + operational)
  - Legal + compliance
- **Equity:** 10-15%
- **Break-even:** เดือนที่ 8-12
- **ข้อดี:** ไปเร็วกว่า, ได้ network จากนักลงทุน

### Recommended: Bootstrap → Validate → Raise (ถ้าจำเป็น)
เหตุผล: ลงทุนเริ่มต้นต่ำพอที่จะ bootstrap ได้ ควร validate ก่อน แล้วค่อย raise เมื่อมี traction จริง → valuation ดีกว่า, เสีย equity น้อยกว่า

---

## 14. Summary

**NatGan แก้ปัญหาที่มีอยู่จริง ในตลาดที่ยังไม่มีใครแก้**

| | |
|---|---|
| **ปัญหา** | แก้ plan แล้วลูกทริปไม่รู้ |
| **Solution** | Live itinerary + LINE & Web Push notification + read receipt |
| **ตลาด** | 28,000+ บริษัททัวร์ + ไกด์อิสระในไทย |
| **Revenue** | SaaS 299-599 บ/เดือน + pay-per-slot |
| **ลงทุน** | ~84,000 บาท (bootstrap) |
| **Break-even** | เดือนที่ 14-18 |
| **Moat** | Viral loop + switching cost + dual notification (LINE + Web Push) |
| **สิ่งที่ต้องพิสูจน์** | บริษัททัวร์ใช้จริง + ลูกทริปเปิดดูจริง + ยอมจ่าย |

> **Next step:** Pilot กับเพื่อน 1 บริษัท — ถ้าเขาใช้แล้วบอกว่า "ดีกว่าส่ง PDF ทาง Line จริงๆ" → เรามี business

---

*Document End — NatGan Business Plan v1.0*
*Confidential — Not for public distribution*
