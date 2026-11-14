// Item detail page: what the item is, where it is, how members voted, and how to
// have a say (only official opportunities; no deadlines are ever calculated).
// URL: /item/2026.CC12.4 (Toronto), /item/HAM-2026-11-18-…-7 (eSCRIBE cities),
//      /item/KGN-V-2026-10-06-… (Kingston open-data votes)

import { participationState } from "@/lib/participation-state";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { Building2, CalendarDays, ExternalLink, Gavel, Info, MapPin, Megaphone } from "lucide-react";
import type { AgendaItem } from "@/types";
import { findItem } from "@/lib/city-data";
import { getCity } from "@/lib/cities";
import { sourceLabelFor } from "@/lib/say-window";
import { expandCode, formatHumanDate, itemStatus } from "@/lib/item-display";
import { explainItem } from "@/lib/plain-language";
import ItemExplanation from "@/components/ui/ItemExplanation";
import SayWindow from "@/components/ui/SayWindow";
import SourceLink from "@/components/ui/SourceLink";
import VoteBreakdown from "@/components/ui/VoteBreakdown";
import { StageBadge, StatusBadge } from "@/components/ui/ItemBadges";

// instant=false: reads dynamic params at request time
export const instant = false;

interface Props {
  params: Promise<{ itemNumber: string }>;
}

// When the participation pages in src/lib/cities.ts were last confirmed to load
const PARTICIPATION_PAGES_VERIFIED_AT = "2026-11-13T12:00:00-05:00";

export default async function ItemDetailPage({ params }: Props) {
  await connection();
  const { itemNumber } = await params;
  // Next.js has already decoded route params; decoding '%' a second time throws.
  let item: AgendaItem | undefined;
  try {
    item = await findItem(itemNumber);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return (
      <div className="cl-wrap" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div className="cl-alert" role="alert">
          <p style={{ fontWeight: 700 }}>Couldn&apos;t load this item from the city&apos;s source. <a href={`/item/${encodeURIComponent(itemNumber)}`}>Try again</a></p>
          <details style={{ marginTop: 6, fontSize: 14 }}><summary>Technical details</summary><p>{message}</p></details>
        </div>
      </div>
    );
  }
  if (!item) notFound();

  const city = getCity(item.municipality_id);
  const codeExpansion = item.official_code ? expandCode(item.official_code) : null;
  const plain = explainItem(item);
  const feedHref = `/feed?municipality=${item.municipality_id}`;

  return (
    <div className="cl-wrap" style={{ maxWidth: 880, paddingTop: 24, paddingBottom: 56, display: "grid", gap: 20 }}>
      <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
        <Link href={feedHref} className="cl-link">{city?.name ?? "Feed"}</Link>
        <span aria-hidden="true"> / </span>
        <span>Item</span>
      </nav>

      {/* Header: badges → plain-language title → key facts → source */}
      <header className="cl-card" style={{ display: "grid", gap: 14 }}>
        <div className="cl-badges"><StatusBadge item={item} /><StageBadge item={item} /></div>
        <h1 className="cl-h2" style={{ fontSize: "clamp(26px, 3.2vw, 36px)" }}>{plain.headline}</h1>
        {plain.headline !== item.title && <p className="cl-muted" style={{ fontSize: 15 }}>Official title: {item.title}</p>}
        <p className="cl-whats-happening">
          <Info size={18} aria-hidden="true" />
          <span><strong>What&apos;s happening: </strong>{plain.whatsHappening}</span>
        </p>
        {plain.details && <p className="text-gray-700"><strong>{plain.detailsLabel}:</strong> {plain.details}</p>}
        <dl className="cl-facts">
          <div><dt><CalendarDays size={15} aria-hidden="true" />Meeting date</dt><dd>{formatHumanDate(item.meeting_date)}</dd></div>
          <div><dt><Building2 size={15} aria-hidden="true" />Who decides</dt><dd>{item.committee}</dd></div>
          {item.ward && <div><dt><MapPin size={15} aria-hidden="true" />Area</dt><dd>{item.ward.startsWith("Ward") ? item.ward : `Ward ${item.ward}`}</dd></div>}
          {item.official_code && (
            <div>
              <dt>City reference number</dt>
              <dd className="cl-item-id">
                {codeExpansion ? <abbr title={codeExpansion}><code>{item.official_code}</code></abbr> : <code>{item.official_code}</code>}
                {codeExpansion && <span className="sr-only"> ({codeExpansion})</span>}
              </dd>
            </div>
          )}
        </dl>
        <div style={{ display: "grid", gap: 6 }}>
          <SourceLink url={item.source_url} label={sourceLabelFor(item)} retrievedAt={item.retrieved_at} />
          {item.meeting_url && (
            <a href={item.meeting_url} target="_blank" rel="noopener noreferrer" className="cl-link" style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ExternalLink size={14} aria-hidden="true" /> Official meeting page<span className="sr-only"> (opens in new tab)</span>
            </a>
          )}
        </div>
      </header>

      <SayWindow item={item} />

      <section className="cl-card cl-section" aria-labelledby="votes-title" id="votes">
        <h2 id="votes-title"><Gavel size={22} aria-hidden="true" /> The decision and how members voted</h2>
        <VoteBreakdown item={item} />
      </section>

      <ItemExplanation item={item} />

      <Participation item={item} />

      <Link href={feedHref} className="cl-link">← Back to {city?.name ?? "the feed"}</Link>
    </div>
  );
}

/** Only official opportunities: links the city's page exposes for this item or
 *  meeting, plus the city's general guide. Never a calculated deadline. */
function Participation({ item }: { item: AgendaItem }) {
  const city = getCity(item.municipality_id);
  const upcoming = itemStatus(item) === "upcoming";
  const eligibility = participationState(item);
  const links = item.official_links ?? [];

  return (
    <section id="participate" className="cl-card cl-section scroll-mt-24" aria-labelledby="participate-title">
      <h2 id="participate-title"><Megaphone size={22} aria-hidden="true" /> How to share your opinion</h2>
      {eligibility !== "unknown" && <p className="cl-note">{eligibility === "verified_open" ? "The officially published input window is open." : "The officially published input window is closed."} <a href={item.participation_evidence!.source_url}>Check the official evidence</a> · Verified {item.participation_evidence!.verified_at}</p>}
      {!upcoming ? (
        <p className="text-gray-700">
          This meeting is past or has a published result. We have not confirmed a current input opportunity. If the topic comes back at
          another meeting (for example, a committee&apos;s advice going to City Council), you may get another chance.
          Check the official page for later meetings.
        </p>
      ) : (
        <>
          {eligibility === "unknown" && <p className="text-gray-700">
            We have not confirmed whether input is currently accepted for this item. Check the official item page for eligibility and timing. Possible methods include a written comment
            (an email or letter), or a request to speak at the meeting for a few minutes (cities call this a
            &ldquo;delegation&rdquo;). <strong>The city sets a deadline, often a day or more before the meeting</strong>,
            and lists it on its official page. We don&apos;t guess deadlines.
          </p>}
          {links.length > 0 && (
            <ul className="grid gap-2">
              {links.map(l => (
                <li key={l.url + l.label}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="cl-btn">
                    {l.label} <ExternalLink size={15} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {city?.participationUrl ? (
        <div style={{ display: "grid", gap: 6 }}>
          <a href={city.participationUrl} target="_blank" rel="noopener noreferrer" className={upcoming && links.length === 0 ? "cl-btn" : "cl-link"} style={{ justifySelf: "start" }}>
            {city.name}&apos;s official guide to council and committee meetings <ExternalLink size={15} aria-hidden="true" />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
          <SourceLink url={city.participationUrl} label={`${city.officialName} website`} retrievedAt={PARTICIPATION_PAGES_VERIFIED_AT} />
        </div>
      ) : (
        <p className="text-gray-700">
          We couldn&apos;t confirm an official participation guide for {city?.name}. Use the{" "}
          <a href={item.source_url} className="cl-link" target="_blank" rel="noopener noreferrer">official agenda page</a>{" "}
          or contact the City Clerk&apos;s office.
        </p>
      )}
    </section>
  );
}
