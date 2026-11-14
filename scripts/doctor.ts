#!/usr/bin/env npx ts-node
// npm run doctor — checks the environment before first run.
// Verifies: Node version, required env vars, CKAN API reachability, Supabase connectivity.
// Prints a clear pass/fail checklist and exits non-zero if anything is missing.

import * as https from "https";
import * as fs from "fs";
import * as path from "path";

// Load .env.local if it exists (mimics what Next.js does)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.+)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

const checks: Check[] = [];

function pass(name: string, detail: string) {
  checks.push({ name, pass: true, detail });
}
function fail(name: string, detail: string) {
  checks.push({ name, pass: false, detail });
}

// ---- Node version
const nodeVersion = process.versions.node;
const major = parseInt(nodeVersion.split(".")[0], 10);
const minor = parseInt(nodeVersion.split(".")[1], 10);
if (major > 20 || (major === 20 && minor >= 9)) {
  pass("Node.js version", `v${nodeVersion} (≥20.9 required)`);
} else {
  fail("Node.js version", `v${nodeVersion} — need ≥20.9`);
}

// ---- Required env vars
const required = [
  { key: "NEXT_PUBLIC_SUPABASE_URL",      hint: "Get from Supabase project → Settings → API" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", hint: "Get from Supabase project → Settings → API" },
  { key: "SUPABASE_SERVICE_ROLE_KEY",     hint: "Get from Supabase project → Settings → API (keep secret!)" },
];

for (const { key, hint } of required) {
  if (process.env[key] && !process.env[key]!.includes("your-")) {
    pass(key, "set");
  } else {
    fail(key, `Missing or placeholder. ${hint}`);
  }
}

// Optional env vars — warn but don't fail
const optional = [
  { key: "RESEND_API_KEY",    note: "If blank, emails print to console (dev mode)" },
  { key: "NEXT_PUBLIC_APP_URL", note: "Defaults to http://localhost:3000" },
];
for (const { key, note } of optional) {
  if (process.env[key] && !process.env[key]!.includes("your-")) {
    pass(`${key} (optional)`, "set");
  } else {
    pass(`${key} (optional)`, `Not set — ${note}`);
  }
}

// ---- CKAN reachability
async function checkHttp(label: string, url: string): Promise<void> {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 8000, headers: { "User-Agent": "CivicLens-Doctor/1.0" } }, (res) => {
      res.resume();
      if (res.statusCode && res.statusCode < 400) {
        pass(label, `HTTP ${res.statusCode}`);
      } else {
        fail(label, `HTTP ${res.statusCode}`);
      }
      resolve();
    });
    req.on("timeout", () => { req.destroy(); fail(label, "Timeout"); resolve(); });
    req.on("error",   (e) => { fail(label, e.message); resolve(); });
  });
}

async function checkSupabase(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || url.includes("your-") || !key || key.includes("your-")) {
    fail("Supabase connectivity", "NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set — skipped");
    return;
  }
  // Must send apikey header — Supabase rejects unauthenticated requests with 401
  return new Promise((resolve) => {
    const req = https.get(
      `${url}/auth/v1/settings`,
      { timeout: 8000, headers: { "User-Agent": "CivicLens-Doctor/1.0", "apikey": key } },
      (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 400) {
          pass("Supabase connectivity", `HTTP ${res.statusCode}`);
        } else {
          fail("Supabase connectivity", `HTTP ${res.statusCode} — check your keys in .env.local`);
        }
        resolve();
      }
    );
    req.on("timeout", () => { req.destroy(); fail("Supabase connectivity", "Timeout"); resolve(); });
    req.on("error",   (e) => { fail("Supabase connectivity", e.message); resolve(); });
  });
}

async function main() {
  console.log("\nCivicLens Doctor\n");

  await checkHttp("Toronto CKAN API", "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/status_show");
  await checkSupabase();

  console.log("Results:\n");
  let failures = 0;
  for (const c of checks) {
    const icon = c.pass ? "✓" : "✗";
    console.log(`  ${icon}  ${c.name}: ${c.detail}`);
    if (!c.pass) failures++;
  }

  console.log(`\n${checks.filter(c=>c.pass).length}/${checks.length} checks passed.`);

  if (failures > 0) {
    console.log(`\n${failures} check(s) failed. See docs/setup/SETUP.md for instructions.\n`);
    process.exit(1);
  } else {
    console.log("\nAll required checks passed. Run: npm run dev\n");
  }
}

main();
