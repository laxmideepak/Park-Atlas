#!/usr/bin/env node
/**
 * Build gate (data-audit spec §5): re-validates every committed dataset
 * snapshot BEFORE next build runs. No network — this checks the files the
 * app will actually import, so a bad snapshot can never ship. Wired as the
 * first step of `npm run build`.
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DATA = (f) => JSON.parse(readFileSync(join(process.cwd(), "src", "lib", "data", f), "utf8"));
const errors = [];
const ok = (label) => console.log(`  ✓ ${label}`);

function meta(name, m, expectCount = 63) {
  if (!m?.sourceUrl || !m?.fetchedAt || !m?.script) errors.push(`${name}: incomplete _meta header`);
  if (expectCount !== null && m?.recordCount !== expectCount) errors.push(`${name}: recordCount ${m?.recordCount} !== ${expectCount}`);
}

// --- unit crosswalk ---
const cw = DATA("unit-crosswalk.json");
meta("unit-crosswalk", cw._meta);
if (Object.keys(cw.units).length !== 63) errors.push("crosswalk: != 63 units");
if (cw.units.neri?.designation !== null) errors.push("crosswalk: NERI designation expected null (tricky suite)");
ok("unit-crosswalk: 63 units, NERI null designation");

// --- visitation ---
const vis = DATA("visitation.json");
meta("visitation", vis._meta);
const vParks = Object.entries(vis.parks);
if (vParks.length !== 63) errors.push("visitation: != 63 parks");
for (const [code, p] of vParks) {
  const sum = Object.values(p.monthlyShares).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 0.5) errors.push(`visitation ${code}: shares sum ${sum.toFixed(2)}`);
  if (Object.keys(p.monthlyShares).length !== 12) errors.push(`visitation ${code}: != 12 months`);
}
const gaarZeros = Object.values(vis.parks.gaar.monthlyShares).filter((x) => x === 0).length;
if (gaarZeros < 5) errors.push(`visitation: GAAR winter zeros are data — expected >=5, got ${gaarZeros}`);
if (vis.parks.deva.years?.[4] !== 1320134) errors.push(`visitation: DEVA 2025 annual !== 1,320,134 (got ${vis.parks.deva.years?.[4]})`);
ok(`visitation: 63 parks, shares sum 100, GAAR ${gaarZeros} true-zero months, DEVA 2025 = 1,320,134`);

// --- park stations + normals ---
const st = DATA("park-stations.json");
meta("park-stations", { ...st._meta, recordCount: st.stations.length });
for (const s of st.stations) {
  const expectFt = s.elevationM * 3.28084;
  if (Math.abs(s.elevationFt - expectFt) > 1) errors.push(`stations ${s.parkCode}: m/ft mismatch (${s.elevationM}m vs ${s.elevationFt}ft)`);
  if (s.distanceKm > 200 && !s.lowConfidence) errors.push(`stations ${s.parkCode}: ${s.distanceKm}km without lowConfidence flag`);
}
const acadSt = st.stations.find((s) => s.parkCode === "acad");
if (!acadSt || Math.abs(acadSt.elevationFt - 470.1) > 1) errors.push("stations: Acadia 470ft regression failed (the 144-ft meters bug canary)");
ok(`park-stations: ${st.stations.length} stations, m/ft consistent in one conversion, Acadia 470ft canary green`);

const nm = DATA("climate-normals.json");
meta("climate-normals", nm._meta);
const nParks = Object.entries(nm.parks);
if (nParks.length !== 63) errors.push("normals: != 63 parks");
for (const [code, p] of nParks) {
  for (const [mon, v] of Object.entries(p.months)) {
    if (v.tmaxF == null) errors.push(`normals ${code}/${mon}: missing TMAX`);
    else if (v.tmaxF < -40 || v.tmaxF > 130) errors.push(`normals ${code}/${mon}: tmax ${v.tmaxF} out of bounds`);
    if (v.tmaxF != null && v.tminF != null && v.tmaxF <= v.tminF) errors.push(`normals ${code}/${mon}: tmax <= tmin`);
  }
}
const npsaJan = nm.parks.npsa.months.jan.tavgF;
const npsaJul = nm.parks.npsa.months.jul.tavgF;
if (!(npsaJan > npsaJul)) errors.push(`normals: NPSA southern-hemisphere check failed (Jan ${npsaJan} should be > Jul ${npsaJul})`);
ok(`normals: 63 parks x 12 months, physical bounds hold, NPSA hemisphere check (Jan ${npsaJan}°F > Jul ${npsaJul}°F)`);

// --- acreage ---
const ac = DATA("acreage.json");
meta("acreage", ac._meta);
if (Object.keys(ac.parks).length !== 63) errors.push("acreage: != 63 parks");
if (Math.abs(ac.parks.yell.grossAcres - 2219790.71) > ac.parks.yell.grossAcres * 0.01) errors.push("acreage: YELL drifted >1%");
if ((ac.parks.gaar.components?.length ?? 0) !== 2) errors.push("acreage: GAAR must sum park+preserve (2 components)");
if (Math.abs(ac.parks.viis.grossAcres - 15041.03) > 200) errors.push("acreage: VIIS looks like the coral-reef trap");
ok(`acreage: 63 parks, YELL ${ac.parks.yell.grossAcres.toLocaleString()} ac, GAAR 2-component sum, VIIS not coral-reef`);

// --- premium photos ---
const pp = DATA("premium-photos.json");
meta("premium-photos", pp._meta, null);
const ppParks = Object.entries(pp.parks);
if (ppParks.length < 55) errors.push(`premium-photos: only ${ppParks.length} parks (expected ~61)`);
const LICENSE_OK = /^(Public domain|CC0|CC BY(-SA)? [0-9.]+( [a-z]{2})?)$/i;
for (const [code, e] of ppParks) {
  if (!LICENSE_OK.test(e.license)) errors.push(`premium ${code}: license "${e.license}" outside allowlist`);
  if (/CC BY/i.test(e.license) && !e.author?.trim()) errors.push(`premium ${code}: CC pick missing author`);
  if (e.sourceWidth < 2560) errors.push(`premium ${code}: ${e.sourceWidth}px under floor`);
  if (!e.url.startsWith("https://upload.wikimedia.org/")) errors.push(`premium ${code}: non-Commons url`);
  // Blur placeholders (founder #5): every premium hero must paint instantly.
  if (!e.blurDataURL || !e.blurDataURL.startsWith("data:image/")) errors.push(`premium ${code}: missing/invalid blurDataURL (run scripts/gen-premium-blur.mjs)`);
}
ok(`premium-photos: ${ppParks.length} parks, licenses in allowlist, authors present on CC picks, blurDataURLs inline`);

// --- self-hosted card images (pickCard's last-resort must never hotlink Commons) ---
const ci = DATA("card-images.json");
meta("card-images", ci._meta, null);
for (const [code] of ppParks) {
  const entry = ci.parks[code];
  if (!entry) { errors.push(`card-images: premium park ${code} has no self-hosted card`); continue; }
  const f = join(process.cwd(), "public", entry.file);
  if (!existsSync(f) || statSync(f).size === 0) errors.push(`card-images ${code}: ${entry.file} missing/empty on disk`);
}
ok(`card-images: ${Object.keys(ci.parks).length} self-hosted cards cover all premium parks`);

if (errors.length) {
  console.error(`\nDATASET VALIDATION FAILED (${errors.length}):\n - ` + errors.join("\n - "));
  process.exit(1);
}
console.log("\nAll dataset snapshots valid.");
