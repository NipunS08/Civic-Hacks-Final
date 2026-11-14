// About the tool — who it serves, how it works, how outputs are checked,
// and what a municipality would need before piloting it.
// Static page: no data fetching.

import Link from "next/link";
import NearYouLink from "@/components/landing/NearYouLink";
import CivicArt from "@/components/landing/CivicArt";

export const metadata = { title: "About the tool — CivicLens" };

export default function AboutPage() {
  return (
    <>
      <section className="cl-pagehero">
        <div className="cl-wrap">
          <div className="cl-pagehero-inner">
            <p className="cl-eyebrow">About the tool</p>
            <h1 className="cl-h1">Council decisions, explained and linked to the source</h1>
            <p className="cl-lead">
              CivicLens helps residents find what their council is deciding, see where each item
              is in the process, and know whether and how they can still give input.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for — image left, text right (reference "simple" section pattern) */}
      <section className="cl-simple">
        <div className="cl-wrap">
          <div className="cl-simple-grid">
            <div className="cl-simple-img"><div className="cl-arch cl-art"><CivicArt variant="voice" /></div></div>
            <div className="cl-simple-content cl-prose">
              <h2 className="cl-h2" style={{ marginTop: 0 }}>Who it&apos;s <span className="cl-accent">for</span></h2>
              <p>
                <strong>Residents</strong>, especially people who have never followed council:
                renters, newcomers, students, seniors and shift workers. These groups are the
                least likely to take part today.
              </p>
              <p>
                <strong>Municipal staff</strong>, such as clerks, communications and engagement
                teams, who need to point people to accurate, current information quickly.
              </p>
              <p>
                <strong>Councillor offices, community groups and journalists</strong> who track
                items across several meetings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — text left, image right */}
      <section className="cl-simple">
        <div className="cl-wrap">
          <div className="cl-simple-grid">
            <div className="cl-simple-img"><div className="cl-arch cl-art"><CivicArt variant="docs" /></div></div>
            <div className="cl-simple-content cl-prose">
              <h2 className="cl-h2" style={{ marginTop: 0 }}>How it <span className="cl-accent">works</span></h2>
              <ul>
                <li>
                  <strong>Platform adapters</strong> read each city&apos;s official publishing
                  system. One eSCRIBE adapter serves Ottawa, Hamilton, Kingston, Brampton,
                  Kitchener, Guelph and Mississauga; open data adapters read Toronto&apos;s and
                  Kingston&apos;s voting records.
                </li>
                <li>
                  <strong>Clear decision stages.</strong> Each item is labelled as a staff
                  recommendation, a committee decision or a council decision, with recorded votes
                  (For / Against / Absent) when the city publishes them.
                </li>
                <li>
                  <strong>No invented deadlines.</strong> We only show participation options the
                  city publishes and link to its official guide. A meeting date is never
                  presented as a submission deadline.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Accuracy and limits */}
      <section className="cl-faq">
        <div className="cl-wrap">
          <div className="cl-faq-grid">
            <div className="cl-faq-title">
              <h2 className="cl-h2">How we keep it <span className="cl-accent">accurate</span></h2>
            </div>
            <div className="cl-prose cl-faq-main">
              <ul>
                <li>Every item shows its source link and when we last checked it. Items without a source are not shown.</li>
                <li>Staff recommendations, committee decisions and final council decisions are always labelled as separate stages.</li>
                <li>No AI-written text is shown in this version. If summaries are added, each will be labelled &ldquo;AI summary, verify at source&rdquo; and shown next to the original text.</li>
                <li>Sources that block automated access (such as Toronto&apos;s TMMIS agenda pages) are documented rather than worked around.</li>
                <li>A link checker (<code>npm run check-links</code>) confirms every source URL still works.</li>
              </ul>
              <h2 className="cl-h3">Known limits</h2>
              <ul>
                <li>Toronto open data only includes items after a recorded vote, so upcoming Toronto items are not shown.</li>
                <li>Agenda items rarely include addresses or wards in open data, so &ldquo;near me&rdquo; filtering is not available yet.</li>
                <li>Topic matching is a keyword search on titles and can miss items.</li>
              </ul>
              <h2 className="cl-h3">Before a municipal pilot</h2>
              <ul>
                <li>Confirm the participation-deadline rules for each item type with the Clerk&apos;s office.</li>
                <li>Get structured agenda access (an API or open data feed) for upcoming items.</li>
                <li>Run an accessibility audit (WCAG 2.1 AA) and plain-language review, and add French and other languages.</li>
                <li>Plan offline outreach (libraries, community centres) for residents who won&apos;t use an app.</li>
              </ul>
              <p>
                Full details: <Link href="/sources">Sources &amp; data</Link> ·{" "}
                <Link href="/privacy">Privacy</Link> · <Link href="/faq">FAQ</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cl-simple">
        <div className="cl-wrap" style={{ textAlign: "center", display: "grid", gap: 24, justifyItems: "center" }}>
          <h2 className="cl-h2">See it with <span className="cl-accent">real items</span></h2>
          <NearYouLink />
        </div>
      </section>
    </>
  );
}
