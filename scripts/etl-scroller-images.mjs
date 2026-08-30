#!/usr/bin/env node
/**
 * Founder #2: the Year Scroller — the site's 12 most-seen pixels — gets the
 * premium Commons picks, SELF-HOSTED. The scroller mounts 12 chapters on one
 * page; hotlinking 12 premium images straight off upload.wikimedia.org is
 * exactly the concurrent burst that gets 429'd (observed in smoke, and the
 * reason premium was hero-only until now). Downloading once here and serving
 * from /public keeps 4K-source chapters with zero runtime Commons traffic.
 *
 * Selection mirrors src/app/page.tsx exactly: each month's chapter park is
 * `bestByMonth(abbr)[0]`, falling back to the runner-up when the top park
 * has no premium pick (same order the page's own image fallback walks).
 *
 * Width note: the plan called for 2560px thumbs, but upload.wikimedia.org
 * now 400s any thumbnail width outside its allowlist (probed live:
 * 20/40/120/250/330/500/960/1280/1920/3840). 1920px is the largest allowed
 * width <= 2560 and keeps the total payload in the ~8-15MB budget; 3840
 * would roughly triple it.
 *
 * Run: node --import tsx scripts/etl-scroller-images.mjs
 * Politeness: strictly sequential, spaced, identifying UA, 429 backoff.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { bestByMonth } from "../src/lib/repo.ts";
import { MONTHS } from "../src/lib/months.ts";

const ROOT = process.cwd();
const PREMIUM = JSON.parse(readFileSync(join(ROOT, "src", "lib", "data", "premium-photos.json"), "utf8"));
const OUT_DIR = join(ROOT, "public", "scroller");
const OUT_JSON = join(ROOT, "src", "lib", "data", "scroller-images.json");
const UA = "ParkAtlas/1.0 (github.com/laxmideepak/Park-Atlas)";
const SPACING_MS = 2000;
const WIDTH = 1920;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Commons thumb at WIDTH px — or the original when the source isn't
 * meaningfully larger (the CDN rejects thumbs >= source width). */
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
    // Commons' Retry-After lowballs the real penalty window — floor it.
    const retryAfter = Math.max(Number(res.headers.get("retry-after")) || 0, 30 * (attempt + 1));
    console.log(`    429 — cooling down ${retryAfter}s`);
    await sleep(retryAfter * 1000);
  }
  throw new Error("HTTP 429 after 5 attempts");
}

// The 12 chapter parks, exactly as the home page derives them.
const wanted = [];
for (const m of MONTHS) {
  const [top, runnerUp] = bestByMonth(m.abbr);
  const code = PREMIUM.parks[top.park] ? top.park : runnerUp && PREMIUM.parks[runnerUp.park] ? runnerUp.park : null;
  if (!code) {
    console.warn(`  ! ${m.abbr}: neither ${top.park} nor ${runnerUp?.park} has a premium pick — chapter stays on the NPS pipeline`);
    continue;
  }
  if (!wanted.includes(code)) wanted.push(code);
}

mkdirSync(OUT_DIR, { recursive: true });
const parks = {};
let bytes = 0;

for (const code of wanted) {
  const entry = PREMIUM.parks[code];
  const url = downloadUrl(entry);
  const res = await politeFetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT_DIR, `${code}.jpg`), buf);
  bytes += buf.length;
  parks[code] = {
    file: `/scroller/${code}.jpg`,
    author: entry.author,
    license: entry.license,
    sourcePage: entry.sourcePage,
    alt: entry.alt,
  };
  console.log(`  ✓ ${code} ${(buf.length / 1024).toFixed(0)}KB — ${url}`);
  await sleep(SPACING_MS);
}

writeFileSync(
  OUT_JSON,
  JSON.stringify(
    {
      _meta: {
        sourceUrl: "https://upload.wikimedia.org (premium-photos.json picks, self-hosted for the Year Scroller)",
        datasetVersion: `Commons ${WIDTH}px thumbs of the premium picks`,
        fetchedAt: new Date().toISOString(),
        script: "scripts/etl-scroller-images.mjs",
        recordCount: Object.keys(parks).length,
        totalBytes: bytes,
      },
      parks,
    },
    null,
    2
  ) + "\n"
);

console.log(`\n${Object.keys(parks).length} chapter images, ${(bytes / 1024 / 1024).toFixed(1)}MB → public/scroller + ${OUT_JSON}`);
