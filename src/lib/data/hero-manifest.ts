/**
 * Hand-picked hero images (production brief T4) — intentionally empty.
 *
 * This needs a human to actually look at each park's NPS API images and/or
 * NPGallery high-resolution originals and pick the single best one — that's
 * a real, subjective, visual judgment call no amount of pipeline logic can
 * make correctly, and fabricating URLs here would risk shipping broken or
 * simply-invented image links. Fill this in yourself:
 *
 *   1. For a park code (e.g. "yell"), find its best photo:
 *      - NPS API: https://www.nps.gov/subjects/digital/nps-data-api.htm
 *        (the images this site already pulls from `/parks?parkCode=X&fields=images`)
 *      - NPGallery: https://npgallery.nps.gov (search the park name; high-res
 *        originals often live at a `.../proxyhires` or similar large variant)
 *   2. Confirm the credit line reads as NPS/public-domain (same rights gate
 *      `fetchParkImages` already applies — see src/lib/nps.ts).
 *   3. Add an entry below with the real url/credit/alt text.
 *
 * `pickHero`/`pickScrollerChapter` in image-select.ts check this manifest
 * first, before falling back to the size-aware NPS-API selection already
 * in place. Recommended priority: the 12 Year Scroller months' current top
 * park + the top-15 most-visited parks (see docs/specs or Appendix B of the
 * PRD for that list) — twenty minutes of picking beats any pipeline cleverness.
 */
export interface HeroManifestEntry {
  url: string;
  credit: string;
  alt: string;
}

export const HERO_MANIFEST: Record<string, HeroManifestEntry> = {
  // "yell": { url: "https://npgallery.nps.gov/...", credit: "NPS / ...", alt: "..." },
};
