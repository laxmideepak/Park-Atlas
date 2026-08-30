#!/usr/bin/env node
/**
 * ETL: NCEI Access Data Service, U.S. Monthly Climate Normals 1991-2020
 *      → src/lib/data/climate-normals.json
 * (data-audit spec §3.2, §4 P1.2, §5 practices)
 *
 * Consumes the reviewed station-to-park mapping (park-stations.json — built by
 * scripts/build-park-stations.mjs) and batch-fetches real monthly normals for
 * all 63 parks. Keyless; ≤2 requests total (comma-joined station ids —
 * 63-station batches verified in the audit). Replaces the hand-authored
 * 12-month climate arrays in park-month-scores.ts.
 *
 * Spec-verified gotchas handled here:
 *  - values are whitespace-padded strings ("    21.7") — TRIM before parseFloat;
 *  - missing values arrive as EMPTY STRINGS (or, in JSON, absent keys), NOT
 *    "0.00" — empty ≠ zero, so missing parses to null, never 0;
 *  - missing MLY-SNOW-NORMAL gets an explicit, deliberate rule: null in the
 *    output UNLESS the park's *station* latitude is < 25°N — the tropical
 *    rule — in which case 0 is imputed and the month is marked
 *    `snowImputed: true` (defensible for tropical stations, but never silent).
 *
 * Usage: node scripts/etl-climate-normals.mjs
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "src", "lib", "data");
const STATIONS_IN = join(DATA_DIR, "park-stations.json");
const OUT = join(DATA_DIR, "climate-normals.json");

const DATA_TYPES = [
  "MLY-TMAX-NORMAL",
  "MLY-TMIN-NORMAL",
  "MLY-TAVG-NORMAL",
  "MLY-PRCP-NORMAL",
  "MLY-SNOW-NORMAL",
];
const BASE =
  "https://www.ncei.noaa.gov/access/services/data/v1" +
  "?dataset=normals-monthly-1991-2020" +
  `&dataTypes=${DATA_TYPES.join(",")}` +
  "&format=json&units=standard&includeStationLocation=1";
const MAX_STATIONS_PER_REQUEST = 63; // batch size verified live in the audit
const TROPICAL_LAT = 25; // °N — stations south of this get the snow-imputation rule

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Parse one NCEI value. Whitespace-padded string → number; empty string,
 * whitespace-only string, or absent key → null. NEVER coerces missing to 0.
 * @returns {{ value: number|null, wasMissing: boolean }}
 */
function parseNceiValue(raw) {
  if (raw === undefined || raw === null) return { value: null, wasMissing: true };
  const trimmed = String(raw).trim();
  if (trimmed === "") return { value: null, wasMissing: true };
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n)) return { value: null, wasMissing: true };
  return { value: n, wasMissing: false };
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      console.error(`HTTP ${res.status} from ${url.slice(0, 120)}…`);
      if (res.status < 500) return null;
    } catch (e) {
      console.error(`fetch error (attempt ${attempt + 1}): ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return null;
}

const stationsSnapshot = JSON.parse(readFileSync(STATIONS_IN, "utf8"));
const parkRows = stationsSnapshot.stations;
if (!Array.isArray(parkRows) || parkRows.length !== 63) {
  console.error(`FATAL: park-stations.json must have 63 rows, got ${parkRows?.length}`);
  process.exit(1);
}

// One station can serve several parks; fetch each station once.
const stationIds = [...new Set(parkRows.map((r) => r.stationId))];
const batches = [];
for (let i = 0; i < stationIds.length; i += MAX_STATIONS_PER_REQUEST) {
  batches.push(stationIds.slice(i, i + MAX_STATIONS_PER_REQUEST));
}
if (batches.length > 2) {
  console.error(`FATAL: ${batches.length} batches — spec budget is ≤2 requests`);
  process.exit(1);
}

// stationId → month(1-12) → { raw record }
const byStation = new Map();
let latByStation = new Map();
for (const [i, batch] of batches.entries()) {
  const url = `${BASE}&stations=${batch.join(",")}`;
  console.log(`batch ${i + 1}/${batches.length}: ${batch.length} stations`);
  const records = await fetchJson(url);
  if (!Array.isArray(records)) {
    console.error("FATAL: batch fetch failed");
    process.exit(1);
  }
  for (const rec of records) {
    const id = rec.STATION;
    const month = parseInt(rec.DATE, 10);
    if (!id || !(month >= 1 && month <= 12)) continue;
    if (!byStation.has(id)) byStation.set(id, new Map());
    byStation.get(id).set(month, rec);
    const { value: lat } = parseNceiValue(rec.LATITUDE);
    if (lat !== null) latByStation.set(id, lat);
  }
}

// ---- Assemble per-park months ----
const parks = {};
let missingCount = 0; // empty-in-source values carried through as null
let imputedCount = 0; // tropical-rule snow imputations
for (const row of parkRows) {
  const stationMonths = byStation.get(row.stationId);
  const stationLat = latByStation.get(row.stationId);
  const months = {};
  for (let m = 1; m <= 12; m++) {
    const rec = stationMonths?.get(m) ?? {};
    const tmax = parseNceiValue(rec["MLY-TMAX-NORMAL"]);
    const tmin = parseNceiValue(rec["MLY-TMIN-NORMAL"]);
    const tavg = parseNceiValue(rec["MLY-TAVG-NORMAL"]);
    const prcp = parseNceiValue(rec["MLY-PRCP-NORMAL"]);
    const snow = parseNceiValue(rec["MLY-SNOW-NORMAL"]);
    missingCount += [tmax, tmin, tavg, prcp, snow].filter((v) => v.wasMissing).length;

    const entry = {
      tmaxF: tmax.value,
      tminF: tmin.value,
      tavgF: tavg.value,
      prcpIn: prcp.value,
      snowIn: snow.value, // null when missing — empty string is NOT zero
    };
    // The deliberate tropical rule: a missing SNOW normal at a station south of
    // 25°N is imputed as 0.0 in — and marked, so no null was silently zeroed.
    if (snow.wasMissing && stationLat !== undefined && stationLat < TROPICAL_LAT) {
      entry.snowIn = 0;
      entry.snowImputed = true;
      imputedCount++;
    }
    months[MONTH_KEYS[m - 1]] = entry;
  }
  parks[row.parkCode] = { stationId: row.stationId, months };
}

// ---- Validators (fail loudly, §5) ----
const errors = [];
const parkCodes = Object.keys(parks);
if (parkCodes.length !== 63) errors.push(`expected 63 parks, got ${parkCodes.length}`);

for (const [code, park] of Object.entries(parks)) {
  for (const mk of MONTH_KEYS) {
    const mo = park.months[mk];
    // 63 parks × 12 months of TMAX present.
    if (mo.tmaxF === null) {
      errors.push(`${code}/${mk}: TMAX missing`);
      continue;
    }
    // Physical bounds. DEVA is the sole tmax exception (hottest place on
    // earth — its summer normals legitimately exceed 110 °F, bounded at 130).
    const tmaxBound = code === "deva" ? 130 : 110;
    if (mo.tmaxF > tmaxBound) errors.push(`${code}/${mk}: tmaxF ${mo.tmaxF} > ${tmaxBound}`);
    if (mo.tavgF !== null && (mo.tavgF < -40 || mo.tavgF > 110))
      errors.push(`${code}/${mk}: tavgF ${mo.tavgF} out of [-40, 110]`);
    if (mo.tminF !== null && mo.tmaxF <= mo.tminF)
      errors.push(`${code}/${mk}: tmax ${mo.tmaxF} ≤ tmin ${mo.tminF}`);
    if (mo.prcpIn !== null && (mo.prcpIn < 0 || mo.prcpIn > 60))
      errors.push(`${code}/${mk}: prcpIn ${mo.prcpIn} out of [0, 60]`);
    // Empty-in-source stays null unless the imputation was explicit.
    if (mo.snowIn === 0 && mo.snowImputed !== true) {
      // 0.0 is a legitimate published normal (e.g. hot deserts) — only reject
      // zeros our own parser produced from a missing value.
      const rec = byStation.get(park.stationId)?.get(MONTH_KEYS.indexOf(mk) + 1) ?? {};
      const raw = rec["MLY-SNOW-NORMAL"];
      if (raw === undefined || String(raw).trim() === "")
        errors.push(`${code}/${mk}: missing SNOW became 0 without snowImputed`);
    }
  }
}

// Tricky-park gate: npsa (Pago Pago AP — the territory's only temp station)
// must be complete across all 12 months.
const npsa = parks.npsa;
if (!npsa) {
  errors.push("npsa missing entirely");
} else {
  for (const mk of MONTH_KEYS) {
    const mo = npsa.months[mk];
    if (mo.tmaxF === null || mo.tminF === null || mo.tavgF === null)
      errors.push(`npsa/${mk}: incomplete temperature normals`);
  }
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}

const snapshot = {
  _meta: {
    sourceUrl: `${BASE}&stations={IDS}`,
    datasetVersion: "normals-monthly-1991-2020 v1.0.1, doi:10.25921/wck8-er13",
    fetchedAt: new Date().toISOString(),
    script: "scripts/etl-climate-normals.mjs",
    recordCount: parkCodes.length,
  },
  parks,
};
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`OK: ${parkCodes.length} parks → ${OUT}`);
console.log(`missing-in-source values kept null: ${missingCount}; tropical snow imputations: ${imputedCount}`);
console.log(`deva jul: ${JSON.stringify(parks.deva.months.jul)}`);
console.log(`npsa jan tavg ${npsa.months.jan.tavgF} vs jul tavg ${npsa.months.jul.tavgF} (southern hemisphere: jan should be warmer)`);
