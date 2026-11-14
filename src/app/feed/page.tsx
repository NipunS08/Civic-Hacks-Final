// "What's happening" feed for one municipality.
// URL: /feed?municipality=hamilton&when=upcoming&when=past&topics=housing&stage=council&q=zoning
// Server Component: fetches live data at request time (no account needed).
// Upcoming and Past can be shown together; the list is upcoming soonest-first,
// then past decisions newest-first, each card badged "Upcoming" or "Decided".

import { connection } from "next/server";
import { Suspense } from "react";
import type { AgendaItem } from "@/types";
import { CITIES, getCity, parseCityId } from "@/lib/cities";
import { fetchCityItems } from "@/lib/city-data";
import { filterAndSortByWhen, parseWhen, STAGE_FILTERS } from "@/lib/item-display";
import { matchesTopics, parseTopicIds, TOPICS } from "@/lib/topics";
import ItemCard from "@/components/ui/ItemCard";
import FeedFilters from "@/components/ui/FeedFilters";
import FeedSkeleton from "@/components/ui/FeedSkeleton";

// instant=false: reads searchParams dynamically at request time
export const instant = false;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Stage filter ids (see FeedFilters) → which decision bodies they include. */
function matchesStage(item: AgendaItem, stage: string): boolean {
  switch (stage) {
    case "staff": return item.decision_body === "staff";
    case "committee": return item.decision_body === "committee";
    case "council": return item.decision_body === "council";
    case "other": return item.decision_body === "board" || item.decision_body === "mayor";
    default: return true;
  }
}

export default async function FeedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  // ?city= is accepted too, for links from the old quiz
  const cityId = parseCityId(first(params.municipality) ?? first(params.city));
  const city = getCity(cityId)!;
  // Old links used ?show=past|upcoming; map them onto the new multi-select
  const when = parseWhen(params.when ?? params.show);
  const topics = parseTopicIds(params.topics);
  const stageRaw = first(params.stage) ?? "all";
  const stage = STAGE_FILTERS.some(s => s.id === stageRaw) ? stageRaw : "all";
  const q = first(params.q)?.trim() ?? "";

  return (
    <>
      <section className="cl-pagehero">
        <div className="cl-wrap">
          <div className="cl-pagehero-inner">
            <p className="cl-eyebrow">{city.officialName} · {city.coverage}</p>
            <h1 className="cl-h2">What&apos;s happening in {city.name}</h1>
            <p className="cl-lead">
              The topics {city.name}&apos;s council and city panels are about to discuss, and the decisions
              they&apos;ve already made, explained in everyday words. Each card links to the city&apos;s own record.
            </p>
          </div>
        </div>
      </section>

      <div className="cl-wrap" style={{ paddingTop: 24, paddingBottom: 56, display: "grid", gap: 20 }}>
        <FeedFilters city={city.id} when={when} topics={topics} stage={stage} q={q} />
        {/* The list streams in; filters stay usable while city data loads */}
        <Suspense key={JSON.stringify({ cityId, when, topics, stage, q })} fallback={<FeedSkeleton />}>
          <FeedResults cityId={city.id} when={when} topics={topics} stage={stage} q={q} />
        </Suspense>
        <CityDataNote cityId={city.id} />
      </div>
    </>
  );
}

async function FeedResults({ cityId, when, topics, stage, q }: {
  cityId: ReturnType<typeof parseCityId>; when: ReturnType<typeof parseWhen>; topics: string[]; stage: string; q: string;
}) {
  // Current-time reads (upcoming vs past) must wait for a request.
  await connection();
  const city = getCity(cityId)!;

  let loaded: AgendaItem[] = [];
  let error: string | null = null;
  try {
    loaded = await fetchCityItems(cityId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  if (error) {
    return (
      <div className="cl-alert" role="alert">
        <p style={{ fontWeight: 700 }}>Couldn&apos;t load {city.name} data. <a href={`/feed?municipality=${cityId}`}>Try again</a></p>
        <p style={{ marginTop: 6 }}>
          The city&apos;s portal may be busy or down. You can also use{" "}
          <a href={city.calendarUrl} target="_blank" rel="noopener noreferrer">{city.name}&apos;s official meeting calendar</a>.
        </p>
        <details style={{ marginTop: 6, fontSize: 14 }}><summary>Technical details</summary><p>{error}</p></details>
      </div>
    );
  }

  const inTimeframe = filterAndSortByWhen(loaded, when);
  const lower = q.toLowerCase();
  const items = inTimeframe
    .filter(i => matchesStage(i, stage))
    // Priorities match keywords in the title and the agenda description
    .filter(i => matchesTopics(`${i.title} ${i.description ?? ""}`, topics))
    .filter(i => !lower || `${i.title} ${i.official_code ?? ""}`.toLowerCase().includes(lower));
  const hasFilters = Boolean(q || topics.length || stage !== "all");
  const noUpcomingSource = cityId === "toronto" && when.length === 1 && when[0] === "upcoming";

  const topicNames = TOPICS.filter(t => topics.includes(t.id)).map(t => t.label.toLowerCase());
  return (
    <section aria-labelledby="results-title" style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 id="results-title" className="cl-h3">
          {when.length === 2 ? "Coming up and past meetings" : when[0] === "upcoming" ? "Coming up" : "Past meetings"}
          {topicNames.length > 0 && <span className="cl-muted" style={{ fontWeight: 500 }}> · {topicNames.join(", ")}</span>}
        </h2>
        <p className="cl-muted" aria-live="polite" style={{ fontSize: 15 }}>
          Showing {items.length} of {inTimeframe.length} topic{inTimeframe.length === 1 ? "" : "s"}
          {when.length === 2 && ". Upcoming meetings first (soonest at the top), then past meetings (newest first)."}
        </p>
      </div>

      <ReadingGuide />

      {items.length === 0 ? (
        <div className="cl-state">
          <h2>
            {noUpcomingSource
              ? "No upcoming Toronto items in our sources"
              : hasFilters ? "No items match these filters"
              : when.length === 1 && when[0] === "upcoming" ? "No upcoming meetings with published agendas"
              : "No items found"}
          </h2>
          <p>
            {noUpcomingSource
              ? "Toronto's open data only covers items after a recorded vote. Switch on “Past decisions”, or check Toronto's official calendar for upcoming meetings."
              : hasFilters
                ? "Try fewer words or another priority. Topic matching uses keywords, so no match doesn't mean nothing relevant is happening."
                : "Agendas are usually published a few days before each meeting. Check the official calendar for the full schedule."}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {hasFilters && <a href={`/feed?municipality=${cityId}`} className="cl-btn">Clear filters</a>}
            <a href={city.calendarUrl} className="cl-btn cl-btn-outline" target="_blank" rel="noopener noreferrer">Official meeting calendar</a>
          </div>
        </div>
      ) : (
        <ul style={{ display: "grid", gap: 16, listStyle: "none", padding: 0, margin: 0 }} aria-label={`${city.name} items`}>
          {items.map(item => (
            <li key={item.id}><ItemCard item={item} headingLevel="h3" /></li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Explains the words used on the cards, for people who have never followed council. */
function ReadingGuide() {
  return (
    <details className="cl-guide">
      <summary>New to this? How to read these cards</summary>
      <p className="cl-muted">Each card is one topic from a city meeting agenda: a proposal, a request, a report or a decision.</p>
      <dl>
        <dt>Coming up</dt><dd>The meeting hasn&apos;t happened yet. Nothing has been decided, and you may still be able to share your opinion.</dd>
        <dt>Decided</dt><dd>The meeting has happened and a result was published. We show whether it passed and, when recorded, how each member voted.</dd>
        <dt>Result not available yet</dt><dd>The meeting has happened, but the city hasn&apos;t published the result in a form we can read. Check the official page.</dd>
        <dt>Proposal from city staff</dt><dd>City employees have written a plan or recommendation. Elected councillors still have to decide.</dd>
        <dt>Committee vote (not final)</dt><dd>A smaller group of councillors voted on it. City Council usually makes the final decision afterwards.</dd>
        <dt>Final decision by Council</dt><dd>The full City Council (mayor and councillors) decided. This is usually the final say.</dd>
        <dt>Hearing by a city panel</dt><dd>A panel such as the Committee of Adjustment decides small property and zoning requests itself, without going to Council.</dd>
        <dt>Ward</dt><dd>The area of the city the topic is about. Each ward elects one councillor.</dd>
      </dl>
    </details>
  );
}

/** What this city's data covers and doesn't, in plain words. */
function CityDataNote({ cityId }: { cityId: ReturnType<typeof parseCityId> }) {
  const city = getCity(cityId)!;
  const notes: Record<string, string> = {
    toronto: "Toronto items come from the Members of Toronto City Council Voting Record on Toronto Open Data, so they appear only after a recorded vote. Upcoming Toronto agendas are blocked to automated access.",
    hamilton: "Hamilton agendas come from Hamilton's eSCRIBE meeting portal. Hamilton publishes minutes only as PDF attachments, which the portal blocks from automated download, so we can't show who voted how. Check minutes on the official portal.",
    kingston: "Upcoming Kingston agendas come from Kingston's eSCRIBE portal. Past decisions and each member's vote come from the Council Voting Records and Mayoral Decision Registry on Open Data Kingston.",
  };
  const generic = `${city.name} agendas and minutes come from ${city.name}'s eSCRIBE meeting portal. Past items are read from the published minutes, including recorded (named) votes when the city records them.`;
  return (
    <aside className="cl-note" aria-label={`About ${city.name} data`}>
      <p><strong>About {city.name} data.</strong> {notes[cityId] ?? generic}</p>
      <p style={{ marginTop: 6 }}>
        Deadlines are never worked out from meeting dates: we only show participation options the city publishes.{" "}
        <a href="/sources">Sources &amp; data</a> · <a href={city.calendarUrl} target="_blank" rel="noopener noreferrer">Official calendar</a>
        {" · "}Other cities: {CITIES.filter(c => c.id !== cityId).map((c, i) => (
          <span key={c.id}>{i > 0 && ", "}<a href={`/feed?municipality=${c.id}`}>{c.name}</a></span>
        ))}
      </p>
    </aside>
  );
}
