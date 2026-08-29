import { ParkCode, ParkMonthScore, MonthAbbr, Season, Tier } from "./types";
import { PARKS, getPark } from "./data/parks";
import { ALL_PARKS_MINI } from "./data/all-parks-mini";
import { PARK_MONTH_SCORES } from "./data/park-month-scores";
import { MONTHS, SEASONS, monthByAbbr } from "./months";
import { overallMonthFit, scoreToTier, bestBalanceScore, crowdBand, type CrowdBand } from "./scoring";

export interface ParkSummary {
  code: string;
  name: string;
  state: string;
  tagline: string;
}

/** Lightweight lookup covering all 63 parks — falls back to the mini directory
 * for the 59 outside the editorial cohort, which only have name/state, not
 * a hand-written tagline. Use this anywhere a list spans every scored park;
 * use `parkByCode` only where full editorial content is required. */
export function getParkSummary(code: string): ParkSummary {
  const full = getPark(code);
  if (full) return { code: full.code, name: full.name, state: full.state, tagline: full.tagline };
  const mini = ALL_PARKS_MINI.find((p) => p.code === code);
  return {
    code,
    name: mini?.name ?? code,
    state: mini?.state ?? "",
    tagline: "One of the 63 U.S. National Parks.",
  };
}

export interface ScoredMonth extends ParkMonthScore {
  overallMonthFit: number;
  tier: Tier;
}

function score(row: ParkMonthScore): ScoredMonth {
  const fit = overallMonthFit(row);
  return { ...row, overallMonthFit: fit, tier: scoreToTier(fit) };
}

export function allParks() {
  return PARKS;
}

export function parkByCode(code: string) {
  return getPark(code);
}

export function scoresForPark(park: ParkCode): ScoredMonth[] {
  return PARK_MONTH_SCORES.filter((r) => r.park === park).map(score);
}

export function scoreForParkMonth(park: ParkCode, month: MonthAbbr): ScoredMonth | undefined {
  const row = PARK_MONTH_SCORES.find((r) => r.park === park && r.month === month);
  return row ? score(row) : undefined;
}

export function scoresForMonth(month: MonthAbbr): ScoredMonth[] {
  return PARK_MONTH_SCORES.filter((r) => r.month === month).map(score);
}

/** Best in month, sorted by Month Fit desc (tiers, not ordinal ranks, are what render). */
export function bestByMonth(month: MonthAbbr): ScoredMonth[] {
  return scoresForMonth(month).sort((a, b) => b.overallMonthFit - a.overallMonthFit);
}

function peakPercentFor(park: ParkCode): number {
  return Math.max(...scoresForPark(park).map((s) => s.percentOfAnnualVisits));
}

/** Single source of truth for crowd percentile: each park's rank among that
 * month's percentOfAnnualVisits, as a 1-100 percentile (low = less crowded).
 * At n=4 (Phase 0.5 cohort) this only ever produces 25/50/75/100 — a small-n
 * artifact, not a signal — but is exact now that every park (n=63) scores. */
function withCrowdPercentile(rows: ScoredMonth[]): (ScoredMonth & { crowdPercentile: number })[] {
  const sorted = [...rows].sort((a, b) => a.percentOfAnnualVisits - b.percentOfAnnualVisits);
  return rows.map((r) => {
    const rank = sorted.findIndex((s) => s.park === r.park);
    return { ...r, crowdPercentile: Math.round(((rank + 1) / sorted.length) * 100) };
  });
}

/** Hidden Gems This Month: Month Fit >= 85 AND crowd percentile <= 40. */
export function hiddenGemsForMonth(month: MonthAbbr): (ScoredMonth & { crowdPercentile: number })[] {
  return withCrowdPercentile(scoresForMonth(month))
    .filter((r) => r.overallMonthFit >= 85 && r.crowdPercentile <= 40)
    .sort((a, b) => b.overallMonthFit - a.overallMonthFit);
}

/** When no park clears the Hidden Gems bar this month, point somewhere real
 * instead of an empty box: the nearest month (by calendar distance) that does. */
export function nearestHiddenGem(month: MonthAbbr): { park: ParkCode; month: MonthAbbr; fit: number } | null {
  const startIdx = monthByAbbr(month)!.index;
  for (let dist = 1; dist <= 6; dist++) {
    for (const dir of [1, -1]) {
      const idx = (((startIdx + dir * dist) % 12) + 12) % 12;
      const candidateMonth = MONTHS[idx].abbr;
      const gems = hiddenGemsForMonth(candidateMonth);
      if (gems.length > 0) {
        return { park: gems[0].park, month: candidateMonth, fit: gems[0].overallMonthFit };
      }
    }
  }
  return null;
}

/** Least Crowded ranking: cross-park percentile bands (PRD §6.4), not an
 * ordinal rank and not raw visits-per-acre — sorted least-crowded first. */
export function crowdBandsForMonth(month: MonthAbbr): (ScoredMonth & { crowdPercentile: number; band: CrowdBand })[] {
  return withCrowdPercentile(scoresForMonth(month))
    .map((r) => ({ ...r, band: crowdBand(r.crowdPercentile) }))
    .sort((a, b) => a.crowdPercentile - b.crowdPercentile);
}

export interface ParkHeaderLabels {
  bestOverall: { month: MonthAbbr; name: string };
  bestWeather: { month: MonthAbbr; name: string };
  fewestCrowds: { month: MonthAbbr; name: string };
  bestBalance: { month: MonthAbbr; name: string };
}

export function parkHeaderLabels(park: ParkCode): ParkHeaderLabels {
  const rows = scoresForPark(park);
  const peak = peakPercentFor(park);
  const byOverall = [...rows].sort((a, b) => b.overallMonthFit - a.overallMonthFit)[0];
  const byWeather = [...rows].sort((a, b) => b.climateScore - a.climateScore)[0];
  const byCrowds = [...rows].sort((a, b) => a.percentOfAnnualVisits - b.percentOfAnnualVisits)[0];
  const byBalance = [...rows]
    .map((r) => ({ r, balance: bestBalanceScore(r.climateScore, r.percentOfAnnualVisits, peak) }))
    .sort((a, b) => b.balance - a.balance)[0].r;

  const name = (abbr: MonthAbbr) => monthByAbbr(abbr)!.name;
  return {
    bestOverall: { month: byOverall.month, name: name(byOverall.month) },
    bestWeather: { month: byWeather.month, name: name(byWeather.month) },
    fewestCrowds: { month: byCrowds.month, name: name(byCrowds.month) },
    bestBalance: { month: byBalance.month, name: name(byBalance.month) },
  };
}

export function seasonFit(park: ParkCode, season: Season): number {
  const months = SEASONS.find((s) => s.key === season)!.months;
  const rows = scoresForPark(park).filter((r) => months.includes(r.month));
  const mean = rows.reduce((sum, r) => sum + r.overallMonthFit, 0) / rows.length;
  return Math.round(mean);
}

export function bestBySeason(season: Season): { park: ParkCode; fit: number; tier: Tier }[] {
  return ALL_PARKS_MINI.map((p) => {
    const fit = seasonFit(p.code, season);
    return { park: p.code, fit, tier: scoreToTier(fit) };
  }).sort((a, b) => b.fit - a.fit);
}

/** Experimental only (PRD §6.4): visits per acre, real acreage/visitation exists
 * only for the 4-park editorial cohort — never treat as a full-63 ranking. */
export function visitsPerAcre(park: ParkCode): number | null {
  const p = getPark(park);
  if (!p) return null;
  return Math.round((p.medianAnnualVisits / p.acreage) * 100) / 100;
}

export { MONTHS, SEASONS };
