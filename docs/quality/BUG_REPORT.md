# Bug Report

> [Documentation index](../README.md)

## Summary
- Passes completed: 4 (stopped: pass 4 found no new P0/P1/P2 bugs, all checks green, key flows work)
- Bugs found: 35 (P0: 2, P1: 8, P2: 17, P3: 8)
- Fixed: 35 | Suspected: 2 | Needs Decision: 4 | Won't Fix: 1
- Final check status: build · lint (0 problems) · types · tests (14/14, new)

## Project context (discovered)
- **App type:** web app. **Stack:** Next.js 16.4 (App Router, `cacheComponents`), React 19, Tailwind 4, Supabase (Auth + Postgres), TypeScript.
- **Install / run:** `npm install` · `npm run dev` · `npm run build && npm start`
- **Checks:** `npx tsc --noEmit` · `npm run lint` · `npm test` (added in this pass: Node's built-in test runner, no new dependencies)
- **Key flows:** home → quiz (3 steps) → feed → item detail / Say-Window; sign up → verify → account (alert preferences, export, delete); password reset; sources page.
- **Out of scope:** `node_modules/`, generated `.next/`.
- **Limits of testing:** no `.env.local` on this machine, so Supabase-backed flows (sign-up, prefs, export, delete) were verified by code reading, type-checking and their "not configured" paths, not against a live database.

## Baseline (before changes)
- Build (18 routes) · Types · Lint 1 error (`src/lib/alerts/channel.ts` `require()`), 5 warnings · Tests: none exist · `npm audit`: 0 vulnerabilities.
- No `.gitignore` in the repo; `node_modules/` (22k files) is committed.

## Pass 1
| ID | Severity | Category | Location | Description | Status | Fix |
|----|----------|----------|----------|-------------|--------|-----|
| B-001 | P0 | Security | src/lib/db/schema.sql | `municipalities`, `meetings`, `agenda_items`, `participation`, `vote_records` had no Row-Level Security, so anyone with the public anon key could insert, edit or delete public data | Fixed | RLS enabled with public read-only `select` policies; only the service-role key can write |
| B-002 | P0 | Functional | src/app/account/page.tsx | Server Component passed an `onClick` to the delete button; the page throws at runtime once Supabase is configured | Fixed | Moved to new client component `DeleteAccountButton.tsx` |
| B-003 | P1 | Functional | src/app/item/[itemNumber]/page.tsx | Item page only searched Toronto data, so every Ottawa item (the default feed) was a 404 | Fixed | Looks up `OTT-` items via the eScribe adapter |
| B-004 | P1 | Data | ItemCard, item page, SayWindow, channel.ts | Date-only strings parsed as UTC midnight, so every meeting date showed one day early in Toronto time (e.g. Aug 5 → "Tuesday, August 4") | Fixed | New `src/lib/dates.ts` (calendar-safe formatting, Toronto "today"); tests added |
| B-005 | P1 | Data | src/lib/adapters/escribe.ts, toronto-opendata.ts | Past meetings shown as upcoming with "Say-Window open": Ottawa relied only on eScribe's lagging `MeetingPassed`; Toronto marked months-old committee votes "At committee" | Fixed | Ottawa: past date ⇒ decided. Toronto: past committee vote ⇒ "Committee voted, next step unknown". Shared `isSayWindowOpen()` (tested) |
| B-006 | P1 | Data/UX | item page, SayWindow | Ottawa items showed Toronto's rules and links; decided items still showed "how to have your say" with deadlines | Fixed | City-specific participation (Ottawa from `getParticipationInstructions`); closed-window message for past/decided items |
| B-007 | P1 | Functional | src/app/auth/reset/page.tsx | Reset email redirected to `/auth/update-password`, which didn't exist | Fixed | Added the page (uses `supabase.auth.updateUser`) |
| B-008 | P1 | Functional | schema.sql + AlertPrefsForm.tsx | Prefs upsert used `onConflict: "user_id"` with no unique constraint, so saving always failed | Fixed | `unique` on `alert_preferences.user_id` + idempotent migration block for existing DBs |
| B-009 | P1 | Functional | account page | "Export my data" / "Delete account" pointed at routes that didn't exist | Fixed | Added `/api/account/export` (RLS-scoped JSON download) and `/api/account/delete` (session-identified, admin delete, cascades) |
| B-010 | P1 | Functional | src/app/api/auth/signout/route.ts | 307 redirect re-POSTed to `/`; fallback redirect to `localhost` in production; crashed without Supabase | Fixed | 303 to `new URL("/", request.url)`, error-tolerant |
| B-011 | P2 | Security | src/app/api/ingest/route.ts | Write endpoint open to anyone in production when `CRON_SECRET` unset | Fixed | Returns 503 in production unless the secret is configured |
| B-012 | P2 | UX | src/app/auth/verify/page.tsx | Spinner forever if session already existed or link was bad; error state unreachable; timer leak | Fixed | Handles `INITIAL_SESSION`, 10 s timeout to error, timers cleaned up |
| B-013 | P2 | UX | signup / login / reset pages | Network or config errors threw and left buttons stuck on "…ing" | Fixed | try/catch/finally with plain-language errors |
| B-014 | P2 | Data | schema.sql, AlertPrefsForm, account page | Ottawa (primary city) not seeded; prefs and account hardcoded "Toronto" | Fixed | Ottawa seed row; city selector in prefs; account shows saved city |
| B-015 | P2 | Compliance | AlertPrefsForm.tsx | Page says saving = CASL consent, but `channel_consent` was never written | Fixed | Inserts an opt-in/opt-out row whenever the email setting changes |
| B-016 | P2 | Security | src/lib/alerts/channel.ts | Item title/committee interpolated unescaped into HTML email | Fixed | `escapeHtml()` on every external value |
| B-017 | P2 | Data/UI | SayWindow.tsx | Pipeline ticked stages the item never went through (TTC decision showed City Council Appeal) | Fixed | Only the current stage is highlighted |
| B-018 | P2 | Data | SayWindow, item page | Source label hardcoded "Toronto City Council" on Ottawa items (Iron Rule 10) | Fixed | `sourceLabelFor(item)` (tested) |
| B-019 | P2 | Data | escribe.ts `getParticipationInstructions` | Deadline built in server-local time then `toISOString()` (UTC), shifting the hour/day | Fixed | Pure calendar arithmetic → Toronto-local `YYYY-MM-DDT15:00` |
| B-020 | P2 | Accessibility | many components | Small `text-gray-400/500` and `brand-500` text below 4.5:1 contrast on cream/white | Fixed | Raised to gray-600 / brand-700 |
| B-021 | P2 | Tooling | channel.ts | Lint error (`eslint-disable` comment one line above the wrong line) | Fixed | Disable comments placed on the correct lines |
| B-022 | P2 | Security | repo root | No `.gitignore`, so a future `.env.local` (secrets) could be committed | Fixed | Added `.gitignore` (env files, `.next`, `node_modules`, build info). See Needs Decision for already-tracked `node_modules` |
| B-023 | P3 | Data | item page | Participation cards' "Last checked" was page-render time, not a real check | Fixed | Uses the documented link-verification date |
| B-024 | P3 | Data | channel.ts | Alert email labelled "AI summary" though no AI text; Toronto-only instructions | Fixed | Label removed; city-specific rule and link |
| B-025 | P3 | Content | privacy page | Said data is stored "in Canada (us-east-1…)", which contradicts itself | Fixed | Points to the region chosen at setup (SETUP.md: ca-central-1) |
| B-026 | P3 | UI | ItemCard | Ottawa wards rendered "Ward Ward 14" | Fixed | Only prefixes bare numbers |
| B-027 | P3 | Code quality | doctor.ts, escribe.ts, toronto-opendata.ts | Unused imports/variables (lint warnings) | Fixed | Removed |
| B-028 | P3 | Forms | signup page | No email format check (`noValidate`) | Fixed | Basic check before network call |
| B-029 | P3 | Content | feed page | Subtitle claimed all listed meetings "are open for public participation" | Fixed | Neutral wording |

## Pass 2
| ID | Severity | Category | Location | Description | Status | Fix |
|----|----------|----------|----------|-------------|--------|-----|
| B-030 | P2 | Data/UX | item page | Meeting today: window "open" but inferred delegation deadline (yesterday 3 p.m.) not marked as passed | Fixed | Shows "this inferred deadline has passed, check the official page" |
| B-031 | P2 | Data/UX | escribe.ts | "National Anthem", "Call to order…", "Roll Call", minutes, department headings etc. listed with "Say-Window open" (exact-match filter missed variants) | Fixed | `src/lib/procedural.ts` pattern filter, tested against real titles |
| B-032 | P3 | UI | SayWindow.tsx | Stage pipeline clipped at 320 px with no scroll hint | Fixed | Wraps instead |
| B-033 | P2 | Data | SayWindow.tsx | Stage text stated Toronto deputation rules for Ottawa items | Fixed | City-neutral text that points to the official page |

## Pass 3
| ID | Severity | Category | Location | Description | Status | Fix |
|----|----------|----------|----------|-------------|--------|-----|
| B-034 | P2 | Data/UX | procedural.ts | Remaining headings ("Petitions", "Bulk Consent Agenda", "… Committee Report 72", "City Clerk") still listed | Fixed | Patterns + tests (substantive "City Clerk – Summary of … Submissions" kept) |
| B-035 | P2 | UX | app | Missing items fell to Next's default black 404 with no way back | Fixed | Branded `src/app/not-found.tsx` with links to feed and home |

## Pass 4
- Re-checked files changed in pass 3 and reran all checks and key flows at 320 / 768 / 1440 px. No new P0–P2 bugs.

## Needs Decision
- **node_modules is committed (≈22,500 files).** Options: (a) `git rm -r --cached node_modules` and commit (repo shrinks; teammates run `npm install`), (b) leave it. Recommendation: (a). Not done because it rewrites what's tracked.
- **Alerts are never sent.** `sendAlert()` exists but nothing calls it (no scheduler/cron). Options: Vercel Cron → new `/api/alerts` route, or a script. Product decision on timing (e.g. 3 days before).
- **Apply the schema changes.** `schema.sql` now has RLS policies, the Ottawa seed and a safe migration block, but nothing was run against any database. Someone with Supabase access must run it in the SQL editor.
- **Holidays in inferred deadlines.** Ottawa's "business day before" skips weekends but not statutory holidays. Options: add an Ontario holiday list, or keep the "INFERRED, confirm on the official page" label (current).

## Suspected (not confirmed)
- `getParticipationInstructions()` returns `canParticipate: false` for Ottawa standing committees, which may be wrong (committees usually hear delegations). Not verified against the by-law, so not changed; the UI no longer uses this flag.
- Missing item pages return HTTP 200 (with 404 content) because the route streams (Partial Prerender). Framework behaviour; affects crawlers, not users.

## Won't Fix
- **Feed takes ~2.5 s per load:** the eScribe adapter sleeps 500 ms per meeting even when the fetch is served from cache. Kept because it enforces respectful rate limiting (Iron Rule 13). Recommendation: cache the parsed item list (`"use cache"`) so sleeps only happen on real network fetches.

## Recommendations (not bugs)
- Add browser e2e tests (Playwright) for quiz → feed → item and the auth flows once a test Supabase project exists.
- `schema.sql` triggers use `create trigger` without `drop … if exists`, so re-running the whole file errors on an existing DB (the new policy/migration blocks are idempotent).
- Login page copy mentions a "personalized feed", which doesn't exist yet.
- Toronto stage filter now includes "Committee voted, next step unknown"; consider explaining stages in a short legend on the feed.


## Follow-up fixes — November 13, 2026

- Fixed development Issues errors on `/feed` and `/item/[itemNumber]`: current-time reads now follow `await connection()`, with route loading boundaries. `instant = false` alone only disables navigation validation; it does not opt out of prerendering.
- Repeated search query parameters no longer cause `.toLowerCase()` errors. Percent-containing item IDs are no longer decoded twice.
- Browser auth now uses the cookie-based Supabase SSR client so server pages can read the same session. Authenticated flows still require a configured Supabase project for live verification.
- Data export returns an error if any table query fails, instead of silently presenting an incomplete export as complete.
- Added a recoverable page error boundary. Removed fabricated feed check timestamps when no source records were retrieved.
- Fixed alert-preference saved-state feedback, clarified opt-in copy, and prevented edits while a save is in progress.
- Rejected invalid calendar dates; filtered remaining generic agenda headings without hiding substantive motions or presentations.
- Made schema trigger/policy setup repeatable. These SQL changes have not been applied to any database.
- Corrected the environment doctor's Node minimum to Next.js's 20.9 requirement.

Validation: lint, TypeScript and production build passed after the functional fixes; 23 tests passed. Local Next.js diagnostics reported no configuration or session errors, and no new errors appeared in the development log after the repaired feed and malformed-URL checks. A further compilation-diagnostics request was not executed because automatic approval review reported exhausted workspace credits. Live authenticated/database workflows and browser accessibility checks remain unverified.
