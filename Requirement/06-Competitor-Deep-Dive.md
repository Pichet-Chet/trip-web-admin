# Competitor Deep Dive
# NatGan (นัดกัน) — v2.0

**Version:** 2.0
**Date:** 29 March 2026
**Status:** Updated
**Changelog v2.0:** อัพเดทคู่แข่งทั้งในไทยและต่างประเทศ, เพิ่ม Posts/Marketplace competitors, เพิ่มประเมินการ Scale ต่างประเทศ, อัพเดทข้อมูลราคาและฟีเจอร์ล่าสุด

---

## 0. สรุปผลลัพธ์สำคัญ

> **NatGan ไม่มีคู่แข่งตรงในตลาดไทย** — ไม่มี software รายใดที่แก้ปัญหา "แก้ plan แล้วลูกทริปไม่รู้" โดยตรง
>
> **ในต่างประเทศมีคู่แข่งใกล้เคียง** (AXUS, Vamoos) แต่แพงกว่า 10-100 เท่า ต้อง download app และไม่มี LINE integration
>
> **คู่แข่งตัวจริงของ NatGan ���ือ "ความเคยชินที่จะใช้ LINE Group + PDF"**

---

## 1. NatGan Business Overview (สำหร���บเปรียบเทียบ)

NatGan มี 2 ส่วนหลักที่เป็นอิสระต่อกัน:

| ส่วน | จุดประสงค์ | Revenue Model |
|---|---|---|
| **Posts** (Tour Package Listings) | พื้นที่ให้บริษัท/ไกด์โชว์ทัวร์ ไม่มี booking, แสดงบนเว็บ Info | ดึง traffic เข้า platform |
| **Trip Builder** (Trip Communication) | สร้าง itinerary → แจ้งเตือน → รับทราบ | Pay-per-trip ฿49 / Pack 5 ฿199 / Pack 10 ฿349 |

**Account Types:** Company (TAT license), Freelance Guide, Personal (กลุ่มเพื่อน)

---

## 2. คู่แข่งในไทย

### 2.1 ภาพรวมตลาดไทย

```
              B2B (สำหรับบริษัททัวร์)
                     ▲
                     │
   TourSys ●         │         ● Salesone
   TourProX ●        │
                     │
                     │    ● Weon/OKWebTour/Punidea
                     │      (ทำเว็บขายทัวร์)
                     │
 Itinerary ──────────┼─────────────── Booking/Sales
 Communication       │
                     │
   NatGan ⭐          │    ● Kaitour (aggregator)
   (ตรงนี้ว่าง!)      │    ● eTravelWay
                     │    ● ThaiTravelCenter
                     │
   TripNiceDay ●     │    ● Traveloka
                     │    ● Klook/KKday
                     ▼
              B2C (สำหรับนักท่องเที่ยว)
```

**NatGan อยู่ฝั่งซ้าย (Itinerary Communication) ซึ่งว่างเปล่า — ไม่มีใครอยู่เลย**

---

### 2.2 กลุ่ม A: ระบบ Back-office บริษัททัวร์

เน้นจัดการธุรกิจ (booking, finance, CRM) — **ไม่ใช่คู่แข่งตรง** แต่อาจเป็น partner ในอนาคต

#### TourSys

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | toursys.asia |
| **ตลาด** | บริษัททัวร์ไทย, 200+ ลูกค้า |
| **ราคา** | ไม่เปิดเผย (คาดว่าหลักพัน/เดือน) |
| **จุดเด่น** | ระบบจองครบวงจร, ขายตั๋ว, จัดการ fleet, multi-currency, mobile-friendly |
| **จุดด้อย** | เน้น back-office, ไม่มีระบบสื่อสารกับลูกทริป, ไม่มี itinerary sharing |
| **เทียบ NatGan** | TourSys = "จัดการธุรกิจทัวร์" vs NatGan = "สื่อสารกับลูกทริป" |
| **ระดับคุกคาม** | **ต่ำ** — คนละ segment |

#### Salesone Omnichannel

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | salesone.co |
| **ตลาด** | ธุรกิจท่องเที่ยวไทย, เน้�� agency |
| **ราคา** | ไม่เปิดเผย |
| **จุดเด่น** | Omnichannel sales, CRM, booking, 100+ template เว็บขายทัวร์, B2B OTA |
| **จุดด้อย** | เน้น sales + booking, ไม่มี itinerary communication |
| **เทียบ NatGan** | Salesone = "ขายทัวร์ออนไลน์" vs NatGan = "service ลูกทริปหลังขาย" |
| **ระดับคุกคาม** | **ต่ำ** — คนละ stage ของ customer journey |

#### TourProX

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | tourprox.com |
| **ตลาด** | B2B — Wholesale → Sub Agent network |
| **ราคา** | ไม่เปิดเผย |
| **จุดเด่น** | กระจายทัวร์จาก Wholesale สู่ agent, real-time seat tracking, ติดตามยอดขาย |
| **จุดด้อย** | เป็น B2B agent network ไม่เกี่ยวกับลูกทริปเลย |
| **เทียบ NatGan** | TourProX = "กระจายทัวร์ให้ agent" — ไม่เกี่ยวกับ NatGan |
| **ระดับคุกคาม** | **ไม���มี** — คนละ business |

---

### 2.3 กลุ่ม B: บริการทำเว็บขายทัวร��� (ทับซ้อนกับ Posts)

เน้นสร้างเว็บไซต์ขายทัวร์ให้แต่���ะบริษัท ��� **คู่แข่งของ Posts** แต่คนละ model

#### Weon Website Tour

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | weon.website/tour |
| **ตลาด** | บริษัททัวร์ไทยที่อยากมีเว็บเป็นของตัวเอง |
| **ราคา** | ~3,000-15,000 บ/ครั้ง + ค่ารายเดือน |
| **จุดเด่น** | เว็บสำเร็จรูป, SEO การันตีหน้าแรก Google, 200+ ลูกค้า, ระบบจอง |
| **จุดด้อย** | ต้องจ่ายค่าทำ + ค่า hosting/domain ทุกเดือน, ดูแลเอง |

#### OKWebTour

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | okwebtour.com |
| **ตลาด** | บริษัททัวร์ที่ต้องการเว็บขายทัวร์ราคาประหยัด |
| **ราคา** | ไม่เปิดเผย (คาดว่าหลักพัน/ครั้ง) |
| **จุดเด่น** | โหลดเร็ว, ดึงทัวร์จาก Wholesale อัตโนมัติ, มีทีมช่วยใส่ข้อมูล |
| **จุดด้อย** | เหมือน Weon — ต้องจ่ายค่าทำ + ดูแลเอง |

#### Punidea / BigBang / อื่นๆ

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | punidea.co.th, bigbang.co.th |
| **ตลาด** | บริษัททัวร์ท���กขนาด |
| **ราคา** | ไม่เปิดเผย (คาดว่าหลักพัน - หลักหมื่น) |
| **จุดเด่น** | ประสบการณ์ 14+ ปี, 700+ เว็บ, ระบบจองค���บ |
| **จุดด้อย** | เห���ือนกลุ่ม — ต้องจ่าย + ดูแลเอง |

#### เปรียบเทียบ: เว็บขายทัวร์ vs NatGan Posts

| เรื่อง | เว็บขายทัว���์สำเร็จรูป | NatGan Posts |
|---|---|---|
| **ราคา** | หลักพัน - หลักหมื่น (ค่าทำ + รายเดือน) | **ฟรี** (โพสบน platform) |
| **เป็นเจ้าของ** | บริษัทมีเว็บของตัวเอง | อยู่บน platform NatGan |
| **SEO** | แต่ละเว็บ SEO แยก (ขึ้นกับงบ) | **รวมศูนย์** — Info Website มี traffic รวม |
| **ต้องดูแล** | จ่าย hosting/domain ทุกเดือน | ไม่ต้องดูแลอะไร |
| **มี booking** | ✅ มีระบบจอง | ❌ ไม่มี — ปิดการขายเอง |
| **Connection กับ service** | จบที่ booking | → Trip Builder (core value) |
| **เหมาะกับ** | บริษัทที่มีงบ + อยากมี brand | **ไกด์อิสระ / บริษัทเล็ก** ที่ไม่มีงบ |
| **ระดับคุกคาม** | **กลาง** — คนละ model แต่ solve ปัญหาเดียวกัน | |

---

### 2.4 กลุ่ม C: แพลตฟอร์มรวมทัวร์ / Aggregator (ทับซ้อนกับ Posts)

#### Kaitour

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | kaitour.co |
| **ตลาด** | ลูกค้าทั่วไปที่หาทัวร์, รวมจากบริษัทชั้นนำ |
| **ราคา** | คาดว่า commission-based |
| **จุดเด่น** | รวมโปรแกรมทัวร์หลายเจ��า, ค้นหาง่าย, มีรีวิว |
| **จุดด้อย** | เฉพาะบริษัทชั้นนำ, ไกด์อิสระโพสไม่ได้ |
| **เทียบ NatGan** | Kaitour = "ตลาดนัดทัวร์สำหรับบริษัทใหญ่" vs NatGan Posts = "พื้นที่ให้ทุกคนโชว์ทัวร์" |
| **ระดับคุกคาม** | **กลาง** — ใกล้ Posts มากที่สุด แต่คนละ target |

#### ThaiTravelCenter / eTravelWay

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | thaitravelcenter.com, etravelway.com |
| **ตลาด** | ลูกค้าทั่วไป |
| **ราคา** | Commission-based |
| **จุดเด่น** | เว็บรวมทัวร์เก่าแก่ 20+ ปี, SEO แข็ง, มีฐานลูกค้า |
| **จุดด้อย** | UI เก่า, ไม่มีระบบสำหรับไกด์อิสระ, เน้นบริษัทใหญ่ |
| **ระดับคุกคาม** | **ต่ำ-กลาง** — เป็น aggregator เก่า ไม่ได�� innovate |

#### เปรียบเทียบ: Aggregator vs NatGan Posts

| เรื่อง | Kaitour / Aggregator | NatGan Posts |
|---|---|---|
| **ใครโพสได้** | บริษัทชั้นนำเท่านั้น | **ทุกคน** รวมไกด์อิสระ |
| **มี booking** | ✅ มีระบบจอง + commission | ❌ ไม่มี — ปิดการขายเอง |
| **Connection กับ service** | จบที่จอง | → Trip Builder |
| **ค่าใช้จ่ายบริษัท** | Commission ต่อการจอง | ฟรี หรือ pay-per-trip |
| **Focus** | ขายทัวร์ให้จบ | **ดึงคนเข้า platform** |

---

### 2.5 กลุ่ม D: แอปวางแผนเที่ยว B2C (ทับซ้อนกับ Trip Builder สำหรับกลุ่มเพื่อน)

#### TripNiceDay

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | tripniceday.com |
| **ตลาด** | B2C — คนไทยวางแผนเที่ยว |
| **ราคา** | ฟรี |
| **จุดเด่น** | 15,000+ สถานที่, diary, blog, สะสมแต้ม, 3 ภาษา (TH/EN/CN), มีแพ็คเกจจากผู้ประกอบการ |
| **จุดด้อย** | B2C only, ไม่มี B2B features, ไม่มี notification, ไม่มี itinerary sharing แบบ NatGan |
| **เทียบ NatGan** | TripNiceDay = "ค้นหาที่เที่ยว + diary" vs NatGan = "สร้าง plan แชร์เพื่อน + service ลูกทัวร์" |
| **ระดับคุกคาม** | **ต่ำ** — คนละ focus |

---

### 2.6 กลุ่ม E: สิ่งที่ใช้กันอยู่จริง (คู่แข่งตัวจริง)

| Solution | ส่วนแบ��งตลาด | จุดเด่น | จุดด้อย |
|---|---|---|---|
| **LINE Group Chat** | ~90% ของบริษัททัวร์ไทย | ฟรี, ทุกคนมี, ส่งได���ทันที | ข้อมูลจม, ไม่มี structured data, ไม่รู้ใครเห็นแล้ว |
| **PDF / Canva** | ~40% (ใช้ร่วมกับ LINE) | สวย, ปริ้นได้, ดูเป็นมืออาชีพ | Static, แก้ทีต้องทำใหม่, ลูกทริปอาจดูไฟล์เก่า |
| **โทรศัพท์** | ~30% (fallback) | ได้ผลแน่นอน | เสียเวลา, ต้องโทรทีละคน |
| **Facebook Page** | ~20% | Reach สูง, มี comment | ข้อมูลจม, ไม่ structured, ไม่เหมาะส่ง itinerary |

> **คู่แข่งตัวจริงของ NatGan = "ความเค��ชิน" ที่จะใช้ LINE Group + PDF ไม่ใช่ software อื่น**

---

## 3. คู่แข่งต่างประเทศ

### 3.1 ภาพรวมตลาดโลก

```
         ราคาสูง ($100+/เดือน)
               ▲
               │
    mTrip ●    │         ● moonstride
               │
    AXUS ●     │         ● MYT SaaS
               │
    Vamoos ●   │         ● Tourwriter
               │
 ──────────────┼──────────────────────▶
 Trip          │              Tour
 Communication │              Management
               │
    NatGan ⭐   │    ● SquadTrip
    (ตรงนี้!)   │
               │    ● Wanderlog
    LINE ●     │
    PDF ●      │    ● TripIt
               │
               ▼
         ฟรี / ราคาถูก
```

---

### 3.2 คู่แข่งโดยตรง — Trip Communication

#### AXUS Travel App (USA) — คู่แข่งใกล้ NatGan ที่สุดในโลก

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | axustravelapp.com |
| **ตลาด** | Travel advisors, luxury segment ทั่วโลก |
| **ราคา** | $35-150/เดือน (~1,200-5,200 บ) |
| **จุดเด่น** | Auto push notification เมื่อ itinerary เปลี่ยน, in-app messaging, สวย, partner กั�� Tourwriter |
| **จุดด้อย** | ต้อง download app, แพง, English only, เน้น luxury market |
| **เทียบ NatGan** | AXUS มี change notification เหมือน NatGan แต่ต้อง download app + แพงกว่า 25-100 เท่า + ไม่มี LINE |
| **ระดับคุกคาม** | **สูง** (ถ้าเข้าตลาด Asia) แต่ **ต่ำ** ในตลาดไทย (ไม่มี LINE, แพง, ไม่มีภาษาไทย) |

#### Vamoos (UK) — Europe #1 Tour Operator App

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | vamoos.com |
| **ตลาด** | Tour operators, hotels, villas ในยุโรป |
| **ราคา** | £210-1,650/ปี (~9,500-75,000 บ/ปี) ตามจำนวน passengers |
| **จุดเด่น** | Real-time updates, messaging, offline access, AI image tool, Studio Applications, 50% higher rebooking rates |
| **จุดด้อย** | ต้อง download app, ราคาสูงมาก, ไม่มี LINE integration, ไม่มีภาษาไทย |
| **เทียบ NatGan** | Vamoos มี feature ใกล้เคียง NatGan มาก แต่แพงกว่า 10-50 เท่า + ต��องลง app |
| **ระดับคุกคาม** | **สูง** (ถ้าเข้า SEA) แต่ **ต่ำ** ในตลาดไทย (เหตุผลเดียวกับ AXUS) |

#### mTrip (Canada) — White-label Travel Platform

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | mtrip.com |
| **ตลาด** | Travel agencies, tour operators, TMCs — 300+ บริษัท ใน 35+ ประเทศ, 4M+ trips/year |
| **ราคา** | Custom pricing (enterprise-grade, คาดว่า $500+/เดือน) |
| **จุดเด่น** | White-label app, AI Import Wizard (2026), Risk Management, Duty of Care, Zapier integration |
| **จุดด้อย** | Enterprise-grade แพงมาก, ต้องมี dedicated app, setup ซับซ้อน |
| **เทียบ NatGan** | mTrip = "enterprise solution สำหรับบริษัทใหญ่" vs NatGan = "เครื่องมือง่ายๆ สำหรับ SME" |
| **ระดับคุกคาม** | **กลาง** — คนละ segment (enterprise vs SME) |

---

### 3.3 คู่แข่งอ้อม — Tour Operator Suite

#### SquadTrip (USA)

| หัวข้อ | รายละเอียด |
|---|---|
| **เว็บไซต์** | squadtrip.com |
| **ตลาด** | Group trip organizers (travel agents, yoga retreats, tour operators) |
| **ราคา** | ฟรี + $29/เดือน + 6% booking fee |
| **จุดเด่น** | Group payment collection, booking pages, auto reminders, Stripe/Klarna/Apple Pay |
| **จุดด้อย** | เน้น payment collection ไม่ใช่ itinerary communication |
| **เทียบ NatGan** | SquadTrip = "เก็บเงินกรุ๊ปทัวร์" vs NatGan = "สื่อสาร itinerary" |
| **ระดับคุกคาม** | **ต่ำ** — คนละ focus |

#### moonstride (UK) / Tourwriter (NZ) / MYT SaaS

| หัวข้อ | รายละเอียด |
|---|---|
| **ตลาด** | Tour operators ขนาดกลาง-ใหญ่ |
| **ราคา** | Enterprise pricing (custom) |
| **จุดเด่น** | CRM + booking + notification + itinerary builder + back-office ครบวงจร |
| **จุดด้อย** | แพง, ซับซ้อน, ไม่เหมาะ SME ไทย |
| **ระดับคุกคาม** | **ต่ำ** — enterprise segment |

---

### 3.4 คู่แข่ง B2C — Trip Planner

| ชื่��� | ประเทศ | ราคา | จุดเด่น | ระดับคุกคาม |
|---|---|---|---|---|
| **Wanderlog** | USA | ฟรี / $5 Pro | AI planning, collaboration, budget tracking, group cost splitting | **ต่ำ** — B2C only |
| **TripIt** | USA | ฟรี / $49/ปี | Auto-parse email, flight alerts, gate updates | **ต่ำ** — individual traveler |
| **Trip.com Planner** | China | ฟรี | AI itinerary, booking integration | **ต่ำ** — booking platform |

---

## 4. Feature Comparison Matrix

### 4.1 Trip Communication Features

| Feature | LINE Group | PDF | AXUS | Vamoos | mTrip | **NatGan** |
|---|---|---|---|---|---|---|
| **สร้าง Itinerary** | ❌ พิมพ์เอง | ✅ สวย | ✅ | ✅ | ✅ | ✅ |
| **แชร์ link เดียว** | ❌ | ❌ | ✅ (ใน app) | ✅ (ใน app) | ✅ (ใน app) | ✅ **web link** |
| **ไม่ต้อง download app** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **ไม่ต้อง login ดู** | - | ✅ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **Change notification** | ❌ | ❌ | ✅ push | ✅ push | ✅ push | ✅ **LINE + Web Push** |
| **Read receipt (ใครเ���็น)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **ปุ่มรับทราบ** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **LINE integration** | ✅ อยู่แล้ว | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **Immigration View** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **QR Code sharing** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **Company Branding** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tour Package Listing** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **Portfolio page** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **ภาษาไทย** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **ราคาต่อเดือน** | ฟรี | ฟรี | $35-150 | £18-138 | $$$ | **฿49/ทริป** |

### 4.2 Posts / Tour Listing Features

| Feature | Weon/OKWebTour | Kaitour | Klook/KKday | Facebook Group | **NatGan Posts** |
|---|---|---|---|---|---|
| **ราคาสำหรับบริษัท** | หลักพัน-ห���ักหมื่น | Commission | Commission ~20% | ฟรี | **ฟรี** |
| **ไกด์อิสระโพสได้** | ✅ (ถ้าจ่ายทำเว็บ) | ❌ | ⚠️ ยาก | ✅ | ✅ ⭐ |
| **มี booking** | ✅ | ✅ | ✅ | ❌ | ❌ (ปิดการขายเอง) |
| **SEO** | แต่ละเว็บแยก | รวมศูนย์ | แข็งมาก | ต่ำ | **รวมศูนย์** (Info Website) |
| **ต่อไป Trip Builder** | ❌ | ❌ | ❌ | ❌ | ✅ ⭐ |
| **ต้องดูแล** | ✅ ทุกเดือน | ❌ | ❌ | ❌ | ❌ |

---

## 5. NatGan Unique Advantages (สิ่งที่ไม่มีใครมี)

| # | Unique Feature | ทำไมสำคัญ |
|---|---|---|
| 1 | **Read Receipt + ปุ่มรับทราบ** | รู้ว่าใครเห็นแล้ว ใครยัง → โทรตามแค่คนที่ไม่เห็น |
| 2 | **ไม่ต้อง download app + ไม่ต้อ��� login** | Friction ต่ำที่สุดในตลาด |
| 3 | **LINE Messaging API + Web Push** | Dual channel ครอบคลุมทั้งคนไทย (LINE) + ต่างชาติ (Web Push) |
| 4 | **Immigration-Friendly View** | ยื่นหน้าจอ ตม. แทนปริ้นกระดาษ — ไม่มีคู่แข่งรายใดมี |
| 5 | **Posts + Trip Builder = Full Funnel** | หน้าร้าน (Posts) → หลังร้าน (Trip) ในที่เดียว |
| 6 | **ราคาต่ำที่สุด** | ฿49/ทริป vs $35+/เดือน (AXUS) vs £210+/ปี (Vamoos) |
| 7 | **เปิดให้ไกด์อิสระ + กลุ่มเพื่อน** | ไม่จำกัดแค่บริษัท — ขยาย addressable market |

---

## 6. Competitive Moats (คูน้ำป้องกัน)

### 6.1 ทำไมคู่แข่งต่างชาติเข้า���ทยยาก

| Moat | คำอธิบาย |
|---|---|
| **LINE Ecosystem** | คนไทย 90%+ ใช้ LINE → AXUS/Vamoos ไม่เข้าใจ LINE ecosystem |
| **Language + Culture** | UI ภาษาไทย, เข้าใจ workflow ไกด์ไทย, ราคาบาท → ต่างชาติ localize ยาก |
| **Price Point** | ฿49/ทริป → AXUS/Vamoos ลดราคามาสู้ไม่ได้เพราะ cost structure ต่างกัน |
| **Simplicity** | ไ���่ต้อง download app + ไม่ต้อง login → ถ้าคู่แข่งบังคับลง app ก็แพ้ |

### 6.2 ทำไมคู่แข่งไทยเ��้ามาแข่งยาก

| Moat | คำอธิบาย |
|---|---|
| **Network Effect** | ลูกทริปเห็น "Powered by NatGan" → viral loop → คู่แข่งต้องสร้าง user base จาก 0 |
| **Posts Platform Effect** | ยิ่งมีบริษัทโพสมาก → ลูกค้ามาหามาก → บริษัทอื���นอยากโพสด้วย |
| **First Mover** | ไม่มีใครทำ Trip Communication ในไทย → NatGan เป็นรายแรก |
| **Switching Cost** | เมื่อบริษัทมี portfolio + followers บน NatGan แล้ว ไม่อยากย้าย |

### 6.3 ความเสี่ยงจากคู่แข่ง

| Scenario | ความเป็นไปได้ | แผนรับมือ |
|---|---|---|
| **LINE เพิ่มฟีเจอร์ itinerary ใน LINE OA** | ต่ำ — LINE ไม่เคยทำ vertical solution | เรามี read receipt + immigration view + portfolio ที่ LINE ไม่มี |
| **Kaitour เพิ่ม Trip Communication** | ต่ำ-กลาง — Kaitour เน้น aggregator | เราเริ่มก่อน + มี tech stack พร้อม + คนละ target |
| **TripNiceDay เพิ่ม B2B** | ต่ำ — TripNiceDay เน้น B2C travel diary | เราเริ่มจาก B2B ก่อน + มี notification system |
| **คนไทยท�� clone NatGan** | กลาง-สูง — ถ้าเราสำเร็จ | First-mover + viral loop + community lock-in |
| **AXUS/Vamoos เข้าตลาดไทย** | ต่ำ — ราคาส��ง + ไม่มี LINE | เราถูกกว่า 25-100 เท่า + มี LINE integration |
| **บริษัททัวร์ใช้ LINE ต่อเพรา��� "ก็ใช้ได้อยู่"** | **สูง** — inertia แรงมาก | ต้องทำให��� NatGan ดีกว่า LINE อย��างเห็นได้ชัด |

---

## 7. ประเมินการ Scale ต่างประเทศ

### 7.1 แผนที่ตล���ดต่างประเทศ

| ประเทศ | Messaging App หลัก | ตลาดทัวร์ | ใช้ LINE ได้เลย? | ความเป็นไปได้ |
|---|---|---|---|---|
| 🇯🇵 **ญี่ปุ่น** | LINE (95M users) | ใหญ่มาก, organized | ✅ ใช้ได้เลย | ⭐⭐⭐⭐ |
| 🇹🇼 **ไต้หวัน** | LINE (21M users) | กลาง, ชอบทัวร์กรุ๊ป | ✅ ใช้ได้เลย | ⭐⭐⭐⭐ |
| 🇮🇩 **อินโดนีเซีย** | LINE + WhatsApp | ใหญ่มาก (270M คน) | ⚠️ LINE มีฐาน แต่ WhatsApp แข็งกว่า | ⭐⭐⭐ |
| 🇻🇳 **เวียดนาม** | Zalo + WhatsApp | โตเร็วมาก | ❌ ต้องทำ Zalo integration | ⭐⭐ |
| 🇲🇾 **มาเลเซีย/สิงคโปร์** | WhatsApp | กลาง | ❌ ต้องเพิ่ม WhatsApp | ⭐⭐ |
| 🇪🇺 **ยุโรป** | WhatsApp/SMS | ใหญ่มาก | ❌ ต้อง build ใหม่ + มี AXUS/Vamoos | ⭐ |
| 🇺🇸 **อเมริกา** | SMS/WhatsApp | ใหญ่มาก | ❌ SMS ค่าใช้จ่ายสูง | ⭐ |

### 7.2 ทำไมควรเริ่มที่ญี่ปุ่น + ไต้หวัน (LINE Countries)

| เหตุผล | รายละเอียด |
|---|---|
| **ใช้ LINE เหมือนกัน** | ไม่ต้อง build messaging integration ใหม่ |
| **ตลาดทัวร์กรุ๊ปแข็งแรง** | ญี่ปุ่น + ไต้หวัน ชอบไปทัวร์กรุ๊ป = ตรง target |
| **ราคา NatGan ถูกมาก** | AXUS $35+/เดือน vs NatGan ฿49/ทริป (~$1.4) |
| **Immigration View เป���นจุดขาย** | ทั้ง 2 ประเทศเดินทางเยอะ ใช้ ตม. บ่อย |
| **i18n ภาษาญี่ปุ่นมีแล้ว** | NatGan มี 3 ภาษา (th/en/ja) |
| **ไ���่มีคู่แข่งตรง** | AXUS/Vamoos ไม่เน้น Asia + ไม่มี LINE |

### 7.3 จุดเสี่ยงในการ Scale

#### Risk 1: Messaging Platform Lock-in

ทุกประเทศใช้ messaging app ต่างกัน → ต้อง build integration ใหม่ทุกตลาด

| ประเทศ | App | Cost |
|---|---|---|
| ไทย/ญี่ปุ่น/ไต้หวัน | LINE | ฟรี 500 msg/เดือน |
| อินโดนีเซีย/ยุโรป | WhatsApp Business API | ~$0.05-0.10/message |
| เวียดนาม | Zalo | ต้อง build ใหม่ |
| ��เมริกา | SMS | ~$0.01-0.05/message |

#### Risk 2: Localization ไม่ใช่แค่แปลภาษา

- **ญี่ปุ่น:** คาดหวัง UX สมบูรณ์แบบ, ต้อง formal language, culture ต่างมาก
- **อินโดนีเซีย:** GDP per capita ต่ำก���่าไทย → ราคาต้องต่ำกว่าอีก
- **ยุโรป:** GDPR compliance จำเป็น, data residency requirements

#### Risk 3: ทรัพยากรทีม

- ทีมเล็ก (1-2 คน) → scale ต่างประเทศต้องการ support หลายภาษา หลาย timezone
- ต้อง localize ทั้ง UI, content, support, legal

#### Risk 4: คู่แข่ง Local ที่ไม่รู้จัก

- แต่ละประเทศอาจมี local solution ที่ search ภาษาอังกฤษ/ไทยไม่เจอ
- WhatsApp Business API มี tools ในตัวอยู่แ���้วสำหรับบางประเทศ

### 7.4 Roadmap แนะนำ

```
Phase 1 (ตอนนี�� - 6 เดือน)          Phase 2 (6-12 เดือน)         Phase 3 (ปีที่ 2+)
┌──────────────────┐              ┌──────────────────┐         ┌──────────────────┐
│ 🇹🇭 ไทย           │              │ 🇹🇭 ไทย Scale     │         │ 🇯🇵 ญี่ปุ่น         │
│ - Prove PMF      │              │ - 100+ accounts  │         │ 🇹🇼 ไต้หวัน        │
│ - 5-30 companies │     →        │ - Revenue stable │    →    │ - LINE ใช้ได้เลย   │
│ - Pilot + iterate│              │ - Team 2-3 คน    │         │ - แปล UI          │
│                  │              │ - Posts มี traffic│         │ - หา local partner│
└──────────────────┘              └──────────────────┘         └──────────────────┘
```

### 7.5 สรุปความคุ้มค่า

| ตลาด | คุ้มค่า? | เหตุผล |
|---|---|---|
| 🇹🇭 **ไทย** | ✅ **คุ้มมาก** | ไม่มีคู่แข่ง + ตลาดพร้อม + ต้นทุนต่ำ |
| 🇯🇵 **ญี่ปุ่น** | ✅ **คุ้ม** | LINE ใช้ได้เลย + ตลาดใหญ่ + ไม่มีคู่แข่งตรง |
| 🇹🇼 **ไต้หวัน** | ✅ **คุ้ม** | LINE ใช้ได้เลย + culture ใกล้ไทย |
| 🇮🇩 **อินโดนีเซีย** | ⚠️ **รอก่อน** | ต้อง build WhatsApp + ราคาต้องต่ำกว่า |
| 🇻🇳 **เวียดนาม** | ⚠️ **รอก่อน** | ต้อง build Zalo |
| 🇪🇺🇺🇸 **ยุโรป/อเมริกา** | ❌ **ยังไม่คุ้ม** | มีคู่แข่งแข็ง + GDPR + SMS แพง |

---

## 8. สรุป

### NatGan ในตลาดไทย: ไม่มีคู่แ��่งตรง

- **Back-office tools** (TourSys, Salesone) → เน้น booking + CRM ไม่ใช่ communication
- **เว็บขายทัวร์** (Weon, OKWebTour) → ทำเว็บให้แต่ละเจ้า NatGan เป็น platform กลาง
- **Aggregator** (Kaitour, eTravelWay) → รวมทัวร์ขาย NatGan เป็นพื้นที่โชว์ + service tool
- **B2C Trip Planner** (TripNiceDay) → ค้นหาที่เที่ยว NatGan เน้นสร้าง plan + แชร์

### NatGan ในตลาดโลก: ถูกกว่า + ง่ายกว่า

- **AXUS / Vamoos** → แพงกว่า 10-100 เท่า + ต้องลง app + ไม่มี LINE
- **mTrip** → Enterprise-grade ไม่เหมาะ SME
- **SquadTrip** → เน้น payment ไม่ใช่ communication

### คู่แข่งตัวจริง = ความเคยชิน

> **กลยุทธ์:** ไม่ต้องทำให้ดีกว่า LINE ทุกด้าน — แค่ทำให้ **"รู้ว่าใครเห็นแล้ว"** ดีกว่า LINE ก็พอ เพราะนั่นคือ pain point จริง

---

*Document End — NatGan Competitor Deep Dive v2.0*

Sources:
- [AXUS Travel App](https://www.axustravelapp.com/)
- [AXUS - Itinerary Change Notifications](https://support.axustravelapp.com/hc/en-us/articles/360033286552)
- [Vamoos](https://www.vamoos.com/)
- [Vamoos - Pricing](https://www.vamoos.com/for-travel-companies/pricing/)
- [Vamoos - Best Tour Operator Apps 2026](https://www.vamoos.com/the-best-tour-operator-apps-2026/)
- [mTrip](https://www.mtrip.com/)
- [SquadTrip](https://www.squadtrip.com/)
- [SquadTrip - Software Tour Operators Need 2026](https://www.squadtrip.com/guides/software-tour-operators-needs)
- [TourSys](https://toursys.asia/th-tour-operator/)
- [Salesone](https://salesone.co/th/c/services/Tourism-management-system-and-Tour-sales-system)
- [TourProX](https://tourprox.com/)
- [Weon Website Tour](https://www.weon.website/tour/)
- [OKWebTour](https://okwebtour.com/)
- [Punidea](https://punidea.co.th/tour-website/)
- [Kaitour](https://kaitour.co/)
- [TripNiceDay](https://www.tripniceday.com/)
- [ThaiTravelCenter](https://www.thaitravelcenter.com/)
- [eTravelWay](https://www.etravelway.com/)
- [Klook](https://www.klook.com/)
- [KKday](https://www.kkday.com/)
- [Wanderlog](https://wanderlog.com/)
- [TripIt](https://play.google.com/store/apps/details?id=com.tripit)
- [Tourwriter + AXUS Integration](https://learn.tourwriter.com/portal/en/kb/articles/tourwriter-integration-with-axus-travel-app)
- [moonstride](https://www.moonstride.com/)
- [Manage Your Trip](https://manageyourtrip.com/)
- [LINE Messaging API Pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)
- [LINE Notify Closing Alternatives](https://ke2b.com/en/line-notify-closing-alt/)
- [Tour Operator Software Market Report](https://www.researchandmarkets.com/report/global-tour-operator-software-market)
