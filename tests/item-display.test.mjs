// Display rules: decision stage, status, Past/Upcoming toggle and date formatting.
import { test } from "node:test";
import assert from "node:assert/strict";
import { filterAndSortByWhen, formatHumanDate, itemStatus, parseWhen, primaryVote, stageBadge, expandCode } from "../src/lib/item-display.ts";

const NOW = new Date("2026-11-13T17:00:00Z");
const item = (over = {}) => ({
  id: "x", municipality_id: "ottawa", meeting_id: null, item_number: "OTT-x", title: "T", description: null,
  committee: "City Council", committee_code: "CC", meeting_date: "2026-11-18", ward: null, address: null, lat: null, lng: null,
  stage: "city_council", content_hash: "", source_url: "https://example.test", retrieved_at: "2026-11-13T12:00:00Z",
  votes: [], decision_body: "staff", ...over,
});
const vote = (over = {}) => ({ motion_kind: "main", motion_text: null, result: "Carried (20 to 4)", tally: { for: 20, against: 4 }, groups: [], moved_by: null, seconded_by: null, source_url: "https://example.test", source_date: "2026-09-09", ...over });

test("Past / Upcoming: both selected by default, and either can be chosen alone", () => {
  assert.deepEqual(parseWhen(undefined), ["upcoming", "past"]);
  assert.deepEqual(parseWhen(["upcoming", "past"]), ["upcoming", "past"]);
  assert.deepEqual(parseWhen("past"), ["past"]);
  assert.deepEqual(parseWhen("upcoming,past"), ["upcoming", "past"]);
  assert.deepEqual(parseWhen("nonsense"), ["upcoming", "past"]);
});

test("combined list: upcoming soonest first, then past newest first", () => {
  const items = [
    item({ id: "p-old", meeting_date: "2026-09-01", stage: "decided" }),
    item({ id: "u-late", meeting_date: "2026-12-09" }),
    item({ id: "p-new", meeting_date: "2026-10-07", stage: "decided" }),
    item({ id: "u-soon", meeting_date: "2026-11-18" }),
  ];
  assert.deepEqual(filterAndSortByWhen(items, ["upcoming", "past"], NOW).map(i => i.id), ["u-soon", "u-late", "p-new", "p-old"]);
  assert.deepEqual(filterAndSortByWhen(items, ["past"], NOW).map(i => i.id), ["p-new", "p-old"]);
  assert.deepEqual(filterAndSortByWhen(items, ["upcoming"], NOW).map(i => i.id), ["u-soon", "u-late"]);
});

test("a committee vote is never presented as a final decision", () => {
  const past = item({ meeting_date: "2026-10-01", stage: "decided", decision_body: "committee", votes: [vote()] });
  assert.equal(stageBadge(past, NOW).label, "Committee vote (not final)");
  assert.equal(stageBadge(item({ decision_body: "committee" }), NOW).label, "Committee advice going to Council");
  assert.equal(stageBadge(item(), NOW).label, "Proposal from city staff");
  assert.equal(stageBadge(item({ decision_body: "council", meeting_date: "2026-10-01", stage: "decided", votes: [vote()] }), NOW).label, "Final decision by Council");
});

test("status: a past meeting with no outcome in our record is 'held', not 'decided'", () => {
  assert.equal(itemStatus(item(), NOW), "upcoming");
  assert.equal(itemStatus(item({ meeting_date: "2026-10-01", stage: "decided" }), NOW), "held");
  // ...and a held item is never badged as a decision
  assert.equal(stageBadge(item({ meeting_date: "2026-10-01", stage: "decided", decision_body: "council" }), NOW).label, "Discussed at a meeting");
  assert.equal(itemStatus(item({ meeting_date: "2026-10-01", stage: "decided", votes: [vote()] }), NOW), "decided");
  assert.equal(itemStatus(item({ meeting_date: "2026-10-01", stage: "decided", status_override: "deferred" }), NOW), "deferred");
});

test("featured vote prefers a recorded vote on the main motion", () => {
  const amendment = vote({ motion_kind: "amendment", groups: [{ label: "For", kind: "for", names: ["A"] }] });
  const main = vote({ groups: [{ label: "For", kind: "for", names: ["A"] }] });
  const procedural = vote({ motion_kind: "procedural", groups: [{ label: "For", kind: "for", names: ["A"] }] });
  assert.equal(primaryVote(item({ votes: [procedural, amendment, main] })), main);
  assert.equal(primaryVote(item({ votes: [procedural, amendment] })), amendment);
  assert.equal(primaryVote(item({ votes: [procedural] })), null);
});

test("human dates and acronym expansion", () => {
  assert.equal(formatHumanDate("2026-11-18"), "Wed, Nov 18, 2026");
  assert.equal(formatHumanDate("not a date"), "not a date");
  assert.equal(expandCode("GIC 26-013"), "General Issues Committee");
  assert.equal(expandCode("CM26020"), null);
});
