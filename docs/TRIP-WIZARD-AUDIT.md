# Trip Wizard — UX/UI & Code Audit

**Scope:** ทุกหน้าใน flow สร้าง/แก้ไข/เผยแพร่ trip
**Date:** 2026-05-01
**Files audited:**
- [app/dashboard/trips/new/page.tsx](../src/app/dashboard/trips/new/page.tsx) — 921 บรรทัด (Step 1+2: scope + basics)
- [app/dashboard/trips/[id]/edit/page.tsx](../src/app/dashboard/trips/[id]/edit/page.tsx) — 818 บรรทัด (Step 3: activities)
- [app/dashboard/trips/[id]/preview/page.tsx](../src/app/dashboard/trips/[id]/preview/page.tsx) — 844 บรรทัด (Step 4: preview/publish)
- [app/dashboard/trips/[id]/manage/page.tsx](../src/app/dashboard/trips/[id]/manage/page.tsx) — 404 บรรทัด (post-publish)

---

## Executive Summary

**Production-readiness:** ⚠️ ยังไม่พร้อม — มี data integrity issue 2-3 จุด และ validation/error-recovery ตื้นเกินไป
**Code quality:** ปานกลาง — pattern ดี ใช้ shared components ครบ แต่ component ใหญ่เกินไป (3 ไฟล์ > 800 lines)
**UX consistency:** ดี — pattern stepper/sticky action bar เหมือนกันทั้ง flow แต่ขาด unsaved-changes guard
**ภาพรวม Effort:** ~6-8 วันทำงาน

---

## 🔴 Critical (must-fix ก่อน production)

### C1. `trips/new` save flow ลบ-แล้วสร้างใหม่ทุก children
[trips/new/page.tsx:511-521](../src/app/dashboard/trips/new/page.tsx#L511-L521)

ทุกครั้งที่ save draft → ลบ airlines/accommodations/contacts ทั้งหมดแล้วสร้างใหม่
- **Impact:** ทุก ID เปลี่ยนทุก save → audit log/changelog เสีย, optimistic update ทำไม่ได้, race condition 2-user, FK relations อื่นถ้ามีจะ orphan
- **Why critical:** กฎ memory "Maintainability + Reporting" require audit logs ที่เชื่อถือได้
- **Fix:** เปลี่ยนเป็น diff-based update (PATCH เฉพาะที่เปลี่ยน) หรือ bulk-replace endpoint ที่ atomic ใน BE
- **Effort:** M (1 วัน)

### C2. N+1 sequential delete loops
[trips/new/page.tsx:514-520](../src/app/dashboard/trips/new/page.tsx#L514-L520)

`for (const a of oldAirlines) await api.delete(...)` × 3 collections
- **Impact:** Trip ใหญ่ (5 segments + 3 hotels + 4 contacts) = 12 sequential roundtrips ก่อน insert → save 5-10s
- **Fix:** `Promise.all()` หรือ bulk-delete endpoint
- **Effort:** S (2 ชม.) แต่ควรทำพร้อม C1 เพราะ refactor save flow ทั้งก้อน

### C3. ไม่มี `beforeunload` / dirty-state guard
ทั้ง 3 หน้า (`new`, `edit`, `preview` แก้ slug)

ปิด tab/refresh/back ระหว่างกรอก → ข้อมูลหาย
- **Impact:** User กรอก wizard 10 นาทีแล้วกด back ทันใจ → หายหมด → user trust ลด
- **Fix:** สร้าง `useUnsavedChanges` hook + `<NavigationGuard>` shared component
- **Effort:** S (4 ชม. รวมทั้ง 3 หน้า)

### C4. `trips/[id]/edit` auto-save แบบ blur ไม่มี optimistic rollback หรือ retry
[trips/[id]/edit/page.tsx:283-296](../src/app/dashboard/trips/[id]/edit/page.tsx#L283-L296)

`updateActivityField` set state ก่อน → call API → ถ้า API fail แค่ toast แต่ state local ยังถูกเปลี่ยนแล้ว
- **Impact:** User เห็นว่าแก้สำเร็จ แต่ DB ไม่เปลี่ยน → กลับมา reload เห็นข้อมูลเก่า → confused, อาจสูญเสียงานเดิม
- **Fix:** ถ้า API fail → revert state, แสดง inline error + retry button หรือ queue ที่ retry อัตโนมัติ
- **Effort:** M (1 วัน — ต้องคิด pattern ทั้ง form)

### C5. URL state — refresh กลางทาง scope หาย
[trips/new/page.tsx:601](../src/app/dashboard/trips/new/page.tsx#L601)

ที่ `?id=xxx` แล้ว refresh → กลับไปหน้าเลือก scope เพราะ state เป็น `useState` ไม่อ่านจาก trip
- **Fix:** load draft → setScope จาก trip.scope ใน useEffect; deep link `?id=xxx&step=basics` ก็ work
- **Effort:** S (2 ชม.)

### C6. `trips/[id]/edit` ไม่มี loading state ตอน save → user double-click เพิ่ม activity
[trips/[id]/edit/page.tsx:248-265](../src/app/dashboard/trips/[id]/edit/page.tsx#L248-L265)

ปุ่ม "เพิ่มกิจกรรม" ไม่ disable ระหว่าง POST → กดเร็ว ๆ ได้ duplicate activities
- **Fix:** เพิ่ม `addingActivity` state, disable ปุ่มระหว่าง POST
- **Effort:** S (30 นาที)

---

## 🟠 High Priority (UX/integrity)

### H1. Validation ตื้นเกินไป — ทั้ง flow
[trips/new/page.tsx:457-469](../src/app/dashboard/trips/new/page.tsx#L457-L469), [trips/[id]/preview/page.tsx:269-275](../src/app/dashboard/trips/[id]/preview/page.tsx#L269-L275)

- `new`: เช็ค required + dates ลำดับ — ขาด: travelersCount > 999, startDate ในอดีต, segment date in range, hotel checkOut > checkIn, phone format, notes length
- `preview`: เช็คแค่ title/destination/days.length/activities — ขาด: ทุก day ต้องมีอย่างน้อย 1 activity, mandatory cover image, segment data complete
- **Fix:** Zod schema 1 ชุด ใช้ทั้ง `new` (ก่อนถัดไป) + `preview` (ก่อนส่งตรวจสอบ) + BE
- **Effort:** M (1 วัน)

### H2. ไฟล์ใหญ่เกินไป — ต้อง decompose
| ไฟล์ | บรรทัด | นับ component sub | ปัญหา |
|---|---|---|---|
| `new/page.tsx` | 921 | TransportSection inline | 14 useState, 5 inline section |
| `edit/page.tsx` | 818 | EmojiPicker + ActivityCard inline | 9 callbacks เรียงกัน, JSX ลึก 7 ระดับ |
| `preview/page.tsx` | 844 | MobilePreview + StatusCard inline | Modal/ConfirmDialog inline |

- **Fix:** แยกเป็น sub-components ในโฟลเดอร์ `_components/` ติดกับ page; รวม useState เป็น reducer
- **Target:** ทุกไฟล์ ≤ 300 บรรทัด
- **Effort:** M-L (1.5 วัน)

### H3. Stepper navigation ไม่ deep-linkable
[trips/new/page.tsx:601](../src/app/dashboard/trips/new/page.tsx#L601), [TripStepperHeader](../src/components/layout/trip-stepper.tsx)

Step 1+2 share URL เดียว, browser back ใช้ไม่ได้, refresh เสีย state
- **Fix:** ใช้ `?step=scope|basics|activities|preview` ใน URL → router-driven navigation, deep-link ได้
- **Effort:** M (4-6 ชม.)

### H4. `preview` slug edit field มีใน state แต่ไม่ใช้
[trips/[id]/preview/page.tsx:147,180](../src/app/dashboard/trips/[id]/preview/page.tsx#L147)

`customSlug` set ตอน load แต่ไม่มี input ให้ user แก้ และไม่ส่งใน publish payload
- **Impact:** Dead state, user เห็น URL preview แต่แก้ไม่ได้ → confusing
- **Fix:** ลบ state ที่ไม่ใช้ หรือเพิ่ม slug editor จริง
- **Effort:** S (1-2 ชม.)

### H5. `edit` "ภาพปกประจำวัน" ใช้ `uploadUrl="/admin/upload"` ต่างจาก `new` ที่ใช้ `/admin/media/upload`
[trips/[id]/edit/page.tsx:686](../src/app/dashboard/trips/[id]/edit/page.tsx#L686)

`new` ใช้ media tracking endpoint, `edit` ใช้ raw upload — ไม่ track media library
- **Impact:** Media library ไม่เจอภาพปกของ day → ลบ trip แล้ว orphan files
- **Fix:** ใช้ `/admin/media/upload?folder=day-covers` ทั้ง 2 ที่
- **Effort:** S (5 นาที)

### H6. `manage` page ไม่ได้ใช้ `TripStepperHeader` หรือ trip context
[trips/[id]/manage/page.tsx:155-173](../src/app/dashboard/trips/[id]/manage/page.tsx#L155-L173)

- ไม่แสดง trip title, ไม่ link กลับ wizard, ดูแยกจาก flow
- ความกว้าง `max-w-4xl` ต่างจาก wizard pages อื่น (`max-w-7xl` ใน edit, `max-w-6xl` ใน preview, full ใน new)
- **Fix:** Decision needed — manage เป็นส่วนหนึ่งของ wizard (มี stepper) หรือเป็น standalone tool? ถ้า standalone ก็ควรมี trip header card บอก context
- **Effort:** S (2-3 ชม.)

### H7. Preview mobile-mockup hardcoded "9:41" + iOS chrome — รู้สึกเป็น mockup
[trips/[id]/preview/page.tsx:370-376](../src/app/dashboard/trips/[id]/preview/page.tsx#L370-L376)

- ดีในแง่ presentation แต่ user อาจคิดว่ามือถือลูกค้าจะเห็นแบบนี้จริง ๆ
- **Fix:** เพิ่ม label เล็ก ๆ ใต้ mockup "ตัวอย่างหน้าตาบนมือถือ" + ไม่ต้อง dynamic clock — ปล่อยเป็น "9:41" (Apple convention) ก็ได้
- **Effort:** XS (10 นาที)

### H8. Critical actions ไม่มี cooldown/confirmation 2-step
[trips/[id]/preview/page.tsx:319,541](../src/app/dashboard/trips/[id]/preview/page.tsx)

- ส่งตรวจสอบ → confirm modal มี ✓
- ยกเลิกเผยแพร่ → ConfirmDialog ✓
- ส่งซ้ำ noti ใน manage → ConfirmDialog ✓
- **แต่:** ไม่มี protection จาก rapid double-submit (เช่น double-click "ส่งตรวจสอบ" ใน modal)
- **Fix:** Disable button + show spinner ระหว่าง action (มีบ้างแต่ไม่ทุกที่)
- **Effort:** S (1 ชม.)

---

## 🟡 Medium Priority (consistency / maintainability)

### M1. Form state ใช้ useState กระจัดกระจาย
[trips/new/page.tsx:160-175](../src/app/dashboard/trips/new/page.tsx) — 14 useState
[trips/[id]/edit/page.tsx:160-186](../src/app/dashboard/trips/[id]/edit/page.tsx) — 9 useState + 3 ref

- **Fix:** รวมเป็น `useReducer` หรือ `react-hook-form` (ที่ project ยังไม่ได้ใช้ — ตัดสินใจก่อน)
- **Effort:** M (1 วัน)

### M2. Shared component candidates
| Inline pattern | ไฟล์ | บรรทัด | ทำเป็น shared? |
|---|---|---|---|
| Language toggle (ไทย/English) | new | 720-729 | `<SegmentedControl>` |
| Removable card (hotel/contact/activity) | ทุกหน้า | หลายที่ | `<RemovableCard>` |
| API error alert inline | new | 902-913 | `<InlineAlert variant="error">` |
| Status banner (warn/info) | new+preview | หลายที่ | `<NoticeBanner>` |
| Mobile mockup frame | preview | 366-490 | `<DevicePreview>` |
| Activity card | edit | 552-674 | `<ActivityEditorCard>` |

- **Fix:** Extract 6 shared components — ใน `components/shared/`
- **Effort:** M (1 วัน)

### M3. Notes textarea ไม่ใช้ FormTextarea
[trips/new/page.tsx:887-893](../src/app/dashboard/trips/new/page.tsx#L887-L893)

ใช้ raw `<textarea>` ทั้ง ๆ ที่ FormTextarea import มาแล้ว (ไม่ — actually ไม่ได้ import)
- **Fix:** Import + ใช้ FormTextarea
- **Effort:** XS (5 นาที)

### M4. Date lock UX ในหน้า new
[trips/new/page.tsx:733-749](../src/app/dashboard/trips/new/page.tsx#L733-L749)

- Lock มี `opacity-60 pointer-events-none` แต่ไม่มี tooltip อธิบาย
- User ใช้สิทธิ์หมดจะงง ไม่รู้ว่าทำไมแก้ไม่ได้
- **Fix:** เพิ่ม `<Tooltip>` shared + link "ติดต่อ admin"
- **Effort:** S (2 ชม.)

### M5. Cover image ไม่ required แต่หน้าเว็บลูกค้าจะดูแย่
[trips/new/page.tsx:700-707](../src/app/dashboard/trips/new/page.tsx#L700-L707), [preview hero:381-409](../src/app/dashboard/trips/[id]/preview/page.tsx#L381-L409)

- Preview มี gradient fallback แต่ดู unprofessional
- **Decision:** soft-required (warn ใน preview validation) หรือ hard-required ใน new?
- **Effort:** S (1 ชม.)

### M6. Hotel "จำนวนคืน" ไม่แสดงผลจริง
[trips/new/page.tsx:828-832](../src/app/dashboard/trips/new/page.tsx#L828-L832)

บอก "จะคำนวณอัตโนมัติ" แต่ไม่แสดงผล user ต้องเดาเอง
- **Fix:** Compute `(checkOut - checkIn) / 86400000` แสดงเป็น "= 3 คืน"
- **Effort:** XS (15 นาที)

### M7. Emergency contact prefill claim — ไม่มี implementation
[trips/new/page.tsx:846-854](../src/app/dashboard/trips/new/page.tsx#L846-L854)

UI banner บอก "จะ pre-fill ตามประเทศปลายทาง" แต่ logic ไม่อยู่
- **Fix:** ตรวจ BE response มี prefill จริงไหม; ถ้าไม่มี → ลบ banner หรือ implement จริง
- **Effort:** S-M (ขึ้นกับ BE)

### M8. `edit` page accommodations panel แสดง check-in/out ตามวัน — ดี แต่ไม่มี link ไปแก้ที่ `new`
[trips/[id]/edit/page.tsx:743-783](../src/app/dashboard/trips/[id]/edit/page.tsx#L743-L783)

User เห็นข้อมูลที่พักผิด → ต้อง back ไป step 2 → flow แตก
- **Fix:** เพิ่มลิงก์ "แก้ไขข้อมูลที่พัก" ใน card → navigate กลับ step 2
- **Effort:** XS (10 นาที)

### M9. Preview validation issues banner — ไม่ link ไปจุดที่ผิด
[trips/[id]/preview/page.tsx:343-360](../src/app/dashboard/trips/[id]/preview/page.tsx#L343-L360)

แสดง "ยังไม่มีกิจกรรมเลย" แต่ไม่ link → user ต้องเดาว่าต้องไปไหน
- **Fix:** แต่ละ issue เป็น link ไปยัง step ที่เกี่ยวข้อง
- **Effort:** S (1 ชม.)

### M10. `manage` tab state ไม่อยู่ใน URL
[trips/[id]/manage/page.tsx:92](../src/app/dashboard/trips/[id]/manage/page.tsx#L92)

`activeTab = "changelog" | "followers"` — refresh กลับไป default, share URL ไม่ระบุ tab
- **Fix:** `useSearchParams` + `router.replace`
- **Effort:** XS (15 นาที)

### M11. `manage` page empty styling differ — ใช้ `slate-*` แทน `(--surface-*)` tokens
[trips/[id]/manage/page.tsx:165,168,317,322](../src/app/dashboard/trips/[id]/manage/page.tsx)

ทั้งไฟล์ใช้ slate-200/500/900 แทน design token — inconsistent กับ wizard pages
- **Fix:** เปลี่ยนเป็น `(--outline-variant)`, `(--on-surface)`, `(--on-surface-variant)`
- **Effort:** S (1 ชม.)

---

## 🟢 Polish

### P1. Accessibility — scope cards ไม่มี focus ring
[trips/new/page.tsx:626-650](../src/app/dashboard/trips/new/page.tsx#L626-L650)

`<button>` ไม่มี `focus-visible:ring-*` → keyboard user มองไม่เห็น focus
- **Effort:** XS (5 นาที)

### P2. `: any` ที่ delete loop
[trips/new/page.tsx:513-519](../src/app/dashboard/trips/new/page.tsx#L513-L519)

`api.get<any[]>` × 3 — ใช้ proper DTO types
- **Effort:** XS (10 นาที)

### P3. `window.history.replaceState` แทน Next.js router
[trips/new/page.tsx:507](../src/app/dashboard/trips/new/page.tsx#L507)

ใช้ `router.replace(?id=xxx, { scroll: false })`
- **Effort:** XS (5 นาที)

### P4. Default 1 hotel/contact entry — บางทริปไม่ต้องการ
[trips/new/page.tsx:170-175](../src/app/dashboard/trips/new/page.tsx)

Default empty array + ปุ่ม dashed add ใหญ่ขึ้น
- **Effort:** XS (10 นาที)

### P5. EmojiPicker ใน edit ใช้ z-index hard-coded `z-30`/`z-40`
[trips/[id]/edit/page.tsx:566-567](../src/app/dashboard/trips/[id]/edit/page.tsx#L566-L567)

ถ้ามี modal/dropdown อื่นอาจซ้อนเสีย
- **Fix:** ใช้ Floating UI / Portal หรือ z-index scale จาก design system
- **Effort:** S (30 นาที)

### P6. `usePageTitle` เปลี่ยนชื่อหลายครั้งระหว่าง load
[trips/[id]/edit/page.tsx:163-164](../src/app/dashboard/trips/[id]/edit/page.tsx#L163-L164)

`usePageTitle(tripTitle ? ... : "แก้ไขทริป")` — title flash จาก default → จริง
- **Fix:** Skip update ตอน loading
- **Effort:** XS (5 นาที)

### P7. Day tabs ไม่มี keyboard navigation (arrow keys)
[trips/[id]/edit/page.tsx:476-502](../src/app/dashboard/trips/[id]/edit/page.tsx#L476-L502)

ARIA tablist pattern ขาด
- **Effort:** S (1 ชม.)

### P8. LINE share template hardcoded — ไม่ customizable
[trips/[id]/preview/page.tsx:246](../src/app/dashboard/trips/[id]/preview/page.tsx#L246)

User อาจอยากเปลี่ยนข้อความ
- **Fix:** Editable textarea + save preference
- **Effort:** M (3 ชม.)

### P9. `manage` resend "ส่งซ้ำให้ผู้ที่ยังไม่อ่าน" — ไม่บอก count ใน label
[trips/[id]/manage/page.tsx:269-276](../src/app/dashboard/trips/[id]/manage/page.tsx#L269-L276)

User กดแล้วถึงรู้ว่าจะส่งกี่คน — ก่อนกดควรเห็นเลย
- **Fix:** Pre-fetch unread count → label "ส่งซ้ำ (3 คน)"
- **Effort:** S (1 ชม.)

### P10. QR download filename ใช้ trip ID 8 ตัว ถ้าไม่มี slug
[trips/[id]/preview/page.tsx:260](../src/app/dashboard/trips/[id]/preview/page.tsx#L260)

Filename `qr-abc123.png` — ไม่ user-friendly
- **Fix:** ใช้ trip title (sanitized) เป็น filename
- **Effort:** XS (10 นาที)

---

## แผนงานแนะนำ — group by theme (ไม่ใช่ตาม page)

### Phase A: Data Integrity & Save Flow (2-3 วัน) 🔴
- C1: refactor `new` save flow → diff-based / bulk endpoint
- C2: parallel deletes (รวมใน C1)
- C4: optimistic update with rollback ใน `edit`
- C6: disable button ระหว่าง add activity
- C5: scope persistence จาก URL/draft
- **Output:** Save flow ที่ทำลาย data ไม่ได้, user trust กลับมา

### Phase B: Validation & Schema (1 วัน) 🔴
- H1: Zod schema สำหรับ trip basics + activities + publish gate
- C3: `useUnsavedChanges` hook ทั้ง 3 หน้า
- M5: cover image required policy
- M9: validation issues link ไปจุดที่ผิด
- **Output:** Type-safe validation ครบ flow

### Phase C: Component Library Expansion (1 วัน) 🟠
- M2: extract 6 shared components (`SegmentedControl`, `RemovableCard`, `InlineAlert`, `NoticeBanner`, `DevicePreview`, `ActivityEditorCard`)
- M3: swap raw textarea → FormTextarea
- M11: replace slate-* → design tokens ใน manage
- **Output:** Reusable kit, file size ลด

### Phase D: Decompose Pages (1.5 วัน) 🟠
- H2: แยก `new`, `edit`, `preview` เป็น sub-components ใน `_components/`
- M1: ใช้ reducer/react-hook-form แทน scattered useState
- **Output:** ทุก page.tsx ≤ 300 บรรทัด

### Phase E: Navigation & Deep-link (0.5 วัน) 🟠
- H3: stepper URL-driven (`?step=`)
- M10: manage tab ใน URL
- H4: ลบหรือ implement slug editor
- **Output:** Browser back/share/refresh ใช้งานได้จริง

### Phase F: Polish & Accessibility (0.5 วัน) 🟢
- P1-P10
- M4, M6, M7, M8, H5, H6, H7, H8

---

## รวม

| Phase | Theme | Effort | Priority |
|---|---|---|---|
| A | Data integrity | 2-3 วัน | 🔴 Must |
| B | Validation + dirty guard | 1 วัน | 🔴 Must |
| C | Shared components | 1 วัน | 🟠 Should |
| D | Decompose | 1.5 วัน | 🟠 Should |
| E | Navigation | 0.5 วัน | 🟠 Should |
| F | Polish | 0.5 วัน | 🟢 Nice |
| **รวม** | | **6.5-7.5 วัน** | |

**Recommended order:** A → B → D → C → E → F
(Decompose ก่อน extract shared components เพราะจะรู้ว่า extract อะไรชัดเจนขึ้น)

**Production-blocker = Phase A + B (~3-4 วัน)** — หลังจากนั้น flow พอใช้ production ได้
