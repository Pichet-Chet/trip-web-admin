# System Requirements Document (SRD)
# NatGan (นัดกัน) — Trip Communication Platform

**Version:** 2.0
**Date:** 29 March 2026
**Author:** Coex Team
**Status:** Draft

> **Changelog v2.0 (29 Mar 2026):**
> - เพิ่มระบบ Posts (Tour Package Listings) สำหรับโปรโมตแพ็คเกจทัวร์
> - เพิ่มระบบ Client Member (สมัครสมาชิกผ่าน Google, LINE, Email)
> - เพิ่มระบบ Portfolio (หน้าสาธารณะของบริษัท/ไกด์)
> - เพิ่มระบบ Support Ticket (แจ้งบัก/ร้องขอฟีเจอร์)
> - อัปเดต User Roles: เพิ่ม Admin Owner, Admin Editor, Member
> - เพิ่ม Account Types: Company, Freelance Guide, Personal
> - อัปเดต Pricing Tiers เป็นแบบ Pay-per-Trip
> - อัปเดต Architecture เป็น 4 apps: trip-web-admin, trip-web-client, trip-web-staff, Info Website
> - เพิ่ม B2C use case สำหรับผู้ใช้ส่วนตัวที่วางแผนทริปกับเพื่อน
> - อัปเดต Data Model: เพิ่ม Post, Member, SavedPlace, TripRating, SupportTicket
>
> **Changelog v1.1 (17 Mar 2026):** LINE Notify ถูกยกเลิกอย่างเป็นทางการเมื่อวันที่ 1 เมษายน 2025 เอกสารนี้ได้อัปเดตจาก LINE Notify เป็น LINE Messaging API (ผ่าน LINE OA) ทั้งหมดแล้ว

---

## 1. Executive Summary

NatGan คือแพลตฟอร์ม SaaS สำหรับบริษัททัวร์ ไกด์อิสระ และผู้ใช้ส่วนตัว ที่ช่วยสร้าง จัดการ และสื่อสาร itinerary กับลูกทริปแบบ real-time โดยเน้นแก้ปัญหาหลักคือ **"แก้ plan แล้วลูกทริปไม่รู้"** ผ่านระบบแจ้งเตือนอัตโนมัติ ปุ่มรับทราบ และ read receipt

นอกจากนี้ยังรองรับระบบ **Posts** สำหรับโปรโมตแพ็คเกจทัวร์ลงบน Info Website และระบบ **Member** สำหรับลูกทริปที่ต้องการเก็บประวัติ ติดตามทริป และรับการแจ้งเตือน

**แพลตฟอร์มนี้ไม่ใช่ Trip Planner แต่คือ Trip Communication Tool**

---

## 2. Problem Statement

### 2.1 สถานการณ์ปัจจุบัน

บริษัททัวร์และไกด์อิสระในประเทศไทยส่วนใหญ่ใช้ช่องทางต่อไปนี้ในการสื่อสาร itinerary:

- **LINE Group Chat** — พิมพ์หรือส่งรูป itinerary ในแชท
- **PDF / Canva** — ออกแบบ itinerary แล้วส่งไฟล์
- **โทรศัพท์** — แจ้งการเปลี่ยนแปลงทีละคน

### 2.2 Pain Points หลัก

| ปัญหา | ผลกระทบ | ความถี่ |
|---|---|---|
| ลูกทริปไม่เห็นข้อความเปลี่ยนแปลง plan | ไปผิดที่ ไปผิดเวลา | ทุกทริปที่มีการเปลี่ยน |
| ข้อมูลจมในแชท Line | ลูกทริปหาข้อมูลไม่เจอ ต้องถามซ้ำ | ทุกวันระหว่างเดินทาง |
| ไม่รู้ว่าใครเห็นข้อมูลแล้ว ใครยังไม่เห็น | ไกด์ต้องโทรตามทุกคน | ทุกครั้งที่มีการเปลี่ยน |
| ส่ง itinerary ทีละกลุ่ม ทีละคน | เสียเวลา ข้อมูลไม่ consistent | ทุกทริป |
| Itinerary เก่าใช้ซ้ำไม่ได้ ไม่มี portfolio | เสียโอกาสขาย | ตลอด |
| ไม่มีช่องทางโปรโมตแพ็คเกจทัวร์ออนไลน์ | เข้าถึงลูกค้าใหม่ยาก | ตลอด |

### 2.3 ข้อจำกัดของ Solution ที่มีในตลาด

| Solution | ข้อจำกัด |
|---|---|
| AI Gen Trip (Wanderlog, TripAdvisor AI) | สวยแต่แก้ไขไม่ได้, ไม่มี notification, ไม่รองรับ B2B |
| LINE Group | ข้อมูลจมในแชท, ไม่มี read receipt สำหรับ itinerary, ไม่มี structured data |
| PDF / Canva | Static, แก้ทีต้องส่งใหม่, ไม่มี notification |
| LINE OA | ค่าใช้จ่ายสูง (1,500+ บาท/เดือน), ไม่ได้ออกแบบมาเพื่อ itinerary |

---

## 3. Solution Overview

### 3.1 Core Concept

```
บริษัททัวร์/ไกด์ สร้าง Trip Plan บนแพลตฟอร์ม
  → ได้ URL + QR Code
    → ส่งให้ลูกทริปผ่าน Line (เป็น link)
      → ลูกทริปเปิดดูได้เลย ไม่ต้องสมัคร
        → เมื่อ plan เปลี่ยน → LINE Messaging API แจ้งอัตโนมัติ
          → ลูกทริปกด "รับทราบ"
            → บริษัทเห็นว่าใครรู้แล้ว ใครยังไม่รู้
```

### 3.2 B2C Use Case: ผู้ใช้ส่วนตัว

```
ผู้ใช้ทั่วไป (Personal) สร้าง Trip Plan สำหรับเดินทางกับกลุ่มเพื่อน
  → ใช้ Trip Builder วางแผนรายละเอียดทริป
  → แชร์ URL ให้เพื่อนร่วมทริปดูแผน
  → เน้นการวางแผนร่วมกัน ไม่เน้นระบบ notification
```

### 3.3 User Roles

| Role | คำอธิบาย | การเข้าถึง |
|---|---|---|
| **Admin Owner (เจ้าของบัญชี)** | สิทธิ์เต็ม: สร้าง แก้ไข ลบ จัดการ trip plan, จัดการ billing, จัดการสมาชิกทีม | Login ผ่าน email/social |
| **Admin Editor (ผู้ช่วย)** | สร้าง แก้ไข trip plan ได้ แต่ไม่สามารถลบทริปหรือจัดการ billing | Login ผ่าน email/social, ได้รับเชิญจาก Owner |
| **Guest (ลูกทริป)** | ดู trip plan ผ่าน URL/QR | ไม่ต้อง login (guest view) |
| **Member (สมาชิกลูกทริป)** | ดู trip plan + มี dashboard ส่วนตัว: ทริปที่ติดตาม, สถานที่ที่บันทึก, โปรไฟล์ | สมัครผ่าน Google / LINE / Email (optional) |
| **Follower (ลูกทริปที่ติดตาม)** | ดู + รับ notification + กดรับทราบ | เพิ่มเพื่อน LINE OA / Web Push ไม่ต้องมี account |
| **Super Admin (ทีมงานแพลตฟอร์ม)** | จัดการระบบ users billing | Admin panel (trip-web-staff) |

### 3.4 Account Types

| ประเภทบัญชี | คำอธิบาย | ข้อกำหนด |
|---|---|---|
| **Company (บริษัททัวร์)** | บริษัททัวร์ที่จดทะเบียนอย่างเป็นทางการ | ต้องมีใบอนุญาต TAT |
| **Freelance Guide (ไกด์อิสระ)** | ไกด์นำเที่ยวอิสระ | ไม่ต้องมี TAT license |
| **Personal (ส่วนตัว)** | ผู้ใช้ทั่วไปที่วางแผนทริปกับเพื่อน | ไม่ต้องมีข้อกำหนดพิเศษ |

---

## 4. Functional Requirements

### 4.1 Module: Authentication & Account Management

#### FR-AUTH-001: การสมัครสมาชิก (Admin)
- สมัครผ่าน Email + Password
- สมัครผ่าน Social Login (Google, LINE)
- ยืนยัน email ก่อนใช้งาน
- เลือกประเภทบัญชี: Company / Freelance Guide / Personal
- รองรับ Free tier อัตโนมัติเมื่อสมัคร

#### FR-AUTH-002: Company Profile
- ตั้งชื่อบริษัท/ชื่อไกด์
- อัปโหลด Logo (แสดงบน trip plan ทุกอัน)
- ใส่ช่องทางติดต่อ: โทรศัพท์, LINE ID, Facebook, Instagram, Website
- ใส่ข้อมูลใบอนุญาต TAT (required สำหรับ Company, optional สำหรับอื่น)
- ช่องทางเหล่านี้จะแสดงบน trip plan ทุกอันของบริษัท

#### FR-AUTH-003: Subscription Management
- ดู plan ปัจจุบัน (Free / Pay-per-Trip / Pack)
- ซื้อ Pack เพิ่ม
- ดูประวัติการชำระเงิน
- จัดการวิธีชำระเงิน

---

### 4.2 Module: Trip Plan Builder (Admin)

#### FR-PLAN-001: สร้าง Trip Plan
- ตั้งชื่อทริป
- กำหนดวันเริ่ม — วันสิ้นสุด
- เลือก destination หลัก (ประเทศ/จังหวัด)
- เลือก cover image (อัปโหลดเอง หรือเลือกจาก stock)
- กำหนดจำนวนผู้เดินทาง
- ใส่ข้อมูลสายการบิน / การเดินทาง (optional)
- ใส่ข้อมูลที่พัก (optional)
- เลือกภาษาหลักของ plan (ไทย / อังกฤษ / ญี่ปุ่น / เพิ่มภาษาได้ในอนาคต)

#### FR-PLAN-002: จัดการรายวัน (Day)
- เพิ่ม/ลบ/เรียงลำดับวัน
- แต่ละวันมี:
  - ชื่อวัน + subtitle
  - Cover image
  - รายการกิจกรรม (Activities)

#### FR-PLAN-003: จัดการกิจกรรม (Activity)
- เพิ่ม/ลบ/เรียงลำดับกิจกรรมในแต่ละวัน
- แต่ละกิจกรรมมี:
  - เวลา (HH:MM)
  - ชื่อสถานที่
  - รายละเอียด/หมายเหตุ
  - Google Maps link (ระบุ lat/lng หรือ place name → auto-generate link)
  - ประเภท: สถานที่ท่องเที่ยว / ร้านอาหาร / ที่พัก / การเดินทาง / อื่นๆ
  - รูปภาพ (optional)

#### FR-PLAN-004: ข้อมูลเสริม
- เบอร์ฉุกเฉิน (pre-fill ตามประเทศ destination + เพิ่มเองได้)
- วลีที่ใช้บ่อย (pre-fill ตามภาษา destination + เพิ่มเองได้)
- หมายเหตุสำคัญ (free text)
- ของที่ต้องเตรียม (checklist)

#### FR-PLAN-005: Route Planning
- แต่ละวันสามารถสร้าง route จาก activities → Google Maps route link อัตโนมัติ
- เรียง waypoints ตามลำดับกิจกรรม

#### FR-PLAN-006: Template System
- บันทึก trip plan เป็น template
- สร้าง trip ใหม่จาก template (clone แล้วแก้วันที่/รายละเอียด)
- Template library ตามประเทศ/จังหวัด (ในอนาคต)

---

### 4.3 Module: Publishing & Sharing

#### FR-PUB-001: Publish Trip Plan
- ปุ่ม Publish เพื่อเปิดให้ guest เข้าดู
- สร้าง unique URL: `natgan.com/t/{slug}`
- slug กำหนดเองได้ หรือ auto-generate
- สร้าง QR Code อัตโนมัติจาก URL
- QR Code ดาวน์โหลดเป็น PNG ได้ (สำหรับพิมพ์)

#### FR-PUB-002: Guest View (ลูกทริปเปิดดู)
- เปิด URL → เห็น trip plan สวยๆ ทันที ไม่ต้อง login
- แสดง:
  - Logo + ช่องทางติดต่อบริษัท
  - ข้อมูลทริปครบ (วัน / กิจกรรม / แผนที่ / ข้อมูลเสริม)
  - "Powered by NatGan" badge (free tier)
  - ปุ่ม "ติดตามทริปนี้" → เพิ่มเพื่อน LINE OA / Web Push
- Responsive design — ใช้งานได้ดีบน mobile (เปิดจาก Line)
- Auto-highlight กิจกรรมปัจจุบันตามเวลา (ไม่ต้องมีใครอัพเดท)

#### FR-PUB-003: Immigration-Friendly View (ยื่น ตม.)
- ปุ่ม "โหมดยื่น ตม." บน guest view → แสดงข้อมูลแบบ official สำหรับยื่นเจ้าหน้าที่ตรวจคนเข้าเมือง
- แสดงข้อมูลที่ ตม. ต้องการ:
  - ชื่อทริป / วันเดินทาง เข้า-ออก
  - รายละเอียดที่พัก (ชื่อ, ที่อยู่, เบอร์โทร)
  - ข้อมูลเที่ยวบิน (สายการบิน, เลขไฟลท์, วันเวลา)
  - Itinerary รายวันแบบย่อ (วันที่ + สถานที่หลัก)
  - ข้อมูลบริษัททัวร์ + เลข TAT license (ถ้ามี)
- แสดงเป็นภาษาท้องถิ่นของ destination อัตโนมัติ (เช่น ไปญี่ปุ่น → แสดงภาษาญี่ปุ่น)
- Layout สะอาด เป็นทางการ อ่านง่ายบนหน้าจอมือถือ
- **ไม่ต้องปริ้นกระดาษ — ยื่นหน้าจอให้ ตม. จบ**
- ใช้ได้แม้ offline (cache ข้อมูลไว้ใน browser สำหรับตอนยังไม่ได้ต่อ WiFi ที่สนามบิน)

#### FR-PUB-004: Unpublish / Archive
- Unpublish → URL ยังอยู่แต่แสดงหน้า "ทริปนี้ไม่เปิดให้ดูแล้ว"
- Archive → ย้ายไป archive ไม่แสดงใน dashboard แต่ URL ยังเข้าได้ (portfolio)

---

### 4.4 Module: Notification & Communication (Killer Feature)

#### FR-NOTI-001: Follow / Subscribe ทริป
- ลูกทริปกดปุ่ม "ติดตามทริปนี้" บน guest view
- เลือกช่องทางรับแจ้งเตือน:
  - **LINE OA (Messaging API)** — User เพิ่มเพื่อน LINE OA ของ NatGan → link trip (เหมาะคนไทย)
  - **Web Push Notification** — กด allow บน browser ไม่ต้องมี account (เหมาะต่างชาติ + คนที่ไม่อยากเชื่อม LINE)
- ลูกทริปเลือกได้ทั้ง 2 ช่องทาง หรือช่องทางเดียว
- เก็บ record ว่าใครติดตามทริปไหน ผ่านช่องทางอะไร

#### FR-NOTI-002: แจ้งเตือนเมื่อ Plan เปลี่ยน (Core Feature)
- เมื่อ admin แก้ไข trip plan ที่ publish แล้ว → ระบบตรวจจับ change
- ระบบสร้าง change summary อัตโนมัติ:
  ```
  ⚠️ ทริป "เชียงใหม่ 3 วัน" มีการเปลี่ยนแปลง

  📅 วันที่ 2:
  - เปลี่ยน: ดอยสุเทพ 09:00 → 13:00
  - เพิ่ม: ร้านกาแฟ Ristr8to 10:00
  - ยกเลิก: ตลาดวโรรส (ปิดปรับปรุง)

  👉 ดูรายละเอียด: natgan.com/t/chiangmai3d
  ```
- ส่งผ่านทุกช่องทางที่ follower เลือกไว้ (LINE Messaging API + Web Push)
- Web Push แสดง notification บน browser/mobile แม้ไม่ได้เปิดเว็บอยู่
- Admin เลือกได้ว่าจะส่ง noti ทันที หรือ save ไว้ส่งทีเดียว (batch)

#### FR-NOTI-003: แจ้งเตือนก่อนวันถัดไป (Auto)
- ระบบส่ง notification อัตโนมัติผ่านทุกช่องทาง (LINE Messaging API + Web Push) ก่อนวันเดินทางแต่ละวัน (เช่น 20:00 คืนก่อน)
  ```
  📋 พรุ่งนี้ วันที่ 3: ภูเขาไฟฟูจิ

  ⏰ นัดพบ 07:00 ล็อบบี้โรงแรม
  🎒 เตรียม: เสื้อกันหนาว, รองเท้าผ้าใบ

  👉 ดูรายละเอียด: natgan.com/t/tokyo8d
  ```
- Admin ตั้งค่าเปิด/ปิดได้ต่อทริป
- Admin แก้ไขเวลาส่งได้ (default 20:00 เวลาท้องถิ่น destination)

#### FR-NOTI-004: ปุ่มรับทราบ (Acknowledge)
- เมื่อมีการเปลี่ยนแปลง → หน้า guest view แสดง banner:
  ```
  ⚠️ ทริปนี้มีการเปลี่ยนแปลง — ดูรายละเอียด
  [รับทราบแล้ว ✓]
  ```
- ลูกทริปกดปุ่ม "รับทราบแล้ว" → บันทึกว่าเห็นแล้ว
- ไม่ต้อง login — ใช้ LINE User ID (จาก LINE OA) หรือ Web Push subscription identify

#### FR-NOTI-005: Read Receipt Dashboard (Admin)
- Admin เห็น dashboard ต่อทริป:
  ```
  การเปลี่ยนแปลงวันที่ 15 มี.ค. 2026
  ✅ รับทราบ: 28/30 คน
  ❌ ยังไม่เห็น: สมชาย, สมหญิง
  ```
- ปุ่ม "ส่ง noti ซ้ำ" เฉพาะคนที่ยังไม่เห็น
- ปุ่ม "คัดลอกรายชื่อ" เพื่อไปโทรตามเอง

---

### 4.5 Module: Change Log

#### FR-LOG-001: ประวัติการเปลี่ยนแปลง
- ทุกครั้งที่ plan ถูกแก้ไข → บันทึก change log
- แสดงบน admin dashboard:
  - วันเวลาที่แก้
  - สิ่งที่เปลี่ยน (เพิ่ม / ลบ / แก้ไข)
  - ใครแก้ (กรณีหลาย admin)
- ลูกทริปเห็น change log ฉบับย่อบน guest view (optional, admin เปิด/ปิดได้)

---

### 4.6 Module: Dashboard & Analytics

#### FR-DASH-001: Admin Dashboard
- รายการ trip plans ทั้งหมด (Active / Draft / Archived)
- แต่ละทริปแสดง:
  - ชื่อ / วันเดินทาง / สถานะ
  - จำนวน views
  - จำนวน followers
  - การเปลี่ยนแปลงล่าสุด

#### FR-DASH-002: Trip Analytics (Pro/Business tier)
- จำนวน views ต่อวัน
- จำนวน followers
- อัตราการรับทราบ (acknowledge rate)
- จำนวน QR scans
- วันไหนถูกดูมากที่สุด

---

### 4.7 Module: Branding & Customization

#### FR-BRAND-001: Company Branding
- Logo แสดงบน trip plan
- ช่องทางติดต่อบริษัท (แสดงเป็น section บน trip plan)
- สี theme หลัก (เลือกจาก palette หรือกำหนดเอง) — Pro tier ขึ้นไป

#### FR-BRAND-002: Powered By Badge
- Free tier: แสดง "Powered by NatGan" + link ถาวร
- Pro tier: ย่อเป็น badge เล็ก
- Business tier: ซ่อนได้ (white-label)

---

### 4.8 Module: Billing & Subscription

#### FR-BILL-001: Pricing Tiers

> **หมายเหตุ:** ราคาสุดท้ายอยู่ระหว่างการตกลงกับทีม Marketing อาจมีการเปลี่ยนแปลง

| Tier | ราคา | รายละเอียด |
|---|---|---|
| **Free** | ฟรี | 3 ทริป |
| **Pay-per-Trip** | ฿49 / ทริป | ซื้อทีละทริป |
| **Pack 5** | ฿199 | 5 ทริป (ประหยัด ฿46) |
| **Pack 10** | ฿349 | 10 ทริป (ประหยัด ฿141) |

#### FR-BILL-002: Payment Methods
- PromptPay QR (หลัก — คนไทยคุ้นเคย)
- Credit/Debit card ผ่าน Omise
- ออกใบเสร็จอัตโนมัติ

---

### 4.9 Module: Posts (Tour Package Listings)

> **หมายเหตุ:** ระบบ Posts และ Trips เป็นระบบอิสระต่อกัน ไม่ได้เชื่อมโยงกัน

#### FR-POST-001: สร้าง Post (แพ็คเกจทัวร์)
- บริษัท/ไกด์สร้าง post สำหรับโปรโมตแพ็คเกจทัวร์
- ข้อมูลที่กรอก:
  - **title** — ชื่อแพ็คเกจ
  - **destination** — จุดหมาย
  - **description** — รายละเอียดแพ็คเกจ
  - **highlights** — จุดเด่นของทริป
  - **images** — รูปภาพประกอบ (หลายรูป)
  - **priceStartFrom** — ราคาเริ่มต้น
  - **duration** — ระยะเวลา (เช่น 3 วัน 2 คืน)
  - **travelPeriod** — ช่วงเวลาเดินทาง
  - **totalSlots** — จำนวนที่นั่งทั้งหมด
  - **slotsLeft** — จำนวนที่นั่งเหลือ
  - **tags** — แท็กสำหรับค้นหา

#### FR-POST-002: สถานะ Post
- **Draft** — ร่าง ยังไม่แสดง
- **Published** — เผยแพร่แล้ว แสดงบน Info Website
- **Closed** — ปิดรับแล้ว ไม่แสดงบน Info Website

#### FR-POST-003: การแสดงผล Post
- Post ที่ published จะแสดงบน **Info Website** (พัฒนาโดย Nes) แยกจาก trip-web-client
- **ไม่มีระบบจอง (booking)** — เป็นการ showcase เท่านั้น บริษัท/ไกด์ปิดการขายเอง
- ผู้สนใจติดต่อผ่านช่องทางของบริษัท/ไกด์โดยตรง

#### FR-POST-004: Post Analytics
- **viewCount** — จำนวนคนดู post
- **inquiryCount** — จำนวนคนกดติดต่อ/สอบถาม

---

### 4.10 Module: Client Member System

#### FR-MEM-001: การสมัคร Member
- สมัครผ่าน Google, LINE, Email (optional — ไม่บังคับ)
- ลูกทริปสามารถดูทริปได้โดยไม่ต้องสมัคร (guest view ยังคงเดิม)
- การสมัครเป็น Member เพื่อเข้าถึงฟีเจอร์เพิ่มเติม

#### FR-MEM-002: Member Dashboard
- ทริปที่ติดตาม (followed trips)
- สถานที่ที่บันทึกไว้ (saved places)
- ประวัติทริปที่เคยเข้าดู
- จัดการโปรไฟล์ส่วนตัว
- ติดต่อ support

#### FR-MEM-003: Travel Points / Elite Member (Planned)
- ระบบสะสมแต้ม Travel Points
- ระดับสมาชิก Elite Member
- **สถานะ:** อยู่ระหว่างวางแผน ราคาและเงื่อนไขอยู่ระหว่างการตกลงกับทีม Marketing

#### FR-MEM-004: วัตถุประสงค์หลัก
- เก็บประวัติทริปของลูกทริป
- รับการแจ้งเตือนเกี่ยวกับทริปที่ติดตาม
- บันทึกสถานที่ที่สนใจ

---

### 4.11 Module: Portfolio

#### FR-PORT-001: หน้า Portfolio สาธารณะ
- แต่ละบริษัท/ไกด์มีหน้า portfolio สาธารณะ
- URL: `natgan.com/p/{custom-slug}`
- Admin กำหนด custom URL slug ได้

#### FR-PORT-002: เนื้อหา Portfolio
- แสดงทริปที่ published ทั้งหมด
- แสดงข้อมูลบริษัท/ไกด์ (logo, ชื่อ, ช่องทางติดต่อ)
- เปิด/ปิดหน้า portfolio ได้ (toggle on/off)

---

### 4.12 Module: Support Ticket

#### FR-TICKET-001: สร้าง Support Ticket
- ผู้ใช้สามารถแจ้งบัก (bug report) หรือร้องขอฟีเจอร์ (feature request)
- ระบุหัวข้อ, รายละเอียด, ประเภท (bug / feature request / other)
- แนบภาพหน้าจอได้ (optional)

#### FR-TICKET-002: ติดตามสถานะ
- สถานะ: **Open** → **Pending** → **Resolved**
- ผู้ใช้ดูสถานะ ticket ของตัวเองได้
- ทีมงาน (Super Admin) จัดการ ticket ผ่าน trip-web-staff

---

### 4.13 Module: Multi-language Support

#### FR-I18N-001: Platform UI Language
- รองรับภาษา: ไทย, อังกฤษ, ญี่ปุ่น (เพิ่มได้ในอนาคต)
- ผู้ใช้เลือกภาษา UI ได้

#### FR-I18N-002: Trip Plan Language
- Admin เลือกภาษาหลักของ trip plan
- รองรับการสร้าง trip plan 1 อัน แสดงได้หลายภาษา (อนาคต)
- ลูกทริปเลือกภาษาดูได้ (ถ้า admin สร้างไว้หลายภาษา)

---

## 5. Non-Functional Requirements

### 5.1 Performance
| Requirement | Target |
|---|---|
| Page load time (guest view) | < 2 วินาที |
| QR code generation | < 1 วินาที |
| Notification delivery (LINE + Web Push) | < 5 วินาที หลัง trigger |
| Concurrent users per trip | รองรับ 100+ คนพร้อมกัน |

### 5.2 Availability
- Uptime target: 99.5%
- Planned maintenance: แจ้งล่วงหน้า 24 ชม.

### 5.3 Security
- HTTPS ทุก connection
- Authentication ผ่าน industry standard (OAuth 2.0 / JWT)
- ข้อมูลบริษัทและลูกทริปเข้ารหัส at rest
- PDPA compliant — เก็บข้อมูลเท่าที่จำเป็น, ลบได้เมื่อร้องขอ
- LINE User ID เก็บแบบ encrypted

### 5.4 Scalability
- รองรับ 1,000 บริษัท / 10,000 trip plans ใน Phase 1
- Database design รองรับ horizontal scaling

### 5.5 Mobile First
- ออกแบบ mobile first (80%+ traffic จะมาจาก mobile ผ่าน LINE)
- รองรับ iOS Safari, Android Chrome, LINE in-app browser
- ไม่ต้องมี mobile app — Progressive Web App (PWA) ในอนาคต

---

## 6. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Apps                           │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ trip-web-    │ │ trip-web-    │ │ Info Website             │ │
│  │ admin        │ │ client       │ │ (พัฒนาโดย Nes)           │ │
│  │              │ │              │ │                          │ │
│  │ - Dashboard  │ │ - Guest View │ │ - แสดง Posts             │ │
│  │ - Trip       │ │ - Trip Plan  │ │   (Tour Package          │ │
│  │   Builder    │ │ - Member     │ │    Listings)             │ │
│  │ - Posts      │ │   Dashboard  │ │ - Portfolio Pages        │ │
│  │ - Portfolio  │ │ - Follow     │ │                          │ │
│  │ - Billing    │ │ - Saved      │ │                          │ │
│  │ - Settings   │ │   Places     │ │                          │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API
┌───────────────────────────▼─────────────────────────────────────┐
│              trip-web-staff (Backend / Admin Panel)              │
│                                                                 │
│  ┌────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Auth   │ │ Trip    │ │ Noti │ │ Billing  │ │ Support     │  │
│  │ Module │ │ CRUD    │ │ Queue│ │ (Omise)  │ │ Tickets     │  │
│  └────────┘ └─────────┘ └──────┘ └──────────┘ └─────────────┘  │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌────────────────────┐   │
│  │ Posts  │ │ Member  │ │ Portfolio │ │ Super Admin Panel  │   │
│  │ Module │ │ Module  │ │ Module    │ │ (จัดการระบบ)        │   │
│  └────────┘ └─────────┘ └───────────┘ └────────────────────┘   │
│                                                                 │
│                    PostgreSQL Database                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     External Services                           │
│                                                                 │
│  ┌──────────────┐ ┌──────────┐ ┌─────────┐ ┌──────┐            │
│  │ LINE         │ │ Web Push │ │ Omise   │ │Google│            │
│  │ Messaging API│ │ (VAPID)  │ │ Payment │ │ Maps │            │
│  └──────────────┘ └──────────┘ └─────────┘ └──────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Model Overview

### 7.1 Core Entities

```
Company (บริษัท/ไกด์/ส่วนตัว)
├── id, name, logo_url, contacts, tat_license
├── account_type: company | freelance_guide | personal
├── subscription_tier, subscription_expires_at
├── portfolio_enabled, portfolio_slug
├── created_at
│
├── User (ผู้ใช้ admin)
│   ├── id, company_id, email, name
│   ├── role: owner | editor
│   └── created_at
│
├── TripPlan (แผนทริป)
│   ├── id, company_id, title, slug
│   ├── destination, start_date, end_date
│   ├── cover_image, travelers_count
│   ├── airline_info, accommodation_info
│   ├── status: draft | published | archived
│   ├── language, published_at
│   ├── edit_count (สำหรับ free tier)
│   │
│   ├── Day (วัน)
│   │   ├── id, trip_id, day_number, title, subtitle
│   │   ├── cover_image, date
│   │   │
│   │   └── Activity (กิจกรรม)
│   │       ├── id, day_id, time, name, description
│   │       ├── type: attraction | restaurant | hotel | transport | other
│   │       ├── lat, lng, maps_link
│   │       ├── image_url, sort_order
│   │       └── created_at, updated_at
│   │
│   ├── EmergencyContact
│   │   ├── id, trip_id, name, phone, description
│   │   └── sort_order
│   │
│   ├── TripNote
│   │   ├── id, trip_id, content, sort_order
│   │   └── created_at
│   │
│   ├── Follower (ผู้ติดตาม)
│   │   ├── id, trip_id, display_name, followed_at
│   │   ├── line_user_id (nullable)
│   │   ├── web_push_subscription (nullable, JSON: endpoint + keys)
│   │   ├── notification_channels: ["line", "web_push"]
│   │   └── last_acknowledged_at
│   │
│   ├── TripRating (การให้คะแนนทริป)
│   │   ├── id, trip_id, member_id
│   │   ├── rating, comment
│   │   └── created_at
│   │
│   └── ChangeLog (ประวัติเปลี่ยนแปลง)
│       ├── id, trip_id, changed_by
│       ├── changes_summary (JSON)
│       ├── notification_sent_at
│       ├── created_at
│       │
│       └── Acknowledgement (การรับทราบ)
│           ├── id, changelog_id, follower_id
│           └── acknowledged_at
│
├── Post (แพ็คเกจทัวร์ — อิสระจาก TripPlan)
│   ├── id, company_id
│   ├── title, destination, description, highlights
│   ├── images (JSON array)
│   ├── price_start_from, duration, travel_period
│   ├── total_slots, slots_left
│   ├── tags (JSON array)
│   ├── status: draft | published | closed
│   ├── view_count, inquiry_count
│   └── created_at, updated_at
│
└── SupportTicket (ตั๋วแจ้งปัญหา)
    ├── id, company_id, user_id
    ├── title, description, type: bug | feature_request | other
    ├── screenshot_url (nullable)
    ├── status: open | pending | resolved
    └── created_at, updated_at

Member (สมาชิกลูกทริป — แยกจาก Company)
├── id, email, name, avatar_url
├── auth_provider: google | line | email
├── line_user_id (nullable)
├── travel_points (default 0)
├── elite_tier (nullable — planned)
├── created_at
│
├── SavedPlace (สถานที่ที่บันทึก)
│   ├── id, member_id
│   ├── place_name, lat, lng, maps_link
│   ├── note (nullable)
│   └── created_at
│
└── FollowedTrip (ทริปที่ติดตาม)
    ├── id, member_id, trip_id
    └── followed_at
```

---

## 8. Development Phases

### Phase 1: MVP (8-10 สัปดาห์)

**เป้าหมาย:** ใช้ pilot กับ 1-5 บริษัททัวร์ได้

| สัปดาห์ | งาน |
|---|---|
| 1-2 | Auth + Company Profile + Database setup |
| 3-5 | Trip Plan Builder (CRUD Day + Activity) |
| 6-7 | Guest View (public URL + QR Code) |
| 8-9 | LINE Messaging API integration (follow via LINE OA + change notification) |
| 10 | Testing + Deploy + Pilot launch |

**MVP Features:**
- สร้าง/แก้ไข trip plan
- Publish → URL + QR
- Guest view (responsive, mobile-first)
- LINE Messaging API เมื่อ plan เปลี่ยน
- ปุ่มรับทราบ + read receipt dashboard
- Company logo + contacts
- Free tier (3 trips)

**MVP ยังไม่มี:**
- Payment / subscription (ใช้ manual ก่อน)
- Analytics
- Template system
- Multi-language trip plan
- แจ้งเตือนก่อนวันถัดไป (auto noti)
- Posts system
- Member system
- Portfolio
- Support Ticket

### Phase 2: Monetization (สัปดาห์ 11-16)

- Payment integration (Omise + PromptPay)
- Pricing tiers (Free / Pay-per-Trip / Pack 5 / Pack 10)
- Auto noti ก่อนวันถัดไป
- Basic analytics dashboard
- Posts module (Tour Package Listings)

### Phase 3: Growth (สัปดาห์ 17-24)

- Client Member System (Google / LINE / Email signup)
- Member Dashboard (followed trips, saved places)
- Portfolio module (public page per company/guide)
- Support Ticket module
- Template system
- Full analytics + export
- Multi-language trip plan
- Custom theme colors
- White-label option (Business tier)
- Landing page + SEO

### Phase 4: Scale (สัปดาห์ 25+)

- Travel Points / Elite Member system
- API สำหรับ enterprise integration
- Collaborative editing (หลาย admin)
- PWA support
- Inbound tour support (ต่างชาติมาไทย)
- Advanced analytics
- TripRating system

---

## 9. Integration Specifications

### 9.1 LINE Messaging API (ผ่าน LINE OA)
- **Purpose:** ส่ง notification ไปยังลูกทริปผ่าน LINE
- **หมายเหตุ:** LINE Notify ถูกยกเลิกเมื่อ 1 เมษายน 2025 ระบบใช้ LINE Messaging API ผ่าน LINE Official Account แทน
- **Flow:**
  1. ลูกทริปกด "ติดตาม" → User เพิ่มเพื่อน LINE OA ของ NatGan → link trip
  2. เมื่อ User เพิ่มเพื่อน → Webhook ส่ง follow event มา → ระบบได้ LINE User ID
  3. เก็บ LINE User ID → ใช้ส่ง noti ผ่าน `POST https://api.line.me/v2/bot/message/push`
- **Limit:** ขึ้นอยู่กับแผน LINE OA (Free: 500 ข้อความ/เดือน, Light: 5,000, Standard: 15,000+)
- **Cost:** Free tier 500 ข้อความ/เดือน, เกินนั้นตามแผน LINE OA
- **ENV:** `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`

### 9.2 Web Push Notification API
- **Purpose:** ส่ง push notification ไปยังลูกทริปผ่าน browser/mobile โดยไม่ต้องเปิดเว็บ
- **Flow:**
  1. ลูกทริปกด "ติดตาม" → browser แสดง permission dialog "Allow notifications?"
  2. ลูกทริปกด Allow → ได้ push subscription (endpoint + keys)
  3. เก็บ subscription → ใช้ส่ง noti ผ่าน Web Push Protocol (VAPID)
- **Support:** Chrome, Firefox, Edge, Safari 16.4+, Android Chrome, iOS Safari 16.4+ (รองรับ PWA)
- **Limit:** ไม่มี limit ต่อ subscription
- **Cost:** ฟรี (ใช้ web-push library + self-hosted)
- **ข้อดีเทียบ LINE Messaging API:**
  - ไม่ต้องมี LINE account — เหมาะสำหรับนักท่องเที่ยวต่างชาติ
  - ทำงานบน browser โดยตรง ไม่ต้องเพิ่มเพื่อน LINE OA
  - รองรับ offline notification (Service Worker)
- **ข้อจำกัด:**
  - iOS Safari ต้อง add to home screen ก่อนถึงจะรับ push ได้
  - ผู้ใช้ต้องกด Allow — บาง browser block by default

### 9.3 Google Maps
- **Purpose:** สร้าง link ไปยังสถานที่ + route planning
- **Flow:** สร้าง URL จาก lat/lng หรือ place name → เปิดใน Google Maps app
- **Cost:** ฟรี (ใช้ URL scheme ไม่ใช่ API)

### 9.4 Omise Payment Gateway
- **Purpose:** รับชำระเงิน Pay-per-Trip + Pack
- **Methods:** PromptPay QR, Credit/Debit card
- **Fee:** 3.65% ต่อ transaction
- **Cost:** ไม่มีค่ารายเดือน

### 9.5 QR Code Generation
- **Purpose:** สร้าง QR Code จาก trip URL
- **Implementation:** Client-side library (qrcode.js) — ไม่มีค่าใช้จ่าย

---

## 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| LINE Messaging API มีค่าใช้จ่ายเมื่อเกิน free tier | กลาง | กลาง | LINE Notify ถูกยกเลิกแล้ว (1 เม.ย. 2025) ระบบใช้ LINE Messaging API แทน — มี Web Push เป็นช่องทางเสริมเพื่อลดจำนวนข้อความ LINE + เพิ่ม email fallback ในอนาคต |
| ผู้ใช้ไม่ยอมจ่ายเงิน | สูง | กลาง | Validate pricing กับ pilot ก่อน, ปรับ tier ตาม feedback, เริ่มจาก Pay-per-Trip ราคาถูก |
| บริษัททัวร์ไม่เปลี่ยนพฤติกรรม | สูง | กลาง | เน้น onboard ง่าย, ให้ value ตั้งแต่ free tier |
| Performance issue เมื่อ scale | กลาง | ต่ำ | ใช้ CDN + caching ตั้งแต่แรก |
| PDPA compliance | สูง | ต่ำ | เก็บข้อมูลน้อยที่สุด, มี consent flow |
| Posts ไม่มีคนดู / engagement ต่ำ | กลาง | กลาง | ทำ SEO สำหรับ Info Website, เชื่อมกับ social media |
| Member signup rate ต่ำ | กลาง | กลาง | ไม่บังคับสมัคร, ให้ value ชัดเจน (saved places, trip history) |

---

## 11. Success Metrics

### Phase 1 (MVP)
- 5 บริษัททัวร์ใช้งาน pilot
- 20+ trip plans สร้างบนแพลตฟอร์ม
- 200+ followers (ลูกทริป)
- Acknowledge rate > 70%

### Phase 2 (Monetization)
- 3+ บริษัทจ่ายเงิน (paying customers)
- Monthly revenue > 2,000 บาท (cover infra cost)
- Churn rate < 10% ต่อเดือน
- 50+ Posts สร้างบน platform

### Phase 3 (Growth)
- 50+ บริษัท active
- Monthly revenue > 20,000 บาท
- Organic signups > 50% (จาก powered by badge)
- 500+ Members registered
- 100+ Portfolio pages active

---

*Document End — NatGan System Requirements v2.0*
