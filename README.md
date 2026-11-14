# CivicLens

**Civic Hack 2026 — Future Cities Institute, University of Waterloo**
*Making municipal decisions easier to understand.*

A web app that turns Ontario council agendas, minutes and voting records into plain-language
cards: what's proposed, where it is in the process (staff recommendation → committee → council),
how members voted, and how to have a say — with a link to the official source on every item.

**Independent project. Not affiliated with any municipality.** No city logos, crests or flag artwork are used.

## Start here

[Local setup](docs/setup/SETUP.md) · [Mobile app](apps/mobile/README.md) ·
[Documentation index](docs/README.md) · [All nine prompts](prompts/README.md) ·
[Contributing](.github/CONTRIBUTING.md)

## Repository map

```text
CIVIC-Hacks/
├── src/                 Next.js website, public API and municipal adapters
├── public/              Website images and assets
├── apps/mobile/         Expo / React Native app
├── packages/shared/     Shared types and deterministic resident-facing rules
├── tests/               Unit and fixture tests
├── fixtures/            Saved official responses used by tests
├── scripts/             Environment, ingestion and source-link tools
├── docs/                Setup, architecture, quality, hackathon and archive
├── prompts/             Original project prompts, index and integrity manifest
└── .github/             Contributor guide and pull request template
```

Run npm commands from this directory. The website remains at the repository root;
the mobile app and shared package use npm workspaces and one root lockfile.
Dependencies and generated builds are installed locally and excluded from Git.

---

## What it does

- **Eight cities**: Ottawa, Toronto, Hamilton, Kingston, Brampton, Kitchener, Guelph, Mississauga.
  Pick one with the searchable municipality picker at the top-left of every page (remembered on
  the device and kept in the URL, so links are shareable).
- **"What's happening near you"** feed: Upcoming, Past, or both at once (combined list,
  upcoming soonest-first then past newest-first, badged *Upcoming* / *Decided* / *Deferred*).
  Filter by priorities (housing, transit, parks, budget, safety), decision stage, and title search.
- **Readable items**: plain-language title first; official codes (e.g. `GIC 26-013`, `2026.CC12.4`)
  shown small as "Item ID"; human dates ("Wed, Nov 18, 2026"); acronyms expanded on hover.
- **Decision stages are always labelled**: Staff recommendation / Committee decision (not final) /
  Council decision / Board decision / Mayoral decision. Amendments are labelled as amendments.
- **Recorded votes** with For / Against / Absent member lists (text + icon, never colour alone),
  and **"No recorded vote"** when a decision has no named vote — never implied unanimity.
- **How to have your say**: only links the official page exposes, plus each city's official guide.
  **No deadline is ever calculated from a meeting date.**
- **Dark mode** (follows the system, user can override, remembered), WCAG 2.1 AA contrast in both themes.
- Account-free public navigation. Legacy Supabase account routes remain in the source;
  email alerts and daily digests are unavailable.

---

## Running locally

Use Node 24.3+ LTS for the combined website/mobile workspace (tested: 24.22.3).

```bash
npm ci               # installs the website and both workspaces from the lockfile
npm run dev          # → http://localhost:3000
npm test             # unit + fixture tests (no network)
npm run lint
npm run build
npm run doctor       # optional legacy Supabase environment checks
npm run check-links  # verify every official URL we link to
```

See [local setup](docs/setup/SETUP.md) for optional backend configuration. The public feed works without Supabase:
data is fetched live from official sources and cached in memory for 15 minutes.

### Refreshing data (per city)

```bash
# Warm the cache (and, with SUPABASE_SERVICE_ROLE_KEY set, upsert into agenda_items)
curl "http://localhost:3000/api/ingest?city=hamilton"
curl "http://localhost:3000/api/ingest?city=kingston"
curl "http://localhost:3000/api/ingest?city=all"      # every city, one after another
curl "http://localhost:3000/api/ingest"               # Toronto only (original behaviour)
npm run ingest                                        # Toronto → Supabase, standalone script
```

In production the route requires `Authorization: Bearer $CRON_SECRET`.

---

## Data sources per city

| City | Agendas | Recorded votes | Notes |
|---|---|---|---|
| Ottawa | [eSCRIBE portal](https://pub-ottawa.escribemeetings.com/MeetingsCalendarView.aspx) | eSCRIBE HTML minutes | Most motions carried without a named vote |
| Toronto | — (TMMIS blocked, 403) | [Toronto Open Data voting record](https://open.toronto.ca/dataset/members-of-toronto-city-council-voting-record/) | Items appear only after a recorded vote |
| Hamilton | [eSCRIBE portal](https://pub-hamilton.escribemeetings.com/MeetingsCalendarView.aspx) | **Not available** | Minutes are PDF/Word attachments behind a Cloudflare challenge (403); not worked around |
| Kingston | [eSCRIBE portal](https://pub-cityofkingston.escribemeetings.com/MeetingsCalendarView.aspx) | [Council Voting Records](https://opendatakingston.cityofkingston.ca/datasets/council-voting-records) + [Mayoral Decision Registry](https://opendatakingston.cityofkingston.ca/datasets/mayoral-decision-registry) | Open Data Kingston (ArcGIS) |
| Brampton | [eSCRIBE portal](https://pub-brampton.escribemeetings.com/MeetingsCalendarView.aspx) | eSCRIBE HTML minutes | |
| Kitchener | [eSCRIBE portal](https://pub-kitchener.escribemeetings.com/MeetingsCalendarView.aspx) | eSCRIBE HTML minutes | |
| Guelph | [eSCRIBE portal](https://pub-guelph.escribemeetings.com/MeetingsCalendarView.aspx) | eSCRIBE HTML minutes | Electronic voting: most motions list each member |
| Mississauga | [eSCRIBE portal](https://pub-mississauga.escribemeetings.com/MeetingsCalendarView.aspx) | eSCRIBE HTML minutes | Portal very slow on 2026-11-13 (see limitations) |

One eSCRIBE adapter serves seven cities (rule 14). Endpoint details, robots.txt checks and
fixtures are in [adapter documentation](docs/architecture/ADAPTERS.md). Adding another eSCRIBE city is one entry in `src/lib/cities.ts`.

### Demo-ready items (live data, 2026-11-13)

| City | Item | Why it's a good demo | Source |
|---|---|---|---|
| Kingston | Interim Woodland Preservation By-Law Exemptions | Split recorded vote, 12–1 | [Council Voting Records](https://opendatakingston.cityofkingston.ca/datasets/council-voting-records) |
| Kingston | Options for Closed Meeting Investigator – Option 2 | Split vote 8–4; one of several option votes | same dataset |
| Kingston | Application for Minor Variance and Consent – 15 Aragon Road and 1225 Allen Point Drive | Upcoming, board badge | [Agenda item](https://pub-cityofkingston.escribemeetings.com/Meeting.aspx?Id=a61a6752-80eb-4069-a8d6-651eeae4058d&Agenda=Agenda&lang=English&Item=16) |
| Hamilton | Lobbyist Registrar Inquiry Report respecting Crosswalk Communities | Code `LRI-2026-003` moved to Item ID; "No recorded vote" | [Agenda item](https://pub-hamilton.escribemeetings.com/Meeting.aspx?Id=185693f5-0e68-43aa-a90f-1ceb3c732ddc&Agenda=Merged&lang=English&Item=17) |
| Hamilton | Resignation from the Hamilton Public Library Board and the Board of Health | Code `FCS26076` → plain title | [Agenda item](https://pub-hamilton.escribemeetings.com/Meeting.aspx?Id=185693f5-0e68-43aa-a90f-1ceb3c732ddc&Agenda=Merged&lang=English&Item=18) |
| Hamilton | Council Membership on Standing Committees … 2026–2030 Term | Upcoming council item (Nov 18) | [Agenda item](https://pub-hamilton.escribemeetings.com/Meeting.aspx?Id=3972eb0a-eba9-4bd9-97a3-0bbec4cfe93c&Agenda=Agenda&lang=English&Item=16) |
| Guelph | Decision Report, 210, 214 and 222 College Avenue East (OPA + ZBA) | Split recorded vote 7–3 | [Minutes](https://pub-guelph.escribemeetings.com/Meeting.aspx?Id=75074b1f-18c2-4e7b-824d-cda2b5004859&Agenda=PostMinutes&lang=English&Item=29) |
| Ottawa | Eastern Bridge Project | Recorded vote 23–2 with names | Ottawa minutes, Sep 9, 2026 |

---

## Design tokens

All colours are CSS variables in `src/app/globals.css` (`:root`, plus dark values under
`prefers-color-scheme: dark` and `[data-theme="dark"]`). Nothing else defines hex colours;
Tailwind's `white`, `gray-*`, `brand-*`, `accent-*` and `red-*` utilities are mapped to these tokens.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand-blue` | `#004890` | — | Primary hue: header band, primary buttons |
| `--brand-green` | `#00A78D` | — | Accent hue: decoration, large text only (fails AA for small text on white) |
| `--brand-white` | `#FFFFFF` | — | Text on blue |
| `--primary` | `#004890` | `#8cc4f5` | Links, headings accents |
| `--accent-text` | `#006b5b` | `#45d6bb` | Green small text ("Upcoming", "For") |
| `--fill-primary` | `#004890` | `#1b5e9f` | Button backgrounds |
| `--focus` | `#007a66` | `#45d6bb` | Focus ring (≥ 3:1 on every surface) |
| `--bg` / `--card` | `#f5f8fb` / `#fff` | `#0b1622` / `#112233` | Page / cards |
| `--ink` / `--ink-soft` | `#12304a` / `#435b6d` | `#e6eef6` / `#a9bacb` | Text |

`tests/contrast.test.mjs` checks 23 text/background pairs against WCAG AA in both themes.
Theme choice: `localStorage["civiclens.theme"]`, applied before first paint by an inline script.
Logo and favicon (`src/app/icon.svg`) are an original lens mark, not a city emblem.

---

## Key rules

1. Every item shows its source link and when we last checked it.
2. Staff recommendation, committee decision and council decision are never conflated.
3. A recorded vote on an amendment is labelled as an amendment.
4. Missing vote ≠ no decision: the UI says "No recorded vote".
5. Deadlines are never inferred from meeting dates.
6. No AI-written text. Summaries are the first lines of the official agenda text.
7. Committee of Adjustment owner/applicant/agent names are stripped from descriptions.

---

## Known limitations

- **Hamilton votes**: unavailable (PDF minutes behind a bot challenge). Agendas only.
- **Mississauga**: its calendar API took 20–35 s per request and returned some HTTP 500s on
  2026-11-13. The first load can time out ("Couldn't load Mississauga data. Try again").
- **Toronto**: only items with a recorded vote (open data); upcoming agendas are blocked (403).
  The adapter reads the latest 1,000 vote rows, so the member list for the oldest item may be
  partial; the page says so when names don't add up to the published tally.
- **Coverage window**: about 75 days back and 60 days ahead; up to 8 upcoming and 6 past
  meetings per city. First load per city takes ~4–8 s (polite request pacing), then 15 min cache.
- **Votes are not stored in Supabase yet**; they're read live from the source.
- **Kingston** voting records have no per-vote URL; items link to the dataset and the
  council meeting on the same date.
- Topic matching uses keywords in titles and descriptions; it can miss items.
- After the October 2026 municipal election, November agendas are mostly inaugural/organizational.

See [known limitations](docs/quality/LIMITATIONS.md) for the full list.

---

## Architecture

```
Next.js App Router (TypeScript + Tailwind v4, lucide-react icons)
  ├─ /                → hero, "get started" form (city, priorities, past/upcoming)
  ├─ /feed            → city feed with filters (server-rendered, streamed)
  ├─ /item/[id]       → stage, recorded votes, summary, how to have your say
  ├─ /sources         → sources per city, last verified
  ├─ /quiz            → redirects old links to /feed
  ├─ /auth/*, /account → legacy Supabase routes (not in public navigation)
  ├─ /api/mobile/items → public read-only API for the mobile app
  └─ /api/ingest      → per-city refresh (?city=…|all)

src/lib/
  ├─ cities.ts                     ← city registry (one entry per city)
  ├─ city-data.ts                  ← fetchCityItems / findItem for any city
  ├─ item-display.ts               ← stage/status badges, past/upcoming, dates
  ├─ adapters/escribe.ts           ← eSCRIBE platform adapter (7 cities)
  ├─ adapters/escribe-minutes.ts   ← agenda/minutes/vote parsing (pure)
  ├─ adapters/kingston-opendata.ts ← Open Data Kingston (ArcGIS)
  ├─ adapters/toronto-opendata.ts  ← Toronto CKAN
  └─ adapters/http.ts              ← polite fetch: UA, per-host queue, timeout, cache
```

---

## Sample data notice

The feed shows real council data from official sources. No mock or invented data is used in the
core flow. Fixtures in `fixtures/` are real saved responses used only by tests.

## Licence

MIT (code). Data from Toronto Open Data under the Open Government Licence – Toronto, and from
Open Data Kingston under the City of Kingston Open Data Licence.

## Native mobile app (Expo)

The Next.js website stays at the repository root. `apps/mobile` adds an account-free
Expo/React Native app using the same municipal adapters through public read-only
`/api/mobile/items` routes. `packages/shared` exposes the existing business rules.
Use Node 24.3+ LTS for the combined workspace (tested: 24.22.3).

```sh
npm install
npm run dev                # terminal 1: existing website/API on port 3000
npm run mobile             # terminal 2: Expo QR code / native dev server
# Optional explicit browser preview:
npm run web --workspace @civiclens/mobile -- --port 8081
```

Phone setup needs `apps/mobile/.env.local` with `EXPO_PUBLIC_API_URL` set to your
computer's LAN address or a deployed HTTPS site; localhost on a phone is the phone.
No Supabase/account or privileged app key is needed.

The native UI, saved snapshots and Civi are implemented and iOS/Android bundles
compile. Actual phone/simulator interactions remain unverified on this machine.
See [mobile instructions](apps/mobile/README.md), [architecture and feature status](docs/architecture/mobile-architecture.md),
and [verification log](docs/quality/mobile-testing.md) before recording a demo.
