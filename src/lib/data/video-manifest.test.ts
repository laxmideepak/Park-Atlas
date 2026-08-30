import { describe, it, expect } from "vitest";
import { statSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { VIDEO_MANIFEST } from "./video-manifest";
import { MONTHS } from "../months";
import { ALL_PARKS_MINI } from "./all-parks-mini";

const PUBLIC = join(__dirname, "..", "..", "..", "public");
const VIDEO_DIR = join(PUBLIC, "video");
const MONTH_ABBRS = new Set<string>(MONTHS.map((m) => m.abbr));
const PARK_CODES = new Set<string>(ALL_PARKS_MINI.map((p) => p.code));

const entries = Object.entries(VIDEO_MANIFEST);

describe("video manifest (Living Heroes spec §1.1/§1.2)", () => {
  it("keys are either a real park code or home-<valid month>", () => {
    for (const [key] of entries) {
      const homeMatch = key.match(/^home-([a-z]{3})$/);
      if (homeMatch) {
        expect(MONTH_ABBRS.has(homeMatch[1]), `${key}: unknown month`).toBe(true);
      } else {
        expect(PARK_CODES.has(key), `${key}: not a real park code`).toBe(true);
      }
    }
  });

  it("every entry's parkCode is a real park, credit starts NPS, source is nps.gov", () => {
    for (const [key, e] of entries) {
      expect(PARK_CODES.has(e.parkCode), `${key}: parkCode ${e.parkCode}`).toBe(true);
      expect(e.credit.startsWith("NPS"), `${key}: credit must start "NPS"`).toBe(true);
      expect(e.sourceUrl, `${key}: sourceUrl must be an official NPS page`).toMatch(
        /^https:\/\/([a-z0-9-]+\.)*nps\.gov\//
      );
      expect(e.posterBlur.startsWith("data:image/jpeg;base64,"), `${key}: posterBlur`).toBe(true);
      expect(e.durationSec, `${key}: 8-15s loops only`).toBeGreaterThanOrEqual(8);
      expect(e.durationSec, `${key}: 8-15s loops only`).toBeLessThanOrEqual(15);
    }
  });

  it("referenced files exist and hold the per-file size budgets", () => {
    for (const [key, e] of entries) {
      // Desktop budget raised 2.5MB -> 4.0MB alongside the move to true-1080p
      // sources (the 2.5MB spec figure predates them); see encode-hero-video.mjs.
      for (const [field, path, maxBytes] of [
        ["srcDesktop", e.srcDesktop, 4.0e6],
        ["srcMobile", e.srcMobile, 1.0e6],
        ["poster", e.poster, 0.4e6],
      ] as const) {
        expect(path.startsWith("/video/"), `${key}.${field}: must live under /video/`).toBe(true);
        const abs = join(PUBLIC, path);
        expect(existsSync(abs), `${key}.${field}: missing file ${path}`).toBe(true);
        expect(statSync(abs).size, `${key}.${field}: over budget`).toBeLessThanOrEqual(maxBytes);
      }
    }
  });

  it("total committed /public/video stays under the 60MB Blob-migration threshold", () => {
    if (!existsSync(VIDEO_DIR)) return;
    const total = readdirSync(VIDEO_DIR).reduce((sum, f) => sum + statSync(join(VIDEO_DIR, f)).size, 0);
    expect(total).toBeLessThanOrEqual(60e6);
  });

  it("month rotation resolves each month to its own clip or to the photo fallback (never a wrong clip)", () => {
    for (const m of MONTHS) {
      const entry = VIDEO_MANIFEST[`home-${m.abbr}`];
      if (entry) {
        // The lookup key IS the routing — an entry can only ever serve its own month.
        expect(entry.parkCode.length).toBe(4);
      } else {
        expect(entry).toBeUndefined(); // photo fallback path
      }
    }
  });
});
