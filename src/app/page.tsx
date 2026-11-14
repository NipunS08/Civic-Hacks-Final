// Home page: hero → "get started" panel (municipality, priorities, past/upcoming)
// → where the data comes from → how it works → official participation links →
// transparency band → FAQ → closing call to action.
// Static content only (the picker and CTA are small client components).

import { CalendarRange, ListChecks, MapPin, Check, ArrowRight } from "lucide-react";
import CivicArt from "@/components/landing/CivicArt";
import FaqList from "@/components/landing/FaqList";
import NearYouLink from "@/components/landing/NearYouLink";
import MunicipalityPicker from "@/components/layout/MunicipalityPicker";
import { OFFICIAL_LINKS } from "@/lib/content/site";
import { TOPICS } from "@/lib/topics";
import { CITIES } from "@/lib/cities";
import Link from "next/link";
import CiviWelcome from "@/components/civi/CiviWelcome";

const STEPS = [
  { title: "Pick your municipality", desc: `Choose from ${CITIES.length} Ontario cities in the menu at the top of every page.`, Icon: MapPin },
  { title: "Choose your priorities", desc: "Housing, transit, parks, budget or safety: we'll put matching items first.", Icon: ListChecks },
  { title: "Upcoming, past, or both", desc: "See what's coming up, what was decided and how members voted.", Icon: CalendarRange },
];

const escribeCities = CITIES.filter(c => c.escribeBase).map(c => c.name);

export default function Home() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="cl-hero" aria-labelledby="hero-title">
        <div className="cl-hero-bg">
          <div className="cl-hero-ring" />
          <div className="cl-hero-art cl-art"><CivicArt variant="city" /></div>
        </div>
        <div className="cl-wrap">
          <div className="cl-hero-inner">
            <div className="cl-hero-content">
              <p className="cl-eyebrow" style={{ color: "var(--on-fill-muted)" }}>Council decisions, made easier to understand</p>
              <h1 id="hero-title" className="cl-h1">What is your council deciding, and can you still have a say?</h1>
              <p className="cl-lead">
                CivicLens turns council agendas, minutes and voting records into clear, plain-language
                cards: what&apos;s proposed, where it is in the process, how members voted, and how to take
                part, with a link to the official source on every item. Free, no account needed.
              </p>
              <div className="cl-hero-action">
                <NearYouLink className="cl-btn cl-btn-lg cl-btn-light" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Get started ---------- */}
      <section className="cl-start" aria-labelledby="start-title">
        <div className="cl-wrap">
          {/* Plain GET form to the feed: works without JavaScript */}
          <form action="/feed" method="get" className="cl-start-panel">
            <CiviWelcome />
            <h2 id="start-title" tabIndex={-1}>Find items that matter to you</h2>
            <div className="cl-start-grid">
              <div id="choose-city" className="scroll-mt-40">
                <MunicipalityPicker mode="field" name="municipality" label="Your municipality" visibleLabel />
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <fieldset className="cl-fieldset">
                  <legend>Topics I care about <span className="cl-muted" style={{ fontWeight: 500 }}>(optional)</span></legend>
                  <div className="cl-chip-group">
                    {TOPICS.map(t => (
                      <label key={t.id} className="cl-chip" title={t.hint}>
                        <input type="checkbox" name="topics" value={t.id} />
                        <span><Check size={15} aria-hidden="true" className="cl-chip-check" />{t.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="cl-fieldset">
                  <legend>Show me</legend>
                  <div className="cl-segmented">
                    <label className="cl-chip"><input type="checkbox" name="when" value="upcoming" defaultChecked /><span><Check size={15} aria-hidden="true" className="cl-chip-check" />Coming up</span></label>
                    <label className="cl-chip"><input type="checkbox" name="when" value="past" defaultChecked /><span><Check size={15} aria-hidden="true" className="cl-chip-check" />Past meetings</span></label>
                  </div>
                </fieldset>
              </div>
            </div>
            <div>
              <button type="submit" className="cl-btn cl-btn-lg">See what&apos;s happening <ArrowRight size={18} aria-hidden="true" /></button>
            </div>
          </form>
        </div>
      </section>

      {/* ---------- Built on public records ---------- */}
      <section className="cl-partners" aria-labelledby="partners-title">
        <div className="cl-wrap">
          <div className="cl-partners-grid">
            <div className="cl-partners-title">
              <h2 id="partners-title" className="cl-h2">Built on <span className="cl-accent">public records</span></h2>
              <p className="cl-lead cl-muted">
                We only show what cities publish themselves, so every item can be checked against its source.
              </p>
            </div>
            <div className="cl-partner-cards">
              <article className="cl-partner">
                <h3>Meeting portals</h3>
                <p className="cl-partner-desc">
                  <strong>{escribeCities.join(", ")}</strong> publish agendas and minutes on eSCRIBE meeting
                  portals. We read upcoming agendas and, where minutes are published as web pages, each
                  recorded vote.
                </p>
                <span className="cl-partner-tag">Agendas · minutes</span>
              </article>
              <article className="cl-partner">
                <h3>Open data voting records</h3>
                <p className="cl-partner-desc">
                  <strong>Toronto</strong> and <strong>Kingston</strong> publish how each council member voted as
                  open data. Kingston also publishes its mayoral decisions.
                </p>
                <span className="cl-partner-tag">Open data</span>
              </article>
              <article className="cl-partner">
                <h3>Your say, from official pages</h3>
                <p className="cl-partner-desc">
                  We link to each city&apos;s own guide for speaking at or writing to council.{" "}
                  <strong>We never work out deadlines from meeting dates.</strong> Confirm every deadline on the
                  official page.
                </p>
                <span className="cl-partner-tag">Participation</span>
              </article>
            </div>
          </div>
          <p className="cl-partners-note">
            CivicLens is an independent project. It is not affiliated with or endorsed by any municipality.
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="cl-work" aria-labelledby="work-title">
        <div className="cl-wrap">
          <div className="cl-work-title">
            <h2 id="work-title" className="cl-h2">See what&apos;s <span className="cl-accent">on the table near you</span></h2>
            <p className="cl-lead cl-muted">Three choices, then a clear list of real items with their stage, votes and sources.</p>
          </div>
          <ol className="cl-work-list">
            {STEPS.map((s, i) => (
              <li key={s.title} className="cl-step">
                <span className="cl-step-icon"><s.Icon size={24} aria-hidden="true" /></span>
                <span className="cl-step-pill">Step {i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
          <div className="cl-work-action"><NearYouLink /></div>
        </div>
      </section>

      {/* ---------- Official links ---------- */}
      <section className="cl-links" aria-labelledby="links-title">
        <div className="cl-wrap">
          <div className="cl-links-content">
            <h2 id="links-title" className="cl-h2"><span className="cl-accent">Official ways</span> to have your say</h2>
            <p className="cl-lead cl-muted">
              Want to write in, speak at a meeting, or check a rule? These are the cities&apos; own pages. Always
              confirm deadlines there.
            </p>
            <nav aria-label="Official participation pages">
              <ul className="cl-links-list">
                {OFFICIAL_LINKS.map(l => (
                  <li key={l.url}>
                    <a href={l.url} className="cl-links-item" target="_blank" rel="noopener noreferrer">
                      <span>
                        <small>{l.city}</small>
                        {l.label}
                        <span className="sr-only"> (opens in new tab)</span>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      {/* ---------- Transparency band ---------- */}
      <section className="cl-transparent" aria-labelledby="transparent-title">
        <div className="cl-transparent-bg" />
        <div className="cl-wrap">
          <div className="cl-transparent-inner">
            <div className="cl-transparent-content">
              <h2 id="transparent-title" className="cl-h2">Clear about <strong>what is decided, and by whom</strong></h2>
              <p className="cl-lead">
                A staff recommendation, a committee decision and a final council decision are{" "}
                <strong>always labelled differently</strong>. Votes on amendments are marked as amendments. When
                no named vote was recorded, we say <strong>&ldquo;No recorded vote&rdquo;</strong> instead of
                implying everyone agreed.
              </p>
              <p className="cl-transparent-note">Every item links to its official source and shows when we last checked it.</p>
            </div>
            <ol className="cl-pipeline" aria-label="Example: the stages an item moves through">
              <li className="cl-pipeline-step"><span className="cl-pipeline-dot">1</span><span className="cl-pipeline-text"><strong>Staff recommendation</strong><span>City staff propose an action in a report</span></span></li>
              <li className="cl-pipeline-step"><span className="cl-pipeline-dot">2</span><span className="cl-pipeline-text"><strong>Committee decision</strong><span>A recommendation to council, not final</span></span></li>
              <li className="cl-pipeline-step"><span className="cl-pipeline-dot">3</span><span className="cl-pipeline-text"><strong>Council decision</strong><span>The final decision, with any recorded vote</span></span></li>
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="cl-faq" aria-labelledby="faq-title">
        <div className="cl-wrap">
          <div className="cl-faq-grid">
            <div className="cl-faq-title">
              <h2 id="faq-title" className="cl-h2">Frequently <span className="cl-accent">asked questions</span></h2>
              <p className="cl-lead cl-muted">Short answers about where the information comes from and how to use it.</p>
              <Link href="/faq" className="cl-btn cl-btn-outline">View all answers <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
            <FaqList limit={5} />
          </div>
        </div>
      </section>
    </>
  );
}
