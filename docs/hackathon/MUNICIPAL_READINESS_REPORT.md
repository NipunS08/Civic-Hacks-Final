# Municipal Readiness Report — CivicLens

> [Documentation index](../README.md)

**One-page summary for municipal staff and decision-makers.**

---

## Who would use this

**Residents**: Anyone who wants to know what their city council is deciding and when they can
weigh in — without needing to monitor the city website or decode procedural jargon.

**Municipal staff (Clerk's Office)**: A transparency tool that extends the city's own public
engagement goals. No new data infrastructure needed — CivicLens reads from existing open data.

**Community organizations**: Neighbourhood associations, advocacy groups, and civic educators
who want to alert their members about relevant items and deadlines.

---

## What data and resources are needed

| Required | Source | Effort |
|----------|--------|--------|
| Meeting schedule open data | Toronto Open Data — already published | None (exists) |
| Voting record open data | Toronto Open Data — already published | None (exists) |
| Access to full agenda text | Currently blocked (TMMIS WAF) | City IT policy change |
| Participation deadline data | Toronto.ca Have Your Say page | Manual extraction → automate if API opens |

**Ideal addition**: The City of Toronto's TMMIS system could expose a read-only API (even a
simple endpoint returning agenda item titles, committee, meeting date, and comment deadline)
that would close the main data gap. This requires a City IT decision, not new technology.

---

## Rough cost to run

| Component | Cost |
|-----------|------|
| Supabase (database + auth) | Free tier adequate for <50K users/month; Pro plan $25/month above that |
| Vercel (hosting + cron) | Free tier for hobby; Pro $20/month for production SLAs |
| Resend (email alerts) | Free: 3,000 emails/month; $20/month for 50,000 |
| Development and maintenance | Civic-tech volunteer / city partnership |
| **Total (hobby/demo)** | **$0–$45/month** |

---

## Privacy considerations for residents

- CivicLens collects only an email address and optional location (stored as a geographic point,
  not a street address).
- Alerts require explicit opt-in (CASL compliance). Every email includes an unsubscribe link.
- Account deletion removes all personal data.
- Full privacy notice: [civiclens.ca/privacy](#) ← (placeholder until deployed)

**What residents should know before signing up**:
1. Your email is used only for the alerts you choose.
2. If you provide a postal code, we convert it to a geographic area (ward) — the raw text
   is not stored.
3. You can delete your account and all data at any time from account settings.

---

## How other municipalities could adopt this

CivicLens is built on a **platform adapter pattern**. Adding a new municipality requires:

1. **If the municipality uses eScribe, CivicWeb, or Legistar**: Write ~100 lines of adapter
   code once and register every city on that platform. No repeated work.

2. **If the municipality has its own open data portal**: Write a custom adapter that reads
   their dataset format. The feed, Say-Window, and alerts work automatically.

3. **If no structured data exists**: CivicLens can scrape public HTML agendas (respectfully,
   with rate limiting), but this is fragile and requires municipal terms-of-use review.

**Minimum viable municipal partnership**:
- Publish meeting schedule and agenda item titles as open data.
- Provide a "how to participate" page with standard deadlines.
- CivicLens does the rest.

---

## What we'd want to know from municipal staff

1. Is there a plan to open TMMIS agenda data to programmatic access (API or open data)?
2. Is there an official RSS or calendar feed for the meeting schedule?
3. What is the authoritative source for participation deadlines by item type (committee, CoA, etc.)?
4. Does the city have a data-sharing agreement template for civic-tech projects?
5. Are there accessibility requirements for public-facing apps that display council data?

---

## Known assumptions to verify with the city

- Procedural stages in the Say-Window are derived from Toronto Municipal Code Chapter 27.
  Confirm with the City Clerk's Office that the stage transitions shown are correct.
- Participation deadlines ("noon the day before") are from Chapter 27.
  Specialized hearings (Committee of Adjustment, Ontario Land Tribunal appeals) may differ.
- Legal notice radii for planning applications are assumed from Planning Act O. Reg. 544/06.
  Not yet implemented; confirm before showing to residents.
