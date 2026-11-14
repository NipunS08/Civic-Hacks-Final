# LIMITATIONS.md — Known Limitations and Risks

> [Documentation index](../README.md)

## Data Limitations

### 1. Toronto — no upcoming agenda items (confirmed 2026-11-12)
Toronto's CKAN datasets contain:
- Meeting Schedule: 1,445 meetings — but the most recent entry is **2026-11-10**. There are
  **zero future-dated meetings** in this dataset as of 2026-11-12. The dataset appears to only
  include confirmed/past meetings, not scheduled future ones.
- Voting Records: 46,815 rows — but only appear *after* a vote has been recorded.

**Impact**: The Toronto feed shows only decided items. No upcoming Toronto meeting agendas are
accessible via open data.

**Mitigation**: Ottawa (eScribe) is now the primary city — it shows UPCOMING meetings with real
agenda items. Toronto is the secondary city (past decisions only).

**Future path**: If Toronto opens TMMIS to programmatic access, the Toronto adapter would add
`fetchUpcomingItems()` without changing the UI.

### 2. No item descriptions
Full agenda text (recommendations, background, attachments) is not available in Toronto Open Data.
Only titles are shown. Users must click through to the TMMIS source to read the full item.

**Impact**: The "plain language summary" feature described in the requirements cannot be implemented
with actual text — there's nothing to summarize.

### 3. No participation deadlines are shown
Since 2026-11-13 CivicLens never calculates a deadline from a meeting date. It only shows
participation links the official page exposes, plus each city's official guide.

**Impact**: Residents must open the official page to see the actual deadline.

### 3a. Hamilton recorded votes are unavailable
Hamilton publishes minutes only as PDF/Word attachments behind a Cloudflare browser
challenge (HTTP 403 to scripts). We don't work around it, so Hamilton items show
"No recorded vote in our sources".

### 3b. Mississauga portal is slow
Mississauga's eSCRIBE calendar API took 20–35 s per request (and returned some HTTP 500s)
on 2026-11-13. The feed shows "Couldn't load Mississauga data. Try again" when it times out.

### 4. Recorded votes only
The CKAN voting record dataset includes only recorded votes. Per the dataset documentation:
"Votes generated in the report are recorded votes only. Under Article 12 of the Council
Procedures by-law, the City Clerk may be asked to record a vote for specific types of motions."
A missing vote record does not mean a vote did not happen.

**Impact**: Some decided items may not appear in the feed.

### 5. No geocoded agenda items
Ward and address information are not available in open data for agenda items. The "near me"
filtering and map features described in the requirements are not yet implemented.

---

## Technical Limitations

### 6. CKAN `datastore_search_sql` returns 403
The SQL query endpoint on Toronto's CKAN (`/api/3/action/datastore_search_sql`) is blocked.
This prevents filtering by date range server-side. Workaround: sort by `_id desc` and
filter client-side (acceptable at this scale).

### 7. `datastore/dump` returns 403
Bulk CSV exports from CKAN are blocked. We must use paginated `datastore_search` instead.
This means ingesting all 46,815 voting records requires ~47 API calls.

### 8. Next.js fetch cache 2MB limit
CKAN responses over 2MB cannot be cached by Next.js's Data Cache. We work around this
by fetching at most 1,000 rows per request (safe size). The trade-off is fewer agenda items
visible in the feed per request.

---

## Security Assumptions

### 9. Supabase RLS as primary access control
Row-Level Security policies are the main enforcement layer for user data isolation.
If a Supabase security advisory disables RLS or changes policy evaluation, user data
could be exposed. Mitigation: audit RLS policies before launch; subscribe to Supabase
security advisories.

### 10. No rate limiting on signup
Supabase's built-in email auth rate limits (default: 3 signup emails per hour per email)
protect against abuse, but custom IP-based rate limiting is not implemented in this app.
Not needed for a hackathon demo; required before public launch.

### 11. CSRF on sign-out form
The sign-out form (`/api/auth/signout`) uses POST but does not validate a CSRF token.
Supabase sessions use `httpOnly` cookies, which limits the impact. Add CSRF validation
(e.g., via the `csrf` package or Supabase's built-in protection) before public launch.

---

## Privacy Assumptions

### 12. PIPEDA compliance
This app collects email and optional location from Canadian residents. We follow PIPEDA
principles (minimum collection, stated purpose, explicit consent for alerts). A formal
Privacy Impact Assessment has not been conducted. Confirm with legal counsel before launch.

### 13. CASL consent records
Consent is recorded in `channel_consent` with a hashed IP. We haven't validated that this
meets all CASL evidentiary requirements for proving express consent. Legal review required.

### 14. Supabase data region
Default Supabase projects are in `us-east-1` (Virginia). For strict Canadian data residency,
the project must be created in `ca-central-1`. See the [optional backend setup](../setup/SETUP.md).

---

## Accuracy Risks

### 15. AI summaries (not yet implemented)
When/if AI summaries are added, they must be labeled "AI summary, verify at source"
and shown next to the original text. The LLM may hallucinate details that differ from
the actual item. Never use the LLM for dates, deadlines, or legal interpretations.

### 16. Stage inference accuracy
The `classifyCommittee()` and `inferStage()` functions use string matching on committee names.
A newly renamed committee, or a committee type not in the lookup table, falls through to
`unknown` stage. Judges should be aware that the stage shown is an inference, not confirmed.

---

## What is Not Built

- Map / location-based filtering (ward extracted from titles; coordinate geocoding not implemented)
- Full-text search on agenda items (eScribe doesn't expose item descriptions via GET)
- Alert dispatch cron job (architecture is built; needs wiring to a scheduler)
- Telegram, Bluesky, RSS channels (channel interface is in place; modules not written)
- PWA manifest / offline support
- Automated tests (fixtures saved; test harness not written)
- Other eScribe cities (London, Brampton, Mississauga) — only Ottawa is registered; adapter works for all
