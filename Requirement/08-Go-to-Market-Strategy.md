# Go-to-Market Strategy
# NatGan (นัดกัน) — v1.0

**Version:** 1.0
**Date:** 17 March 2026
**Status:** Draft

---

## 1. GTM Overview

### 1.1 สรุป 1 บรรทัด

> **ให้เพื่อน 1 บริษัทใช้จนติด → ขอ referral → ให้ product ขายตัวเองผ่าน "Powered by NatGan"**

### 1.2 หลักการ GTM ของ NatGan

| หลักการ | เหตุผล |
|---|---|
| **Product-Led Growth (PLG)** | ทุก trip link = marketing ฟรี (Powered by NatGan) |
| **Bottom-Up Adoption** | เริ่มจาก 1 คนใน บ.ทัวร์ → ทั้ง บ. ใช้ |
| **Zero Budget Start** | เดือน 1-3 งบ = 0 บาท |
| **ความน่าเชื่อถือ > โฆษณา** | Referral จากเพื่อนในวงการ > Facebook Ads |
| **ลูกทริป = ช่องทางขาย** | ลูกทริปเห็น NatGan → แนะนำ บ.ทัวร์ของตัวเอง |

### 1.3 Target Customer Profile

```
┌─────────────────────────────────────────────┐
│  Ideal Customer Profile (ICP)               │
├─────────────────────────────────────────────┤
│  ใคร:  บริษัททัวร์ขนาดเล็ก-กลาง ในไทย      │
│  ขนาด: 1-20 คน (micro-SME ถึง SME)         │
│  ทำอะไร: จัด group tour ต่างประเทศ           │
│  ปัญหา: ส่ง itinerary ทาง LINE → ข้อมูลจม   │
│  ใช้อะไรอยู่: LINE Group + PDF/Canva         │
│  งบ IT: 0-500 บ/เดือน                       │
│  คนตัดสินใจ: เจ้าของ / ผู้จัดการ              │
└─────────────────────────────────────────────┘
```

**Persona หลัก:**

| Persona | ชื่อ | Pain Point | Trigger ที่จะซื้อ |
|---|---|---|---|
| **The Overwhelmed Owner** | พี่นก | มีทริป 5 อันพร้อมกัน ส่ง PDF ทาง LINE ไม่ไหว | ลูกทริปโทรถามซ้ำเรื่อง flight time ทุกวัน |
| **The Tech-Savvy Guide** | เจ ไกด์ | อยากให้ลูกทริปเตรียมตัวมาดี เปิดดูข้อมูลก่อนไป | เห็น NatGan จากทริปที่ตัวเองไป → อยากใช้บ้าง |
| **The Growing Agency** | คุณสมชาย MD | บริษัทโตเร็ว อยากมีระบบ professional | เสียลูกค้าเพราะส่ง itinerary ผิดเวอร์ชัน |

---

## 2. Pricing Strategy

### 2.1 Pricing Model

```
┌─────────────────────────────────────────────────┐
│                                                   │
│   Free             Pro              Business      │
│   0 บ/เดือน        299 บ/เดือน       TBD          │
│                                                   │
│   ✓ 3 active trips  ✓ Unlimited      Phase 3      │
│   ✓ 30 guests/trip  ✓ 100 guests     Enterprise   │
│   ✓ Web Push        ✓ LINE + Push                 │
│   ✓ Basic brand     ✓ Full brand                  │
│   ✗ Powered by      ✓ No badge                    │
│     NatGan badge      (optional)                  │
│   ✗ No analytics    ✓ Read receipt                │
│                       dashboard                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 2.2 Pricing Rationale

| ตัดสินใจ | เหตุผล |
|---|---|
| **Free tier มี 3 ทริป** | พอให้บริษัทเล็กใช้จริง → ติด → อยาก upgrade |
| **Free tier มี "Powered by"** | ทุก trip link ของ free user = โฆษณา NatGan ฟรี |
| **Pro = 299 บ/เดือน** | ถูกกว่ากาแฟ 1 แก้ว/วัน — ไม่ต้องคิดมาก |
| **ไม่มี per-trip pricing** | Flat fee ง่ายกว่า — ไม่ต้องกังวลค่าใช้จ่ายเพิ่ม |
| **LINE noti อยู่ใน Pro** | Free tier ใช้ Web Push ได้อยู่ — LINE เป็น incentive upgrade |

### 2.3 Free → Pro Conversion Triggers

```
Free user สร้างทริปที่ 4        → "อัพเกรด Pro ปลดล็อค unlimited"
Free user มี guest > 30        → "ทริปนี้มี 45 คน อัพเกรดเพื่อรองรับ"
Free user อยากส่ง LINE noti     → "LINE notification เป็นฟีเจอร์ Pro"
Free user อยากซ่อน NatGan badge → "ซ่อน badge ด้วย Pro plan"
Free user ดู read receipt       → "ดู dashboard ใครเห็นแล้ว ด้วย Pro"
```

---

## 3. GTM Phases

### Phase 0: Pre-Launch (สัปดาห์ 1-10) — งบ: 0 บาท

**เป้าหมาย:** สร้าง product ให้พร้อมใช้

| สัปดาห์ | Action | Output |
|---|---|---|
| 1-10 | Dev MVP ตาม MVP Scope Lock | Product พร้อม pilot |
| 8 | สร้าง LINE OA "NatGan นัดกัน" | LINE OA verified |
| 9 | สร้าง Landing Page (natgan.com) | Waitlist form |
| 10 | หา pilot company 1 บริษัท (เพื่อน) | ได้ commitment |

**Landing Page ต้องมี:**
- Hero: "ส่ง itinerary ลูกทริป ไม่ต้องส่ง PDF ซ้ำ"
- 3 pain points (ข้อมูลจม, ไม่รู้ใครเห็น, แก้แล้วไม่รู้)
- Demo link (ทริปโตเกียว)
- Waitlist / Early access form
- "Powered by NatGan" badge preview

---

### Phase 1: Pilot (เดือน 1-3) — งบ: 0 บาท

**เป้าหมาย:** พิสูจน์ product-market fit กับ 1 บริษัท

#### 3.1.1 Pilot Playbook

```
สัปดาห์ 1-2: Onboarding
├── นัดเพื่อน demo 30 นาที (video call หรือเจอตัว)
├── สร้าง company profile ให้
├── สร้างทริปแรกด้วยกัน (hand-holding)
└── ทดสอบ flow: สร้างทริป → publish → share link → guest ดู

สัปดาห์ 3-4: Real Usage
├── ให้ใช้กับทริปจริง 2-3 ทริป
├── ลูกทริปจริงเข้ามาดู
├── ทดสอบ change notification → ลูกทริปได้ noti จริงไหม?
├── เก็บ feedback ทุกวัน (LINE chat กับเพื่อน)
└── Bug fix + quick improvements

สัปดาห์ 5-8: Observe & Iterate
├── ดู analytics: ลูกทริปเปิดดูจริงไหม? กี่ครั้ง?
├── ดู read receipt: กี่ % ที่เห็น notification?
├── ถามเพื่อน: "ถ้าเก็บเงิน 299 บ จ่ายไหม?"
├── ถามลูกทริป: "ดีกว่า PDF ในไลน์ไหม?"
└── ปรับ product ตาม feedback

สัปดาห์ 9-12: Referral
├── ถามเพื่อน: "มีเพื่อนในวงการที่น่าจะสนใจไหม?"
├── ให้เพื่อนแนะนำ 3-5 บริษัท
├── นัด demo กับ referral (เพื่อนช่วยแนะนำ)
└── เป้าหมาย: 5 บริษัท, 15+ ทริป
```

#### 3.1.2 Pilot Success Metrics

| Metric | Target | วัดอย่างไร |
|---|---|---|
| **Trip created** | ≥ 3 ทริปจริง (ไม่ใช่ทดสอบ) | Database count |
| **Guest view rate** | > 80% ของลูกทริปเปิดดูอย่างน้อย 1 ครั้ง | Analytics |
| **Repeat view** | > 50% ของ guest กลับมาดูซ้ำ | Analytics |
| **Notification open** | > 60% ของ noti ถูกเปิด | LINE/Web Push delivery report |
| **Acknowledge rate** | > 40% ของ change noti ถูกกดรับทราบ | Database |
| **NPS (เพื่อน)** | ≥ 8/10 | ถามตรง |
| **NPS (ลูกทริป)** | ≥ 7/10 | Survey |
| **Willingness to pay** | "จ่าย 299 บ ได้เลย" | ถามตรง |
| **Referral** | แนะนำ ≥ 3 บริษัท | นับจริง |

#### 3.1.3 Pilot Red Flags (ถ้าเกิด = ต้อง pivot)

| Red Flag | ความหมาย | Action |
|---|---|---|
| เพื่อนหยุดใช้หลัง 2 สัปดาห์ | Product ไม่ดีพอ / ไม่ solve pain | Deep interview → redesign |
| ลูกทริปไม่เปิดดู (< 30%) | Guest view ไม่ดึงดูด / link ส่งไม่ถึง | ปรับ UX + ปรับวิธีส่ง link |
| ไม่มีใครกด follow | Follow flow ยาก / ไม่เห็นคุณค่า | Simplify UX + add incentive |
| เพื่อนบอก "ฟรีก็ใช้ แต่จ่ายไม่จ่าย" | ไม่มี Pro value | เพิ่ม Pro features ที่มีคุณค่าจริง |
| ลูกทริปบ่น "ดู PDF ง่ายกว่า" | UX ไม่ดีพอ | Redesign guest view |

---

### Phase 2: Early Adopters (เดือน 4-6) — งบ: ~5,000 บ/เดือน

**เป้าหมาย:** 30 accounts (5-10 paying)

#### 3.2.1 Acquisition Channels

| Channel | วิธี | งบ | คาดหวัง |
|---|---|---|---|
| **Referral (หลัก)** | ลูกค้าเดิมแนะนำ → ทั้งคู่ได้ 1 เดือน Pro ฟรี | ~1,000 บ/เดือน | 10-15 accounts |
| **Facebook Groups** | โพสต์ใน "ชมรมไกด์ไทย" "กลุ่มบริษัททัวร์" | ฟรี | 5-8 accounts |
| **Facebook Ads** | Target: เจ้าของธุรกิจท่องเที่ยว, ไกด์นำเที่ยว | ~3,000 บ/เดือน | 5-10 accounts |
| **Content** | บทความ "5 ปัญหาส่ง itinerary ที่ทุก บ.ทัวร์เจอ" | ~1,000 บ/เดือน | SEO long-term |
| **Powered by** | ลูกทริปเห็น badge → แนะนำ บ.ทัวร์ของตัวเอง | ฟรี | 3-5 accounts |

#### 3.2.2 Referral Program Design

```
┌──────────────────────────────────────────────┐
│          NatGan Referral Program              │
├──────────────────────────────────────────────┤
│                                              │
│  ผู้แนะนำ (Referrer):                         │
│  ✓ ได้ Pro ฟรี 1 เดือน ต่อทุก referral        │
│  ✓ สะสมได้ไม่จำกัด                            │
│                                              │
│  ผู้ถูกแนะนำ (Referee):                        │
│  ✓ ได้ Pro ฟรี 1 เดือน (แทน 14 วัน trial)     │
│                                              │
│  วิธีแนะนำ:                                    │
│  ✓ คัดลอก referral link จาก dashboard         │
│  ✓ ส่งทาง LINE / Facebook                     │
│                                              │
│  Tracking:                                   │
│  ✓ Unique referral code ต่อ account           │
│  ✓ Dashboard แสดงจำนวน referral               │
│                                              │
└──────────────────────────────────────────────┘
```

#### 3.2.3 Facebook Groups Strategy

**กลุ่มเป้าหมาย:**

| กลุ่ม | สมาชิก (ประมาณ) | วิธีเข้าถึง |
|---|---|---|
| ชมรมมัคคุเทศก์ไทย | 10,000+ | โพสต์ share ประสบการณ์ ไม่ขายตรง |
| กลุ่มบริษัททัวร์ไทย | 5,000+ | Case study จาก pilot |
| ไกด์อิสระ | 3,000+ | Tutorial video "สร้าง itinerary 5 นาที" |
| ท่องเที่ยวไทย (กลุ่มรวม) | 50,000+ | ให้ลูกทริปที่ใช้แล้ว share ประสบการณ์ |

**Content Calendar (สัปดาห์ละ 2 โพสต์):**

| สัปดาห์ | โพสต์ 1 | โพสต์ 2 |
|---|---|---|
| 1 | "ปัญหาส่ง itinerary ทาง LINE ที่ไกด์ทุกคนเจอ" | Case study: pilot company |
| 2 | "วิธีทำให้ลูกทริปเตรียมตัวมาดี" | Demo video: สร้าง trip 5 นาที |
| 3 | "ลูกทริปแชร์: ชอบดูบนมือถือมากกว่า PDF" | Before/After: LINE Group vs NatGan |
| 4 | "ฟีเจอร์รับทราบ — รู้ว่าใครเห็นแล้ว" | Q&A: ตอบคำถามจากกลุ่ม |

**กฎเหล็ก:**
1. ไม่ขายตรง — share ประสบการณ์ + ให้คุณค่าก่อน
2. ตอบคำถามในกลุ่มทุกวัน — สร้างความน่าเชื่อถือ
3. ให้ pilot company โพสต์เอง (authentic > branded content)

#### 3.2.4 Facebook Ads Strategy

**Budget:** 3,000 บ/เดือน (100 บ/วัน)

| Campaign | Objective | Targeting | Creative |
|---|---|---|---|
| **Awareness** | Traffic | เจ้าของธุรกิจท่องเที่ยว, 25-55 ปี, ไทย | Video: "ส่ง itinerary ไม่ต้อง PDF อีกต่อไป" |
| **Consideration** | Lead gen | Retarget: คนที่เข้า natgan.com | Carousel: 3 pain points + solution |
| **Conversion** | Sign up | Retarget: คนดู demo > 30 วินาที | CTA: "ทดลองฟรี สร้างทริปแรก" |

**Cost Targets:**
- CPM: ~100-200 บ (Thai market)
- CPC: ~5-15 บ
- Cost per signup: ~150-300 บ
- Cost per paying customer: ~1,500-3,000 บ (จาก free → Pro conversion ~10%)

---

### Phase 3: Growth (เดือน 7-12) — งบ: ~15,000 บ/เดือน

**เป้าหมาย:** 100+ accounts, 30+ paying, product-market fit ชัดเจน

#### 3.3.1 Growth Channels

| Channel | งบ | คาดหวัง/เดือน | CAC |
|---|---|---|---|
| **Organic (Powered by)** | ฟรี | 10-20 signups | 0 บ |
| **Referral Program** | ~2,000 บ | 5-10 signups | ~300 บ |
| **SEO + Blog** | ~3,000 บ | 5-10 signups | ~500 บ |
| **Facebook/Google Ads** | ~8,000 บ | 10-15 signups | ~600 บ |
| **Partnerships** | ~2,000 บ | 5-10 signups | ~300 บ |
| **รวม** | **~15,000** | **35-65 signups** | **~350 บ** |

#### 3.3.2 SEO Strategy

**Target Keywords:**

| Keyword | Search Volume (est.) | Difficulty | หน้าที่สร้าง |
|---|---|---|---|
| ระบบจัดการทัวร์ | 500/เดือน | กลาง | Landing page |
| ส่ง itinerary ลูกค้า | 200/เดือน | ต่ำ | Blog post |
| โปรแกรมทัวร์ออนไลน์ | 300/เดือน | กลาง | Feature page |
| แจ้งเตือนลูกทริป | 100/เดือน | ต่ำ | Blog post |
| trip planner บริษัททัวร์ | 150/เดือน | ต่ำ | Comparison page |
| ส่ง itinerary ทาง line | 200/เดือน | ต่ำ | Blog post |

**Content Strategy:**
- 2 blog posts / เดือน (SEO-focused)
- 1 case study / เดือน (จากลูกค้าจริง)
- 1 tutorial video / เดือน (YouTube + Facebook)

#### 3.3.3 Partnership Strategy

| Partner | เข้าถึงอย่างไร | Win-Win |
|---|---|---|
| **สมาคมมัคคุเทศก์อาชีพ** | ติดต่อสมาคม → เสนอ co-host webinar | NatGan ได้ credibility + reach, สมาคมได้ content |
| **Travel blogger / influencer** | ให้ Pro plan ฟรี → review | NatGan ได้ awareness, blogger ได้ content |
| **ที่ปรึกษาธุรกิจท่องเที่ยว** | ให้ referral commission | NatGan ได้ leads, ที่ปรึกษาได้ passive income |
| **TAT (ททท.)** | เสนอเป็น Thai startup showcase | NatGan ได้ credibility + PR |

---

## 4. Viral Loop Engine

### 4.1 How Viral Loop Works

```
บริษัททัวร์สร้างทริป (1 account)
     │
     ├── Publish → Share link ทาง LINE/Email
     │
     ▼
ลูกทริป 30 คน เปิดดู (30 views)
     │
     ├── 10 คนแชร์ให้เพื่อน/ครอบครัว (10 shares)
     │     │
     │     ▼
     │   40+ คนเห็น NatGan (40 impressions)
     │     │
     │     ├── 2-3 คนเป็นเจ้าของ บ.ทัวร์ / ไกด์
     │     │     │
     │     │     ▼
     │     │   "Powered by NatGan" → คลิก → Landing page
     │     │     │
     │     │     ▼
     │     │   สมัครใช้งาน (1 new account)
     │     │     │
     │     │     ▼
     │     │   ──── วนลูปซ้ำ ────
     │     │
     │     └── บางคนแนะนำ บ.ทัวร์ที่ตัวเองใช้
     │           │
     │           ▼
     │         "ลองใช้ NatGan สิ ทริปที่เพิ่งไป เขาใช้แล้วดีมาก"
     │
     └── Immigration View → Officer เห็น → ไม่ใช่ viral แต่สร้าง credibility
```

### 4.2 Viral Metrics

| Metric | สูตร | Target |
|---|---|---|
| **Viral Coefficient (K)** | (avg guests/trip) × (share rate) × (conversion rate) | K > 0.3 |
| **Time to Viral** | วันที่ trip ถูกสร้าง → วันที่ new account จาก trip นั้น | < 30 วัน |
| **Powered by CTR** | clicks on "Powered by" / total guest views | > 2% |
| **Badge to Signup** | signups from Powered by / clicks on Powered by | > 5% |

### 4.3 Viral Optimization Tactics

| Tactic | วิธี | Impact |
|---|---|---|
| **"Powered by" ต้องสวย** | ออกแบบ badge ให้น่าคลิก ไม่ใช่แค่ text link | CTR ↑ |
| **Share button ใน guest view** | ลูกทริปแชร์ link ให้เพื่อนง่าย | Shares ↑ |
| **Social proof ใน Landing** | "XXX บริษัทใช้งาน" + testimonials | Conversion ↑ |
| **Demo trip ที่ Landing page** | ให้ลองดู trip จริง ก่อนสมัคร | Conversion ↑ |
| **Onboarding ง่ายมาก** | สมัคร → สร้างทริปแรก < 5 นาที | Activation ↑ |

---

## 5. Sales Playbook

### 5.1 Sales Process (Self-Serve)

```
Discovery                    Consideration               Decision
(เจอ NatGan)                 (ลองดู)                      (สมัคร)
     │                            │                          │
     ├── Powered by badge         ├── ดู Demo trip            ├── สมัคร Free
     ├── Facebook post            ├── ดู Landing page         ├── สร้างทริปแรก
     ├── Referral จากเพื่อน        ├── ดู Feature page         ├── ใช้จริง 1-2 ทริป
     ├── Google search            ├── ดู Case study           ├── ติด → upgrade Pro
     └── Facebook ads             └── ดู Video tutorial       └── 299 บ/เดือน
                                                                   │
                                                              Expansion
                                                              (โตต่อ)
                                                                   │
                                                              ├── แนะนำเพื่อน
                                                              ├── ใช้ทุกทริป
                                                              └── Team ใช้ด้วย
```

### 5.2 Sales Process (High-Touch สำหรับ Agency ใหญ่)

สำหรับ agency ที่มี 5+ ทริป/เดือน — ต้อง demo ตัวต่อตัว

| Step | Action | เครื่องมือ |
|---|---|---|
| 1. Lead | ได้ contact จาก referral / inbound | LINE / Email |
| 2. Qualify | ถามจำนวนทริป/เดือน, pain point | LINE chat |
| 3. Demo | นัด video call 30 นาที | Google Meet |
| 4. Trial | สร้าง account + ช่วย setup ทริปแรก | Hand-holding |
| 5. Follow up | ถามผลหลัง 1 สัปดาห์ | LINE chat |
| 6. Close | เสนอ Pro plan | Payment link |

### 5.3 Objection Handling

| คำถาม/ข้อกังวล | คำตอบ |
|---|---|
| "LINE ก็ส่งได้อยู่แล้ว" | "ใช่ครับ แต่ลูกทริปหา flight time ในแชทเจอไหม? แล้วรู้ไหมว่าใครเห็นข้อมูลล่าสุดแล้ว?" |
| "PDF สวยกว่า" | "NatGan สวยเหมือนกันครับ แถม update ได้แบบ live ไม่ต้องส่งไฟล์ใหม่ทุกครั้ง" |
| "ลูกค้าไม่น่าจะดู" | "เราทดสอบแล้ว 80%+ เปิดดูครับ เพราะเข้าง่ายมาก ไม่ต้อง login ไม่ต้องลง app" |
| "แพง" | "Free tier ใช้ได้เลยไม่เสียตังค์ครับ ลองก่อน ถ้าชอบค่อย upgrade แค่ 299 บ" |
| "ข้อมูลปลอดภัยไหม" | "ใช้ PostgreSQL + Vercel infrastructure + encryption ทุกชั้น" |
| "ใช้ยากไหม" | "สร้างทริปแรกใน 5 นาที ลูกทริปเปิด link ดูได้เลยไม่ต้องสอน" |

---

## 6. Content Marketing Plan

### 6.1 Content Pillars

| Pillar | เป้าหมาย | ตัวอย่าง |
|---|---|---|
| **Pain Point Stories** | สร้าง awareness ว่ามีปัญหาอยู่ | "5 ปัญหาที่ บ.ทัวร์ทุกที่เจอตอนส่ง itinerary" |
| **How-To / Tutorial** | สอนใช้ + SEO | "สร้าง itinerary สวยๆ ส่งลูกทริปใน 5 นาที" |
| **Case Study** | Social proof | "บ.ทัวร์ XYZ ลดเวลาตอบคำถามลูกทริป 70%" |
| **Industry Insights** | Thought leadership | "เทรนด์ท่องเที่ยวไทย 2569 สิ่งที่ บ.ทัวร์ต้องเตรียม" |

### 6.2 Content Calendar (เดือน 4-6)

| สัปดาห์ | Blog | Social | Video |
|---|---|---|---|
| 1 | Pain point: "ลูกทริปถามซ้ำ" | FB: ภาพ before/after | - |
| 2 | Tutorial: "สร้างทริปแรก" | FB: Demo GIF | YouTube: Walkthrough |
| 3 | Case study: Pilot company | FB: Testimonial quote | - |
| 4 | SEO: "ส่ง itinerary ทาง line" | FB: Tips 3 ข้อ | - |
| 5 | Pain point: "PDF version ผิด" | FB: Meme ไกด์เข้าใจ | - |
| 6 | Tutorial: "ตั้งค่า notification" | FB: Feature highlight | YouTube: Feature deep-dive |
| 7 | Case study: 2nd company | FB: Stat infographic | - |
| 8 | SEO: "โปรแกรมทัวร์ออนไลน์" | FB: Comparison chart | - |

---

## 7. Key Metrics & Dashboard

### 7.1 Pirate Metrics (AARRR)

| Stage | Metric | Target (6 เดือน) | วัดจากอะไร |
|---|---|---|---|
| **Acquisition** | New signups / เดือน | 30+ | Auth.js / database |
| **Activation** | สร้างทริปแรกใน 7 วัน | > 60% | Database |
| **Retention** | ใช้งานเดือนที่ 2 | > 50% | Login activity |
| **Revenue** | Free → Pro conversion | > 10% | Subscription |
| **Referral** | Referral signups / total | > 20% | Referral code |

### 7.2 North Star Metric

> **จำนวน trip links ที่ถูกเปิดดูโดย guest ต่อสัปดาห์**

เหตุผล: metric นี้วัดทั้ง supply (บ.ทัวร์สร้างทริป) และ demand (ลูกทริปใช้จริง) ในตัวเดียว

### 7.3 Weekly Dashboard

```
┌─────────────────────────────────────────┐
│  NatGan Weekly Dashboard                │
├─────────────────────────────────────────┤
│                                         │
│  📊 Acquisition                         │
│  New signups:     12  (+3 vs last week) │
│  From referral:    5  (42%)             │
│  From Powered by:  3  (25%)             │
│  From ads:         4  (33%)             │
│                                         │
│  ✅ Activation                           │
│  Created 1st trip: 8/12 (67%)           │
│  Published:        6/8  (75%)           │
│                                         │
│  🔄 Retention                            │
│  Active this week: 45/60 (75%)          │
│  Trips created:    28                   │
│                                         │
│  ⭐ North Star                           │
│  Guest views:      1,240 (+15%)         │
│                                         │
│  💰 Revenue                              │
│  Pro accounts:     8                    │
│  MRR:             2,392 บ               │
│  Free → Pro:       2 this week          │
│                                         │
│  🔗 Viral                                │
│  Powered by clicks:  62                 │
│  Badge → Signup:      3 (4.8%)          │
│  Viral coefficient:   0.28              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 8. Timeline Summary

```
Pre-Launch          Phase 1              Phase 2              Phase 3
(สัปดาห์ 1-10)      (เดือน 1-3)           (เดือน 4-6)           (เดือน 7-12)
│                   │                    │                    │
├── Build MVP       ├── 1 บ.ทัวร์ pilot    ├── 30 accounts      ├── 100+ accounts
├── Landing page    ├── 3-5 ทริปจริง       ├── 5-10 paying      ├── 30+ paying
├── LINE OA setup   ├── Feedback loop     ├── Referral program  ├── SEO + content
├── Find pilot      ├── Iterate product   ├── FB Groups + Ads   ├── Partnerships
│                   ├── Get referrals     ├── Content start     ├── Scale ads
│                   │                    │                    │
งบ: 0 บ             งบ: 0 บ               งบ: ~5,000 บ/เดือน    งบ: ~15,000 บ/เดือน
│                   │                    │                    │
KPI: Product ready  KPI: PMF signal      KPI: Repeatable       KPI: Scalable
                                          acquisition           growth
```

---

## 9. Risk & Contingency

| Risk | โอกาส | แผนรับมือ |
|---|---|---|
| **Pilot company ไม่ใช้จริง** | กลาง | หา pilot company 2 → มี backup |
| **Free users ไม่ upgrade** | สูง | ปรับ Pro value proposition + ลดราคาช่วง early |
| **Facebook Groups ไม่ให้โพสต์** | กลาง | เน้น value content > promo + สร้างกลุ่มเอง |
| **Ads ไม่ work (CAC สูง)** | กลาง | Shift budget ไป content + referral |
| **ไม่มีใครคลิก Powered by** | ต่ำ-กลาง | A/B test badge design + placement |
| **คนไทยไม่อยากจ่ายค่า SaaS** | สูง | เน้น ROI: "299 บ vs เสียลูกค้า 1 คน" + เพิ่ม free tier value |

---

## 10. สรุป

### GTM ของ NatGan = 3 เครื่องยนต์

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🔄 Engine 1: Viral Loop (ฟรี)                                 │
│   ├── ทุก trip link มี "Powered by NatGan"                      │
│   ├── ลูกทริป 30 คน/ทริป × 10 ทริป/เดือน = 300 คนเห็น          │
│   └── 2-3% convert = 6-9 signups/เดือน ฟรี                     │
│                                                                 │
│   🤝 Engine 2: Referral (ต้นทุนต่ำ)                              │
│   ├── ลูกค้าแนะนำเพื่อนในวงการ                                   │
│   ├── ทั้งคู่ได้ Pro ฟรี 1 เดือน                                  │
│   └── CAC = ~300 บ/account (ค่า Pro ที่ให้ฟรี)                  │
│                                                                 │
│   📢 Engine 3: Content + Ads (ลงทุน)                             │
│   ├── Blog + SEO สำหรับ long-term organic                       │
│   ├── Facebook Ads สำหรับ short-term boost                      │
│   └── CAC = ~600 บ/account                                     │
│                                                                 │
│   รวม 3 engines = 35-65 signups/เดือน @ Phase 3                │
│   Target: 100+ accounts ใน 12 เดือน                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**กุญแจสำเร็จ:**
1. **Pilot ต้องสำเร็จ** — ถ้าเพื่อน 1 คนใช้แล้วชอบ ทุกอย่างจะง่ายขึ้น
2. **Powered by badge ต้องมีคนคลิก** — นี่คือ growth engine ที่ CAC = 0
3. **299 บ ต้อง feel cheap** — ลูกค้าต้องรู้สึกว่า "แค่นี้เอง"
4. **Content ต้อง authentic** — ใช้เรื่องจริง คนจริง ไม่ใช่ marketing speak

---

*Document End — NatGan Go-to-Market Strategy v1.0*
