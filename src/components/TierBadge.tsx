import type { CSSProperties } from "react";
import { Tier } from "@/lib/types";

/** §7.2 — reads as a map-legend key, not a web chip: a leading swatch + mono uppercase text. */
const TIER_SWATCH: Record<Tier, CSSProperties> = {
  Exceptional: { background: "var(--brass)" },
  Excellent: { background: "var(--brass)", opacity: 0.65 },
  Good: { background: "var(--ink)", opacity: 0.3 },
  Specialized: { border: "1px solid currentColor", background: "transparent" },
  Limited: { border: "1px dashed currentColor", background: "transparent" },
};

export function TierBadge({ tier, onLight = false }: { tier: Tier; onLight?: boolean }) {
  const textColor = onLight ? "text-ink-soft" : "text-bone/80";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-mono-sm uppercase tracking-wide ${textColor}`}>
      <span className="w-1.5 h-1.5 flex-none" style={TIER_SWATCH[tier]} />
      {tier}
    </span>
  );
}
