# Workshop Questions for Municipal Staff

> [Documentation index](../README.md)

Questions to ask Toronto city staff (and other municipalities) during the workshop.

---

## Data Access

1. **Is there a plan to expose TMMIS agenda data via API or open data?**
   The voting record and meeting schedule are on CKAN; the full agenda item text is not.
   Even a simple endpoint returning item title, committee, meeting date, and comment deadline
   would close the main data gap.

2. **Is there an official RSS or calendar feed for the meeting schedule?**
   An iCal or Atom feed would let us show upcoming agendas without an API.

3. **Are there plans to publish comment submission confirmations as open data?**
   Knowing a comment was received would close the participation loop for residents.

---

## Participation Process

4. **What is the authoritative source for participation deadlines by item type?**
   Chapter 27 gives the general rule (noon the day before). Do Committee of Adjustment,
   LPAT/OLT pre-hearings, and other quasi-judicial hearings have different statutory deadlines
   that we should source separately?

5. **How should we classify items that bypass standing committees?**
   Some items go directly to City Council without a committee stage. How should CivicLens
   show the Say-Window for those?

6. **Which stage has the highest impact on a typical planning item?**
   We assumed committee is highest influence. Is there evidence from the Clerk's Office on
   where public submissions are most likely to change an outcome?

---

## Privacy and Legal

7. **Does the city have a data-sharing agreement template for civic-tech projects that use
   city open data for public benefit?**

8. **Are there accessibility requirements (AODA) for third-party apps that display city data?**
   We follow semantic HTML and color-contrast guidelines; want to confirm we meet the threshold.

9. **What is the city's position on scrapers that read public agenda pages (not open data)?**
   The robots.txt on `secure.toronto.ca` returns 403 (can't be read). Knowing the official policy
   would help us decide whether to pursue HTML parsing as a fallback for agenda text.

---

## Scaling to Other Municipalities

10. **Which Ontario municipalities are most interested in improving digital civic engagement?**
    We designed for multi-municipality from the start (platform adapter pattern).
    Knowing which cities to target next would help prioritize.

11. **Is there a provincial or federation-level initiative to standardize meeting management
    data formats across municipalities?**
    A common open data schema (like a "TMMIS standard") would make adapters trivially easy to write.
