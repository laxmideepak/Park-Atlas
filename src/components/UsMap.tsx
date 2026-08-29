"use client";

import { useRef, useState, memo } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import type { StatePath } from "@/lib/us-map-geo";
import { tierToBucket, type MapBucket, type MapPin } from "@/lib/us-map-pins";
import type { MonthAbbr } from "@/lib/types";
import { MONTHS, monthByAbbr } from "@/lib/months";
import { MapSummaryCard } from "./MapSummaryCard";
import { Reveal } from "./Reveal";

const ZOOM_SCALE = 1.7;

/** How long the west→east recolor sweep takes to cross the country (seconds). */
const SWEEP_SECONDS = 0.4;

/** Bucket-encoded pins (one-accent discipline): brass is the only accent
 * (great), bone is neutral (good = filled, off = outline only). Stroke is
 * always bone at width 1 — buckets just fade it in/out so every property
 * stays animatable during the month-scrubber sweep. */
function pinVisual(bucket: MapBucket): { r: number; fill: string; fillOpacity: number; strokeOpacity: number } {
  switch (bucket) {
    case "great":
      return { r: 4.5, fill: "var(--brass)", fillOpacity: 1, strokeOpacity: 0 };
    case "good":
      return { r: 3.5, fill: "var(--bone)", fillOpacity: 1, strokeOpacity: 0 };
    default: // off
      return { r: 3, fill: "var(--bone)", fillOpacity: 0, strokeOpacity: 0.6 };
  }
}

export function UsMap({
  statePaths,
  width,
  height,
  pins,
  initialMonth,
}: {
  statePaths: StatePath[];
  width: number;
  height: number;
  pins: MapPin[];
  initialMonth: MonthAbbr;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState<MonthAbbr>(initialMonth);
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  const active = pins.find((p) => p.code === hovered);
  const picked = pins.find((p) => p.code === selected);
  const monthName = monthByAbbr(month)?.name ?? "";

  const greatCount = pins.filter((p) => tierToBucket(p.tierByMonth[month]) === "great").length;
  const goodCount = pins.filter((p) => tierToBucket(p.tierByMonth[month]) === "good").length;

  // Zooming around the exact clicked point via transform-origin means that
  // point stays visually fixed on screen — no coordinate math needed for
  // where the summary card goes, it just uses the pin's own (unscaled) %.
  const originX = picked ? (picked.x / width) * 100 : 50;
  const originY = picked ? (picked.y / height) * 100 : 50;

  return (
    <div>
      <Reveal as="h2" className="font-display text-display-lg leading-none mb-8">
        Where it&rsquo;s good in {monthName}.
      </Reveal>

      <div ref={sectionRef} className="relative w-full">
        <motion.div
          animate={{ scale: picked && !reduceMotion ? ZOOM_SCALE : 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          style={{ transformOrigin: `${originX}% ${originY}%` }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" role="img" aria-label="Map of the United States showing all 63 National Parks">
            <StatePaths statePaths={statePaths} />
            <g>
              {pins.map((pin, i) => {
                const tier = pin.tierByMonth[month];
                const v = pinVisual(tierToBucket(tier));
                // Month changes recolor west→east: each pin waits in proportion
                // to how far across the country it sits, so the sweep crosses
                // in ~400ms. Reduced motion: instant, no stagger.
                const sweep = reduceMotion
                  ? { duration: 0 }
                  : { delay: (pin.x / width) * SWEEP_SECONDS, duration: 0.2 };
                return (
                  <motion.g
                    key={pin.code}
                    initial={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
                    animate={inView ? { scale: 1, opacity: 1 } : undefined}
                    transition={reduceMotion ? { duration: 0 } : { delay: i * 0.012, type: "spring", stiffness: 320, damping: 22 }}
                    style={{ transformOrigin: `${pin.x}px ${pin.y}px`, cursor: "pointer" }}
                    whileHover={reduceMotion ? undefined : { scale: 1.7 }}
                    onHoverStart={() => setHovered(pin.code)}
                    onHoverEnd={() => setHovered(null)}
                    onFocus={() => setHovered(pin.code)}
                    onBlur={() => setHovered(null)}
                    onClick={() => setSelected((s) => (s === pin.code ? null : pin.code))}
                    tabIndex={inView || reduceMotion ? 0 : -1}
                    role="button"
                    aria-label={`${pin.name}, ${pin.state} — ${tier} in ${monthName}`}
                  >
                    {/* Soft halo on Exceptional only — keeps that distinction subtle. */}
                    <motion.circle
                      cx={pin.x}
                      cy={pin.y}
                      r={8}
                      fill="var(--brass)"
                      initial={false}
                      animate={{ opacity: tier === "Exceptional" ? 0.35 : 0 }}
                      transition={sweep}
                      style={{ pointerEvents: "none" }}
                    />
                    <motion.circle
                      cx={pin.x}
                      cy={pin.y}
                      stroke="var(--bone)"
                      strokeWidth={1}
                      initial={false}
                      animate={{ r: v.r, fill: v.fill, fillOpacity: v.fillOpacity, strokeOpacity: v.strokeOpacity }}
                      transition={sweep}
                    />
                  </motion.g>
                );
              })}
            </g>
          </svg>
        </motion.div>

        <AnimatePresence>
          {!picked && active && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-bone text-ink text-xs font-medium px-2.5 py-1.5 whitespace-nowrap font-mono"
              style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
            >
              {active.name}, {active.state}
              <span className="block text-mono-sm opacity-60">{active.tierByMonth[month]} in {monthName}{active.live ? " · full guide" : ""}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {picked && (
            <div className="absolute z-20 -translate-x-1/2" style={{ left: `${originX}%`, top: `${originY}%` }}>
              <MapSummaryCard pin={picked} onClose={() => setSelected(null)} />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Month scrubber — same visual language as the discover month-switcher. */}
      <div className="mt-6 border-t border-bone/10 overflow-x-auto">
        <div role="group" aria-label="Show the map for a different month" className="flex gap-1">
          {MONTHS.map((m) => (
            <button
              key={m.abbr}
              type="button"
              onClick={() => setMonth(m.abbr)}
              aria-pressed={m.abbr === month}
              className="relative flex-none px-4 py-4 min-w-[44px] min-h-[44px] font-mono text-mono-sm uppercase tracking-wide text-center cursor-pointer"
              style={{ color: "var(--bone)", opacity: m.abbr === month ? 1 : 0.5 }}
            >
              {m.abbr}
              {m.abbr === month && <span className="absolute left-2 right-2 bottom-2 h-[2px]" style={{ background: "var(--brass)" }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Legend — 3 human buckets, no tier jargon. */}
      <div className="flex items-center gap-4 mt-4 font-mono text-mono-sm text-bone/60 flex-wrap">
        <span><span aria-hidden className="inline-block w-2 h-2 rounded-full bg-brass mr-1.5" />Great in {monthName}</span>
        <span><span aria-hidden className="inline-block w-2 h-2 rounded-full bg-bone mr-1.5" />Decent</span>
        <span><span aria-hidden className="inline-block w-2 h-2 rounded-full border border-bone/60 mr-1.5" />Off-season</span>
      </div>

      <p aria-live="polite" className="sr-only">
        {monthName}: {greatCount} parks great, {goodCount} decent
      </p>
    </div>
  );
}

const StatePaths = memo(function StatePaths({ statePaths }: { statePaths: StatePath[] }) {
  return (
    <g>
      {statePaths.map((sp) => (
        <path key={sp.id} d={sp.d} fill="var(--ink-deep, #1c211a)" stroke="var(--bone)" strokeOpacity={0.08} strokeWidth={1} />
      ))}
    </g>
  );
});
