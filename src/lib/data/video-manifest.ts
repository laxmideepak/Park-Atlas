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
 * hand-encode; the script enforces the size budgets (<=2.5MB desktop,
 * <=1.0MB mobile) and emits the poster + blurDataURL.
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
  // August home hero (spec coverage plan: "Yellowstone bison for August").
  // Source: Yellowstone Video Library, "Bison in Summer" — page metadata
  // states "Copyright Info: Public domain", Location: Lamar Valley, no
  // audio. 12s window trimmed from the 20s original; desktop kept at the
  // source's native 720p (never upscale).
  "home-aug": {
    parkCode: "yell",
    srcDesktop: "/video/yell-bison-lamar-1080.mp4",
    srcMobile: "/video/yell-bison-lamar-540.mp4",
    poster: "/video/yell-bison-lamar-poster.jpg",
    posterBlur:
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjI4LjEwMQD/2wBDAAgKCgsKCw0NDQ0NDRAPEBAQEBAQEBAQEBASEhIVFRUSEhIQEBISFBQVFRcXFxUVFRUXFxkZGR4eHBwjIyQrKzP/xABgAAEBAQAAAAAAAAAAAAAAAAAFAgcBAQEAAAAAAAAAAAAAAAAAAAACEAABAgMJAQAAAAAAAAAAAAABAAQCMQaRoYEDYVESMvAhEQADAQEAAAAAAAAAAAAAAAAAARExIf/AABEIAAkAEAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AFxU709suIa8iQbAqiqVyRLEH7eFn8U/bJFvIqK3nAf/2Q==",
    credit: "NPS",
    sourceUrl: "https://www.nps.gov/yell/learn/photosmultimedia/vl_bisonsummer.htm",
    durationSec: 12,
  },
};
