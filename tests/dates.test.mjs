// Tests for src/lib/dates.ts — run with `npm test` (Node's built-in test runner).
// Regression: date-only meeting dates were shown one day early in Toronto time.
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMeetingDate, daysUntil, todayYmd, isTodayOrLater, toYmd } from "../src/lib/dates.ts";

test("formatMeetingDate keeps the calendar day (no UTC shift)", () => {
  assert.equal(formatMeetingDate("2026-08-05"), "August 5, 2026");
  assert.equal(formatMeetingDate("2026-11-12"), "November 12, 2026");
  assert.equal(
    formatMeetingDate("2026-08-05", { weekday: "long", month: "long", day: "numeric" }),
    "Wednesday, August 5",
  );
});

test("formatMeetingDate shows unknown formats as-is", () => {
  assert.equal(formatMeetingDate("TBD"), "TBD");
});

test("todayYmd uses Toronto time, not UTC", () => {
  // 03:00 UTC on Nov 13 is still Nov 12 in Toronto (UTC-5)
  assert.equal(todayYmd(new Date("2026-11-13T03:00:00Z")), "2026-11-12");
});

test("daysUntil counts calendar days in Toronto", () => {
  const now = new Date("2026-11-12T22:00:00-05:00"); // late evening Nov 12, Toronto
  assert.equal(daysUntil("2026-11-12", now), 0);
  assert.equal(daysUntil("2026-11-13", now), 1);
  assert.equal(daysUntil("2026-11-11", now), -1);
  assert.equal(daysUntil("not a date", now), null);
});

test("isTodayOrLater", () => {
  const now = new Date("2026-11-12T09:00:00-05:00");
  assert.equal(isTodayOrLater("2026-11-12", now), true);
  assert.equal(isTodayOrLater("2026-11-11", now), false);
});

test("toYmd accepts datetime strings", () => {
  assert.equal(toYmd("2026-11-18T13:00:00"), "2026-11-18");
  assert.equal(toYmd("18/11/2026"), null);
});

test("invalid calendar dates never create a false meeting or participation window", () => {
  for (const date of ["2026-02-30", "2026-13-01", "2026-00-01", "2026-11-31"]) {
    assert.equal(toYmd(date), null);
    assert.equal(formatMeetingDate(date), date);
    assert.equal(daysUntil(date), null);
    assert.equal(isTodayOrLater(date), false);
  }
  assert.equal(toYmd("2028-02-29"), "2028-02-29");
});
