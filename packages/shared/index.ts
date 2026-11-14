// The website remains the source of truth; this package exposes its pure rules.
export type { AgendaItem, RecordedVote } from "../../src/types/index.ts";
export { CITIES, DEFAULT_CITY, getCity } from "../../src/lib/cities.ts";
export type { CityId } from "../../src/lib/cities.ts";
export { TOPICS, matchesTopics, parseTopicIds } from "../../src/lib/topics.ts";
export {
  itemStatus,
  stageBadge,
  formatHumanDate,
  filterAndSortByWhen,
  voteSummary,
} from "../../src/lib/item-display.ts";
export { explainItem } from "../../src/lib/plain-language.ts";
export { agendaEvidence } from "../../src/lib/item-details.ts";
export {
  participationState,
  participationLabel,
} from "../../src/lib/participation-state.ts";
export { decisionMilestone } from "../../src/lib/decision-milestone.ts";
export * from "./mobile.ts";
