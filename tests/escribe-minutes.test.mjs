// eSCRIBE minutes and agenda parsing, tested against real pages saved in fixtures/escribe/.
// These cover vote parsing for every published label style:
//   Guelph "Voting in Favour: (n)", Ottawa "For / Against", Kitchener "In Favour",
//   Mississauga "YES / ABSTAIN". (Hamilton minutes are PDF-only, so Hamilton is
//   tested on its agenda: report codes become secondary IDs, not headlines.)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseAgendaBlocks, parseMotions, splitTitle, splitVoterNames, voteKind, motionKind, parseTally, outcomeOverride,
} from "../src/lib/adapters/escribe-minutes.ts";
import { agendaDescription } from "../src/lib/adapters/escribe-content.ts";

const fixture = name => fs.readFileSync(new URL(`../fixtures/escribe/${name}`, import.meta.url), "utf8");
const motionsFor = (html, id) => parseMotions(parseAgendaBlocks(html).find(b => b.id === id));

test("Guelph: recorded vote with every member listed", () => {
  const html = fixture("guelph-council-minutes-2026-09-15.html");
  const [m] = motionsFor(html, 36); // September 2026 Public Appointments
  assert.equal(m.result, "Carried (12 to 0)");
  assert.deepEqual(m.tally, { for: 12, against: 0 });
  assert.equal(m.motion_kind, "main");
  assert.equal(m.groups.length, 1);
  assert.equal(m.groups[0].kind, "for");
  assert.equal(m.groups[0].names.length, 12);
  assert.ok(m.groups[0].names.includes("Mayor Guthrie"));
  assert.equal(m.moved_by, "Councillor Klassen");
});

test("Guelph: moving into a closed meeting is a procedural motion", () => {
  const [m] = motionsFor(fixture("guelph-council-minutes-2026-09-15.html"), 2);
  assert.equal(m.motion_kind, "procedural");
  assert.equal(m.moved_by, "Councillor Caton");
  assert.equal(m.seconded_by, "Councillor Busuttil");
});

test("Ottawa: For / Against groups with names, adjournment vote is procedural", () => {
  const [m] = motionsFor(fixture("ottawa-council-minutes-2026-11-12.html"), 50);
  assert.equal(m.result, "Carried (20 to 4)");
  assert.equal(m.motion_kind, "procedural");
  const against = m.groups.find(g => g.kind === "against");
  assert.deepEqual(against.names, ["M. Luloff", "C. Curry", "J. Leiper", "S. Menard"]);
  assert.equal(m.groups.find(g => g.kind === "for").names.length, 20);
});

test("Ottawa: motions without a recorded vote keep the result but no member groups", () => {
  const blocks = parseAgendaBlocks(fixture("ottawa-council-minutes-2026-11-12.html"));
  const unrecorded = blocks.flatMap(parseMotions).filter(m => m.groups.length === 0 && /carried/i.test(m.result));
  assert.ok(unrecorded.length > 20, "most Ottawa motions are carried without a named vote");
  assert.ok(unrecorded.every(m => m.recorded === false));
});

test("Kitchener: 'In Favour' label and unanimous recorded vote", () => {
  const html = fixture("kitchener-council-minutes-2026-09-28.html");
  const recorded = parseAgendaBlocks(html).flatMap(parseMotions).filter(m => m.recorded);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].groups[0].label, "In Favour (11)");
  assert.equal(recorded[0].groups[0].kind, "for");
  assert.deepEqual(recorded[0].tally, { for: 11, against: 0 });
});

test("Mississauga: YES and ABSTAIN groups; 'Deputy Mayor and Councillor' stays one name", () => {
  const html = fixture("mississauga-council-minutes-2026-09-16.html");
  const [m] = motionsFor(html, 54); // Planning and Development Committee Report
  assert.equal(m.result, "Carried (10 to 0)");
  const yes = m.groups.find(g => g.kind === "for");
  const abstain = m.groups.find(g => g.kind === "abstain");
  assert.equal(yes.names.length, 10);
  assert.ok(yes.names.includes("Deputy Mayor and Councillor M. Mahoney"));
  assert.deepEqual(abstain.names, ["Councillor D. Damerla"]);
});

test("Hamilton agenda: report codes become the Item ID, the description becomes the title", () => {
  const html = fixture("hamilton-council-agenda-2026-10-07.html");
  const block = parseAgendaBlocks(html).find(b => b.title === "CM26020");
  assert.equal(block.counter, "8.1");
  const { title, code } = splitTitle(block.title, agendaDescription(html, block.id));
  assert.equal(code, "CM26020");
  assert.match(title, /^Enterprise Asset Management Project Update/);
  assert.deepEqual(splitTitle("AUD21004(f)", "Cyber Security Follow Up Audit"), { title: "Cyber Security Follow Up Audit", code: "AUD21004(f)" });
  assert.deepEqual(splitTitle("D08-1-26", null), { title: "D08-1-26", code: "D08-1-26" });
  assert.deepEqual(splitTitle("Budget Monitoring Report - 2026-384", null), { title: "Budget Monitoring Report", code: "Report 2026-384" });
  assert.deepEqual(splitTitle("OCC-2026-10 - LRFP – Facilities for full replacement", null), { title: "LRFP – Facilities for full replacement", code: "OCC-2026-10" });
  assert.deepEqual(splitTitle("Eastern Bridge Project", null), { title: "Eastern Bridge Project", code: null });
});

test("vote labels map to fixed kinds", () => {
  assert.equal(voteKind("Voting in Favour: (10)"), "for");
  assert.equal(voteKind("YES (10)"), "for");
  assert.equal(voteKind("Against (4)"), "against");
  assert.equal(voteKind("Opposed (2)"), "against");
  assert.equal(voteKind("NO (3)"), "against");
  assert.equal(voteKind("Absent (1)"), "absent");
  assert.equal(voteKind("ABSTAIN (1)"), "abstain");
  assert.equal(voteKind("Something new (1)"), "other");
});

test("amendments are labelled as amendments, not the main motion", () => {
  assert.equal(motionKind("That the motion be amended by adding the following: …"), "amendment");
  assert.equal(motionKind("Amendment: That Recommendation 2 be deleted"), "amendment");
  assert.equal(motionKind("Committee Recommendation(s), as amended\nThat Council approve …"), "main");
  assert.equal(motionKind("That the meeting adjourn"), "procedural");
});

test("helpers: tallies, names and deferrals", () => {
  assert.deepEqual(parseTally("Carried, unanimously on a recorded vote (11 to 0)"), { for: 11, against: 0 });
  assert.equal(parseTally("Carried"), null);
  assert.deepEqual(splitVoterNames("Mayor A, Councillor B, and Councillor C"), ["Mayor A", "Councillor B", "Councillor C"]);
  const deferred = [{ motion_kind: "main", result: "Carried", motion_text: "That the item be deferred to the next meeting", groups: [] }];
  assert.equal(outcomeOverride(deferred), "deferred");
  assert.equal(outcomeOverride([{ ...deferred[0], result: "Lost" }]), null);
});
