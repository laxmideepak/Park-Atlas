import type { Tier } from "./types";

/**
 * The map's 3 human-readable buckets — Month Fit tiers are jargon at map scale.
 *
 * Deliberately a standalone, dependency-free module (its one import is
 * type-only, so it compiles to zero runtime imports): the "use client"
 * `UsMap` needs `tierToBucket` for the month scrubber, and importing it from
 * `us-map-pins` would drag that module's entire server graph — d3-geo +
 * us-atlas topojson, the all-parks directory, Month Fit scoring data — into
 * the home page's client bundle (~+150 KB measured). Keep this file free of
 * value imports.
 */
export type MapBucket = "great" | "good" | "off";

export function tierToBucket(tier: Tier): MapBucket {
  if (tier === "Exceptional" || tier === "Excellent") return "great";
  if (tier === "Good") return "good";
  return "off"; // Specialized | Limited
}
