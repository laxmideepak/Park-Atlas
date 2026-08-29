import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import statesTopology from "us-atlas/states-10m.json";

interface MinimalTopology {
  type: "Topology";
  objects: Record<string, { type: "GeometryCollection"; geometries: unknown[] }>;
  arcs: number[][][];
  transform?: { scale: [number, number]; translate: [number, number] };
}

/**
 * All map geometry is computed once, server-side, at module load — the
 * client only ever receives plain `d` path strings and [x,y] pin
 * coordinates. Zero d3-geo/topojson-client/us-atlas bytes reach the browser.
 */

export const US_MAP_WIDTH = 960;
export const US_MAP_HEIGHT = 600;

const topology = statesTopology as unknown as MinimalTopology;
const statesGeo = feature(
  topology as never,
  topology.objects.states as never
) as unknown as FeatureCollection<Geometry, { name: string }>;

const projection = geoAlbersUsa().fitSize([US_MAP_WIDTH, US_MAP_HEIGHT], statesGeo);
const path = geoPath(projection);

export interface StatePath {
  id: string;
  name: string;
  d: string;
}

export const US_STATE_PATHS: StatePath[] = statesGeo.features
  .map((f) => ({
    id: String(f.id ?? ""),
    name: f.properties?.name ?? "",
    d: path(f) ?? "",
  }))
  .filter((f) => f.d);

/** Returns null for territories outside AlbersUSA's defined regions (e.g. American Samoa, US Virgin Islands). */
export function projectLngLat(lng: number, lat: number): [number, number] | null {
  return projection([lng, lat]);
}
