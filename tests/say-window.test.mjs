// Tests for src/lib/say-window.ts — the "can residents still act?" rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isSayWindowOpen, sourceLabelFor } from "../src/lib/say-window.ts";

const now = new Date("2026-11-12T10:00:00-05:00");

test("a future meeting alone does not verify an open opportunity", () => {
  assert.equal(isSayWindowOpen({ stage: "committee", meeting_date: "2026-11-18" }, now), false);
  assert.equal(isSayWindowOpen({ stage: "city_council", meeting_date: "2026-11-12" }, now), false);
});

test("closed once the meeting date has passed (regression: past meetings showed 'Say-Window open')", () => {
  assert.equal(isSayWindowOpen({ stage: "committee", meeting_date: "2026-11-11" }, now), false);
  assert.equal(isSayWindowOpen({ stage: "city_council", meeting_date: "2026-08-05" }, now), false);
});

test("closed for decided or unknown items", () => {
  assert.equal(isSayWindowOpen({ stage: "decided", meeting_date: "2026-12-01" }, now), false);
  assert.equal(isSayWindowOpen({ stage: "unknown", meeting_date: "2026-12-01" }, now), false);
});

test("source label matches the city (regression: Ottawa items said Toronto)", () => {
  assert.equal(sourceLabelFor({ municipality_id: "ottawa" }), "Ottawa meeting portal (eSCRIBE)");
  assert.match(sourceLabelFor({ municipality_id: "toronto" }), /Toronto/);
  // Every eSCRIBE city names itself, and minutes pages say so
  assert.equal(sourceLabelFor({ municipality_id: "hamilton" }), "Hamilton meeting portal (eSCRIBE)");
  assert.equal(sourceLabelFor({ municipality_id: "guelph", source_url: "https://pub-guelph.escribemeetings.com/Meeting.aspx?Id=x&Agenda=PostMinutes&lang=English&Item=36" }), "Guelph meeting minutes (eSCRIBE)");
  assert.equal(sourceLabelFor({ municipality_id: "kingston", source_url: "https://opendatakingston.cityofkingston.ca/datasets/council-voting-records" }), "Open Data Kingston");
});
