/** Any of the 63 NPS park codes. Widened from a 4-value literal union now that
 * every park carries Month Fit scoring (was cohort-only through Phase 0.5). */
export type ParkCode = string;

export type Tier = "Exceptional" | "Excellent" | "Good" | "Specialized" | "Limited";

export type Confidence = "High" | "Medium" | "Low";

export type Season = "winter" | "spring" | "summer" | "fall";

export type MonthAbbr =
  | "jan" | "feb" | "mar" | "apr" | "may" | "jun"
  | "jul" | "aug" | "sep" | "oct" | "nov" | "dec";

export interface MonthMeta {
  abbr: MonthAbbr;
  name: string;
  index: number; // 0-11
  season: Season;
  /** Hand-written standfirst for the month page hero — editorial, not derived from scores. */
  lede: string;
}

export interface Park {
  code: ParkCode;
  name: string;
  state: string;
  acreage: number;
  entryFee: string;
  /** PRD principle: medians over the 5 most recent completed years, never a single year. */
  medianAnnualVisits: number;
  visitsWindow: string; // e.g. "2021-2025"
  officialVisitRank2025: number | null; // real one-time snapshot from the 2025 NPS release (Appendix B) — correctly year-pinned, unlike the median above
  tagline: string;
  fieldNote: string;
  quickStats: { tripLength: string; typicalTempRange: string };
}

/** One row of the park_month_scores table (see PRD sec 11). */
export interface ParkMonthScore {
  park: ParkCode;
  month: MonthAbbr;
  climateScore: number; // 0-100, NOAA normals derived
  accessibilityScore: number; // 0-100, NPS operating seasons / road status derived
  dataConfidence: Confidence;
  missingComponents: string[];
  percentOfAnnualVisits: number; // informational only, never scored
  experienceTags: string[]; // curated, unscored at v1.0
  climateStation: string;
  climateStationElevFt: number;
  whyNotNow?: string[]; // shown when tier is Specialized/Limited
}

export interface SourceRef {
  label: string;
  agency: string;
  retrievedAt: string;
}
