import { ParkCode } from "./types";

/** Hand-picked for the 4 validation-cohort parks; every other park gets a
 * deterministically generated accent so it still reads as its own place,
 * not a copy of one of these four. */
export const COHORT_ACCENT: Record<ParkCode, string> = {
  acad: "#6FA8B5",
  yell: "#D6A63B",
  deva: "#B5502C",
  grsm: "#6B8F5A",
};

const COHORT_CODES = new Set(Object.keys(COHORT_ACCENT));

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic seeded PRNG (mulberry32) — same code always yields the same look. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 1;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getSeed(code: string): number {
  return hashCode(code);
}

/** Earthy, WPA-poster-safe hue — never neon, always distinct per park code. */
export function getParkAccent(code: string): string {
  if (COHORT_CODES.has(code)) return COHORT_ACCENT[code as ParkCode];
  const rand = seededRandom(getSeed(code));
  const hue = Math.floor(rand() * 360);
  const sat = 0.4 + rand() * 0.15;
  const light = 0.42 + rand() * 0.14;
  return hslToHex(hue, sat, light);
}

export type SilhouetteFamily = "coastal" | "mountain" | "desert" | "forest";

const MOUNTAIN_STATES = ["AK", "MT", "WY", "CO", "WA", "ID", "OR"];
const DESERT_STATES = ["AZ", "NV", "UT", "NM", "TX"];
const COASTAL_STATES = ["ME", "FL", "SC", "HI", "AS", "VI", "OH", "MI", "IN", "MN"];

const COHORT_FAMILY: Record<string, SilhouetteFamily> = {
  acad: "coastal",
  yell: "mountain",
  deva: "desert",
  grsm: "forest",
};

/** Rough regional heuristic driving which silhouette shape family a park gets — decorative, not a GIS classification. */
export function getSilhouetteFamily(code: string, state: string): SilhouetteFamily {
  if (COHORT_FAMILY[code]) return COHORT_FAMILY[code];
  const parts = state.split("/").map((s) => s.trim());
  if (parts.some((p) => MOUNTAIN_STATES.includes(p))) return "mountain";
  if (parts.some((p) => DESERT_STATES.includes(p))) return "desert";
  if (parts.some((p) => COASTAL_STATES.includes(p))) return "coastal";
  return "forest";
}

export type Region = "West" | "Rockies" | "Southwest" | "East" | "AK + Islands";

const REGION_BY_STATE: Record<string, Region> = {
  AK: "AK + Islands", HI: "AK + Islands", AS: "AK + Islands", VI: "AK + Islands",
  CA: "West", OR: "West", WA: "West", NV: "West",
  MT: "Rockies", WY: "Rockies", ID: "Rockies", CO: "Rockies",
  UT: "Southwest", AZ: "Southwest", NM: "Southwest", TX: "Southwest",
};

/** Same "first listed state wins" convention as getSilhouetteFamily, for the
 * mobile region list (§6.1.4) and the parks-index filter row (§6.5). */
export function getRegion(state: string): Region {
  const first = state.split("/")[0]?.trim();
  return REGION_BY_STATE[first] ?? "East";
}
