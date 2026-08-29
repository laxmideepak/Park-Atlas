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

/** Rough regional heuristic driving which silhouette shape family a park gets — decorative, not a GIS classification. */
export function getSilhouetteFamily(code: string, state: string): SilhouetteFamily {
  if (COHORT_CODES.has(code)) {
    return { acad: "coastal" as const, yell: "mountain" as const, deva: "desert" as const, grsm: "forest" as const }[
      code as ParkCode
    ];
  }
  const parts = state.split("/").map((s) => s.trim());
  if (parts.some((p) => MOUNTAIN_STATES.includes(p))) return "mountain";
  if (parts.some((p) => DESERT_STATES.includes(p))) return "desert";
  if (parts.some((p) => COASTAL_STATES.includes(p))) return "coastal";
  return "forest";
}
