#!/usr/bin/env node
/**
 * Founder #3/#4 hardening: pickCard's premium last-resort must never hotlink
 * Commons. The first cut pointed the fallback at upload.wikimedia.org 1280px
 * thumbs on the theory only 2 parks would ever hit it — but a month page
 * renders all 63 parks, and in practice ~30 parks have zero rights-passing
 * NPS card images, so one page load fired a 30+-wide concurrent Commons
 * burst and got 429'd wholesale (observed in smoke on /discover/month/oct).
 * Same disease the Year Scroller had; same cure: download once here, serve
 * from /public/cards.
 *
 * Scope: ALL premium parks (not just the ones currently falling back) so the
 * fallback set is immune to rights-matcher drift — whichever park loses its
 * NPS images tomorrow already has a local card.
 *
 * Width: 960px (cards render ~400px CSS, so 960 covers 2x retina) from the
 * Commons thumb allowlist (probed live: 20/40/120/250/330/500/960/1280/1920/
 * 3840 — anything else 400s).
 *
 * Run: node scripts/etl-card-images.mjs
 * Politeness: strictly sequential, spaced, identifying UA, 429 backoff.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PREMIUM = JSON.parse(readFileSync(join(ROOT, "src", "lib", "data", "premium-photos.json"), "utf8"));
const OUT_DIR = join(ROOT, "public", "cards");
const OUT_JSON = join(ROOT, "src", "lib", "data", "card-images.json");
const UA = "ParkAtlas/1.0 (github.com/laxmideepak/Park-Atlas)";
const SPACING_MS = 1500;
const WIDTH = 960;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function downloadUrl(entry) {
  if (entry.sourceWidth <= WIDTH) return entry.originalUrl;
  if (/\/thumb\/.+\/\d+px-/.test(entry.url)) return entry.url.replace(/\/\d+px-/, `/${WIDTH}px-`);
  const file = entry.originalUrl.split("/").pop();
  return entry.originalUrl.replace("/wikipedia/commons/", "/wikipedia/commons/thumb/") + `/${WIDTH}px-${file}`;
}

async function politeFetch(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
    const retryAfter = Math.max(Number(res.headers.get("retry-after")) || 0, 30 * (attempt + 1));
    console.log(`    429 — cooling down ${retryAfter}s`);
    await sleep(retryAfter * 1000);
  }
  throw new Error("HTTP 429 after 5 attempts");
}

mkdirSync(OUT_DIR, { recursive: true });
const parks = {};
let bytes = 0;

for (const [code, entry] of Object.entries(PREMIUM.parks)) {
  const dest = join(OUT_DIR, `${code}.jpg`);
  // Resumable: a prior partial run's files are kept (Commons files are
  // content-addressed by name in premium-photos.json; a changed pick means a
  // changed URL means rerunning with the dir cleared).
  if (!existsSync(dest) || statSync(dest).size === 0) {
    const res = await politeFetch(downloadUrl(entry));
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`  ✓ ${code} ${(statSync(dest).size / 1024).toFixed(0)}KB`);
    await sleep(SPACING_MS);
  } else {
    console.log(`  = ${code} kept (${(statSync(dest).size / 1024).toFixed(0)}KB)`);
  }
  bytes += statSync(dest).size;
  parks[code] = { file: `/cards/${code}.jpg` };
}

writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      _meta: {
        sourceUrl: "https://upload.wikimedia.org (premium-photos.json picks, self-hosted card-size)",
        datasetVersion: `Commons ${WIDTH}px thumbs of the premium picks`,
        fetchedAt: new Date().toISOString(),
        script: "scripts/etl-card-images.mjs",
        recordCount: Object.keys(parks).length,
        totalBytes: bytes,
      },
      parks,
    },
    null,
    2
  ) + "\n"
);

console.log(`\n${Object.keys(parks).length} card images, ${(bytes / 1024 / 1024).toFixed(1)}MB → public/cards + ${OUT_JSON}`);
