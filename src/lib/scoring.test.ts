import { describe, it, expect } from "vitest";
import {
  overallMonthFit,
  scoreToTier,
  crowdRelativeToPeak,
  crowdRelief,
  bestBalanceScore,
  crowdBand,
  CLIMATE_WEIGHT,
  ACCESSIBILITY_WEIGHT,
  BEST_BALANCE_CLIMATE_WEIGHT,
  BEST_BALANCE_CROWD_RELIEF_WEIGHT,
} from "./scoring";

describe("overallMonthFit", () => {
  it("weights climate 60% and accessibility 40%", () => {
    expect(CLIMATE_WEIGHT + ACCESSIBILITY_WEIGHT).toBe(1);
    expect(overallMonthFit({ climateScore: 100, accessibilityScore: 0 })).toBe(60);
    expect(overallMonthFit({ climateScore: 0, accessibilityScore: 100 })).toBe(40);
    expect(overallMonthFit({ climateScore: 80, accessibilityScore: 60 })).toBe(72); // .6*80+.4*60=72
  });

  it("rounds to the nearest integer", () => {
    expect(overallMonthFit({ climateScore: 85, accessibilityScore: 85 })).toBe(85);
    expect(overallMonthFit({ climateScore: 83, accessibilityScore: 84 })).toBe(Math.round(83 * 0.6 + 84 * 0.4));
  });
});

describe("scoreToTier boundaries", () => {
  it.each([
    [100, "Exceptional"],
    [93, "Exceptional"],
    [92, "Excellent"],
    [85, "Excellent"],
    [84, "Good"],
    [75, "Good"],
    [74, "Specialized"],
    [60, "Specialized"],
    [59, "Limited"],
    [0, "Limited"],
  ] as const)("%i -> %s", (score, tier) => {
    expect(scoreToTier(score)).toBe(tier);
  });
});

describe("crowd relief / relative-to-peak", () => {
  it("relative-to-peak is 1 at the peak month itself", () => {
    expect(crowdRelativeToPeak(20, 20)).toBe(1);
  });

  it("relief is the complement of relative-to-peak", () => {
    expect(crowdRelief(5, 20)).toBeCloseTo(0.75);
    expect(crowdRelief(20, 20)).toBe(0);
  });
});

describe("bestBalanceScore", () => {
  it("matches the documented 0.65 climate / 0.35 crowd-relief split", () => {
    expect(BEST_BALANCE_CLIMATE_WEIGHT + BEST_BALANCE_CROWD_RELIEF_WEIGHT).toBe(1);
    // climate=80, this month is half of peak visitation -> relief=0.5
    const score = bestBalanceScore(80, 10, 20);
    expect(score).toBeCloseTo(0.65 * 80 + 0.35 * 0.5 * 100);
  });

  it("rewards low crowds even at slightly lower climate score", () => {
    const quietButCooler = bestBalanceScore(70, 5, 20); // relief 0.75
    const peakButPerfect = bestBalanceScore(75, 20, 20); // relief 0
    expect(quietButCooler).toBeGreaterThan(peakButPerfect);
  });
});

describe("crowdBand", () => {
  it.each([
    [1, "Low"],
    [25, "Low"],
    [26, "Moderate"],
    [50, "Moderate"],
    [51, "High"],
    [75, "High"],
    [76, "Very High"],
    [100, "Very High"],
  ] as const)("percentile %i -> %s", (pct, band) => {
    expect(crowdBand(pct)).toBe(band);
  });
});
