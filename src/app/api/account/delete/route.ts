// POST /api/account/delete — permanently deletes the signed-in user's account.
// The user is identified from their own session cookie (never from the request
// body), then removed with the admin API. profiles, alert_preferences,
// channel_consent and notification_log rows cascade from auth.users (schema.sql).

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export async function POST(request: Request) {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return NextResponse.json({ error: "Accounts are not set up on this server." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  }

  try {
    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (err) {
    console.error("[account/delete] failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "We couldn't delete your account. Please try again later." },
      { status: 500 },
    );
  }

  // Clear the session cookie, then send the user home (303 = follow with GET)
  // scope "local" only clears cookies; the server session died with the user
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/?account=deleted", request.url), 303);
}
