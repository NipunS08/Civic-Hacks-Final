// Branded 404 page — replaces Next's default black page, which had no way back.
// Item pages land here when an item has left the source feed (e.g. an old link).
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="cl-faq">
      <div className="cl-wrap" style={{ maxWidth: 720, display: "grid", gap: 20 }}>
        <p className="cl-eyebrow">Page not found</p>
        <h1 className="cl-h2">We couldn&apos;t find that page</h1>
        <p className="cl-lead cl-muted">
          If you followed a link to an agenda item, it may no longer be in the city&apos;s
          published feed. Items from meetings more than about two and a half months ago drop out of the feed.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/feed" className="cl-btn">Browse current items</Link>
          <Link href="/" className="cl-btn cl-btn-outline">Go to the home page</Link>
        </div>
      </div>
    </section>
  );
}
