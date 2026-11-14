import { toYmd } from "../../src/lib/dates.ts";
import type { AgendaItem } from "../../src/types/index.ts";
import {
  CITIES,
  DEFAULT_CITY,
  getCity,
  type CityId,
} from "../../src/lib/cities.ts";
import { TOPICS, matchesTopics } from "../../src/lib/topics.ts";
import {
  filterAndSortByWhen,
  stageBadge,
  itemStatus,
} from "../../src/lib/item-display.ts";
import { participationState } from "../../src/lib/participation-state.ts";
import { agendaEvidence } from "../../src/lib/item-details.ts";

export const API_VERSION = 1;
export const COVERAGE_NOTE =
  "A limited selection of official meetings, not a complete city record. Some meetings or results may be unavailable. Topic matching uses keywords and can miss relevant items.";
export interface Preferences {
  city: CityId;
  topics: string[];
  timeframe: "all" | "upcoming" | "past";
  onboarded: boolean;
}
export const DEFAULT_PREFERENCES: Preferences = {
  city: DEFAULT_CITY,
  topics: [],
  timeframe: "all",
  onboarded: false,
};
export function parsePreferences(raw: unknown): Preferences {
  const p =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    city: getCity(typeof p.city === "string" ? p.city : "")?.id ?? DEFAULT_CITY,
    topics: Array.isArray(p.topics)
      ? TOPICS.filter((t) => (p.topics as unknown[]).includes(t.id)).map(
          (t) => t.id,
        )
      : [],
    timeframe:
      p.timeframe === "past" || p.timeframe === "upcoming"
        ? p.timeframe
        : "all",
    onboarded: p.onboarded === true,
  };
}
export function officialUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
// Validate the boundary, including nested values used by native components.
export function isMobileItem(raw: unknown): raw is AgendaItem {
  if (!raw || typeof raw !== "object") return false;
  const i = raw as AgendaItem;
  return (
    typeof i.id === "string" &&
    typeof i.item_number === "string" &&
    typeof i.title === "string" &&
    !!getCity(i.municipality_id) &&
    officialUrl(i.source_url) &&
    typeof i.retrieved_at === "string" && Number.isFinite(Date.parse(i.retrieved_at)) &&
    typeof i.meeting_date === "string" && toYmd(i.meeting_date) === i.meeting_date &&
    typeof i.committee === "string" &&
    (i.description === null || typeof i.description === "string") &&
    ["committee", "city_council", "appeal", "decided", "unknown"].includes(
      i.stage,
    ) &&
    (!i.votes ||
      (Array.isArray(i.votes) &&
        i.votes.every(
          (v) =>
            v &&
            typeof v.result === "string" &&
            ["main", "amendment", "procedural"].includes(v.motion_kind) &&
            Array.isArray(v.groups) &&
            v.groups.every(
              (g) =>
                g &&
                Array.isArray(g.names) &&
                g.names.every((n) => typeof n === "string"),
            ),
        ))) &&
    (!i.participation_evidence ||
      (typeof i.participation_evidence.source_excerpt === "string" &&
        officialUrl(i.participation_evidence.source_url) &&
        typeof i.participation_evidence.verified_at === "string"))
  );
}
export function parseItemsResponse(raw: unknown): AgendaItem[] {
  if (!raw || typeof raw !== "object")
    throw new Error("The server returned an invalid response.");
  const data = raw as { version: unknown; items: unknown };
  if (
    data.version !== API_VERSION ||
    !Array.isArray(data.items) ||
    !data.items.every(isMobileItem)
  )
    throw new Error(
      "The server data format is not supported. Update the app or try again.",
    );
  return data.items;
}
export function filterMobileItems(
  items: AgendaItem[],
  p: Preferences,
  query: string,
  body = "all",
  now = new Date(),
) {
  const q = query.trim().toLowerCase();
  return filterAndSortByWhen(
    items,
    p.timeframe === "all" ? ["upcoming", "past"] : [p.timeframe],
    now,
  ).filter(
    (i) =>
      i.municipality_id === p.city &&
      (body === "all" || i.decision_body === body) &&
      matchesTopics(`${i.title} ${i.description ?? ""}`, p.topics) &&
      (!q || `${i.title} ${i.official_code ?? ""}`.toLowerCase().includes(q)),
  );
}
export type GuideChoice = "meaning" | "impact" | "participate" | "sources";
export function civiResponse(
  choice: GuideChoice,
  item?: AgendaItem,
  now = new Date(),
): string {
  if (!item)
    return choice === "participate"
      ? "Open a decision, then check its participation section. A meeting date does not confirm that comments are still accepted."
      : "Choose your city in Discover, narrow the list by topics, and open a decision. I can explain its stage and point you to official sources.";
  if (choice === "meaning")
    return `${stageBadge(item, now).label}. ${stageBadge(item, now).explain}`;
  if (choice === "impact")
    return (
      agendaEvidence(item.description).impacts.join("\n\n") ||
      "This listing does not establish personal impacts. Check whether the official report names your street, a service you use, or changes to costs."
    );
  if (choice === "participate")
    return participationState(item, now) === "verified_open"
      ? "The published item-specific input window is open. Confirm eligibility, instructions and timing at the official source."
      : participationState(item, now) === "verified_closed"
        ? "The published input window has closed. Check the source for any later opportunities."
        : `Input availability is unverified. ${itemStatus(item, now) === "upcoming" ? "An upcoming meeting is not proof that comments are still accepted." : "This meeting has a result or is past; check for later opportunities."}`;
  return "Every decision links to its official municipal record and shows when it was retrieved. Open the source to check the exact wording and conditions.";
}
export const SUPPORTED_CITIES = CITIES.map((c) => c.id);
