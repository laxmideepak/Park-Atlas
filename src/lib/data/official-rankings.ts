/** Real official data — NPS Office of Communications 2025 visitation release (PRD Appendix B). */
export const OFFICIAL_MOST_VISITED_2025: { rank: number; name: string; visits: number; parkCode?: string }[] = [
  { rank: 1, name: "Great Smoky Mountains", visits: 11527939, parkCode: "grsm" },
  { rank: 2, name: "Zion", visits: 4984525, parkCode: "zion" },
  { rank: 3, name: "Yellowstone", visits: 4762988, parkCode: "yell" },
  { rank: 4, name: "Grand Canyon", visits: 4430653, parkCode: "grca" },
  { rank: 5, name: "Yosemite", visits: 4278413, parkCode: "yose" },
  { rank: 6, name: "Rocky Mountain", visits: 4171431, parkCode: "romo" },
  { rank: 7, name: "Acadia", visits: 4079318, parkCode: "acad" },
  { rank: 8, name: "Grand Teton", visits: 3800648, parkCode: "grte" },
  { rank: 9, name: "Olympic", visits: 3584187, parkCode: "olym" },
  { rank: 10, name: "Glacier", visits: 3136557, parkCode: "glac" },
];

export const OFFICIAL_SYSTEMWIDE_2025 = {
  totalVisits: 323014305,
  reportingParks: 406,
  recordSettingParks: 26,
  note: "2025 includes a 43-day government shutdown — an anomalous single year, hence 5-yr medians for all calculated scoring.",
  source: "NPS Office of Communications 2025 visitation release; per-park data via irma.nps.gov/Stats",
};
