import { test } from "node:test";
import assert from "node:assert/strict";
import { agendaDescription } from "../src/lib/adapters/escribe-content.ts";
import { agendaEvidence } from "../src/lib/item-details.ts";

const html = `<div class='AgendaItem AgendaItem19'><h3>Investment Performance Review: Q3 2026</h3><div class='AgendaItemDescription RichText'><div><div><p>A presentation will be provided by representatives from the Board’s Outsourced Chief Investment Officer on the investment performance of the City’s prudent investor funds for the period of July to September 2026.</p></div></div></div></div><div class='AgendaItem AgendaItem20'><div class='AgendaItemDescription RichText'><p>Different item</p></div></div>`;

test("reads nested eScribe rich text without mixing agenda items", () => {
  const description = agendaDescription(html, 19);
  assert.match(description, /July to September 2026/);
  assert.doesNotMatch(description, /Different item|<p>/);
  assert.equal(agendaDescription(html, 21), null);
});

test("missing description does not take text from the next item", () => {
  assert.equal(agendaDescription(`<div class='AgendaItem AgendaItem1'>No text</div>${html}`, 1), null);
  assert.equal(agendaDescription(`<div class='AgendaItem AgendaItem1'><div class='AgendaItemDescription RichText'><p>Unclosed</p>`, 1), null);
});

test("decodes entities and preserves paragraph boundaries as text", () => {
  assert.equal(agendaDescription(`<div class='AgendaItem AgendaItem1'><div class='AgendaItemDescription RichText'><p>City&#58; A &amp; B</p><p>Next &lt;step&gt;</p></div></div>`, 1), 'City: A & B\nNext <step>');
});

test("reporting periods are not converted into implementation dates", () => {
  const evidence = agendaEvidence(agendaDescription(html, 19));
  assert.deepEqual(evidence.timing, []);
  assert.deepEqual(evidence.impacts, []);
  assert.match(evidence.overview, /investment performance/);
});

test("impact and timing evidence remains verbatim and missing data stays empty", () => {
  const description = 'Construction may start in June 2027, subject to approval.\nResidents may experience noise.';
  const evidence = agendaEvidence(description);
  assert.deepEqual(evidence.timing, ['Construction may start in June 2027, subject to approval.']);
  assert.deepEqual(evidence.impacts, ['Residents may experience noise.']);
  assert.deepEqual(agendaEvidence(null), {overview: '', impacts: [], timing: []});
});
