# 11. มาตรฐานความปลอดภัยข้อมูล (Data Security Standard)

> เอกสารฉบับนี้กำหนดมาตรฐานการจัดการข้อมูลส่วนบุคคลและข้อมูลที่มีความอ่อนไหว (Sensitive Data)
> ของระบบ TripApp ให้สอดคล้องกับ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

**Version:** 1.0
**อัปเดตล่าสุด:** 31 มีนาคม 2569
**ผู้จัดทำ:** TripApp Development Team

---

## 1. ภาพรวม (Overview)

### 1.1 วัตถุประสงค์

เอกสารนี้กำหนดแนวทางปฏิบัติสำหรับ:
- การจำแนกประเภทข้อมูล (Data Classification)
- การเข้ารหัสข้อมูล (Encryption Standard)
- การจัดเก็บและเข้าถึงข้อมูล (Storage & Access)
- การส่งข้อมูลระหว่างระบบ (Data in Transit)
- การตรวจสอบและบันทึก (Audit & Logging)
- การจัดการ Key (Key Management)

### 1.2 ขอบเขต

ครอบคลุมทุกระบบ:
- **trip-api** — Backend API (.NET 10)
- **trip-web-admin** — Admin Portal (Next.js)
- **trip-web-client** — Client Portal (Next.js)
- **trip-web-staff** — Staff Portal (Next.js)
- **PostgreSQL Database**
- **Cloudflare R2** (File Storage)

---

## 2. การจำแนกประเภทข้อมูล (Data Classification)

### 2.1 ระดับความอ่อนไหว

| ระดับ | คำจำกัดความ | ตัวอย่าง | การจัดการ |
|-------|------------|---------|----------|
| **🔴 Confidential** | ข้อมูลลับ ห้ามเปิดเผย | Password, Secret Key, API Key | Hash (BCrypt) หรือ เก็บใน Vault |
| **🟠 Sensitive** | ข้อมูลส่วนบุคคลที่ระบุตัวตนได้ | ชื่อ นามสกุล เบอร์โทร LINE ID | AES-256-GCM Encrypt |
| **🟡 Internal** | ข้อมูลภายในระบบ ไม่เปิดเผยสาธารณะ | Email, Company Name, TAT License | เก็บ Plaintext + HTTPS |
| **🟢 Public** | ข้อมูลที่เปิดเผยได้ | Trip title, Destination, Activity name | เก็บ Plaintext |

### 2.2 Data Field Classification

#### User (mst_users)

| Field | Classification | Encryption | Blind Index | หมายเหตุ |
|-------|---------------|------------|-------------|----------|
| Id | 🟢 Public | ❌ | ❌ | UUID |
| Email | 🟡 Internal | ❌ Plaintext | ❌ | ใช้ Login + Unique Index |
| PasswordHash | 🔴 Confidential | BCrypt (hash) | ❌ | ห้ามเก็บ plaintext |
| **FirstName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** | ข้อมูลส่วนบุคคล |
| **LastName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** | ข้อมูลส่วนบุคคล |
| Role | 🟢 Public | ❌ | ❌ | Enum |
| IsActive | 🟡 Internal | ❌ | ❌ | Boolean |

#### StaffUser (mst_staff_users)

| Field | Classification | Encryption | Blind Index |
|-------|---------------|------------|-------------|
| Email | 🟡 Internal | ❌ Plaintext | ❌ |
| PasswordHash | 🔴 Confidential | BCrypt (hash) | ❌ |
| **FirstName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** |
| **LastName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** |

#### Company (mst_companies)

| Field | Classification | Encryption | Blind Index |
|-------|---------------|------------|-------------|
| Name | 🟡 Internal | ❌ | ❌ |
| **Phone** | **🟠 Sensitive** | **✅ AES-256-GCM** | ❌ |
| **LineId** | **🟠 Sensitive** | **✅ AES-256-GCM** | ❌ |
| FacebookUrl | 🟡 Internal | ❌ | ❌ |
| InstagramUrl | 🟡 Internal | ❌ | ❌ |
| WebsiteUrl | 🟢 Public | ❌ | ❌ |
| TatLicense | 🟡 Internal | ❌ | ❌ |

#### Follower (noti_followers)

| Field | Classification | Encryption | Blind Index |
|-------|---------------|------------|-------------|
| **DisplayName** | **🟠 Sensitive** | **✅ AES-256-GCM** | ❌ |
| **LineUserId** | **🟠 Sensitive** | **✅ AES-256-GCM** | ❌ |

#### GuestUser (อนาคต)

| Field | Classification | Encryption | Blind Index |
|-------|---------------|------------|-------------|
| Email | 🟡 Internal | ❌ Plaintext | ❌ |
| **FirstName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** |
| **LastName** | **🟠 Sensitive** | **✅ AES-256-GCM** | **✅ HMAC-SHA256** |
| **Phone** | **🟠 Sensitive** | **✅ AES-256-GCM** | ❌ |

---

## 3. มาตรฐานการเข้ารหัส (Encryption Standard)

### 3.1 Encryption at Rest (ข้อมูลในฐานข้อมูล)

```
Algorithm:  AES-256-GCM (Galois/Counter Mode)
Key Size:   256-bit (32 bytes)
IV/Nonce:   96-bit (12 bytes) — สุ่มใหม่ทุกครั้ง
Tag:        128-bit (16 bytes) — สำหรับ integrity check
Encoding:   Base64 (ciphertext + nonce + tag รวมเป็น string เดียว)
```

**ทำไมเลือก AES-256-GCM:**
- **AES-256** — มาตรฐาน NIST, ใช้ทั่วโลก, รัฐบาลสหรัฐฯ approve
- **GCM mode** — ให้ทั้ง Confidentiality + Integrity (AEAD)
- **ต่างจาก CBC** — GCM ตรวจจับ tampering ได้, ไม่ต้อง padding

**Format ที่เก็บใน DB:**
```
Base64( nonce[12] + ciphertext[n] + tag[16] )
```

### 3.2 Blind Index (สำหรับ Search)

```
Algorithm:  HMAC-SHA256
Key:        แยกจาก Encryption Key (ใช้ key คนละตัว)
Output:     64-character hex string
```

**ทำไมต้อง Blind Index:**
- ข้อมูลที่ encrypt แล้ว search ตรงๆ ไม่ได้ (ciphertext ต่างกันทุกครั้ง เพราะ random IV)
- Blind Index = deterministic hash ที่ search ได้ แต่ reverse ไม่ได้
- ใช้ HMAC-SHA256 แทน SHA256 เพราะมี key ป้องกัน rainbow table

**ตัวอย่าง:**
```
FirstName = "สมชาย"
→ Encrypted: "a7Bf3x9Kp2mQ..." (random ทุกครั้ง)
→ BlindIndex: "e3b0c44298fc1c..." (เหมือนกันทุกครั้ง สำหรับ search)
```

### 3.3 Password Hashing

```
Algorithm:  BCrypt
Work Factor: 12
```

- ไม่ใช่ encryption (decrypt ไม่ได้)
- ใช้เฉพาะ password เท่านั้น
- verify โดย compare hash

### 3.4 Data in Transit (ข้อมูลระหว่างทาง)

```
Protocol:   HTTPS / TLS 1.3
HSTS:       Strict-Transport-Security: max-age=31536000
Headers:    X-Content-Type-Options: nosniff
            X-Frame-Options: DENY
            Referrer-Policy: strict-origin-when-cross-origin
```

- **ไม่ encrypt ซ้อน** บน HTTPS — TLS 1.3 เพียงพอสำหรับ transit security
- HTTPS ให้ทั้ง encryption + integrity + authentication
- ลด complexity และ latency ที่ไม่จำเป็น

---

## 4. Key Management (การจัดการ Key)

### 4.1 Key ที่ใช้ในระบบ

| Key | ใช้ทำอะไร | เก็บที่ไหน | Rotation |
|-----|----------|-----------|----------|
| `ENCRYPTION_KEY` | AES-256-GCM encrypt/decrypt | Environment variable | ทุก 12 เดือน |
| `HMAC_KEY` | Blind Index (HMAC-SHA256) | Environment variable | ทุก 12 เดือน |
| `JWT_SECRET` | Sign JWT tokens | Environment variable (appsettings) | ทุก 6 เดือน |
| BCrypt salt | Password hashing | Auto-generated per password | ทุกครั้งที่เปลี่ยน password |

### 4.2 Key Generation

```bash
# สร้าง ENCRYPTION_KEY (32 bytes = 256 bits)
openssl rand -base64 32

# สร้าง HMAC_KEY (32 bytes)
openssl rand -base64 32
```

### 4.3 Key Storage Rules

- ❌ **ห้าม** hardcode key ใน source code
- ❌ **ห้าม** commit key ลง git
- ❌ **ห้าม** log key ใน console/file
- ✅ เก็บใน environment variable
- ✅ ใช้ `.env.local` สำหรับ development (อยู่ใน .gitignore)
- ✅ ใช้ Cloud Secret Manager สำหรับ production (อนาคต)

### 4.4 Key Rotation Procedure

เมื่อต้อง rotate key:
1. สร้าง key ใหม่
2. เพิ่ม key ใหม่เป็น `ENCRYPTION_KEY_NEW`
3. Run migration script: decrypt ด้วย key เก่า → re-encrypt ด้วย key ใหม่
4. สลับ key: `ENCRYPTION_KEY` = key ใหม่
5. ลบ key เก่า
6. Re-generate blind indexes ด้วย key ใหม่ (ถ้า HMAC_KEY เปลี่ยนด้วย)

---

## 5. Implementation Pattern

### 5.1 EncryptionService

```csharp
public interface IEncryptionService
{
    string Encrypt(string plaintext);
    string Decrypt(string ciphertext);
    string GenerateBlindIndex(string value);
}
```

### 5.2 EF Core Value Converter (Auto Encrypt/Decrypt)

```csharp
// Configuration
builder.Property(x => x.FirstName)
    .HasConversion(new EncryptedConverter(encryptionService))
    .HasMaxLength(512);  // encrypted text ยาวกว่า plaintext
```

- ✅ Auto encrypt ตอน save
- ✅ Auto decrypt ตอน read
- ✅ Application code ไม่ต้องเปลี่ยน

### 5.3 Blind Index Column Pattern

```
// DB columns
FirstName       VARCHAR(512)  — encrypted value
FirstNameIndex  VARCHAR(64)   — HMAC-SHA256 hash for search

// Search query
WHERE "FirstNameIndex" = HMAC('สมชาย')
```

---

## 6. Audit & Logging

### 6.1 สิ่งที่ต้อง log

| Event | Log Level | ข้อมูลที่บันทึก |
|-------|-----------|----------------|
| User register | Info | email, timestamp, IP |
| User login | Info | email, timestamp, IP, success/fail |
| Agreement accept | Info | userId, document type, version, timestamp, IP |
| Sensitive data access | Info | userId, field accessed, timestamp |
| Decryption error | Error | field, timestamp (ห้าม log ciphertext) |
| Key rotation | Warning | old key hash, new key hash, timestamp |

### 6.2 สิ่งที่ห้าม log

- ❌ Plaintext ของ sensitive data (ชื่อ นามสกุล เบอร์โทร)
- ❌ Encryption key หรือ HMAC key
- ❌ Password (ทั้ง plaintext และ hash)
- ❌ JWT token เต็ม (log ได้แค่ first 10 chars)
- ❌ Full request/response body ที่มี sensitive data

---

## 7. Database Security

### 7.1 Connection

- ✅ SSL/TLS connection to PostgreSQL
- ✅ Connection string in environment variable
- ✅ Separate DB user per environment (dev/staging/prod)
- ✅ Minimal privileges (no SUPERUSER)

### 7.2 Backup

- ✅ Daily automated backup
- ✅ Backup encrypted at rest
- ✅ Backup retention: 30 days
- ✅ Test restore monthly

### 7.3 Access Control

- ❌ No direct DB access in production
- ✅ Access via API only
- ✅ Query logging enabled in development
- ✅ Sensitive data masked in query logs

---

## 8. API Security

### 8.1 Authentication

| ระบบ | Method | Token Expiry |
|------|--------|-------------|
| Admin | JWT (HS256) | 7 days |
| Staff | JWT (HS256) | 24 hours |
| Client (อนาคต) | JWT (HS256) | 30 days |

### 8.2 Authorization

- Policy-based authorization (AdminPolicy, StaffPolicy, etc.)
- Role-based menu access (RBAC via mst_roles + mst_role_menus)
- Owner-only actions (publish, delete trip)

### 8.3 Rate Limiting

| Policy | Limit | Window |
|--------|-------|--------|
| Auth (login/register) | 10 requests | 1 minute |
| Admin write operations | 30 requests | 1 minute |
| Client read operations | 60 requests | 1 minute |
| Notification send | 10 requests | 1 minute |

### 8.4 Input Validation

- ✅ Model validation attributes (Required, StringLength, EmailAddress)
- ✅ Custom validation in service layer
- ✅ SQL injection prevention via EF Core parameterized queries
- ✅ XSS prevention via output encoding
- ✅ File upload validation (type, size, content)

---

## 9. Incident Response

### 9.1 ถ้า DB ถูก breach

1. Sensitive data ปลอดภัย (AES-256 encrypted)
2. Password ปลอดภัย (BCrypt hashed)
3. ดำเนินการ: rotate encryption keys, notify affected users, report to PDPA committee

### 9.2 ถ้า Encryption Key ถูกเปิดเผย

1. Rotate key ทันที
2. Re-encrypt ข้อมูลทั้งหมดด้วย key ใหม่
3. Invalidate JWT tokens ทั้งหมด
4. Audit log เพื่อตรวจสอบการเข้าถึง

### 9.3 ถ้าพบ Unauthorized Access

1. ระงับ account ที่เกี่ยวข้อง
2. ตรวจสอบ audit log
3. แจ้ง DPO ภายใน 24 ชั่วโมง
4. แจ้ง PDPA committee ภายใน 72 ชั่วโมง (ถ้ามีผลกระทบต่อเจ้าของข้อมูล)

---

## 10. Compliance Checklist

### PDPA Compliance

- [x] ข้อมูลส่วนบุคคลเก็บเท่าที่จำเป็น (Data Minimization)
- [x] มีฐานกฎหมายในการเก็บข้อมูล (สัญญา/ยินยอม)
- [x] เข้ารหัสข้อมูลที่มีความอ่อนไหว (AES-256-GCM)
- [x] รหัสผ่าน hash ด้วย BCrypt
- [x] HTTPS/TLS สำหรับ data in transit
- [x] บันทึกการยินยอม (Agreement Log: readAt, agreedAt, IP, UserAgent)
- [x] สิทธิ์เข้าถึง/แก้ไข/ลบข้อมูล (PDPA มาตรา 30-36)
- [x] ส่งออกข้อมูลได้ (Data Portability)
- [x] แจ้ง DPO ได้ (dpo@tripapp.co)
- [x] นโยบายความเป็นส่วนตัวเผยแพร่ (Privacy Policy page)
- [x] เงื่อนไขการใช้งานเผยแพร่ (Terms of Service page)
- [ ] แจ้ง PDPA committee เมื่อเกิด breach (Incident Response)
- [ ] Data Protection Impact Assessment — DPIA (ถ้าจำเป็น)

### Security Checklist

- [x] AES-256-GCM encryption at rest
- [x] Blind Index for encrypted field search
- [x] BCrypt password hashing (work factor 12)
- [x] HTTPS/TLS 1.3
- [x] JWT authentication with expiry
- [x] Role-based access control (RBAC)
- [x] Rate limiting
- [x] Security headers (HSTS, X-Frame-Options, CSP)
- [x] Input validation & parameterized queries
- [x] Email verification before account activation
- [x] Agreement logging (terms + privacy acceptance)
- [x] Encryption key in environment variable
- [ ] Key rotation procedure tested
- [ ] Cloud KMS integration (production)
- [ ] WAF (Web Application Firewall) — production
- [ ] Penetration testing — before launch

---

## 11. Revision History

| Version | วันที่ | ผู้แก้ไข | รายละเอียด |
|---------|-------|---------|-----------|
| 1.0 | 31 มี.ค. 2569 | Dev Team | ฉบับแรก |
