// API route for signing out. Accepts POST from the navbar form.
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured: there is no session to end, so just go home
  }
  // Build the URL from the request (works on any domain, not just localhost) and
  // use 303 so the browser follows with GET — a 307 would re-POST to "/".
  return NextResponse.redirect(new URL("/", request.url), 303);
}
