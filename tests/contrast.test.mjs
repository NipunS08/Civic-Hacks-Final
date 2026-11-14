// WCAG 2.1 AA contrast check for every text/background pair the UI uses, in both
// themes. Reads the real tokens from src/app/globals.css, so changing a colour
// there without keeping contrast fails this test.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** Collect "--name: value;" declarations from the first block matching `selector`. */
function block(selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `missing ${selector}`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
}

const light = block(":root {");
const dark = { ...light, ...block(':root[data-theme="dark"] {') };

function resolve(tokens, value, depth = 0) {
  const v = tokens[value] ?? value;
  const ref = /^var\((--[\w-]+)\)$/.exec(v);
  return ref && depth < 10 ? resolve(tokens, ref[1], depth + 1) : v;
}

function luminance(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(tokens, fg, bg) {
  const [a, b] = [luminance(resolve(tokens, fg)), luminance(resolve(tokens, bg))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// [foreground, background, minimum ratio, where it is used]
const TEXT = 4.5, UI = 3;
const PAIRS = [
  ["--ink", "--bg", TEXT, "body text"],
  ["--ink", "--card", TEXT, "card text"],
  ["--ink-soft", "--card", TEXT, "secondary text on cards"],
  ["--ink-soft", "--bg", TEXT, "secondary text on page"],
  ["--ink-soft", "--surface-muted", TEXT, "notes, vote boxes"],
  ["--ink", "--surface-muted", TEXT, "neutral badge"],
  ["--primary", "--card", TEXT, "links on cards"],
  ["--primary", "--bg", TEXT, "links on page"],
  ["--primary-strong", "--primary-soft", TEXT, "blue badge, selected chip"],
  ["--ink", "--primary-soft", TEXT, "active picker option"],
  ["--accent-text", "--card", TEXT, "green small text"],
  ["--accent-text", "--accent-soft", TEXT, "green badge"],
  ["--accent-text", "--surface-muted", TEXT, "'For' vote row"],
  ["--danger-text", "--surface-muted", TEXT, "'Against' vote row"],
  ["--danger-text", "--danger-bg", TEXT, "error alert"],
  ["--warn-text", "--warn-bg", TEXT, "deferred / amendment badge"],
  ["--on-fill", "--fill-primary", TEXT, "primary buttons, selected toggle"],
  ["--on-fill", "--fill-hero", TEXT, "hero headings"],
  ["--on-fill-muted", "--fill-hero", TEXT, "hero body text"],
  ["--blue-900", "--brand-white", TEXT, "light button on hero"],
  ["--focus", "--card", UI, "focus ring on cards"],
  ["--focus", "--bg", UI, "focus ring on page"],
  ["--border-strong", "--card", UI, "input and chip borders"],
];

for (const [name, tokens] of [["light", light], ["dark", dark]]) {
  test(`WCAG AA contrast, ${name} theme`, () => {
    const failures = PAIRS
      .map(([fg, bg, min, use]) => ({ fg, bg, min, use, r: ratio(tokens, fg, bg) }))
      .filter(p => p.r < p.min)
      .map(p => `${p.use}: ${p.fg} on ${p.bg} = ${p.r.toFixed(2)} (needs ${p.min})`);
    assert.deepEqual(failures, []);
  });
}

test("brand green is not used for small text on white (it fails AA)", () => {
  assert.ok(ratio(light, "--brand-green", "--brand-white") < TEXT);
  assert.ok(ratio(light, "--green-700", "--brand-white") >= TEXT);
});

test("system dark mode and explicit dark mode use the same values", () => {
  const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
  const systemDark = Object.fromEntries([...media.slice(0, media.indexOf("\n  }\n}")).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  assert.deepEqual(systemDark, block(':root[data-theme="dark"] {'));
});
