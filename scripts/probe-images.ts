/**
 * Probes real pixel dimensions for every image `fetchParkImages` would
 * serve, across all 63 parks. Writes src/lib/data/image-dims.json, committed
 * — this never runs at request time or in the Next.js build itself.
 *
 * Usage: npm run probe-images
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { imageSize } from "image-size";
import { ALL_PARKS_MINI } from "../src/lib/data/all-parks-mini";
import { fetchParkImages } from "../src/lib/nps";

const OUT_PATH = new URL("../src/lib/data/image-dims.json", import.meta.url);
const CONCURRENCY = 4;

async function probeOne(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const dims = imageSize(buf);
    if (!dims.width || !dims.height) return null;
    return { width: dims.width, height: dims.height };
  } catch (e) {
    console.error(`  ! failed ${url}: ${(e as Error).message}`);
    return null;
  }
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
}

async function main() {
  const existing: Record<string, { width: number; height: number }> = existsSync(OUT_PATH)
    ? JSON.parse(readFileSync(OUT_PATH, "utf-8"))
    : {};

  let done = 0;
  let newlyProbed = 0;
  const total = ALL_PARKS_MINI.length;

  for (const park of ALL_PARKS_MINI) {
    done++;
    console.log(`[${done}/${total}] ${park.code} — fetching image list...`);
    const images = await fetchParkImages(park.code);
    const toProbe = images.filter((im) => !existing[im.url]);
    if (toProbe.length === 0) {
      console.log(`  (${images.length} images, all already cached)`);
      continue;
    }
    console.log(`  probing ${toProbe.length}/${images.length} image(s)...`);
    await pool(toProbe, CONCURRENCY, async (im) => {
      const dims = await probeOne(im.url);
      if (dims) {
        existing[im.url] = dims;
        newlyProbed++;
        console.log(`  + ${im.url.split("/").pop()} -> ${dims.width}x${dims.height}`);
      }
    });
    // Save incrementally so a crash/interrupt doesn't lose earlier progress.
    writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2) + "\n");
  }

  writeFileSync(OUT_PATH, JSON.stringify(existing, null, 2) + "\n");
  console.log(`\nDone. ${newlyProbed} newly probed, ${Object.keys(existing).length} total cached.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
