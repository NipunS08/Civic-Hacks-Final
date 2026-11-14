# PROGRESS.md — CivicLens Build Status

> [Documentation index](../README.md) · Historical snapshot: feature descriptions and old file paths are retained as originally recorded.

Last updated: 2026-11-13

---

## Completed Milestones

### (a) Scaffold + SETUP.md + doctor
- Next.js 16.4.6 with TypeScript, Tailwind, App Router
- `SETUP.md` with step-by-step Supabase + Resend setup
- `npm run doctor` script (checks Node version, env vars, CKAN reachability, Supabase connectivity)
- `.env.example` with all required variables and instructions
- `package.json` updated with `doctor`, `check-links`, `ingest` scripts

### (b) Toronto Data Investigation + ADAPTERS.md + Toronto Adapter
- Investigated all Toronto data sources (robots.txt, API endpoints)
- **Working**: Toronto Open Data CKAN API (`datastore_search`)
  - Meeting Schedule: 1,445 records, 2022-2026 term, confirmed through 2026-11-10
  - Voting Records: 46,815 records, agenda item #, title, committee, vote results
- **Blocked (403)**: secure.toronto.ca (TMMIS), app.toronto.ca — documented, not attempted to bypass
- `ADAPTERS.md` written with endpoint details, example requests, response shapes, robots.txt findings
- `fixtures/` directory with 2 real CKAN API responses saved on 2026-11-13
- Toronto Open Data adapter: `src/lib/adapters/toronto-opendata.ts`
  - `fetchMeetings()` — returns upcoming meetings
  - `fetchAgendaItems()` — deduplicates votes into unique items
  - `ingestToDatabase()` — upserts to Supabase
  - Respectful: 500ms rate limit, identifying User-Agent, fetch cache

### (c) Public Feed UI with SourceLink
- `src/components/ui/SourceLink.tsx` — used on every card and detail page
- `src/components/ui/ItemCard.tsx` — shows stage, committee, Say-Window teaser, SourceLink
- `src/app/feed/page.tsx` — live feed of real Toronto items (29+ items loading from CKAN)
- Stage, search, and filter UI on the feed
- Data gap notice explaining what's not available

### (d) Deadline Extraction
- Participation deadlines extracted from Toronto's Procedure By-law (Chapter 27)
- Rule: "12:00 noon on the business day before the meeting" (written comments and deputations)
- Source citation shown on every item detail page
- `src/lib/alerts/channel.ts` — formats alert messages with source links

### (e) Say-Window Item Detail Page
- `src/components/ui/SayWindow.tsx` — full Say-Window with stage pipeline, influence badge, countdown
- `src/app/item/[itemNumber]/page.tsx` — detail page with Say-Window, participation cards, SourceLink
- Procedural stages: committee → city_council → appeal → decided
- ASSUMPTION label on stage derivation (from Procedure By-law)

### (f) Accounts + Auth Pages
- Supabase Auth: sign up, log in, password reset, email verification
- `src/app/auth/` — all 4 auth pages
- `src/app/account/page.tsx` — account settings, alert preferences (CASL opt-in), data export, delete
- `src/lib/db/schema.sql` — full Postgres schema with RLS on all user tables
- Trigger: auto-creates profile row on user signup
- `src/proxy.ts` — session refresh on every request (Next.js 16 "proxy" convention)

### (g) Alert Channel Interface + Console Email
- `src/lib/alerts/channel.ts` — channel interface, `sendAlert()` with retry and back-off
- Channels: `console` (dev) and `email` (Resend when keyed)
- Dev mode: emails print to terminal when RESEND_API_KEY is not set
- Alert message includes SourceLink, unsubscribe link, "AI summary, verify at source" label

### (h) check-links Script + Sources & Data Page
- `scripts/check-links.ts` — verifies all source URLs, exits non-zero on failures
- `npm run check-links` passes 8/8 as of 2026-11-13
- `src/app/sources/page.tsx` — public Sources & Data page with:
  - Each dataset, endpoint, fields, licence, refresh rate
  - Blocked sources list with explanation
  - Known data limitations
  - Robots.txt findings

---

## Partially Complete

### Personalized Feed
- Alert preferences saved to Supabase (ward, topics, channels, digest)
- Needs: query-time filtering of feed items by user preferences
- Needs: alert matching and dispatch job

### Database Ingest
- `npm run ingest` and `/api/ingest` route built
- Needs Supabase credentials to test (see SETUP.md)

---

## Also Completed

### Milestone (i) — Docs, UML, deliverables
- README.md
- ARCHITECTURE.md — design decisions, scalability, component map
- CODE_WALKTHROUGH.md — every module explained in plain English
- CREDITS.md — libraries, open data, AI usage
- LIMITATIONS.md — data gaps, security, privacy, what's not built
- docs/UML.md — use case, component, 2 sequence, ER diagrams (Mermaid)
- docs/MUNICIPAL_READINESS_REPORT.md — one-pager for judges
- docs/DEMO_SCRIPT.md — 3-minute script with Q&A points
- docs/WORKSHOP_QUESTIONS.md — 11 questions for municipal staff

## ⬜ Not Yet Built

### Tests
- Adapter parsing tests (fixtures saved; test harness not written)
- Deadline extraction tests
- Alert matching tests

### Map (location-based filtering)
- Address/ward not available in open data for agenda items
- Leaflet/MapLibre integration planned but skipped — no data to show

### Milestone (j) — Extra channels, polish
- Telegram, Bluesky, RSS
- PWA manifest

---

## Blocked / Needs Developer Action

1. **Supabase setup**: Follow SETUP.md to create a free Supabase project, run the schema,
   and add credentials to `.env.local`. Without this, accounts and the ingest route won't work.
   
2. **Email alerts**: Add `RESEND_API_KEY` to `.env.local` for real email delivery.
   Dev mode prints to console without it.

3. **Verify TMMIS access**: `secure.toronto.ca/council/agenda-item.do` returns 403 from scripts
   but opens in a browser. Source links in CivicLens point there — confirm they work in your browser.

---

## How to Run

```bash
npm run dev          # Start local dev server → http://localhost:3000
npm run doctor       # Health check (Node, env vars, CKAN, Supabase)
npm run check-links  # Verify all source URLs reachable
npm run ingest       # Fetch Toronto data into Supabase (needs credentials)
npm run build        # Production build (passes as of 2026-11-13)
```
