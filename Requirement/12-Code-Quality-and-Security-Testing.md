# 12. มาตรฐานคุณภาพโค้ดและการทดสอบความปลอดภัย

> Code Quality & Security Testing Standard
> เอกสารกำหนดมาตรฐานการตรวจสอบคุณภาพโค้ดและการทดสอบเจาะระบบก่อน Deploy Production

**Version:** 1.0
**อัปเดตล่าสุด:** 31 มีนาคม 2569
**ผู้จัดทำ:** TripApp Development Team

---

## 1. ภาพรวม

### 1.1 วัตถุประสงค์

กำหนดมาตรฐานการตรวจสอบโค้ดและทดสอบความปลอดภัยของระบบ TripApp ก่อนนำขึ้น Production เพื่อให้มั่นใจว่า:

- โค้ดไม่มีช่องโหว่ด้านความปลอดภัย (Vulnerability)
- โค้ดมีคุณภาพตามมาตรฐาน (Maintainability, Reliability)
- ระบบทนทานต่อการโจมตี (Attack Resistance)
- สอดคล้องกับมาตรฐาน OWASP Top 10

### 1.2 เครื่องมือที่ใช้

| เครื่องมือ | ประเภท | วัตถุประสงค์ |
|-----------|--------|------------|
| **SonarQube** | Static Application Security Testing (SAST) | วิเคราะห์โค้ดอัตโนมัติ หาช่องโหว่ + code smell |
| **Penetration Testing** | Dynamic Application Security Testing (DAST) | ทดสอบเจาะระบบจริงโดยผู้เชี่ยวชาญ |
| **Dependency Check** | Software Composition Analysis (SCA) | ตรวจ library/package ที่มีช่องโหว่ |

### 1.3 ขั้นตอนการตรวจสอบก่อน Deploy

```
Development → Code Review → SonarQube Scan → Fix Issues
    → Dependency Check → Staging Deploy → Penetration Test
    → Fix Findings → Re-test → Production Deploy
```

---

## 2. SonarQube — Static Code Analysis

### 2.1 Quality Gate (เกณฑ์ผ่าน)

| Metric | เกณฑ์ขั้นต่ำ | หมายเหตุ |
|--------|------------|----------|
| **Bugs** | 0 (A rating) | ห้ามมี bug |
| **Vulnerabilities** | 0 (A rating) | ห้ามมีช่องโหว่ |
| **Security Hotspots** | Reviewed 100% | ตรวจสอบทุกจุด |
| **Code Smells** | ≤ 5% Technical Debt Ratio | |
| **Coverage** | ≥ 60% (target 80%) | Unit test coverage |
| **Duplications** | ≤ 3% | โค้ดซ้ำ |

### 2.2 Security Rules ที่ต้องผ่าน

#### 2.2.1 Injection (OWASP A03)

| Rule | คำอธิบาย | ตัวอย่างที่ถูกต้อง |
|------|---------|------------------|
| SQL Injection | ห้าม string concatenation ใน query | ใช้ EF Core parameterized queries |
| Command Injection | ห้าม execute shell command จาก user input | ไม่มี Process.Start จาก input |
| LDAP Injection | ห้าม inject LDAP query | ไม่ใช้ LDAP |
| XSS | ห้าม render user input โดยไม่ encode | Output encoding ทุกจุด |

```csharp
// ❌ SonarQube จะ flag
var sql = $"SELECT * FROM users WHERE email = '{email}'";

// ✅ ถูกต้อง
var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
```

#### 2.2.2 Broken Authentication (OWASP A07)

| Rule | คำอธิบาย |
|------|---------|
| Hardcoded Credentials | ห้าม hardcode password, key, token ใน source |
| Weak Password | enforce minimum 8 chars |
| Session Fixation | สร้าง session ใหม่หลัง login |
| JWT Validation | validate issuer, audience, expiry, signature |

```csharp
// ❌ SonarQube จะ flag
var secret = "my-secret-key-hardcoded";

// ✅ ถูกต้อง
var secret = _config["Jwt:Secret"];
```

#### 2.2.3 Sensitive Data Exposure (OWASP A02)

| Rule | คำอธิบาย |
|------|---------|
| Plaintext Password | ห้ามเก็บ password เป็น plaintext |
| Sensitive Data in Log | ห้าม log ข้อมูลส่วนบุคคล |
| Weak Hashing | ห้ามใช้ MD5, SHA1 สำหรับ password |
| Missing Encryption | sensitive data ต้อง encrypt at rest |

```csharp
// ❌ SonarQube จะ flag
_logger.LogInformation($"User {firstName} {lastName} registered");

// ✅ ถูกต้อง
_logger.LogInformation("User registered: {Email}", email);
```

#### 2.2.4 Security Misconfiguration (OWASP A05)

| Rule | คำอธิบาย |
|------|---------|
| Debug in Production | ห้าม EnableDetailedErrors, EnableSensitiveDataLogging ใน production |
| CORS Wildcard | ห้ามใช้ `*` ใน production CORS |
| Missing Security Headers | ต้องมี HSTS, X-Frame-Options, CSP |
| Default Credentials | ห้ามใช้ default password ใน production |
| Stack Trace Exposure | ห้าม return stack trace ให้ client |

```csharp
// ❌ SonarQube จะ flag — ถ้าอยู่นอก #if DEBUG
options.EnableSensitiveDataLogging();

// ✅ ถูกต้อง
if (builder.Environment.IsDevelopment())
    options.EnableSensitiveDataLogging();
```

#### 2.2.5 Insecure Design (OWASP A04)

| Rule | คำอธิบาย |
|------|---------|
| Mass Assignment | ห้าม bind entity ตรงจาก request |
| Missing Authorization | ทุก endpoint ต้องมี [Authorize] ยกเว้น public |
| IDOR | ตรวจ ownership ก่อนให้เข้าถึง resource |
| Missing Input Validation | validate ทุก input ก่อน process |

```csharp
// ❌ IDOR — ไม่ตรวจ ownership
var trip = await _db.TripPlans.FindAsync(id);

// ✅ ถูกต้อง — ตรวจ companyId
var trip = await _db.TripPlans
    .FirstOrDefaultAsync(t => t.Id == id && t.CompanyId == companyId);
```

### 2.3 Code Smell Rules

| Rule | คำอธิบาย | เกณฑ์ |
|------|---------|------|
| Method Length | method ยาวเกินไป | ≤ 40 lines |
| Cyclomatic Complexity | logic ซับซ้อน | ≤ 15 |
| Cognitive Complexity | อ่านยาก | ≤ 15 |
| Parameter Count | parameter มากเกินไป | ≤ 7 |
| Class Length | class ยาวเกินไป | ≤ 300 lines |
| Duplicate Code | โค้ดซ้ำ | ≤ 3% |
| Commented Out Code | โค้ดที่ comment ทิ้งไว้ | ห้ามมี |
| TODO/FIXME | ค้างอยู่ใน production | ห้ามมี (ยกเว้น tracked issue) |

---

## 3. Penetration Testing

### 3.1 ขอบเขตการทดสอบ

| ระบบ | URL | ประเภท |
|------|-----|--------|
| trip-api | api.tripapp.co | API Testing |
| trip-web-admin | admin.tripapp.co | Web Application Testing |
| trip-web-client | app.tripapp.co | Web Application Testing |
| trip-web-staff | staff.tripapp.co | Web Application Testing |

### 3.2 Testing Categories

#### 3.2.1 Authentication Testing

| Test Case | วิธีทดสอบ | เกณฑ์ผ่าน |
|-----------|----------|----------|
| Brute Force Login | ลอง login ผิดหลายครั้ง | Rate limit 10/min, lock after 5 fails |
| Password Policy | สมัครด้วย weak password | Reject < 8 chars |
| Token Manipulation | แก้ไข JWT payload | Signature validation fail |
| Token Expiry | ใช้ expired token | Return 401 |
| Session Fixation | ใช้ session เก่าหลัง login | Session ใหม่ทุกครั้ง |
| Email Verification Bypass | เข้าใช้งานโดยไม่ verify | Block, return error |
| Registration Spam | สมัครซ้ำรัว | Rate limit |

#### 3.2.2 Authorization Testing

| Test Case | วิธีทดสอบ | เกณฑ์ผ่าน |
|-----------|----------|----------|
| Horizontal Privilege | Admin A เข้าถึง trip ของ Admin B | Return 403/404 |
| Vertical Privilege | User เข้าถึง Staff API | Return 401/403 |
| IDOR | เปลี่ยน ID ใน URL | ตรวจ ownership |
| Role Bypass | แก้ role ใน token | Signature validation fail |
| Menu Access | เข้า endpoint ที่ role ไม่มีสิทธิ์ | Return 403 |

#### 3.2.3 Input Validation Testing

| Test Case | Payload ตัวอย่าง | เกณฑ์ผ่าน |
|-----------|-----------------|----------|
| SQL Injection | `' OR 1=1 --` | Parameterized query ป้องกัน |
| XSS (Stored) | `<script>alert(1)</script>` | Encoded/sanitized |
| XSS (Reflected) | `?q=<img onerror=alert(1)>` | Encoded/sanitized |
| Command Injection | `; rm -rf /` | ไม่มี shell execution |
| Path Traversal | `../../etc/passwd` | Validate file path |
| File Upload | `shell.php.jpg` | Validate content type + extension |
| JSON Injection | Nested/oversized JSON | Size limit + depth limit |
| Unicode Bypass | Homoglyph characters | Normalize input |

#### 3.2.4 Business Logic Testing

| Test Case | วิธีทดสอบ | เกณฑ์ผ่าน |
|-----------|----------|----------|
| Quota Bypass | สร้าง trip เกิน free quota | Return 402 |
| Price Manipulation | แก้ราคาใน request | Server-side price validation |
| Race Condition | ส่ง request พร้อมกัน | Database lock/transaction |
| Data Tampering | แก้ไข trip ของคนอื่น | Ownership check |
| Agreement Bypass | สมัครโดยไม่ accept terms | Validate termsReadAt/privacyReadAt |
| Email Verify Bypass | ใช้ token ซ้ำ | Token invalidated after use |

#### 3.2.5 API Security Testing

| Test Case | วิธีทดสอบ | เกณฑ์ผ่าน |
|-----------|----------|----------|
| Rate Limiting | ส่ง request เกิน limit | Return 429 |
| CORS Bypass | Request จาก unauthorized origin | Block by CORS |
| HTTP Methods | ใช้ PUT/DELETE กับ GET-only endpoint | Return 405 |
| Content-Type | ส่ง XML แทน JSON | Reject non-JSON |
| API Versioning | เรียก deprecated endpoint | Return 404/301 |
| Large Payload | ส่ง body > 10MB | Reject with 413 |
| Missing Headers | ไม่ส่ง Authorization header | Return 401 |

#### 3.2.6 Data Protection Testing

| Test Case | วิธีทดสอบ | เกณฑ์ผ่าน |
|-----------|----------|----------|
| Sensitive Data in Response | ดู API response | ไม่มี password, token, internal error |
| Sensitive Data in DB | ดู DB dump | FirstName/LastName encrypted (AES-256) |
| Sensitive Data in Log | ดู log files | ไม่มี plaintext ชื่อ/นามสกุล |
| Password Storage | ดู DB | BCrypt hash เท่านั้น |
| HTTPS Enforcement | เข้าผ่าน HTTP | Redirect to HTTPS |
| Cookie Security | ดู cookies | HttpOnly, Secure, SameSite |

---

## 4. Dependency Security

### 4.1 NuGet Packages (.NET)

```bash
# ตรวจ vulnerability
dotnet list package --vulnerable

# ตรวจ outdated
dotnet list package --outdated
```

| เกณฑ์ | Action |
|------|--------|
| Critical vulnerability | แก้ไขทันที ห้าม deploy |
| High vulnerability | แก้ไขภายใน 7 วัน |
| Medium vulnerability | แก้ไขภายใน 30 วัน |
| Low vulnerability | แก้ไขใน sprint ถัดไป |

### 4.2 npm Packages (Next.js)

```bash
# ตรวจ vulnerability
npm audit

# แก้ไขอัตโนมัติ
npm audit fix
```

### 4.3 Container Security (Docker)

```bash
# scan Docker image
docker scout quickview
docker scout cves
```

---

## 5. Security Testing Schedule

### 5.1 ตารางการตรวจสอบ

| กิจกรรม | ความถี่ | ผู้รับผิดชอบ |
|---------|--------|------------|
| SonarQube scan (CI/CD) | ทุก commit / PR | อัตโนมัติ |
| Code review (security focus) | ทุก PR | Developer + Reviewer |
| Dependency check | สัปดาห์ละ 1 ครั้ง | อัตโนมัติ (Dependabot/Snyk) |
| Penetration test (internal) | ก่อน release ใหญ่ | Dev Team |
| Penetration test (external) | ปีละ 1 ครั้ง | บริษัท pentest ภายนอก |
| Security audit | ปีละ 1 ครั้ง | ผู้เชี่ยวชาญภายนอก |

### 5.2 Pre-Production Checklist

#### Must Pass (ห้าม deploy ถ้าไม่ผ่าน)

- [ ] SonarQube: 0 Bugs, 0 Vulnerabilities
- [ ] SonarQube: All Security Hotspots reviewed
- [ ] No Critical/High dependency vulnerabilities
- [ ] Penetration test: No Critical/High findings
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Sensitive data encrypted in DB
- [ ] Error messages do not expose internals
- [ ] All endpoints have proper authorization

#### Should Pass (แก้ไขภายใน 30 วัน)

- [ ] SonarQube: Coverage ≥ 60%
- [ ] SonarQube: Technical Debt Ratio ≤ 5%
- [ ] SonarQube: Duplication ≤ 3%
- [ ] No Medium dependency vulnerabilities
- [ ] Penetration test: No Medium findings
- [ ] API documentation up to date

---

## 6. Reporting

### 6.1 SonarQube Report

ทุก sprint ต้องสรุป:
- จำนวน issues ใหม่ vs แก้ไขแล้ว
- Coverage trend
- Technical debt trend
- Security rating (A/B/C/D/E)

### 6.2 Penetration Test Report

ทุกครั้งที่ทำ pentest ต้องมี:
- Executive Summary
- Scope & Methodology
- Findings (Critical → Low) with evidence
- Remediation recommendations
- Re-test results after fix

### 6.3 Incident Report

เมื่อพบ vulnerability ใน production:
- วันที่พบ
- ความรุนแรง (CVSS score)
- ระบบที่ได้รับผลกระทบ
- Root cause
- Remediation timeline
- Lessons learned

---

## 7. Security Development Guidelines

### 7.1 Secure Coding Checklist (สำหรับ Developer)

ก่อน commit ทุกครั้ง ตรวจสอบ:

```
□ ไม่มี hardcoded secrets (password, key, token)
□ ทุก endpoint มี [Authorize] หรือ [AllowAnonymous] ชัดเจน
□ ทุก database query ใช้ parameterized (EF Core)
□ ทุก user input ถูก validate (DTO + model validation)
□ ทุก resource access ตรวจ ownership (companyId/userId)
□ Error response ไม่ expose internal details
□ Sensitive data ใช้ EncryptedConverter
□ ไม่ log sensitive data (ชื่อ นามสกุล password token)
□ File upload validate type + size + content
□ ไม่มี commented-out code ที่ไม่จำเป็น
```

### 7.2 Code Review Checklist (สำหรับ Reviewer)

```
□ ตรวจ OWASP Top 10 ครบ
□ ตรวจ authorization ถูกต้อง
□ ตรวจ input validation ครบ
□ ตรวจ error handling เหมาะสม
□ ตรวจ sensitive data handling
□ ตรวจ logging ไม่มี sensitive data
□ ตรวจ business logic bypass
□ ตรวจ race condition
□ ตรวจ proper HTTP status codes
□ ตรวจ DTO ไม่ expose internal fields
```

---

## 8. OWASP Top 10 (2021) Mapping

| # | Category | สถานะระบบ TripApp | มาตรการ |
|---|----------|-----------------|--------|
| A01 | Broken Access Control | ✅ มี | [Authorize] policies, RBAC, ownership check |
| A02 | Cryptographic Failures | ✅ มี | AES-256-GCM, BCrypt, HTTPS/TLS 1.3 |
| A03 | Injection | ✅ มี | EF Core parameterized, DTO validation |
| A04 | Insecure Design | ✅ มี | DTO pattern, agreement logging, email verify |
| A05 | Security Misconfiguration | ✅ มี | Security headers, CORS, rate limiting |
| A06 | Vulnerable Components | ⚠️ ต้องตรวจ | ต้องตั้ง Dependabot/Snyk |
| A07 | Authentication Failures | ✅ มี | JWT, BCrypt, email verification, rate limit |
| A08 | Software & Data Integrity | ⚠️ ต้องตรวจ | ต้องตั้ง CI/CD security scan |
| A09 | Security Logging & Monitoring | ✅ มี | RequestLoggingMiddleware, AgreementLog |
| A10 | Server-Side Request Forgery | ✅ มี | ไม่มี user-controlled URL fetch |

---

## 9. Revision History

| Version | วันที่ | ผู้แก้ไข | รายละเอียด |
|---------|-------|---------|-----------|
| 1.0 | 31 มี.ค. 2569 | Dev Team | ฉบับแรก |
