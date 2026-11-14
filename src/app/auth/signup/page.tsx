// Signup page — email + password only. Supabase Auth handles hashing.
// CASL: explicit opt-in for alerts on the account settings page, not here.
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/db/supabase";
import { supabaseConfigured } from "@/lib/db/configured";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setMessage({ type: "error", text: "Account creation is unavailable because the account service has not been configured." });
      return;
    }
    setLoading(true);
    setMessage(null);

    // Basic client-side validation before hitting the network
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage({ type: "error", text: "Enter a valid email address." });
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Redirect URL after email verification
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data.session) {
        router.push("/account");
        router.refresh();
      } else {
        setMessage({
          type: "success",
          text: "If this email can be registered, check your inbox for a verification link.",
        });
      }
    } catch {
      // Network failure or accounts not configured — never leave the button stuck
      setMessage({ type: "error", text: "Couldn't reach the account service. Please try again later." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
      <p className="text-sm text-gray-600 mb-6">
        Save your account preferences. Email alerts and daily digests are not available yet.
      </p>

      {!supabaseConfigured && <p role="status" className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">Account creation is currently unavailable because the account service is not configured. You can still browse decisions without an account.</p>}

      <form onSubmit={handleSignup} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <p className="text-xs text-gray-600 mt-1">At least 8 characters.</p>
        </div>

        {message && (
          <div
            role="alert"
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-accent-50 border border-accent-200 text-accent-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !supabaseConfigured}
          className="w-full rounded-lg bg-fill px-4 py-2.5 text-sm font-semibold text-on-fill hover:bg-fill-hover disabled:opacity-60 transition-colors"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-xs text-gray-600 mt-5">
        Email delivery is unavailable. Creating an account does not opt you into notifications. We collect
        only your email and optional location.{" "}
        <Link href="/privacy" className="text-brand-600 hover:underline">Privacy notice</Link>.
      </p>

      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand-600 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
