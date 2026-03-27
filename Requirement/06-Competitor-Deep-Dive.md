# Competitor Deep Dive
# NatGan (นัดกัน) — v1.0

**Version:** 1.0
**Date:** 17 March 2026
**Status:** Draft

---

## 0. ⚠️ Critical Finding: LINE Notify ปิดบริการแล้ว

> **LINE Notify ถูกยกเลิกเมื่อ 1 เมษายน 2025**
> API, เว็บไซต์, และการออก token ถูกปิดทั้งหมด

### ผลกระทบต่อ NatGan

ในเอกสาร SRD และ TAD ระบุใช้ LINE Notify เป็นช่องทางหลัก — **ต้องเปลี่ยนเป็น LINE Messaging API แทน**

### LINE Messaging API (ทดแทน)

| แผน | ราคา/เดือน | ข้อความฟรี/เดือน | เกินฟรี |
|---|---|---|---|
| **Communication (ฟรี)** | 0 บาท | 500 ข้อความ | ส่งเพิ่มไม่ได้ |
| **Light** | ~500 บาท | 10,000 ข้อความ | ซื้อเพิ่มได้ |
| **Standard** | ~1,500 บาท | 25,000+ ข้อความ | ซื้อเพิ่มได้ |

### Action Plan

| เรื่อง | เปลี่ยนจาก | เปลี่ยนเป็น |
|---|---|---|
| ช่องทาง LINE | LINE Notify (ปิดแล้ว) | LINE Messaging API (ผ่าน LINE OA) |
| Follow flow | Redirect → LINE Notify authorize | User เพิ่มเพื่อน LINE OA ของ NatGan → link trip |
| ค่าใช้จ่าย | ฟรี | ฟรี 500 msg/เดือน (Communication plan) → pilot เพียงพอ |
| Architecture | 1 token ต่อ follower | User ID จาก LINE OA → Push message ผ่าน Messaging API |
| ข้อดีที่ได้เพิ่ม | - | Rich message (Flex Message), รูปภาพ, ปุ่มกดรับทราบในแชท |

**สำหรับ MVP pilot (1 บริษัท, 3-5 ทริป):** Communication plan ฟรี 500 msg/เดือน **เพียงพอ**

> **ต้องอัพเดท SRD, TAD, MVP Scope Lock** — เปลี่ยน LINE Notify → LINE Messaging API ทั้งหมด

---

## 1. Competitor Landscape

### 1.1 ภาพรวมตลาด

```
                    B2B (Tour Company)
                         ▲
                         │
         ┌───────────────┼───────────────┐
         │               │               │
   MYT SaaS        ┌────┤          TourSys
   Tourwriter      │    │          OTRAMS
   mTrip           │    │
                   │    │
 Trip Planner ◄────┤    ├────► Trip Communication
                   │    │
   Wanderlog       │    │         NatGan ⭐
   TripIt          │    │         (ไม่มีคู่แข่งตรง)
   TripNiceDay     │    │
                   │    │
         └───────────────┼───────────────┘
                         │
                         ▼
                    B2C (Traveler)
```

**NatGan อยู่ตรง "Trip Communication + B2B"** — ไม่มีคู่แข่งตรงในตลาดไทย

---

### 1.2 Competitor Categories

| Category | ผู้เล่น | เน้นอะไร | ขาดอะไร |
|---|---|---|---|
| **A. B2B Tour Operator Suite** | MYT SaaS, Tourwriter, OTRAMS, TourSys | Booking, CRM, Back-office, Invoice | ไม่เน้น communication กับลูกทริป |
| **B. B2C Trip Planner** | Wanderlog, TripIt, TripNiceDay, Google Trips | วางแผนเที่ยว, จอง, แผนที่ | ไม่มี B2B, ไม่มี notification |
| **C. White-label Travel App** | mTrip, AXUS | App สำหรับ agency, push noti | แพง, ต้องมี app, ไม่เหมาะ SME ไทย |
| **D. DIY (สิ่งที่ใช้กันอยู่)** | LINE Group, PDF/Canva, โทรศัพท์ | ฟรี, ทุกคนใช้ได้ | ข้อมูลจม, ไม่มี read receipt |

---

## 2. Competitor Analysis — Detail

### 2.1 Category A: B2B Tour Operator Suite

#### MYT SaaS (Manage Your Trip)

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Tour Operators & DMCs ทั่วโลก |
| **ราคา** | ไม่เปิดเผย (ต้องขอ demo) — คาดว่า $100+/เดือน |
| **จุดเด่น** | Itinerary Creator, CRM, Operations, Guide App, Traveler App |
| **จุดด้อย** | แพง, ซับซ้อน, ไม่เน้นตลาดไทย, ไม่มี LINE integration |
| **เทียบ NatGan** | MYT = "ระบบหลังบ้านครบ" vs NatGan = "แจ้งเตือนลูกทริปง่ายๆ" |

**สรุป:** MYT เป็น enterprise-grade ไม่ใช่คู่แข่งตรง — บริษัททัวร์เล็กในไทยไม่ต้องการ CRM ขนาดนั้น

#### TourSys (ไทย)

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Travel agency ไทย |
| **ราคา** | ไม่เปิดเผย |
| **จุดเด่น** | Revenue analysis, Sales tracking, Tour costing, Online booking |
| **จุดด้อย** | เน้น booking + back-office ไม่เน้น communication กับลูกทริป |
| **เทียบ NatGan** | TourSys = "ระบบจัดการธุรกิจทัวร์" vs NatGan = "ระบบสื่อสารกับลูกทริป" |

**สรุป:** TourSys เป็น back-office tool — ไม่มีฟีเจอร์ส่ง itinerary ให้ลูกทริป + แจ้งเตือน

#### OTRAMS

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Global tour operators, มีลูกค้าในไทย |
| **ราคา** | Enterprise pricing |
| **จุดเด่น** | Dynamic packaging, Booking engine, Multi-supplier |
| **จุดด้อย** | Enterprise-grade ราคาสูง, ไม่เน้น itinerary communication |
| **เทียบ NatGan** | ตลาดคนละ segment — OTRAMS เน้น booking, NatGan เน้น communication |

---

### 2.2 Category B: B2C Trip Planner

#### Wanderlog

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | B2C — นักเที่ยวทั่วโลก |
| **ราคา** | ฟรี (มี Pro $5/เดือน) |
| **จุดเด่น** | AI trip planning, Group collaboration, Budget tracking, Maps |
| **จุดด้อย** | ออกแบบสำหรับ "คนจัด" ไม่ใช่ "คนไป", ข้อมูลเยอะมาก text-heavy, ไม่มี change notification, ไม่มี read receipt |
| **เทียบ NatGan** | Wanderlog = "วางแผนร่วมกัน" vs NatGan = "ส่ง plan ให้ดู + แจ้งเมื่อเปลี่ยน" |

**สรุป:** Wanderlog เป็น trip planner ไม่ใช่ trip communicator — ไม่ตอบโจทย์ "แก้แล้วลูกทริปไม่รู้"

#### TripIt

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | B2C — นักเดินทางบ่อย (business travelers) |
| **ราคา** | ฟรี (Pro $49/ปี) |
| **จุดเด่น** | Forward email → auto-create itinerary, Flight alerts, Sharing |
| **จุดด้อย** | ออกแบบสำหรับ individual traveler, ไม่ได้ออกแบบสำหรับ tour operator, notification = flight status เท่านั้น ไม่ใช่ plan changes |
| **เทียบ NatGan** | TripIt = "จัดการทริปตัวเอง" vs NatGan = "บริษัทส่ง plan ให้ลูกทริป" |

#### TripNiceDay (ไทย)

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | B2C — คนไทยวางแผนเที่ยว |
| **ราคา** | ฟรี |
| **จุดเด่น** | เป็นไทย, ใช้ง่าย, มี community |
| **จุดด้อย** | B2C only, ไม่มี B2B features, ไม่มี notification, ไม่มี sharing link แบบ NatGan |
| **เทียบ NatGan** | TripNiceDay = "วางแผนเที่ยวเอง" vs NatGan = "บริษัทส่ง plan ให้ลูกทริปดู" |

---

### 2.3 Category C: White-label Travel App

#### mTrip

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Travel agencies, Tour operators, TMCs |
| **ราคา** | Enterprise pricing (คาดว่า $500+/เดือน) |
| **จุดเด่น** | White-label mobile app, Push notifications, Traveler tracking, Document delivery, Risk management |
| **จุดด้อย** | ราคาสูงมาก, ต้องมี dedicated app, ไม่เหมาะ SME ไทย, setup ซับซ้อน |
| **เทียบ NatGan** | mTrip = "เหมือน NatGan แต่เป็น app แยก ราคาแพง" — NatGan = web-based ไม่ต้องลง app |

**สรุป:** mTrip ใกล้เคียง NatGan ที่สุด แต่เป็น enterprise solution ราคาสูง — SME ไทยไม่มีทางจ่ายได้

#### AXUS Travel App

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Travel advisors (luxury segment) |
| **ราคา** | $35-150/เดือน |
| **จุดเด่น** | Auto push noti เมื่อ itinerary เปลี่ยน, In-app messaging, Beautiful presentation |
| **จุดด้อย** | เน้น luxury market, English only, ไม่เน้นตลาดเอเชีย, ต้อง download app |
| **เทียบ NatGan** | AXUS มี change notification เหมือน NatGan แต่ต้อง download app + แพง + ไม่มี LINE |

---

### 2.4 Category D: DIY (สิ่งที่ใช้จริงในไทย)

#### LINE Group Chat

| หัวข้อ | รายละเอียด |
|---|---|
| **ส่วนแบ่งตลาด** | ~90% ของบริษัททัวร์ไทยใช้อยู่ |
| **จุดเด่น** | ฟรี, ทุกคนมี LINE, ส่งได้ทันที, ไม่ต้องสอนใช้ |
| **จุดด้อย** | ข้อมูลจมในแชท, ไม่มี structured data, หาข้อมูลไม่เจอ, ไม่มี read receipt สำหรับ itinerary, ไม่มี change tracking |
| **เทียบ NatGan** | LINE = "ส่งข้อความ" vs NatGan = "ส่ง itinerary ที่ always up-to-date + รู้ว่าใครเห็นแล้ว" |

#### PDF / Canva

| หัวข้อ | รายละเอียด |
|---|---|
| **ส่วนแบ่งตลาด** | ~40% ของบริษัททัวร์ไทย (ใช้ร่วมกับ LINE) |
| **จุดเด่น** | สวย, ปริ้นได้, ดู professional |
| **จุดด้อย** | Static — แก้ทีต้องทำใหม่, ต้องส่งไฟล์ใหม่ทุกครั้ง, ไม่มี notification, ลูกทริปอาจดูไฟล์เก่า |
| **เทียบ NatGan** | PDF = snapshot ณ วันที่ทำ vs NatGan = live link ที่อัพเดทตลอด |

---

## 3. Feature Comparison Matrix

| Feature | LINE Group | PDF/Canva | Wanderlog | TripIt | mTrip | AXUS | **NatGan** |
|---|---|---|---|---|---|---|---|
| **B2B (Tour Company)** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **สร้าง Itinerary** | ❌ พิมพ์เอง | ✅ | ✅ | ✅ auto | ✅ | ✅ | ✅ |
| **แชร์ link เดียว** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ไม่ต้อง download app** | ✅ | ✅ | ✅ web | ❌ app | ❌ app | ❌ app | ✅ web |
| **ไม่ต้อง login ดู** | - | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Change notification** | ❌ | ❌ | ❌ | ✅ flight | ✅ | ✅ | ✅ |
| **Read receipt (ใครเห็น)** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **ปุ่มรับทราบ** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **LINE integration** | ✅ อยู่แล้ว | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **QR Code** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Immigration View** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **Company Branding** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **ราคา SME ไทย** | ฟรี | ฟรี | ฟรี | $49/ปี | $$$ | $35+/เดือน | ฟรี-299บ |
| **ภาษาไทย** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### NatGan Unique Advantages (ไม่มีใครมี)

1. **Read Receipt + รับทราบ** — รู้ว่าใครเห็นแล้ว ใครยัง → ส่งซ้ำเฉพาะคนที่ยังไม่เห็น
2. **Immigration-Friendly View** — ยื่นหน้าจอ ตม. แทนปริ้นกระดาษ
3. **LINE Messaging API + Web Push** — dual channel, เข้าถึงคนไทยผ่าน LINE
4. **ไม่ต้อง login + ไม่ต้อง download app** — friction ต่ำที่สุด
5. **ราคาเหมาะ SME ไทย** — ฟรี tier ใช้ได้จริง, Pro แค่ 299 บ/เดือน

---

## 4. Positioning Map

```
        ราคาสูง ($100+/เดือน)
              ▲
              │
   mTrip ●    │    ● MYT SaaS
              │
   AXUS ●     │         ● OTRAMS
              │
              │         ● TourSys
──────────────┼──────────────────▶
  Trip        │         Tour
  Communication│        Management
              │
              │
  NatGan ⭐   │    ● Wanderlog
  (ตรงนี้!)    │
              │    ● TripIt
  LINE ●      │
  PDF ●       │    ● TripNiceDay
              │
              ▼
        ฟรี / ราคาถูก
```

**NatGan อยู่ใน sweet spot:** ราคาถูก + เน้น Communication — ตรงนี้ว่างไม่มีคู่แข่ง

---

## 5. Competitive Moats (คูน้ำป้องกัน)

### 5.1 ทำไมคู่แข่งยากจะเข้ามาแข่ง

| Moat | คำอธิบาย |
|---|---|
| **Network Effect** | ลูกทริปเห็น "Powered by NatGan" → viral loop → คู่แข่งต้องสร้าง user base จาก 0 |
| **LINE Ecosystem** | คนไทย 90%+ ใช้ LINE → ต่างชาติ (Wanderlog, AXUS) ไม่เข้าใจ LINE ecosystem |
| **Language + Culture** | UI ภาษาไทย, เข้าใจ workflow ไกด์ไทย, ราคาบาท → ต่างชาติ localize ยาก |
| **Price Point** | ฟรี-299 บ → MYT/mTrip/AXUS ลดราคามาสู้ไม่ได้เพราะ cost structure ต่างกัน |
| **Simplicity** | 4 fields ต่อ activity, ไม่ต้อง login ดู → ถ้าคู่แข่งเพิ่ม feature มา จะ complex เกินไปสำหรับลูกทริปไทย |

### 5.2 ความเสี่ยงจากคู่แข่ง

| Scenario | ความเป็นไปได้ | แผนรับมือ |
|---|---|---|
| LINE เพิ่มฟีเจอร์ itinerary ใน LINE OA | ต่ำ — LINE ไม่เคยทำ vertical solution | ถ้าเกิดขึ้น: เรามี read receipt + immigration view ที่ LINE ไม่มี |
| Wanderlog เพิ่ม B2B mode | กลาง — เป็นไปได้ | Wanderlog ไม่มี LINE integration + ไม่มีภาษาไทย |
| คนไทยทำ clone NatGan | กลาง-สูง — ถ้าเราสำเร็จ | First-mover advantage + viral loop + community lock-in |
| บริษัททัวร์ใช้ LINE ต่อเพราะ "ก็ใช้ได้อยู่" | สูง — inertia แรงมาก | ต้องทำให้ NatGan ดีกว่า LINE อย่างเห็นได้ชัด (read receipt = killer) |

---

## 6. สรุป

### NatGan ไม่มีคู่แข่งตรงในตลาดไทย

- **B2B Tour Operator Suite** → แพงเกินไป + เน้น booking ไม่ใช่ communication
- **B2C Trip Planner** → ออกแบบสำหรับ traveler ไม่ใช่ tour company
- **White-label App** → ต้อง download app + แพงมาก
- **LINE Group** → คู่แข่งตัวจริง แต่ขาด structured data + read receipt

**คู่แข่งที่แท้จริงของ NatGan คือ "ความเคยชิน" ของการใช้ LINE Group** — ไม่ใช่ software อื่น

**กลยุทธ์:** ไม่ต้องทำให้ดีกว่า LINE ทุกด้าน — แค่ทำให้ **"รู้ว่าใครเห็นแล้ว"** ดีกว่า LINE ก็พอ เพราะนั่นคือ pain point จริง

---

*Document End — NatGan Competitor Deep Dive v1.0*

Sources:
- [MYT SaaS](https://www.capterra.com/p/141560/MYT-SaaS/)
- [AXUS Travel App](https://www.axustravelapp.com/)
- [mTrip](https://www.mtrip.com/)
- [Wanderlog](https://wanderlog.com/)
- [TripIt](https://play.google.com/store/apps/details?id=com.tripit)
- [TripNiceDay](https://www.tripniceday.com/itinerary)
- [TourSys](https://toursys.asia/th/software/tour_operator.htm)
- [OTRAMS](https://www.otrams.com/travel-software-thailand/)
- [LINE Notify ปิดบริการ](https://notify-bot.line.me/closing-announce)
- [LINE Messaging API Pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)
- [LINE Notify Alternatives](https://ke2b.com/en/line-notify-closing-alt/)
