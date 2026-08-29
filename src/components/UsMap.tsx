"use client";

import { useRef, useState, memo } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import type { StatePath } from "@/lib/us-map-geo";
import type { MapPin } from "@/lib/us-map-pins";
import type { Tier } from "@/lib/types";
import { MapSummaryCard } from "./MapSummaryCard";

const ZOOM_SCALE = 1.7;

/** §6.1.4 — pins encode this month's tier, not per-park identity or "live" status. */
function pinVisual(tier: Tier): { r: number; fill: string; stroke: string; strokeWidth: number; glow: boolean } {
  switch (tier) {
    case "Exceptional":
      return { r: 4, fill: "var(--brass)", stroke: "var(--brass)", strokeWidth: 0, glow: true };
    case "Excellent":
      return { r: 4, fill: "var(--brass)", stroke: "none", strokeWidth: 0, glow: false };
    case "Good":
      return { r: 3.5, fill: "var(--bone)", stroke: "none", strokeWidth: 0, glow: false };
    default:
      return { r: 3, fill: "none", stroke: "var(--bone)", strokeWidth: 1, glow: false };
  }
}
const TIER_OPACITY: Record<Tier, number> = {
  Exceptional: 1,
  Excellent: 0.65,
  Good: 0.4,
  Specialized: 0.9,
  Limited: 0.6,
};

export function UsMap({
  statePaths,
  width,
  height,
  pins,
}: {
  statePaths: StatePath[];
  width: number;
  height: number;
  pins: MapPin[];
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
  const active = pins.find((p) => p.code === hovered);
  const picked = pins.find((p) => p.code === selected);

  // Zooming around the exact clicked point via transform-origin means that
  // point stays visually fixed on screen — no coordinate math needed for
  // where the summary card goes, it just uses the pin's own (unscaled) %.
  const originX = picked ? (picked.x / width) * 100 : 50;
  const originY = picked ? (picked.y / height) * 100 : 50;

  return (
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
              const v = pinVisual(pin.tier);
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
                  tabIndex={0}
                  role="button"
                  aria-label={`${pin.name}, ${pin.state} — ${pin.tier} this month`}
                >
                  {v.glow && <circle cx={pin.x} cy={pin.y} r={8} fill={v.fill} opacity={0.35} />}
                  <circle cx={pin.x} cy={pin.y} r={v.r} fill={v.fill} stroke={v.stroke} strokeWidth={v.strokeWidth} opacity={TIER_OPACITY[pin.tier]} />
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
            <span className="block text-mono-sm opacity-60">{active.tier} this month{active.live ? " · full guide" : ""}</span>
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
