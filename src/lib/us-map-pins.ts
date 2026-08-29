import { ALL_PARKS_MINI } from "./data/all-parks-mini";
import { getParkAccent } from "@/lib/park-theme";
import { projectLngLat } from "./us-map-geo";
import { getWildlife, type Wildlife } from "./data/park-wildlife";
import { getTimezone } from "./live-context";
import { scoreForParkMonth } from "./repo";
import { MONTHS } from "./months";
import type { MonthAbbr, Tier } from "./types";

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
  tierByMonth: Record<MonthAbbr, Tier>;
}

/** Computed once server-side — the client only ever receives {x,y} pixel coordinates.
 * `tierByMonth` carries all 12 Month Fit tiers (63 pins x 12 tiny strings — negligible
 * payload) so the map's month scrubber can re-bucket pins instantly client-side;
 * `live` distinguishes the 4-park editorial cohort (full guide) from the 59 with a
 * live profile + Month Fit scoring only. */
export async function getMapPins(): Promise<MapPin[]> {
  const pins = await Promise.all(
    ALL_PARKS_MINI.map(async (p): Promise<MapPin | null> => {
      const xy = projectLngLat(p.lng, p.lat);
      if (!xy) return null;
      const timezone = await getTimezone(p.lat, p.lng);
      const tierByMonth = Object.fromEntries(
        MONTHS.map((m) => [m.abbr, scoreForParkMonth(p.code, m.abbr)?.tier ?? "Limited"])
      ) as Record<MonthAbbr, Tier>;
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
        tierByMonth,
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
