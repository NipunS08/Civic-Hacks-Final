# HANDOFF.md — CivicLens: Everything You Need to Know

> [Documentation index](../README.md) · Historical snapshot: feature descriptions and old file paths are retained as originally recorded.

> Last updated: 2026-11-12. Use this as your single reference for the current state of the project.

---

## TL;DR

The app **builds and runs locally right now** with zero setup beyond `npm install`.
The public feed loads **real Ottawa council data** from the city's eScribe meeting portal — including UPCOMING meetings open for public participation.
Toronto (past voting records) is available as a secondary city via a dropdown toggle.
Auth, accounts, and alerts need a free Supabase project (15-minute setup, see below).

---

## What Was Built (and What Files Are Where)

### The App — Next.js pages

| URL | File | What it does |
|-----|------|-------------|
| `/` | `src/app/page.tsx` | Landing page, feature cards, links to feed/signup |
| `/feed` | `src/app/feed/page.tsx` | **Ottawa upcoming items (default) + Toronto past votes toggle** |
| `/item/[itemNumber]` | `src/app/item/[itemNumber]/page.tsx` | Item detail + **Say-Window** + participation instructions |
| `/auth/signup` | `src/app/auth/signup/page.tsx` | Email + password signup via Supabase Auth |
| `/auth/login` | `src/app/auth/login/page.tsx` | Login form |
| `/auth/reset` | `src/app/auth/reset/page.tsx` | Password reset email |
| `/auth/verify` | `src/app/auth/verify/page.tsx` | Email verification callback |
| `/account` | `src/app/account/page.tsx` | Alert prefs, ward/topic filters, data export/delete |
| `/sources` | `src/app/sources/page.tsx` | Full data transparency page — Ottawa primary, Toronto secondary |
| `/privacy` | `src/app/privacy/page.tsx` | CASL/PIPEDA privacy notice |
| `/api/ingest` | `src/app/api/ingest/route.ts` | Fetches Toronto data into Supabase (GET endpoint) |
| `/api/auth/signout` | `src/app/api/auth/signout/route.ts` | Signs the user out |

### Core Libraries (`src/lib/`)

| File | What it does |
|------|-------------|
| `adapters/escribe.ts` | **PRIMARY data source.** Fetches Ottawa upcoming meetings + agenda items from eScribe portal. See below for API details. |
| `adapters/toronto-opendata.ts` | **Secondary data source.** Fetches Toronto past voting records from CKAN API. |
| `alerts/channel.ts` | Alert channel interface. Console in dev, Resend in prod. `sendAlert()` with retry. |
| `db/schema.sql` | Full Postgres schema. Run this once in Supabase's SQL editor. |
| `db/supabase.ts` | Supabase client (lazy init, works without credentials at build time) |
| `db/supabase-server.ts` | Server-side Supabase client (reads cookies for session) |

### Reusable UI Components (`src/components/`)

| File | What it does |
|------|-------------|
| `ui/SourceLink.tsx` | **Required on every item card.** Shows "Source: [name] · Last checked: [time]" |
| `ui/SayWindow.tsx` | **The differentiating feature.** Stage pipeline, influence badge, countdown |
| `ui/ItemCard.tsx` | Item card for the feed (title, stage badge, committee, SourceLink) |
| `layout/Navbar.tsx` | Top nav — shows Log in/Sign up or Account/Sign out depending on auth state |

### Scripts (`scripts/`)

| Command | What it does |
|---------|-------------|
| `npm run doctor` | Checks Node version, env vars, CKAN reachability, Supabase reachability (8/8 pass) |
| `npm run check-links` | Requests all 9 source URLs; exits non-zero if any fail (9/9 pass as of 2026-11-12) |
| `npm run doctor` | 8/8 checks pass once `.env.local` is filled in. Sends `apikey` header to Supabase (required for new key format). |
| `npm run ingest` | Standalone script: fetches Toronto data and upserts into Supabase |
| `npm run dev` | Start local dev server → http://localhost:3000 |
| `npm run build` | Production build (passes clean) |

### Types (`src/types/index.ts`)

All the data shapes: `Meeting`, `AgendaItem`, `Participation`, `VoteRecord`, `Profile`, `AlertPreference`, etc. Every type that shows to a user has `source_url` and `retrieved_at` as required fields.

### Docs

| File | For |
|------|-----|
| `SETUP.md` | Exact steps to set up Supabase + Resend |
| `ADAPTERS.md` | Ottawa eScribe + Toronto CKAN endpoints, response shapes, what's blocked |
| `ARCHITECTURE.md` | Why each tech choice was made, scalability notes |
| `CODE_WALKTHROUGH.md` | Every module explained in plain English (for judges) |
| `LIMITATIONS.md` | Data gaps, security assumptions, what's not built |
| `CREDITS.md` | All libraries, open data licences, AI usage disclosure |
| `docs/UML.md` | 5 Mermaid diagrams (use case, component, 2 sequences, ER) |
| `docs/MUNICIPAL_READINESS_REPORT.md` | One-pager for judges |
| `docs/DEMO_SCRIPT.md` | 3-minute demo script |
| `docs/WORKSHOP_QUESTIONS.md` | 11 questions for municipal staff |

---

## The Data Situation (Critical to Understand)

### Ottawa — PRIMARY city

Ottawa uses **eScribe** (pub-ottawa.escribemeetings.com) for its meeting management portal.

**How the API was discovered (2026-11-12):**
1. Fetched the calendar page HTML and found this in the JavaScript:
   ```
   data: "{'calendarStartDate':'" + info.startStr + "','calendarEndDate':'" + info.endStr + "'}",
   url: "/MeetingsCalendarView.aspx/GetCalendarMeetings"
   ```
2. Confirmed with a manual POST — 27 meetings returned for Nov–Dec 2026.
3. For agenda items: fetched the meeting HTML page, parsed `AgendaItemTitle` elements + inline `PublicCommentSettings` JSON.

**What actually works:**
- `POST /MeetingsCalendarView.aspx/GetCalendarMeetings` → 27 meetings for Nov–Dec 2026
  - Fields: meeting type, date, location, HasAgenda, AllowPublicComments, DelegationRequestLink
- `GET /Meeting.aspx?Id={uuid}&Agenda=Agenda&lang=English` → HTML with agenda items
  - Committee of Adjustment Panel 1 (Nov 18, 2026) has 4 real planning applications:
    - "292 Lyon (Ward 14 - Somerset)"
    - "319 Selby (Ward 15 - Kitchissippi)"
    - "563 Churchill (Ward 15 - Kitchissippi)"
    - "319 Spartan (Ward 12 - Rideau-Vanier)"

**robots.txt:** Only blocks `PetalBot`. Automated access permitted. Confirmed 2026-11-12.

**Participation rules (inferred — labeled in UI):**
- Committee of Adjustment: Ontario Planning Act s.45(5)-(6) — anyone may appear, written comments until hearing start
- City Council/Committee: Ottawa By-law 2016-377 s.70 — delegation requests due 3pm business day before

### Toronto — SECONDARY city (past decisions only)

Toronto CKAN datasets are freely accessible but only contain past data:
- Meeting Schedule: most recent entry is 2026-11-10 — **zero future-dated meetings** in this dataset
- Voting Records: 46,815 rows, only appear after a vote is recorded

**The feed's Toronto tab shows recent voted-on items — not upcoming.**

### What the feed shows

| Feature | Ottawa | Toronto |
|---------|--------|---------|
| Upcoming meetings | Real data (eScribe calendar) | Not available in open data |
| Agenda item titles | Real data (HTML parse) | Real data (CKAN voting records) |
| Ward per item | Extracted from title text | Not in CKAN |
| Voting outcomes | Not yet (future meetings) | Real data (CKAN) |
| Item descriptions | eScribe doesn't expose via GET | Not in CKAN |
| Participation deadlines | Inferred from by-laws | Inferred from by-laws |

---

## What You Need to Do Next

### Priority 1 — Set up Supabase (15 min, do this first)

Without this, accounts, login, and alerts don't work. The feed still works without it.

1. Go to [supabase.com](https://supabase.com), create a free account
2. Click **New Project** → name it `civiclens` → choose **ca-central-1** region (Canada) → set any database password
3. Wait ~2 minutes for it to provision
4. Go to **Settings → API**, copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (another `eyJ...` — keep this private)
5. Copy `.env.example` to `.env.local` and fill in those three values
6. In the Supabase dashboard: **SQL Editor → New query** → paste the entire contents of `src/lib/db/schema.sql` → click Run
7. Run `npm run doctor` — all checks should pass

### Priority 2 — Verify the app works end-to-end

```bash
npm run dev
```

Then open `http://localhost:3000` and check:
- `/feed` loads real Ottawa upcoming items (works immediately, no Supabase needed)
- Use the municipality dropdown to switch to Toronto past votes
- `/auth/signup` → create an account → check email → verify → lands on `/account`
- `/account` → turn on email alerts → save

### Priority 3 — Email alerts (optional for demo)

Alerts print to the **terminal** in dev mode (no setup needed — look for the `=== CivicLens Alert ===` block in the console).

For real email:
1. Sign up at [resend.com](https://resend.com) (free: 3,000 emails/month)
2. Create an API key
3. Add to `.env.local`: `RESEND_API_KEY=re_xxxxx` and `EMAIL_FROM=CivicLens <noreply@yourdomain.com>`

### Priority 4 — Run before the demo

```bash
npm run check-links  # verify all source URLs still work (9/9 as of 2026-11-12)
npm run doctor       # verify environment is healthy
```

---

## What's NOT Built Yet

| Feature | Why not built | How to build it |
|---------|--------------|-----------------|
| Alert dispatch cron job | Architecture + preferences are built; dispatch job not wired | Add `scripts/dispatch-alerts.ts` querying `agenda_items` for approaching deadlines, matching against `alert_preferences`, calling `sendAlert()` |
| Personalized feed filtering | Prefs are saved; feed doesn't query them yet | In `feed/page.tsx`, filter items by user's ward + topics after getting session |
| Map / "near me" | Ward extracted from Ottawa titles; no geocoding yet | Geocode the extracted address text; add a Leaflet/MapLibre map |
| Tests | Fixtures saved, harness not written | Use Vitest with the fixture JSON files in `fixtures/` |
| Other eScribe cities | Only Ottawa registered; adapter works for all | Change `ESCRIBE_BASE` in `escribe.ts` for London, Brampton, Mississauga, etc. |
| RSS/iCal feed | No time | Add `/api/feed.rss` route using the adapter data |
| Telegram/Bluesky alerts | No time | Implement `Channel` interface, register in `getChannel()` |

---

## Git History

```
b3f5891  Milestone (j): Ottawa eScribe adapter — primary city with real upcoming meetings
d6508da  Update PROGRESS.md: milestones (a-i) all complete
4faaae2  Milestone (i): architecture docs, UML, deliverables, build fixes
a222add  Milestone (a-h): scaffold, Toronto adapter, public feed, auth, alerts, docs
```

Four commits. No remote pushes. Push yourself when ready: `git push origin main`.

---

## Things to Know for Judge Questions

**"How do you know the item's stage?"**
> For Ottawa, we infer it from the meeting type (Committee of Adjustment → "committee", City Council → "city_council") and whether the meeting has passed (→ "decided"). For Toronto, we infer it from the committee name in the voting record. All stage inferences are labeled as such. Source links go to the official portal where you can confirm.

**"Why don't you show the full agenda text?"**
> Ottawa's eScribe portal renders agenda items as HTML but doesn't expose a JSON API for item text — we get titles only. Toronto's TMMIS portal (secure.toronto.ca) blocks all automated requests with Akamai WAF. In both cases we link users directly to the official page instead of making up text.

**"How does it scale to other cities?"**
> Platform adapter pattern. `escribe.ts` is ~270 lines and implements `fetchMeetings()` and `fetchAgendaItems()`. Switching to London or Brampton is one line: change `ESCRIBE_BASE`. The eScribe API surface is identical across all municipalities using the platform. Adding CivicWeb (another common Ontario platform) means one new adapter file.

**"Why Ottawa instead of Toronto for upcoming items?"**
> Toronto's open data only shows items after a vote has been recorded — there are literally zero future-dated entries in the meeting schedule dataset as of November 2026. Ottawa publishes its full meeting calendar via eScribe with live agenda items. We went where the data actually is, not where we wished it was.

**"Is this AI-generated code?"**
> Yes, primarily. An AI coding assistant wrote the code. I directed the architecture decisions, investigated the actual APIs, verified the data sources work, reviewed the output, and can explain every module (see CODE_WALKTHROUGH.md). The CREDITS.md file discloses this fully.

**"What data are you collecting about users?"**
> Email address (required, for auth and alerts). Optional location → converted to a geographic point (lat/lng) and ward number; the raw address text is never stored. That's it. Full privacy notice at `/privacy`.

---

## File Map (Quick Reference)

```
civic-hack/
├── src/
│   ├── app/
│   │   ├── page.tsx                  ← landing
│   │   ├── feed/page.tsx             ← Ottawa upcoming (default) + Toronto toggle
│   │   ├── item/[itemNumber]/page.tsx ← detail + Say-Window
│   │   ├── auth/{signup,login,reset,verify}/page.tsx
│   │   ├── account/page.tsx          ← alert prefs
│   │   ├── sources/page.tsx          ← data transparency (Ottawa primary)
│   │   ├── privacy/page.tsx          ← privacy notice
│   │   └── api/{ingest,auth/signout}/route.ts
│   ├── components/
│   │   ├── ui/{SourceLink,SayWindow,ItemCard}.tsx
│   │   └── layout/Navbar.tsx
│   ├── lib/
│   │   ├── adapters/escribe.ts           ← PRIMARY: Ottawa eScribe
│   │   ├── adapters/toronto-opendata.ts  ← SECONDARY: Toronto CKAN
│   │   ├── alerts/channel.ts            ← alert system
│   │   └── db/{schema.sql,supabase.ts,supabase-server.ts}
│   ├── types/index.ts                ← all data shapes
│   └── proxy.ts                      ← session refresh (Next.js 16 middleware)
├── scripts/
│   ├── doctor.ts                     ← npm run doctor
│   ├── check-links.ts                ← npm run check-links (9/9 pass)
│   └── ingest.ts                     ← npm run ingest
├── fixtures/
│   ├── toronto-meetings-sample.json      ← real CKAN response saved 2026-11-13
│   ├── toronto-votes-sample.json         ← real CKAN response saved 2026-11-13
│   ├── ottawa-meetings-sample.json       ← real eScribe response saved 2026-11-12
│   └── ottawa-coa-panel1-sample.json     ← COA Panel 1 agenda items, 2026-11-12
├── docs/
│   ├── UML.md                        ← 5 Mermaid diagrams
│   ├── MUNICIPAL_READINESS_REPORT.md ← one-pager for judges
│   ├── DEMO_SCRIPT.md                ← 3-minute script
│   └── WORKSHOP_QUESTIONS.md         ← questions for city staff
├── SETUP.md                          ← step-by-step setup
├── ADAPTERS.md                       ← Ottawa eScribe + Toronto CKAN docs
├── ARCHITECTURE.md                   ← design decisions
├── CODE_WALKTHROUGH.md               ← plain-English module explanations
├── LIMITATIONS.md                    ← honest list of what doesn't work
├── CREDITS.md                        ← libraries + AI usage
├── PROGRESS.md                       ← build status
├── .env.example                      ← copy to .env.local
└── package.json                      ← scripts: dev, build, doctor, check-links, ingest
```
