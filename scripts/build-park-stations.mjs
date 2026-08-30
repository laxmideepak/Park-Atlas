#!/usr/bin/env node
/**
 * ETL: NCEI 1991-2020 Monthly Normals station inventory → src/lib/data/park-stations.json
 * (data-audit spec §3.2, §4 P1.2, §5 practices)
 *
 * The station-to-park mapping — "where the 144-ft bug class lives". For each of
 * the 63 parks: nearest inventory station by haversine, then VERIFY the station
 * actually carries temperature normals by reading the per-station CSV header
 * (the fixed-width inventory does NOT say which variables a station carries —
 * the "temp trap": a naive nearest join silently returns precip-only CoCoRaHS/
 * SNOTEL/VI stations for ~12 parks). Precip-only hits fall back to the nearest
 * station WITH temperature normals.
 *
 * Units rule (§5): inventory elevations are METERS. They are converted to feet
 * in exactly ONE place — the exported `metersToFeet()` below — and the snapshot
 * stores BOTH `elevationM` and `elevationFt` so the conversion is auditable.
 * The canonical regression: Acadia's station USC00170100 is at 143.3 m ≈ 470 ft,
 * NOT "144 ft" (audit #3 mislabeled the meters value as feet).
 *
 * Keyless. Usage: node scripts/build-park-stations.mjs
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const INVENTORY_URL =
  "https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/doc/inventory_30yr.txt";
const STATION_CSV = (id) =>
  `https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/${id}.csv`;
const OUT = join(process.cwd(), "src", "lib", "data", "park-stations.json");

/**
 * THE unit conversion. Meters → feet, defined once (spec §5 "converted once,
 * in one place"). Everything else — this script's snapshot, the normals ETL,
 * and the vitest m↔ft consistency suite — imports this function.
 * @param {number} m elevation in meters
 * @returns {number} elevation in feet
 */
export function metersToFeet(m) {
  return m / 0.3048;
}

/**
 * Great-circle distance in km between two lat/lng points (mean Earth radius).
 * @returns {number} distance in kilometers
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Manual override table (spec §4 P1.2). Documented, not inferred:
 *  - AK outliers: the nearest temperature-normals stations are far outside the
 *    park (NCEI's own metadata: applicability degrades with distance), so they
 *    are flagged lowConfidence. Audit-measured distances: kova ~156 km
 *    (Kotzebue), gaar ~123 km (Bettles AP — the park's southern edge; interior
 *    Brooks Range values are extrapolation), wrst ~71 km, lacl ~63 km.
 *  - npsa: Pago Pago AP is the ONLY temperature-normals station in the
 *    territory (~5 km from the Tutuila unit); Ta'u/Ofu ~100 km east have none.
 *  - viis: all four nearest St. John stations are precip-only; the fallback is
 *    Charlotte Amalie AP on St. Thomas (~25 km across water).
 * Additionally, any park whose station ends up > 50 km away is auto-flagged
 * lowConfidence (belt-and-suspenders for the same distance-degradation rule).
 */
const OVERRIDES = {
  kova: { lowConfidence: true, caveat: "Nearest temp-normals station ~156 km (Kotzebue) — Brooks Range interior is extrapolation" },
  gaar: { lowConfidence: true, caveat: "Bettles AP ~123 km, at the park's southern edge — interior Brooks Range values are extrapolation" },
  wrst: { lowConfidence: true, caveat: "Nearest temp-normals station ~71 km from park centroid" },
  lacl: { lowConfidence: true, caveat: "Nearest temp-normals station ~63 km from park centroid" },
  npsa: { caveat: "Tutuila unit only — Ta'u/Ofu have no normals station" },
  viis: { caveat: "Charlotte Amalie AP on St. Thomas (~25 km) — all four nearest St. John stations are precip-only" },
};
const LOW_CONFIDENCE_KM = 50;

// The 12 parks the audit found with precip/snow-only nearest stations, kept
// here only to REPORT drift between the spec and live data (not to steer the join).
const SPEC_PRECIP_ONLY = ["badl", "cong", "cuva", "gaar", "glac", "grba", "kova", "lacl", "olym", "romo", "viis", "wrst"];

/** Parse the GHCND-style fixed-width inventory (85-char lines). */
function parseInventory(text) {
  const stations = [];
  for (const line of text.split("\n")) {
    if (line.trim().length === 0) continue;
    const id = line.slice(0, 11).trim();
    const lat = parseFloat(line.slice(12, 20));
    const lon = parseFloat(line.slice(21, 30));
    const elevM = parseFloat(line.slice(31, 37));
    const name = line.slice(41, 71).trim();
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    stations.push({
      id,
      lat,
      lon,
      // GHCND missing-elevation sentinel is -999.9
      elevationM: Number.isFinite(elevM) && elevM > -999 ? elevM : null,
      name,
    });
  }
  return stations;
}

async function fetchText(url, { headers = {}, retries = 3 } = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      if (res.status < 500) return null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return null;
}

const tempCheckCache = new Map();
/**
 * Does this station's normals CSV carry temperature normals? Checked against
 * the per-station CSV *header* (Range request — first 4 KB): a header hit for
 * MLY-TAVG-NORMAL + MLY-TMAX-NORMAL is the audit's cheap precip-only detector.
 */
async function stationHasTemp(id) {
  if (tempCheckCache.has(id)) return tempCheckCache.get(id);
  const head = await fetchText(STATION_CSV(id), { headers: { Range: "bytes=0-4095" } });
  const header = head ? head.split("\n")[0] : "";
  const has = header.includes("MLY-TAVG-NORMAL") && header.includes("MLY-TMAX-NORMAL");
  tempCheckCache.set(id, has);
  await new Promise((r) => setTimeout(r, 60)); // polite pacing, keyless service
  return has;
}

async function loadParks() {
  // The 63 park centroids, single source of truth in the repo.
  const mini = await import("../src/lib/data/all-parks-mini.ts").catch(() => null);
  if (mini?.ALL_PARKS_MINI) {
    return mini.ALL_PARKS_MINI.map((p) => ({ code: p.code, lat: p.lat, lng: p.lng }));
  }
  // tsx not in the loader chain — parse the file textually.
  const src = readFileSync(join(process.cwd(), "src", "lib", "data", "all-parks-mini.ts"), "utf8");
  return [...src.matchAll(/code:\s*"([a-z]{4})".*?lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)/g)].map(
    (m) => ({ code: m[1], lat: parseFloat(m[2]), lng: parseFloat(m[3]) })
  );
}

async function main() {
  const parks = await loadParks();
  if (parks.length !== 63) {
    console.error(`FATAL: expected 63 parks from all-parks-mini.ts, got ${parks.length}`);
    process.exit(1);
  }

  console.log(`fetching inventory: ${INVENTORY_URL}`);
  const invText = await fetchText(INVENTORY_URL);
  if (!invText) {
    console.error("FATAL: could not fetch station inventory");
    process.exit(1);
  }
  const stations = parseInventory(invText);
  console.log(`inventory: ${stations.length} stations`);
  if (stations.length < 15000) {
    console.error(`FATAL: inventory suspiciously small (${stations.length} < 15000)`);
    process.exit(1);
  }

  const rows = [];
  const fallbackParks = []; // parks whose haversine-nearest station was precip-only
  for (const park of parks) {
    const byDistance = stations
      .map((s) => ({ ...s, distanceKm: haversineKm(park.lat, park.lng, s.lat, s.lon) }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Nearest → temp check → walk outward to nearest-with-temp (the fallback).
    let chosen = null;
    const CANDIDATE_CAP = 500;
    for (let i = 0; i < Math.min(CANDIDATE_CAP, byDistance.length); i++) {
      const cand = byDistance[i];
      if (await stationHasTemp(cand.id)) {
        chosen = cand;
        if (i > 0) fallbackParks.push(park.code);
        break;
      }
      if (i === 0) {
        console.log(`  ${park.code}: nearest ${cand.id} (${cand.name}, ${cand.distanceKm.toFixed(1)} km) has no temp normals — walking to nearest-with-TMAX`);
      }
    }
    if (!chosen) {
      console.error(`FATAL: no temperature-normals station within ${CANDIDATE_CAP} candidates of ${park.code}`);
      process.exit(1);
    }

    const distanceKm = Math.round(chosen.distanceKm * 10) / 10;
    const row = {
      parkCode: park.code,
      stationId: chosen.id,
      stationName: chosen.name,
      distanceKm,
      elevationM: chosen.elevationM,
      elevationFt:
        chosen.elevationM === null ? null : Math.round(metersToFeet(chosen.elevationM) * 10) / 10,
      hasTemp: true, // verified against the station CSV header above
    };
    const override = OVERRIDES[park.code];
    if (override?.lowConfidence || distanceKm > LOW_CONFIDENCE_KM) row.lowConfidence = true;
    if (override?.caveat) row.caveat = override.caveat;
    rows.push(row);
    console.log(
      `${park.code}: ${row.stationId} ${row.stationName} — ${row.distanceKm} km, ${row.elevationM} m / ${row.elevationFt} ft${row.lowConfidence ? " [lowConfidence]" : ""}`
    );
  }

  // ---- Validators (fail loudly, §5) ----
  const errors = [];
  if (rows.length !== 63) errors.push(`expected 63 rows, got ${rows.length}`);

  // Every station verified to carry MLY-TAVG-NORMAL (re-assert from the cache).
  for (const r of rows) {
    if (!r.hasTemp || tempCheckCache.get(r.stationId) !== true)
      errors.push(`${r.parkCode}: station ${r.stationId} not verified for MLY-TAVG-NORMAL`);
  }

  // The canonical 144-ft regression: Acadia's station elevation is ~470 FEET
  // because the source says 143.3 METERS. If the join picks USC00170100
  // (McFarland Hill, listed as "ACADIA NP"), assert the exact figures; if a
  // different station wins, print both and assert its own m↔ft consistency.
  const acad = rows.find((r) => r.parkCode === "acad");
  if (!acad) {
    errors.push("acad row missing");
  } else if (acad.stationId === "USC00170100") {
    if (Math.abs(acad.elevationM - 143.3) > 0.05)
      errors.push(`acad USC00170100 elevationM ${acad.elevationM}, expected 143.3`);
    if (Math.abs(acad.elevationFt - 470.1) > 1)
      errors.push(`acad USC00170100 elevationFt ${acad.elevationFt}, expected ≈470 (the 144-ft bug would say 143)`);
  } else {
    console.warn(
      `note: acad joined to ${acad.stationId} (${acad.stationName}), not the expected USC00170100 McFarland Hill — verify upstream change`
    );
  }

  // m↔ft self-consistency for every row (the conversion happened exactly once).
  for (const r of rows) {
    if (r.elevationM === null || r.elevationFt === null) {
      errors.push(`${r.parkCode}: station ${r.stationId} has no elevation in the inventory`);
    } else if (Math.abs(r.elevationFt - metersToFeet(r.elevationM)) > 1) {
      errors.push(`${r.parkCode}: elevationFt ${r.elevationFt} inconsistent with ${r.elevationM} m`);
    }
  }

  // Distance sanity gate: nothing far without an explicit low-confidence flag.
  for (const r of rows) {
    if (r.distanceKm > 200 && !r.lowConfidence)
      errors.push(`${r.parkCode}: ${r.distanceKm} km without lowConfidence`);
  }

  if (errors.length) {
    console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
    process.exit(1);
  }

  // Spec-drift report: which parks actually needed the nearest-with-TMAX fallback.
  const extra = fallbackParks.filter((p) => !SPEC_PRECIP_ONLY.includes(p));
  const missing = SPEC_PRECIP_ONLY.filter((p) => !fallbackParks.includes(p));
  console.log(`\nfallback (nearest was precip-only): ${fallbackParks.sort().join(", ") || "none"}`);
  if (extra.length) console.log(`  not in the audit's list of 12: ${extra.join(", ")}`);
  if (missing.length) console.log(`  in the audit's list of 12 but nearest now has temp: ${missing.join(", ")}`);
  if (!extra.length && !missing.length) console.log("  matches the audit's list of 12 exactly");

  const snapshot = {
    _meta: {
      sourceUrl: INVENTORY_URL,
      datasetVersion: "normals-monthly-1991-2020 v1.0.1, doi:10.25921/wck8-er13",
      fetchedAt: new Date().toISOString(),
      script: "scripts/build-park-stations.mjs",
      recordCount: rows.length,
    },
    stations: rows,
  };
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`\nOK: ${rows.length} park→station rows → ${OUT}`);
  console.log(`acad: ${JSON.stringify(rows.find((r) => r.parkCode === "acad"))}`);
}

// Import-safe: the vitest suite imports metersToFeet() from this module —
// only run the ETL when executed directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
