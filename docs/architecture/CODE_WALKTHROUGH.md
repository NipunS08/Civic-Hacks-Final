# CODE_WALKTHROUGH.md — Module-by-Module Explanation

> [Documentation index](../README.md)

This document explains every major module in plain English so the team can answer
judge questions confidently.

---

## `src/types/index.ts`
Defines all the data shapes the app uses: `Meeting`, `AgendaItem`, `Participation`,
`VoteRecord`, `Profile`, `AlertPreference`, etc.

Key rule: every type that touches user-facing data has `source_url` and `retrieved_at`
as required fields. If we can't fill those in, we can't show the item.

The `ItemStage` type (`"committee" | "city_council" | "appeal" | "decided" | "unknown"`)
drives the Say-Window display logic.

---

## `src/lib/db/schema.sql`
The Postgres database schema, run once in Supabase's SQL editor.

Important patterns:
- `meetings` and `agenda_items` have `UNIQUE` constraints so running the ingest twice
  doesn't create duplicate rows — it updates them (upsert).
- Every user table (`profiles`, `alert_preferences`, etc.) has `ENABLE ROW LEVEL SECURITY`
  and a policy that checks `auth.uid() = user_id`. This means even if a bug leaks the
  database connection, one user cannot see another's data.
- A database trigger (`on_auth_user_created`) automatically creates a `profiles` row
  when a user signs up.

---

## `src/lib/adapters/toronto-opendata.ts`
The Toronto data source adapter. This is where data enters the system.

### How it works
1. `ckanFetch()` — a thin wrapper around `fetch()` that calls the Toronto CKAN API
   with the right `User-Agent` header and parses the JSON response.
2. `fetchMeetings()` — fetches the meeting schedule dataset (1,445 rows, 2022–2026 term)
   and returns it as `Meeting[]` objects.
3. `fetchAgendaItems()` — fetches the voting records dataset, then deduplicates the rows
   by `Agenda Item #`. Each unique item becomes one `AgendaItem`. We get ~40 unique items
   from the 1,000 most recent vote rows.
4. `classifyCommittee()` — maps a committee name like "Planning and Housing Committee" to
   a short code ("PH") and an `ItemStage` ("committee"). This drives the Say-Window.
5. `inferStage()` — uses the motion type ("Adopt Item", "Amend Item") and committee name
   to guess whether an item is still moving up to City Council or is fully decided.
6. `ingestToDatabase()` — calls `fetchMeetings()` and `fetchAgendaItems()`, then upserts
   the results into Supabase using the admin (service role) client.

### Data gap (documented honestly)
Full agenda item text is not available in the CKAN datasets — only titles.
`secure.toronto.ca` (TMMIS) has the full text, but blocks automated access (403 Akamai WAF).
We link to TMMIS as the source, which users can open in a browser.

---

## `src/lib/db/supabase.ts` and `supabase-server.ts`
Two Supabase clients:
- `supabase` (browser-safe): uses the `anon` key; constrained by RLS policies.
- `supabaseAdmin` (server-only): uses the `service_role` key; bypasses RLS; never exposed to the browser.
- `createSupabaseServerClient()`: creates a server client that reads the user's session from cookies.
  Used in Server Components and API route handlers to identify the logged-in user.

Both clients use lazy initialization — they don't throw at import time if env vars are missing,
so the build succeeds without credentials.

---

## `src/proxy.ts` (Next.js 16 "proxy", formerly "middleware")
Runs on every HTTP request before the page renders. Its job is to refresh the user's
session cookie so Server Components always have an up-to-date auth state.

It skips entirely if Supabase credentials aren't set (dev without `.env.local`), so
the app starts cleanly even before you configure a database.

---

## `src/components/ui/SourceLink.tsx`
A small component used on EVERY item card, detail page, and alert email.
Shows `"Source: [Toronto City Council] · Last checked: [datetime]"`.

This is the most important UI enforcement of the "every item must have a source" rule.
If you see an item without a SourceLink, something is wrong.

---

## `src/components/ui/SayWindow.tsx`
The differentiating feature. Given an `AgendaItem`, renders:
1. A stage badge (committee / city council / appeal / decided).
2. An influence badge (high / medium / low / closed).
3. A countdown banner ("3 days until the meeting").
4. A description of what the stage means for a resident.
5. A `StagePipeline` — a visual 4-step pipeline with the current stage highlighted.
6. A link to the official "Have Your Say" page.
7. An ASSUMPTION note: stage is inferred from open data, not confirmed from TMMIS.

The stage info comes from Toronto Municipal Code Chapter 27 (Procedure By-law).

---

## `src/components/ui/ItemCard.tsx`
The card shown in the feed list. It shows:
- Stage badge (colour-coded)
- Committee name
- Item title (links to detail page)
- Item number and date
- Description (or a note that description isn't in open data)
- A "Say-Window open" teaser if the item is still open
- SourceLink (always present)

---

## `src/app/feed/page.tsx`
Server Component. Calls `fetchAgendaItems(100)` on the server and renders the list.
Supports search and stage filter via URL query params.
Shows a data-gap notice at the bottom explaining what isn't available.

---

## `src/app/item/[itemNumber]/page.tsx`
Detail page. URL: `/item/2026.TTC17.1`.
Calls `fetchAgendaItems(500)` and finds the item matching `itemNumber`.
Renders the full Say-Window, participation cards (with deadline source excerpts),
and a note about why the full description isn't available.

---

## `src/app/auth/` pages
Four pages (signup, login, reset, verify) backed by Supabase Auth.
- Signup: creates account, sends verification email.
- Login: signs in; on success, navigates to `/feed`.
- Reset: sends password-reset email via Supabase.
- Verify: listens for Supabase's `SIGNED_IN` event after the user clicks the link in their email.

No passwords are stored in our database. Supabase Auth handles hashing (bcrypt).

---

## `src/app/account/page.tsx` and `AlertPrefsForm.tsx`
Server Component (`page.tsx`) fetches the user's profile and prefs from Supabase.
Client Component (`AlertPrefsForm.tsx`) lets the user toggle email alerts (CASL opt-in),
set ward/topic filters, and save preferences.

---

## `src/lib/alerts/channel.ts`
The alert channel interface. All notification delivery goes through here.

Pattern:
1. `formatDeadlineAlert(item, daysLeft)` builds an `AlertMessage` with subject, plain-text
   body, HTML body, and source link.
2. `sendAlert(to, channelName, message)` calls the right channel (console or email) with
   automatic retry (3 attempts, exponential back-off).
3. Adding a new channel: implement `Channel { name, send(to, message): Promise<boolean> }`,
   register in `getChannel()`. Done.

In dev (no RESEND_API_KEY), `emailChannel` delegates to `consoleChannel`, which prints
the full alert to the terminal.

---

## `scripts/doctor.ts`
Run with `npm run doctor`. Checks:
- Node.js version ≥18
- Required env vars are set and non-placeholder
- Toronto CKAN API is reachable
- Supabase project is reachable

Exits non-zero if anything fails. Used before every demo.

---

## `scripts/check-links.ts`
Run with `npm run check-links`. Requests every stored source URL and reports
broken or redirected links. The TMMIS source link is expected to return a redirect
(it opens in a browser but blocks headless requests) — this is documented.

---

## `src/lib/db/schema.sql` — Key tables for judges

| Table | What it holds | Key design decision |
|-------|--------------|---------------------|
| `municipalities` | Seed data: Toronto | Adapter pattern — add a row for each city |
| `meetings` | Meeting schedule from CKAN | UNIQUE on (municipality, committee_code, meeting_number, date) |
| `agenda_items` | Items from voting records | UNIQUE on (municipality, item_number); content_hash for change detection |
| `profiles` | User settings | RLS: `auth.uid() = id` |
| `alert_preferences` | Alert filters | RLS: user owns their own prefs |
| `channel_consent` | CASL audit trail | Records when user opted in |
| `notification_log` | What we've sent | content_hash prevents re-alerting on unchanged items |
