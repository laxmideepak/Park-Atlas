import dims from "./data/image-dims.json";
import { HERO_MANIFEST } from "./data/hero-manifest";
import premium from "./data/premium-photos.json";
import type { ParkImage } from "./nps";

/** Community-award-tier photos (Wikimedia Commons Featured/Quality/Valued,
 * license-verified: PD/CC0/CC BY/CC BY-SA only). Highest priority in the
 * hero chain; `creditUrl` links the Commons file page, which carries the
 * attribution + license notice CC BY/BY-SA legally require us to surface. */
function fromPremium(parkCode?: string): (ParkImage & { creditUrl: string }) | null {
  if (!parkCode) return null;
  const entry = (premium.parks as Record<string, { url: string; author: string; license: string; sourcePage: string; alt: string }>)[parkCode];
  if (!entry) return null;
  return {
    url: entry.url,
    title: entry.alt,
    altText: entry.alt,
    credit: `Photo: ${entry.author} · ${entry.license}`,
    creditUrl: entry.sourcePage,
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

/** Year Scroller chapters are the site's 12 most-seen pixels — hold them to
 * a higher bar. Also checks the manifest first. */
/** Scroller stays on the NPS pipeline BY DESIGN: it mounts 12 chapters on
 * one page, and a 12-wide concurrent burst against upload.wikimedia.org
 * gets 429'd (observed in smoke). Premium Commons picks are hero-only —
 * one Commons fetch per park page, no burst anywhere. */
export function pickScrollerChapter(images: ParkImage[], parkCode?: string): ParkImage | null {
  const manifest = fromManifest(parkCode);
  if (manifest) return manifest;
  const candidates = images.filter((im) => passes(im.url, 2000, [1.3, 2.1]));
  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => (getDims(b.url)?.width ?? 0) - (getDims(a.url)?.width ?? 0))[0];
  }
  return null;
}
