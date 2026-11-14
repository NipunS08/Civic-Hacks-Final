# Demo Script — CivicLens (2–3 minutes)

> [Documentation index](../README.md)

**Audience**: Hackathon judges and workshop participants.

---

## 0:00 — The problem (20 seconds)

> "Every week, Toronto's city council and a dozen committees decide things that affect
> how you live — your neighbourhood's density, transit routes, parking rules.
> The decisions are public, but they're buried in long agenda documents with procedural
> jargon, and by the time most people hear about something, the window to comment
> has already closed."

> "CivicLens answers one question for every resident: what is my city deciding right now,
> and when is my last chance to say something about it?"

---

## 0:20 — Live data (30 seconds)

> "Every item you see here is real. It comes directly from Toronto Open Data — the same
> official datasets the city publishes. Nothing is mocked up."

Open `http://localhost:3000/feed`

> "Here's the public feed. These are actual agenda items from Toronto committees — names,
> committees, dates, vote outcomes. Each card shows a source link so you can verify
> everything directly at the city's website."

Point to a card → show the SourceLink ("Source: Toronto City Council · Last checked: …")

> "Scroll to any item. Notice the stage badge: 'At Committee'. That means this item is
> still in a stage where your input can change the outcome."

---

## 0:50 — Say-Window (60 seconds)

Click an item in the feed to open its detail page.

> "This is the Say-Window — CivicLens's differentiating feature."

Point to the stage pipeline at the top.

> "Four stages: committee, city council, appeal, decided. This item is at committee —
> the highest-influence stage."

Point to the influence badge ("High influence").

> "Here's what that means in plain language: at committee, members can amend the item,
> refer it back, or reject it. You can speak at the meeting, or submit a written comment.
> At city council, written comments are still accepted but it's harder to change the outcome."

Point to the participation cards.

> "The deadline rule comes directly from Toronto's Procedure By-law, Chapter 27:
> 'written comments must be received by 12:00 noon on the business day before the meeting.'
> We show you the source excerpt, not just a number we made up."

---

## 1:50 — Accounts and alerts (30 seconds)

Navigate to `/auth/signup`

> "Residents can create an account with just email and password. Email verification is
> required before alerts are sent — that's both good security practice and CASL compliance."

Navigate to `/account` (or mock with the description)

> "In account settings, you opt in to email alerts — explicit consent per CASL.
> You choose your ward, topic keywords, and whether you want immediate alerts or a daily digest."

> "In development, alerts print to the terminal. When you add a Resend API key, they go
> to real email. The same formatting, source links, and unsubscribe notice — same code."

---

## 2:20 — How it scales (20 seconds)

> "The Toronto adapter is about 200 lines. The core app — feed, item detail, say-window,
> alerts — is adapter-agnostic. Adding eScribe (which powers Ottawa, Brampton, Mississauga)
> means one new adapter file and registering those cities in a table."

> "We're not building a Toronto scraper. We're building a civic data platform."

---

## 2:40 — The data gap we're honest about (10 seconds)

> "The one thing we can't show yet is the full agenda text, because Toronto's TMMIS portal
> blocks automated access. We document this clearly — blocked sources are listed on the
> Sources and Data page — and we link users directly to the official page so they can
> read it themselves."

> "Being honest about what the data can and can't do is as important as the feature itself."

---

## 2:50 — Close

> "CivicLens: real data, honest about its limits, built to scale.
> Questions?"

---

## Fallback / Q&A talking points

**Q: How do you know the stage of an item?**
> We infer it from the committee name in the voting record (e.g., 'City Council' = decided;
> 'Planning and Housing Committee' = committee stage). We label it as an inference from
> the Procedure By-law and always link to the source.

**Q: What if Toronto changes their API?**
> The adapter has a known failure mode: if the CKAN resource ID changes, the ingest fails
> with a clear error message. The check-links script would catch a broken dataset URL.
> We designed for transparency over resilience — we tell you when something breaks.

**Q: Why not just scrape secure.toronto.ca?**
> `secure.toronto.ca` is protected by Akamai WAF, which blocks all automated requests.
> We investigated it, documented the 403 response, and moved on. We don't try to evade
> security controls.

**Q: PIPEDA compliance?**
> We collect the minimum: email and optional location stored as a point, not text.
> We flag it as an assumption in LIMITATIONS.md that legal review is needed before launch.
