#!/usr/bin/env node
/**
 * ETL: IRMA Unit Service v2 → src/lib/data/unit-crosswalk.json
 * (data-audit spec §4 P1.4, §5 practices)
 *
 * The canonical code→name→designation→region→states mapping that the
 * Stats/NPSpecies/acreage ETLs consume, so no other pipeline hand-maintains
 * a name table. Direct lookup per code for ALL 63 — deliberately NOT
 * /designations/NP, which returns 62 records, misses NERI entirely, and
 * uses IRMA subunit codes (DENG/GAAG/...) for the 7 park-and-preserve
 * combos (audit §3.1, refuted sub-claim).
 *
 * Keyless. Usage: node scripts/etl-unit-crosswalk.mjs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://irmaservices.nps.gov/Unit/v2/api";
const OUT = join(process.cwd(), "src", "lib", "data", "unit-crosswalk.json");

// The 63 park codes, single source of truth in the repo.
const mini = await import("../src/lib/data/all-parks-mini.ts").catch(() => null);
let codes;
if (mini?.ALL_PARKS_MINI) {
  codes = mini.ALL_PARKS_MINI.map((p) => p.code);
} else {
  // tsx not in the loader chain — parse the file textually (codes only).
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(join(process.cwd(), "src", "lib", "data", "all-parks-mini.ts"), "utf8");
  codes = [...src.matchAll(/code:\s*"([a-z]{4})"/g)].map((m) => m[1]);
}
if (codes.length !== 63) {
  console.error(`FATAL: expected 63 park codes from all-parks-mini.ts, got ${codes.length}`);
  process.exit(1);
}

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) return await res.json();
      if (res.status < 500) return null;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return null;
}

const rows = [];
const failures = [];
for (const code of codes) {
  const unit = await getJson(`${BASE}/${code.toUpperCase()}`);
  if (!unit || !(unit.FullName || unit[0]?.FullName)) {
    failures.push(code);
    continue;
  }
  const u = Array.isArray(unit) ? unit[0] : unit;
  // The 7 park-and-preserve combos expose subunits via /linked.
  const linked = (await getJson(`${BASE}/${code.toUpperCase()}/linked`)) ?? [];
  rows.push({
    parkCode: code,
    unitCode: u.UnitCode ?? code.toUpperCase(),
    fullName: u.FullName,
    designation: u.UnitDesignationCode ?? null, // NERI is legitimately null (tricky-park suite)
    designationName: u.UnitDesignationName ?? null,
    region: u.Region ?? null,
    states: u.StateCodes ?? null,
    linkedSubunits: Array.isArray(linked) ? linked.map((l) => l.UnitCode).filter(Boolean) : [],
  });
  await new Promise((r) => setTimeout(r, 120)); // polite pacing, keyless service
}

// ---- Validators (fail loudly, §5) ----
const errors = [];
if (failures.length) errors.push(`unresolved codes: ${failures.join(", ")}`);
if (rows.length !== 63) errors.push(`expected 63 rows, got ${rows.length}`);
const neri = rows.find((r) => r.parkCode === "neri");
if (neri && neri.designation !== null && neri.designation !== "")
  console.warn(`note: NERI designation is ${JSON.stringify(neri.designation)} — audit expected null; verify upstream change`);
for (const tricky of ["npsa", "gaar", "viis", "jeff", "seki", "kica", "neri"]) {
  if (!rows.find((r) => r.parkCode === tricky)) errors.push(`tricky park missing: ${tricky}`);
}
if (errors.length) {
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}

const snapshot = {
  _meta: {
    sourceUrl: `${BASE}/{unitCode}`,
    datasetVersion: "IRMA Unit Service v2",
    fetchedAt: new Date().toISOString(),
    script: "scripts/etl-unit-crosswalk.mjs",
    recordCount: rows.length,
  },
  units: Object.fromEntries(rows.map((r) => [r.parkCode, r])),
};
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`OK: ${rows.length} units → ${OUT}`);
console.log(`NERI designation: ${JSON.stringify(rows.find((r) => r.parkCode === "neri")?.designation)}`);
console.log(`sample: ${JSON.stringify(rows.find((r) => r.parkCode === "yell"))}`);
