// Tests for src/lib/topics.ts — quiz topic parsing and matching.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTopicIds, matchesTopics } from "../src/lib/topics.ts";

test("parseTopicIds accepts repeated and comma-separated params, drops unknown ids", () => {
  assert.deepEqual(parseTopicIds(["housing", "parks"]), ["housing", "parks"]);
  assert.deepEqual(parseTopicIds("housing,transit,<script>"), ["housing", "transit"]);
  assert.deepEqual(parseTopicIds(undefined), []);
  assert.deepEqual(parseTopicIds("housing,housing"), ["housing"]);
});

test("matchesTopics is case-insensitive and matches any selected topic", () => {
  assert.equal(matchesTopics("Zoning By-law Amendment - 292 Lyon", ["housing"]), true);
  assert.equal(matchesTopics("Winter Pathway Maintenance", ["budget"]), false);
  assert.equal(matchesTopics("Anything", []), true);
});
