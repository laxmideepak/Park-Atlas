#!/usr/bin/env node
/**
 * ETL: IRMA Stats v1 visitation → src/lib/data/visitation.json
 * (data-audit spec §3.1 "NPS Visitor Use Statistics REST API", §4 P1.1, §5 practices)
 *
 * Keyless, build-time. One GET with all 63 unit codes (comma-joined) for
 * CY2021–2025, JSON via Accept header (the API defaults to XML).
 *
 * Code mapping: unit codes come from the committed crosswalk
 * (src/lib/data/unit-crosswalk.json), uppercased, with ONE exception:
 * Stats returns [] for SEKI — it splits Sequoia & Kings Canyon into
 * SEQU + KICA. ParkAtlas carries both `seki` and `kica` as parks, so the
 * `seki` park maps to SEQU stats and `kica` maps to KICA stats.
 *
 * Per park we emit:
 *  - years:              [2021..2025] annual RecreationVisitors sums
 *  - medianAnnualVisits: median of those 5 annual sums
 *  - monthlyShares:      mean percent-of-annual per calendar month across
 *                        the 5 years, then NORMALIZED and rounded to 1 dp.
 *
 * Normalization (documented per spec): the raw mean-of-percent shares sum
 * to 100 only up to floating point (validated at ±0.5 before touching
 * them). We rescale by 100/sum, then round to 1 decimal with the
 * largest-remainder method so the 12 rounded values sum to EXACTLY 100.0
 * (floor each value at 0.1 granularity, then distribute the leftover
 * 0.1-increments to the months with the largest fractional remainders).
 * True zeros (GAAR reports real 0 visitors Oct–Apr — summer-only
 * reporting; that is DATA, not a gap) have zero remainder, so they can
 * never be bumped and always flow through as exact 0.0 shares.
 *
 * Usage: node scripts/etl-visitation.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const START_YEAR = 2021;
const END_YEAR = 2025;
const YEARS = [2021, 2022, 2023, 2024, 2025];
const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const OUT = join(process.cwd(), "src", "lib", "data", "visitation.json");
const CROSSWALK = join(process.cwd(), "src", "lib", "data", "unit-crosswalk.json");

// Parks allowed to report a 0 annual total for some year. None known for
// CY2021–2025 — GAAR's winter zeros are monthly, its annual totals are
// positive. Add a parkCode here (with a comment citing the source) only
// after verifying the zero is real upstream.
const DOCUMENTED_ZERO_ANNUALS = new Set([]);

// Spec acceptance figure (audit item #2): DEVA CY2025 recreation visitors.
const DEVA_2025_EXPECTED = 1_320_134;

// ---- 1. Unit codes from the committed crosswalk ----
const crosswalk = JSON.parse(readFileSync(CROSSWALK, "utf8"));
const parks = Object.values(crosswalk.units);
if (parks.length !== 63) {
  console.error(`FATAL: expected 63 parks in unit-crosswalk.json, got ${parks.length}`);
  process.exit(1);
}
// parkCode → Stats unit code. Sole override: seki→SEQU (Stats returns []
// for SEKI; SEQU and KICA are separate units there — inverse of NPSpecies).
const statsCodeByPark = Object.fromEntries(
  parks.map((p) => [p.parkCode, p.parkCode === "seki" ? "SEQU" : p.unitCode.toUpperCase()])
);
const parkByStatsCode = Object.fromEntries(Object.entries(statsCodeByPark).map(([p, c]) => [c, p]));
if (Object.keys(parkByStatsCode).length !== 63) {
  console.error("FATAL: stats unit codes are not unique across the 63 parks");
  process.exit(1);
}

// ---- 2. One request, all 63 codes, with retry/backoff ----
const codes = Object.values(statsCodeByPark).sort().join(",");
const url =
  `https://irmaservices.nps.gov/Stats/v1/visitation?unitCodes=${codes}` +
  `&startMonth=1&startYear=${START_YEAR}&endMonth=12&endYear=${END_YEAR}`;

async function fetchAll() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body)) return body;
        console.error(`attempt ${attempt}: non-array JSON body`);
      } else {
        console.error(`attempt ${attempt}: HTTP ${res.status}`);
        if (res.status >= 400 && res.status < 500) break; // no point retrying a 4xx
      }
    } catch (err) {
      console.error(`attempt ${attempt}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
  }
  return null;
}

const records = await fetchAll();
if (!records) {
  console.error("FATAL: IRMA Stats request failed after retries");
  process.exit(1);
}
console.log(`fetched ${records.length} monthly records (expect ${63 * 12 * YEARS.length})`);

// ---- 3. Group: park → year → month → RecreationVisitors ----
const byPark = {}; // parkCode → { [year]: number[12] }
const unknownUnits = new Set();
for (const rec of records) {
  const parkCode = parkByStatsCode[rec.UnitCode];
  if (!parkCode) {
    unknownUnits.add(rec.UnitCode);
    continue;
  }
  if (!Number.isInteger(rec.Year) || !Number.isInteger(rec.Month) || rec.Month < 1 || rec.Month > 12) continue;
  ((byPark[parkCode] ??= {})[rec.Year] ??= new Array(12).fill(null))[rec.Month - 1] = rec.RecreationVisitors;
}

// ---- 4. Compute medians + monthly shares ----
const median5 = (arr) => [...arr].sort((a, b) => a - b)[2];

/** Largest-remainder rounding to 1 dp; result sums to exactly 100.0. */
function roundSharesTo1dp(shares) {
  const scaled = shares.map((s) => s * 10);
  const floors = scaled.map((v) => Math.floor(v + 1e-9)); // fp guard: 25.999999996 is a true 26.0
  const deficit = 1000 - floors.reduce((a, b) => a + b, 0);
  if (deficit < 0 || deficit > 12) throw new Error(`largest-remainder deficit out of range: ${deficit}`);
  const order = scaled
    .map((v, i) => ({ i, r: v - floors[i] }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  const out = [...floors];
  for (let k = 0; k < deficit; k++) {
    if (order[k].r <= 1e-9) throw new Error("largest-remainder would bump a true-zero/exact month");
    out[order[k].i] += 1;
  }
  return out.map((v) => v / 10);
}

const errors = [];
const outParks = {};
for (const p of parks) {
  const code = p.parkCode;
  const perYear = byPark[code];
  if (!perYear) {
    errors.push(`${code}: no records at all`);
    continue;
  }
  const annuals = [];
  const shareYears = []; // per usable year: number[12] percent-of-annual
  for (const y of YEARS) {
    const months = perYear[y];
    const missing = !months ? 12 : months.filter((v) => v == null).length;
    if (missing > 0) {
      errors.push(`${code} ${y}: ${missing} missing monthly records`);
      continue;
    }
    const annual = months.reduce((a, b) => a + b, 0);
    annuals.push(annual);
    if (annual > 0) {
      shareYears.push(months.map((v) => (v / annual) * 100));
    } else if (!DOCUMENTED_ZERO_ANNUALS.has(code)) {
      errors.push(`${code} ${y}: annual total is 0 (undocumented)`);
    }
  }
  if (annuals.length !== 5 || shareYears.length === 0) continue;

  // Mean percent-of-annual per calendar month across the usable years.
  const rawShares = MONTH_KEYS.map((_, m) => shareYears.reduce((a, ys) => a + ys[m], 0) / shareYears.length);
  const preSum = rawShares.reduce((a, b) => a + b, 0);
  if (Math.abs(preSum - 100) > 0.5) {
    errors.push(`${code}: pre-normalization shares sum ${preSum.toFixed(4)} (outside 100 ± 0.5)`);
    continue;
  }
  const normalized = rawShares.map((s) => (s * 100) / preSum);
  const postSum = normalized.reduce((a, b) => a + b, 0);
  if (Math.abs(postSum - 100) > 0.01) {
    errors.push(`${code}: post-normalization shares sum ${postSum} (outside 100 ± 0.01)`);
    continue;
  }
  const rounded = roundSharesTo1dp(normalized);

  outParks[code] = {
    medianAnnualVisits: median5(annuals),
    monthlyShares: Object.fromEntries(MONTH_KEYS.map((k, i) => [k, rounded[i]])),
    years: annuals,
  };
}

// ---- 5. Validators (§5: fail the build on violation) ----
if (unknownUnits.size) errors.push(`records for unknown unit codes: ${[...unknownUnits].join(", ")}`);
if (Object.keys(outParks).length !== 63)
  errors.push(`expected 63 parks in output, got ${Object.keys(outParks).length}`);
for (const [code, park] of Object.entries(outParks)) {
  const shares = Object.values(park.monthlyShares);
  if (shares.length !== 12) errors.push(`${code}: ${shares.length} monthly shares (want 12)`);
  const sum = shares.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.01) errors.push(`${code}: rounded shares sum ${sum}, not 100`);
}

// Tricky-park regression suite (§5).
const gaar = outParks.gaar;
if (!gaar) {
  errors.push("gaar missing");
} else {
  const zeroMonths = Object.values(gaar.monthlyShares).filter((s) => s === 0).length;
  if (zeroMonths < 5) errors.push(`gaar: only ${zeroMonths} zero-share months (true winter zeros expected ≥5)`);
  for (const m of ["jun", "jul", "aug"]) {
    if (!(gaar.monthlyShares[m] > 0)) errors.push(`gaar: ${m} share is ${gaar.monthlyShares[m]}, expected > 0`);
  }
}
const seki = outParks.seki;
const kica = outParks.kica;
if (!seki || !kica) {
  errors.push("seki/kica: both must be present (SEQU and KICA are separate Stats units)");
} else if (JSON.stringify(seki.years) === JSON.stringify(kica.years)) {
  errors.push("seki and kica carry identical data — the SEQU/KICA split did not happen");
}

// Spec acceptance figure: DEVA CY2025 annual recreation visitors.
const deva2025 = outParks.deva?.years[YEARS.indexOf(2025)];
let devaMismatch = false;
if (deva2025 !== DEVA_2025_EXPECTED) {
  devaMismatch = true;
  console.error("");
  console.error("=".repeat(72));
  console.error(`DEVA 2025 MISMATCH: the API returned ${deva2025?.toLocaleString("en-US")} recreation`);
  console.error(`visitors; the spec's acceptance figure is ${DEVA_2025_EXPECTED.toLocaleString("en-US")}.`);
  console.error("The REAL API number above is authoritative — the snapshot is still");
  console.error("written so the discrepancy can be inspected, but this run exits 1.");
  console.error("=".repeat(72));
  console.error("");
}

// ---- 6. Write the snapshot ----
const snapshot = {
  _meta: {
    sourceUrl: url,
    datasetVersion: `IRMA Stats v1, CY${START_YEAR}-${END_YEAR}`,
    fetchedAt: new Date().toISOString(),
    script: "scripts/etl-visitation.mjs",
    recordCount: Object.keys(outParks).length,
    notes:
      "monthlyShares = mean percent-of-annual RecreationVisitors per calendar month across the 5 years, " +
      "rescaled by 100/sum then rounded to 1 dp via largest-remainder so each park sums to exactly 100.0. " +
      "seki→SEQU, kica→KICA (Stats has no SEKI unit). GAAR Oct–Apr zeros are real reported zeros.",
  },
  parks: Object.fromEntries(parks.map((p) => [p.parkCode, outParks[p.parkCode]]).filter(([, v]) => v)),
};

if (errors.length && !devaMismatch) {
  // Hard validation failures: do not write a broken snapshot.
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`wrote ${Object.keys(snapshot.parks).length} parks → ${OUT}`);
console.log(`DEVA 2025 annual: ${deva2025?.toLocaleString("en-US")} · 5-yr median: ${outParks.deva?.medianAnnualVisits?.toLocaleString("en-US")}`);
console.log(`GAAR shares: ${JSON.stringify(gaar?.monthlyShares)}`);
if (errors.length || devaMismatch) {
  if (errors.length) console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log("OK: all validators passed");
