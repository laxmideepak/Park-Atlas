import { Park } from "../types";

/**
 * Phase 0.5 validation cohort (PRD sec 10). Four parks chosen to stress the
 * scoring engine before scale-out to all 63: coastal/lake hydrography +
 * strong seasonality (Acadia), hard road closures + wildlife tags
 * (Yellowstone), inverted winter-best seasonality + extreme heat (Death
 * Valley), extreme visitation + no entrance fee (Great Smoky Mountains).
 */
export const PARKS: Park[] = [
  {
    code: "acad",
    name: "Acadia National Park",
    state: "Maine",
    acreage: 49077,
    entryFee: "$35 / vehicle (7-day)",
    medianAnnualVisits: 4079318, // 2025 official figure only; 5-yr median pending Phase 1
    visitsWindow: "2025 (single year)",
    officialVisitRank2025: 7,
    tagline: "Granite coastline, quiet lakes, and the first sunrise in the U.S.",
    fieldNote: "Waves work granite into pink dust while spruce holds the ridgeline. Low tide opens the Bar Island bar; high tide erases it. The mountain, the pond, and the sea sit close enough here to visit all three before lunch.",
    quickStats: { tripLength: "2-4 days", typicalTempRange: "20-75°F across the year" },
  },
  {
    code: "yell",
    name: "Yellowstone National Park",
    state: "Wyoming / Montana / Idaho",
    acreage: 2219791,
    entryFee: "$35 / vehicle (7-day)",
    medianAnnualVisits: 4762988, // 2025 official figure only; 5-yr median pending Phase 1
    visitsWindow: "2025 (single year)",
    officialVisitRank2025: 3,
    tagline: "Geothermal basins, wildlife-thick valleys, and a road network that half-closes every winter.",
    fieldNote: "The ground breathes here — steam rising off a basin that's been erupting on its own schedule for longer than any road. Come summer the whole park is open and half of it is holding its breath for winter, when the interior seals shut and only snowcoaches get in.",
    quickStats: { tripLength: "4-7 days", typicalTempRange: "-5-80°F across the year" },
  },
  {
    code: "deva",
    name: "Death Valley National Park",
    state: "California / Nevada",
    acreage: 3373063,
    entryFee: "$30 / vehicle (7-day)",
    medianAnnualVisits: 1320000, // official 2025 release says "more than 1.32 million" — prior 1,190,000 matched no published figure; exact IRMA count pending
    visitsWindow: "2025 (single year)",
    officialVisitRank2025: null,
    tagline: "The hottest, lowest, driest park in the system — and inverted: winter is peak season.",
    fieldNote: "The valley floor sits 282 feet below sea level and holds heat like a kiln. Everything here runs backwards from what a national park usually asks of you: come in winter, hike at sunrise, and let the salt flats and dunes do the talking at midday when nothing else moves.",
    quickStats: { tripLength: "1-3 days", typicalTempRange: "40-120°F across the year" },
  },
  {
    code: "grsm",
    name: "Great Smoky Mountains National Park",
    state: "Tennessee / North Carolina",
    acreage: 522419,
    entryFee: "No standard entrance fee",
    medianAnnualVisits: 11527939, // 2025 official figure only; 5-yr median pending Phase 1
    visitsWindow: "2025 (single year)",
    officialVisitRank2025: 1,
    tagline: "The most-visited National Park — dense trail network, no gate, and the densest hiking pressure in the system.",
    fieldNote: "Ridge after blue ridge fades into haze — the terpenes the forest breathes out are the reason for the name and the color. There's no entrance gate and no fee, so the crowds come freely; the reward for timing it right is a quiet Cades Cove morning instead of a bumper-to-bumper one.",
    quickStats: { tripLength: "2-5 days", typicalTempRange: "25-85°F across the year" },
  },
];

export function getPark(code: string) {
  return PARKS.find((p) => p.code === code);
}
