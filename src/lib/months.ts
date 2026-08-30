import { MonthMeta, Season, MonthAbbr } from "./types";

/** Ledes are hand-written standfirsts, checked against the Month Fit data
 * (tier counts, family curves, top scores) so they never contradict the
 * rankings rendered below them. Editorial voice — do not generate. */
export const MONTHS: MonthMeta[] = [
  {
    abbr: "jan", name: "January", index: 0, season: "winter",
    lede: "With the high-country roads gated until spring, January belongs to the deserts — Death Valley, Saguaro, and the Guadalupes all running near their annual best.",
  },
  {
    abbr: "feb", name: "February", index: 1, season: "winter",
    lede: "Still deep winter by the calendar, but canyon country has already turned: Capitol Reef posts the system's best score of the month, and a wet year puts wildflowers on the Death Valley floor.",
  },
  {
    abbr: "mar", name: "March", index: 2, season: "spring",
    lede: "Peak desert: Big Bend turns in the only Exceptional rating of the year's first half, the red-rock parks crowd in behind it, and the mountains stay shut.",
  },
  {
    abbr: "apr", name: "April", index: 3, season: "spring",
    lede: "A hinge month — the deserts easing off the top of the chart, the forests not quite awake, and for once nothing in the system rating better than Good.",
  },
  {
    abbr: "may", name: "May", index: 4, season: "spring",
    lede: "The forest parks take May — Mammoth Cave posts the month's best score — while the plows are still cutting their way up to the high passes.",
  },
  {
    abbr: "jun", name: "June", index: 5, season: "summer",
    lede: "The whole northern tier comes online at once, Alaska included, just as the deserts drop off the chart ahead of their first 115-degree afternoons.",
  },
  {
    abbr: "jul", name: "July", index: 6, season: "summer",
    lede: "The mountains' month: Katmai, Olympic, and the Rockies all run Exceptional, while the desert floor holds near 115 and hiking there ends at sunrise.",
  },
  {
    abbr: "aug", name: "August", index: 7, season: "summer",
    lede: "Everything is open and everyone knows it; the scores point uphill, to Rainier and the North Cascades in their brief snow-free window.",
  },
  {
    abbr: "sep", name: "September", index: 8, season: "fall",
    lede: "The crowds thin out before the weather does — Acadia hits its stride, the elk start bugling in Yellowstone, and more than half the system still rates Excellent or better.",
  },
  {
    abbr: "oct", name: "October", index: 9, season: "fall",
    lede: "October is the forests' answer to March: the Smokies peak with the foliage, the first storms close the high passes, and the deserts begin their slow return.",
  },
  {
    abbr: "nov", name: "November", index: 10, season: "fall",
    lede: "The map contracts to its winter shape — half the parks drop to Limited just as Petrified Forest, Big Bend, and Death Valley come back into walking weather.",
  },
  {
    abbr: "dec", name: "December", index: 11, season: "winter",
    lede: "Forty-nine parks ride out December at Limited; the deserts carry the season, with Arches posting the month's best score and Yellowstone's interior reachable only by snowcoach.",
  },
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
