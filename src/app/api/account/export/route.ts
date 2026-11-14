// GET /api/account/export — downloads everything we store about the signed-in user
// as JSON (privacy notice promise). Uses the user's own session, so Row-Level
// Security limits every query to their rows.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export async function GET(request: Request) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Accounts are not set up on this server." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 303 so the browser follows with a GET
    return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  }

  // Each table is RLS-protected to the owner. Do not label a partial export complete.
  const [profile, prefs, consent, notifications] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("alert_preferences").select("*").eq("user_id", user.id),
    supabase.from("channel_consent").select("*").eq("user_id", user.id),
    supabase.from("notification_log").select("*").eq("user_id", user.id),
  ]);

  if ([profile, prefs, consent, notifications].some(result => result.error)) {
    return NextResponse.json({ error: "We couldn't export all your data. Please try again later." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  const body = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, email_confirmed_at: user.email_confirmed_at },
    profile: profile.data ?? null,
    alert_preferences: prefs.data ?? [],
    channel_consent: consent.data ?? [],
    notification_log: notifications.data ?? [],
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="civiclens-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
