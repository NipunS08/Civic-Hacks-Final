import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Navbar, { GuestActions } from "@/components/layout/Navbar";
import HeaderShell from "@/components/layout/HeaderShell";
import Logo from "@/components/layout/Logo";
import { THEME_INIT_SCRIPT } from "@/lib/combobox";
import { CITIES } from "@/lib/cities";
import CiviGuide from "@/components/civi/CiviGuide";
import "./globals.css";

// Figtree: a clean, highly legible geometric sans
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CivicLens — What is your council deciding?",
  description:
    "See what Ontario city councils are deciding, where each item is in the process, how council members voted, and when you can have your say. Every item links to its official source.",
  keywords: [...CITIES.map(c => c.name), "city council", "council votes", "civic engagement", "public participation"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the theme script may set data-theme before React loads
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${figtree.variable} antialiased min-h-screen`}>
        {/* Skip link for keyboard and screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to main content
        </a>

        {/* Navbar reads cookies (auth session), so it streams in; the fallback is the logged-out header */}
        <Suspense fallback={<HeaderShell actions={<GuestActions />} />}>
          <Navbar />
        </Suspense>

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="cl-footer">
          <div className="cl-wrap">
            <div className="cl-footer-main">
              <div className="cl-footer-brand">
                <Logo />
                <p>Understand what your city is deciding and find your way to have a say.</p>
                <Link href="/feed" className="cl-footer-discover">Explore decisions <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>

              <nav className="cl-footer-nav" aria-label="Footer">
                <div>
                  <p className="cl-footer-heading">Explore</p>
                  <ul>
                    <li><Link href="/feed">What&apos;s happening</Link></li>
                    <li><Link href="/about">About</Link></li>
                    <li><Link href="/faq">FAQ</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="cl-footer-heading">Resources</p>
                  <ul>
                    <li><Link href="/sources">Data sources &amp; last updated</Link></li>
                    <li><Link href="/privacy">Privacy</Link></li>
                  </ul>
                </div>
              </nav>

              <div className="cl-footer-trust">
                <span className="cl-footer-trust-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
                <div>
                  <p className="cl-footer-trust-title">Built on public records</p>
                  <p>Independent and not affiliated with any municipality. Every item links to its official source and shows when we last checked it.</p>
                  <p>Data comes from city portals and open data sites and is refreshed at most every 15 minutes.</p>
                  <Link href="/sources">See our sources <ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </div>
            </div>

            <div className="cl-footer-bottom">
              <p>Civic Hack 2026 · Future Cities Institute, University of Waterloo</p>
              <p>Open data used under the <a href="https://open.toronto.ca/open-data-licence/" target="_blank" rel="noopener noreferrer">Open Government Licence – Toronto</a> and the <a href="https://www.cityofkingston.ca/documents/10180/144997/CityofKingston_OpenDataLicense.pdf" target="_blank" rel="noopener noreferrer">City of Kingston Open Data Licence</a>.</p>
            </div>
          </div>
        </footer>
        {/* URL-aware guidance may suspend on dynamic item routes; keep the page shell visible. */}
        <Suspense fallback={null}><CiviGuide /></Suspense>
      </body>
    </html>
  );
}
