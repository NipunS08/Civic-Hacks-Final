# CREDITS.md / AI_USAGE.md

> [Documentation index](../README.md)

## Libraries and Frameworks

| Library | Version | Licence | Purpose |
|---------|---------|---------|---------|
| Next.js | 16.4.6 | MIT | Full-stack React framework (App Router) |
| React | 19.3.0 | MIT | UI rendering |
| TypeScript | 5.x | Apache 2.0 | Type safety |
| Tailwind CSS | 4.3.3 | MIT | Utility-first CSS |
| @supabase/supabase-js | 2.x | MIT | Supabase client (database + auth) |
| @supabase/ssr | 0.12.x | MIT | Cookie-based session management for Next.js |
| ts-node | 10.9.x | MIT | Run TypeScript scripts directly |
| dotenv | 18.x | BSD-2-Clause | Load .env files |
| Node.js https | built-in | MIT | HTTP requests in check-links.ts, doctor.ts |
| resend | (optional) | MIT | Transactional email delivery |

---

## Open Data

| Dataset | Provider | Licence |
|---------|----------|---------|
| City Council and Committees Meeting Schedule Reports | City of Toronto Open Data | Open Government Licence – Toronto |
| Members of Toronto City Council – Voting Record | City of Toronto Open Data | Open Government Licence – Toronto |
| Toronto Open Data CKAN API | City of Toronto | Open Government Licence – Toronto |

Licence text: https://open.toronto.ca/open-data-licence/

---

## AI Assistance

This project was built with significant assistance from an **AI coding assistant**
acting as a senior full-stack engineer.

### What AI generated
- Full code structure, component implementations, and all TypeScript/TSX files
- Database schema (`schema.sql`) and RLS policies
- Toronto Open Data adapter logic (endpoint selection, response parsing, deduplication)
- Alert channel interface and retry logic
- All documentation files (ADAPTERS.md, ARCHITECTURE.md, CODE_WALKTHROUGH.md, SETUP.md, etc.)
- Build error diagnosis and fixes (Next.js 16 compatibility issues)

### What the developer verified / directed
- Data source investigation: which Toronto endpoints actually work vs. return 403
- Decisions about data gaps (what to show when full text is unavailable)
- Confirmation that the CKAN API calls produce real data (reviewed fixture files)
- Architecture decisions confirmed: Supabase, CKAN-first, adapter pattern
- Code reviewed before commit

### How to verify AI-generated code
Every file has inline comments explaining the logic.
[Code walkthrough](../architecture/CODE_WALKTHROUGH.md) explains every module in plain English.
The git history shows the full build sequence.

### AI tools used
- An AI coding assistant (command-line tool)

---

## Algorithms

- **sha256 content hashing** (`crypto` module, Node.js built-in): used to detect real changes
  in agenda items so users are not re-alerted on unchanged content.
- **Exponential back-off**: alert retry waits 1s → 2s → 4s. Standard retry pattern.
- **Committee code inference**: string matching against known Toronto committee names. Not ML,
  purely pattern matching. Documented as an assumption.

---

## References

- Toronto Municipal Code, Chapter 27 (Procedure By-law):
  http://www.toronto.ca/legdocs/municode/1184_027.pdf
- Toronto Open Data Licence:
  https://open.toronto.ca/open-data-licence/
- Supabase Auth docs:
  https://supabase.com/docs/guides/auth/server-side/nextjs
- CASL (Canada's Anti-Spam Legislation):
  https://crtc.gc.ca/eng/internet/anti.htm
- PIPEDA (Personal Information Protection and Electronic Documents Act):
  https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
- Next.js App Router documentation:
  https://nextjs.org/docs
