"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 py-24 text-center">
      <title>Page Not Found — CSE Fest 2026</title>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="description" content="The page you are looking for does not exist." />
      {/* Status code display */}
      <div className="relative mb-8 select-none">
        <span className="text-[clamp(6rem,20vw,12rem)] font-heading font-black text-neutral-900 leading-none tabular-nums">
          404
        </span>
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[clamp(6rem,20vw,12rem)] font-heading font-black leading-none tabular-nums text-stroke-primary"
        >
          404
        </span>
      </div>

      {/* Message */}
      <div className="max-w-sm space-y-3 mb-10">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-neutral-50">
          Page not found
        </h1>
        <p className="text-sm text-neutral-400 font-sans leading-relaxed">
          The page you are looking for may have been moved, renamed, or does not
          exist. Check the URL or navigate back.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-primary text-neutral-50 text-sm font-semibold font-sans hover:bg-primary/90 transition-colors"
        >
          <Home className="h-4 w-4" />
          Return Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm font-semibold font-sans hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    </div>
  );
}
