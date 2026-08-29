import { MonthMeta, Season, MonthAbbr } from "./types";

export const MONTHS: MonthMeta[] = [
  { abbr: "jan", name: "January", index: 0, season: "winter" },
  { abbr: "feb", name: "February", index: 1, season: "winter" },
  { abbr: "mar", name: "March", index: 2, season: "spring" },
  { abbr: "apr", name: "April", index: 3, season: "spring" },
  { abbr: "may", name: "May", index: 4, season: "spring" },
  { abbr: "jun", name: "June", index: 5, season: "summer" },
  { abbr: "jul", name: "July", index: 6, season: "summer" },
  { abbr: "aug", name: "August", index: 7, season: "summer" },
  { abbr: "sep", name: "September", index: 8, season: "fall" },
  { abbr: "oct", name: "October", index: 9, season: "fall" },
  { abbr: "nov", name: "November", index: 10, season: "fall" },
  { abbr: "dec", name: "December", index: 11, season: "winter" },
];

export const SEASONS: { key: Season; name: string; months: MonthAbbr[] }[] = [
  { key: "winter", name: "Winter", months: ["dec", "jan", "feb"] },
  { key: "spring", name: "Spring", months: ["mar", "apr", "may"] },
  { key: "summer", name: "Summer", months: ["jun", "jul", "aug"] },
  { key: "fall", name: "Fall", months: ["sep", "oct", "nov"] },
];

export const SEASON_ACCENT: Record<Season, string> = {
  spring: "#6B8F5A",
  summer: "#D6A63B",
  fall: "#B5502C",
  winter: "#6FA8B5",
};

export function monthByAbbr(abbr: string): MonthMeta | undefined {
  return MONTHS.find((m) => m.abbr === abbr);
}

/** The real current month — pages using this should set `revalidate` so it doesn't freeze at build time. */
export function currentMonthAbbr(): MonthAbbr {
  return MONTHS[new Date().getMonth()].abbr;
}

export function seasonOf(abbr: MonthAbbr): Season {
  return MONTHS.find((m) => m.abbr === abbr)!.season;
}
