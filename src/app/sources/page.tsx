// Sources & data — where each city's information comes from, how fresh it is,
// and what's missing. Technical details (endpoints, robots.txt, blocked sources)
// live in ADAPTERS.md and README.md for developers.

import { CITIES } from "@/lib/cities";
import { KINGSTON_MAYORAL_DATASET, KINGSTON_VOTES_DATASET } from "@/lib/adapters/kingston-opendata";

export const metadata = {
  title: "Sources & data — CivicLens",
  description: "Where CivicLens gets each city's information, how often it is checked, and what is missing.",
};

// Date every source below was last confirmed to load and return the data described
const SOURCES_VERIFIED = "November 13, 2026";

const VOTES: Record<string, { label: string; url: string | null; note: string }> = {
  ottawa: { label: "Meeting minutes (eSCRIBE)", url: null, note: "Named votes when council records one; most decisions have no recorded vote." },
  toronto: { label: "Members of Toronto City Council Voting Record", url: "https://open.toronto.ca/dataset/members-of-toronto-city-council-voting-record/", note: "Every recorded vote by member. Items appear only after a vote." },
  hamilton: { label: "Not available", url: null, note: "Minutes are PDF attachments that the portal blocks from automated download (HTTP 403). We don't work around this." },
  kingston: { label: "Council Voting Records (Open Data Kingston)", url: KINGSTON_VOTES_DATASET, note: "Every recorded vote by member, plus the Mayoral Decision Registry." },
  brampton: { label: "Meeting minutes (eSCRIBE)", url: null, note: "Named votes when recorded; many motions show only the result." },
  kitchener: { label: "Meeting minutes (eSCRIBE)", url: null, note: "Named votes when recorded; many motions show only the result." },
  guelph: { label: "Meeting minutes (eSCRIBE)", url: null, note: "Guelph records votes electronically, so most motions list each member." },
  mississauga: { label: "Meeting minutes (eSCRIBE)", url: null, note: "Recorded votes on most Council motions." },
};

export default function SourcesPage() {
  return (
    <>
      <section className="cl-pagehero">
        <div className="cl-wrap">
          <div className="cl-pagehero-inner">
            <p className="cl-eyebrow">Sources &amp; data</p>
            <h1 className="cl-h1">Where our information comes from</h1>
            <p className="cl-lead">
              Everything on CivicLens comes from information the cities publish themselves. Every item links back to
              its official page and shows when we last checked it.
            </p>
          </div>
        </div>
      </section>

      <section className="cl-wrap" style={{ paddingTop: 32, paddingBottom: 56, display: "grid", gap: 24 }} aria-labelledby="by-city">
        <div>
          <h2 id="by-city" className="cl-h3">Sources by city</h2>
          <p className="cl-muted" style={{ fontSize: 15 }}>
            Data is fetched live and cached for up to 15 minutes. Sources last verified: {SOURCES_VERIFIED}.
          </p>
        </div>
        <div className="cl-table-wrap" role="region" aria-labelledby="by-city" tabIndex={0}>
          <table className="cl-table">
            <thead>
              <tr>
                <th scope="col">City</th>
                <th scope="col">Agendas &amp; items</th>
                <th scope="col">Recorded votes</th>
                <th scope="col">How to take part</th>
              </tr>
            </thead>
            <tbody>
              {CITIES.map(c => {
                const v = VOTES[c.id];
                return (
                  <tr key={c.id}>
                    <th scope="row">{c.name}</th>
                    <td>
                      {c.escribeBase
                        ? <a href={c.calendarUrl} target="_blank" rel="noopener noreferrer">{c.name} eSCRIBE meeting portal</a>
                        : <>Upcoming agendas not available (<a href={c.calendarUrl} target="_blank" rel="noopener noreferrer">official calendar</a>)</>}
                    </td>
                    <td>
                      {v.url ? <a href={v.url} target="_blank" rel="noopener noreferrer">{v.label}</a> : v.label}
                      <br /><span style={{ fontSize: 14 }}>{v.note}</span>
                    </td>
                    <td>
                      {c.participationUrl
                        ? <a href={c.participationUrl} target="_blank" rel="noopener noreferrer">Official guide</a>
                        : "No guide confirmed; use the agenda page"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="cl-prose" style={{ maxWidth: 820 }}>
          <h2 className="cl-h3">Good to know</h2>
          <ul>
            <li><strong>We never calculate deadlines.</strong> Deadlines to speak or send comments are set by each city. We only show participation links the city publishes, and link to its official guide.</li>
            <li><strong>Committee decisions are not final.</strong> We label staff recommendations, committee decisions and council decisions separately.</li>
            <li><strong>Amendments are labelled.</strong> A recorded vote may be on an amendment (a change to the motion), not the final motion.</li>
            <li><strong>&ldquo;No recorded vote&rdquo; is not &ldquo;no decision&rdquo;.</strong> Many decisions are made without a named vote. That doesn&apos;t mean they were unanimous.</li>
            <li><strong>Summaries are the city&apos;s own words.</strong> We show the first lines of the official agenda text. Nothing is written by AI.</li>
            <li><strong>Kingston mayoral decisions</strong> come from the <a href={KINGSTON_MAYORAL_DATASET} target="_blank" rel="noopener noreferrer">Mayoral Decision Registry</a>. Entries without a published date are not shown.</li>
          </ul>
          <p>
            Toronto data is used under the{" "}
            <a href="https://open.toronto.ca/open-data-licence/" target="_blank" rel="noopener noreferrer">Open Government Licence – Toronto</a>;
            Kingston data under the{" "}
            <a href="https://www.cityofkingston.ca/documents/10180/144997/CityofKingston_OpenDataLicense.pdf" target="_blank" rel="noopener noreferrer">City of Kingston Open Data Licence</a>.
            Technical details for developers are in the project&apos;s README.md and ADAPTERS.md files.
          </p>
        </div>
      </section>
    </>
  );
}
