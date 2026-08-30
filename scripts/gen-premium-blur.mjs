#!/usr/bin/env node
/**
 * Founder #5 (slow park-hero loads): generate a tiny blur placeholder for
 * every premium Commons pick so the hero paints *something* honest in the
 * first frame instead of a blank ink slab.
 *
 * For each entry in premium-photos.json, fetches a tiny Commons thumb (same
 * thumbnail URL pattern the full-size pick uses), base64s it, and writes it
 * back as `blurDataURL`. A 40px JPEG is ~700-1100 bytes — small enough to
 * inline in the dataset and ship in the HTML.
 *
 * Width is 40px, not the 32px originally spec'd: upload.wikimedia.org now
 * 400s any thumbnail width outside a fixed allowlist (probed live:
 * 20/40/120/250/330/500/960/1280/1920/3840 — "Use thumbnail sizes listed on
 * https://w.wiki/GHai"). 40px is the closest allowed size.
 *
 * Politeness (the same 429 lesson that made premium hero-only): strictly
 * sequential, 300ms spacing, identifying UA. Run: node scripts/gen-premium-blur.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), "src", "lib", "data", "premium-photos.json");
const UA = "ParkAtlas/1.0 (github.com/laxmideepak/Park-Atlas)";
const SPACING_MS = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 40px-wide Commons thumb for an entry (smallest useful width on the CDN's
 * allowlist). Thumb picks already carry the pattern
 * (`.../thumb/a/ab/File.jpg/3840px-File.jpg`) — just swap the width.
 * Original-URL picks (10 of 61) get the thumb path built from scratch. */
function thumb40(entry) {
  if (/\/thumb\/.+\/\d+px-/.test(entry.url)) {
    return entry.url.replace(/\/\d+px-/, "/40px-");
  }
  const file = entry.originalUrl.split("/").pop();
  return entry.originalUrl.replace("/wikipedia/commons/", "/wikipedia/commons/thumb/") + `/40px-${file}`;
}

/** One fetch with 429-aware backoff — honors Retry-After, else 30s/60s/90s.
 * The whole point of this dataset is not hammering Commons; the generator
 * has to hold itself to the same standard. */
async function politeFetch(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return res;
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`);
    // Commons' Retry-After lowballs the real penalty window (observed:
    // "Retry-After: 1" while the bucket stayed empty for tens of seconds) —
    // floor the cooldown at 30s/60s/90s/120s regardless.
    const retryAfter = Math.max(Number(res.headers.get("retry-after")) || 0, 30 * (attempt + 1));
    console.log(`    429 — cooling down ${retryAfter}s`);
    await sleep(retryAfter * 1000);
  }
  throw new Error("HTTP 429 after 5 attempts");
}

/** Strip APPn/COM metadata segments (EXIF, ICC profiles, Photoshop blobs)
 * from a JPEG. A handful of Commons thumbs embed 10-30KB print-grade ICC
 * profiles — pure dead weight in a 40px blur placeholder that ships inline
 * in every page's HTML. Pixel data is untouched. */
function stripJpegMetadata(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf; // not a JPEG — leave as-is
  const parts = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    if (marker === 0xda) break; // SOS — entropy-coded data follows, copy the rest
    const len = buf.readUInt16BE(i + 2);
    const isMeta = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe; // APP0-APP15, COM
    if (!isMeta) parts.push(buf.subarray(i, i + 2 + len));
    i += 2 + len;
  }
  parts.push(buf.subarray(i));
  return Buffer.concat(parts);
}

const data = JSON.parse(readFileSync(FILE, "utf8"));
const codes = Object.keys(data.parks);
let generated = 0;
let failed = 0;

for (const code of codes) {
  const entry = data.parks[code];
  if (entry.blurDataURL) continue; // resumable — a 429'd run picks up where it left off
  const url = thumb40(entry);
  try {
    const res = await politeFetch(url);
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const buf = stripJpegMetadata(Buffer.from(await res.arrayBuffer()));
    entry.blurDataURL = `data:${type};base64,${buf.toString("base64")}`;
    generated++;
    console.log(`  ✓ ${code} ${buf.length}B`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${code} ${url} — ${err.message}`);
  }
  // Persist as we go so an interrupted run loses nothing.
  writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
  await sleep(SPACING_MS);
}

const total = Object.values(data.parks).filter((e) => e.blurDataURL).length;
console.log(`\nblurDataURL present for ${total}/${codes.length} parks (${generated} new, ${failed} failed) → ${FILE}`);
if (total < codes.length) process.exit(1);
