import { test } from "node:test";
import assert from "node:assert/strict";
import { civiReducer, civiFeedHref, INITIAL_CIVI_STATE } from "../src/lib/civi.ts";

test("Civi can open, follow choices, go back and restart without navigating", () => {
  let state = civiReducer(INITIAL_CIVI_STATE, { type: "open", step: "city" });
  state = civiReducer(state, { type: "choose", step: "topics" });
  state = civiReducer(state, { type: "choose", step: "explore" });
  assert.deepEqual(state.trail, ["start", "city", "topics", "explore"]);
  state = civiReducer(state, { type: "back" });
  assert.equal(state.trail.at(-1), "topics");
  state = civiReducer(state, { type: "restart" });
  assert.deepEqual(state, { open: true, trail: ["start"] });
  assert.deepEqual(civiReducer(state, { type: "back" }), state);
});

test("minimizing and reopening preserves the resident's place in the guide", () => {
  let state = civiReducer(INITIAL_CIVI_STATE, { type: "open" });
  state = civiReducer(state, { type: "choose", step: "participate" });
  state = civiReducer(state, { type: "close" });
  assert.equal(state.open, false);
  state = civiReducer(state, { type: "open" });
  assert.equal(state.open, true);
  assert.equal(state.trail.at(-1), "participate");
  assert.equal(civiReducer(state, { type: "choose", step: "participate" }), state);
});

test("exploring through Civi preserves active topics, dates, city, search and stage", () => {
  const query = "municipality=kingston&when=upcoming&when=past&topics=housing&topics=transit&stage=council&q=Main+Street";
  assert.equal(civiFeedHref("ottawa", query), `/feed?${query}`);
  assert.equal(civiFeedHref("guelph"), "/feed?municipality=guelph");
  assert.equal(civiFeedHref("ottawa", "city=toronto&topics=budget"), "/feed?city=toronto&topics=budget");
});
