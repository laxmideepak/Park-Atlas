/**
 * Living Heroes video manifest (spec §1.1) — hand-curated, exactly like the
 * photo hero manifest. Keys are either a 4-letter park code ("yell") for
 * park-page heroes, or "home-<mon>" ("home-aug") for the 12 seasonal home
 * heroes. A missing key means the photo hero renders instead — automatic,
 * no error, by design ("a photo is a better hero than a bad video").
 *
 * Sourcing rules (spec §1.1): only clips from official NPS pages, credited
 * "NPS" with no copyright symbol on the source page (the public-domain
 * signal per NPS usage terms). 8-15s loopable, slow subject motion, no
 * identifiable people. Every clip gets a row in docs/sources.md.
 *
 * Files are produced by `node scripts/encode-hero-video.mjs` — never
 * hand-encode; the script enforces the size budgets (<=4.0MB desktop —
 * raised from the spec's 2.5MB, which predates true-1080p sources; see
 * the note in the encode script — <=1.0MB mobile) and emits the poster
 * + blurDataURL.
 */
export interface VideoManifestEntry {
  parkCode: string; // or "home-<mon>" for the 12 seasonal home heroes
  srcDesktop: string; // encoded 1080p mp4 (H.264)
  srcMobile: string; // encoded 540p mp4
  poster: string; // extracted frame, jpg — this is the LCP element
  posterBlur: string; // base64 blurDataURL
  credit: string; // always starts "NPS"; append unit if named on source page
  sourceUrl: string; // the nps.gov / NPGallery page the clip came from
  durationSec: number; // 8-15s loops only
}

export const VIDEO_MANIFEST: Record<string, VideoManifestEntry> = {
  // August home hero. Replaced the original 720p Yellowstone "Bison in
  // Summer" legacy-library clip (soft at 1440px+ next to the 4K photo
  // heroes) with a true-1080p NPGallery master: a humpback whale surfacing
  // at South Marble Island, Glacier Bay. NPGallery asset metadata states
  // Constraint "Public domain", Granting Rights "Full", credit "NPS
  // Video/S. Tevebaugh". Seasonally right for August — Glacier Bay's
  // humpback season peaks June-August (summer greens, lingering high
  // snowfields). 12s calm-to-calm window of the 14s original, whale
  // surfaces mid-loop; encoded from the 16 Mbps 1920x1080 source.
  "home-aug": {
    parkCode: "glba",
    srcDesktop: "/video/glba-humpback-marble-1080.mp4",
    srcMobile: "/video/glba-humpback-marble-540.mp4",
    poster: "/video/glba-humpback-marble-poster.jpg",
    posterBlur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjI4LjEwMQD/2wBDAAgKCgsKCw0NDQ0NDRAPEBAQEBAQEBAQEBASEhIVFRUSEhIQEBISFBQVFRcXFxUVFRUXFxkZGR4eHBwjIyQrKzP/xABeAAEBAQAAAAAAAAAAAAAAAAADAQUBAQAAAAAAAAAAAAAAAAAAAAQQAAICAQMFAQAAAAAAAAAAAAECBAARAwUSoXKRcTJSEQACAwEAAAAAAAAAAAAAAAAAUQERAhL/wAARCAAJABADASIAAhEAAxEA/9oADAMBAAIRAxEAPwDaEzcwmEkaKdq8SfeFx0oa8jd5AAaYAB+AVPkLmxPmpUVCA96Z/9k=",
    credit: "NPS Video / S. Tevebaugh",
    sourceUrl: "https://npgallery.nps.gov/AssetDetail/fa0e0f35-4cfc-4b69-a2a3-a30691e88fa3",
    durationSec: 12,
  },
};

// Glacier Bay's humpback season runs June-September, so the same clip
// honestly covers both late-summer home heroes. Object spread keeps one
// source of truth for the encode paths and credit.
VIDEO_MANIFEST["home-sep"] = { ...VIDEO_MANIFEST["home-aug"] };
