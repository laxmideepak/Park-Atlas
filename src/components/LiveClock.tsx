"use client";

import { useEffect, useState } from "react";

/** Ticks the viewer's own clock, formatted in the park's own timezone — always correct, no API needed. */
export function LiveClock({ timezone }: { timezone: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  return (
    <span className="font-mono text-sm" suppressHydrationWarning>
      {formatted} local
    </span>
  );
}
