"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { StatePath } from "@/lib/us-map-geo";
import type { MapPin } from "@/lib/us-map-pins";
import { MapSummaryCard } from "./MapSummaryCard";

const ZOOM_SCALE = 1.7;

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
  const active = pins.find((p) => p.code === hovered);
  const picked = pins.find((p) => p.code === selected);

  // Zooming around the exact clicked point via transform-origin means that
  // point stays visually fixed on screen — no coordinate math needed for
  // where the summary card goes, it just uses the pin's own (unscaled) %.
  const originX = picked ? (picked.x / width) * 100 : 50;
  const originY = picked ? (picked.y / height) * 100 : 50;

  return (
    <div className="relative w-full">
      <motion.div
        animate={{ scale: picked && !reduceMotion ? ZOOM_SCALE : 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        style={{ transformOrigin: `${originX}% ${originY}%` }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" role="img" aria-label="Map of the United States showing all 63 National Parks">
          <g>
            {statePaths.map((sp) => (
              <path key={sp.id} d={sp.d} fill="#1b2027" stroke="#ffffff22" strokeWidth={1} />
            ))}
          </g>
          <g>
            {pins.map((pin, i) => (
              <motion.g
                key={pin.code}
                initial={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
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
                aria-label={`${pin.name}, ${pin.state}${pin.live ? " — full guide" : " — scored, profile only"}`}
              >
                <circle cx={pin.x} cy={pin.y} r={pin.live ? 5.5 : 3.4} fill={pin.accent} stroke="#171b1f" strokeWidth={pin.live ? 1.5 : 1} />
              </motion.g>
            ))}
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
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-sm bg-paper text-basalt-deep text-xs font-medium px-2.5 py-1.5 whitespace-nowrap"
            style={{ left: `${(active.x / width) * 100}%`, top: `${(active.y / height) * 100}%` }}
          >
            {active.name}, {active.state}
            <span className="block text-[0.65rem] opacity-60">{active.live ? "Full guide (hikes, water, dining)" : "Scored + live profile"}</span>
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
