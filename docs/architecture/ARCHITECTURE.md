# ARCHITECTURE.md — CivicLens Design Decisions

> [Documentation index](../README.md)

## Why these choices?

### Next.js App Router + TypeScript
**Why**: One language across the entire project (frontend, API routes, ingestion scripts).
No Python/Ruby split means judges can read the whole codebase, and Vercel deploys everything
from one repo.  
**Tradeoff**: Next.js App Router is newer and had some rough edges (the `cacheComponents`/`revalidate`
incompatibility we hit). Mitigation: use `fetch()` cache headers at the adapter level instead of
route-level ISR.

### Supabase (Postgres + Auth)
**Why**: Free tier handles the hackathon scale. Auth is a solved problem — do not hand-roll it.
Row-Level Security policies mean the database enforces the access rules even if a bug in the
application layer would otherwise expose another user's data.  
**Tradeoff**: Supabase free tier suspends after 1 week of inactivity. For production: upgrade to Pro
($25/month) or migrate to a managed Postgres with a separate auth provider.

### Platform Adapters (not per-city scrapers)
**Why**: Ontario has 400+ municipalities. If each one requires a custom scraper, the app doesn't
scale. An adapter abstracts the data-fetching logic behind a standard interface
(`fetchMeetings`, `fetchAgendaItems`). Adding eScribe (Brampton, Ottawa) means one new file,
not modifying all existing code.  
**How it scales**: Register new adapters in a municipality lookup table. The feed, alerts, and
Say-Window are all adapter-agnostic.

### Toronto Open Data (CKAN) as primary source
**Why**: Freely accessible, no scraping, stable API, Open Government Licence.  
**Limitation**: The CKAN datasets are updated after meetings, not before them. Full agenda text
is not in the open data. We document this clearly and link to the TMMIS portal for full details.

### Say-Window as the differentiating feature
**Why**: The challenge asked "how can residents know when they can have a say?" Existing civic
tools show decisions; CivicLens shows the *window* and *how much influence remains*.  
**Data source**: Toronto Municipal Code, Chapter 27 (Procedure By-law). We label this clearly as
an assumption because the actual stage of an item can only be confirmed by checking TMMIS.

### Console email in dev, Resend in production
**Why**: Avoids a hard dependency on a paid service during development. The `Channel` interface
makes swapping trivial — the alert formatting and retry logic are identical in both modes.

---

## Scalability to more municipalities

```
Municipality table
  └─ platform: "toronto-opendata" | "escribe" | "civicweb" | "legistar"

Platform adapter registry (in /api/ingest)
  "toronto-opendata" → src/lib/adapters/toronto-opendata.ts
  "escribe"          → src/lib/adapters/escribe.ts         ← not built yet
  "civicweb"         → src/lib/adapters/civicweb.ts        ← not built yet
```

Adding a new municipality:
1. Add a row to the `municipalities` table.
2. If it uses an existing platform (eScribe, CivicWeb), register the municipality's
   portal URL — no new code needed.
3. If it's a new platform, write one adapter module (~100 lines) and register it.

The public feed, item detail, Say-Window, and alert system all consume the common
`Meeting` and `AgendaItem` types — they are municipality-agnostic.

---

## Component dependency map

```
Navbar (server, reads cookies)
  └─ createSupabaseServerClient

FeedPage (server, instant=false)
  ├─ fetchAgendaItems() → CKAN API
  └─ ItemCard
       └─ SourceLink  ← required on every card

ItemDetailPage (server, instant=false)
  ├─ fetchAgendaItems() → CKAN API
  ├─ SayWindow
  │    └─ StagePipeline + SourceLink
  └─ ParticipationCard
       └─ SourceLink

AccountPage (server, instant=false)
  ├─ createSupabaseServerClient
  └─ AlertPrefsForm (client, writes to Supabase)

/api/ingest (server, POST)
  └─ ingestToDatabase(supabaseAdmin)
       └─ fetchMeetings() + fetchAgendaItems() → CKAN API
```

---

## Database schema overview

```
municipalities (seed data, platform adapter registry)
meetings       (from CKAN meeting schedule)
agenda_items   (from CKAN voting records; unique per item_number)
participation  (participation methods and deadlines per item)
vote_records   (individual vote outcomes)

--- User tables (all with RLS) ---
profiles           (extends auth.users; ward, coarse location)
alert_preferences  (topics, ward, channels, digest)
channel_consent    (CASL opt-in audit trail)
notification_log   (sent alerts; content_hash deduplication)
```

Row-Level Security ensures `profiles`, `alert_preferences`, `channel_consent`, and
`notification_log` are only accessible to their owner.

---

## Vercel deployment notes

- `/api/ingest`: set as a Vercel Cron (`vercel.json`) every 6 hours.
  Runs in ~10s; well within the 60s Hobby plan limit.
- Environment variables: add all from `.env.local` to Vercel's environment.
- Next.js fetch cache: 15-minute TTL on CKAN requests keeps CKAN load low even without cron.
- Supabase: free tier adequate for demo; upgrade to Pro before public launch.
