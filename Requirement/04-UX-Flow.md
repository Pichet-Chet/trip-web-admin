# UX Flow & Screen Design
# NatGan (นัดกัน) — v1.0

**Version:** 1.0
**Date:** 17 March 2026
**Status:** Draft
**Reference:** 01-SRD, 03-MVP-Scope-Lock

---

## 0. Design Philosophy

### หลักคิดหลัก: "อยากรับรู้ แต่ไม่อยากรับเรื่อง"

ลูกทริปจ่ายเงินไปเที่ยว ไม่ใช่ไปทำงาน — ระบบต้อง:

1. **ภาพนำ ข้อความตาม** — Cover image ใหญ่, emoji เป็นสัญลักษณ์, ข้อความสั้นกระชับ
2. **สร้างบรรยากาศร่วม** — เปิด trip มาแล้วตื่นเต้น ไม่ใช่เปิดมาแล้วปวดหัว
3. **Zero Learning Curve ฝั่ง Guest** — เปิด link = เห็นทุกอย่าง ไม่ต้องกดอะไรก่อน
4. **ข้อมูลจุดสำคัญเท่านั้น** — เวลา + สถานที่ + emoji พอ, detail ปล่อยให้ไกด์บอกหน้างาน
5. **แจ้งเตือนแบบ passive** — noti มาถึงเอง ไม่ต้องเข้าไปเช็ค

### วิจารณ์ปัญหาของคู่แข่ง

| ปัญหาที่เจอ | ตัวอย่าง | NatGan แก้ยังไง |
|---|---|---|
| ข้อความยุบยิบ แน่นเกินไป | Wanderlog, TripAdvisor — 20+ fields ต่อ activity | ≤4 fields: เวลา, สถานที่, emoji, หมายเหตุสั้น |
| UI ออกแบบสำหรับคนจัด ไม่ใช่คนไป | Google Sheets itinerary — ตารางเต็มจอ | แยก Admin view (ตาราง) vs Guest view (visual card) |
| ไม่มีอารมณ์ร่วม | PDF itinerary — ขาวดำ ตัวอักษรเล็ก | Cover image + gradient + emoji = ความตื่นเต้น |
| ต้อง login ก่อนดู | บาง app ต้องสมัครก่อน | Guest view = เปิด URL จบ ไม่ต้อง login |
| Mobile unfriendly | หลาย app ออกแบบ desktop-first | Mobile-first ทุกหน้า (80%+ user เปิดจาก LINE) |

### วิจารณ์ Demo App ที่มีอยู่ + สิ่งที่ต้องปรับ

**สิ่งที่ดีมากในตัว Demo → เอาไปใช้ต่อ:**
- ✅ Hero section มีรูป cover ใหญ่ สร้างอารมณ์
- ✅ Day card มี cover image + gradient header = สวย scan ง่าย
- ✅ Sticky day navigation — กดเลือกวันได้ทันที
- ✅ Activity item เรียบง่าย: เวลา + emoji + ชื่อ + notes
- ✅ Map link กดเปิด Google Maps ได้เลย
- ✅ Route link รวม waypoints ทั้งวัน
- ✅ Emergency section + Phrases — useful ไม่ยุบยิบ

**สิ่งที่ต้องปรับสำหรับ SaaS:**
- ⚠️ ข้อมูลทั้งหมด hardcode ใน code → ต้องมาจาก database
- ⚠️ ไม่มี notification flow → ต้องเพิ่ม Follow button + Acknowledge banner
- ⚠️ ไม่มี company branding → ต้องแสดง logo + contacts ของบริษัททัวร์
- ⚠️ ไม่มี Immigration view → ต้องเพิ่มปุ่มสลับโหมด
- ⚠️ Cover image ตอนนี้ใช้ Unsplash hardcode → Admin ต้อง upload เอง หรือเลือกจาก preset
- 💡 **ข้อเสนอใหม่:** เพิ่ม "Trip Countdown" บน Hero — "อีก 12 วัน!" สร้างความตื่นเต้น
- 💡 **ข้อเสนอใหม่:** เพิ่ม "Weather Preview" เล็กๆ ถ้าเป็นทริปต่างประเทศ — แค่ icon + องศา ไม่ต้อง detail

---

## 1. User Roles & Access

```
┌─────────────────────────────────────────────────────────┐
│                    NatGan Platform                       │
│                                                         │
│  👔 Admin (บริษัททัวร์/ไกด์)                              │
│  ├── Login required                                     │
│  ├── สร้าง/แก้ Trip Plan                                 │
│  ├── ดู Dashboard                                       │
│  └── ดู Read Receipt                                    │
│                                                         │
│  👤 Guest (ลูกทริป — ไม่ได้ follow)                       │
│  ├── No login                                           │
│  ├── เปิด URL → ดู Trip Plan                             │
│  └── เห็นเฉพาะ snapshot ณ ตอนที่เปิด                     │
│                                                         │
│  🔔 Follower (ลูกทริป — กด follow แล้ว)                   │
│  ├── No login                                           │
│  ├── ดู Trip Plan + ได้ noti เมื่อเปลี่ยน                  │
│  └── กดรับทราบได้                                        │
│                                                         │
│  🛂 Immigration Mode (ลูกทริปยื่น ตม.)                    │
│  ├── No login                                           │
│  ├── ข้อมูล official เท่านั้น                               │
│  └── Auto-language + Offline                             │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Screen Map (All Screens in MVP)

```
Admin Side (Login Required)
═══════════════════════════
A1. Login / Register
A2. Company Profile Setup
A3. Dashboard (Trip List)
A4. Trip Builder — ข้อมูลทั่วไป
A5. Trip Builder — Day & Activity Editor
A6. Trip Builder — Preview
A7. Publish & Share (URL + QR)
A8. Read Receipt Dashboard
A9. Usage & Limits

Guest Side (No Login)
═══════════════════════════
G1. Trip View — Hero + Day Cards (= หน้าหลัก)
G2. Follow Modal (เลือก LINE / Web Push)
G3. Acknowledge Banner
G4. Immigration-Friendly View
```

**รวม 13 หน้า — lean พอสำหรับ MVP**

---

## 3. User Journey: Admin (บริษัททัวร์)

### Flow 3.1: First-time Setup

```
[A1] Register
│    ├── Email + Password
│    └── ยืนยัน email (link)
│
▼
[A2] Company Profile Setup ← First login จะเด้งมาหน้านี้
│    ├── 🏢 ชื่อบริษัท / ชื่อไกด์
│    ├── 📷 Upload Logo (ปุ่มเดียว drag & drop)
│    ├── 📞 ช่องทางติดต่อ
│    │    ├── เบอร์โทร
│    │    ├── LINE ID
│    │    ├── Facebook (optional)
│    │    └── Instagram (optional)
│    └── 💾 บันทึก → ไป Dashboard
│
▼
[A3] Dashboard — ว่างเปล่า + CTA ชัด
     ┌──────────────────────────────────┐
     │  ยังไม่มีทริป                       │
     │                                    │
     │  🌏  [+ สร้างทริปแรก]               │
     │                                    │
     │  "สร้างทริปแรกของคุณ               │
     │   ส่งให้ลูกทริปภายใน 5 นาที"       │
     └──────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอ:**
- Empty state ต้อง **ไม่ว่างเปล่า** — ต้องมี illustration + คำชวน + ปุ่มเด่น
- ประโยค "ส่งให้ลูกทริปภายใน 5 นาที" สร้าง expectation ว่าเร็ว → ต้อง deliver ได้จริง
- อาจมี interactive tour (tooltip 3-4 ขั้นตอน) สำหรับ first-time user แต่ **MVP อาจข้ามได้**

---

### Flow 3.2: สร้างทริปใหม่ (Core Admin Flow)

```
[A3] Dashboard → กด [+ สร้างทริปใหม่]
│
▼
[A4] Trip Builder — Step 1: ข้อมูลทั่วไป
│    ┌────────────────────────────────────────────────┐
│    │  📷 Cover Image                                │
│    │  ┌──────────────────────────────┐              │
│    │  │  [ลากรูป หรือ คลิกเลือก]      │              │
│    │  │  หรือเลือกจาก preset:          │              │
│    │  │  🏖️ ทะเล  🏔️ ภูเขา  🗼 ญี่ปุ่น  │              │
│    │  │  🇰🇷 เกาหลี  🏯 จีน  🌏 อื่นๆ   │              │
│    │  └──────────────────────────────┘              │
│    │                                                │
│    │  ชื่อทริป: [Tokyo Winter Trip 2026          ]  │
│    │  วันเริ่ม: [2026-04-15] → วันสิ้นสุด: [2026-04-22] │
│    │  จุดหมาย: [Japan                            ]  │
│    │  จำนวนผู้เดินทาง: [25]                          │
│    │  ภาษาหลัก: (●) ไทย  ( ) EN  ( ) JP             │
│    │                                                │
│    │  ─── ข้อมูลการเดินทาง ───                       │
│    │  สายการบิน: [Xiamen Air    ] เที่ยวบิน: [MF834]  │
│    │                                                │
│    │  ─── ที่พัก ───                                  │
│    │  ชื่อ: [The QUBE Hotel Chiba          ]         │
│    │  ที่อยู่: [1-2-3 Chiba, Japan          ]         │
│    │  เบอร์โทร: [+81-XX-XXXX-XXXX          ]         │
│    │  [+ เพิ่มที่พักอีก]                               │
│    │                                                │
│    │         [ถัดไป →]                                │
│    └────────────────────────────────────────────────┘
│
▼
[A5] Trip Builder — Step 2: Day & Activity Editor
│    ┌────────────────────────────────────────────────┐
│    │  Day tabs: [Day 1 ✈️] [Day 2 🗼] [Day 3 🗻] [+]  │
│    │  ─────────────────────────────────────────────  │
│    │                                                │
│    │  Day 1 — 15 เม.ย. 2026                         │
│    │  ชื่อวัน: [เดินทาง กรุงเทพ → โตเกียว     ]       │
│    │  📷 Cover: [เลือกรูป]                            │
│    │                                                │
│    │  Activities:                                     │
│    │  ┌─────────────────────────────────────┐       │
│    │  │ ⠿ 🧳 [ก่อน 15:40] [สนามบินสุวรรณภูมิ]  │       │
│    │  │   หมายเหตุ: [เช็คอิน counter E     ]   │       │
│    │  │   📍 Google Maps: [auto-fill]          │       │
│    │  │                            [🗑️]        │       │
│    │  └─────────────────────────────────────┘       │
│    │  ┌─────────────────────────────────────┐       │
│    │  │ ⠿ ✈️ [17:40] [สนามบินสุวรรณภูมิ]      │       │
│    │  │   หมายเหตุ: [MF834 → เซียเมิน       ]   │       │
│    │  │                            [🗑️]        │       │
│    │  └─────────────────────────────────────┘       │
│    │                                                │
│    │  [+ เพิ่มกิจกรรม]                                │
│    │                                                │
│    │  ─── เบอร์ฉุกเฉิน ─── (ใส่ทีเดียว ใช้ทั้งทริป)   │
│    │  [🆘 สถานทูต: +81-3-...]  [+ เพิ่ม]              │
│    │                                                │
│    │  ─── หมายเหตุสำคัญ ───                          │
│    │  [Free text area                          ]    │
│    │                                                │
│    │      [← ก่อนหน้า]    [Preview 👁️]               │
│    └────────────────────────────────────────────────┘
│
▼
[A6] Trip Builder — Step 3: Preview
│    ┌────────────────────────────────────────────────┐
│    │  📱 Preview (แสดงเหมือน Guest View จริง)        │
│    │  ┌──────────────────────────┐                  │
│    │  │  [Mobile Preview Frame]   │                  │
│    │  │  ┌────────────────────┐  │                  │
│    │  │  │  Hero Image         │  │                  │
│    │  │  │  Trip Title         │  │                  │
│    │  │  ├────────────────────┤  │                  │
│    │  │  │  Day 1 Card         │  │                  │
│    │  │  │  Day 2 Card         │  │                  │
│    │  │  │  ...                │  │                  │
│    │  │  └────────────────────┘  │                  │
│    │  └──────────────────────────┘                  │
│    │                                                │
│    │  ⚠️ ตรวจสอบ:                                    │
│    │  ☑ ข้อมูลครบทุกวัน  ☑ รูปแสดงถูกต้อง             │
│    │  ☑ Google Maps link ใช้ได้                       │
│    │                                                │
│    │   [← แก้ไข]    [🚀 Publish]                     │
│    └────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอ:**

1. **ปุ่ม Preset Cover Image สำคัญมาก** — Admin ส่วนใหญ่ไม่มีรูปสวยพร้อมอัป ถ้ากดเลือกจากชุดสำเร็จรูป (ญี่ปุ่น, เกาหลี, ทะเลไทย) จะ reduce friction มาก → **MVP ควรมีชุดรูป preset 10-15 รูปเลย**

2. **Activity Editor ต้อง drag-to-reorder** — ⠿ icon ข้างซ้ายลากเรียงได้ สำคัญมากเพราะไกด์มักปรับลำดับบ่อย

3. **Auto-generate Day จากวันเริ่ม-สิ้นสุด** — ใส่วันที่ → Day 1, Day 2... โผล่มาเลย ไม่ต้องกด add ทีละวัน

4. **Preview ต้องเป็น responsive ใน mobile frame** — Admin อาจใช้ desktop สร้าง แต่ลูกทริปเปิดจาก LINE mobile → preview ต้อง simulate mobile view

5. **ข้อเสนอใหม่: "Quick Add" mode** — พิมพ์แบบ shorthand เช่น "09:00 วัดอรุณ" แล้วระบบ parse เป็น time + place ให้ ลดการกรอก form

---

### Flow 3.3: Publish & Share

```
[A6] Preview → กด [🚀 Publish]
│
▼
[A7] Publish & Share
     ┌────────────────────────────────────────────────┐
     │                                                │
     │  ✅ Trip Published!                             │
     │                                                │
     │  🔗 URL:                                       │
     │  ┌──────────────────────────────────────┐      │
     │  │ natgan.com/t/tokyo-winter-2026       │ [📋] │
     │  └──────────────────────────────────────┘      │
     │  [แก้ slug]                                     │
     │                                                │
     │  📱 QR Code:                                    │
     │  ┌──────────────┐                              │
     │  │              │                              │
     │  │   [QR Code]  │                              │
     │  │              │                              │
     │  └──────────────┘                              │
     │  [📥 Download PNG] [📥 Download พร้อม Logo]      │
     │                                                │
     │  ─── แชร์ให้ลูกทริป ───                          │
     │  [📤 Share via LINE]  [📋 Copy Link]             │
     │                                                │
     │  ─── ข้อความสำเร็จรูป ───                        │
     │  ┌──────────────────────────────────────┐      │
     │  │ สวัสดีค่ะ 🙏                           │      │
     │  │ ทริป Tokyo Winter 2026 พร้อมแล้วค่ะ     │      │
     │  │ เปิดดู itinerary ได้ที่:                  │      │
     │  │ 👉 natgan.com/t/tokyo-winter-2026      │      │
     │  │                                        │      │
     │  │ กด "ติดตาม" เพื่อรับแจ้งเตือน            │      │
     │  │ เมื่อมีการเปลี่ยนแปลงค่ะ 🔔              │      │
     │  └──────────────────────────────────────┘      │
     │  [📋 Copy ข้อความ]                              │
     │                                                │
     │      [← กลับ Dashboard]                         │
     └────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอ:**

1. **"ข้อความสำเร็จรูป" คือ killer UX** — Admin copy แปะใน LINE group ได้ทันที ไม่ต้องพิมพ์เอง ลด friction จาก "publish" ไปถึง "ลูกทริปเห็น" เหลือแค่ 2 คลิก

2. **QR Code พร้อม Logo** — Download ได้ 2 แบบ: QR เปล่า กับ QR มี logo บริษัทตรงกลาง → ใช้ปริ้นแปะบนเอกสาร/ป้ายได้เลย

3. **Share via LINE ควรเป็น LIFF share** — ถ้าทำได้ กดแล้วเปิด LINE share target picker → เลือก group → ส่ง link + preview card สวยๆ ไปเลย (แต่ MVP อาจแค่ copy link + ข้อความ ก็พอ)

---

### Flow 3.4: แก้ไข Trip Plan (หลัง Publish)

```
[A3] Dashboard → เลือกทริป → [แก้ไข]
│
▼
[A5] Trip Builder (Edit mode)
│    แก้ไขเสร็จ → กด [บันทึก]
│
▼    ⚡ ระบบ detect การเปลี่ยนแปลง อัตโนมัติ
│
     ┌────────────────────────────────────────────────┐
     │  📝 สรุปการเปลี่ยนแปลง                          │
     │                                                │
     │  Day 2 (16 เม.ย.):                              │
     │   • เปลี่ยนเวลา teamLab: 08:30 → 09:00         │
     │   • เพิ่มกิจกรรม: "แวะ 7-Eleven" เวลา 08:00     │
     │                                                │
     │  [✅ ส่งแจ้งเตือนให้ 18 คนที่ follow]              │
     │  [❌ บันทึกอย่างเดียว ไม่ส่ง noti]                │
     └────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอ:**

1. **ต้องให้ Admin เลือกได้ว่าจะส่ง noti หรือไม่** — บางทีแก้แค่ typo ไม่ต้องรบกวนลูกทริป ถ้าส่ง noti ทุกครั้ง Admin จะไม่กล้าแก้ → **สำคัญมาก ต้องมีใน MVP**

2. **สรุปการเปลี่ยนแปลงแบบอ่านง่าย** — ไม่ใช่ JSON diff แต่เป็นภาษาคน: "เปลี่ยนเวลา X จาก A เป็น B" — ข้อความนี้จะถูกส่งไปใน LINE noti ด้วย

3. **แสดงจำนวน edits ที่เหลือ** — "แก้ไขครั้งที่ 1/2 (free tier)" เตือน Admin ว่าเหลืออีกครั้ง

---

### Flow 3.5: Read Receipt Dashboard

```
[A3] Dashboard → เลือกทริป → [ดูสถานะรับทราบ]
│
▼
[A8] Read Receipt Dashboard
     ┌────────────────────────────────────────────────┐
     │  🔔 การเปลี่ยนแปลงวันที่ 10 เม.ย. 14:32         │
     │  "เปลี่ยนเวลา teamLab: 08:30 → 09:00"          │
     │                                                │
     │  ✅ รับทราบแล้ว (12/18)                           │
     │  ┌──────────────────────────────────────┐      │
     │  │ ✅ สมชาย — 14:35 (LINE)              │      │
     │  │ ✅ นิดา — 14:36 (Web Push)            │      │
     │  │ ✅ แพท — 14:40 (LINE)                │      │
     │  │ ...                                   │      │
     │  └──────────────────────────────────────┘      │
     │                                                │
     │  ❌ ยังไม่เห็น (6/18)                             │
     │  ┌──────────────────────────────────────┐      │
     │  │ ⏳ วิชัย — ยังไม่เปิด                  │      │
     │  │ ⏳ อรทัย — ยังไม่เปิด                  │      │
     │  │ ...                                   │      │
     │  └──────────────────────────────────────┘      │
     │                                                │
     │  [🔄 ส่ง noti ซ้ำเฉพาะคนที่ยังไม่เห็น]            │
     └────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอ:**

1. **ตัวเลขใหญ่ชัด "12/18 รับทราบ"** — Admin ไม่ต้องนับเอง แค่ glance ก็รู้สถานการณ์
2. **ปุ่ม "ส่งซ้ำเฉพาะคนที่ยังไม่เห็น"** — killer feature ที่ LINE ทำไม่ได้ ไม่ต้องรบกวนคนที่รับทราบแล้ว
3. **แสดงช่องทางที่ follow** — "(LINE)" หรือ "(Web Push)" ช่วย Admin debug ถ้ามีปัญหา

---

## 4. User Journey: Guest / Follower (ลูกทริป)

### Flow 4.1: เปิด Trip Plan ครั้งแรก (Guest View)

**Context:** ลูกทริปได้รับ link จาก LINE group → กดเปิด

```
กดลิงก์ใน LINE
│
▼
[G1] Trip View — Hero Section
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                     │ │
│ │              [Cover Image เต็มจอ]                    │ │
│ │               ภาพสวยของ destination                  │ │
│ │                                                     │ │
│ │           🌸 Tokyo Winter Trip 2026 🌸               │ │
│ │                                                     │ │
│ │              15-22 เม.ย. 2026                        │ │
│ │                                                     │ │
│ │   👥 25 คน   ✈️ Xiamen Air   🏨 3 โรงแรม   📅 8 วัน  │ │
│ │                                                     │ │
│ │            ─── อีก 12 วัน! 🎉 ───                    │ │  ← NEW: Countdown
│ │                                                     │ │
│ │           [ 🔔 ติดตามทริปนี้ ]                       │ │  ← Follow CTA
│ │                                                     │ │
│ │              ↓ Scroll down                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Sticky Day Nav:                                    │ │
│ │  [✈️ D1] [🗼 D2] [🗻 D3] [🏰 D4] [⛩️ D5]...          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Day 1 — ✈️ เดินทาง กรุงเทพ → โตเกียว               │ │
│ │  [Cover Image: สนามบิน]                              │ │
│ │                                                     │ │
│ │  🧳 ก่อน 15:40  เช็คอิน สุวรรณภูมิ           [📍]   │ │
│ │  ✈️ 17:40       ออกเดินทาง MF834            [📍]   │ │
│ │  🛬 22:05       ถึงเซียเมิน                  [📍]   │ │
│ │  🏨 23:00       เข้าที่พัก                          │ │
│ │                                                     │ │
│ │  [🗺️ ดูเส้นทางทั้งวัน]                               │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ... Day 2, Day 3, ...                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  📊 สรุปข้อมูลทริป                                   │ │
│ │  📅 8 วัน  ✈️ Xiamen Air  👥 25 คน  🏨 3 โรงแรม     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  🆘 เบอร์ฉุกเฉิน                                    │ │
│ │  🏥 [สถานทูตไทย: +81-3-...] [📞 กดโทร]              │ │
│ │  🚓 [ตำรวจญี่ปุ่น: 110    ] [📞 กดโทร]              │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  📝 หมายเหตุจากไกด์                                  │ │
│ │  • เตรียมเสื้อกันหนาว อุณหภูมิ 5-10°C               │ │
│ │  • เงินสด ¥30,000 ต่อคน                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  ── บริษัท: Amazing Tour ──                          │ │
│ │  [Logo]  📞 02-XXX-XXXX  LINE: @amazingtour         │ │
│ │                                                     │ │
│ │  [🛂 โหมดยื่น ตม.]      Powered by NatGan           │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอสำคัญ:**

1. **"ติดตามทริปนี้" ต้องอยู่ใน Hero** — ไม่ใช่ซ่อนอยู่ด้านล่าง ลูกทริปต้องเห็นตั้งแต่เปิดมา → conversion rate จะสูงกว่ามาก

2. **Countdown ที่ Hero** — "อีก 12 วัน! 🎉" สร้างอารมณ์ตื่นเต้น ถ้าอยู่ระหว่างเดินทางเปลี่ยนเป็น "Day 3 of 8 — วันนี้!" + highlight current day auto

3. **Follow button ต้องอยู่ 2 ที่** — ใน Hero (primary CTA) + ลอยอยู่ด้านล่าง (sticky bottom bar) สำหรับคนที่ scroll ผ่าน Hero ไปแล้ว ถ้า follow แล้วให้เปลี่ยนเป็น "✅ ติดตามอยู่"

4. **Auto-highlight current activity** — ระหว่างเดินทางจริง activity ที่กำลังถึงเวลาจะ glow/pulse เบาๆ เหมือน "คุณอยู่ตรงนี้" → ลูกทริป glance ดูก็รู้ว่าตอนนี้ถึงไหนแล้ว

5. **Company branding ต้องอยู่ล่างสุด** — ไม่ใช่บนสุด เพราะ content ของทริปสำคัญกว่า แต่ footer ต้องชัด: logo + เบอร์ + LINE → เป็นที่แรกที่ลูกทริปจะมองหาเมื่อต้องการติดต่อ

6. **"Powered by NatGan" ต้องเล็กแต่ชัด** — viral loop อยู่ตรงนี้ ลูกทริปที่ประทับใจจะกดดูว่า NatGan คืออะไร

---

### Flow 4.2: Follow ทริป (เลือกช่องทางแจ้งเตือน)

```
[G1] กดปุ่ม [🔔 ติดตามทริปนี้]
│
▼
[G2] Follow Modal
     ┌────────────────────────────────────────┐
     │                                        │
     │  🔔 ติดตามทริปนี้                        │
     │  รับแจ้งเตือนเมื่อ plan เปลี่ยน          │
     │                                        │
     │  เลือกช่องทางที่สะดวก:                   │
     │                                        │
     │  ┌──────────────────────────────┐      │
     │  │  💚 LINE (ผ่าน LINE OA)       │      │
     │  │  เพิ่มเพื่อน LINE OA ของ NatGan  │      │
     │  │  (แนะนำสำหรับคนไทย)          │      │
     │  └──────────────────────────────┘      │
     │                                        │
     │  ┌──────────────────────────────┐      │
     │  │  🔔 Web Push                 │      │
     │  │  แจ้งเตือนผ่านเบราว์เซอร์      │      │
     │  │  (ไม่ต้องมี LINE)             │      │
     │  └──────────────────────────────┘      │
     │                                        │
     │  ชื่อของคุณ: [________]                  │
     │  (ไกด์จะเห็นว่าคุณรับทราบแล้ว)          │
     │                                        │
     │              [ยกเลิก]                    │
     └────────────────────────────────────────┘
```

**เลือก LINE:**
```
→ เปิดหน้าเพิ่มเพื่อน LINE OA ของ NatGan
→ กดเพิ่มเพื่อน
→ กลับมาหน้าเดิม → "✅ ติดตามสำเร็จ!"
→ ปุ่มเปลี่ยนเป็น "✅ ติดตามอยู่ (LINE)"
```

**เลือก Web Push:**
```
→ Browser popup: "natgan.com wants to send notifications"
→ กด Allow
→ "✅ ติดตามสำเร็จ!"
→ ปุ่มเปลี่ยนเป็น "✅ ติดตามอยู่ (Push)"
```

**💡 วิจารณ์ & ข้อเสนอ:**

1. **ต้องถามชื่อ** — ไม่ถามมาก แค่ชื่อ เพื่อ Admin จะได้เห็นว่า "สมชาย รับทราบแล้ว" แทนที่จะเป็น "Follower #7" → ทำให้ read receipt มีความหมาย

2. **LINE เป็นตัวเลือกแรก** — คนไทย 90%+ ใช้ LINE ดังนั้นให้เด่นที่สุด + ติด badge "แนะนำ" (ใช้ LINE OA + Messaging API แทน LINE Notify ที่ถูกยกเลิกไปแล้ว)

3. **ทั้ง 2 ช่องทางกดได้พร้อมกัน** — ถ้าอยาก follow ทั้ง LINE + Web Push ก็ได้ (แต่ MVP อาจจำกัดให้เลือกอย่างเดียวก่อน เพื่อลด complexity)

4. **ข้อเสนอใหม่: "เลือกทั้ง 2" ไว้ Phase 2** — MVP เลือกอย่างเดียว ลดงาน dev แต่ทำให้ทั้ง 2 ปุ่มชัดว่าเลือกได้ 1

---

### Flow 4.3: รับแจ้งเตือน + กดรับทราบ

```
=== ไกด์แก้ Plan ===

[LINE Notification]
┌────────────────────────────────────┐
│  🔔 NatGan - Tokyo Winter 2026    │
│                                    │
│  ⚠️ มีการเปลี่ยนแปลง:              │
│  • Day 2: เปลี่ยนเวลา teamLab     │
│    08:30 → 09:00                   │
│  • Day 2: เพิ่ม "แวะ 7-Eleven"     │
│    เวลา 08:00                      │
│                                    │
│  👉 ดูรายละเอียด + กดรับทราบ:       │
│  natgan.com/t/tokyo-winter-2026    │
└────────────────────────────────────┘

[Web Push Notification]
┌────────────────────────────────────┐
│  🔔 Tokyo Winter 2026 มีการเปลี่ยน │
│  Day 2: เปลี่ยนเวลา teamLab →...   │
│  [กดดู]                             │
└────────────────────────────────────┘

กดลิงก์ / กด notification
│
▼
[G1] Trip View + [G3] Acknowledge Banner
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │  ⚠️ มีการเปลี่ยนแปลง!                               │ │ ← Banner สีเหลือง
│ │  Day 2: เปลี่ยนเวลา teamLab 08:30 → 09:00          │ │    เด่น ไม่มีทาง
│ │  Day 2: เพิ่ม "แวะ 7-Eleven" เวลา 08:00             │ │    มองไม่เห็น
│ │                                                     │ │
│ │              [✅ รับทราบแล้ว]                         │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ... Trip View ปกติ (ข้อมูลอัพเดทแล้ว) ...              │
│                                                         │
│  Day 2 — 🗼 โตเกียว                                    │
│  ┌─────────────────────────────────────┐               │
│  │  🏪 08:00  แวะ 7-Eleven     [NEW]  │ ← highlight   │
│  │  🎨 09:00  teamLab Planets  [แก้ไข] │ ← highlight   │
│  │  🏰 11:00  Tokyo Disneyland        │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘

กด [✅ รับทราบแล้ว]
│
▼
Banner เปลี่ยนเป็น:
┌─────────────────────────────────────────┐
│  ✅ รับทราบแล้ว — ขอบคุณค่ะ 🙏            │
│  (แสดง 3 วินาที แล้วค่อยๆ จางหายไป)      │
└─────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอสำคัญ:**

1. **Banner ต้อง sticky อยู่ด้านบน** — ไม่ใช่อยู่ตรงกลาง ลูกทริปเปิดมาต้องเห็นทันที ไม่ต้อง scroll หา

2. **Activity ที่เปลี่ยนต้อง highlight** — badge [NEW] หรือ [แก้ไข] สีส้ม/เหลือง + border glow เพื่อให้ลูกทริปรู้ว่าจุดไหนเปลี่ยนโดยไม่ต้องอ่าน change log

3. **"รับทราบ" ต้องเป็น 1 กด จบ** — ไม่ต้องยืนยันซ้ำ ไม่ต้องกรอกอะไร กดปุ่มเดียว → done → banner หายไป

4. **LINE Noti message ต้องสั้น กระชับ** — ลูกทริปไม่ได้อ่าน LINE อย่างละเอียด แค่เห็น "เปลี่ยนเวลา → กดดู" พอ

5. **ข้อเสนอใหม่: Haptic feedback** — บน mobile เมื่อกด "รับทราบ" ให้มี vibration เบาๆ (navigator.vibrate) → satisfying UX

---

## 5. User Journey: Immigration-Friendly View

### Flow 5.1: สลับไปโหมด ตม.

```
[G1] Trip View → Scroll ลงสุด → กด [🛂 โหมดยื่น ตม.]
│
▼
[G4] Immigration-Friendly View
┌─────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐│
│  │  🛂 TRAVEL ITINERARY                               ││
│  │  For Immigration Purposes                           ││
│  │                                                     ││
│  │  Guest of: Amazing Tour Co., Ltd.                   ││
│  │  TAT License: XX-XXXXX                              ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  TRIP DETAILS                                       ││
│  │                                                     ││
│  │  Destination:  Japan                                ││
│  │  Duration:     15 Apr – 22 Apr 2026 (8 days)        ││
│  │  Travelers:    25 persons                           ││
│  │                                                     ││
│  │  FLIGHT INFORMATION                                 ││
│  │  ✈ Departure: MF834  17:40  BKK → XMN              ││
│  │  ✈ Return:    MF833  08:50  XMN → BKK              ││
│  │                                                     ││
│  │  ACCOMMODATION                                      ││
│  │  🏨 The QUBE Hotel Chiba                            ││
│  │     1-2-3 Chiba, Japan                              ││
│  │     Tel: +81-XX-XXXX-XXXX                           ││
│  │                                                     ││
│  │  DAILY ITINERARY                                    ││
│  │  Day 1 (15 Apr): Bangkok → Tokyo                    ││
│  │  Day 2 (16 Apr): Tokyo Sightseeing                  ││
│  │  Day 3 (17 Apr): Mt. Fuji Excursion                 ││
│  │  ...                                                ││
│  │                                                     ││
│  │  TOUR OPERATOR                                      ││
│  │  Amazing Tour Co., Ltd.                             ││
│  │  Tel: +66-2-XXX-XXXX                                ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  📶 Available offline                               ││
│  │  [← กลับหน้าทริป]                                   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**💡 วิจารณ์ & ข้อเสนอสำคัญ:**

1. **ภาษาต้อง auto-detect ตาม destination** — ไปญี่ปุ่น = English (ภาษากลาง), ไม่ใช่ไทย เพราะ ตม. ญี่ปุ่นอ่านไทยไม่ออก

2. **Design ต้อง "official" ไม่ใช่ "สวย"** — ไม่มี gradient, ไม่มี emoji (ยกเว้นบินกับโรงแรม), font ตรง, พื้นขาว, ข้อมูลเรียงเป็นระเบียบ → ดูน่าเชื่อถือในสายตา ตม.

3. **ข้อมูลเฉพาะที่ ตม. ต้องการ** — ไฟลท์, ที่พัก (ชื่อ+ที่อยู่+เบอร์), ระยะเวลา, จำนวนคน, ชื่อบริษัททัวร์ → ไม่มี Activity detail

4. **Offline cache สำคัญมาก** — ตอนยืนรอ ตม. อาจไม่มี internet (เพิ่งลงเครื่อง ยังไม่ได้ SIM) → ต้อง cache หน้านี้ลง Service Worker ตอนเปิดครั้งแรก

5. **ข้อเสนอใหม่: ปุ่ม "เต็มจอ" (fullscreen)** — ยื่นมือถือให้ ตม. ดู ถ้าจอเต็มจะดูเป็นทางการกว่า + ไม่มี address bar / toolbar มารบกวน

6. **ข้อเสนอใหม่: แสดง QR code เล็กๆ ที่มุมล่าง** — ตม. สแกนเพื่อ verify ว่า itinerary เป็นของจริง (link ไปหน้าเดียวกัน)

---

## 6. Screen Design Notes (สำหรับ Dev)

### 6.1 Color System

```
Guest View (ตาม Demo App ที่มี):
├── Primary:    Indigo-JP (#1b2a4a) — text, header
├── Accent:     Sakura (#ff8fa8) — highlight, badge
├── Gold:       Gold-JP (#c5a572) — shimmer, special
├── Background: Cream (#f5ebe0) — page bg
├── Card:       Warm-white (#faf3ea) — card bg
└── Gradient:   ต่อ Day สี gradient ต่างกัน (จาก Demo)

Admin Dashboard:
├── Primary:    เดียวกับ Guest View (brand consistency)
├── Background: White (#ffffff) — cleaner for forms
├── Success:    Green (#22c55e) — published, acknowledged
├── Warning:    Amber (#f59e0b) — pending, change banner
└── Danger:     Red (#ef4444) — unpublish, delete

Immigration View:
├── Background: White (#ffffff) — official look
├── Text:       Black (#111111) — high contrast
├── Border:     Gray (#d1d5db) — subtle table lines
└── Header:     Dark blue (#1e3a5f) — official feel
```

### 6.2 Typography

```
Guest View:
├── Heading:  Noto Sans Thai — bold, 2xl-4xl
├── Body:     Noto Sans Thai — regular, sm-base
├── Time:     Monospace feel — bold, xs-sm (ใน badge)
├── Notes:    Light, xs-sm, text-slate-400
└── JP text:  Noto Sans JP (เฉพาะ phrases section)

Admin:
├── Same font family
└── Form labels: medium, sm

Immigration:
├── Heading:  Sans-serif — bold, official
├── Body:     Sans-serif — regular, base
└── ไม่ใช้ font ไทย (ยกเว้น fallback)
```

### 6.3 Component Library (Shared)

```
Shared Components:
├── DayCard — cover image + gradient header + activity list
├── ActivityItem — time badge + emoji + text + map link
├── InfoBadge — glass-card pill (icon + label)
├── StickyDayNav — horizontal scroll tabs
├── FollowButton — CTA with state (follow/followed)
├── AcknowledgeBanner — sticky top, yellow/green
├── CompanyFooter — logo + contacts + powered by
├── QRCodeCard — QR + download buttons
├── EmergencyCard — phone number + call button
├── CountdownBadge — "อีก X วัน!" / "Day X of Y"
└── ImmigrationView — clean, official layout
```

### 6.4 Responsive Breakpoints

```
Mobile-first (Guest View เปิดจาก LINE 80%+):
├── < 640px:  1 column, full-width cards, day nav scroll
├── 640-1024: 1 column wider, larger images
└── > 1024:   max-width 7xl, timeline line visible

Admin (อาจใช้ Desktop):
├── < 768px:  1 column, stacked forms
├── 768-1024: sidebar nav visible
└── > 1024:   sidebar + main content area
```

---

## 7. Interaction Details

### 7.1 Micro-interactions ที่สำคัญ

| Element | Interaction | ทำไม |
|---|---|---|
| Day Card | hover → ลอยขึ้น 4px + shadow | รู้สึกว่ากดได้ (มีอยู่ใน Demo แล้ว) |
| Activity Item | hover → เลื่อนขวา 4px + bg highlight | บอกว่ากำลัง focus ที่ activity นี้ |
| Follow Button | กด → ripple + spinner → ✅ + confetti เล็กๆ | ให้รู้สึก satisfying ที่กด follow |
| Acknowledge | กด → button scale 0.95 → ✅ → banner fade out | รู้สึกว่า "เสร็จแล้ว" ชัดเจน |
| Current Activity | pulse glow (amber) ทุก 2 วินาที | ดึงสายตาไปที่กิจกรรมปัจจุบัน |
| New/Changed Activity | badge [NEW] / [แก้ไข] + border-left สีส้ม | เห็นทันทีว่าจุดไหนเปลี่ยน |
| Countdown | เปลี่ยนตัวเลขแบบ flip animation | สร้างความตื่นเต้น |

### 7.2 Loading States

```
Guest View (เปิดจาก LINE — internet อาจช้า):
├── Hero image: blur placeholder → sharp (progressive)
├── Day cards: skeleton shimmer → content
├── Cover images: lazy load เมื่อ scroll ใกล้
└── Target: First Meaningful Paint < 2 วินาที

Admin:
├── Form submit: button → spinner → success toast
├── Image upload: progress bar → preview
└── Save: auto-save draft ทุก 30 วินาที (ไม่ต้องกด save)
```

### 7.3 Error States

```
Guest View:
├── URL ไม่ถูกต้อง → "ไม่พบทริปนี้" + illustration
├── Trip unpublished → "ทริปนี้ยังไม่เปิดให้ดู" + ติดต่อบริษัท
├── Offline (ไม่ใช่ Immigration) → "กำลังโหลด... ลองอีกครั้ง"
└── Image load fail → placeholder gradient (ไม่ให้ขาว)

Admin:
├── Save fail → retry button + "บันทึกไม่สำเร็จ"
├── Upload fail → "รูปใหญ่เกินไป ลดขนาดแล้วลองอีกครั้ง"
└── Limit reached → "คุณใช้ slot ครบแล้ว" + upgrade CTA
```

---

## 8. Flow สำคัญที่ต้อง Smooth ที่สุด

### 🏆 Critical Path (ต้อง optimize ก่อน)

```
Priority 1 — Viral Loop:
ลูกทริปได้ link → เปิด → ว้าว! → กด follow → ได้ noti → กดรับทราบ
(ถ้า path นี้ไม่ smooth → ล้มเหลวทั้ง product)

Priority 2 — Admin Creation:
สมัคร → ใส่ข้อมูลบริษัท → สร้างทริป → publish → ส่ง link
(ถ้า path นี้นาน → Admin เลิกใช้ กลับไปใช้ LINE)

Priority 3 — Change Notification:
แก้ plan → สรุป change → ส่ง noti → ลูกทริปรับทราบ → Admin เห็น
(ถ้า path นี้ไม่ work → ไม่ต่างจาก static PDF)
```

### ⏱️ Target Completion Time

| Flow | Target | วัดยังไง |
|---|---|---|
| ลูกทริปเปิด link → เห็น trip plan | < 2 วินาที | First Contentful Paint |
| ลูกทริปเปิด → กด follow สำเร็จ | < 30 วินาที | Follow completion rate |
| Admin สร้างทริปใหม่ (5 วัน 15 activities) | < 15 นาที | ตั้งแต่กด "สร้าง" ถึง "publish" |
| Admin แก้ plan → noti ถึงลูกทริป | < 1 นาที | Change → delivery |
| ลูกทริปเห็น noti → กดรับทราบ | < 10 วินาที | Noti → acknowledge |

---

## 9. สรุป Design Decision Log

| # | Decision | เหตุผล | Alternative ที่ตัด |
|---|---|---|---|
| D1 | Guest view ไม่ต้อง login | ลด friction สูงสุด | ต้อง login → 80% drop off |
| D2 | ภาพนำ ข้อความตาม | ลูกทริปไม่ได้อยากอ่าน อยากรู้สึก | Text-heavy table itinerary |
| D3 | Follow button ใน Hero | เห็นตั้งแต่เปิดมา → high conversion | ซ่อนไว้ล่างสุด |
| D4 | Admin เลือกได้ว่าจะส่ง noti ไหม | ไม่ lock Admin ว่าแก้ทีต้อง noti | Auto-send ทุกครั้ง → Admin ไม่กล้าแก้ |
| D5 | Acknowledge = 1 กดจบ | Zero friction | ต้องพิมพ์ comment → ไม่มีใครทำ |
| D6 | Immigration view = official ไม่ใช่สวย | ตม. ต้องเชื่อถือได้ | ใช้ design เดียวกับ guest view |
| D7 | Mobile-first ทุกหน้า Guest | 80%+ เปิดจาก LINE mobile | Desktop-first → responsive ภายหลัง |
| D8 | Preset cover images | ลด friction Admin ที่ไม่มีรูป | ต้อง upload ทุกครั้ง |
| D9 | ข้อความสำเร็จรูปตอน publish | copy แปะ LINE group ได้เลย | Admin ต้องพิมพ์เอง |
| D10 | Trip Countdown บน Hero | สร้างอารมณ์ตื่นเต้น | แค่แสดงวันที่ |

---

*Document End — NatGan UX Flow v1.0*
