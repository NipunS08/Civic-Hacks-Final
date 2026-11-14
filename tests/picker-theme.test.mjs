// Smoke tests for the municipality picker (filtering, keyboard model, URL parsing)
// and the theme toggle logic (system default, explicit override).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES, filterCities, parseCityId, cityForItemNumber, getCity } from "../src/lib/cities.ts";
import { comboKey, resolveTheme, parseThemeChoice } from "../src/lib/combobox.ts";

test("every city has the fields the UI relies on", () => {
  const ids = new Set();
  for (const c of CITIES) {
    assert.ok(!ids.has(c.id)); ids.add(c.id);
    assert.match(c.calendarUrl, /^https:\/\//);
    assert.ok(c.coverage.length > 0);
    if (c.escribeBase) assert.match(c.escribeBase, /^https:\/\/pub-[a-z]+\.escribemeetings\.com$/);
  }
  assert.ok(["hamilton", "kingston"].every(id => getCity(id)));
});

test("picker: type to filter", () => {
  assert.deepEqual(filterCities("ham").map(c => c.id), ["hamilton"]);
  assert.deepEqual(filterCities("KING").map(c => c.id), ["kingston"]);
  assert.equal(filterCities("").length, CITIES.length);
  assert.equal(filterCities("vancouver").length, 0);
});

test("picker: arrow keys move and wrap, Enter selects, Escape closes", () => {
  let s = { open: false, active: -1 };
  ({ state: s } = comboKey(s, "ArrowDown", 3));
  assert.deepEqual(s, { open: true, active: 0 });
  ({ state: s } = comboKey(s, "ArrowDown", 3));
  ({ state: s } = comboKey(s, "ArrowDown", 3));
  ({ state: s } = comboKey(s, "ArrowDown", 3));
  assert.equal(s.active, 0, "wraps to the top");
  ({ state: s } = comboKey(s, "ArrowUp", 3));
  assert.equal(s.active, 2, "wraps to the bottom");
  const enter = comboKey(s, "Enter", 3);
  assert.deepEqual(enter.action, { type: "select", index: 2 });
  assert.equal(enter.state.open, false);
  const esc = comboKey({ open: true, active: 1 }, "Escape", 3);
  assert.deepEqual(esc.action, { type: "close" });
  assert.equal(esc.state.open, false);
  assert.deepEqual(comboKey({ open: true, active: 0 }, "Enter", 0).action, { type: "none" }, "Enter with no matches does nothing");
});

test("picker: city in the URL is validated, unknown values fall back", () => {
  assert.equal(parseCityId("hamilton"), "hamilton");
  assert.equal(parseCityId(["Kingston"]), "kingston");
  assert.equal(parseCityId("atlantis"), "ottawa");
  assert.equal(parseCityId(undefined), "ottawa");
  assert.equal(cityForItemNumber("HAM-2026-11-18-3972eb0a-16"), "hamilton");
  assert.equal(cityForItemNumber("KGN-V-2026-10-06-a0adb19a63"), "kingston");
  assert.equal(cityForItemNumber("2026.CC12.4"), "toronto");
});

test("theme: follows the system until the user chooses", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(parseThemeChoice(null), "system");
  assert.equal(parseThemeChoice("purple"), "system");
  assert.equal(parseThemeChoice("dark"), "dark");
});
