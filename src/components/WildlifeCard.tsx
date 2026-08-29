"use client";

import { motion, useReducedMotion } from "motion/react";
import { WildlifeIcon } from "./WildlifeIcon";
import type { Wildlife } from "@/lib/data/park-wildlife";

export function WildlifeCard({
  wildlife,
  accent,
  parkName,
  href,
  onClose,
}: {
  wildlife: Wildlife;
  accent: string;
  parkName?: string;
  href?: string;
  onClose?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { scale: 0.4, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.4, opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}
      className="rounded-sm bg-paper text-basalt-deep p-4 w-[240px] shadow-lg flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-full p-1.5" style={{ background: `${accent}33` }}>
          <WildlifeIcon wildlife={wildlife} color={accent} />
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close" className="text-basalt-deep/50 hover:text-basalt-deep text-sm leading-none">
            &times;
          </button>
        )}
      </div>
      <div>
        <span className="text-[0.65rem] uppercase tracking-wide opacity-60">{wildlife.category}</span>
        <div className="font-bold leading-tight">{wildlife.name}</div>
      </div>
      <p className="text-sm text-basalt-deep/80">{wildlife.fact}</p>
      {href && parkName && (
        <a href={href} className="text-xs font-semibold underline underline-offset-2 mt-1">
          Visit {parkName} &rarr;
        </a>
      )}
    </motion.div>
  );
}
