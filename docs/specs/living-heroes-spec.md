# Spec: The Vantara Pass — Living Heroes

**For:** Claude Code · **Version:** 1.0 · August 29, 2026
**Trigger:** vantara.in/en — the reference the founder wants ParkAtlas to feel like.

---

## 0. Teardown verdict (measured, not vibes)

I fetched and analyzed vantara.in directly. Findings:

| What | Vantara | ParkAtlas |
|---|---|---|
| Framework | **Next.js + Turbopack** (`/_next/static/chunks/turbopack-*.js`) | Next.js 16 + Turbopack — **same** |
| Media backbone | Headless CMS serving **video everywhere**: `muted loop preload="none" playsInline`, with **separate mobile-encoded files** (`mobile_parrot_*.mp4`) | Still photography only |
| Carousels | Swiper (61 references) | CSS scroll-snap (ours is fine) |
| Heavy animation libs | None detected (no GSAP/Three/Lottie signals in the document) | Motion + Lenis |
| Extras | Ambient audio track, glassy pill nav, soft serif over footage | — |

**The conclusion that changes everything:** you are not missing a tech stack. Vantara runs your stack. The "smoothness of the page, everything" is overwhelmingly one ingredient — **full-bleed living footage of animals and landscapes**, encoded per-device, played politely, under calm type. The import is video, not libraries. And ParkAtlas has a legal superpower Vantara had to pay a film crew for: the National Park Service publishes **public-domain b-roll** for many parks (Yosemite states its footage "may be used for any purpose"; Grand Canyon runs a downloadable b-roll archive; Rocky Mountain publishes aerials; Zion has 2025 b-roll in NPGallery). Conditions: credit NPS; never imply NPS endorsement — the existing footer disclaimer already satisfies the latter.

---

## 1. What we adopt: the Living Hero system

### 1.1 Sourcing & curation — `src/lib/data/video-manifest.ts`
Hand-curated, exactly like the photo hero manifest (curation beat pipelines last time; it will again):

```ts
export interface VideoManifestEntry {
  parkCode: string;          // or "home-<month>" for the 12 seasonal home heroes
  srcDesktop: string;        // encoded 1080p mp4 (H.264)
  srcMobile: string;         // encoded 540p mp4
  poster: string;            // extracted frame, jpg — this is the LCP element
  posterBlur: string;        // base64 blurDataURL
  credit: "NPS";             // always; append unit if named in source page
  sourceUrl: string;         // the nps.gov / NPGallery page the clip came from
  durationSec: number;       // 8–15s loops only
}
```

**Clip selection rules (human curates, Claude Code wires):** 8–15s and loopable (cut on a quiet moment); slow subject motion (drifting clouds, grazing bison, canyon light) — never fast pans; no identifiable people; horizon stable; credited "NPS" with no copyright symbol on the source page (that's the public-domain signal per NPS usage terms — anything credited otherwise is excluded). Log every clip in the `sources` registry like all other media.

**Coverage plan:** 12 seasonal home clips (one per month — Yellowstone bison for August, Zion canyon for January, etc.) + park-page clips for the top 10 most-visited parks, which are exactly the parks with the richest official b-roll (Yosemite, Grand Canyon, Zion, Rocky Mountain, Yellowstone, Great Smoky Mountains, Grand Teton, Olympic all have published archives). Everything else keeps its photo hero — a photo is a better hero than a bad video.

### 1.2 Encoding — `scripts/encode-hero-video.mjs`
ffmpeg script (documented, run locally; commit outputs, not sources):
- Desktop: 1920×1080, H.264, CRF ~23, `-movflags +faststart`, audio stripped, **target ≤ 2.5 MB**.
- Mobile: 960×540, CRF ~26, **target ≤ 1.0 MB**.
- Poster: strongest frame exported as JPEG (this goes through `next/image` and *is* the LCP), plus 16px blurDataURL.
- Storage: `/public/video/` while total stays under ~60 MB (≈ 22 clips); move to Vercel Blob when the park-page batch pushes past that — the component reads URLs from the manifest either way.

### 1.3 The `<LivingHero>` component — the politeness rules are the whole feature
Poster-first, video as progressive enhancement:
1. Render the poster via `next/image` with `priority` — **the LCP is always an image, never the video.**
2. Mount `<video muted loop playsInline preload="none">` and begin playback only when ALL are true: section in view (IntersectionObserver) · `useReducedMotion()` false · `navigator.connection?.saveData !== true` · after the poster has painted.
3. Crossfade poster → video over 600 ms once `canplay` fires. If the video never loads, nobody knows — the poster was already beautiful.
4. Pause when scrolled offscreen; resume on return. Mobile plays the 540p file under the same rules (Vantara plays video on mobile too — the per-device encode is what makes that acceptable).
5. Mono credit line: `Video: NPS`, linking to `sourceUrl` — same convention as photo credits.

### 1.4 Placement
- **Home hero:** the existing 12-entry seasonal rotation upgrades from photo to Living Hero — this is 80% of the Vantara feeling for 10% of the work.
- **Park heroes:** top-10 parks with curated clips; all others keep photos (manifest miss = photo fallback, automatic).
- **Year Scroller: images stay.** Twelve videos inside a transforming track is a frame-budget massacre; the Scroller's drama is the scrub, not motion inside frames. Revisit only after everything else ships at 60fps.
- One pacing adoption from Vantara: after the preloader lifts, hold a **200 ms beat of stillness** before the headline lines rise. Their calm comes from these small silences.

---

## 2. What we deliberately reject (write these down so they stay rejected)

| Vantara element | Verdict | Why |
|---|---|---|
| Ambient audio track | **Reject** | Sound is banned in our motion law; ParkAtlas's brand is dry and quiet. |
| Swiper carousels | **Reject** | +~40 KB for parity with our working CSS scroll-snap galleries. |
| Rounded pill UI everywhere | **Reject** | Their brand radius, not ours — we keep 2px/4px. Optional micro-adopt only: nav gains slight translucency + `backdrop-filter: blur(8px)` after scroll (small area, jank-safe). |
| Stock/commissioned footage look | **Reject** | Official PD sources only — it's the moat, and the credit line proves it. |

---

## 3. Guardrails (so the cinematic upgrade can't undo the performance work)

- LCP budget unchanged (≤ 2.5 s mobile): enforced structurally because the poster is the LCP and the video is `preload="none"`.
- Per-page video payload: ≤ 2.5 MB desktop / ≤ 1.0 MB mobile; exactly one video mounted per page in v1.
- **Smoke-test additions** (extend `e2e/smoke.spec.ts`): every `<video>` has `preload="none"`, `muted`, `playsinline`; the LCP entry's element is an `IMG`; on `/`, after 5 s in view, the hero video is playing (desktop project) — and with reduced-motion emulated, no video element plays.

## 4. Tickets

1. **V1 — End-to-end single clip:** encode script + manifest schema + `<LivingHero>` + wire the current month's home hero with one Yellowstone clip. *Accept: poster LCP unchanged vs. today; crossfade at canplay; pauses offscreen; reduced-motion/Save-Data never load video bytes (verify in network panel).*
2. **V2 — The seasonal twelve:** curate + encode all 12 home clips (human picks clips from the NPS b-roll pages; Claude Code encodes/wires). *Accept: month rotation serves the right clip; total `/public/video` ≤ 60 MB.*
3. **V3 — Top-10 park heroes.** *Accept: manifest-miss parks untouched; credits link to source pages; `sources` registry rows added.*
4. **V4 — Smoke additions + README** ("Living Heroes" section: sourcing rules, encode command, politeness rules). *Accept: `npm run smoke` green including the new assertions.*
