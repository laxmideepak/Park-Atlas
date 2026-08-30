import { describe, it, expect } from "vitest";
import visitation from "./visitation.json";
import { ALL_PARKS_MINI } from "./all-parks-mini";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const PARK_CODES = new Set<string>(ALL_PARKS_MINI.map((p) => p.code));
const entries = Object.entries(visitation.parks) as [
  string,
  { medianAnnualVisits: number; monthlyShares: Record<string, number>; years: number[] },
][];

describe("visitation snapshot (data-audit spec §3.1 IRMA Stats v1, §4 P1.1, §5)", () => {
  it("_meta header is complete (§5 versioning and provenance)", () => {
    const m = visitation._meta;
    expect(m.sourceUrl).toMatch(/^https:\/\/irmaservices\.nps\.gov\/Stats\/v1\/visitation\?unitCodes=/);
    expect(m.sourceUrl).toContain("startYear=2021");
    expect(m.sourceUrl).toContain("endYear=2025");
    expect(m.datasetVersion).toBe("IRMA Stats v1, CY2021-2025");
    expect(Number.isNaN(Date.parse(m.fetchedAt)), "_meta.fetchedAt must be a parseable date").toBe(false);
    expect(m.script).toBe("scripts/etl-visitation.mjs");
    expect(m.recordCount).toBe(63);
  });

  it("covers exactly the 63 parks, every code a real ALL_PARKS_MINI park", () => {
    expect(entries.length).toBe(63);
    for (const [code] of entries) {
      expect(PARK_CODES.has(code), `${code}: not in all-parks-mini`).toBe(true);
    }
    for (const p of ALL_PARKS_MINI) {
      expect(p.code in visitation.parks, `${p.code}: missing from visitation.json`).toBe(true);
    }
  });

  it("every park: 12 one-decimal shares summing to exactly 100, 5 positive annual totals, true median", () => {
    for (const [code, park] of entries) {
      expect(Object.keys(park.monthlyShares).sort(), `${code}: month keys`).toEqual([...MONTH_KEYS].sort());
      let sum = 0;
      for (const m of MONTH_KEYS) {
        const v = park.monthlyShares[m];
        expect(Number.isFinite(v) && v >= 0, `${code}.${m}: bad share ${v}`).toBe(true);
        expect(Math.abs(v * 10 - Math.round(v * 10)), `${code}.${m}: more than 1 decimal`).toBeLessThan(1e-9);
        sum += v;
      }
      expect(sum, `${code}: shares must sum to 100`).toBeCloseTo(100, 6);

      expect(park.years, `${code}: years`).toHaveLength(5);
      for (const y of park.years) {
        expect(Number.isInteger(y) && y > 0, `${code}: annual total ${y}`).toBe(true);
      }
      const median = [...park.years].sort((a, b) => a - b)[2];
      expect(park.medianAnnualVisits, `${code}: median mismatch`).toBe(median);
    }
  });

  it("gaar: true winter zeros (Oct–Apr) are data, not gaps; summer is real", () => {
    const shares = visitation.parks.gaar.monthlyShares;
    for (const m of ["oct", "nov", "dec", "jan", "feb", "mar", "apr"] as const) {
      expect(shares[m], `gaar.${m}: winter zero must flow through as 0.0`).toBe(0);
    }
    for (const m of ["jun", "jul", "aug"] as const) {
      expect(shares[m], `gaar.${m}: summer share must be nonzero`).toBeGreaterThan(0);
    }
  });

  it("tricky parks npsa / viis / jeff are present with full 12-month shares", () => {
    for (const code of ["npsa", "viis", "jeff"] as const) {
      const park = visitation.parks[code];
      expect(park, `${code}: missing`).toBeDefined();
      expect(Object.keys(park.monthlyShares)).toHaveLength(12);
      expect(park.medianAnnualVisits).toBeGreaterThan(0);
    }
  });

  it("seki (SEQU stats) and kica (KICA stats) both present, with different data", () => {
    const { seki, kica } = visitation.parks;
    expect(seki).toBeDefined();
    expect(kica).toBeDefined();
    expect(seki.years).not.toEqual(kica.years);
    expect(seki.medianAnnualVisits).not.toBe(kica.medianAnnualVisits);
  });

  it("deva: exact 2025 figure and 5-yr median from IRMA (audit item #2 acceptance)", () => {
    const deva = visitation.parks.deva;
    expect(deva.years[4], "DEVA CY2025 recreation visitors").toBe(1_320_134);
    expect(deva.medianAnnualVisits, "DEVA CY2021–2025 median").toBe(1_146_551);
  });
});
