"use client";

import Link from "next/link";

export default function PageError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16" role="alert">
      <h1 className="text-2xl font-semibold mb-3">We couldn&apos;t load this page</h1>
      <p className="text-base text-gray-700 mb-6">The city data or account service may be temporarily unavailable. Please try again.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="cl-btn">Try again</button>
        <Link href="/feed" className="cl-btn cl-btn-outline">Browse items</Link>
        <Link href="/" className="cl-btn cl-btn-ghost">Home</Link>
      </div>
    </div>
  );
}
