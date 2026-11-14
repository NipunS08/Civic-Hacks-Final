import { test } from "node:test";
import assert from "node:assert/strict";
import { itemPreview } from "../src/lib/item-preview.ts";

test("investment preview expands the quarter without inventing results", () => {
  assert.match(itemPreview("Investment Performance Review: Q3 2026"), /July–September 2026/);
  assert.match(itemPreview("Investment Performance Review: Q1 2026"), /January–March 2026/);
  assert.match(itemPreview("Investment Performance Review: Q4 2026"), /October–December 2026/);
  assert.match(itemPreview("Investment Performance Review: Q3 2026"), /does not say whether returns rose or fell/);
});

test("unrecognised or misleading titles stay in the transparent fallback", () => {
  for (const title of ["Investment Performance Review: Q5 2026", "Report on budget software", "Motions"]) {
    assert.match(itemPreview(title), /title alone does not explain/);
  }
});

test("address preview does not infer a development proposal or affected residents", () => {
  const preview = itemPreview("1622 Beckett's Creek (Ward 1 - Orléans East-Cumberland)");
  assert.match(preview, /An agenda entry for 1622 Beckett's Creek\./);
  assert.match(preview, /does not describe the request/);
});
