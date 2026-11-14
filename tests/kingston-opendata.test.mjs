// Open Data Kingston: real Council Voting Records rows saved in
// fixtures/kingston/council-voting-records-2026-09-15.json (3 recorded votes on
// Report Number 77, plus New Motions 1 and 2 from the same meeting).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { groupKingstonVotes, mapMayoralDecisions, splitKingstonDescription, KINGSTON_VOTES_DATASET } from "../src/lib/adapters/kingston-opendata.ts";

const rows = JSON.parse(fs.readFileSync(new URL("../fixtures/kingston/council-voting-records-2026-09-15.json", import.meta.url), "utf8"))
  .features.map(f => f.attributes);
const items = groupKingstonVotes(rows, "2026-11-13T12:00:00.000Z", d => `https://example.test/meeting/${d}`);
const byTitle = t => items.find(i => i.title.startsWith(t));

test("one decided item per agenda description, with a source link and date", () => {
  assert.equal(items.length, 5);
  for (const i of items) {
    assert.equal(i.meeting_date, "2026-09-15");
    assert.equal(i.source_url, KINGSTON_VOTES_DATASET);
    assert.equal(i.decision_body, "council");
    assert.equal(i.votes.length, 1);
    assert.equal(i.meeting_url, "https://example.test/meeting/2026-09-15");
  }
});

test("split vote: Interim Woodland Preservation By-Law Exemptions (12 Yea, 1 Nay)", () => {
  const item = byTitle("Interim Woodland Preservation");
  const [vote] = item.votes;
  assert.equal(item.official_code, "Report Number 77");
  assert.equal(vote.result, "Carried");
  assert.deepEqual(vote.tally, { for: 12, against: 1 });
  assert.equal(vote.groups.find(g => g.kind === "against").names.length, 1);
  // "Nay " is published with a trailing space; it must still count as against
  assert.ok(vote.groups.every(g => g.kind !== "other"));
});

test("'Carried as Amended' is kept as published", () => {
  const item = byTitle("686 Centennial Drive");
  assert.equal(item.official_code, "New Motion 1");
  assert.equal(item.votes[0].result, "Carried as Amended");
  assert.equal(item.votes[0].groups[0].names.length, 13);
  assert.ok(item.votes[0].groups[0].names.includes("Mayor Paterson"));
});

test("report prefixes become a secondary Item ID, not the headline", () => {
  assert.deepEqual(
    splitKingstonDescription("Report Number 79: Received from the Chief Administrative Officer (Consent): Clauses 1, 2,  and 3"),
    { code: "Report Number 79", context: "Received from the Chief Administrative Officer (Consent)", title: "Consent items from the Chief Administrative Officer (clauses 1, 2, and 3)" },
  );
  assert.equal(splitKingstonDescription("Miscellaneous Business Items 1 & 2").code, null);
});

test("mayoral decisions without a published date are skipped, never dated by us", () => {
  const out = mapMayoralDecisions([
    { Date: null, Decision_Number: "2026-18", Subject_Matter: "Undated", Comments: null, Link: null, OBJECTID: 84 },
    { Date: 1789430400000, Decision_Number: "2026-17", Subject_Matter: "To Give Written approval of By-Laws passed at the September 15, 2026 Meeting of City Council", Comments: "Meeting Agenda", Link: "https://events.cityofkingston.ca/default/Detail/2026-09-15-1900-City-Council-Meeting", OBJECTID: 83 },
  ], "2026-11-13T12:00:00.000Z");
  assert.equal(out.length, 1);
  assert.equal(out[0].decision_body, "mayor");
  assert.equal(out[0].official_code, "Mayoral Decision 2026-17");
  assert.equal(out[0].meeting_date, "2026-09-15");
});
