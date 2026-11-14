"use client";
// Where the password-reset email lands (redirectTo in /auth/reset).
// Supabase signs the user in from the link's token; we then set the new
// password with supabase.auth.updateUser — no passwords handled by our code.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db/supabase";
import { supabaseConfigured } from "@/lib/db/configured";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">(supabaseConfigured ? "checking" : "invalid");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show the form once the reset link has produced a session
  useEffect(() => {
    if (!supabaseConfigured) return; // initial state is already "invalid"
    let cancelled = false;
    supabase.auth.getSession()
      .then(({ data }) => { if (!cancelled) setReady(data.session ? "ok" : "invalid"); })
      .catch(() => { if (!cancelled) setReady("invalid"); });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPw) return setError("The two passwords don't match.");

    setSaving(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      router.push("/account");
    } catch {
      setError("Couldn't update your password. The link may have expired; request a new one.");
      setSaving(false);
    }
  }

  if (ready === "checking") {
    return <p className="mx-auto max-w-sm px-4 py-16 text-sm text-gray-600" role="status">Checking your reset link…</p>;
  }

  if (ready === "invalid") {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset link not valid</h1>
        <p className="text-sm text-gray-600 mb-4">This link has expired or was already used.</p>
        <Link href="/auth/reset" className="text-sm text-brand-700 underline">Request a new reset link</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6" noValidate>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          <p className="text-xs text-gray-600 mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required
            value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <button type="submit" disabled={saving}
          className="w-full rounded-lg bg-fill px-4 py-2.5 text-sm font-semibold text-on-fill hover:bg-fill-hover disabled:opacity-60">
          {saving ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
