import { describe, it, expect } from "vitest";
import { bestByMonth, hiddenGemsForMonth, crowdBandsForMonth, scoresForPark, bestBySeason } from "./repo";
import { ALL_PARKS_MINI } from "./data/all-parks-mini";

describe("bestByMonth", () => {
  it("covers every one of the 63 parks, not just the editorial cohort", () => {
    const rows = bestByMonth("jul");
    expect(rows).toHaveLength(ALL_PARKS_MINI.length);
  });

  it("sorts descending by Month Fit", () => {
    const rows = bestByMonth("jul");
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].overallMonthFit).toBeGreaterThanOrEqual(rows[i].overallMonthFit);
    }
  });
});

describe("hiddenGemsForMonth", () => {
  it("only returns parks meeting both the Fit >= 85 and crowd percentile <= 40 bars", () => {
    const gems = hiddenGemsForMonth("oct");
    for (const g of gems) {
      expect(g.overallMonthFit).toBeGreaterThanOrEqual(85);
      expect(g.crowdPercentile).toBeLessThanOrEqual(40);
    }
  });

  it("crowd percentile agrees with crowdBandsForMonth (single source of truth)", () => {
    const gems = hiddenGemsForMonth("jun");
    const bands = crowdBandsForMonth("jun");
    for (const g of gems) {
      const band = bands.find((b) => b.park === g.park);
      expect(band?.crowdPercentile).toBe(g.crowdPercentile);
    }
  });
});

describe("crowdBandsForMonth", () => {
  it("assigns a percentile between 1 and 100 to every park, sorted ascending (least crowded first)", () => {
    const rows = crowdBandsForMonth("jan");
    expect(rows).toHaveLength(ALL_PARKS_MINI.length);
    for (const r of rows) {
      expect(r.crowdPercentile).toBeGreaterThan(0);
      expect(r.crowdPercentile).toBeLessThanOrEqual(100);
    }
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].crowdPercentile).toBeLessThanOrEqual(rows[i].crowdPercentile);
    }
  });
});

describe("scoresForPark", () => {
  it("returns exactly 12 months for both cohort and non-cohort parks", () => {
    expect(scoresForPark("yell")).toHaveLength(12); // hand-authored cohort
    expect(scoresForPark("zion")).toHaveLength(12); // estimated, non-cohort
  });

  it("never lets visitation influence the Month Fit score (PRD: popularity is never a quality signal)", () => {
    const rows = scoresForPark("acad");
    for (const r of rows) {
      // overallMonthFit must be derivable purely from climate/accessibility
      const expected = Math.round(r.climateScore * 0.6 + r.accessibilityScore * 0.4);
      expect(r.overallMonthFit).toBe(expected);
    }
  });
});

describe("bestBySeason", () => {
  it("covers all 63 parks", () => {
    expect(bestBySeason("summer")).toHaveLength(ALL_PARKS_MINI.length);
  });
});
