// Plain-language explanations: rule-based, from the official record only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { explainItem, addressFromTitle, purposeSentence, requestKind, describeBody } from "../src/lib/plain-language.ts";
import { stripApplicantNames } from "../src/lib/adapters/escribe-minutes.ts";

const NOW = new Date("2026-11-13T17:00:00Z");
const item = (over = {}) => ({
  id: "x", municipality_id: "ottawa", meeting_id: null, item_number: "OTT-x", title: "T", description: null,
  committee: "City Council", committee_code: "CC", meeting_date: "2026-11-18", ward: null, address: null, lat: null, lng: null,
  stage: "city_council", content_hash: "", source_url: "https://example.test", retrieved_at: "2026-11-13T12:00:00Z",
  votes: [], decision_body: "staff", ...over,
});

test("property request gets a plain headline and the official purpose", () => {
  const p = explainItem(item({
    title: "9467 Marvelville (Ward 20 - Osgoode)",
    committee: "Committee of Adjustment - Panel 3", decision_body: "board", stage: "committee", meeting_date: "2026-11-17",
    description: "D08-02-26/A-00146 Minor Variance Application To permit an additional mobile home to be located on a lot with a reduced area.",
  }), NOW);
  assert.equal(p.headline, "Request for an exception to zoning rules at 9467 Marvelville");
  assert.match(p.whatsHappening, /public hearing on Tue, Nov 17, 2026.*Nothing has been decided yet/);
  assert.equal(p.details, "To permit an additional mobile home to be located on a lot with a reduced area.");
  assert.equal(p.detailsLabel, "What the owner is asking for");
});

test("consent applications read as dividing land", () => {
  assert.equal(requestKind({ title: "1622 Beckett's Creek", description: "D08-01-25/B-00222 - 00223 Consent Applications To subdivide the property" }), "consent");
  assert.equal(addressFromTitle("A-2026-00485 270 West 18th Street, Hamilton(Ward 8)"), "270 West 18th Street");
  assert.equal(addressFromTitle("Eastern Bridge Project"), null);
  assert.equal(purposeSentence("Applicant(s): X. To subdivide the property into three separate parcels of land."), "To subdivide the property into three separate parcels of land.");
});

test("applicant names are removed but the purpose stays", () => {
  assert.equal(
    stripApplicantNames("D08-02-26/A-00145 Minor Variance Application Applicant(s): M. Gagnon and R. Zamat To permit an increased lot coverage."),
    "D08-02-26/A-00145 Minor Variance Application To permit an increased lot coverage.",
  );
  assert.equal(stripApplicantNames("Owner: E. Fortino Applicant: E. Fortino"), null);
});

test("decided items say what happened in everyday words", () => {
  const vote = { motion_kind: "main", motion_text: null, result: "Carried (23 to 2)", tally: { for: 23, against: 2 }, groups: [{ label: "For", kind: "for", names: ["A"] }], moved_by: null, seconded_by: null, source_url: "x", source_date: "2026-09-09" };
  const council = explainItem(item({ meeting_date: "2026-09-09", stage: "decided", decision_body: "council", votes: [vote] }), NOW);
  assert.equal(council.whatsHappening, "City Council voted on this on Wed, Sep 9, 2026. It passed by a vote of 23 to 2.");
  const committee = explainItem(item({ committee: "Planning Committee", meeting_date: "2026-09-09", stage: "decided", decision_body: "committee", votes: [{ ...vote, groups: [] }] }), NOW);
  assert.match(committee.whatsHappening, /It passed\. Members' individual votes weren't recorded\..*not final/);
  const held = explainItem(item({ meeting_date: "2026-09-09", stage: "decided" }), NOW);
  assert.match(held.whatsHappening, /We don't have the result/);
});

test("upcoming council and committee items say nothing is decided yet", () => {
  assert.match(explainItem(item(), NOW).whatsHappening, /^City Council will discuss this at its meeting on Wed, Nov 18, 2026\. Nothing has been decided yet\.$/);
  assert.match(explainItem(item({ committee: "Planning and Housing Committee", stage: "committee" }), NOW).whatsHappening, /usually goes to City Council/);
});

test("bodies are described in common words", () => {
  assert.equal(describeBody("Committee of Adjustment - Panel 3").short, "a city panel");
  assert.equal(describeBody("General Issues Committee").short, "a committee of all councillors");
  assert.equal(describeBody("City Council").short, "City Council");
});

test("card result line: short, plain, and honest about missing results", async () => {
  const { shortOutcome } = await import("../src/lib/plain-language.ts");
  const vote = { motion_kind: "main", motion_text: null, result: "Carried (23 to 2)", tally: { for: 23, against: 2 }, groups: [{ label: "For", kind: "for", names: ["A"] }], moved_by: null, seconded_by: null, source_url: "x", source_date: "2026-09-09" };
  assert.equal(shortOutcome(item(), NOW), null, "upcoming items have no result line");
  assert.equal(shortOutcome(item({ meeting_date: "2026-09-09", stage: "decided", decision_body: "council", votes: [vote] }), NOW), "Passed, 23 to 2");
  assert.equal(shortOutcome(item({ meeting_date: "2026-09-09", stage: "decided", decision_body: "committee", votes: [{ ...vote, groups: [] }] }), NOW), "Passed, 23 to 2 · individual votes not recorded · not final: goes to City Council");
  assert.equal(shortOutcome(item({ meeting_date: "2026-09-09", stage: "decided", source_url: "https://x/Meeting.aspx?Agenda=PostMinutes" }), NOW), "No separate vote listed in the minutes");
  assert.equal(shortOutcome(item({ meeting_date: "2026-09-09", stage: "decided" }), NOW), "Not published yet");
});
