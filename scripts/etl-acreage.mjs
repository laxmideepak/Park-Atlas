#!/usr/bin/env node
/**
 * ETL: NPS Land Resources Division quarterly acreage report (LWCF xlsx)
 *      → src/lib/data/acreage.json
 * (data-audit spec §3.1 "NPS Land Resources Division quarterly acreage
 * report", §4 P1.3, §5 practices)
 *
 * Pipeline shape per §5: build-time probe script → committed JSON snapshot
 * with { sourceUrl, datasetVersion, fetchedAt, script, recordCount } _meta.
 *
 * Discovery: the xlsx filename pattern is inconsistent across quarters
 * ("NPS-Acreage-06-30-2026.xlsx", "NPSAcreage-09-30-2024.xlsx",
 * "NPS-Acreage-6-30-2023.xlsx", ...) so we NEVER construct a filename —
 * we scrape the index page and pick the newest quarter by the date embedded
 * in the filename. About half the index links are wrapped in
 * `javascript:HandleLink('...','...,<path>.xlsx')` — hrefs are extracted
 * from BOTH plain anchors and HandleLink arguments (audit §3.1 gotcha).
 *
 * Parsing: python3 STDLIB ONLY (zipfile + xml.etree.ElementTree over
 * xl/worksheets/sheet1.xml + xl/sharedStrings.xml), invoked via
 * child_process — no npm runtime or dev dependency added. The workbook has
 * 3 sheets; sheet1 "Listing of Acreage" holds the per-area rows (~447 incl.
 * headers). Known gotcha: the header labels for columns B/C read
 * "Region"/"State" but the DATA is swapped (B = state abbrev, C = region
 * number). We only consume A ("Area Name") and K ("Gross Area Acres" — the
 * headline figure per the audit).
 *
 * Keyless. Usage: node scripts/etl-acreage.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const INDEX_URL = "https://www.nps.gov/subjects/lwcf/acreagereports.htm";
const OUT = join(process.cwd(), "src", "lib", "data", "acreage.json");
const CROSSWALK = join(process.cwd(), "src", "lib", "data", "unit-crosswalk.json");

/**
 * Reference figures from the audit-verified 06-30-2026 file. If the newest
 * quarter IS this one, values must match within ±1 acre; if a NEWER quarter
 * has been published, boundaries do drift — allow ≤ 1% and print both.
 */
const REF = {
  quarter: "06-30-2026",
  yell: 2219790.71,
  npsa: 8256.67,
  viis: 15041.03,
};

/**
 * Name → parkCode mapping (hand-reviewed table, audit §4 P1.3 "explicit
 * data-engineering task"). The xlsx keys rows by ABBREVIATED Area Name, not
 * unit code. Every row below was cross-checked against
 * src/lib/data/unit-crosswalk.json fullName (IRMA Unit Service v2), and the
 * abbreviation traps hand-verified against the 06-30-2026 file:
 *   - "BLACK CANYON OF GUNNISON"  — no NP suffix at all, drops "THE"
 *   - "MT RAINIER NP"             — Mount → MT
 *   - "T ROOSEVELT NP"            — Theodore → T
 *   - "GREAT SMOKY MTS NP"        — Mountains → MTS (same for GUADALUPE)
 *   - "ROCKY MT NP"               — Mountain → MT
 *   - "NP OF AMERICAN SAMOA"      — designation leads the name
 *   - "VIRGIN ISLANDS NP"         — "VIRGIN ISLANDS CORAL REEF" is a
 *     SEPARATE unit (VICR); never substring-match VIIS.
 *   - seki/kica are separate rows ("SEQUOIA NP" / "KINGS CANYON NP").
 *
 * PARK+PRESERVE SUMMING POLICY (applied below): seven parks are split into
 * a park row and a preserve row — dena, glba, katm, lacl, wrst, grsa, gaar.
 * ParkAtlas represents the combined protected area, so we SUM park +
 * preserve Gross Area Acres and keep per-component figures in
 * `components`. Preserve-row spelling is inconsistent in the file:
 * DENA/GLBA/KATM/LACL use "N PRESERVE", WRST/GRSA/GAAR use "N PRES", and
 * GAAR's preserve row drops "THE" ("GATES OF ARCTIC N PRES" vs the park's
 * "GATES OF THE ARCTIC NP"). NERI is ONE combined "NEW RIVER GORGE NP &
 * PRES" row — no summing, single component.
 */
const NAME_MAP = {
  acad: ["ACADIA NP"],
  arch: ["ARCHES NP"],
  badl: ["BADLANDS NP"],
  bibe: ["BIG BEND NP"],
  bisc: ["BISCAYNE NP"],
  blca: ["BLACK CANYON OF GUNNISON"], // trap: no NP suffix, no "THE"
  brca: ["BRYCE CANYON NP"],
  cany: ["CANYONLANDS NP"],
  care: ["CAPITOL REEF NP"],
  cave: ["CARLSBAD CAVERNS NP"],
  chis: ["CHANNEL ISLANDS NP"],
  cong: ["CONGAREE NP"],
  crla: ["CRATER LAKE NP"],
  cuva: ["CUYAHOGA VALLEY NP"],
  dena: ["DENALI NP", "DENALI N PRESERVE"], // park + preserve
  deva: ["DEATH VALLEY NP"],
  drto: ["DRY TORTUGAS NP"],
  ever: ["EVERGLADES NP"],
  gaar: ["GATES OF THE ARCTIC NP", "GATES OF ARCTIC N PRES"], // preserve drops "THE"
  glac: ["GLACIER NP"],
  glba: ["GLACIER BAY NP", "GLACIER BAY N PRESERVE"], // park + preserve
  grba: ["GREAT BASIN NP"],
  grca: ["GRAND CANYON NP"],
  grsa: ["GREAT SAND DUNES NP", "GREAT SAND DUNES N PRES"], // park + preserve
  grsm: ["GREAT SMOKY MTS NP"], // trap: MTS
  grte: ["GRAND TETON NP"],
  gumo: ["GUADALUPE MTS NP"], // trap: MTS
  hale: ["HALEAKALA NP"],
  havo: ["HAWAII VOLCANOES NP"],
  hosp: ["HOT SPRINGS NP"],
  indu: ["INDIANA DUNES NP"],
  isro: ["ISLE ROYALE NP"],
  jeff: ["GATEWAY ARCH NP"],
  jotr: ["JOSHUA TREE NP"],
  katm: ["KATMAI NP", "KATMAI N PRESERVE"], // park + preserve
  kefj: ["KENAI FJORDS NP"],
  kica: ["KINGS CANYON NP"], // separate row from SEQUOIA NP
  kova: ["KOBUK VALLEY NP"],
  lacl: ["LAKE CLARK NP", "LAKE CLARK N PRESERVE"], // park + preserve
  lavo: ["LASSEN VOLCANIC NP"],
  maca: ["MAMMOTH CAVE NP"],
  meve: ["MESA VERDE NP"],
  mora: ["MT RAINIER NP"], // trap: MT
  neri: ["NEW RIVER GORGE NP & PRES"], // ONE combined row — no summing
  noca: ["NORTH CASCADES NP"],
  npsa: ["NP OF AMERICAN SAMOA"], // trap: designation leads
  olym: ["OLYMPIC NP"],
  pefo: ["PETRIFIED FOREST NP"],
  pinn: ["PINNACLES NP"],
  redw: ["REDWOOD NP"],
  romo: ["ROCKY MT NP"], // trap: MT
  sagu: ["SAGUARO NP"],
  seki: ["SEQUOIA NP"],
  shen: ["SHENANDOAH NP"],
  thro: ["T ROOSEVELT NP"], // trap: T
  viis: ["VIRGIN ISLANDS NP"], // NOT "VIRGIN ISLANDS CORAL REEF"
  voya: ["VOYAGEURS NP"],
  whsa: ["WHITE SANDS NP"],
  wica: ["WIND CAVE NP"],
  wrst: ["WRANGELL-ST ELIAS NP", "WRANGELL-ST ELIAS N PRES"], // park + preserve
  yell: ["YELLOWSTONE NP"],
  yose: ["YOSEMITE NP"],
  zion: ["ZION NP"],
};

const SUMMED_PARKS = ["dena", "glba", "katm", "lacl", "wrst", "grsa", "gaar"];

/** \bNP\b rows in the listing that are legitimately NOT one of the 63. */
const KNOWN_NON_63_NP_ROWS = new Set([
  "WOLF TRAP NP FOR PERF ARTS", // performing-arts park, distinct designation
]);

// ---------------------------------------------------------------------------
// 1. Discover the newest xlsx from the index page.
// ---------------------------------------------------------------------------
async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "ParkAtlas-ETL" } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.text();
}

function extractXlsxHrefs(html) {
  const hrefs = new Set();
  // Plain anchors: href="/subjects/lwcf/upload/....xlsx"
  for (const m of html.matchAll(/href="([^"]+\.xlsx)"/gi)) {
    if (!/^javascript:/i.test(m[1])) hrefs.add(m[1]);
  }
  // HandleLink wrappers: HandleLink('cpe_0_0','CPNEWWIN:..,<path>.xlsx')
  for (const m of html.matchAll(/HandleLink\('[^']*'\s*,\s*'([^']*)'\)/gi)) {
    const path = m[1].match(/\/[^',]*\.xlsx/i);
    if (path) hrefs.add(path[0]);
  }
  return [...hrefs];
}

/** Filename dates vary in padding ("6-30-2023", "06-30-2026") — normalize. */
function quarterOf(href) {
  const m = href.match(/(\d{1,2})-(\d{1,2})-(\d{4})\.xlsx$/i);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return {
    key: `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`, // sortable
    label: `${mm.padStart(2, "0")}-${dd.padStart(2, "0")}-${yyyy}`,
  };
}

const html = await fetchText(INDEX_URL);
const candidates = extractXlsxHrefs(html)
  .map((href) => ({ href, q: quarterOf(href) }))
  .filter((c) => c.q);
if (candidates.length < 10) {
  console.error(`FATAL: only ${candidates.length} dated xlsx links found on ${INDEX_URL} — page layout changed?`);
  process.exit(1);
}
candidates.sort((a, b) => (a.q.key < b.q.key ? 1 : -1));
const newest = candidates[0];
const sourceUrl = new URL(newest.href, INDEX_URL).href;
const quarter = newest.q.label;
console.log(`newest quarter: ${quarter} (${candidates.length} dated links scanned)`);
console.log(`source: ${sourceUrl}`);

// ---------------------------------------------------------------------------
// 2. Download + parse via python3 stdlib helper (no npm dependency).
// ---------------------------------------------------------------------------
const xlsxRes = await fetch(sourceUrl, { headers: { "User-Agent": "ParkAtlas-ETL" } });
if (!xlsxRes.ok) {
  console.error(`FATAL: GET ${sourceUrl} → HTTP ${xlsxRes.status}`);
  process.exit(1);
}
const tmpDir = mkdtempSync(join(tmpdir(), "parkatlas-acreage-"));
const xlsxPath = join(tmpDir, "acreage.xlsx");
writeFileSync(xlsxPath, Buffer.from(await xlsxRes.arrayBuffer()));

// Stdlib-only: zipfile + ElementTree over sheet1 ("Listing of Acreage") and
// sharedStrings. Emits JSON rows [{name, gross}] for every data row whose
// Area Name (A) is a string and Gross Area Acres (K) parses as a number
// (this skips the title and header rows).
const PY_HELPER = `
import json, re, sys, zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"

z = zipfile.ZipFile(sys.argv[1])
shared = [
    "".join(t.text or "" for t in si.iter(T))
    for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS)
]
rows = []
root = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
for row in root.findall(".//m:sheetData/m:row", NS):
    cells = {}
    for c in row.findall("m:c", NS):
        col = re.match(r"([A-Z]+)", c.get("r")).group(1)
        v = c.find("m:v", NS)
        if v is None:
            continue
        cells[col] = shared[int(v.text)] if c.get("t") == "s" else v.text
    name, gross = cells.get("A"), cells.get("K")
    if not name or gross is None:
        continue
    try:
        gross = float(gross)
    except ValueError:
        continue  # header row: K == "Gross Area Acres"
    rows.append({"name": name.strip(), "gross": gross})
json.dump(rows, sys.stdout)
`;

let rows;
try {
  rows = JSON.parse(
    execFileSync("python3", ["-c", PY_HELPER, xlsxPath], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }),
  );
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
console.log(`parsed ${rows.length} data rows from "Listing of Acreage"`);

// ---------------------------------------------------------------------------
// 3. Resolve names → parkCodes, applying the summing policy.
// ---------------------------------------------------------------------------
const round2 = (n) => Math.round(n * 100) / 100;
const byName = new Map(rows.map((r) => [r.name, r]));
if (byName.size !== rows.length) {
  console.error("FATAL: duplicate Area Names in the listing — mapping is no longer unambiguous");
  process.exit(1);
}

const crosswalk = JSON.parse(readFileSync(CROSSWALK, "utf8"));
const codes = Object.keys(crosswalk.units);

const errors = [];
if (codes.length !== 63) errors.push(`unit-crosswalk.json has ${codes.length} parks, expected 63`);

const parks = {};
const consumed = new Set();
for (const code of codes) {
  const names = NAME_MAP[code];
  if (!names) {
    errors.push(`no NAME_MAP entry for park code "${code}"`);
    continue;
  }
  const components = [];
  for (const name of names) {
    const row = byName.get(name);
    if (!row) {
      errors.push(`row not found for ${code}: "${name}"`);
      continue;
    }
    consumed.add(name);
    components.push({ name, grossAcres: round2(row.gross) });
  }
  if (components.length !== names.length) continue;
  parks[code] = {
    grossAcres: round2(components.reduce((s, c) => s + c.grossAcres, 0)),
    areaName: names[0],
    ...(components.length > 1 || code === "neri" ? { components } : {}),
  };
}

// ---------------------------------------------------------------------------
// 4. Validators (§5: fail the build on violation). Exit 1 on any error.
// ---------------------------------------------------------------------------
// 4a. All 63 resolved; zero unmatched NP-designation rows. Print near-misses.
if (Object.keys(parks).length !== 63) errors.push(`resolved ${Object.keys(parks).length}/63 parks`);
const nearMisses = rows
  .map((r) => r.name)
  .filter((n) => /\bNP\b/.test(n) && !consumed.has(n) && !KNOWN_NON_63_NP_ROWS.has(n));
if (nearMisses.length) errors.push(`unmatched NP-designation rows (near-misses): ${nearMisses.join(" | ")}`);

// 4b. Reference figures. Exact quarter → ±1 acre; newer quarter → ≤1% drift.
const isRefQuarter = quarter === REF.quarter;
for (const [code, ref] of [["yell", REF.yell], ["npsa", REF.npsa], ["viis", REF.viis]]) {
  const got = parks[code]?.grossAcres;
  if (got == null) continue; // already reported above
  if (isRefQuarter) {
    if (Math.abs(got - ref) > 1) errors.push(`${code}: ${got} differs from verified ${ref} by > 1 acre`);
  } else {
    const drift = Math.abs(got - ref) / ref;
    console.log(`${code}: newer quarter ${quarter} — got ${got} vs ${REF.quarter} reference ${ref} (drift ${(drift * 100).toFixed(3)}%)`);
    if (drift > 0.01) errors.push(`${code}: ${got} drifts > 1% from ${REF.quarter} reference ${ref}`);
  }
}

// 4c. GAAR park+preserve total.
if (parks.gaar && parks.gaar.grossAcres <= 7_500_000)
  errors.push(`gaar park+preserve total ${parks.gaar.grossAcres} ≤ 7.5M acres`);

// 4d. VIIS must be the national park, never the coral-reef unit's figure.
const coralReef = byName.get("VIRGIN ISLANDS CORAL REEF");
if (consumed.has("VIRGIN ISLANDS CORAL REEF")) errors.push("VIRGIN ISLANDS CORAL REEF row was consumed by the map");
if (parks.viis && coralReef && Math.abs(parks.viis.grossAcres - round2(coralReef.gross)) < 1)
  errors.push(`viis gross ${parks.viis.grossAcres} equals the coral-reef unit's figure — wrong row matched`);

// 4e. The 7 summed parks each have exactly 2 components; NERI exactly 1.
for (const code of SUMMED_PARKS) {
  if (parks[code] && parks[code].components?.length !== 2)
    errors.push(`${code}: expected 2 components (park + preserve), got ${parks[code].components?.length ?? 0}`);
}
if (parks.neri && parks.neri.components?.length !== 1)
  errors.push(`neri: expected 1 combined component, got ${parks.neri.components?.length ?? 0}`);

// 4f. Acreage positive everywhere; crosswalk designation sanity.
for (const [code, p] of Object.entries(parks)) {
  if (!(p.grossAcres > 0)) errors.push(`${code}: non-positive grossAcres ${p.grossAcres}`);
  for (const c of p.components ?? []) {
    if (!(c.grossAcres > 0)) errors.push(`${code}/${c.name}: non-positive grossAcres ${c.grossAcres}`);
  }
  const desig = crosswalk.units[code]?.designation;
  if (desig !== "NP" && desig !== null)
    errors.push(`${code}: crosswalk designation ${JSON.stringify(desig)} — expected "NP" (or null for NERI)`);
}

if (errors.length) {
  console.error("VALIDATION FAILED:\n - " + errors.join("\n - "));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 5. Write the snapshot.
// ---------------------------------------------------------------------------
const snapshot = {
  _meta: {
    sourceUrl,
    datasetVersion: `NPS Acreage ${quarter}`,
    fetchedAt: new Date().toISOString(),
    script: "scripts/etl-acreage.mjs",
    recordCount: Object.keys(parks).length,
  },
  parks: Object.fromEntries(Object.keys(parks).sort().map((c) => [c, parks[c]])),
};
writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`OK: ${snapshot._meta.recordCount} parks → ${OUT}`);
console.log(`YELL ${parks.yell.grossAcres} | GAAR ${parks.gaar.grossAcres} (park+pres) | NPSA ${parks.npsa.grossAcres} | VIIS ${parks.viis.grossAcres}`);
