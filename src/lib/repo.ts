import { ParkCode, ParkMonthScore, MonthAbbr, Season, Tier } from "./types";
import { PARKS, getPark } from "./data/parks";
import { PARK_MONTH_SCORES } from "./data/park-month-scores";
import { MONTHS, SEASONS, monthByAbbr } from "./months";
import { overallMonthFit, scoreToTier, bestBalanceScore } from "./scoring";

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

/** Hidden Gems This Month: Month Fit >= 85 AND crowd percentile <= 40 within the cohort. */
export function hiddenGemsForMonth(month: MonthAbbr): (ScoredMonth & { crowdPercentile: number })[] {
  const rows = scoresForMonth(month);
  const sortedByCrowd = [...rows].sort((a, b) => a.percentOfAnnualVisits - b.percentOfAnnualVisits);
  const withPercentile = rows.map((r) => {
    const rank = sortedByCrowd.findIndex((s) => s.park === r.park);
    const crowdPercentile = Math.round(((rank + 1) / sortedByCrowd.length) * 100);
    return { ...r, crowdPercentile };
  });
  return withPercentile
    .filter((r) => r.overallMonthFit >= 85 && r.crowdPercentile <= 40)
    .sort((a, b) => b.overallMonthFit - a.overallMonthFit);
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
  return PARKS.map((p) => {
    const fit = seasonFit(p.code, season);
    return { park: p.code, fit, tier: scoreToTier(fit) };
  }).sort((a, b) => b.fit - a.fit);
}

export function crowdPercentileWithinCohort(park: ParkCode, month: MonthAbbr): number {
  const rows = scoresForMonth(month).sort((a, b) => a.percentOfAnnualVisits - b.percentOfAnnualVisits);
  const rank = rows.findIndex((r) => r.park === park);
  return Math.round(((rank + 1) / rows.length) * 100);
}

export function visitsPerAcre(park: ParkCode): number {
  const p = getPark(park)!;
  return Math.round((p.annualVisits2025 / p.acreage) * 100) / 100;
}

export { MONTHS, SEASONS };
