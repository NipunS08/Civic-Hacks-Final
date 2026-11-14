// Shown after a user clicks the email verification link.
// The cookie-based browser client handles verification codes and token links.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/db/supabase";
import { supabaseConfigured } from "@/lib/db/configured";

// If no session appears in this time, the link was invalid or expired
const VERIFY_TIMEOUT_MS = 10_000;

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(supabaseConfigured ? "loading" : "error");

  useEffect(() => {
    if (!supabaseConfigured) return; // initial state is already "error"
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const succeed = () => {
      setStatus("success");
      clearTimeout(failTimer);
      redirectTimer = setTimeout(() => router.push("/account"), 2000);
    };

    // Without this, the page spun forever when the link was bad
    const failTimer = setTimeout(() => setStatus(s => (s === "loading" ? "error" : s)), VERIFY_TIMEOUT_MS);

    // Supabase processes the token from the URL hash automatically; listen for the result.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION covers the case where the token was processed before we subscribed
      if (event === "SIGNED_IN" || (event === "INITIAL_SESSION" && session)) {
        succeed();
      } else if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/update-password");
      }
    });
    const unsubscribe = () => subscription.unsubscribe();

    // Clean up listener and timers if the user leaves the page
    return () => {
      unsubscribe();
      clearTimeout(failTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      {status === "loading" && (
        <div role="status">
          <h1 className="text-xl font-bold mb-2">Verifying your email…</h1>
          <p className="text-sm text-gray-600">This usually takes a few seconds.</p>
        </div>
      )}
      {status === "success" && (
        <div role="status">
          <h1 className="text-xl font-bold mb-2">Email verified</h1>
          <p className="text-sm text-gray-600">Redirecting you to your account…</p>
        </div>
      )}
      {status === "error" && (
        <div role="alert">
          <h1 className="text-xl font-bold mb-2">Verification failed</h1>
          <p className="text-sm text-gray-600 mb-4">The link may have expired. Try signing up again, or log in if you already verified.</p>
          <a href="/auth/signup" className="text-brand-700 underline text-sm">Back to sign up</a>
          {" · "}
          <a href="/auth/login" className="text-brand-700 underline text-sm">Log in</a>
        </div>
      )}
    </div>
  );
}
