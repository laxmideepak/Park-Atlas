import { describe, it, expect } from "vitest";
import { metersToFeet } from "../../../scripts/build-park-stations.mjs";
import climateNormals from "./climate-normals.json";
import parkStations from "./park-stations.json";
import { ALL_PARKS_MINI } from "./all-parks-mini";

/**
 * Regression suite for the NCEI 1991-2020 normals pipeline
 * (data-audit spec §4 P1.2, §5 tricky-park practices).
 * This is the pipeline where the 144-ft meters-vs-feet bug class lives:
 * every station's elevation must round-trip through the ONE exported
 * conversion function, and the tricky parks (gaar, viis, npsa) must carry
 * their honest flags instead of silently confident data.
 */

interface MonthNormals {
  tmaxF: number | null;
  tminF: number | null;
  tavgF: number | null;
  prcpIn: number | null;
  snowIn: number | null;
  snowImputed?: boolean;
}
interface ParkNormals {
  stationId: string;
  months: Record<string, MonthNormals>;
}
interface StationRow {
  parkCode: string;
  stationId: string;
  stationName: string;
  distanceKm: number;
  elevationM: number;
  elevationFt: number;
  hasTemp: boolean;
  lowConfidence?: boolean;
  caveat?: string;
}

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const parks = climateNormals.parks as Record<string, ParkNormals>;
const stationRows = parkStations.stations as StationRow[];
const stationByPark = new Map(stationRows.map((r) => [r.parkCode, r]));
const PARK_CODES = ALL_PARKS_MINI.map((p) => p.code);

describe("climate-normals.json _meta (spec §5 versioning and provenance)", () => {
  it("carries the full provenance block", () => {
    const meta = climateNormals._meta;
    expect(meta.sourceUrl).toContain("ncei.noaa.gov/access/services/data/v1");
    expect(meta.sourceUrl).toContain("normals-monthly-1991-2020");
    expect(meta.datasetVersion).toBe("normals-monthly-1991-2020 v1.0.1, doi:10.25921/wck8-er13");
    expect(Number.isNaN(Date.parse(meta.fetchedAt))).toBe(false);
    expect(meta.script).toBe("scripts/etl-climate-normals.mjs");
    expect(meta.recordCount).toBe(63);
  });
});

describe("coverage: all 63 parks, 12 months each", () => {
  it("has exactly the 63 park codes from all-parks-mini", () => {
    expect(Object.keys(parks).sort()).toEqual([...PARK_CODES].sort());
    expect(stationRows).toHaveLength(63);
  });

  it("every park has all 12 months with TMAX present", () => {
    for (const [code, park] of Object.entries(parks)) {
      for (const mk of MONTH_KEYS) {
        const mo = park.months[mk];
        expect(mo, `${code}/${mk} missing`).toBeDefined();
        expect(mo.tmaxF, `${code}/${mk} TMAX`).not.toBeNull();
      }
    }
  });

  it("normals stationId agrees with the park-stations mapping", () => {
    for (const [code, park] of Object.entries(parks)) {
      expect(park.stationId, code).toBe(stationByPark.get(code)?.stationId);
    }
  });
});

describe("tricky-park suite (spec §5)", () => {
  it("gaar: 122.9 km Bettles AP join carries the lowConfidence flag", () => {
    const gaar = stationByPark.get("gaar");
    expect(gaar?.lowConfidence).toBe(true);
    expect(gaar?.distanceKm).toBeGreaterThan(100);
    // ...and the normals snapshot uses that exact flagged station.
    expect(parks.gaar.stationId).toBe(gaar?.stationId);
  });

  it("viis: nearest St. John stations are precip-only — station is on St. Thomas (> 20 km)", () => {
    const viis = stationByPark.get("viis");
    expect(viis?.distanceKm).toBeGreaterThan(20);
    expect(viis?.stationName).toContain("CHARLOTTE AMALIE");
  });

  it("npsa: Tutuila-only caveat present (Ta'u/Ofu have no normals station)", () => {
    expect(stationByPark.get("npsa")?.caveat).toContain("Tutuila");
  });
});

describe("units: the 144-ft bug class (spec §5 unit sanity)", () => {
  it("every station's elevationFt round-trips through metersToFeet(elevationM)", () => {
    for (const r of stationRows) {
      expect(typeof r.elevationM, r.parkCode).toBe("number");
      expect(
        Math.abs(r.elevationFt - metersToFeet(r.elevationM)),
        `${r.parkCode}: ${r.elevationM} m vs ${r.elevationFt} ft`
      ).toBeLessThan(1);
    }
  });

  it("Acadia's station is ~470 ft, not the mislabeled 144 ft (audit #3)", () => {
    const acad = stationByPark.get("acad");
    expect(acad).toBeDefined();
    // If the join ever picks a different station, the round-trip test above
    // still guards the conversion; this pins today's canonical values.
    expect(acad?.stationId).toBe("USC00170100");
    expect(acad?.elevationM).toBeCloseTo(143.3, 1);
    expect(acad?.elevationFt).toBeGreaterThan(460);
    expect(acad?.elevationFt).toBeLessThan(480);
  });
});

describe("hemispheres: July vs January", () => {
  it("July is warmer than January for every northern-hemisphere park", () => {
    for (const [code, park] of Object.entries(parks)) {
      if (code === "npsa") continue;
      const jan = park.months.jan.tavgF;
      const jul = park.months.jul.tavgF;
      expect(jan, `${code} jan tavg`).not.toBeNull();
      expect(jul, `${code} jul tavg`).not.toBeNull();
      expect(jul!, `${code}: jul ${jul} vs jan ${jan}`).toBeGreaterThan(jan!);
    }
  });

  it("npsa (southern hemisphere): January is warmer than July", () => {
    const jan = parks.npsa.months.jan.tavgF;
    const jul = parks.npsa.months.jul.tavgF;
    expect(jan).not.toBeNull();
    expect(jul).not.toBeNull();
    expect(jan!).toBeGreaterThan(jul!);
  });
});

describe("missing ≠ zero (spec §3.2 gotchas)", () => {
  it("snowImputed only ever accompanies a zero at a tropical station", () => {
    for (const [code, park] of Object.entries(parks)) {
      for (const mk of MONTH_KEYS) {
        const mo = park.months[mk];
        if (mo.snowImputed) {
          expect(mo.snowIn, `${code}/${mk}`).toBe(0);
        }
      }
    }
  });
});
