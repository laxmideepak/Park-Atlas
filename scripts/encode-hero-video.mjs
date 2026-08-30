#!/usr/bin/env node
/**
 * Living Heroes encode pipeline (spec §1.2) — run locally, commit outputs.
 *
 *   node scripts/encode-hero-video.mjs <input.(mp4|mov)> <basename> [startSec] [durationSec]
 *
 * Writes to public/video/:
 *   <basename>-1080.mp4   1920x1080 H.264 CRF~23 +faststart, audio stripped, target <= 4.0 MB
 *   <basename>-540.mp4     960x540 H.264 CRF~26 +faststart, audio stripped, target <= 1.0 MB
 *
 * Desktop budget history: the spec's 2.5 MB target was written when every
 * available source was 720p NPS legacy b-roll. True-1080p sources (NPGallery
 * publishes 12-16 Mbps masters) need ~2.7 Mbps for water/foliage motion to
 * survive at 1080p; at 2.5 MB a 12s loop lands at CRF 32+ and visibly smears.
 * Raised to 4.0 MB (still one video per page, preload="none", poster LCP).
 *   <basename>-poster.jpg  first frame of the encoded loop (the LCP element)
 * and prints the base64 blurDataURL + a ready-to-paste VideoManifestEntry snippet.
 *
 * If an encode exceeds its size target, CRF is bumped +3 and retried (up to 3 attempts)
 * before giving up loudly — never silently commit an oversized clip.
 */
import { execFileSync } from "node:child_process";
import { statSync, readFileSync, mkdirSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";

const [input, basename, startSec, durationSec] = process.argv.slice(2);
if (!input || !basename) {
  console.error("Usage: node scripts/encode-hero-video.mjs <input> <basename> [startSec] [durationSec]");
  process.exit(1);
}

const OUT_DIR = join(process.cwd(), "public", "video");
mkdirSync(OUT_DIR, { recursive: true });

const trim = [
  ...(startSec ? ["-ss", startSec] : []),
  ...(durationSec ? ["-t", durationSec] : []),
];

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function encode(label, out, width, height, startCrf, targetBytes) {
  for (let crf = startCrf; crf <= startCrf + 9; crf += 3) {
    ffmpeg([
      ...trim,
      "-i", input,
      "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      "-c:v", "libx264",
      "-crf", String(crf),
      "-preset", "slow",
      "-an",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      out,
    ]);
    const size = statSync(out).size;
    console.log(`${label}: CRF ${crf} -> ${(size / 1e6).toFixed(2)} MB (target ${(targetBytes / 1e6).toFixed(1)} MB)`);
    if (size <= targetBytes) return size;
  }
  console.error(`${label}: could not hit size target even at CRF ${startCrf + 9} — trim the clip shorter (8-15s per spec) and re-run.`);
  process.exit(1);
}

const desktop = join(OUT_DIR, `${basename}-1080.mp4`);
const mobile = join(OUT_DIR, `${basename}-540.mp4`);
const poster = join(OUT_DIR, `${basename}-poster.jpg`);

// Never upscale: much official NPS b-roll is published at 1280x720. Encoding
// 720p up to 1080p spends bytes making the image strictly worse — cap the
// desktop encode at the source's own resolution instead.
const srcHeight = parseInt(execFileSync("ffprobe", [
  "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", input,
]).toString().trim(), 10);
const [dw, dh] = srcHeight >= 1080 ? [1920, 1080] : [1280, 720];
if (dh !== 1080) console.log(`source is ${srcHeight}p — desktop encode capped at ${dw}x${dh} (no upscaling)`);

encode(`desktop ${dh}p`, desktop, dw, dh, 23, 4.0e6);
encode("mobile 540p", mobile, 960, 540, 26, 1.0e6);

// Poster = the encoded loop's FIRST frame, so the 600ms poster->video crossfade
// lands on an identical image instead of a visible jump.
ffmpeg(["-i", desktop, "-frames:v", "1", "-q:v", "3", poster]);
console.log(`poster: ${(statSync(poster).size / 1e3).toFixed(0)} KB`);

// 16px blurDataURL from the poster (temp file, not committed)
const blurTmp = join(OUT_DIR, `.${basename}-blur.jpg`);
ffmpeg(["-i", poster, "-vf", "scale=16:-1", "-q:v", "5", blurTmp]);
const blurDataURL = `data:image/jpeg;base64,${readFileSync(blurTmp).toString("base64")}`;
unlinkSync(blurTmp);

const probe = execFileSync("ffprobe", [
  "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", desktop,
]).toString().trim();
const duration = Math.round(parseFloat(probe));
if (duration < 8 || duration > 15) {
  console.warn(`WARNING: encoded duration is ${duration}s — spec wants 8-15s loops. Pass [startSec] [durationSec] to trim.`);
}

console.log(`\nManifest entry snippet (fill in sourceUrl + credit from the NPS source page):\n`);
console.log(JSON.stringify({
  parkCode: "<parkCode or home-<mon>>",
  srcDesktop: `/video/${basename}-1080.mp4`,
  srcMobile: `/video/${basename}-540.mp4`,
  poster: `/video/${basename}-poster.jpg`,
  posterBlur: blurDataURL.slice(0, 60) + "... (full value printed below)",
  credit: "NPS",
  sourceUrl: "<nps.gov / NPGallery page the clip came from>",
  durationSec: duration,
}, null, 2));
console.log(`\nposterBlur (full):\n${blurDataURL}\n`);

const total = ["-1080.mp4", "-540.mp4", "-poster.jpg"].reduce(
  (sum, suffix) => sum + (existsSync(join(OUT_DIR, `${basename}${suffix}`)) ? statSync(join(OUT_DIR, `${basename}${suffix}`)).size : 0), 0);
console.log(`This clip's committed footprint: ${(total / 1e6).toFixed(2)} MB`);
