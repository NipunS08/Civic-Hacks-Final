# CivicLens repair report

> [Documentation index](../README.md)

November 13, 2026, America/Toronto. Repairs apply to the working tree based on `4167ecc3`, including the existing logo/footer changes.

## Outcome

F01 and F03–F08 have implementation changes. The discovery and history regressions were exercised in Chrome. Account persistence, cross-browser behavior and the full responsive matrix remain unverified. **F02 is partially fixed: misleading promises and enabled delivery controls have been removed, but a production alert pipeline has not been implemented.** This report does not represent disabled controls as working email delivery.

No live account, production database, write-capable ingestion or real mail recipient was used. No new dependencies were installed, no remote push or commit was made, and existing logo/footer styling and mascot assets were preserved.

## Per-finding record

| Finding | Before / root cause | Change / files | Evidence | Status |
| --- | --- | --- | --- | --- |
| F01 | A future meeting and a general guide implied open input | `participation-state.ts` adds explicit evidence, provenance, checked time and timezone-aware deadline evaluation; types carry optional evidence. `ItemCard.tsx`, item detail and legacy `say-window.ts` use truthful states/wording | Regression cases cover no evidence, incomplete provenance, naive timestamps, expired/open deadlines, decided/unknown stage. Guelph feed in Chrome shows “Check official participation options” | Verified for implemented rules and sampled card; no live adapters currently populate verified windows |
| F02 | Signup/account/about/header advertised delivery; disconnected sender contained inferred timing and Toronto fallback | Signup, About, FAQ/privacy copy, README/SETUP, Navbar, account summary and preferences disclose unavailability; email/digest controls disabled; save clears delivery channels and digest. `alerts/channel.ts` rejects unverified deadlines, uses actual city and evidence, escapes content and fails closed in production | Eight-city formatter, malicious markup and production-send rejection tests pass; no send attempted | **Partially fixed**: truthful unavailable UX implemented; scheduler, matching, consent-aware dispatch, durable deduplication/logs and digest remain unimplemented |
| F03 | Uncontrolled form defaults survived client history | `FeedFilters.tsx` keys the form by applied canonical props, retaining checkbox focus for toggle submissions without preserving stale values across history | Chrome Guelph: 35 results → Housing 14 → Back 35 with unchecked Housing → Forward 14 with checked Housing → Back → new no-match search; resulting URL has no stale topics | Verified for topic/history/search path; exhaustive stage/time and rapid-transition browser tests pending |
| F04 | Same-document storage writes did not notify other controls | New `city-store.ts` supplies subscriptions, a same-tab event and storage-denied memory fallback. Picker, near-you links and Civi share it. Item route city remains authoritative | Unit tests cycle all eight cities with blocked storage. Chrome home: choose Guelph, header becomes Guelph; clicking near-you opens Guelph feed | Verified for sampled same-tab path and unit fallback; cross-tab browser testing pending |
| F05 | Hardcoded unknown decision milestone | `decision-milestone.ts` derives sourced motion/amendment/mayoral results; timeline keeps project delivery separate | Chrome Eastern Bridge milestone reads Recorded motion, Sep 9, Passed 23–2; tests cover 23–2/12–1, amendment, defeat, deferral, information receipt and unknown result | Verified for rules and Eastern Bridge browser case; Kingston live browser replay pending |
| F06 | Unknown-result guard excluded boards | `item-display.ts` applies held-result guard to every body | Regression: past board with no result is Discussed at a meeting; known published board result remains decided; existing tests pass | Verified by regression; original Library Board live replay pending |
| F07 | Account hardcoded only Toronto/Ottawa names | `account/page.tsx` uses shared `getCity`; distinguishes absent from corrupt IDs | Registry tests cover eight cities/null/unknown; lint/types/build validate rendering change | Implemented—not live-verified: no disposable authenticated Supabase available |
| F08 | Missing template and obsolete Node prerequisite | Placeholder-only `.env.example`, SETUP Node >=20.9 / Node 24 LTS guidance; matching package/lock engines; explicit account/alert limitations | Template copied in a temporary directory; credential values blank; `.env.local` ignored; manifest/lock metadata agrees | Verified for template/metadata; fresh install and configured account setup not performed |

## Architecture and behavior

### Participation and decisions

Meeting dates remain calendar information, never submission cutoffs. `ParticipationEvidence` requires item-specific provenance, an excerpt and verification time. An open claim also needs an explicit timezone-bearing deadline that has not passed. Invalid/missing evidence stays unknown. A decided or unknown procedural stage cannot acquire an affirmative open claim through a future calendar date. No adapter was given fabricated verification metadata.

The timeline now records the published motion's outcome and date, including amendments, without declaring that a project is approved for construction, underway or complete. Unknown results stay unknown. Board identity no longer bypasses that safeguard.

### Shared city and filter state

The browser's storage event handles other documents; a custom city event handles the current document. A memory fallback preserves a choice when storage is denied. Pickers prioritize item/feed URL context when syncing navigation. The feed server parses canonical filters as before; changing those applied props remounts only its form, so browser history cannot leave old default values in the DOM. Toggle focus is restored after an applied change and then released.

### Alert limitation and deliberate deviation

This implementation chose the prompt's truthful-unavailable option for the production UI. It **does not complete the requested optional delivery pipeline**. No mail SDK, cron endpoint, migration, subscriber matcher or durable delivery ledger was added. Missing credentials also prevent live verification, but credentials alone would not complete these missing components.

The dormant formatter is safer: no inferred deadline rules, no Toronto fallback for another city, explicit verified-deadline requirement and escaped markup. Production `sendAlert` throws before invoking a transport. Console output remains a development transport, not evidence of email delivery. Existing saved opt-ins are displayed as unavailable; saving preferences clears delivery channels/digest and records opt-out when an old enabled preference changes.

Consequently F02 remains open as a delivery feature. The unsupported promise is repaired. Do not advertise alerts or deploy a mail cron from this checkout.

## Configuration and safe activation

Public home/feed browsing requires no Supabase settings. Copy `.env.example` to the ignored `.env.local` only if configuring optional services. The template contains no real keys.

- Accounts: set the public Supabase URL/anon key, run the existing SQL schema in a disposable project and test sign-in, preference persistence, export and deletion before production.
- Admin operations: service-role key stays server-only. `CRON_SECRET` protects production ingestion; ingestion is separate from alerts.
- Alerts: `RESEND_API_KEY`/`EMAIL_FROM` are reserved settings and do not activate delivery. Before activation, implement and review verified-opportunity ingestion, consent-aware matching, bounded authenticated dispatch, durable idempotency and attempts, provider integration and digest scheduling or remove digest altogether. Test unsubscribe/deletion, malicious input, retries, duplicate suppression and all eight cities against a sandbox mail sink. Then review migrations and scheduling separately before any live send.
- No new SQL migration or cron deployment step is required by the changes in this report.

## Verification

Runtime prefix used for npm commands:

```sh
PATH="/private/tmp/civiclens-runtime/node-v24.22.3-darwin-arm64/bin:$PATH"
```

The prior audit supplies the recorded pre-repair baseline of 63 tests plus passing lint/types/build, 26 link checks, and doctor 4/8 due missing Supabase. The first smoke test during this implementation still passed 63/63. Six added regression groups bring the suite to 69 tests. The legacy date-only open-window test was updated to require unknown eligibility instead of asserting openness.

| Command | Observed result |
| --- | --- |
| `npm test` | 69 passed, 0 failed, 0 skipped |
| `npm run lint` | Passed |
| `npx tsc --noEmit --incremental false` | Passed |
| `npm run build` | Passed after correcting an intermediate client-hook prerender failure; final production validation passed |
| `npm run check-links` | Checker reports 26/26 OK; accepts redirects without verifying final destinations |
| `npm run doctor` | 4/8; missing Supabase URL, anon/service keys and connectivity. Public CKAN check passed |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `git diff --check` | Passed after whitespace cleanup |

Local verification logs: `/private/tmp/civiclens-fix-tests.log`, `civiclens-fix-build.log`, `civiclens-fix-links.log`, `civiclens-fix-doctor.log`, `civiclens-fix-audit.log`. Lint/types exit statuses and browser observations are recorded in the tool transcript. No screenshot artifact is claimed or saved during this repair pass.

Browser checks actually performed in native Chrome: home municipality typing/arrow/Enter, near-you navigation, topic toggle, Back/Forward, post-history no-match search, Eastern Bridge timeline, Civi open/Escape/focus return. Native accessibility link values briefly retained old text, so the actual near-you click destination was verified: `/feed?municipality=guelph`.

Not performed: full 320/393/tablet screenshot matrix after repairs; cross-browser checks; exhaustive stage/time filter combinations; fast concurrent transitions; authenticated account saving; real mail; sandbox end-to-end delivery (no pipeline exists); fresh dependency installation. The earlier audit's phone screenshot is not presented as post-fix verification.

D01 development-tool advisories were deliberately not upgraded during these functional repairs. No forced package update was run. The public-source adapters and their municipal record transformations were preserved.

## Demo readiness

Safe to demonstrate the tested public discovery flow, synchronized city selection, topic history/search, sourced recorded-motion timeline, unknown participation wording and Civi dismissal. Continue to verify substantive municipal claims at their official sources.

Email alerts and digests remain unavailable. Account summary code is updated but authenticated persistence needs a disposable configured instance. F02 is the original finding that remains partially open; the other seven have changes with the verification limits listed above. This is not a claim that every website bug or every acceptance scenario has been verified.
