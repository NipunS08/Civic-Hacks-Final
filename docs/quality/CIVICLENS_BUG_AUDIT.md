# CivicLens website bug audit

> [Documentation index](../README.md)

Audit date: November 13, 2026, America/Toronto (November 14 UTC).  
Checkout: `4167ecc3e5bb0eec93763a2ae62612505bfc3ebb`, including the existing, uncommitted logo and footer changes.  
Environment: macOS, Node 24.22.3, Next.js 16.4.6, React 19.3.0, local development server at `http://localhost:3000`.

## 1. Executive summary

The public prototype builds and serves real municipal records. All **63 existing tests**, lint, TypeScript and the production build passed. All **eight city feeds** returned records during this audit. Three sampled records were compared with official agenda, minutes or open-data responses; their sampled dates, subject matter and vote tallies agreed.

The most important problems are an unverified claim that participation is still open, an advertised alert feature without a connected delivery workflow, and inconsistent state and decision labels. **Eight findings are documented below: two P1 and six P2. No P0 was confirmed.** Dependency advisories are recorded separately as a development-tool risk, not as an exploited website vulnerability.

Browser testing reproduced stale feed filters, stale homepage city links and a contradiction between the vote result and timeline. Other findings are explicitly code-confirmed rather than claimed as end-to-end reproductions. The audit did not use a real account, send email, invoke ingestion, modify municipal data or install dependencies.

Supabase is not configured in this checkout. The doctor command consequently passed 4/8 checks; authenticated workflows and real delivery remain unverified. Browser control was available through native Chrome accessibility and screenshots, but the browser automation host was unavailable. A 393 × 852 phone viewport was inspected. The narrower 320 px and tablet checks were not completed after a browser-control approval timeout and window changes. This is not a WCAG certification, comprehensive security assessment or cross-browser sign-off.

## 2. System inventory

| Area | Detected implementation |
| --- | --- |
| Framework | Next.js App Router, React server/client components, TypeScript, Tailwind v4 and semantic CSS variables; lucide-react icons |
| Rendering | Cache Components and partial prefetching; feed and item data stream behind Suspense |
| Home | Municipality/topic/time GET form, remembered-city links, FAQ disclosures, Civi introduction |
| Feed | `/feed`; municipality, repeated/comma-separated time/topic parameters, stage and title/code search |
| Details | `/item/[itemNumber]`; status, decision body, votes, source text, impacts checklist, graphical timeline and participation section |
| Guidance | Civi predetermined choices, back/restart/minimize; `/quiz` redirects to the feed, rather than implementing a separate quiz |
| Information | `/about`, `/faq`, `/sources`, `/privacy`, branded not-found and error boundaries |
| Accounts | `/auth/login`, `/auth/signup`, `/auth/reset`, `/auth/update-password`, `/auth/verify`, `/account`; Supabase Auth and preferences |
| APIs | GET `/api/account/export`, POST `/api/account/delete`, POST `/api/auth/signout`, GET `/api/ingest` |
| Data | Shared eSCRIBE adapter for seven cities; Toronto CKAN votes; Kingston ArcGIS votes and mayoral decisions |
| Caching | `src/lib/adapters/http.ts`: 15-minute in-memory cache, shared concurrent requests, per-host queue, 350 ms spacing and 45-second individual request timeout |
| Storage | Supabase SQL schema with RLS; all eight municipality seeds are present; votes are read live, not persisted by the ingestion route |
| Alerts | Preference UI, channel abstraction, console/optional Resend sender; disconnected from a scheduling/dispatch workflow (F02) |
| Tests | Node test runner, 13 test files; no Playwright/Cypress, automated accessibility or dedicated formatting command detected |

No staff dashboard, publishing approval system or social posting interface was found. Those were not treated as broken features.

### Working-tree preservation

Before the audit, these files already differed from HEAD: `src/app/globals.css`, `src/app/icon.svg`, `src/app/layout.tsx`, `src/components/layout/Logo.tsx`. They retain those changes. This report is the only intended repository addition from the audit. Generated build output and temporary read-only response captures are outside source control.

## 3. Coverage matrix

“HTTP” means a response was retrieved and inspected; it does **not** mean every interaction or layout on that page passed.

| Route / feature | Browser / keyboard | HTTP / code coverage | Result and limits |
| --- | --- | --- | --- |
| `/` | Desktop city field: Guelph then Hamilton using typing and arrow/Enter; submitted Hamilton form | HTTP 200, form and navigation reviewed | Form opens Hamilton; both near-you links and header picker remain Ottawa until another synchronization event (F04) |
| `/feed` Ottawa | Housing toggle, browser Back repeated twice, no-match search submission | HTTP 200, 135 unique detail links | Results update, but Back leaves stale controls that alter the next search (F03) |
| Feed time/stage controls | Present in browser accessibility tree; exhaustive toggle paths not exercised | Parsing and existing unit tests reviewed | Do not claim complete interactive coverage; same uncontrolled-input root cause affects these controls |
| Other city feeds | Full interactive traversal not performed | Toronto 29, Hamilton 107, Kingston 65, Brampton 153, Kitchener 73, Guelph 35, Mississauga 127 unique detail links; all HTTP 200 | All produced records in this run; no all-city load failure was reproduced |
| Search | No-match query typed and submitted in browser | Case, leading/trailing whitespace, partial keyword, special characters and empty/default search checked via HTTP | `zoning`, `ZONING`, and padded zoning each returned 17 links; `Beckett` returned 1; no-match and `<>&%` returned 0 |
| Feed invalid inputs | Not browser-clicked | Unknown municipality, stage and time parameters | HTTP 200, safe fallback to Ottawa/default filters; no crash observed |
| Item Eastern Bridge | Opened directly in Chrome, inspected votes/timeline; phone viewport | HTTP 200; compared official minutes | Vote 23–2 agrees; timeline still says decision not confirmed (F05) |
| Item Beckett's Creek | Browser card text inspected; full detail retrieved by HTTP | HTTP 200; compared official agenda | Date/request agree; participation availability remains unverified (F01) |
| Item Kingston Woodland | HTTP detail and source comparison | HTTP 200; official vote rows queried | Vote 12–1 agrees; same timeline contradiction (F05) |
| Item impacts and timeline disclosures | Accessibility-tree presence inspected; not every disclosure activated | Component review | No personal-impact assertion was established for missing data; delivery milestones are explicitly illustrative |
| Civi | Open, city choice, Next topics, Back, Restart, Escape and focus restoration; phone open/close | Reducer/link tests passed | Tested controls worked; topic link preserved active feed query. Other branches, first-visit reset and screen-reader announcements were not exhaustively retested |
| Mobile item/Civi | Chrome iPhone 16 emulation, 393 × 852 | Screenshot visually inspected | Panel, close button, launcher and site header fit; panel overlays content while open as expected. No general mobile pass is implied |
| 320 px/tablet | Attempted to change device profile | Not completed | Native approval timed out and active browser windows changed; no result claimed |
| `/about`, `/faq`, `/privacy`, `/sources` | Links inventoried; not every page visually inspected | Each HTTP 200 | Content served; full keyboard/responsive review incomplete |
| Footer | Navigation/link labels present in browser tree | Shared layout reviewed | Existing footer change preserved; phone footer and all external licence destinations not visually certified |
| `/auth/login`, signup, reset | No real credentials entered; no emails requested | Each HTTP 200; validation/catch paths reviewed | Service configuration absent; authentication success and email flows not tested |
| Verify/update-password | No token used | HTTP 200, configured/error branches reviewed | Valid-token handling not tested |
| `/account` | No authenticated session accessed | Response contains login redirect instruction | Initial HTTP 200 is streamed; not evidence of authenticated account access |
| Account export | No user data accessed | HTTP 503, accounts unavailable response | Expected local configuration guard; authenticated export/delete not tested |
| Ingest/signout/delete APIs | Not invoked | Authorization and response branches reviewed | Ingest can write; deliberately excluded from runtime testing |
| `/quiz` | Not a separate quiz | Redirect followed to Ottawa feed, final HTTP 200 | Legacy navigation works in HTTP test |
| Unknown route/item | HTTP only | `/does-not-exist` 404; unknown item contains streamed 404 fallback | Unknown item initially returns 200 due streaming; not counted as successful item resolution |
| Assets | Mascot visible in phone screenshot | `/icon.svg` and `/civi.png` HTTP 200 | No missing sampled asset |
| Console | Chrome Console inspected on Eastern Bridge | React development notice and HMR connection visible | No error/hydration warning visible in that inspected console; not a complete session-wide network/exception log |

## 4. Findings table

| ID | Priority | Confidence | Category | Defect / impact | Recommended repair |
| --- | --- | --- | --- | --- | --- |
| F01 | P1 | Code-confirmed; positive CTA reproduced | Municipal trust | General guide plus future meeting triggers a definite claim that residents can still comment | Use conditional “Check participation options” unless item-specific availability is verified |
| F02 | P1 | Code-confirmed | Functional / disclosure | Signup and preferences promise approaching-deadline/digest emails, but no caller or scheduler connects saved preferences to delivery | Clearly disclose unavailable delivery, or complete and verify the pipeline before promising it |
| F03 | P2 | Reproduced twice | State / accessibility | Browser Back restores results but leaves Housing checked; later search silently reapplies it | Synchronize form controls with URL state or remount on canonical filter changes |
| F04 | P2 | Reproduced with two cities | Navigation / state | Homepage selected city differs from near-you links and header picker | Shared city state with same-tab notifications |
| F05 | P2 | Reproduced; second item HTTP-confirmed | Data presentation | Recorded, passed decisions still have “Decision — Not confirmed” in timeline | Derive decision milestone from the published outcome, separate from project implementation approval |
| F06 | P2 | HTTP-reproduced; pure function repeated twice | Municipal trust | Board item with unavailable result is labelled “Decided by a city panel” | Apply unknown-result guard to boards too |
| F07 | P2 | Code-confirmed; authenticated runtime not tested | Account UI | Six valid saved cities display “Not set” in account summary | Resolve municipality through the shared city registry |
| F08 | P2 | Code-confirmed | Setup / reproducibility | Setup requests a missing `.env.example` and permits unsupported Node 18 | Restore safe template and state Next's actual Node minimum |

## 5. Detailed findings

### F01 — Participation claim is stronger than its evidence

**Location:** `src/components/ui/ItemCard.tsx:31` and `:80`; `src/app/item/[itemNumber]/page.tsx:125` onward.  
**Environment:** Local Chrome desktop and captured server-rendered Ottawa feed.  
**Type:** Bug in civic certainty, not proof that a particular deadline has already expired.

1. Open `/feed?municipality=ottawa`.
2. Find the November 17, 2026 Beckett's Creek item.
3. Observe the positive participation CTA and open its participation section.
4. Compare what the site actually knows: an upcoming meeting and Ottawa's general participation guide. The section tells the resident to check the official deadline; it supplies no confirmed item-specific deadline.

**Expected:** Unknown availability is presented as a prompt to check official options.  
**Observed:** The card says **“You can still share your opinion: see how.”** Code enables this when `status === "upcoming"` and either any official link exists **or the city has a general participation URL**. The latter establishes neither that this item accepts input nor that its window remains open. The current positive card was reproduced; no closed-window counterexample was asserted.

**Root cause:** Confirmed eligibility rule conflates availability of guidance with availability of an input opportunity. A calendar date is also only date-level information, not the current time of a hearing.

**Minimal fix:** Change unverified cases to “Check participation options”; reserve definite availability for published, item-specific evidence and verified timing. Keep unknown deadlines explicit.

**Regression:** Upcoming item with only a generic guide; deadline earlier than meeting; same-day meeting already finished; item-specific open/closed/unknown input windows. None should promise open input without evidence.

**Evidence:** `route-17.html`, `cards.json`, `detail-search-0.html` in the evidence directory; source links in section 6.

### F02 — Alert delivery is advertised but not connected

**Location:** `src/app/auth/signup/page.tsx:62`; `src/app/account/AlertPrefsForm.tsx:99` and `:117`; `src/lib/alerts/channel.ts:56`, `:163`, `:190`; `src/app/api/ingest/route.ts`.  
**Environment:** Repository inspection, no real account or outbound send.  
**Confidence:** Code-confirmed integration gap; deployment-level external automation, if any, was not inspected.

1. Read the signup promise to notify residents before comment windows close.
2. Trace the preferences form: it writes settings and consent.
3. Search `src` and `scripts` for `formatDeadlineAlert` and `sendAlert` callers and for digest scheduling.
4. Inspect ingestion: it refreshes/upserts items, but does not match subscribers, schedule/digest or send messages.

**Expected:** Advertised alerts have a connected, verified delivery path, or are clearly labelled unavailable.  
**Observed:** The formatter and sender have definitions but no application callers. No scheduler/digest workflow was found. Installing credentials alone does not connect this workflow; the `resend` package is not declared in `package.json` either.

**Related activation risks:** The unused formatter defaults six other cities to Toronto's instructions (`channel.ts:60`), accepts an arbitrary `daysLeft` as a submission countdown and includes a rule explicitly marked inferred. These were not sent to anyone and are not claimed as live misinformation. They must be addressed before activation. The sender comment promises notification logging, but no insertion happens inside `sendAlert`.

**Minimal fix:** First disclose the unavailable feature in signup/account copy. A full implementation needs verified deadlines, city-specific instructions, consent checks, subscriber matching, a scheduler, deduplication, digest delivery, provider dependency and delivery logging.

**Regression:** Use a sandbox mail sink and test open/closed/unknown deadlines, unsubscribe, all eight cities, retries, duplicate prevention and daily digest. No real recipient should be needed.

### F03 — Feed controls disagree with browser history and reapply stale filters

**Location:** `src/components/ui/FeedFilters.tsx:46`, `:61`, `:74`, `:83`.  
**Environment:** Native Chrome desktop, React client navigation. Reproduced twice.

1. Load `/feed?municipality=ottawa&when=upcoming&when=past`.
2. Check Housing & development. Wait for **49 of 135** results.
3. Use browser Back (Command-Left on the test Mac).
4. Observe the original URL and **135 of 135** results, while Housing remains checked.
5. Type `zzzauditnomatch999` and submit Search.

**Expected:** Back restores both results and visible filter state. A subsequent search uses the filters shown by the restored URL.  
**Observed:** The checked input survives navigation. Subsequent submission adds `topics=housing` to the request even though Back had removed it from the URL. Refresh resets the mismatch, confirming the difference between client navigation and a clean render.

**Root cause:** Confirmed use of uncontrolled `defaultChecked` / `defaultValue` inputs in a persistent component. New server props do not reset current DOM values. Topic behavior was directly reproduced; other controls share the same implementation but were not exhaustively reproduced.

**Minimal fix:** Synchronize controls with canonical URL state, or use a deliberate keyed remount when the parsed filters change. Preserve normal typing and keyboard focus.

**Regression:** Toggle → Back → Forward → Search, including topic, time and stage controls and search text; verify URL, selected states and result count together. This requires a browser regression, not only parser unit tests.

### F04 — Same-tab city changes do not update homepage links

**Location:** `src/components/landing/NearYouLink.tsx:20`; `src/components/layout/MunicipalityPicker.tsx:32` and `:80`.  
**Environment:** Native Chrome desktop, typed search and arrow/Enter selection. Reproduced for Guelph and Hamilton.

1. Load home with Ottawa as the current city.
2. In **Your municipality**, choose Guelph.
3. Inspect both “See what's happening near you” links and the header picker.
4. Repeat with Hamilton, then submit the discovery form.

**Expected:** All controls and links reflecting the current choice agree, or clearly distinguish a separate search-form choice.  
**Observed:** The form shows Guelph, then Hamilton; both links still target Ottawa and the header still says Ottawa. Submitting the form correctly opens Hamilton. Thus residents receive different city feeds depending on which prominent CTA they choose.

**Root cause:** `storeCity` writes localStorage but broadcasts no same-tab change. `NearYouLink` subscribes only to `storage`, which notifies other documents, while each picker owns independent local state.

**Minimal fix:** Use a common city store/context and notify subscribers in the current document; synchronize multiple pickers and near-you links. Keep URL ownership on item/feed pages explicit.

**Regression:** Change city in the home form, verify both CTAs and header, submit, return home, and repeat with a second city. Also test blocked storage and another tab.

### F05 — Timeline says a recorded decision is unconfirmed

**Location:** `src/components/ui/ImplementationTimeline.tsx:18`.  
**Environment:** Chrome desktop Eastern Bridge detail; HTTP snapshots of Eastern Bridge and Kingston Woodland details.

1. Open `/item/OTT-2026-09-09-0576ac9f-68`.
2. Read the passed 23–2 vote and decision date.
3. Read milestone 2 of the implementation timeline.
4. Repeat against `/item/KGN-V-2026-09-15-b4e0a533b8` (passed 12–1).

**Expected:** The timeline recognizes the recorded vote/decision while distinguishing it from approval to construct or implement a project.  
**Observed:** Both pages show **“Decision — Not confirmed”** despite their published decision records. Later work/completion dates may genuinely be unknown, but that does not make the recorded vote unknown.

**Root cause:** Milestone 2 is a constant, independent of item outcomes.

**Minimal fix:** Derive a recorded-decision milestone from the item, explicitly identifying what motion was decided. Do not infer project approval or delivery dates from that vote. For Eastern Bridge in particular, a carried resolution about consultation is not approval of bridge construction.

**Regression:** Upcoming proposal, recorded main vote, amendment-only vote, deferral, information receipt and mayoral decision; preserve uncertainty for actual implementation dates.

### F06 — Unknown-result board item is described as decided

**Location:** `src/lib/item-display.ts:22` and `:33`.  
**Environment:** Captured Ottawa feed; pure-function check repeated twice with a past board item and no votes.

1. Open the Ottawa feed or `/item/OTT-2026-11-10-7ea54068-10`.
2. Find **Chief Executive Officer and Chief Librarian's Report**, Ottawa Public Library Board, November 10.
3. Compare the status and stage badges.

**Expected:** Where the app has no result, it labels the item discussed/held and leaves the outcome unknown.  
**Observed:** The same card says **“Result not available yet”**, **“Decided by a city panel”**, and **“No separate vote listed in the minutes.”** This audit does not conclude that no decision happened; it identifies the app's unsupported certainty.

**Root cause:** The unknown-result guard explicitly excludes `decision_body === "board"`. The board branch then chooses “Decided” solely from the past date. The pure check returned `status: "held"` and the decided badge on both executions.

**Minimal fix:** Preserve the board identity but apply the unknown-result safeguard to it. Distinguish a published outcome from the body's authority to decide.

**Regression:** Past board/tribunal/library item with no outcome, information receipt, known approval and future hearing; badges must agree with status.

### F07 — Account summary cannot display six supported cities

**Location:** `src/app/account/page.tsx:54`.  
**Environment:** Static code; configured authenticated runtime not tested.

1. With a test account on a configured instance, save Hamilton (or Kingston/Brampton/Kitchener/Guelph/Mississauga) as the alert municipality.
2. Reload the account page and read “City for alerts.”

**Expected:** The saved valid city name.  
**Code-confirmed behavior:** The rendering expression recognizes only Toronto and Ottawa; every other value becomes **“Not set.”** The form supports all eight cities and the schema seeds them all, so this is a display mapping defect, not a missing municipality seed.

**Minimal fix:** Use `getCity(prefs?.municipality_id)?.name` with an appropriate unknown fallback.

**Regression:** Render the summary for every city ID, no preferences and an unknown ID. End-to-end saving requires a disposable configured account and remains pending.

### F08 — Documented setup is not reproducible as written

**Location:** `SETUP.md:7`, `SETUP.md:38`; missing repository-root `.env.example`; Next's installed `package.json` engine declaration.  
**Environment:** Filesystem and command inspection, no dependency installation.

1. Follow SETUP prerequisites, which allow Node 18.
2. Follow the instruction `cp .env.example .env.local`.
3. Compare the referenced files and the installed Next engine requirement.

**Expected:** Supported Node version and a safe template that the stated command can copy.  
**Observed:** No `.env.example` exists or is tracked; the setup copy command therefore has no source file. Next declares **Node >=20.9.0**, while SETUP allows Node 18. The audit itself used Node 24.22.3, so its successful build does not validate the documented Node 18 setup.

**Minimal fix:** Add a placeholder-only template and update the prerequisites. Explain that the public feed runs without Supabase, while account features require it. Never include real keys.

**Regression:** Follow setup in a fresh temporary checkout with a supported runtime and placeholder credentials; verify public browsing and clear account-unavailable feedback.

## 6. Municipal integrity checks

Official pages were attempted with the web reader first. Its Ottawa opens failed and Kingston's dataset landing page had no readable text. Direct read-only HTTP retrieval then succeeded for both Ottawa documents and the official Kingston ArcGIS service. Saved responses, rather than search snippets, were used for comparisons.

| Record | Site / official comparison | Stage and participation assessment |
| --- | --- | --- |
| [1622 Beckett's Creek agenda](https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id=1d2d50c0-6ecb-4a4a-a9ce-08b5806e14bb&Agenda=Agenda&lang=English&Item=9) | Official agenda lists Panel 3, Nov 17 at 9 a.m., consent files B-00222–00223 and a request for three parcels. Site date, request and panel identity agree. Personal applicant/agent names are not shown in the sampled card. | Correctly upcoming, not an adopted request. An item notice PDF is linked by the source, but was not opened; a submission cutoff and currently open input window were **not verified**. F01 applies. |
| [Eastern Bridge minutes](https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id=0576ac9f-74e8-4986-b8f8-9c96b26f6e67&Agenda=PostMinutes&lang=English&Item=68) | Official minutes identify the Sept 9 council motion, 23 for, 2 against and a carried result. The displayed tally and named-group sizes agree. The motion concerns federal consultation/coordination; it explicitly avoids treating the resolution as final project support or opposition. | A council motion was decided; this does not establish bridge implementation approval. The site directs residents to exact motion wording, but its generic “it passed” summary needs that context. F05 applies. The meeting is past; no current input opportunity was verified. |
| [Kingston Woodland voting dataset](https://opendatakingston.cityofkingston.ca/datasets/council-voting-records) | Official service query returned records from two dates. Filtering to Sept 15 and the exemptions description gave 13 member rows: 12 Yea, 1 Nay, Carried. The site's Sept 15 12–1 record agrees. | Council-vote classification agrees with the dataset. The underlying by-law/report conditions were not independently opened, so substantive policy effects and implementation approval are **not verified**. Timeline contradiction F05 applies. No current input window was verified. |

Kingston service: [official ArcGIS query endpoint](https://services1.arcgis.com/5GRYvurYYUwAecLQ/arcgis/rest/services/Council%20Voting%20Records/FeatureServer/0/query). Audit parameters were `f=json`, `outFields=*`, `where=Agenda_Description like '%Interim Woodland%'`, `resultRecordCount=100`; then the Sept 15 rows were selected. The dataset landing link supplies general provenance, not a permanent per-vote URL.

Source URLs and last-checked labels were visible on the sampled cards/details. No sampled tally mismatch or invented personal impact was found. This is three-record verification, not validation of every record or every policy claim. Other official item links were not exhaustively followed.

## 7. Accessibility, performance, security and dependencies

### Accessibility and responsive behavior

- Observed: labelled search and city controls, fieldsets, named vote tables, named Civi controls and focus restoration to the launcher after Escape.
- Reproduced accessibility/usability concern: F03 exposes selected state that disagrees with the results and URL. A screen-reader user can receive the same misleading filter state.
- Existing contrast tests passed as part of the 63-test suite; they test selected token/background combinations, not every rendered pixel or component state.
- The phone screenshot showed the Civi close control, header and footer controls within the 393 × 852 viewport. Header navigation remained visible above it. No clipping was identified in this sampled state.
- Not completed: 320 px, tablet, every footer/form state, full keyboard-only task completion, VoiceOver/NVDA, 200–400% zoom, forced colors and manual reduced-motion emulation. Civi itself adds no movement animation; source review is not a runtime reduced-motion pass.
- No axe/Pa11y suite was installed or introduced.

### Performance

- Captured development responses: Ottawa 0.88 s (warm), Toronto 2.34 s, Hamilton 11.52 s, Kingston 5.72 s, Brampton 9.71 s, Kitchener 11.41 s, Guelph 7.63 s, Mississauga 14.09 s. These are wall times to read complete streamed responses, **not** first paint or Core Web Vitals. Cache state and concurrent requests differ.
- Ottawa's uncompressed development response was approximately 1.29 MB for 135 items; Brampton approximately 1.44 MB for 153. Pagination/windowing is a potential enhancement to measure in production, not a confirmed performance regression.
- Individual eSCRIBE request failures are logged and skipped (`escribe.ts:368` onward), and a failed past calendar can yield an apparently successful partial feed. This is a code-confirmed coverage risk; an upstream outage was not deliberately induced, so no reproduced outage finding is claimed.
- No production browser benchmark, throttled-network measurement, memory leak test or CPU profile was performed. The production build passed.

### Security/privacy

- No exploit was confirmed. No production account, password, deletion, export of personal data, mail send or ingestion write was attempted.
- Public data is rendered as React text in the sampled components. Alert HTML uses escaping. This is evidence of specific safeguards, not proof against every XSS path.
- Ingest's production branch rejects missing `CRON_SECRET` and checks a supplied bearer secret. Account routes derive the user from the session. These guards were reviewed, not penetration-tested against a configured deployment.
- SQL includes RLS on user and public data tables and seeds all eight cities. Enforcement against a live database was not tested.
- Sensitive-data leakage in complete bundles/logs, CSRF behavior, authorization bypass, service-key handling in a configured deployment and rate limiting remain unverified. No vulnerability is inferred solely from those gaps.

### Dependency risk D01

`npm audit --json` reported **7 moderate advisories, 0 high and 0 critical**, associated with the development TypeScript ESLint dependency chain and transitive minimatch. These are not seven independently reproduced exploits. The minimatch advisory is [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), globparts amplification denial of service.

`npm audit --omit=dev --json` reported **0 production dependency advisories**. No package versions or lockfile were changed. Recommended maintenance: update the affected tooling in a separate reviewed change and rerun lint/build; do not use an indiscriminate forced audit fix.

## 8. Prioritized repair plan

| Order | Repair | Resident / rubric impact | Effort | Regression risk |
| --- | --- | --- | --- | --- |
| 1 | F01: remove unsupported open-window claim | High trust and participation impact; P2 functionality / P3 clarity | Small for conditional wording; larger for verified opportunity tracking | Low for wording; medium for new availability logic |
| 2 | F03: synchronize feed controls with history | Core discovery results and accessible state; P2/P3 | Small–medium | Medium: typing, focus and automatic form submission |
| 3 | F04: unify same-tab municipality state | Prevents exploring the wrong city; P2/P3 | Medium | Medium: item URL must retain its own city |
| 4 | F05 + F06: align timeline and badges with outcome evidence | Reduces contradictory civic explanations; P2/P3 | Medium | Medium–high: main, amendment, deferred and information-only outcomes |
| 5 | F02: disclose alert gap, then scope verified delivery | Prevents reliance on notifications that are not connected; P2/S3 | Small disclosure; large full pipeline | High for delivery, consent, deadline and duplicate handling |

Quick follow-ups: F07 city-name mapping and F08 setup template/runtime documentation. D01 is separate development-tool maintenance. No repair was applied during this audit.

## 9. Verification record and evidence

All Node/npm commands used the available runtime prefix:

```sh
PATH="/private/tmp/civiclens-runtime/node-v24.22.3-darwin-arm64/bin:$PATH"
```

The already running `npm run dev` server was reused; it was not stopped or reconfigured by the audit.

| Exact command | Result |
| --- | --- |
| `npm test` | 63 pass, 0 fail, 0 skipped; approximately 252 ms test-runner duration |
| `npm run lint` | Exit 0 |
| `npx tsc --noEmit --incremental false` | Exit 0 |
| `npm run build` | Exit 0; generated 21 static/prerender tasks and emitted the App Router route table |
| `npm run doctor` | Exit 1; 4/8 checks pass. Node and Toronto CKAN pass; public Supabase settings, service key and connectivity unavailable |
| `npm run check-links` | Exit 0; checker reports 26/26 URLs OK. It accepts 301/302 without following final destinations, so this is not verification of all redirect targets |
| `npm audit --json` | Exit 1; 7 moderate development-chain advisories |
| `npm audit --omit=dev --json` | Exit 0; 0 production advisories |
| `git status --short`, `git diff --stat`, `git diff --numstat` | Existing four modified source files identified and preserved |
| `rg --files src/app src/lib src/components scripts` | Route/component inventory |
| `rg -n 'formatDeadlineAlert\|sendAlert\|notification_log\|digest\|exchangeCode\|detectSession\|flowType\|createBrowser' src scripts` | Alert/callback call-site review; formatter/sender have no application callers |

Additional checks used Python's standard-library `urllib.request`, `HTMLParser` and JSON handling. They retrieved local routes without JavaScript execution, followed HTTP redirects, saved complete responses, counted unique item links, and compared official records. These are API/SSR checks, not browser automation. Exact tested URLs and request outcomes are captured in `routes.jsonl` and `detail-search.json`.

Pure-rule reproduction executed twice with Node `--input-type=module`, importing `itemStatus` and `stageBadge` from `./src/lib/item-display.ts` and a board item dated `2026-11-10`, `stage: 'decided'`, `votes: []`, at `2026-11-13T22:00:00-05:00`. Both returned held status plus the decided-board badge (F06).

### Local evidence directory

`/private/tmp/civiclens-audit-20261113/` contains:

- `test.log`, `lint.log`, `types.log`, `build.log`, `doctor.log`, `links.log`;
- `dependencies.json` and `dependencies-production.json`;
- `routes.jsonl`, `route-00.html` through `route-26.html` (the PNG response is stored under the scanner's `.html` suffix; it remains binary);
- `cards.json`, `detail-search.json`, `detail-search-0.html` through `detail-search-8.html`;
- `official-urls.json`, official Ottawa agenda/minutes responses and readable extracts, and `official-kingston-votes.txt`.

These temporary captures are local evidence, not committed artifacts. Core numerical observations and reproduction instructions are embedded in this report so it remains useful without the temporary directory. Browser accessibility snapshots and the phone screenshot were inspected in the tool transcript; no screenshot file was saved, and none is invented here.

### Verification limits

No dedicated formatter, browser E2E or automated accessibility script exists in package scripts. No heavy tools were added. No fixtures or test cases were added to source. Existing tests cover pure functions/parsers and did not detect the client-history defects. Upstream outages, malformed API responses, all extreme-title layouts, real sessions, real email, Safari/Firefox/Edge, tablet and 320 px visual states remain pending. An approval timeout during a device-profile action was a tooling limitation, not a website defect or a safety rejection.

## 10. Rubric impact

The [official Civic Hack criteria](https://fciprojects.ca/hackathons/2026-civic-hack/) emphasize functional, checked output; independent use by novices; and software/code understanding. Using the prompt's P2/P3/S3 shorthand:

- **P2 functionality:** Passing build/tests and eight live feeds are positive evidence. F01/F02 and contradictory outcomes limit confidence in useful, reliable end-to-end behavior.
- **P3 usability:** F03/F04 can send residents to unintended results. Clear unknown-state language and consistent timelines are needed before claiming novice-independent use.
- **S3 code understanding:** Repairs should be explained and tested at the actual boundaries: URL → client controls, shared city state, source evidence → decision labels, and saved preferences → delivery. Parser-only test counts cannot establish those workflows.

No judging score, legal compliance or complete rubric compliance is certified by this audit.

**Audit complete. No source code was modified.**  
**Ready to fix issues on request.**
