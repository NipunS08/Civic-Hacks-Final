# ADAPTERS.md — Platform Adapter Documentation

> [Documentation index](../README.md)

## What is a Platform Adapter?

A platform adapter is a module that knows how to fetch data from one municipal
data system and normalize it into CivicLens's common schema.

**Design principle**: One adapter covers all municipalities on the same platform.
Adding a new city means registering it with an existing adapter, not writing new code.

Adapters live in `src/lib/adapters/`. Each exports:
- `fetchMeetings()` — returns `Meeting[]`
- `fetchAgendaItems()` — returns `{ items: AgendaItem[], votes: VoteRecord[] }`

---

## Adapter 1: Toronto Open Data (toronto-opendata)

**Municipality**: Toronto, ON  
**Platform**: City of Toronto Open Data (CKAN)  
**File**: `src/lib/adapters/toronto-opendata.ts`

### Official Portal
https://www.toronto.ca/city-government/council/

### How we discovered the endpoints

1. Searched `ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_search?q=council`
2. Found two active datasets:
   - **City Council and Committees Meeting Schedule Reports** (ID: `3bfab808-105b-45ab-8d92-cf1916594653`)
   - **Members of Toronto City Council – Voting Record** (ID: `7f5232d6-0d2a-4f95-864a-417cbf341cc4`)
3. Identified the CKAN Datastore resource IDs within each dataset.

### Confirmed Working Endpoints

#### Meeting Schedule
- **Datastore resource ID**: `08c8aedb-afba-41f5-830e-bbfb305ebbc7`
- **Example request**:
  ```
  GET https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search
    ?id=08c8aedb-afba-41f5-830e-bbfb305ebbc7
    &limit=5
    &sort=Date+desc
    &filters={"Term":"2022-2026"}
  ```
- **Response shape**:
  ```json
  {
    "success": true,
    "result": {
      "total": 1445,
      "fields": [
        {"id":"_id"}, {"id":"Term"}, {"id":"Committee"},
        {"id":"MTG #"}, {"id":"Date"}, {"id":"Start Time"},
        {"id":"End Time"}, {"id":"Location"}
      ],
      "records": [
        {
          "_id": 487,
          "Term": "2022-2026",
          "Committee": "CreateTO",
          "MTG #": "28",
          "Date": "2026-11-10",
          "Start Time": "13:30 PM",
          "End Time": "18:00 PM",
          "Location": "Committee Room 1, City Hall/Video Conference"
        }
      ]
    }
  }
  ```
- **Licence**: Open Government Licence – Toronto
- **Refresh rate**: "As available" (City Clerk's Office updates after each approved schedule)

#### Voting Records (source of agenda items)
- **Datastore resource ID**: `55ead013-2331-4686-9895-9e8145b94189`
- **Example request**:
  ```
  GET https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search
    ?id=55ead013-2331-4686-9895-9e8145b94189
    &limit=5
    &sort=_id+desc
  ```
- **Response shape**:
  ```json
  {
    "success": true,
    "result": {
      "total": 46815,
      "fields": [
        {"id":"_id"}, {"id":"Term"}, {"id":"First Name"}, {"id":"Last Name"},
        {"id":"Committee"}, {"id":"Date/Time"}, {"id":"Agenda Item #"},
        {"id":"Agenda Item Title"}, {"id":"Motion Type"}, {"id":"Vote"},
        {"id":"Result"}, {"id":"Vote Description"}
      ],
      "records": [
        {
          "_id": 46815,
          "Term": "2022-2026",
          "First Name": "Dianne",
          "Last Name": "Saxe",
          "Committee": "Toronto Transit Commission",
          "Date/Time": "2026-08-05",
          "Agenda Item #": "2026.TTC17.1",
          "Agenda Item Title": "Fitness For Duty Grievance Update",
          "Motion Type": "Amend Item",
          "Vote": "Yes",
          "Result": "Carried, 5-3",
          "Vote Description": "Majority required"
        }
      ]
    }
  }
  ```
- **Licence**: Open Government Licence – Toronto
- **Refresh rate**: "As available" — updated after minutes are published for each meeting

### Robots.txt and Terms of Use

- `ckan0.cf.opendata.inter.prod-toronto.ca`: No robots.txt restrictions. CKAN API is explicitly
  designed for automated programmatic access. Licence: Open Government Licence – Toronto.
- `secure.toronto.ca/robots.txt`: Returns **403** — cannot be verified.
  All endpoints on this domain also return 403 from automated requests.
  **Conclusion**: We treat this domain as not permitting automated access and do not access it.
- `www.toronto.ca`: Standard corporate web robots.txt. CivicLens only reads specific public
  pages (Have Your Say) and does not crawl or index the site.

### Blocked Sources (investigated, not used)

| URL | Status | Notes |
|-----|--------|-------|
| `secure.toronto.ca/council/agenda-item.do?item=…` | 403 Akamai WAF | Official TMMIS agenda item page — works in browser, blocked from scripts |
| `secure.toronto.ca/nm/api/v1/public/notices` | 403 Akamai WAF | Public notices API — would have provided comment deadlines |
| `app.toronto.ca/tmmis/findAgendaItem.do` | 403 Akamai WAF | Older TMMIS endpoint |
| `ckan0.../api/3/action/datastore_search_sql` | 403 | SQL query endpoint disabled for security |
| `ckan0.../datastore/dump/{id}` | 403 | Bulk CSV dump endpoint — disabled |

**Note**: We do not attempt to bypass these blocks. Source links in CivicLens point to
`secure.toronto.ca/council/agenda-item.do` as the official reference — these open correctly
in a browser.

### Refresh Strategy

- Meeting schedule and voting records are fetched on demand via Next.js fetch cache (TTL: 15 min).
- `/api/ingest` route can populate Supabase DB for persistent storage and alert matching.
- Recommended cron schedule: every 6 hours (City Clerk publishes minutes within days of a meeting).

### Known Failure Modes

1. **CKAN API unavailable**: `ckanFetch()` throws, the feed shows an error banner. Items are
   not cached in Supabase without a successful ingest run.
2. **Agenda item text missing**: Full item descriptions are not in open data. Title-only display
   is the fallback with a note directing users to the source.
3. **Stage inference errors**: Committee codes are matched by string patterns in `classifyCommittee()`.
   New committee names may not match — they fall back to `unknown` stage.

### Real fixture files

Saved from live API calls on 2026-11-13:
- `fixtures/toronto-meetings-sample.json` — 5 most recent meetings
- `fixtures/toronto-votes-sample.json` — 10 most recent vote records

---

## Adapter 2: eSCRIBE — Ottawa, Hamilton, Kingston, Brampton, Kitchener, Guelph, Mississauga (escribe)

**Municipalities**: every city in `src/lib/cities.ts` with an `escribeBase` (one adapter, configured by base URL — rule 14)  
**Platform**: eScribe Software Ltd. — used by Ottawa, London, Brampton, Mississauga, Kingston, and others  
**File**: `src/lib/adapters/escribe.ts`  
**Portal**: `https://pub-ottawa.escribemeetings.com/`

### How we discovered the endpoints

1. Fetched `https://pub-ottawa.escribemeetings.com/MeetingsCalendarView.aspx` and saved the HTML.
2. Searched for AJAX calls in the page source; found:
   ```
   data: "{'calendarStartDate':'" + info.startStr + "','calendarEndDate':'" + info.endStr + "'}",
   url: "/MeetingsCalendarView.aspx/GetCalendarMeetings" + window.location.search
   ```
3. Confirmed with a manual POST call returning 27 meetings (Nov–Dec 2026).
4. For agenda items: fetched meeting detail page HTML and found server-rendered `AgendaItemTitle` elements
   plus an inline `var PublicCommentSettings = [{Id, AllowPublicComment}]` JSON object.

### Confirmed Working Endpoints

#### Meeting Calendar

- **Endpoint**: `POST https://pub-ottawa.escribemeetings.com/MeetingsCalendarView.aspx/GetCalendarMeetings`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {"calendarStartDate":"2026-11-01","calendarEndDate":"2026-12-31"}
  ```
- **Response shape** (abbreviated):
  ```json
  {
    "d": [
      {
        "ID": "5c1671ce-db0b-4cfa-a81f-c1bfa1c09326",
        "MeetingName": "Committee of Adjustment - Panel 1",
        "MeetingType": "Committee of Adjustment - Panel 1",
        "StartDate": "2026/11/18 13:00:00",
        "EndDate":   "2026/11/18 17:00:00",
        "Location": "110 Laurier Avenue West",
        "HasAgenda": true,
        "MeetingPassed": false,
        "AllowPublicComments": false,
        "DelegationRequestLink": "",
        "MeetingDocumentLink": [
          {"Type":"Agenda","Format":"HTML","Url":"/Meeting.aspx?Id=...&Agenda=Agenda&lang=English"},
          {"Type":"Agenda","Format":".pdf","Url":"/FileStream.ashx?DocumentId=…"}
        ]
      }
    ]
  }
  ```
- **Confirmed**: 27 meetings returned for Nov–Dec 2026 on 2026-11-12.

#### Agenda Items (HTML parse)

- **Endpoint**: `GET https://pub-ottawa.escribemeetings.com/Meeting.aspx?Id={uuid}&Agenda=Agenda&lang=English`
- **Response**: HTML page. CivicLens parses:
  - `class='AgendaItem AgendaItem{N}'` → integer item ID
  - `class='AgendaItemTitle' > a` → item title
  - `var PublicCommentSettings = [{"Id":N,"AllowPublicComment":bool}]` → per-item comment flag
- **Example agenda items from COA Panel 1 (Nov 18, 2026)**:
  ```
  292 Lyon (Ward 14 - Somerset)
  319 Selby (Ward 15 - Kitchissippi)
  563 Churchill (Ward 15 - Kitchissippi)
  319 Spartan (Ward 12 - Rideau-Vanier)
  ```
- Ward is extractable from title text like `(Ward 14 - Somerset)`.
- Item descriptions are read from each item’s own `AgendaItemDescription RichText` block, when present. Nested markup is converted to plain text; missing or malformed blocks remain empty.
- Descriptions supply the detail-page overview. Impact and delivery-timing paragraphs are shown verbatim as source excerpts, preserving uncertainty. A reporting period is not an implementation date. Attached PDFs are linked through the official agenda; no PDF text is inferred when automated access is blocked.

### Robots.txt

`https://pub-ottawa.escribemeetings.com/robots.txt` only disallows `PetalBot`.
No restrictions apply to general automated user agents. Confirmed 2026-11-12.

### Participation (no inferred deadlines)

The earlier version estimated Ottawa delegation deadlines from the meeting date
(Procedure By-law 2016-377 s.70). **That was removed on 2026-11-13**: the project
rule is now "never infer a submission or delegation deadline from a meeting date".
The adapter only records participation links the official page exposes:

- `DelegationRequestLink` on the calendar meeting object (empty on all 7 portals as of 2026-11-13)
- per-item `AllowPublicComment` flags in `var PublicCommentSettings = […]` (all `false` as of 2026-11-13)
- links inside an item's agenda text that point to delegation / comment pages (e.g. Guelph)

Each city's general participation guide (verified URLs in `src/lib/cities.ts`) is linked from the item page.

### Minutes and recorded votes (`src/lib/adapters/escribe-minutes.ts`)

For past meetings the adapter reads `Meeting.aspx?Id=…&Agenda=PostMinutes&lang=English`
when published (HTML). Agenda item ids are the same in the agenda and the minutes.
Each `li.AgendaItemMotion` contains `MovedBy`, `SecondedBy`, `MotionText`, a
`table.MotionVoters` (label cell + names cell per row) and `MotionResult`.

| City | Vote labels seen | HTML minutes? |
|---|---|---|
| Ottawa | `For (n)` / `Against (n)` | Yes — most motions carried without a named vote |
| Guelph | `Voting in Favour: (n)` | Yes — electronic voting, most motions named |
| Kitchener | `In Favour (n)` | Yes |
| Mississauga | `YES (n)` / `ABSTAIN (n)` | Yes |
| Brampton | (none in sample) | Yes |
| Kingston | — | Not used: votes come from Open Data Kingston (Adapter 4) |
| **Hamilton** | — | **No.** Minutes are PDF/Word attachments served from `/FileStream.ashx`, which returns **HTTP 403 with a Cloudflare browser challenge** to scripts. Per rule 13 we do not work around it, so Hamilton shows agendas only and the UI says "No recorded vote in our sources". |

Labels are kept as published and mapped to `for / against / absent / abstain / other`.
Motions are classified `main / amendment / procedural`; "as amended" stays `main`.

### Titles and codes

Hamilton uses report codes as agenda titles (`GIC 26-013`, `FCS26076`, `AUD21004(f)`).
`splitTitle()` moves these to `official_code` (shown as a small "Item ID") and uses the
first line of the item description as the headline. Guelph's trailing report numbers
(`… - 2026-384`) are handled the same way.

### Politeness

All requests go through `src/lib/adapters/http.ts`: identifying User-Agent, one request
at a time per host with a 350 ms pause, 45 s timeout, 15-minute in-memory cache.
Per city: 2 calendar requests + up to 8 upcoming agendas + up to 6 past minutes pages.

### Portals verified 2026-11-13

| City | Base URL | robots.txt |
|---|---|---|
| Ottawa | https://pub-ottawa.escribemeetings.com | only disallows PetalBot |
| Hamilton | https://pub-hamilton.escribemeetings.com | only disallows PetalBot |
| Kingston | https://pub-cityofkingston.escribemeetings.com | only disallows PetalBot |
| Brampton | https://pub-brampton.escribemeetings.com | only disallows PetalBot |
| Kitchener | https://pub-kitchener.escribemeetings.com | only disallows PetalBot |
| Guelph | https://pub-guelph.escribemeetings.com | only disallows PetalBot |
| Mississauga | https://pub-mississauga.escribemeetings.com | only disallows PetalBot (calendar API slow: 20–35 s per request on 2026-11-13; intermittent HTTP 500s) |

### Real fixture files

- `fixtures/ottawa-meetings-sample.json`, `fixtures/ottawa-coa-panel1-sample.json` (2026-11-12)
- `fixtures/escribe/*-council-minutes-*.html` — Ottawa, Guelph, Kitchener, Mississauga minutes (2026-11-13)
- `fixtures/escribe/hamilton-council-agenda-2026-10-07.html`, `hamilton-calendar-sample.json`

### Adding another eSCRIBE city

Add one entry to `CITIES` in `src/lib/cities.ts` (id, name, `escribeBase`, item prefix,
calendar URL, verified participation URL or `null`). Nothing else is needed.

---

## Adapter 4: Open Data Kingston (kingston-opendata)

**File**: `src/lib/adapters/kingston-opendata.ts`  
**Portal**: https://opendatakingston.cityofkingston.ca (ArcGIS Hub)

| Dataset | ArcGIS item | Use |
|---|---|---|
| Council Voting Records | `faa1ad2a7b064353ba34103188de486a` | one row per member per recorded vote → one decided item per (date, agenda description) |
| Mayoral Decision Registry | `d221183ed74940118e974917076ece9b` | strong-mayor decisions, badged "Mayoral decision" |
| Pecuniary Interest Registry | `4fcd4ae20f5f4decad358f31b7a9a0cd` | found, not used yet |

Query endpoint: `https://services1.arcgis.com/5GRYvurYYUwAecLQ/arcgis/rest/services/{name}/FeatureServer/0/query`
(fields: `Meeting_Type, Vote_Date, Agenda_Description, Council_Member, Vote, Decision`).
11,051 vote rows on 2026-11-13, newest from 2026-10-06. Vote values seen: `Yea`, `Yay`, `Nay ` (trailing space), `Absent`, null.

- **Terms**: City of Kingston Open Data Licence (attribution, no warranty).
- **robots.txt** on the hub asks for `Crawl-delay: 60`; we don't crawl the hub — data comes from `services1.arcgis.com`, one request per dataset per 15 minutes.
- No per-vote URL exists, so each item's source is the dataset page, plus the Kingston eSCRIBE council meeting on the same date when one exists.
- Mayoral decisions without a published `Date` are skipped (we never invent a date).
- Fixture: `fixtures/kingston/council-voting-records-2026-09-15.json`.

---

## Adapter 5: CivicWeb (planned, not built)

CivicWeb is used by smaller Ontario municipalities. Similar approach to eScribe.

---

## Adding a New Adapter

1. Create `src/lib/adapters/{platform}.ts`
2. Export `fetchMeetings()` and `fetchAgendaItems()` matching the shapes in `src/types/index.ts`
3. Add an entry in `municipalities` table (via SQL or migration)
4. Register the adapter in the ingest route (`src/app/api/ingest/route.ts`)
5. Add a row to this file documenting the endpoint, robots.txt, and known limitations
