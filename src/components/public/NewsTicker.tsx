"use client";

import * as React from "react";
import { Megaphone } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DEFAULT_TICKER = [
  "Registration is now OPEN for Software, IoT, and Idea Showcases!",
  "Attention SMUCT students: Internal Programming, Datathon, and CTF registration is active.",
  "Phase 2 Proposal Submissions close on June 30, 2026. Submit early!",
  "Manual verification process takes up to 24-48 hours after document upload.",
];

interface TickerData {
  message: string;
}

export function NewsTicker() {
  const { data } = useSWR("/api/public/cms/ticker", fetcher);

  const tickerItems = React.useMemo(() => {
    if (data && data.success && data.data && data.data.length > 0) {
      return data.data.map((t: TickerData) => t.message);
    }
    return DEFAULT_TICKER;
  }, [data]);

  return (
    <div className="relative w-full overflow-hidden bg-neutral-900/40 border-b border-neutral-800/60 h-10 flex items-center select-none backdrop-blur-md">
      {/* Label Badge */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 bg-neutral-950 px-4 border-r border-neutral-800 text-xs font-semibold text-accent font-sans">
        <Megaphone className="h-3.5 w-3.5 animate-pulse text-accent" />
        <span>UPDATES</span>
      </div>

      {/* Scrolling Text Container */}
      <div className="flex w-full overflow-hidden items-center pl-32">
        <div className="animate-marquee whitespace-nowrap flex gap-12 text-xs font-medium font-sans text-neutral-400 hover:[animation-play-state:paused] cursor-pointer">
          {/* Repeat items twice to guarantee infinite looping transitions */}
          {tickerItems.map((item: string, idx: number) => (
            <span key={`ticker-1-${idx}`} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-accent" />
              {item}
            </span>
          ))}
          {tickerItems.map((item: string, idx: number) => (
            <span key={`ticker-2-${idx}`} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-accent" />
              {item}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
