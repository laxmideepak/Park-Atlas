"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-bone text-ink min-h-[70vh] flex items-center">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-24">
        <p className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft mb-2">Error</p>
        <h1 className="font-display italic text-display-xl leading-[0.95] mb-4">Lost signal.</h1>
        <p className="text-ink-soft max-w-[55ch] mb-8">
          Something broke loading this page &mdash; likely a live NPS/NWS data fetch. Try again, or come back later.
        </p>
        <button
          onClick={reset}
          className="font-mono text-mono-sm underline underline-offset-2 hover:text-brass transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
