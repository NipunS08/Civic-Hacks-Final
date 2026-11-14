// FAQ page — the full list of questions (the home page shows the first five).
import Link from "next/link";
import FaqList from "@/components/landing/FaqList";

export const metadata = { title: "FAQ — CivicLens" };

export default function FaqPage() {
  return (
    <>
      <section className="cl-pagehero">
        <div className="cl-wrap">
          <div className="cl-pagehero-inner">
            <p className="cl-eyebrow" style={{ color: "var(--accent-soft)" }}>FAQ</p>
            <h1 className="cl-h1">Frequently asked questions</h1>
            <p className="cl-lead">How CivicLens works, where its information comes from, and what it does with your data.</p>
          </div>
        </div>
      </section>
      <section className="cl-faq">
        <div className="cl-wrap">
          <div className="cl-faq-grid">
            <div className="cl-faq-title">
              <h2 className="cl-h3">Still have a question?</h2>
              <p className="cl-muted" style={{ marginTop: 12 }}>
                The Sources &amp; Data page lists every source we use and what is missing from each.
              </p>
              <Link href="/sources" className="cl-btn cl-btn-outline">Sources &amp; data →</Link>
            </div>
            <FaqList />
          </div>
        </div>
      </section>
    </>
  );
}
