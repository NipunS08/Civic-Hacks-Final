"use client";

import { useState } from "react";
import { CITIES, parseCityId } from "@/lib/cities";
import { supabase } from "@/lib/db/supabase";

interface AlertPrefs {
  id?: string;
  user_id: string;
  municipality_id: string;
  topics: string[];
  ward: string | null;
  radius_m: number | null;
  channels: string[];
  digest: boolean;
}

interface Props {
  userId: string;
  initialPrefs: AlertPrefs | null;
}

export default function AlertPrefsForm({ userId, initialPrefs }: Props) {
  const [topics, setTopics] = useState((initialPrefs?.topics ?? []).join(", "));
  const [ward, setWard] = useState(initialPrefs?.ward ?? "");
  const [emailEnabled, setEmailEnabled] = useState(
    false
  );
  const [, setDigest] = useState(initialPrefs?.digest ?? false);
  // Any supported city; unknown values fall back to the default city
  const [city, setCity] = useState<string>(parseCityId(initialPrefs?.municipality_id));
  // Remember the saved email setting so we only log consent when it actually changes
  const [savedEmailEnabled, setSavedEmailEnabled] = useState(
    initialPrefs?.channels?.includes("email") ?? false
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const channels: string[] = []; // Delivery is unavailable; saving preferences cannot opt in.
    const topicsArr = topics.split(",").map((t) => t.trim()).filter(Boolean);

    const payload = {
      user_id: userId,
      municipality_id: city,
      topics: topicsArr,
      ward: ward || null,
      radius_m: null,
      channels,
      digest: false,
    };

    try {
      const { error: err } = await supabase
        .from("alert_preferences")
        .upsert(payload, { onConflict: "user_id" });
      if (err) throw err;

      // CASL audit trail: record each opt-in / opt-out of email alerts
      if (emailEnabled !== savedEmailEnabled) {
        const { error: consentErr } = await supabase
          .from("channel_consent")
          .insert({ user_id: userId, channel: "email", opted_in: emailEnabled });
        if (consentErr) throw consentErr;
        setSavedEmailEnabled(emailEnabled);
      }
      setSaved(true);
    } catch (err) {
      // Network failure or missing config: show a readable message, keep the inputs
      const msg = err instanceof Error ? err.message : "";
      setError(`Couldn't save your preferences. Please try again.${msg ? ` (${msg})` : ""}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <fieldset disabled={saving} className="space-y-4">
      {/* Email alerts opt-in (CASL explicit consent) */}
      <div className="flex items-start gap-3">
        <input
          id="email-alerts"
          disabled
          type="checkbox"
          checked={false}
          onChange={(e) => { setEmailEnabled(e.target.checked); setSaved(false); }}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600"
        />
        <div>
          <label htmlFor="email-alerts" className="text-sm font-medium text-gray-700">
            Receive email alerts
          </label>
          <p className="text-xs text-gray-600">
            Email delivery is not available. No deadline notifications are sent. You can save city and topic preferences for future use.
          </p>
        </div>
      </div>

      {/* Digest option */}
      <div className="flex items-start gap-3">
        <input
          id="digest"
          disabled
          type="checkbox"
          checked={false}
          onChange={(e) => { setDigest(e.target.checked); setSaved(false); }}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600"
        />
        <div>
          <label htmlFor="digest" className="text-sm font-medium text-gray-700">Daily digest</label>
          <p className="text-xs text-gray-600">Daily digest delivery is not implemented.</p>
        </div>
      </div>

      {/* City: chip group (same style as the feed filters, keyboard-accessible radios) */}
      <fieldset className="cl-fieldset">
        <legend>City</legend>
        <div className="cl-chip-group">
          {CITIES.map(c => (
            <label key={c.id} className="cl-chip">
              <input
                type="radio"
                name="city"
                value={c.id}
                checked={city === c.id}
                onChange={() => { setCity(c.id); setSaved(false); }}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Ward filter */}
      <div>
        <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
          Ward (optional)
        </label>
        <input
          id="ward"
          type="text"
          placeholder="e.g. Ward 14"
          value={ward}
          onChange={(e) => { setWard(e.target.value); setSaved(false); }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-gray-600 mt-1">
          Only alert on items in this ward. Leave blank for all wards.
        </p>
      </div>

      {/* Topic keywords */}
      <div>
        <label htmlFor="topics" className="block text-sm font-medium text-gray-700 mb-1">
          Topic keywords (optional)
        </label>
        <input
          id="topics"
          type="text"
          placeholder="e.g. zoning, transit, housing"
          value={topics}
          onChange={(e) => { setTopics(e.target.value); setSaved(false); }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <p className="text-xs text-gray-600 mt-1">Comma-separated keywords. Items matching any keyword will trigger an alert.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div role="status" className="rounded-lg bg-accent-50 border border-accent-200 px-4 py-3 text-sm text-accent-700">
          Preferences saved. Email delivery remains unavailable.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-fill px-4 py-2 text-sm font-semibold text-on-fill hover:bg-fill-hover disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
      </fieldset>
    </form>
  );
}
