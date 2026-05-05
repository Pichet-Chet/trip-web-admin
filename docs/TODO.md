# Trip Web Admin — ROADMAP TODO

> Feature enhancements สำหรับ trip-web-admin ตาม ROADMAP.md
> แต่ละ feature มีงาน 2 ฝั่ง: BE (trip-api) + FE (trip-web-admin)
> ✅ = เสร็จ | 🔧 = กำลังทำ | ⬜ = ยังไม่เริ่ม

---

## Phase 1 — Foundations (~1 สัปดาห์)

> เป้าหมาย: table-stakes features ที่ทุก itinerary tool ควรมี

### 1.1 ICS Calendar Export — `S` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Endpoint `GET /api/admin/trips/{id}/calendar.ics` → return `text/calendar`
- ✅ สร้าง VEVENT per day (start/end + summary + description)
- ✅ Content-Disposition: attachment; filename="{slug}.ics"

**FE (trip-web-admin)**
- ✅ ปุ่ม "เพิ่มในปฏิทิน" บน `/dashboard/trips/[id]/preview`
- ✅ ปุ่ม "เพิ่มในปฏิทิน" บน `/dashboard/trips/[id]/manage`
- ✅ Click → fetch .ics → trigger browser download

---

### 1.2 PDF Itinerary Download — `M` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Endpoint `GET /api/admin/trips/{id}/export.pdf` → return `application/pdf`
- ✅ QuestPDF renderer: `TripPdfRenderer` — cover info → transport → accommodation → day-by-day → emergency contacts → notes
- ✅ Filename: `{trip-title}_{startDate}.pdf`
- ✅ DI registration: `AddSingleton<ITripPdfRenderer, TripPdfRenderer>`

**FE (trip-web-admin)**
- ✅ ปุ่ม "ดาวน์โหลด PDF" บน preview page (ใน QR section)
- ✅ ปุ่ม "ดาวน์โหลด PDF" (icon) บน manage page header

---

### 1.3 Pre-trip Checklist (Structured) — `S-M` (4-6 ชม.)

**BE (trip-api)**
- ✅ Entity `TripChecklistItem { id, tripId, label, isRequired, sortOrder }`
- ✅ Table `trip_checklist_items` + migration
- ✅ Endpoint `GET /api/admin/trips/{id}/checklist`
- ✅ Endpoint `PUT /api/admin/trips/{id}/checklist/bulk` (bulk diff — mirrors emergency contacts pattern)
- ✅ `ChecklistItems` in `TripDetailResponse` (admin GET) + `TripPublicResponse` (client GET)

**FE (trip-web-admin)**
- ✅ Section "สิ่งที่ต้องเตรียม" ใน `/dashboard/trips/new` — add/remove/toggle จำเป็น
- ✅ Load/save wired (parallel with other children, server IDs adopted back)
- ✅ แสดงผลใน preview page (read-only checkboxes + จำเป็น badge)

---

## Phase 2 — Visual Upgrades (~1 สัปดาห์)

> เป้าหมาย: public trip page มี "wow factor"

### 2.1 Map View of Activities (Route) — `M` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ `lat`/`lng`/`mapsLink` มีอยู่แล้วใน ActivityPublicResponse และ ActivityDetailResponse

**FE (trip-web-admin)**
- ✅ ติดตั้ง `leaflet` + `react-leaflet` + `@types/leaflet`
- ✅ `parseMapsLink` + `resolveCoords` helper (`src/lib/parse-maps-link.ts`)
- ✅ `TripDayMap` component (Leaflet markers + dashed polyline)
- ✅ `TripDayMapLazy` wrapper (dynamic import, SSR disabled)
- ✅ Preview page: map card แสดงแผนที่วันที่ active เมื่อมี activities ที่มี coords

---

### 2.2 Photo Gallery per Activity — `M` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Entity `TripActivityImage { id, activityId, url, sortOrder }` + table `trip_activity_images`
- ✅ Entity `PublishedActivityImage` + table `published_activity_images`
- ✅ Migration: `AddActivityImages`
- ✅ DTO `ActivityResponse` / `ActivityDetailResponse` → `imageUrls: string[]`
- ✅ `CreateActivityRequest` / `UpdateActivityRequest` → `imageUrls` (max 6)
- ✅ `ActivityService`: bulk-replace images on update
- ✅ Published snapshot: copy images to `PublishedActivityImage`
- ✅ Client API: `ActivityPublicResponse` → `imageUrls`

**FE (trip-web-admin)**
- ✅ `ActivityEditorCard` → multi-image upload (thumbnail strip, max 6, per-image delete)
- ✅ `updateActivityImages` handler (optimistic + bulk-replace PUT)
- ✅ Preview page → photo gallery card (grouped by activity + emoji label)
- ✅ Lightbox modal: full-screen, prev/next nav, image counter, backdrop close

---

### 2.3 Live Updates / Announcements — `S-M` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Entity `TripAnnouncement { id, tripId, message, isPinned, createdByUserId, createdAt }`
- ✅ Table `trip_announcements` + migration `AddTripAnnouncements`
- ✅ Endpoint `GET /api/admin/trips/{id}/announcements`
- ✅ Endpoint `POST /api/admin/trips/{id}/announcements` (+ optional notify flag)
- ✅ Endpoint `DELETE /api/admin/trips/{id}/announcements/{aid}`
- ✅ Endpoint `PUT /api/admin/trips/{id}/announcements/{aid}/pin`
- ✅ `NotificationService.SendAnnouncementAsync` → fan-out LINE/WebPush to followers
- ✅ Client API: `GET /api/client/t/{slug}` → `pinnedAnnouncement` (latest pinned)

**FE (trip-web-admin)**
- ✅ Manage page → 3rd tab "ประกาศระหว่างทาง"
- ✅ Compose form (textarea + pin checkbox + notify checkbox)
- ✅ List: cards with pin toggle + delete + timestamp + author
- ✅ Preview page → pinned banner (orange) ด้านบน main grid + link to manage

---

## Phase 3 — B2B Differentiation (~2 สัปดาห์)

> เป้าหมาย: feature ที่ competitor ไม่มี

### 3.1 Member Roles within Group Trip — `M` ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ เพิ่ม `GroupRole VARCHAR(64)` (nullable) บน `noti_followers`
- ✅ Migration `AddFollowerGroupRole`
- ✅ Endpoint `PUT /api/admin/trips/{id}/followers/{fid}/role`
- ✅ Client API: `GET /api/client/t/{slug}` → `groupMembers[]` (เฉพาะ non-null role)

**FE (trip-web-admin)**
- ✅ Manage page → followers tab → preset dropdown (หัวหน้ากลุ่ม / ผู้ดูแลค่าใช้จ่าย / คนขับ / สมาชิก / free-form fallback)
- ✅ Preview page → "สมาชิกในกลุ่ม" card with role badge (head_of_group = amber highlight)

---

### 3.2 Group Expense Tracking — `L` (3-4 วัน) ✅

> Headline B2B feature

**BE (trip-api)**
- [x] Entity `TripExpense { id, tripId, paidByFollowerId, amount, currency, description, occurredOn, splitMode }`
  - `splitMode: equal | shares | exact`
- [x] Entity `TripExpenseParticipant { expenseId, followerId, share }`
- [x] Tables `trip_expenses` + `trip_expense_participants` + migration
- [x] Endpoint `GET /api/admin/trips/{id}/expenses`
- [x] Endpoint `POST /api/admin/trips/{id}/expenses`
- [x] Endpoint `PUT /api/admin/trips/{id}/expenses/{eid}`
- [x] Endpoint `DELETE /api/admin/trips/{id}/expenses/{eid}`
- [x] Endpoint `GET /api/admin/trips/{id}/expenses/settlement` → minimum-transactions algorithm
- [x] Settlement algorithm: Splitwise math (net balances → min transactions)
- [x] Privacy: expenses visible เฉพาะ trip members (ไม่แสดงบน public page)

**FE (trip-web-admin)**
- [x] หน้าใหม่ `/dashboard/trips/[id]/expenses`
- [x] Add expense form: amount, currency, paidBy (dropdown followers), split mode, description, date
- [x] Quick-fill: "6,000 บาท แชร์ 4 คน" → auto-compute 1,500/คน
- [x] Expense list (grouped by day)
- [x] Per-person summary: "สมชายติด สมหญิง 1,500"
- [x] Settlement view: minimum transactions to settle group
- [x] Tab ใน manage page หรือ standalone route

---

### 3.3 Group Communication Touchpoints — `S-M` (4-6 ชม.) ✅

**BE (trip-api)**
- [x] Migration: เพิ่ม 3 fields บน `trip_plans`
  - `line_group_url VARCHAR(512)`
  - `whatsapp_group_url VARCHAR(512)`
  - `telegram_group_url VARCHAR(512)`
- [x] `UpdateTripRequest` + `TripDetailResponse` → include 3 fields
- [x] Validation: URL format check (`[Url]` annotation)
- [x] Client API: include fields ใน `GET /api/client/t/{slug}`

**FE (trip-web-admin)**
- [x] Section "ช่องทางกลุ่ม" ใน `/dashboard/trips/new` Step 1
- [x] Input: LINE group link, WhatsApp link, Telegram link
- [x] Preview page → แสดงปุ่ม "เข้ากลุ่ม LINE" / "เข้ากลุ่ม WhatsApp" / "เข้ากลุ่ม Telegram"

---

## Phase 4 — Multi-language Activation (~1 สัปดาห์)

> ต่อยอด Languages master ที่มีอยู่แล้ว

### 4.1 Per-language Content Layer — `M` (1-1.5 วัน) ✅

**BE (trip-api)**
- [x] Entity `TripTranslation { id, tripId, languageCode, field, targetId, value, source }`
  - fields: title, destination, importantNotes, day.title, day.subtitle, activity.name, activity.description, activity.placeName
- [x] Entity `TripSupportedLanguage` (junction trip ↔ additional languages)
- [x] Tables `trip_translations` + `trip_supported_languages` + migration
- [x] Endpoint `GET /api/admin/trips/{id}/translations[?lang=]`
- [x] Endpoint `PUT /api/admin/trips/{id}/translations` (bulk upsert, empty value = delete)
- [x] Endpoint `GET /api/admin/trips/{id}/translations/supported`
- [x] Endpoint `PUT /api/admin/trips/{id}/translations/supported`
- [x] Client API: `GET /api/client/t/{slug}?lang={code}` → overlay translated values

**FE (trip-web-admin)**
- [x] Language chips บน edit page Step 1 → เลือก "ภาษาที่รองรับ" เพิ่มเติม
- [x] Translation editor `/dashboard/trips/[id]/translations`: field-by-field, original ซ้าย / translation ขวา
- [x] Language tab strip (สลับภาษาที่จะแปล)
- [x] Floating save button + dirty state indicator
- [ ] Auto-fill จาก translation provider (Phase 4.2)

---

### 4.2 Translation Provider — `S` (4-6 ชม.) ✅

**BE (trip-api)**
- [x] `ITranslationProvider` abstraction + `GoogleTranslateProvider` implementation
- [x] `SourceHash` column on `trip_translations` (SHA-256 prefix for cache key)
- [x] Endpoint `POST /api/admin/trips/{id}/translations/auto`
  - skips fields with matching SourceHash (no re-translate if source unchanged)
  - skips manual entries (never overwrite operator edits)
  - `forceRefresh=true` to re-translate everything
- [x] `Translation:GoogleApiKey` config key in `appsettings.json`
- [x] Migration `AddTranslationSourceHash`

**FE (trip-web-admin)**
- [x] ปุ่ม "แปลอัตโนมัติ" dropdown ใน translation editor
  - "แปลเฉพาะช่องที่ยังไม่มี" (default)
  - "แปลใหม่ทั้งหมด" (forceRefresh)
- [x] Badge "แปลอัตโนมัติ" (amber) vs "แก้ด้วยตนเอง" (emerald) per field
- [x] Legend strip บน translation editor

---

### 4.3 Followers Language Preference — `S` (4 ชม.) ✅

**BE (trip-api)**
- [x] `preferred_language VARCHAR(16)` บน `noti_followers` + migration
- [x] Endpoint `PUT /api/client/follow/{followerId}/language`

**FE (trip-web-client)**
- [x] Language switcher แสดงเฉพาะเมื่อ trip มี > 1 ภาษา (real `supportedLanguages` from API)
- [x] Re-fetch trip content ด้วย `?lang=` เมื่อเปลี่ยนภาษา
- [x] Persist choice ใน localStorage per slug
- [x] `getLangMeta(code)` helper — รองรับทุก language code (fallback to 🌐 code)

---

## Phase 5 — Wizard UX Improvements (~1 สัปดาห์)

> FE-only ส่วนใหญ่ — ปรับ UX ของ trip wizard

### 5.1 Step 1 Progressive Disclosure — `S` (4 ชม.) ✅

**FE (trip-web-admin)**
- [x] Transport / Hotels / Contacts → default collapsed accordions (`CollapsibleSection` component)
- [x] Summary badge (ขา / แห่ง / เบอร์) shown in header when collapsed
- [x] Persist open/close state ใน React state (ไม่ต้อง localStorage)

---

### 5.2 Step 1 Auto-save — `S` (3 ชม.) ✅

**BE (trip-api)**
- [x] `UpdateTripRequest` ใช้ nullable fields ทั้งหมด → รับ partial update ได้แล้ว

**FE (trip-web-admin)**
- [x] ลบปุ่ม "บันทึกร่าง" Step 1 (ไม่ต้องกดเอง)
- [x] Debounced auto-save 1 500 ms หลังจาก field เปลี่ยน (useEffect ไม่มี deps)
- [x] Indicator pill "บันทึกอัตโนมัติแล้ว ✓" / "กำลังบันทึก…" / "บันทึกไม่สำเร็จ" ใน FooterActionBar
- [x] `saveTrip(redirectToEdit, silent)` รองรับ silent mode สำหรับ auto-save

---

### 5.3 Quick Activity Input — `M` (6-8 ชม.) ✅

**FE (trip-web-admin)**
- [x] `QuickActivityInput` component — input + Enter สร้าง activity + clear
- [x] `detectActivityMeta(name)` — keyword map → type + emoji (restaurant/hotel/shopping/transport/attraction)
- [x] Activity card compact view by default — row: emoji + ชื่อ + เวลา + type badge + ลบ
- [x] Click compact row → expand full edit view, ปุ่ม "ย่อ" กลับ
- [x] `defaultExpanded` prop — button-added blank activity opens expanded, quick-input stays compact

---

### 5.4 Inline Mobile Preview Drawer — `M` (1 วัน) ✅

**FE (trip-web-admin)**
- [x] `PreviewDrawer` component — slide-from-right panel พร้อม backdrop + X button
- [x] Swipe right → close (touch tracking via `onTouchStart/End`)
- [x] `MobilePreview` ย้ายไป `src/components/shared/` — shared ระหว่าง Step 2, 3
- [x] Step 2 (edit): ปุ่ม "Preview" ในหัวข้อ day panel → เปิด drawer พร้อม live day data
- [x] Step 1 (new): ปุ่ม "Preview" ใน FooterActionBar (แสดงเมื่อ draftId มีอยู่) → trip header + 0 days

---

### 5.5 Trip Templates / Clone Improvements — `M` (1 วัน) ✅

**BE (trip-api)**
- [x] `POST /api/admin/trips/{id}/clone` — already existed; extended to allow cloning templates (`IsTemplate=true`) + added `ChecklistItems` to clone
- [x] `IsTemplate` + `TemplateCategory` columns on `TripPlan` + migration `AddTripTemplate`
- [x] `GET /api/admin/trips/templates` — returns all trips where `IsTemplate=true`, grouped by category
- [x] `GetTemplatesAsync()` added to `ITripService` + `TripService`

**FE (trip-web-admin)**
- [x] `TemplatePickerModal` — fetches templates, shows cover/title/destination/days/activities cards grouped by category
- [x] Select → `POST /clone` → redirect to edit page
- [x] "สร้างจาก Template" button บน new trip page (hidden after draftId set)
- [x] Clone button บน my-trips trip card — already existed (`handleClone` + `content_copy` icon)

---

### 5.6 Mobile Redesign Step 2 — `L` (2 วัน) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ Day tabs → scrollable carousel (overflow-x-auto, scrollbar-hide) — mobile friendly
- ✅ Activity cards collapsed by default บน mobile (defaultExpanded=false when isMobile)
- ✅ Full edit ใน bottom sheet (ActivityBottomSheet — slide up, swipe down to close)
- ✅ Swipe ซ้าย/ขวา บน content canvas เพื่อเปลี่ยน day

---

## Phase 6 — Polish & Widgets (3-5 วัน)

### 6.1 Weather Forecast — `S` (3-4 ชม.) ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Endpoint `GET /api/admin/trips/{id}/weather` → proxy OpenWeatherMap free tier
- ✅ IMemoryCache 3 ชั่วโมง per destination
- ✅ Return available=false ถ้า startDate เกิน 14 วัน หรือผ่านไปแล้ว
- ✅ WeatherService: geocoding + 5-day/3-hour forecast → daily (noon reading per day)
- ✅ Config key: `OpenWeatherMap:ApiKey` ใน appsettings.json

**FE (trip-web-admin)**
- ✅ Weather widget ใน DayContextPanel — ดึงข้อมูลครั้งแรกเมื่อ mount
- ✅ แสดง: Material Symbol icon + tempMin–tempMax°C + description
- ✅ States: loading spinner / ไม่มีข้อมูล (reason) / วันนี้ไม่มีข้อมูล

---

### 6.2 Currency Converter Mini-widget — `S` (3 ชม.) ✅ เสร็จแล้ว

**BE (trip-api)**
- ✅ Endpoint `GET /api/client/currency?base=THB&target={code}` → daily rate
- ✅ Proxy Frankfurter API (free, no key, ECB data, ~30 currencies)
- ✅ IMemoryCache 24 ชั่วโมง per pair; allowlist 25 currencies

**FE (trip-web-admin / preview)**
- ✅ CurrencyWidget ท้าย preview page เมื่อ `scope === "international"`
- ✅ "1 THB ≈ X {target} (วันนี้)" + dropdown เลือกสกุลเงิน
- ✅ Quick convert input: พิมพ์จำนวน THB → แสดงค่าในสกุลเป้าหมาย

---

### 6.3 Time Zone Display — `S` (2 ชม.) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `src/lib/airport-timezone.ts` — static map 60+ IATA codes → IANA timezone + `utcOffsetLabel()` helper
- ✅ TransportSection (new trip wizard) → badge "BKK · UTC+7" / "NRT · UTC+9" เมื่อกรอกรหัสสนามบิน
- ✅ Preview page → transport segment card แสดง "HH:mm (UTC+N)" ถัดจากเวลาออก/ถึง

---

### 6.4 Local Emergency Hotline Quick-call — `XS` (1 ชม.) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `EmergencyFab` — floating button (rose, bottom-right, md:hidden) บน preview page
- ✅ Tap → slide-up drawer แสดง emergency contacts ของทริป
- ✅ แต่ละ contact → `<a href="tel:...">` — tap to call

---

## Phase 7 — Infrastructure & Quality (parallel)

> ทำควบคู่กับ Phase อื่น

### 7.1 E2E Tests — `M` (1.5 วัน) ✅ เสร็จแล้ว

**Test (trip-api + trip-web-admin)**
- ✅ ติดตั้ง `@playwright/test` + `playwright.config.ts` (webServer: next dev, project: chromium + mobile-chrome)
- ✅ `e2e/helpers/mock-api.ts` — `mockGet/Post/Put`, `injectFakeSession` helpers
- ✅ `e2e/01-auth-register.spec.ts` — register renders, success → verify-email, duplicate email error, login render
- ✅ `e2e/02-trip-wizard.spec.ts` — Step 1 fields, save draft, Step 2 day tabs + add activity, next → preview
- ✅ `e2e/03-post-publish.spec.ts` — post list, new post form, publish button calls API
- ✅ `e2e/04-billing-quota.spec.ts` — quota exceeded → upgrade prompt, billing page renders
- ✅ `e2e/05-trip-preview-publish.spec.ts` — preview renders, submit review, published state, currency widget
- ✅ `npm run test:e2e` script; CI job ใน `.github/workflows/test.yml` (runs on push to main)

---

### 7.2 Auth Subscription Pattern — `S-M` (4-6 ชม.) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `lib/auth.ts` → `subscribe(fn)` เพิ่ม listener registry; fires immediately + on every state change
- ✅ `notify()` เรียกใน `setMemory()`, `clearMemory()`, `setAccessToken()` ครอบคลุมทุก path
- ✅ `dashboard/layout.tsx` — แทน `setInterval(getUser, 100)` ด้วย `useEffect(() => subscribe(...), [])`
- ✅ `dashboard/page.tsx` — เปลี่ยนเป็น `useEffect(() => subscribe(setUser), [])` (single-liner)

---

### 7.3 Mobile Responsive Deep Audit — `M` (1 วัน) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `posts/[id]/edit/page.tsx` — `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (duration/price grids)
- ✅ Highlight remove button `w-8 h-8` → `w-10 h-10 min-w-[40px]` (44px tap target)
- ✅ footer-action-bar, trip-stepper, billing — already responsive (flex-wrap / overflow-x-auto)

---

### 7.4 Accessibility Scan — `M` (1 วัน) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ ติดตั้ง `@axe-core/playwright@4.11.3`
- ✅ `e2e/06-accessibility.spec.ts` — axe WCAG 2AA scans: login, dashboard, trip list, register
- ✅ Filters critical/serious violations only; excludes decorative icon font elements

---

### 7.5 Error Boundary + 404/500 Pages — `S` (3 ชม.) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `app/error.tsx` — rewritten with Thai text + design system (ลบ shadcn Button ออก)
- ✅ `app/dashboard/trips/[id]/edit/error.tsx` — per-route boundary พร้อม "กลับหน้ารายการ" + "ลองใหม่"
- ✅ `app/global-error.tsx` — root catch-all, must include `<html>` + `<body>` per Next.js spec
- ✅ `not-found.tsx` — มีอยู่แล้ว พร้อม Thai text

---

### 7.6 Performance / Lighthouse — `M` (1 วัน) ✅ เสร็จแล้ว

**FE (trip-web-admin)**
- ✅ `@next/bundle-analyzer` ติดตั้ง + `next.config.ts` wraps with `ANALYZE=true` flag
- ✅ `TripDayMap` (Leaflet) — lazy via `TripDayMapLazy` wrapper (dynamic import, SSR disabled) — มีอยู่แล้ว Phase 2.1
- ✅ `DevAutoFill` — lazy + NODE_ENV gate (dev only) — มีอยู่แล้ว
- ✅ `MobilePreview` — import consolidated; static (dynamic pattern drops prop types)

---

## Phase 8 — Other Admin Pages Audit ✅ เสร็จแล้ว

> Audit + fix ตามที่เจอจากการใช้งานจริง

- ✅ `/dashboard/notifications` — เพิ่มปุ่ม "ตั้งค่าการแจ้งเตือน" → `/dashboard/settings#notifications`
- ✅ `/dashboard/settings` — แก้ `getUser()` snapshot → `subscribe(setUser)` (live state)
- ✅ `/dashboard/billing/profile` — tax invoice flow ครบ (reviewed, no changes needed)
- ✅ `/dashboard/upgrade` — plan compare + order summary + Stripe checkout ครบ (reviewed, no changes needed)
- ✅ `/dashboard/my-data` — PDPA export flow ครบ (reviewed, no changes needed)
- ✅ `/dashboard/feedback` — ticket submission UX ครบ พร้อม attachment (reviewed, no changes needed)
- ✅ `/dashboard/activity` — แก้ CSV export: `sessionStorage.getItem("access_token")` → `getValidToken()`; แก้ `alert()` → toast
- ✅ `/dashboard/help` — แก้ `dangerouslySetInnerHTML` → DOMPurify sanitize; อัปเดต placeholder email; contact cards เป็น clickable links

---

## สรุป Effort

| Phase | FE Work | BE Work | รวม |
|---|---|---|---|
| 1 — Foundations | M | M | ~1 สัปดาห์ |
| 2 — Visual Upgrades | M | S | ~1 สัปดาห์ |
| 3 — B2B | L | L | ~2 สัปดาห์ |
| 4 — Multi-language | M | M | ~1 สัปดาห์ |
| 5 — Wizard UX | L | XS | ~1 สัปดาห์ |
| 6 — Widgets | S | S | ~3-5 วัน |
| 7 — Infrastructure | M | XS | ~4-5 วัน (parallel) |
| 8 — Admin Pages | S | — | TBD |

**รวมประมาณ: 6-8 สัปดาห์**

---

## Recommended Start Order

```
Phase 1 → ทำก่อนเลย (ง่าย + ทุกคนใช้ได้)
Phase 3 → ทำต่อ (B2B moat — สำคัญที่สุด)
Phase 2 → ทำระหว่าง/หลัง Phase 3
Phase 7 → ทำ parallel ตลอด
Phase 4 → หลัง Phase 3 เสร็จ
Phase 5 → ถ้า onboard SME ใหม่
Phase 6 → nice-to-have
Phase 8 → fix เมื่อเจอ issue
```
