import { ALL_PARKS_MINI } from "./data/all-parks-mini";
import { getParkAccent } from "@/lib/park-theme";
import { projectLngLat } from "./us-map-geo";
import { getWildlife, type Wildlife } from "./data/park-wildlife";
import { getTimezone } from "./live-context";
import { scoreForParkMonth } from "./repo";
import { currentMonthAbbr } from "./months";
import type { Tier } from "./types";

export interface MapPin {
  code: string;
  name: string;
  state: string;
  x: number;
  y: number;
  live: boolean;
  href: string;
  accent: string;
  wildlife?: Wildlife;
  timezone: string | null;
  tier: Tier;
}

/** Computed once server-side — the client only ever receives {x,y} pixel coordinates.
 * `tier` is this month's Month Fit tier, used for the map's tier-encoded pins (§6.1.4);
 * `live` distinguishes the 4-park editorial cohort (full guide) from the 59 with a
 * live profile + Month Fit scoring only. */
export async function getMapPins(): Promise<MapPin[]> {
  const month = currentMonthAbbr();
  const pins = await Promise.all(
    ALL_PARKS_MINI.map(async (p): Promise<MapPin | null> => {
      const xy = projectLngLat(p.lng, p.lat);
      if (!xy) return null;
      const timezone = await getTimezone(p.lat, p.lng);
      const score = scoreForParkMonth(p.code, month);
      return {
        code: p.code,
        name: p.name,
        state: p.state,
        x: xy[0],
        y: xy[1],
        live: Boolean(p.cohort),
        href: `/parks/${p.code}`,
        accent: getParkAccent(p.code),
        wildlife: getWildlife(p.code),
        timezone,
        tier: score?.tier ?? "Limited",
      };
    })
  );
  return pins.filter((p): p is MapPin => p !== null);
}

/** Parks whose coordinates fall outside AlbersUSA's defined projection (territories) — still have real pages, just not pinned here. */
export function getOffMapParks(): { code: string; name: string; state: string }[] {
  return ALL_PARKS_MINI.filter((p) => !projectLngLat(p.lng, p.lat)).map((p) => ({
    code: p.code,
    name: p.name,
    state: p.state,
  }));
}
