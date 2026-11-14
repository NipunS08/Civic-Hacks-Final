#!/usr/bin/env npx ts-node
// Standalone ingest script — run directly without the Next.js server.
// npm run ingest
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.

import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

import { createClient } from "@supabase/supabase-js";
import { ingestToDatabase } from "../src/lib/adapters/toronto-opendata";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-")) {
    console.error("Missing Supabase credentials. See docs/setup/SETUP.md.");
    process.exit(1);
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Starting Toronto Open Data ingestion…");
  const start = Date.now();

  try {
    const counts = await ingestToDatabase(client as never);
    console.log(`Done in ${Date.now() - start}ms:`);
    console.log(`  Meetings upserted: ${counts.meetingsUpserted}`);
    console.log(`  Items upserted:    ${counts.itemsUpserted}`);
  } catch (err) {
    console.error("Ingestion failed:", err);
    process.exit(1);
  }
}

main();
