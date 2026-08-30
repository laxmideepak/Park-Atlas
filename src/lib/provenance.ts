/**
 * Provenance-derived source labels (data-audit spec §5).
 *
 * The governing rule: a source label describes an implemented pipeline or it
 * says "planned". These labels are built FROM the committed dataset
 * snapshots' _meta headers via static imports — if a snapshot file doesn't
 * exist, the import fails and the build breaks, so an attribution is
 * structurally impossible to render without its dataset. Never hand-write a
 * source string in a component again; import it from here.
 */
import visitation from "./data/visitation.json";
import normals from "./data/climate-normals.json";
import acreage from "./data/acreage.json";
import stations from "./data/park-stations.json";
import crosswalk from "./data/unit-crosswalk.json";

function assertMeta(name: string, meta: { sourceUrl?: string; fetchedAt?: string; recordCount?: number }) {
  if (!meta?.sourceUrl || !meta?.fetchedAt || meta?.recordCount !== 63) {
    throw new Error(`provenance: ${name} snapshot has an invalid _meta header — refusing to derive labels from it`);
  }
}
assertMeta("visitation", visitation._meta);
assertMeta("climate-normals", normals._meta);
assertMeta("acreage", acreage._meta);
assertMeta("park-stations", { ...stations._meta, recordCount: stations.stations.length });
assertMeta("unit-crosswalk", crosswalk._meta);

const visitationYears = (() => {
  const years = Object.values(visitation.parks)[0]?.years?.length ?? 5;
  const match = visitation._meta.datasetVersion.match(/CY(\d{4})-(\d{4})/);
  return match ? `${match[1]}–${match[2]}` : `${years}-yr`;
})();

/** True for all 63 since the C3 ETL: real IRMA monthly shares + 5-yr medians. */
export const VISITATION_SOURCE_LABEL = `5-yr medians (${visitationYears}) · NPS IRMA Stats`;

/** Real NOAA station metadata exists for all 63 (C4a/C4b) and is displayed;
 * the 0-100 suitability CURVE is still hand-authored/estimated — the label
 * says both truths. Restoring a bare "NOAA Normals" attribution for the
 * score itself requires deriving climateScore from the normals, which is a
 * separately-reviewed change (it moves every Fit score on the site). */
const STATION_BY_PARK = new Map(stations.stations.map((s) => [s.parkCode, s]));

export function climateSourceLabel(parkCode: string): string {
  const s = STATION_BY_PARK.get(parkCode);
  if (!s) return "Regional estimate — no station identified yet";
  const dist = ` · ${Math.round(s.distanceKm)} km from park`;
  const conf = s.lowConfidence ? " · low confidence (distant station)" : "";
  return `NOAA 1991–2020 Normals on file · ${s.stationName} (${Math.round(s.elevationFt)} ft${dist}${conf}) · suitability curve hand-authored`;
}

export const ACREAGE_SOURCE_LABEL = `NPS Land Resources · ${acreage._meta.datasetVersion}`;

/** Footer sources column — every line derived from a snapshot that exists. */
export const FOOTER_SOURCE_LINES = [
  "NPS IRMA Stats (visitation)",
  `NPS Land Resources (acreage, ${acreage._meta.datasetVersion.replace("NPS Acreage ", "")})`,
  `NOAA 1991–2020 Normals (${stations.stations.length} stations on file)`,
] as const;

export function parkVisitation(parkCode: string) {
  return visitation.parks[parkCode as keyof typeof visitation.parks] ?? null;
}
export function parkAcreage(parkCode: string) {
  return acreage.parks[parkCode as keyof typeof acreage.parks] ?? null;
}
export function parkStation(parkCode: string) {
  return STATION_BY_PARK.get(parkCode) ?? null;
}
