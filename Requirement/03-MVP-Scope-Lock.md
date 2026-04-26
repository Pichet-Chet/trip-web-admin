# MVP Scope Lock
# [Platform Name] — v2.0

**Version:** 2.0
**Date:** 29 March 2026
**Status:** Locked
**Reference:** 01-System-Requirements-Document.md

---

## 1. MVP Goal

**พิสูจน์สมมติฐานเหล่านี้:**

1. บริษัททัวร์ / ไกด์อิสระ **ใช้จริง** ในการส่ง itinerary ให้ลูกทริป
2. ลูกทริป **เปิดดูจริง** ผ่าน link/QR (ไม่ใช่แค่ "ดีนะ" แล้วกลับไปใช้ Line)
3. ฟีเจอร์ **notification + รับทราบ** มีคนใช้จริง และลดปัญหาหน้างาน
4. **Posts (ประกาศทัวร์)** ช่วยให้บริษัท/ไกด์โปรโมทแพ็กเกจทัวร์ได้จริง
5. **Personal users** ใช้วางแผนทริปส่วนตัวแชร์กับเพื่อนจริง

**ถ้าพิสูจน์ได้ → เดินหน้า Phase 2 (Client Member + Advanced Features)**
**ถ้าพิสูจน์ไม่ได้ → Pivot หรือ Stop**

---

## 2. MVP Scope — สิ่งที่ทำ ✅

### 2.1 Authentication & Profile

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ สมัครสมาชิก (Email + Password) | สมัคร + ยืนยัน email | FR-AUTH-001 |
| ✅ Login / Logout | Session management | FR-AUTH-001 |
| ✅ Account Types | Company, Freelance Guide, Personal | FR-AUTH-002 |
| ✅ Onboarding Flow | แยก flow ตามประเภทบัญชี (Company / Freelance Guide / Personal) | FR-AUTH-002 |
| ✅ Company Profile | ชื่อบริษัท, Logo, ช่องทางติดต่อ (โทร, LINE, FB, IG) | FR-AUTH-002 |
| ✅ Freelance Guide Profile | ชื่อไกด์, รูปโปรไฟล์, ช่องทางติดต่อ | FR-AUTH-002 |
| ✅ Personal Profile | ชื่อ, รูปโปรไฟล์ | FR-AUTH-002 |

**MVP ไม่มี:** Social Login (Google, LINE) — เพิ่มใน Phase 2

---

### 2.2 Trip Plan Builder (Admin)

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ สร้าง Trip Plan | ชื่อทริป, วันเริ่ม-สิ้นสุด, destination, cover image, จำนวนผู้เดินทาง | FR-PLAN-001 |
| ✅ ข้อมูลสายการบิน | สายการบิน, เลขไฟลท์, วันเวลา | FR-PLAN-001 |
| ✅ ข้อมูลที่พัก | ชื่อ, ที่อยู่, เบอร์โทร (สำหรับ ตม. ด้วย) | FR-PLAN-001 |
| ✅ จัดการรายวัน (Day) | เพิ่ม/ลบ/เรียงลำดับวัน, ชื่อ, cover image | FR-PLAN-002 |
| ✅ จัดการกิจกรรม (Activity) | เวลา, ชื่อสถานที่, หมายเหตุ, Google Maps link, ประเภท, รูปภาพ | FR-PLAN-003 |
| ✅ เบอร์ฉุกเฉิน | เพิ่มเอง + pre-fill ตามประเทศ | FR-PLAN-004 |
| ✅ หมายเหตุสำคัญ | Free text | FR-PLAN-004 |
| ✅ Route Planning | สร้าง Google Maps route link อัตโนมัติจาก activities | FR-PLAN-005 |
| ✅ เลือกภาษาหลัก | ไทย / อังกฤษ / ญี่ปุ่น | FR-PLAN-001 |

**MVP ไม่มี:** วลีที่ใช้บ่อย (pre-fill), ของที่ต้องเตรียม (checklist), Template System — เพิ่มใน Phase 3

---

### 2.3 Posts (ประกาศแพ็กเกจทัวร์) 🆕

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ สร้าง Post | สำหรับ Company / Freelance Guide โปรโมทแพ็กเกจทัวร์ | FR-POST-001 |
| ✅ Post Fields | title, destination, description, highlights, images, price, duration, travelPeriod, slots, tags | FR-POST-001 |
| ✅ Post Status | draft / published / closed | FR-POST-002 |
| ✅ แสดงบน Info Website | Posts แสดงบนเว็บไซต์หลัก (พัฒนาโดย Nes) | FR-POST-003 |
| ✅ จัดการ Posts (Admin) | CRUD — สร้าง, แก้ไข, ลบ, เปลี่ยนสถานะ | FR-POST-001 |

**หมายเหตุ:** ไม่มีระบบ booking — แค่ showcase ทัวร์เท่านั้น

**MVP ไม่มี:** ระบบจอง (Booking), ระบบรีวิว — เพิ่มใน Phase 3+

---

### 2.4 Publishing & Sharing

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Publish Trip Plan | ปุ่ม Publish → เปิดให้ guest เข้าดู | FR-PUB-001 |
| ✅ Unique URL | `[your-domain.com]/t/{slug}` กำหนดเอง หรือ auto-generate | FR-PUB-001 |
| ✅ QR Code | สร้างอัตโนมัติ + ดาวน์โหลด PNG | FR-PUB-001 |
| ✅ Guest View | เปิด URL → เห็น trip plan ทันที ไม่ต้อง login | FR-PUB-002 |
| ✅ Company Branding | Logo + ช่องทางติดต่อ แสดงบน guest view | FR-PUB-002 |
| ✅ Powered by [Platform] | แสดง badge + link ถาวร (free tier) | FR-BRAND-002 |
| ✅ Auto-highlight ตามเวลา | highlight กิจกรรมปัจจุบันอัตโนมัติ | FR-PUB-002 |
| ✅ Immigration-Friendly View | โหมดยื่น ตม. — ข้อมูล official, ภาษา destination, offline cache | FR-PUB-003 |
| ✅ Unpublish | ปิดไม่ให้เข้าดู | FR-PUB-004 |

**MVP ไม่มี:** Archive — เพิ่มใน Phase 2

---

### 2.5 Portfolio (หน้าสาธารณะ) 🆕

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Public Portfolio Page | หน้าสาธารณะสำหรับ Company / Freelance Guide | FR-PORT-001 |
| ✅ Toggle เปิด/ปิด | เลือกได้ว่าจะเปิด portfolio หรือไม่ | FR-PORT-001 |
| ✅ แสดงข้อมูลบริษัท/ไกด์ | Logo, ชื่อ, ช่องทางติดต่อ, Posts ที่ published | FR-PORT-001 |

---

### 2.6 Notification & Communication ⭐ Killer Feature

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Follow ทริป (LINE OA) | ลูกทริปกด → เพิ่มเพื่อน LINE OA → ได้ User ID | FR-NOTI-001 |
| ✅ Follow ทริป (Web Push) | ลูกทริปกด → Allow notification → ได้ subscription | FR-NOTI-001 |
| ✅ แจ้งเตือนเมื่อ Plan เปลี่ยน | ตรวจจับ change → สร้าง summary → ส่ง LINE + Web Push | FR-NOTI-002 |
| ✅ ปุ่มรับทราบ | Banner บน guest view + ปุ่ม "รับทราบแล้ว ✓" | FR-NOTI-004 |
| ✅ Read Receipt Dashboard | Admin เห็นว่าใครรับทราบแล้ว / ยังไม่เห็น | FR-NOTI-005 |
| ✅ ส่ง noti ซ้ำ | เฉพาะคนที่ยังไม่เห็น | FR-NOTI-005 |

**หมายเหตุ:** Notification เป็นฟีเจอร์สำหรับ Company / Freelance Guide เท่านั้น — Personal users ไม่เน้น notification (ใช้แค่ trip planning tool แชร์กับเพื่อน)

**MVP ไม่มี:** แจ้งเตือนก่อนวันถัดไป (Auto noti), Batch send — เพิ่มใน Phase 2

---

### 2.7 B2C — Personal Trip Planning 🆕

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ สร้างทริปส่วนตัว | Personal users สร้างทริปเพื่อแชร์กับเพื่อน | FR-B2C-001 |
| ✅ แชร์ link | ส่ง link ให้เพื่อนดู trip plan | FR-B2C-001 |
| ✅ Powered by [Platform] | แสดง badge บน guest view → สร้าง brand exposure | FR-BRAND-002 |

**วัตถุประสงค์:** สร้าง engagement + Powered by [Platform] exposure

**MVP ไม่มี:** Notification สำหรับ Personal users — ไม่เน้นในตอนนี้

---

### 2.8 Change Log

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ บันทึกประวัติการเปลี่ยนแปลง | วันเวลา, สิ่งที่เปลี่ยน (JSON) | FR-LOG-001 |
| ✅ แสดงบน Admin Dashboard | ดูได้ว่าแก้อะไรไปบ้าง เมื่อไหร่ | FR-LOG-001 |

**MVP ไม่มี:** Change log ฝั่ง guest view — เพิ่มใน Phase 2

---

### 2.9 Dashboard (Admin)

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ รายการ Trip Plans | Active / Draft, ชื่อ, วันเดินทาง, สถานะ | FR-DASH-001 |
| ✅ รายการ Posts | Draft / Published / Closed | FR-DASH-001 |
| ✅ จำนวน Followers ต่อทริป | แสดงจำนวนคนที่กด follow | FR-DASH-001 |
| ✅ จำนวน Views ต่อทริป | นับจำนวนครั้งที่ guest เปิดดู | FR-DASH-001 |

**MVP ไม่มี:** Full analytics (views/วัน, QR scans, acknowledge rate chart) — เพิ่มใน Phase 2

---

### 2.10 Billing & Pricing

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Free tier | ฟรี 3 ทริป | FR-BILL-001 |
| ✅ Pay-per-Trip | ฿49 ต่อทริป (เมื่อเกิน 3 ทริปฟรี) | FR-BILL-002 |
| ✅ Pack 5 | ฿199 (5 ทริป) | FR-BILL-002 |
| ✅ Pack 10 | ฿349 (10 ทริป) | FR-BILL-002 |
| ✅ แสดง usage | "ใช้ไป 2/3 ทริปฟรี", แสดง quota คงเหลือ | FR-BILL-001 |

**หมายเหตุ:** ราคาสุดท้ายอาจเปลี่ยนแปลง — รอตกลงกับทีม marketing

---

### 2.11 Support (Basic) 🆕

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Feedback Form | ฟอร์มส่ง feedback / แจ้งปัญหาเบื้องต้น | FR-SUP-001 |

**MVP ไม่มี:** Full ticket system (tracking, status, assignment) — เพิ่มใน Phase 2

---

### 2.12 Multi-language

| Feature | รายละเอียด | SRD Ref |
|---|---|---|
| ✅ Platform UI 3 ภาษา | ไทย, อังกฤษ, ญี่ปุ่น | FR-I18N-001 |
| ✅ Trip Plan ภาษาเดียว | Admin เลือกภาษาหลักตอนสร้าง | FR-I18N-002 |

**MVP ไม่มี:** Trip plan 1 อันแสดงหลายภาษา — เพิ่มใน Phase 3

---

## 3. MVP Scope — สิ่งที่ไม่ทำ ❌

### 3.1 ตัดออกจาก MVP (พร้อมเหตุผล)

| Feature | เหตุผลที่ตัด | เพิ่มเมื่อไหร่ |
|---|---|---|
| ❌ Social Login (Google, LINE) | Email+Password พอสำหรับ pilot | Phase 2 |
| ❌ แจ้งเตือนก่อนวันถัดไป (Auto noti) | ต้องทำ scheduler + timezone logic ซับซ้อน | Phase 2 |
| ❌ Batch send notification | Admin ส่งทีละ change ก่อน ช่วง pilot ไม่ถี่ | Phase 2 |
| ❌ Archive (portfolio mode) | Unpublish พอก่อน archive เป็น growth feature | Phase 2 |
| ❌ Change log ฝั่ง guest | Banner + รับทราบ พอก่อน | Phase 2 |
| ❌ Full Analytics | Views + Followers count พอ ยังไม่ต้อง chart | Phase 2 |
| ❌ Client Member System (ลูกค้า login) | MVP: Guest view only ไม่ต้อง login — เพิ่มใน Phase 2 | Phase 2 |
| ❌ Full Support Ticket System | MVP มี feedback form พื้นฐาน — full system เพิ่มทีหลัง | Phase 2 |
| ❌ Travel Points / Elite Member | ราคา TBD กับทีม marketing | Phase 2+ |
| ❌ Template System | ยังไม่จำเป็น ช่วง pilot ทำทริปไม่เกิน 10 อัน | Phase 3 |
| ❌ Custom theme color | ใช้ default theme เดียว | Phase 3 |
| ❌ White-label (ซ่อน Powered by) | ต้องมี revenue ก่อน | Phase 3 |
| ❌ Multi-language trip plan | 1 trip = 1 ภาษา ก่อน | Phase 3 |
| ❌ วลีที่ใช้บ่อย / Checklist | Nice to have ไม่ใช่ core | Phase 3 |
| ❌ Booking System | MVP แค่ showcase ทัวร์ ยังไม่มีจอง | Phase 3+ |
| ❌ Review System | ยังไม่มี — ต้องมี Client Member ก่อน | Phase 3+ |
| ❌ Collaborative editing | Admin คนเดียวต่อบริษัทก่อน | Phase 4 |
| ❌ API for enterprise | ยังไม่มี enterprise customer | Phase 4 |
| ❌ PWA / Offline (full) | Immigration view มี offline cache เฉพาะจุด | Phase 4 |
| ❌ Mobile App | Web-only ตลอด ไม่ทำ app | ไม่ทำ |

### 3.2 หลักคิดในการตัด

```
ถ้าฟีเจอร์นี้ไม่มี → pilot ยังทำได้ไหม?
  ได้  → ตัดออก
  ไม่ได้ → ต้องมี

ถ้าฟีเจอร์นี้ไม่มี → พิสูจน์สมมติฐานได้ไหม?
  ได้  → ตัดออก
  ไม่ได้ → ต้องมี
```

---

## 4. Development Timeline (10 สัปดาห์)

### Sprint Plan

```
สัปดาห์ 1-2: Foundation
├── Database schema + PostgreSQL (Docker) + Drizzle setup
├── Auth (Email + Password, session)
├── Account Types (Company / Freelance Guide / Personal)
├── Onboarding Flow ตามประเภทบัญชี
├── Company / Guide / Personal Profile CRUD
└── Project skeleton (Next.js + Tailwind)

สัปดาห์ 3-4: Trip Builder + Posts
├── Trip Plan CRUD (create, edit, delete)
├── Day CRUD (add, remove, reorder)
├── Activity CRUD (add, remove, reorder, Google Maps link)
├── Emergency contacts + Important notes
├── Posts CRUD (create, edit, delete, status management)
└── Posts fields: title, destination, description, highlights, images, price, duration, travelPeriod, slots, tags

สัปดาห์ 5-6: Guest View + Publishing + Portfolio
├── Publish flow → generate slug + URL
├── QR Code generation + download
├── Guest View page (responsive, mobile-first)
├── Immigration-Friendly View (โหมดยื่น ตม.)
├── Auto-highlight current activity by time
├── Company branding on guest view
├── Powered by [Platform] badge
├── Portfolio Page (public page for Company / Guide, toggle on/off)
└── Posts แสดงบน Info Website (ส่งข้อมูลให้ Nes)

สัปดาห์ 7-8: Notification System ⭐ + B2C
├── LINE Messaging API integration (LINE OA webhook)
├── Web Push setup (VAPID keys, Service Worker)
├── Follow button on guest view (เลือก LINE / Web Push)
├── Change detection (diff ก่อน-หลังแก้ plan)
├── Change summary generation
├── Send notification (LINE + Web Push)
├── Acknowledge button + read receipt
├── Read Receipt Dashboard (admin)
└── B2C: Personal trip creation + sharing

สัปดาห์ 9: Dashboard + Billing + Support
├── Admin Dashboard (trip list, posts list, views, followers)
├── Change Log (admin view)
├── Free tier (3 ทริปฟรี) + Pay-per-Trip ฿49 + Pack pricing
├── Usage display
├── Feedback form (basic support)
└── Multi-language UI (TH/EN/JP)

สัปดาห์ 10: Testing + Deploy + Pilot
├── End-to-end testing (สร้าง → publish → follow → แก้ → noti → รับทราบ)
├── Posts testing (สร้าง → publish → แสดงบน Info Website)
├── Mobile testing (LINE in-app browser, iOS Safari, Android Chrome)
├── Immigration view testing (offline cache)
├── Deploy to production (Vercel + VPS PostgreSQL)
├── Custom domain: [your-domain.com]
└── Onboard เพื่อน 1 บริษัท → สร้างทริป + โพสต์จริง
```

---

## 5. Success Criteria (หลัง pilot 4 สัปดาห์)

### Must-have (ถ้าไม่ผ่าน → ต้อง rethink)

| Metric | Target | วัดยังไง |
|---|---|---|
| บริษัททัวร์สร้างทริปจริง | 3+ ทริป | นับใน dashboard |
| ลูกทริปเปิดดูจริง | > 50% ของลูกทริปในกรุ๊ป | Views / จำนวนลูกทริป |
| ลูกทริปกด Follow | > 30% ของลูกทริปในกรุ๊ป | Followers count |
| Acknowledge rate | > 50% เมื่อมีการเปลี่ยนแปลง | Acknowledged / Total followers |
| Posts ถูกสร้างจริง | 3+ posts | นับใน dashboard |
| เพื่อนบอกว่า "ดีกว่า Line" | Yes / No | ถามตรงๆ |

### Nice-to-have (ถ้าผ่าน → สัญญาณดี)

| Metric | Target | วัดยังไง |
|---|---|---|
| ลูกทริปแชร์ link ต่อ | มี views จากคนนอกกรุ๊ป | Views > Followers |
| เพื่อนแนะนำบริษัทอื่น | 1+ บริษัทใหม่ | Referral |
| ลูกทริปใช้โหมดยื่น ตม. | 1+ คนใช้จริง | ถามหลังทริปจบ |
| Personal users สร้างทริป | 3+ personal trips | นับใน dashboard |
| Posts มีคนดูจาก Info Website | มี views จากเว็บ | Analytics |

---

## 6. Pilot Plan

### เพื่อน 1 บริษัท — ทริปในประเทศ

```
สัปดาห์ 1-2 (หลัง launch):
├── Onboard เพื่อน → สร้าง account (Company) → ใส่ logo + contacts
├── สร้างทริปจริง 1 ทริป (ทริปที่ใกล้ที่สุด)
├── สร้าง Post ประกาศแพ็กเกจทัวร์ 1 โพสต์
├── ส่ง link/QR ให้ลูกทริปจริง
└── สังเกต: ลูกทริปเปิดดูไหม? กด follow ไหม?

สัปดาห์ 3-4:
├── ทดสอบ: แก้ plan → ลูกทริปได้ noti ไหม? กดรับทราบไหม?
├── ทดสอบ: Personal user สร้างทริปส่วนตัว + แชร์กับเพื่อน
├── เก็บ feedback จากเพื่อน (admin experience)
├── เก็บ feedback จากลูกทริป (ถ้าทำได้)
├── สร้างทริปเพิ่ม 2-3 ทริป + Posts เพิ่ม
└── วัด Success Criteria

สัปดาห์ 5+:
├── ปรับ product ตาม feedback
├── ถ้าผ่าน → ขอ referral → onboard 3-5 บริษัทเพิ่ม
└── ถ้าไม่ผ่าน → วิเคราะห์ว่าทำไม → pivot หรือ stop
```

### ถ้ามีทริปต่างประเทศ

- ทดสอบ Immigration-Friendly View ด้วย
- ถามลูกทริปว่ายื่นหน้าจอ ตม. แล้วเป็นยังไง
- ทดสอบ multi-language (ภาษาอังกฤษ/ญี่ปุ่น)

---

## 7. Tech Stack Decision (MVP)

| Layer | Technology | เหตุผล |
|---|---|---|
| Frontend | Next.js 16 + React 19 | มี codebase อยู่แล้ว, SSR สำหรับ guest view |
| Styling | Tailwind CSS 4 | มี codebase อยู่แล้ว, rapid UI development |
| Auth | Auth.js (NextAuth v5) | Open-source, email auth, JWT, self-hosted |
| Database | PostgreSQL 16 (Docker, self-host VPS) | Full control, Drizzle ORM |
| ORM | Drizzle ORM | Type-safe, lightweight, PostgreSQL-native |
| Storage | Local disk + S3-compatible (MinIO) | เก็บ logo, cover images, self-hosted |
| Hosting | Vercel | ฟรี tier, auto deploy จาก Git, edge network |
| LINE Messaging API | LINE Messaging API | ฟรี 500 msg/เดือน (Communication plan), คนไทยคุ้นเคย |
| Web Push | web-push (npm) + Service Worker | ฟรี, self-hosted, VAPID |
| QR Code | qrcode (npm) | Client-side, ฟรี |
| Maps | Google Maps URL scheme | ฟรี (ไม่ใช้ API, แค่สร้าง link) |

**Monthly cost (MVP):** ~150-250 บ/เดือน (VPS) + Vercel ฟรี

---

## 8. Risks สำหรับ MVP

| Risk | ผลกระทบ | Plan B |
|---|---|---|
| VPS ต้อง upgrade | ต้องเพิ่ม RAM/CPU | ง่ายกว่า — แค่เพิ่ม RAM/CPU บน VPS, ไม่ถูก vendor lock-in |
| ลูกทริปไม่เพิ่มเพื่อน LINE OA | ลูกทริปไม่กด follow | มี Web Push เป็นทางเลือก + ทำ UX ให้ง่ายที่สุด |
| Web Push ไม่ work บน iOS | iPhone ไม่ได้ noti | มี LINE Messaging API เป็น fallback สำหรับ iOS |
| เพื่อนไม่มีเวลาทดสอบ | ไม่ได้ feedback | นัดวันที่ชัดเจน + ช่วย onboard ด้วยตัวเอง |
| Guest view ช้าบน LINE in-app browser | UX ไม่ดี | Optimize: ลด image size, lazy load, minimal JS |
| Posts ไม่มีคนดูบน Info Website | ไม่มี exposure | ทำ SEO + แชร์ผ่าน social media |
| Pay-per-Trip pricing ไม่เหมาะสม | คนไม่ยอมจ่าย | ปรับราคาตาม feedback — รอตกลงกับ marketing |

---

## 9. Definition of Done (MVP)

MVP ถือว่า "เสร็จ" เมื่อ:

- [ ] Admin สร้าง account (Company / Freelance Guide / Personal) + onboarding ได้
- [ ] Admin ใส่ logo + contacts + profile ได้
- [ ] Admin สร้าง trip plan ครบ (days + activities + emergency + notes) ได้
- [ ] Admin สร้าง Post (ประกาศแพ็กเกจทัวร์) ได้ — draft / published / closed
- [ ] Posts แสดงบน Info Website ถูกต้อง
- [ ] Admin กด publish trip → ได้ URL + QR Code
- [ ] Guest เปิด URL → เห็น trip plan สวย responsive บน mobile
- [ ] Guest กด "โหมดยื่น ตม." → เห็นข้อมูล official + offline cache
- [ ] Guest กด "ติดตาม" → เลือก LINE (ผ่าน LINE OA) หรือ Web Push ได้
- [ ] Admin แก้ plan → ลูกทริปที่ follow ได้รับ noti ทั้ง LINE + Web Push
- [ ] Guest เห็น banner "มีการเปลี่ยนแปลง" + กด "รับทราบ" ได้
- [ ] Admin เห็น read receipt dashboard (ใครรับทราบ/ไม่รับทราบ)
- [ ] Portfolio Page สำหรับ Company / Guide — toggle on/off ได้
- [ ] Personal user สร้างทริปส่วนตัว + แชร์ link ได้
- [ ] Free tier (3 ทริปฟรี) + Pay-per-Trip + Pack pricing ทำงาน
- [ ] Feedback form (basic support) ทำงาน
- [ ] Platform UI รองรับ 3 ภาษา (TH/EN/JP)
- [ ] ทดสอบบน LINE in-app browser, iOS Safari, Android Chrome ผ่าน
- [ ] Deploy บน [your-domain.com] สำเร็จ
- [ ] เพื่อน 1 บริษัทสร้างทริป + โพสต์จริงได้สำเร็จ

---

*Document End — [Platform] MVP Scope Lock v2.0*
