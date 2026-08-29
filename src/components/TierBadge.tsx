import { Tier } from "@/lib/types";

const TIER_STYLE: Record<Tier, string> = {
  Exceptional: "bg-accent text-basalt-deep border-accent",
  Excellent: "bg-accent-soft text-paper border-accent/70",
  Good: "bg-white/10 text-paper border-white/30",
  Specialized: "bg-white/5 text-paper-dim border-white/20",
  Limited: "bg-transparent text-paper-dim border-white/15",
};

export function TierBadge({ tier, onLight = false }: { tier: Tier; onLight?: boolean }) {
  const style = onLight
    ? tier === "Exceptional" || tier === "Excellent"
      ? "bg-accent-soft text-basalt-deep border-accent"
      : "bg-black/5 text-basalt-deep/70 border-black/15"
    : TIER_STYLE[tier];
  return (
    <span className={`inline-block text-[0.68rem] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full border ${style}`}>
      {tier}
    </span>
  );
}
