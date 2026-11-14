// Plain-language privacy notice.
// Written to satisfy CASL and note PIPEDA considerations.

export const metadata = {
  title: "Privacy Notice — CivicLens",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Notice</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: November 2026</p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-gray-900">What we collect and why</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Email address</strong> — to send you alerts you explicitly opt into and for account management.</li>
            <li><strong>Password</strong> — stored hashed by Supabase Auth. We never see it.</li>
            <li><strong>Optional location</strong> — if you provide a postal code or address, we convert it to a geographic point (latitude/longitude) and derive your ward. We do not store your raw address text. We do not log it, expose it in URLs, or share it.</li>
          </ul>
          <p className="mt-2">We do not collect names, phone numbers, demographics, or browsing behaviour. No advertising or analytics trackers are used.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Email alerts (CASL)</h2>
          <p>We send email only when you explicitly opt in in your account settings. Every alert email includes an unsubscribe link. You can also disable alerts or delete your account at any time.</p>
          <p className="mt-2 text-xs text-gray-600">ASSUMPTION: CivicLens is a non-commercial civic-tech project; CASL commercial electronic message rules may not apply, but we follow them anyway as best practice. Confirm with legal counsel if commercializing.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Data storage</h2>
          <p>Your data is stored in a Supabase-managed PostgreSQL database, in the region chosen when the project was set up (SETUP.md recommends the Canadian region, ca-central-1). Row-Level Security ensures your data is only accessible to you and to server-side code running on your behalf.</p>
          <p className="mt-2 text-xs text-gray-600">PIPEDA consideration: if you are a Canadian resident, PIPEDA may apply. We collect the minimum necessary information for the stated purpose and do not share it with third parties except Supabase (the data processor). No cross-border transfer outside North America occurs unless Supabase changes its region. Review Supabase&apos;s data processing agreement for your compliance needs.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Your rights</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Export your data at any time from your account settings.</li>
            <li>Delete your account and all associated data at any time from your account settings.</li>
            <li>Unsubscribe from alerts via any alert email or account settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">What we do not collect</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Raw address text (only a geocoded point and ward are stored).</li>
            <li>Browsing history or page views.</li>
            <li>Device identifiers or IP addresses (a hashed IP is stored only as a consent audit trail for CASL compliance).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">Contact</h2>
          <p>Built for Civic Hack 2026 at the University of Waterloo. Questions? Open an issue on the project repository.</p>
        </section>
      </div>
    </div>
  );
}
