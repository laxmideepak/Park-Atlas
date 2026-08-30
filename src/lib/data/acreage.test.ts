import { describe, it, expect } from "vitest";
import acreage from "./acreage.json";
import { ALL_PARKS_MINI } from "./all-parks-mini";
import { PARKS } from "./parks";

type AcreageEntry = {
  grossAcres: number;
  areaName: string;
  components?: { name: string; grossAcres: number }[];
};
const parks = acreage.parks as Record<string, AcreageEntry>;
const entries = Object.entries(parks);

/** The seven park+preserve splits per the summing policy in etl-acreage.mjs. */
const SUMMED_PARKS = ["dena", "glba", "katm", "lacl", "wrst", "grsa", "gaar"];

/** Gross acres of the separate VIRGIN ISLANDS CORAL REEF unit (06-30-2026). */
const CORAL_REEF_GROSS = 12708.07;

describe("acreage snapshot _meta (data-audit spec §5 provenance)", () => {
  it("carries the full provenance header", () => {
    expect(acreage._meta.sourceUrl).toMatch(/^https:\/\/www\.nps\.gov\/.+\.xlsx$/);
    expect(acreage._meta.datasetVersion).toMatch(/^NPS Acreage \d{2}-\d{2}-\d{4}$/);
    expect(Number.isNaN(Date.parse(acreage._meta.fetchedAt))).toBe(false);
    expect(acreage._meta.script).toBe("scripts/etl-acreage.mjs");
    expect(acreage._meta.recordCount).toBe(63);
  });
});

describe("acreage coverage (spec §3.1: all 63 after name normalization)", () => {
  it("has exactly the 63 park codes, no extras", () => {
    const expected = new Set(ALL_PARKS_MINI.map((p) => p.code));
    expect(entries.length).toBe(63);
    for (const [code] of entries) {
      expect(expected.has(code), `${code}: not a known park code`).toBe(true);
    }
  });

  it("every park has a positive gross acreage and an area name", () => {
    for (const [code, e] of entries) {
      expect(e.grossAcres, `${code}: grossAcres`).toBeGreaterThan(0);
      expect(e.areaName.length, `${code}: areaName`).toBeGreaterThan(0);
    }
  });
});

describe("tricky-park regression suite (spec §5)", () => {
  it("gaar sums exactly 2 components, incl. the preserve row that drops 'THE'", () => {
    const gaar = parks.gaar;
    expect(gaar.components).toHaveLength(2);
    const names = gaar.components!.map((c) => c.name);
    expect(names).toContain("GATES OF THE ARCTIC NP");
    expect(names).toContain("GATES OF ARCTIC N PRES"); // no "THE" in the preserve row
    const sum = gaar.components!.reduce((s, c) => s + c.grossAcres, 0);
    expect(Math.abs(gaar.grossAcres - sum)).toBeLessThan(0.011);
    expect(gaar.grossAcres).toBeGreaterThan(7_500_000);
  });

  it("all 7 park+preserve splits carry 2 components that sum to the total", () => {
    for (const code of SUMMED_PARKS) {
      const e = parks[code];
      expect(e.components, `${code}: components`).toHaveLength(2);
      const sum = e.components!.reduce((s, c) => s + c.grossAcres, 0);
      expect(Math.abs(e.grossAcres - sum), `${code}: sum mismatch`).toBeLessThan(0.011);
    }
  });

  it("viis is the national park, not the separate coral-reef unit", () => {
    const viis = parks.viis;
    expect(viis.areaName).toBe("VIRGIN ISLANDS NP");
    expect(viis.areaName).not.toContain("CORAL");
    expect(Math.abs(viis.grossAcres - CORAL_REEF_GROSS)).toBeGreaterThan(1);
    // Verified 06-30-2026 figure 15,041.03; quarterly drift stays well under 2%.
    expect(Math.abs(viis.grossAcres - 15041.03) / 15041.03).toBeLessThan(0.02);
  });

  it("neri is one combined NP & PRES row — single component, no summing", () => {
    const neri = parks.neri;
    expect(neri.components).toHaveLength(1);
    expect(neri.components![0].name).toBe("NEW RIVER GORGE NP & PRES");
    expect(neri.grossAcres).toBe(neri.components![0].grossAcres);
  });
});

describe("cohort cross-check against parks.ts", () => {
  it("all 4 cohort figures are within 2% of the official gross acreage", () => {
    const lines: string[] = [];
    for (const park of PARKS) {
      const official = parks[park.code];
      expect(official, `${park.code}: missing from acreage.json`).toBeDefined();
      const delta = Math.abs(park.acreage - official.grossAcres) / official.grossAcres;
      lines.push(
        `${park.code}: parks.ts ${park.acreage.toLocaleString("en-US")} vs official ${official.grossAcres.toLocaleString("en-US")} (${(delta * 100).toFixed(2)}% off)`,
      );
      expect(delta, `${park.code}: parks.ts acreage drifts > 2% from official`).toBeLessThan(0.02);
    }
    console.log(`cohort acreage comparison (${acreage._meta.datasetVersion}):\n  ${lines.join("\n  ")}`);
  });
});
