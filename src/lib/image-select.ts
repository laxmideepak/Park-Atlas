import dims from "./data/image-dims.json";
import { HERO_MANIFEST } from "./data/hero-manifest";
import premium from "./data/premium-photos.json";
import scroller from "./data/scroller-images.json";
import type { ParkImage } from "./nps";

/** Community-award-tier photos (Wikimedia Commons Featured/Quality/Valued,
 * license-verified: PD/CC0/CC BY/CC BY-SA only). Highest priority in the
 * hero chain; `creditUrl` links the Commons file page, which carries the
 * attribution + license notice CC BY/BY-SA legally require us to surface. */
interface PremiumEntry {
  url: string;
  originalUrl: string;
  sourceWidth: number;
  author: string;
  license: string;
  sourcePage: string;
  alt: string;
  blurDataURL?: string;
}

function fromPremium(parkCode?: string): (ParkImage & { creditUrl: string }) | null {
  if (!parkCode) return null;
  const entry = (premium.parks as Record<string, PremiumEntry>)[parkCode];
  if (!entry) return null;
  return {
    url: entry.url,
    title: entry.alt,
    altText: entry.alt,
    credit: `Photo: ${entry.author} · ${entry.license}`,
    creditUrl: entry.sourcePage,
    blurDataURL: entry.blurDataURL,
  };
}

/**
 * Size-aware image selection (production audit T3). `next/image` never
 * upscales, so picking `images[0]` blindly meant some heroes stretched a
 * 600–1,440px source up to the 2,880px a retina full-bleed needs. Real
 * dimensions are probed build-time only (`npm run probe-images`, writes
 * `data/image-dims.json`, committed) — never at request time.
 */

export interface ImageDims {
  width: number;
  height: number;
}

const DIMS = dims as Record<string, ImageDims>;

export function getDims(url: string): ImageDims | null {
  return DIMS[url] ?? null;
}

function passes(url: string, minWidth: number, aspectRange?: [number, number]): boolean {
  const d = getDims(url);
  // Unprobed (e.g. probe script hasn't run yet, or a brand-new image
  // appeared since the last probe) — pass it through rather than hide a
  // real photo behind a missing cache entry.
  if (!d) return true;
  if (d.width < minWidth) return false;
  if (aspectRange) {
    const ratio = d.width / d.height;
    if (ratio < aspectRange[0] || ratio > aspectRange[1]) return false;
  }
  return true;
}

function fromManifest(parkCode?: string): ParkImage | null {
  if (!parkCode) return null;
  const entry = HERO_MANIFEST[parkCode];
  return entry ? { url: entry.url, credit: entry.credit, altText: entry.alt, title: entry.alt } : null;
}

/** Hero: needs real resolution and a landscape, crop-safe aspect ratio.
 * Checks the hand-picked manifest first (T4 — empty until filled in). */
export function pickHero(images: ParkImage[], parkCode?: string): ParkImage | null {
  const prem = fromPremium(parkCode);
  if (prem) return prem;
  const manifest = fromManifest(parkCode);
  if (manifest) return manifest;
  const candidates = images.filter((im) => passes(im.url, 1600, [1.3, 2.1]));
  if (candidates.length === 0) return images.length > 0 && !getDims(images[0].url) ? images[0] : null;
  return [...candidates].sort((a, b) => (getDims(b.url)?.width ?? 0) - (getDims(a.url)?.width ?? 0))[0];
}

/** Card: any orientation, just needs to not be a thumbnail. */
export function pickCard(images: ParkImage[]): ParkImage | null {
  const candidates = images.filter((im) => passes(im.url, 800));
  return candidates[0] ?? null;
}

/** Premium picks downloaded to /public/scroller by scripts/etl-scroller-images.mjs
 * — the scroller mounts 12 chapters on one page, and hotlinking that many
 * Commons files concurrently gets 429'd (observed in smoke), so the scroller
 * only ever uses premium photos it can serve from its own origin. Credit and
 * blur come from the same premium registry entry (same photograph). */
function fromScroller(parkCode?: string): (ParkImage & { creditUrl: string }) | null {
  if (!parkCode) return null;
  const entry = (scroller.parks as Record<string, { file: string; author: string; license: string; sourcePage: string; alt: string }>)[parkCode];
  if (!entry) return null;
  return {
    url: entry.file,
    title: entry.alt,
    altText: entry.alt,
    credit: `Photo: ${entry.author} · ${entry.license}`,
    creditUrl: entry.sourcePage,
    blurDataURL: (premium.parks as Record<string, PremiumEntry>)[parkCode]?.blurDataURL,
  };
}

/** Year Scroller chapters are the site's 12 most-seen pixels — hold them to
 * a higher bar: self-hosted premium pick first (zero Commons traffic at
 * runtime — the 12-wide hotlink burst is exactly what gets 429'd), then the
 * hand-picked manifest, then the size-gated NPS pipeline. */
export function pickScrollerChapter(images: ParkImage[], parkCode?: string): ParkImage | null {
  const local = fromScroller(parkCode);
  if (local) return local;
  const manifest = fromManifest(parkCode);
  if (manifest) return manifest;
  const candidates = images.filter((im) => passes(im.url, 2000, [1.3, 2.1]));
  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => (getDims(b.url)?.width ?? 0) - (getDims(a.url)?.width ?? 0))[0];
  }
  return null;
}
