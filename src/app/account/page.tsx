// Account settings — personalized feed, alert preferences, delete, export.
// Server Component that reads the user's session.
// instant=false: this page reads cookies (auth session), so it must render at request time.
export const instant = false;

import { getCity } from "@/lib/cities";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import AlertPrefsForm from "./AlertPrefsForm";
import DeleteAccountButton from "./DeleteAccountButton";
import { connection } from "next/server";

export default async function AccountPage() {
  await connection();
  // If Supabase isn't configured, redirect to login (handles build-time prerender too)
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/auth/login");
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) redirect("/auth/login");

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch the user's alert preferences
  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your account</h1>

      {/* Account info */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Account details</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Email verified:</span>{" "}
            {user.email_confirmed_at ? "Yes ✓" : "No — check your inbox for a verification email"}
          </p>
          <p><span className="font-medium">City for alerts:</span>{" "}
            {getCity(prefs?.municipality_id)?.name ?? (prefs?.municipality_id ? "Unknown municipality" : "Not set")}
          </p>
          <p><span className="font-medium">Ward:</span> {prefs?.ward ?? profile?.ward ?? "Not set"}</p>
        </div>
      </section>

      {/* Alert preferences */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Alert preferences</h2>
        <p className="text-xs text-gray-600 mb-4">
          Email alerts and digests are not available. Saving preferences does not send notifications or opt you in.
        </p>
        <AlertPrefsForm userId={user.id} initialPrefs={prefs} />
      </section>

      {/* Privacy actions */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Privacy &amp; data</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/account/export"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export my data
          </a>
          <DeleteAccountButton />
        </div>
        <p className="text-xs text-gray-600 mt-3">
          We store only your email and an optional coarse location (never your raw address).
          See our <a href="/privacy" className="text-brand-600 hover:underline">privacy notice</a>.
        </p>
      </section>
    </div>
  );
}
