"use client";

import { useEffect, useState } from "react";
import type { LiveContext } from "@/lib/live-context";

/** Top-of-page live strip: AP wire-service dateline format (CITY, STATE — conditions. time local.) */
export function LiveBanner({ context, state }: { context: LiveContext | null; state: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!context) {
    return <p className="text-xs font-mono text-paper-dim">Live conditions unavailable right now.</p>;
  }

  // Format time only: "3:41 PM"
  const timeFormatted = new Intl.DateTimeFormat("en-US", {
    timeZone: context.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(now);

  // Extract city and state from nearestCity (format: "City, STATE")
  const locationParts = context.nearestCity?.split(", ") || [state];
  const city = locationParts[0] || "";
  const stateAbbr = locationParts[1] || state;

  // Build the conditions sentence: "temp, conditions." or just "temp." or empty
  let conditionsSentence = "";
  if (context.tempF !== null) {
    conditionsSentence = `${context.tempF}°F${context.shortForecast ? `, ${context.shortForecast}` : ""}. `;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-paper/90" suppressHydrationWarning>
      <span className="uppercase tracking-wide text-paper">
        {city}, {stateAbbr}
      </span>
      <span>—</span>
      <span>
        {conditionsSentence}
        {timeFormatted} local.
      </span>
      <span className="opacity-60">Live · National Weather Service</span>
    </div>
  );
}
