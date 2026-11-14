"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/db/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Couldn't reach the account service. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <div className="text-4xl mb-4" aria-hidden>✉️</div>
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-gray-600">
          We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your inbox.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block text-sm text-brand-600 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
      <p className="text-sm text-gray-600 mb-6">Enter your email and we&apos;ll send a reset link.</p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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

        {error && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-fill px-4 py-2.5 text-sm font-semibold text-on-fill hover:bg-fill-hover disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        <Link href="/auth/login" className="text-brand-600 hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}
