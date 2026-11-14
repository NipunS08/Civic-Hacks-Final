// Ingestion / refresh API route.
//   GET /api/ingest                 → Toronto (CKAN) into Supabase, as before
//   GET /api/ingest?city=hamilton   → one city
//   GET /api/ingest?city=all        → every city in src/lib/cities.ts
//
// For each city it fetches the live official data (warming the 15-minute cache
// so the next visitor gets a fast page) and, when Supabase is configured with a
// service role key, upserts the agenda items into the agenda_items table.
// Recorded votes are shown live from the source and are not stored in the DB yet.
//
// Designed to run:
//   - Locally: `curl "http://localhost:3000/api/ingest?city=all"`
//   - Vercel Cron / GitHub Actions: same URL with the CRON_SECRET bearer header.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";
import { ingestToDatabase } from "@/lib/adapters/toronto-opendata";
import { CITIES, getCity, type CityId } from "@/lib/cities";
import { fetchCityItems } from "@/lib/city-data";

// Vercel function timeout: 60 s on Hobby plan. "all" can take longer on a cold cache.
export const maxDuration = 300;

const hasServiceRole = () =>
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-"));

/** Fetch one city's items and (optionally) store them. */
async function refreshCity(id: CityId) {
  const start = Date.now();
  if (id === "toronto" && hasServiceRole()) {
    const counts = await ingestToDatabase(supabaseAdmin as never);
    return { city: id, ok: true, ms: Date.now() - start, items: counts.itemsUpserted, stored: true };
  }
  const items = await fetchCityItems(id);
  let stored = false;
  if (hasServiceRole() && items.length) {
    const { error } = await supabaseAdmin.from("agenda_items").upsert(
      items.map(i => ({
        municipality_id: i.municipality_id,
        meeting_id: null, // eSCRIBE meeting ids aren't rows in our meetings table
        item_number: i.item_number,
        title: i.title,
        description: i.description,
        committee: i.committee,
        committee_code: i.committee_code,
        meeting_date: i.meeting_date,
        ward: i.ward,
        address: null, // rule 12: raw address text is not stored
        lat: i.lat,
        lng: i.lng,
        stage: i.stage,
        content_hash: i.content_hash,
        source_url: i.source_url,
        retrieved_at: i.retrieved_at,
      })),
      { onConflict: "municipality_id,item_number" },
    );
    if (error) throw new Error(`Item upsert failed: ${error.message}`);
    stored = true;
  }
  return { city: id, ok: true, ms: Date.now() - start, items: items.length, stored };
}

export async function GET(request: Request) {
  // Secret check. Open in development for convenience; in production a missing
  // CRON_SECRET must not leave this write endpoint open to the public.
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Ingestion is disabled: CRON_SECRET is not set." }, { status: 503 });
  }
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const param = new URL(request.url).searchParams.get("city") ?? "toronto";
  const ids: CityId[] = param === "all" ? CITIES.map(c => c.id) : getCity(param) ? [getCity(param)!.id] : [];
  if (!ids.length) {
    return NextResponse.json({ ok: false, error: `Unknown city "${param}". Use one of: all, ${CITIES.map(c => c.id).join(", ")}` }, { status: 400 });
  }

  // One city at a time: each city's portal is a different host, but this keeps load predictable
  const results = [];
  for (const id of ids) {
    try {
      results.push(await refreshCity(id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ingest:${id}] Failed:`, message);
      results.push({ city: id, ok: false, error: message });
    }
  }
  console.log(`[ingest] ${results.map(r => `${r.city}:${r.ok ? ("items" in r ? r.items : 0) : "failed"}`).join(" ")}`);
  return NextResponse.json({ ok: results.every(r => r.ok), results, timestamp: new Date().toISOString() });
}
