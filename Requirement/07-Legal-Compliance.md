# Legal & Compliance
# NatGan (นัดกัน) — v1.0

**Version:** 1.0
**Date:** 17 March 2026
**Status:** Draft

---

## 1. ภาพรวมกฎหมายที่เกี่ยวข้อง

| กฎหมาย | ย่อ | เกี่ยวข้องอย่างไร |
|---|---|---|
| **พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562** | PDPA | เก็บ/ใช้/เปิดเผยข้อมูลส่วนบุคคลของลูกทริป |
| **พ.ร.บ. ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544** | ETA | สัญญา SaaS ทางอิเล็กทรอนิกส์ |
| **พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2550** | CCA | ความปลอดภัยของระบบ, การเข้าถึงข้อมูล |
| **LINE Platform Terms** | — | การใช้ LINE Messaging API ต้องปฏิบัติตามข้อกำหนด LINE |
| **VPS Provider Terms of Service** | — | การเก็บข้อมูลบน PostgreSQL (Docker) บน VPS |
| **Vercel Terms of Service** | — | การ deploy และ bandwidth |

---

## 2. PDPA Compliance — Checklist

### 2.1 ข้อมูลส่วนบุคคลที่ NatGan เก็บ

| ข้อมูล | ประเภท | เจ้าของข้อมูล | ฐานกฎหมาย |
|---|---|---|---|
| ชื่อ-นามสกุล | ข้อมูลทั่วไป | Admin, Guest (follower) | สัญญา (Contract) |
| อีเมล | ข้อมูลทั่วไป | Admin | สัญญา (Contract) |
| เบอร์โทรศัพท์ | ข้อมูลทั่วไป | Admin | สัญญา (Contract) |
| LINE User ID | ข้อมูลทั่วไป | Follower | ความยินยอม (Consent) |
| หมายเลขหนังสือเดินทาง | ข้อมูลทั่วไป* | Guest (Immigration View) | ความยินยอม (Consent) |
| ข้อมูล airline (เที่ยวบิน) | ข้อมูลทั่วไป | Trip | สัญญา (Contract) |
| ข้อมูลที่พัก | ข้อมูลทั่วไป | Trip | สัญญา (Contract) |
| IP Address / Device info | ข้อมูลทั่วไป | Visitor | ประโยชน์โดยชอบธรรม (Legitimate Interest) |
| Cookie / Session | ข้อมูลทั่วไป | Admin | ประโยชน์โดยชอบธรรม (Legitimate Interest) |

> *หมายเลขหนังสือเดินทาง — แม้เป็น "ข้อมูลทั่วไป" ตาม PDPA แต่เป็นข้อมูล sensitive ในทางปฏิบัติ ต้องมี security measures เพิ่มเติม

### 2.2 PDPA Compliance Checklist

| # | ข้อกำหนด | สถานะ | Implementation |
|---|---|---|---|
| 1 | **Privacy Policy (นโยบายความเป็นส่วนตัว)** | 🔲 ต้องทำ | หน้า `/privacy` — ภาษาไทย + อังกฤษ |
| 2 | **Consent Management** | 🔲 ต้องทำ | Cookie banner + LINE follow consent |
| 3 | **Data Processing Agreement (DPA)** | 🔲 ต้องทำ | ระหว่าง NatGan กับบริษัททัวร์ (Data Controller = บริษัททัวร์, Data Processor = NatGan) |
| 4 | **Right to Access** | 🔲 ต้องทำ | API endpoint ให้ user ดูข้อมูลตัวเอง |
| 5 | **Right to Erasure (ลบข้อมูล)** | 🔲 ต้องทำ | Soft delete + hard delete after 30 days |
| 6 | **Right to Portability** | 🔲 ต้องทำ | Export trip data เป็น JSON/PDF |
| 7 | **Data Breach Notification** | 🔲 ต้องทำ | แจ้ง สคส. ภายใน 72 ชม. + แจ้งเจ้าของข้อมูลทันที |
| 8 | **Record of Processing Activities (ROPA)** | 🔲 ต้องทำ | เอกสาร internal บันทึกการประมวลผลข้อมูล |
| 9 | **DPO (เจ้าหน้าที่คุ้มครองข้อมูล)** | ⚠️ อาจยังไม่จำเป็น | SME startup อาจยังไม่ต้องแต่งตั้ง DPO — แต่ต้องมีคนรับผิดชอบ |
| 10 | **Cross-border Transfer** | ✅ ไม่จำเป็น | VPS สามารถเลือก DC ในไทยได้ → ไม่มี cross-border transfer |

### 2.3 Data Flow & PDPA Mapping

```
บริษัททัวร์ (Data Controller)
     │
     ├── สร้างทริป → NatGan เก็บข้อมูลทริป (Contract basis)
     │
     ├── ลูกทริปดู Guest View → NatGan เก็บ IP, device (Legitimate Interest)
     │
     ├── ลูกทริปกด Follow (LINE) → NatGan เก็บ LINE User ID (Consent)
     │     └── Consent text: "อนุญาตให้ NatGan ส่งแจ้งเตือนผ่าน LINE เมื่อ itinerary เปลี่ยนแปลง"
     │
     └── ลูกทริปกรอก Immigration → NatGan เก็บ passport info (Consent)
           └── Consent text: "อนุญาตให้เก็บข้อมูลหนังสือเดินทางชั่วคราว สำหรับแสดงที่ ตม. เท่านั้น"
```

### 2.4 Data Retention Policy

| ข้อมูล | ระยะเวลาเก็บ | หลังหมดอายุ |
|---|---|---|
| Trip data (itinerary, activities) | ทริปจบ + 90 วัน | Soft delete → Hard delete 30 วัน |
| Immigration data (passport) | ทริปจบ + 7 วัน | Auto hard delete |
| LINE User ID (follower) | จนกว่า user unfollow | Delete เมื่อ unfollow |
| Admin account data | จนกว่าลบ account | Soft delete → Hard delete 30 วัน |
| Access logs (IP, device) | 90 วัน | Auto delete |
| Change logs | ทริปจบ + 90 วัน | Delete พร้อม trip data |

---

## 3. Privacy Policy — โครงสร้าง

นโยบายความเป็นส่วนตัวต้องมีหัวข้อต่อไปนี้:

### 3.1 Privacy Policy Outline (ภาษาไทย)

1. **ผู้ควบคุมข้อมูล** — บริษัท NatGan / ที่อยู่ / ช่องทางติดต่อ
2. **ข้อมูลที่เราเก็บรวบรวม** — ตามตาราง 2.1
3. **วัตถุประสงค์ในการเก็บข้อมูล**
   - ให้บริการแพลตฟอร์ม NatGan
   - ส่งแจ้งเตือนเมื่อ itinerary เปลี่ยนแปลง
   - แสดงข้อมูลสำหรับ ตม. (Immigration View)
   - ปรับปรุงบริการ
4. **ฐานกฎหมาย** — Contract, Consent, Legitimate Interest
5. **การเปิดเผยข้อมูล**
   - LINE Corporation (ส่งข้อความผ่าน Messaging API)
   - PostgreSQL on VPS (เก็บข้อมูล)
   - Vercel (hosting)
6. **การโอนข้อมูลไปต่างประเทศ** — VPS DC ในไทย → ไม่มี cross-border transfer สำหรับ DB, Global CDN (Vercel)
7. **ระยะเวลาเก็บข้อมูล** — ตาม Data Retention Policy
8. **สิทธิของเจ้าของข้อมูล**
   - สิทธิในการเข้าถึง
   - สิทธิในการแก้ไข
   - สิทธิในการลบ
   - สิทธิในการโอนย้าย
   - สิทธิในการเพิกถอนความยินยอม
   - สิทธิในการคัดค้าน
   - สิทธิในการร้องเรียน (ต่อ สคส.)
9. **Cookie Policy**
10. **การรักษาความปลอดภัย**
11. **การเปลี่ยนแปลงนโยบาย**
12. **ช่องทางติดต่อ** — DPO / ผู้รับผิดชอบ

### 3.2 Cookie Policy

| Cookie | ประเภท | วัตถุประสงค์ | อายุ |
|---|---|---|---|
| `next-auth.session-token` | จำเป็น (Essential) | Auth.js session | Session |
| `natgan-theme` | Functional | ธีมสี (บริษัททัวร์) | 1 ปี |
| `natgan-lang` | Functional | ภาษา | 1 ปี |

> **ไม่มี Analytics cookie / Advertising cookie ใน MVP** — ถ้าเพิ่มในอนาคตต้อง update consent

---

## 4. Terms of Service — โครงสร้าง

### 4.1 Terms of Service Outline

1. **คำจำกัดความ**
   - "บริการ" = แพลตฟอร์ม NatGan
   - "ผู้ใช้" = บริษัททัวร์ (Admin)
   - "ผู้เยี่ยมชม" = ลูกทริป (Guest)
2. **ขอบเขตบริการ**
   - สร้างและจัดการ trip itinerary
   - ส่ง notification เมื่อ itinerary เปลี่ยนแปลง
   - แสดงข้อมูลสำหรับ Immigration
3. **การลงทะเบียนและบัญชี**
   - Admin ต้องให้ข้อมูลที่ถูกต้อง
   - รับผิดชอบรหัสผ่านของตน
4. **แผนบริการและการชำระเงิน** (Phase 2)
   - Free tier: X ทริป/เดือน
   - Pro tier: 299 บ/เดือน
5. **ข้อจำกัดการใช้งาน**
   - ห้ามใช้เพื่อวัตถุประสงค์ผิดกฎหมาย
   - ห้าม spam ผ่านระบบ notification
   - ห้ามอัพโหลดเนื้อหาที่ผิดกฎหมาย
6. **ทรัพย์สินทางปัญญา**
   - NatGan เป็นเจ้าของแพลตฟอร์ม
   - ข้อมูลทริปเป็นของบริษัททัวร์
7. **การจำกัดความรับผิด**
   - NatGan ไม่รับผิดชอบข้อมูลทริปที่ไม่ถูกต้อง (บริษัททัวร์เป็นผู้ใส่)
   - NatGan ไม่รับผิดชอบ LINE service outage
   - SLA ของ Free tier = best effort
8. **การระงับและยกเลิกบัญชี**
9. **การเปลี่ยนแปลงข้อกำหนด**
10. **กฎหมายที่ใช้บังคับ** — กฎหมายไทย, ศาลไทย
11. **ช่องทางติดต่อ**

---

## 5. LINE Platform Compliance

### 5.1 LINE Messaging API Terms

| ข้อกำหนด | สิ่งที่ต้องทำ | สถานะ |
|---|---|---|
| **LINE Official Account** | สร้าง LINE OA สำหรับ NatGan | 🔲 ต้องทำ |
| **Messaging API Channel** | สร้าง channel ใน LINE Developers Console | 🔲 ต้องทำ |
| **User Consent** | ต้องได้ consent ก่อนส่ง push message | 🔲 ต้องทำ (ผ่าน add friend flow) |
| **Message Content** | ห้ามส่ง spam, ต้องเกี่ยวข้องกับบริการ | ✅ NatGan ส่งเฉพาะ trip update |
| **Rich Menu** | สร้าง rich menu สำหรับ LINE OA | 🔲 ต้องทำ (Phase 2) |
| **Webhook Security** | ใช้ signature validation ทุก request | 🔲 ต้องทำ |
| **Rate Limit** | Communication plan: ไม่มี rate limit แต่จำกัด 500 msg/เดือน | ✅ เข้าใจแล้ว |

### 5.2 LINE OA Setup Checklist

1. ✅ ตัดสินใจใช้ Communication plan (ฟรี, 500 msg/เดือน)
2. 🔲 สร้าง LINE Official Account "NatGan นัดกัน"
3. 🔲 เปิดใช้ Messaging API ใน LINE Developers Console
4. 🔲 ตั้งค่า Webhook URL → `https://natgan.com/api/line/webhook`
5. 🔲 สร้าง Channel Access Token (long-lived)
6. 🔲 ตั้งค่า Greeting Message เมื่อ add friend
7. 🔲 ตั้งค่า Rich Menu (ลิงก์ไปหน้า trip ต่างๆ)
8. 🔲 Implement signature validation ใน webhook handler

### 5.3 LINE Message Templates

#### Trip Update Notification (Flex Message)

```json
{
  "type": "flex",
  "altText": "🔔 ทริปโตเกียว — มีการเปลี่ยนแปลง",
  "contents": {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": "🔔 ทริปอัพเดท", "weight": "bold", "size": "lg" }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": "ทริปโตเกียว 2568", "weight": "bold", "size": "md" },
        { "type": "text", "text": "Day 3 — เปลี่ยนร้านอาหารเที่ยง", "size": "sm", "color": "#666666" }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": { "type": "uri", "label": "ดูรายละเอียด", "uri": "https://natgan.com/trip/xxx" },
          "style": "primary"
        },
        {
          "type": "button",
          "action": { "type": "postback", "label": "✅ รับทราบ", "data": "ack=trip_xxx_change_123" },
          "style": "secondary"
        }
      ]
    }
  }
}
```

---

## 6. VPS (PostgreSQL) & Vercel Compliance

### 6.1 VPS — PostgreSQL on Docker

| เรื่อง | รายละเอียด |
|---|---|
| **Region** | Thailand DC (เลือก VPS provider ที่มี DC ในไทย) |
| **Data Residency** | ข้อมูลอยู่ในไทย → ไม่มี cross-border transfer ตาม PDPA (**ข้อดีสำคัญ**) |
| **PDPA Benefit** | ไม่ต้องกังวลเรื่อง cross-border transfer เลย — ข้อมูลอยู่ใน jurisdiction ไทย |
| **Encryption** | Data at rest: disk encryption on VPS + PostgreSQL TDE, Data in transit: TLS 1.2+ |
| **Backup** | pg_dump cron job (daily backup) + offsite backup rotation |
| **Authorization** | App-level authorization via Drizzle middleware — ดู TAD Section 2.5 |

### 6.2 Vercel

| เรื่อง | รายละเอียด |
|---|---|
| **Region** | Singapore (sin1) — primary function region |
| **CDN** | Global edge — static assets cached worldwide |
| **Data** | Vercel ไม่เก็บ user data — เป็นแค่ compute + CDN |
| **PDPA** | ไม่ต้องกังวลมาก เพราะ user data อยู่ใน PostgreSQL บน VPS ไม่ใช่ Vercel |

---

## 7. Security Compliance

### 7.1 Security Measures

| Layer | Measure | Implementation |
|---|---|---|
| **Authentication** | Auth.js + JWT | httpOnly cookie, auto-refresh |
| **Authorization** | App-level authorization | Drizzle middleware — ดู TAD |
| **Transport** | TLS 1.2+ | Vercel automatic HTTPS |
| **Data at Rest** | AES-256 | PostgreSQL + disk encryption on VPS |
| **Input Validation** | Zod schema | ทุก API endpoint |
| **XSS Prevention** | React auto-escape + CSP | Next.js default |
| **CSRF Protection** | SameSite cookie + origin check | Auth.js default |
| **Rate Limiting** | Vercel Edge middleware | 100 req/min per IP |
| **Passport Data** | เก็บแยก + auto-delete 7 วัน | Separate column + cron job |

### 7.2 Security Incident Response Plan

```
1. ตรวจพบเหตุการณ์ (Detection)
     │
2. ประเมินระดับความรุนแรง (Assessment)
     │  ├── Low: ไม่มีข้อมูลรั่ว → แก้ไข + บันทึก
     │  ├── Medium: อาจมีข้อมูลรั่ว → สืบสวน
     │  └── High: ข้อมูลรั่วจริง → ไปข้อ 3
     │
3. แจ้ง สคส. ภายใน 72 ชม. (PDPA Section 37(4))
     │
4. แจ้งเจ้าของข้อมูลทันที (ถ้ามีผลกระทบสูง)
     │
5. แก้ไข + ป้องกัน (Remediation)
     │
6. Post-mortem + อัพเดท security measures
```

---

## 8. Immigration View — ข้อกฎหมายพิเศษ

### 8.1 ข้อมูลที่แสดงใน Immigration View

| ข้อมูล | ใครเป็นคนใส่ | Sensitivity |
|---|---|---|
| ชื่อ-นามสกุล (อังกฤษ) | Admin | Medium |
| หมายเลข passport | Admin หรือ Guest | **High** |
| เที่ยวบินขาเข้า-ออก | Admin | Medium |
| ที่พัก (ชื่อ + ที่อยู่) | Admin | Low |
| ระยะเวลาพำนัก | Auto-calculate | Low |

### 8.2 Security Measures สำหรับ Passport Data

| Measure | รายละเอียด |
|---|---|
| **แยกเก็บ** | passport_number เก็บใน column แยก ไม่รวมกับ JSONB |
| **Auto-delete** | ลบอัตโนมัติ 7 วันหลังทริปจบ |
| **Access Control** | เฉพาะ admin ของทริปนั้น + guest ที่เป็นเจ้าของ passport เท่านั้นเห็น |
| **ไม่แคช** | ไม่เก็บใน CDN cache / service worker cache |
| **Audit Log** | บันทึกทุกครั้งที่มีคนเข้าดู Immigration View |
| **QR Code only** | ไม่แสดง passport number ใน Guest View ปกติ — ต้องกด QR เฉพาะ Immigration |

### 8.3 Consent Flow สำหรับ Immigration Data

```
Admin สร้างทริป → กรอก passport info (optional)
     │
     ├── ถ้า Admin กรอกเอง → อาศัย contract basis (Admin มีข้อมูล passengers อยู่แล้ว)
     │
     └── ถ้า Guest กรอกเอง →
           1. แสดง consent popup:
              "ข้อมูลหนังสือเดินทางจะถูกเก็บชั่วคราว
               เพื่อแสดงที่ ตม. เท่านั้น
               จะถูกลบอัตโนมัติ 7 วันหลังทริปจบ"
           2. Guest กด "ยินยอม"
           3. บันทึก consent timestamp + version
```

---

## 9. ข้อกำหนดด้านธุรกิจ

### 9.1 การจดทะเบียนธุรกิจ

| เรื่อง | รายละเอียด | ระยะเวลา |
|---|---|---|
| **จดทะเบียนบริษัท** | บริษัทจำกัด หรือ หจก. | ก่อน launch Pro tier |
| **จดทะเบียน VAT** | เมื่อรายได้เกิน 1.8 ล้าน/ปี | เมื่อถึง threshold |
| **จด e-Service VAT** | ไม่จำเป็น — NatGan ให้บริการในไทย | ไม่ต้อง |
| **จดทะเบียนเครื่องหมายการค้า** | "NatGan" + "นัดกัน" | ก่อน launch |

### 9.2 SaaS Revenue — ภาษี

| เรื่อง | รายละเอียด |
|---|---|
| **ภาษีเงินได้นิติบุคคล** | 20% ของกำไรสุทธิ (SME อาจได้ลดหย่อน) |
| **VAT** | 7% (เมื่อรายได้เกิน 1.8 ล้าน/ปี) |
| **หัก ณ ที่จ่าย** | บริษัททัวร์หัก 3% เมื่อจ่ายค่าบริการ |
| **ใบเสร็จ/ใบกำกับภาษี** | ต้องออกให้ลูกค้าทุกครั้ง (Phase 2) |

---

## 10. MVP Compliance Priority

### สิ่งที่ต้องทำก่อน Launch MVP

| # | เรื่อง | ความสำคัญ | เมื่อไหร่ |
|---|---|---|---|
| 1 | **Privacy Policy หน้าเว็บ** | 🔴 สูงมาก | ก่อน launch |
| 2 | **Terms of Service หน้าเว็บ** | 🔴 สูงมาก | ก่อน launch |
| 3 | **Cookie consent banner** | 🟡 สูง | ก่อน launch |
| 4 | **LINE OA + Messaging API setup** | 🔴 สูงมาก | ก่อน launch |
| 5 | **Passport data consent popup** | 🔴 สูงมาก | ก่อน launch |
| 6 | **Passport auto-delete (7 วัน)** | 🔴 สูงมาก | ก่อน launch |
| 7 | **App-level authorization (Drizzle middleware)** | 🔴 สูงมาก | ก่อน launch |
| 8 | **HTTPS everywhere** | ✅ Vercel ทำให้ | Auto |

### สิ่งที่ทำภายหลังได้ (Phase 2)

| # | เรื่อง | ความสำคัญ | เมื่อไหร่ |
|---|---|---|---|
| 9 | จดทะเบียนบริษัท | 🟡 สูง | ก่อนเปิด Pro tier |
| 10 | DPA กับบริษัททัวร์ pilot | 🟡 สูง | เมื่อ pilot เริ่ม |
| 11 | ROPA (Record of Processing) | 🟡 สูง | ภายใน 3 เดือนหลัง launch |
| 12 | Data export (Right to Portability) | 🟢 กลาง | Phase 2 |
| 13 | จดเครื่องหมายการค้า | 🟢 กลาง | ภายใน 6 เดือน |
| 14 | Incident Response Plan (formal) | 🟢 กลาง | ก่อนเปิด Pro tier |
| 15 | ใบกำกับภาษี / VAT | ⚪ ต่ำ | เมื่อรายได้ถึง threshold |

---

## 11. สรุป

### NatGan Legal Status

```
✅ ไม่มี sensitive data ตาม PDPA (ศาสนา, เชื้อชาติ, สุขภาพ, อาชญากรรม, พันธุกรรม, etc.)
✅ ไม่มี payment processing ใน MVP — ไม่ต้อง PCI-DSS
✅ ไม่มี health data — ไม่ต้อง HIPAA-equivalent
⚠️ มี passport data — ต้องมี special measures (auto-delete + consent)
✅ VPS DC ในไทย → ไม่มี cross-border transfer — ข้อดีสำคัญสำหรับ PDPA
⚠️ LINE Messaging API — ต้องปฏิบัติตาม LINE Platform Terms
```

### ความเสี่ยงทางกฎหมาย

| ความเสี่ยง | ระดับ | แผนรับมือ |
|---|---|---|
| PDPA ถูกร้องเรียน | ต่ำ (ถ้าทำตาม checklist) | Privacy Policy + Consent + Right to Delete |
| Passport data breach | กลาง (ข้อมูลสำคัญ) | Auto-delete 7 วัน + เก็บแยก + audit log |
| LINE ban เพราะ spam | ต่ำ (ส่งเฉพาะ trip update) | ปฏิบัติตาม LINE Terms อย่างเคร่งครัด |
| บริษัททัวร์ใช้ผิดวัตถุประสงค์ | กลาง | ToS ระบุชัด + มีสิทธิ์ระงับบัญชี |

---

*Document End — NatGan Legal & Compliance v1.0*
