import dims from "./data/image-dims.json";
import type { ParkImage } from "./nps";

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

/** Hero: needs real resolution and a landscape, crop-safe aspect ratio. */
export function pickHero(images: ParkImage[]): ParkImage | null {
  const candidates = images.filter((im) => passes(im.url, 1600, [1.3, 2.1]));
  if (candidates.length === 0) return images.length > 0 && !getDims(images[0].url) ? images[0] : null;
  return [...candidates].sort((a, b) => (getDims(b.url)?.width ?? 0) - (getDims(a.url)?.width ?? 0))[0];
}

/** Card: any orientation, just needs to not be a thumbnail. */
export function pickCard(images: ParkImage[]): ParkImage | null {
  const candidates = images.filter((im) => passes(im.url, 800));
  return candidates[0] ?? null;
}

/** Year Scroller chapters are the site's 12 most-seen pixels — hold them to a higher bar. */
export function pickScrollerChapter(images: ParkImage[]): ParkImage | null {
  const candidates = images.filter((im) => passes(im.url, 2000, [1.3, 2.1]));
  if (candidates.length > 0) {
    return [...candidates].sort((a, b) => (getDims(b.url)?.width ?? 0) - (getDims(a.url)?.width ?? 0))[0];
  }
  return null;
}
