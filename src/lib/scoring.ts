import { Tier, ParkMonthScore } from "./types";

/** ParkAtlas Month Fit v1.0 — Climate 60% + Seasonal accessibility 40%. No visitation. */
export const METHODOLOGY_VERSION = "month-fit-1.0";
export const METHODOLOGY_CALCULATED_AT = "2026-08-28";

export const CLIMATE_WEIGHT = 0.6;
export const ACCESSIBILITY_WEIGHT = 0.4;

export const BEST_BALANCE_CLIMATE_WEIGHT = 0.65;
export const BEST_BALANCE_CROWD_RELIEF_WEIGHT = 0.35;

export function overallMonthFit(row: Pick<ParkMonthScore, "climateScore" | "accessibilityScore">): number {
  return Math.round(
    row.climateScore * CLIMATE_WEIGHT + row.accessibilityScore * ACCESSIBILITY_WEIGHT
  );
}

export function scoreToTier(score: number): Tier {
  if (score >= 93) return "Exceptional";
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Specialized";
  return "Limited";
}

export const TIER_ORDER: Tier[] = ["Exceptional", "Excellent", "Good", "Specialized", "Limited"];

export const TIER_COLOR: Record<Tier, string> = {
  Exceptional: "#D6A63B",
  Excellent: "#D6A63B99",
  Good: "#ffffff33",
  Specialized: "#ffffff1a",
  Limited: "#ffffff0d",
};

/** % of peak-month visitation this month sees. Informational — never a scoring input. */
export function crowdRelativeToPeak(percentOfAnnualVisits: number, peakPercentOfAnnual: number): number {
  return percentOfAnnualVisits / peakPercentOfAnnual;
}

export function crowdRelief(percentOfAnnualVisits: number, peakPercentOfAnnual: number): number {
  return 1 - crowdRelativeToPeak(percentOfAnnualVisits, peakPercentOfAnnual);
}

export function bestBalanceScore(
  climateScore: number,
  percentOfAnnualVisits: number,
  peakPercentOfAnnual: number
): number {
  return (
    BEST_BALANCE_CLIMATE_WEIGHT * climateScore +
    BEST_BALANCE_CROWD_RELIEF_WEIGHT * crowdRelief(percentOfAnnualVisits, peakPercentOfAnnual) * 100
  );
}
