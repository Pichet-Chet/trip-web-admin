# Trip Platform — Roadmap

**Positioning:** Itinerary sharing tool. **No booking, no payment** in our system.
**Users:** (1) Tour operators with their own booking system, (2) B2B groups planning together.
**Differentiator opportunity:** B2B-side group features (expense tracking, roles, communication) — these are absent from competing itinerary tools.

---

## Phase 1 — Foundations (1 week)

Quick wins. High-value-per-day. Ship before anything else.

### 1.1 ICS calendar export — `S` (2-3 hrs)
- "เพิ่มทริปนี้ในปฏิทิน" button on public trip page + preview page
- Generates `.ics` with VEVENT per day (or single event spanning the trip)
- Use case: B2B group members all add to phone calendar, get morning-of reminder
- BE: small endpoint `GET /trips/{slug}/calendar.ics` returns text/calendar
- FE: button + download

### 1.2 PDF itinerary download — `M` (1 day)
- "ดาวน์โหลด PDF" button on public trip + preview
- Server-side generated (better fidelity than browser-print): `puppeteer` or `playwright` headless rendering of a print-styled HTML route
- Layout: cover image → trip info → day-by-day with activities → emergency contacts → notes
- File name: `{trip-title}_{startDate}.pdf`
- Use case: operator emails to client; B2B prints for offline group reference

### 1.3 Pre-trip checklist (structured) — `S-M` (4-6 hrs)
- Convert `importantNotes` (free textarea) → optional structured list `TripChecklistItem { id, label, isRequired, sortOrder }`
- Operator can mark items "essential" (passport/visa) vs "recommended" (warm jacket)
- Followers see checkboxes — local state only, no save needed (UI affordance)
- BE: new table `trip_checklist_items` + bulk-diff endpoint (mirror trip_emergency_contacts pattern)
- FE: section in /trips/new + display on public trip page

**Phase 1 total: ~1 week. After this, the wizard is "ship-able for real itinerary sharing."**

---

## Phase 2 — Visual upgrades (1 week)

Make the public trip page feel professional. Easier marketing pitch.

### 2.1 Map view of activities (route) — `M` (1 day)
- Use Leaflet (free, no API key) or Mapbox (free tier)
- Pull from `activity.mapsLink` to extract lat/lng (parse Google Maps URL → coordinates), or add explicit `lat/lng` fields
- Day view: line connecting activities in order, numbered markers
- "ดูแผนที่" button on each day section in public trip page
- BE: nothing new (lat/lng already on TripActivity), just need parsing helper for mapsLink
- FE: new MapView component (lazy-loaded so it doesn't bloat the bundle for non-map views)

### 2.2 Photo gallery per activity — `M` (1 day)
- Currently `TripActivity.imageUrl` is single URL
- Promote to `imageUrls: string[]` (up to 6 per activity) — schema migration
- Wizard: lift existing ImageUpload to multi-upload list
- Public page: lightbox gallery on click
- Migration: existing single `imageUrl` becomes `imageUrls[0]`

### 2.3 Live updates / Announcements — `S-M` (4-6 hrs)
- New `TripAnnouncement { id, tripId, message, createdAt, isPinned }`
- Operator/leader posts a short message during trip ("ฝนตก เปลี่ยนแผน 14:00 ไปคาเฟ่")
- Triggers same notification path as ChangeLog (LINE/web push to followers)
- Public trip page: pinned banner at top with latest announcement
- Distinct from ChangeLog (which is "I edited the structure"); Announcement is "live message during trip"

**Phase 2 total: ~1 week. After this, public trip pages have "wow factor" parity with travel-influencer tools.**

---

## Phase 3 — B2B differentiation (2 weeks)

The unique-value-prop that no competing itinerary tool has.

### 3.1 Member roles within a group trip — `M` (1 day)
- Each follower can be tagged with a role: `head_of_group` / `expense_keeper` / `driver` / `member` (free-form too)
- Operator/leader assigns from member list
- Public page: shows "นำกลุ่มโดย: …", "ผู้ดูแลค่าใช้จ่าย: …" near top
- BE: new column on `Followers` table or new join table
- FE: small UI in /trips/[id]/manage to assign roles

### 3.2 Group expense tracking — `L` (3-4 days)
**The headline B2B feature.**

Data model:
```
TripExpense {
  id, tripId, paidByFollowerId, amount, currency,
  description, occurredOn (date),
  splitMode: "equal" | "shares" | "exact",
  participants: TripExpenseParticipant[]
}
TripExpenseParticipant {
  expenseId, followerId, share (number — interpreted per splitMode)
}
```

Features:
- "เพิ่มรายจ่าย" affordance for any group member
- Quick-fill: "ค่ารถตู้ 6,000 บาท จ่ายโดยสมชาย แชร์ 4 คน" — system computes 1,500/คน
- Per-person summary: "คุณติดสมชาย 1,500"
- Settlement view: minimum-transactions algorithm to settle the group
  ("Splitwise math": A→B 500, B→C 200 instead of 6 separate IOUs)
- Currency: Each expense in local currency; trip-level base currency for summary
- **Privacy:** expenses visible only to trip members (not public page)

Effort breakdown:
- BE: 2 new tables + CRUD endpoints + settlement algorithm — ~1.5 days
- FE: expense entry UI + per-day list + settlement view — ~1.5-2 days
- Tests: ~0.5 day

### 3.3 Group communication touchpoints — `S-M` (4-6 hrs)
**Don't build full chat — integrate with what groups already use.**

- Operator sets a LINE group invite link / WhatsApp link / Telegram link on the trip
- Public page renders a "เข้าร่วมกลุ่ม LINE" button for followers
- BE: 3 optional fields on TripPlan: `lineGroupUrl`, `whatsappGroupUrl`, `telegramGroupUrl`
- FE: section in wizard Step 1 + display button on public page

Rationale: B2B groups already use LINE. Building a chat in our app would be a distraction; meet them where they are.

**Phase 3 total: ~2 weeks. After this, B2B groups have a real reason to use us over a Notion doc + LINE group.**

---

## Phase 4 — Multi-language activation (3-5 days)

Languages master + flag are already in place. Time to make them do something.

### 4.1 Per-language content layer — `M` (1-1.5 days)
- New table `TripTranslation { tripId, languageCode, field, value }` — sparse storage of translated values
- Fields covered: title, destination, importantNotes, day.title, activity.name/description/placeName
- Trip's primary language is the source of truth; secondary languages are translations
- Operator selects "ภาษาที่รองรับ: th, en, ja" on trip → triggers translation jobs
- Public page renders language switcher chip strip when more than 1 language available

### 4.2 Translation provider — `S` (4-6 hrs)
- DeepL or Google Translate API integration (server-side; user never sees raw API)
- Stored per-language so we don't re-translate every page view (cost + latency)
- Operator sees auto-translated draft, can manually override per field

### 4.3 Followers can pick their preferred language — `S` (4 hrs)
- Persist choice in localStorage + (optional) Follower record
- Default = browser locale matching what's available, else trip's primary

**Phase 4 total: ~1 week. Real multi-language; matches the master table we already shipped.**

---

## Phase 5 — Wizard UX deferred from audits (1 week)

From the wizard usability evaluation. Skip if shipping to professional operators only; do these if broadening to first-time SME users.

### 5.1 Step 1 progressive disclosure — `S` (4 hrs)
- Transport / Hotels / Contacts default-collapsed accordions
- "+ เพิ่มข้อมูลเดินทาง" expands the section

### 5.2 Step 1 auto-save (consistent with Step 2) — `S` (3 hrs)
- Drop the "บันทึกร่าง" button; debounced auto-save on field blur
- Same indicator pill we use on Step 2

### 5.3 Quick activity input — `M` (6-8 hrs)
- Step 2: a single-line "พิมพ์ชื่อกิจกรรม + Enter" creates a new row with default emoji and type
- Card defaults to compact view; click to expand fields

### 5.4 Inline mobile preview drawer — `M` (1 day)
- Slide-out panel on Step 1+2 showing the same MobilePreview from Step 3
- Updates live as user types

### 5.5 Trip templates / clone improvements — `M` (1 day)
- "สร้างจาก template" picker on /trips/new (3-day Bangkok / 5-day Japan / etc.)
- Templates are seeded TripPlan records owned by `Company.Id == TEMPLATE_OWNER`
- Clone flow already exists; surface it from /my-trips trip card overflow menu

### 5.6 Mobile redesign Step 2 — `L` (2 days)
- Day tabs → swipeable carousel
- Activity cards collapsed by default on mobile, full edit in a bottom sheet

**Phase 5 total: ~1 week. Pure UX improvement; no new business value but reduces SME abandonment.**

---

## Phase 6 — Polish & widgets (3-5 days)

### 6.1 Weather forecast — `S` (3-4 hrs)
- OpenWeatherMap free tier → forecast for trip dates
- Show on /trips/[id]/edit DayContextPanel + public trip page day view
- Decay: only show forecast if trip starts within 14 days

### 6.2 Currency converter mini-widget — `S` (3 hrs)
- For `scope === "international"` trips
- Pulls daily rates from a free API (e.g., exchangerate.host) — cache 24h
- Footer of public trip page: "1 THB ≈ 4.2 JPY (today)"

### 6.3 Time zone display — `S` (2 hrs)
- For airline segments crossing time zones
- "BKK 14:00 (UTC+7) → NRT 22:00 (UTC+9)"
- Pure FE: parse airport code → known TZ table

### 6.4 Local emergency hotline quick-call — `XS` (1 hr)
- Public trip page: floating "เบอร์ฉุกเฉิน" button on mobile
- Tap-to-call into the trip's emergency contact list

**Phase 6 total: 2-3 days. Marketing-friendly micro-features.**

---

## Phase 7 — Infrastructure & quality (running in parallel)

Not blocking, but should land before/around production.

### 7.1 E2E tests — `M` (1.5 days)
- Playwright workflow against the dev API
- Cover: create trip → add activity → publish → public page renders → follow → notify
- 5-8 tests is enough; not exhaustive

### 7.2 Auth subscription pattern — `S-M` (4-6 hrs)
- Refactor `lib/auth.ts` to expose `subscribe(callback)` instead of relying on `setInterval(getUser, 100)` polling in /dashboard and /dashboard/layout
- Tracked in audit as a follow-up; small but cleans up multiple consumers

### 7.3 Mobile responsive deep audit — `M` (1 day)
- Walk every page on a 375px viewport, fix overflow / tiny tap targets / horizontal scroll
- Will probably surface issues on /trips/[id]/edit Step 2 specifically

### 7.4 Accessibility scan — `M` (1 day)
- axe-core run against each major page
- Color contrast (we replaced slate-* but didn't verify ratios)
- Screen reader walkthrough of wizard
- Keyboard navigation across all flows

### 7.5 Error boundary + 404/500 pages — `S` (3 hrs)
- Currently a thrown component error blanks the page
- Next.js error boundary at app root + per-route where appropriate
- Custom 404 page (currently default Next.js)

### 7.6 Performance / lighthouse — `M` (1 day)
- Bundle analyzer; remove unused deps
- Image optimization audit
- Lazy-load components below the fold (MobilePreview, MapView when added)

**Phase 7 total: 4-5 days, can run alongside other phases.**

---

## Phase 8 — Other admin pages (deferred — audit-only so far)

These had Tier 3/4 token cleanup but no behavioural audit:

- /dashboard/notifications — review preference UX, channel toggles
- /dashboard/settings — what does this configure exactly?
- /dashboard/billing/profile — tax invoice flow
- /dashboard/upgrade — plan compare, CTA quality
- /dashboard/my-data — PDPA export flow
- /dashboard/feedback — submission UX
- /dashboard/activity — operator activity log audit
- /dashboard/help — content currentness

Audit-only; fix as issues are spotted in real use, not preemptively.

---

## Sequencing

**If shipping ASAP:**
Phase 1 → Phase 2.1 (map) → Phase 2.3 (announcements) → done. ~2 weeks. Skip 2.2 until users ask for it.

**If targeting B2B as primary differentiator:**
Phase 1 → Phase 3 (full B2B suite) → Phase 4 → done. ~4-5 weeks. Compelling story for sales: "no one else does expense tracking inside the itinerary."

**If targeting tour operators as primary:**
Phase 1 → Phase 2 → Phase 4 → Phase 6 → done. ~4 weeks. Polished public trip page is the operator's pitch material to their clients.

**Recommended:** **Phase 1 + Phase 3** in parallel tracks (one dev each). Phase 1 gives universal value fast; Phase 3 builds the moat. Phase 2 + 4 + 6 follow once those land.

---

## Effort summary

| Phase | Total | What you get |
|---|---|---|
| 1 | 1 week | PDF + ICS + structured checklist (universal table-stakes) |
| 2 | 1 week | Map view + photo gallery + live announcements (visual upgrade) |
| 3 | 2 weeks | Member roles + expense tracking + group chat link (B2B moat) |
| 4 | 1 week | Real multi-language for followers |
| 5 | 1 week | Wizard usability for SME first-time users |
| 6 | 3-5 days | Weather/currency/timezone widgets |
| 7 | 4-5 days (parallel) | E2E tests, a11y, perf, error boundaries |
| 8 | TBD | Audit-only, fix as needed |

**Realistic ship date for "complete v1":** 6-8 weeks of solo dev, or 3-4 weeks with parallelism.

---

## Out of scope (intentionally)

These were considered and excluded based on positioning:

- **Booking flow / customer info collection** — not our system; operator's existing booking handles it
- **Pricing breakdown / payment** — same reason
- **Tax invoice / receipt generation per booking** — operator handles
- **Customer reviews** — could fit, but feels like a marketplace feature; revisit if positioning shifts
- **Vendor management (hotels/airlines/ground)** — operator's back-office, not ours
- **Trip P&L reporting** — operator's accounting
- **Marketplace search & filters** — we list trips, but discovery isn't our value-prop yet
