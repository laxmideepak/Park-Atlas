"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { TierBadge } from "./TierBadge";
import type { Tier } from "@/lib/types";
import type { Region } from "@/lib/park-theme";
import type { ParkImage } from "@/lib/nps";

export interface IndexRow {
  code: string;
  name: string;
  state: string;
  region: Region;
  tier: Tier;
  hasFullGuide: boolean;
  image: ParkImage | null;
}

const REGIONS: Region[] = ["West", "Rockies", "Southwest", "East", "AK + Islands"];
const TIERS: Tier[] = ["Exceptional", "Excellent", "Good", "Specialized", "Limited"];

/** §6.5 — text-only index list; a single cursor-tracked photo preview does
 * the visual work instead of a per-row thumbnail. Pointer devices only. */
export function ParksIndexList({ rows }: { rows: IndexRow[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [regionFilter, setRegionFilter] = useState<Region | null>(null);
  const [tierFilter, setTierFilter] = useState<Tier | null>(null);
  const [guideOnly, setGuideOnly] = useState(false);
  const reduceMotion = useReducedMotion();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!regionFilter || r.region === regionFilter) &&
          (!tierFilter || r.tier === tierFilter) &&
          (!guideOnly || r.hasFullGuide)
      ),
    [rows, regionFilter, tierFilter, guideOnly]
  );

  const active = rows.find((r) => r.code === hovered);

  return (
    <div
      className="relative"
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      {/* filters */}
      <div className="flex flex-wrap gap-2 mb-8 font-mono text-mono-sm">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter((cur) => (cur === r ? null : r))}
            className="px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: regionFilter === r ? "var(--brass)" : "var(--ink-soft)", color: regionFilter === r ? "var(--ink)" : "var(--ink-soft)" }}
          >
            {r}
          </button>
        ))}
        <span className="px-1 text-ink-soft">&middot;</span>
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter((cur) => (cur === t ? null : t))}
            className="px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: tierFilter === t ? "var(--brass)" : "var(--ink-soft)", color: tierFilter === t ? "var(--ink)" : "var(--ink-soft)" }}
          >
            {t}
          </button>
        ))}
        <span className="px-1 text-ink-soft">&middot;</span>
        <button
          onClick={() => setGuideOnly((v) => !v)}
          className="px-3 py-1.5 rounded-full border transition-colors"
          style={{ borderColor: guideOnly ? "var(--brass)" : "var(--ink-soft)", color: guideOnly ? "var(--ink)" : "var(--ink-soft)" }}
        >
          Has full guide
        </button>
      </div>

      <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
        {filtered.map((r) => (
          <Link
            key={r.code}
            href={`/parks/${r.code}`}
            className="flex items-center justify-between gap-4 py-4"
            onMouseEnter={() => setHovered(r.code)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="font-display text-display-md leading-tight">{r.name}</span>
            <span className="flex items-center gap-4 font-mono text-mono-sm text-ink-soft flex-none">
              {r.state}
              <TierBadge tier={r.tier} onLight />
            </span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="py-8 text-ink-soft font-mono text-sm">No parks match these filters.</p>}
      </div>

      {/* cursor-tracked photo preview, pointer devices only */}
      <AnimatePresence>
        {active && !reduceMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hidden md:block fixed z-30 pointer-events-none w-[320px] h-[400px] rounded-sm overflow-hidden"
            style={{ left: pos.x + 24, top: pos.y - 200 }}
          >
            {active.image ? (
              <Image src={active.image.url} alt="" fill sizes="320px" className="object-cover img-grade" style={{ viewTransitionName: `park-hero-${active.code}` }} />
            ) : (
              <div className="absolute inset-0 bg-ink flex items-center justify-center">
                <span className="font-display text-display-md text-bone px-4 text-center">{active.name}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
