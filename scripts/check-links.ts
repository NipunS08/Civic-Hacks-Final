#!/usr/bin/env npx ts-node
// check-links.ts — verifies every stored source_url is reachable.
// Run before demos: npx ts-node scripts/check-links.ts
// Or: npm run check-links
//
// Checks: HTTP 200/301/302 = OK, 403/404/500 = broken.
// Output: summary table + non-zero exit code if any failures.

import * as https from "https";
import * as http from "http";
import { URL } from "url";
import { CITIES } from "../src/lib/cities.ts";

// Known source URLs — Ottawa and Toronto entries below, plus every city in src/lib/cities.ts.
// In production this would query the database; here we maintain a static list
// so the script can run without a database connection.
const SOURCE_URLS: Array<{ label: string; url: string; expectedStatus?: number }> = [
  // ---- Ottawa (eScribe) ----
  {
    label: "Ottawa eScribe — Meeting Calendar page",
    url: "https://pub-ottawa.escribemeetings.com/MeetingsCalendarView.aspx",
  },
  {
    label: "Ottawa — Getting involved in council meetings",
    url: "https://ottawa.ca/en/city-hall/council-and-committees/getting-involved-council-and-committee-meetings",
  },
  {
    label: "Ottawa — Committee of Adjustment info",
    url: "https://ottawa.ca/en/city-hall/planning-development-and-construction/committee-adjustment",
  },
  {
    label: "Ontario Planning Act (Ontario Laws)",
    url: "https://www.ontario.ca/laws/statute/90p13",
  },

  // ---- Toronto (CKAN) ----
  {
    label: "Toronto Open Data — Voting Records",
    url: "https://open.toronto.ca/dataset/members-of-toronto-city-council-voting-record/",
  },
  {
    label: "CKAN Datastore — Voting Record Resource",
    url: "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/datastore_search?id=55ead013-2331-4686-9895-9e8145b94189&limit=1",
  },
  {
    label: "Toronto Open Data Licence",
    url: "https://open.toronto.ca/open-data-licence/",
  },
  {
    label: "toronto.ca — Council and Committee Meetings",
    url: "https://www.toronto.ca/city-government/council/council-committee-meetings/",
  },
  // Note: secure.toronto.ca returns 403 from scripts — documented as a known limitation.
  {
    label: "TMMIS Agenda Item (expected 403 from script — works in browser)",
    url: "https://secure.toronto.ca/council/agenda-item.do?item=2026.CC1.1",
    expectedStatus: 403,
  },
  // ---- Every city in the registry: calendar + participation guide ----
  ...CITIES.flatMap(c => [
    { label: `${c.name} — official meeting calendar`, url: c.calendarUrl },
    ...(c.participationUrl ? [{ label: `${c.name} — participation guide`, url: c.participationUrl }] : []),
  ]),
  // ---- Open Data Kingston ----
  { label: "Open Data Kingston — Council Voting Records", url: "https://opendatakingston.cityofkingston.ca/datasets/council-voting-records" },
  { label: "Open Data Kingston — Mayoral Decision Registry", url: "https://opendatakingston.cityofkingston.ca/datasets/mayoral-decision-registry" },
  { label: "City of Kingston Open Data Licence", url: "https://www.cityofkingston.ca/documents/10180/144997/CityofKingston_OpenDataLicense.pdf" },
];

const USER_AGENT = "CivicLens-LinkChecker/1.0 (civichack2026@example.com)";
const TIMEOUT_MS = 10_000;

interface CheckResult {
  label: string;
  url: string;
  status: number | null;
  ok: boolean;
  note: string;
  ms: number;
}

function checkUrl(label: string, url: string): Promise<CheckResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;

    const req = lib.get(
      url,
      {
        headers: { "User-Agent": USER_AGENT },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const ms = Date.now() - start;
        const status = res.statusCode ?? null;
        // Consume response body so the socket is released
        res.resume();

        // Some URLs return a known non-200 status (documented in the URL list)
        const isExpectedStatus =
          "expectedStatus" in SOURCE_URLS.find(s => s.url === url)!
            ? status === SOURCE_URLS.find(s => s.url === url)!.expectedStatus
            : false;
        const ok = status !== null && (status < 400 || isExpectedStatus);

        resolve({
          label,
          url,
          status,
          ok,
          note: isExpectedStatus ? `${status} expected — see docs/quality/LIMITATIONS.md` : "",
          ms,
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve({ label, url, status: null, ok: false, note: "Timeout", ms: TIMEOUT_MS });
    });

    req.on("error", (err) => {
      resolve({ label, url, status: null, ok: false, note: err.message, ms: Date.now() - start });
    });
  });
}

async function main() {
  console.log(`\nCivicLens link checker — ${new Date().toLocaleString("en-CA")}`);
  console.log(`Checking ${SOURCE_URLS.length} source URLs…\n`);

  const results: CheckResult[] = [];
  for (const { label, url } of SOURCE_URLS) {
    const result = await checkUrl(label, url);
    results.push(result);

    const icon = result.ok ? "✓" : "✗";
    const statusStr = result.status !== null ? String(result.status) : "ERR";
    console.log(
      `${icon} [${statusStr}] ${result.label} (${result.ms}ms)${result.note ? " — " + result.note : ""}`
    );
  }

  const failures = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failures.length}/${results.length} links OK`);

  if (failures.length > 0) {
    console.log("\nFAILURES:");
    for (const f of failures) {
      console.log(`  ✗ ${f.label}`);
      console.log(`    URL: ${f.url}`);
      console.log(`    Status: ${f.status ?? "No response"} ${f.note}`);
    }
    process.exit(1);
  } else {
    console.log("All links OK ✓\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("check-links failed:", err);
  process.exit(1);
});
