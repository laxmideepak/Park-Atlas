"use client";

import { motion, useReducedMotion } from "motion/react";
import { LiveClock } from "./LiveClock";
import { WildlifeIcon } from "./WildlifeIcon";
import type { MapPin } from "@/lib/us-map-pins";

/** Quick glimpse shown when a map pin is tapped — local time, status, signature wildlife, then a way in. */
export function MapSummaryCard({ pin, onClose }: { pin: MapPin; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { scale: 0.5, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 20 }}
      className="rounded-sm bg-paper text-basalt-deep p-4 w-[260px] shadow-lg flex flex-col gap-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-bold leading-tight">{pin.name}</div>
          <div className="text-xs text-basalt-deep/60">{pin.state}</div>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-basalt-deep/50 hover:text-basalt-deep text-sm leading-none">
          &times;
        </button>
      </div>

      <div className="text-xs font-mono text-basalt-deep/70">
        {pin.timezone ? <LiveClockDark timezone={pin.timezone} /> : "Local time unavailable"}
      </div>

      <span
        className="self-start text-[0.65rem] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${pin.accent}33` }}
      >
        {pin.live ? "Full Month Fit scoring" : "Profile & live conditions"}
      </span>

      {pin.wildlife && (
        <div className="flex items-center gap-2 border-t border-dashed border-black/15 pt-2">
          <span className="rounded-full p-1 flex-none" style={{ background: `${pin.accent}33` }}>
            <WildlifeIcon wildlife={pin.wildlife} color={pin.accent} size={24} />
          </span>
          <div className="text-xs">
            <div className="font-semibold">{pin.wildlife.name}</div>
            <div className="text-basalt-deep/70">{pin.wildlife.fact}</div>
          </div>
        </div>
      )}

      <a href={pin.href} className="text-xs font-semibold underline underline-offset-2 mt-1">
        Visit {pin.name} &rarr;
      </a>
    </motion.div>
  );
}

/** LiveClock renders paper-on-dark styling by default; this local variant just reuses the same ticking logic. */
function LiveClockDark({ timezone }: { timezone: string }) {
  return (
    <span className="text-basalt-deep/80">
      <LiveClock timezone={timezone} />
    </span>
  );
}
