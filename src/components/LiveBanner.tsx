import { LiveClock } from "./LiveClock";
import type { LiveContext } from "@/lib/live-context";

/** Top-of-page live strip: this park's own local time, date, weather, location — not the site's. */
export function LiveBanner({ context, state }: { context: LiveContext | null; state: string }) {
  if (!context) {
    return <p className="text-xs font-mono text-paper-dim">Live conditions unavailable right now.</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-mono text-paper/90">
      <LiveClock timezone={context.timezone} />
      <span>{context.nearestCity ?? state}</span>
      {context.tempF !== null && (
        <span>
          {context.tempF}&deg;F{context.shortForecast ? ` · ${context.shortForecast}` : ""}
        </span>
      )}
      <span className="opacity-60">Live &middot; National Weather Service</span>
    </div>
  );
}
