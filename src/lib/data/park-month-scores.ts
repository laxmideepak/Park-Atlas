import { ParkCode, ParkMonthScore } from "../types";
import { MONTHS } from "../months";
import { ALL_PARKS_MINI } from "./all-parks-mini";
import { getSeed, getSilhouetteFamily, seededRandom, type SilhouetteFamily } from "../park-theme";

/**
 * Seed data for the Phase 0.5 validation cohort (PRD sec 10). Monthly
 * climate/accessibility curves are illustrative, hand-authored from known
 * real-world seasonal patterns for each park — not yet loaded from a live
 * NOAA/NPS pipeline (that's the Phase 1 ETL). Visitation is expressed only
 * as % of annual visits and never enters overallMonthFit.
 */

interface ParkCurve {
  climateStation: string;
  climateStationElevFt: number;
  climate: number[]; // 12, Jan->Dec
  access: number[]; // 12, Jan->Dec
  percentOfAnnual: number[]; // 12, sums to 100
  confidenceOverride: Record<number, { level: "Medium" | "Low"; missing: string[] }>;
  tags: Record<number, string[]>;
  whyNotNow: Record<number, string[]>;
}

const CURVES: Record<ParkCode, ParkCurve> = {
  acad: {
    climateStation: "Bar Harbor, ME (McFarland Hill)",
    climateStationElevFt: 144,
    climate:  [25, 28, 40, 55, 68, 78, 85, 90, 90, 82, 55, 32],
    access:   [30, 30, 35, 55, 85, 95, 98, 98, 96, 90, 50, 32],
    percentOfAnnual: [1, 1, 2, 4, 8, 12, 18, 19, 15, 12, 5, 2],
    confidenceOverride: {
      0: { level: "Medium", missing: ["accessibility: winter facility hours partially unlisted"] },
      1: { level: "Medium", missing: ["accessibility: winter facility hours partially unlisted"] },
      10: { level: "Medium", missing: ["accessibility: Park Loop Rd shoulder-season closures not pre-scheduled"] },
      11: { level: "Medium", missing: ["accessibility: winter facility hours partially unlisted"] },
    },
    tags: {
      5: ["wildflower bloom"],
      6: ["peak swimming & lake season"],
      7: ["peak swimming & lake season"],
      8: ["early fall foliage"],
      9: ["peak fall foliage", "relatively few people"],
      11: ["winter carriage-road skiing"],
      0: ["winter carriage-road skiing"],
    },
    whyNotNow: {
      0: ["❄️ cold, damp coastal wind", "🚧 most of Park Loop Rd closed to vehicles", "🏠 nearly all in-park facilities closed", "⛷️ quiet carriage roads reopen for skiing"],
      1: ["❄️ cold, damp coastal wind", "🚧 most of Park Loop Rd closed to vehicles", "🏠 nearly all in-park facilities closed", "⛷️ quiet carriage roads reopen for skiing"],
      2: ["🌧️ raw, changeable coastal weather", "🥾 many carriage roads still icy or muddy", "🏠 seasonal facilities not yet open"],
      3: ["🌧️ classic \"mud season\" — trails soft and eroding", "🚧 Park Loop Rd reopening in stages", "🌸 early wildflowers just starting"],
      10: ["🍂 cold snaps, early snow possible", "🚧 Park Loop Rd closing for the season", "🏠 most concessions closed", "🌅 dramatic, empty coastal light"],
      11: ["❄️ cold, damp coastal wind", "🚧 Park Loop Rd closed to vehicles", "🏠 nearly all in-park facilities closed", "⛷️ quiet carriage roads reopen for skiing"],
    },
  },
  yell: {
    climateStation: "West Yellowstone, MT / Old Faithful",
    climateStationElevFt: 7350,
    climate:  [20, 22, 30, 42, 62, 82, 92, 90, 82, 58, 30, 20],
    access:   [20, 22, 25, 35, 72, 95, 98, 98, 92, 60, 18, 18],
    percentOfAnnual: [2, 2, 2, 4, 9, 16, 20, 18, 15, 8, 2, 2],
    confidenceOverride: {
      0: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
      1: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
      2: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
      3: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
      9: { level: "Medium", missing: ["accessibility: fall closure dates weather-dependent, schedule proxied"] },
      10: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
      11: { level: "Medium", missing: ["accessibility: exact plow/opening dates vary year to year, schedule proxied"] },
    },
    tags: {
      0: ["wildlife viewing", "snowcoach & snowmobile access", "geyser steam in sub-zero air"],
      1: ["wildlife viewing", "snowcoach & snowmobile access"],
      4: ["spring bear activity"],
      5: ["wildlife viewing", "geothermal basins fully open"],
      6: ["wildlife viewing", "geothermal basins fully open"],
      7: ["wildlife viewing", "geothermal basins fully open"],
      8: ["elk rut"],
      9: ["fall elk bugling", "early snow possible"],
      11: ["wildlife viewing", "snowcoach & snowmobile access"],
    },
    whyNotNow: {
      0: ["❄️ very cold", "🚧 most roads closed to normal vehicles", "🥾 limited conventional trail access", "🤬 excellent wildlife & snow experiences"],
      1: ["❄️ very cold", "🚧 most roads closed to normal vehicles", "🥾 limited conventional trail access", "🤬 excellent wildlife & snow experiences"],
      2: ["❄️ still deep winter at elevation", "🚧 interior roads not yet plowed", "🤬 prime late-winter wildlife viewing"],
      3: ["🌧️ mud, ice, and reduced services", "🚧 interior road openings staggered through the month"],
      9: ["❄️ first snow can close roads with little notice", "🚧 facilities winding down for the season", "🦌 elk bugling season in full swing"],
      10: ["❄️ winter closures begin", "🚧 most interior roads closed by mid-month", "🤬 snowcoach season starting"],
      11: ["❄️ very cold", "🚧 most roads closed to normal vehicles", "🥾 limited conventional trail access", "🤬 excellent wildlife & snow experiences"],
    },
  },
  "deva": {
    climateStation: "Furnace Creek, CA (valley floor)",
    climateStationElevFt: -190,
    climate:  [85, 88, 90, 78, 45, 15, 8, 10, 25, 60, 82, 85],
    access:   [90, 92, 92, 90, 75, 55, 50, 50, 65, 85, 90, 90],
    percentOfAnnual: [14, 15, 16, 10, 5, 2, 2, 2, 3, 6, 11, 14],
    confidenceOverride: {
      4: { level: "Medium", missing: ["climate: valley-floor station may understate relief at higher elevations (Telescope Peak, Wildrose)"] },
      5: { level: "Medium", missing: ["climate: valley-floor station may understate relief at higher elevations (Telescope Peak, Wildrose)"] },
      6: { level: "Medium", missing: ["climate: valley-floor station may understate relief at higher elevations (Telescope Peak, Wildrose)"] },
      7: { level: "Medium", missing: ["climate: valley-floor station may understate relief at higher elevations (Telescope Peak, Wildrose)"] },
      8: { level: "Medium", missing: ["climate: valley-floor station may understate relief at higher elevations (Telescope Peak, Wildrose)"] },
    },
    tags: {
      1: ["wildflower super-bloom (rain-dependent)"],
      2: ["wildflower super-bloom (rain-dependent)"],
      10: ["dark-sky stargazing", "sunrise at Zabriskie Point"],
      11: ["dark-sky stargazing"],
      0: ["dark-sky stargazing"],
      6: ["extreme-heat record chasing (Badwater, sunrise only)"],
      7: ["extreme-heat record chasing (Badwater, sunrise only)"],
    },
    whyNotNow: {
      4: ["🌡️ highs regularly exceed 100°F", "🚶 most hiking best done at sunrise only", "🌵 quieter than the winter peak"],
      5: ["🥵 average highs near 110°F", "🚧 several unshaded trails carry heat advisories", "🌅 near-empty scenic drives"],
      6: ["🥵 average highs over 115°F on the valley floor", "🚧 many unshaded trails carry heat-closure advisories", "🚗 car trouble risk rises sharply in daytime heat", "🌡️ this is where Death Valley's heat-record reputation comes from — sunrise-only, paved-pullout visits work, not a typical first visit"],
      7: ["🥵 average highs over 115°F on the valley floor", "🚧 many unshaded trails carry heat-closure advisories", "🚗 car trouble risk rises sharply in daytime heat"],
      8: ["🌡️ still very hot, especially early month", "🚧 midday hiking not recommended"],
    },
  },
  "grsm": {
    climateStation: "Sugarlands Visitor Center, TN",
    climateStationElevFt: 1462,
    climate:  [45, 48, 58, 72, 82, 80, 72, 72, 80, 88, 68, 48],
    access:   [70, 70, 80, 95, 98, 98, 98, 98, 96, 95, 85, 70],
    percentOfAnnual: [4, 4, 6, 8, 9, 11, 12, 10, 9, 13, 9, 5],
    confidenceOverride: {
      0: { level: "Medium", missing: ["accessibility: Clingmans Dome/Newfound Gap closures are event-driven, not pre-scheduled"] },
      1: { level: "Medium", missing: ["accessibility: Clingmans Dome/Newfound Gap closures are event-driven, not pre-scheduled"] },
      11: { level: "Medium", missing: ["accessibility: Clingmans Dome/Newfound Gap closures are event-driven, not pre-scheduled"] },
    },
    tags: {
      3: ["spring wildflower \"pilgrimage\""],
      5: ["synchronous firefly event (lottery access)"],
      9: ["peak fall foliage"],
      6: ["full waterfall flow, dense crowds"],
      7: ["full waterfall flow, dense crowds"],
    },
    whyNotNow: {
      0: ["🥶 icy conditions on higher-elevation roads", "🚧 Clingmans Dome Rd typically closed", "🌫️ frequent freezing fog above 5,000 ft", "🔥 quiet trails, slower cold-weather visit"],
      1: ["🥶 icy conditions on higher-elevation roads", "🚧 Clingmans Dome Rd typically closed", "🌫️ frequent freezing fog above 5,000 ft"],
      2: ["🌦️ transitional weather, sudden cold snaps", "🚧 some high-elevation roads still icy", "🌸 first wildflowers beginning"],
      11: ["🥶 icy conditions on higher-elevation roads", "🚧 Clingmans Dome Rd typically closed", "🎄 quiet, uncrowded gateway towns"],
    },
  },
};

function confidenceFor(curve: ParkCurve, i: number): { level: "High" | "Medium" | "Low"; missing: string[] } {
  const override = curve.confidenceOverride[i];
  if (override) return { level: override.level, missing: override.missing };
  return { level: "High", missing: [] };
}

/**
 * Estimated curves for the 59 parks outside the hand-authored validation
 * cohort above. There is no live API for either input: NOAA normals need a
 * separate NCEI token plus per-park weather-station research, and NPS
 * publishes no "% roads open per month" dataset at all — that's why the 4
 * cohort curves above are hand-authored too, not live-fetched. This applies
 * the same seed-data methodology at Phase 1 scale: a deterministic estimate
 * per park (from real climate/geography family + a stable per-park seed,
 * never randomized per request), always labeled Medium confidence with the
 * missing live inputs listed — never presented as measured.
 */
const FAMILY_BASE: Record<SilhouetteFamily, { climate: number[]; access: number[] }> = {
  mountain: { climate: [20, 22, 30, 45, 62, 80, 90, 88, 78, 55, 30, 20], access: [20, 20, 25, 35, 70, 92, 97, 97, 90, 60, 20, 18] },
  desert: { climate: [82, 85, 88, 75, 48, 20, 12, 15, 30, 58, 78, 84], access: [88, 90, 90, 88, 72, 58, 52, 52, 65, 82, 88, 88] },
  coastal: { climate: [35, 38, 48, 58, 68, 78, 84, 86, 84, 72, 55, 38], access: [45, 45, 55, 70, 85, 95, 97, 97, 93, 85, 60, 45] },
  forest: { climate: [42, 45, 55, 68, 78, 80, 75, 75, 78, 82, 60, 42], access: [65, 65, 75, 90, 95, 97, 97, 97, 95, 90, 80, 65] },
};

const FAMILY_WHY_NOT_NOW: Record<SilhouetteFamily, string[]> = {
  mountain: ["❄️ cold, high-elevation conditions typical this time of year", "🚧 seasonal road closures are common for parks like this", "🏔️ still workable for a prepared, cold-weather visit"],
  desert: ["🥵 very hot conditions typical for a desert park this time of year", "🚧 midday hiking isn't recommended", "🌅 early morning or sunset visits still work well"],
  coastal: ["🌧️ cooler, wetter shoulder-season weather typical here", "🏠 some seasonal facilities may be reduced or closed"],
  forest: ["🌦️ cold or transitional weather typical this time of year", "🚧 some higher-elevation roads may be limited"],
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function estimatedCurve(code: string, state: string): ParkCurve {
  const family = getSilhouetteFamily(code, state);
  const base = FAMILY_BASE[family];
  const rand = seededRandom(getSeed(code));
  const climate = base.climate.map((v) => clamp(v + (rand() - 0.5) * 12));
  const access = base.access.map((v) => clamp(v + (rand() - 0.5) * 10));

  const rawShare = climate.map((c, i) => Math.max(1, (c + access[i]) / 2));
  const shareSum = rawShare.reduce((a, b) => a + b, 0);
  const percentOfAnnual = rawShare.map((v) => Math.max(1, Math.round((v / shareSum) * 100)));

  const missing = [
    `climate: regional estimate by park type — no per-park NOAA normals station identified yet`,
    `accessibility: regional estimate by park type — NPS publishes no monthly-access dataset`,
  ];
  const confidenceOverride: ParkCurve["confidenceOverride"] = {};
  const whyNotNow: ParkCurve["whyNotNow"] = {};
  for (let i = 0; i < 12; i++) {
    confidenceOverride[i] = { level: "Medium", missing };
    whyNotNow[i] = FAMILY_WHY_NOT_NOW[family];
  }

  return {
    climateStation: "Regional estimate — no station identified yet",
    climateStationElevFt: 0,
    climate,
    access,
    percentOfAnnual,
    confidenceOverride,
    tags: {},
    whyNotNow,
  };
}

function withEstimatedParks(hand: Record<ParkCode, ParkCurve>): Record<ParkCode, ParkCurve> {
  const merged: Record<ParkCode, ParkCurve> = { ...hand };
  ALL_PARKS_MINI.forEach((p) => {
    if (!merged[p.code]) merged[p.code] = estimatedCurve(p.code, p.state);
  });
  return merged;
}

export function buildParkMonthScores(): ParkMonthScore[] {
  const allCurves = withEstimatedParks(CURVES);
  const rows: ParkMonthScore[] = [];
  (Object.keys(allCurves) as ParkCode[]).forEach((park) => {
    const curve = allCurves[park];
    MONTHS.forEach((m, i) => {
      const conf = confidenceFor(curve, i);
      rows.push({
        park,
        month: m.abbr,
        climateScore: curve.climate[i],
        accessibilityScore: curve.access[i],
        dataConfidence: conf.level,
        missingComponents: conf.missing,
        percentOfAnnualVisits: curve.percentOfAnnual[i],
        experienceTags: curve.tags[i] ?? [],
        climateStation: curve.climateStation,
        climateStationElevFt: curve.climateStationElevFt,
        whyNotNow: curve.whyNotNow[i],
      });
    });
  });
  return rows;
}

export const PARK_MONTH_SCORES = buildParkMonthScores();
