# ParkAtlas

**Which of the 63 U.S. National Parks should you visit, and when — scored on climate and access, never on popularity.**

Most "best time to visit" content is really just "when do the most people visit" in disguise. ParkAtlas inverts that: every park gets a **Month Fit** score (0–100) built from two things that actually determine whether a visit is good — **climate suitability** (60%) and **seasonal accessibility** (40%, road/facility status). Visitation never enters the score. It's shown separately, as a crowd calendar, so you can see when a park is *good* and when it's *empty* and decide for yourself how much those two things matter to you.

Every score ships with a **Why panel**: the exact component weights, the source, a data-confidence rating, and — for low-scoring months — a **Why not now?** explanation that reframes rather than just says "don't go" (Yellowstone in January isn't bad, it's a different, specialized trip).

## Design — "OVERLOOK"

A cinematic field guide: full-bleed official NPS photography and large editorial serif type (National Geographic feature-story voice) sitting directly on top of a mono-typeset "instrument" layer — tier badges, methodology versions, Why-panels — that never goes away. The photography is the story; the mono layer is the receipts.

- **Real photography everywhere**, license-verified: heroes for 61/63 parks are Wikimedia Commons **Featured/Quality/Valued** picks (public domain / CC0 / CC BY / CC BY-SA only, per-file provenance in `src/lib/data/premium-photos.json`, attribution rendered on-site as a credit chip linking the Commons file page). Below the hero, the NPS API pipeline supplies rights-filtered photos (only images credited to NPS itself — a public-domain proxy). Parks with no cleared image get a dignified `ContourField` fallback — topo contour lines in the park's own color — never a fake landscape.
- **The Year Scroller** (home page signature): a pinned, scroll-scrubbed journey through all 12 months, each chapter driven by the real `bestByMonth()` engine — not hardcoded. Swipe carousel on mobile, static grid under `prefers-reduced-motion`.
- **Tokens**: bone (`#EDE7DA`) / ink (`#131711`) / brass (`#B8862B`, the *only* UI accent) / glacial (`#7FA3AD`, data-secondary only). Instrument Serif + Instrument Sans + IBM Plex Mono.
- Built on Motion (scroll-linked transforms, reveals) + Lenis (smooth scroll, auto-disables under reduced motion) + the native View Transitions API for card→hero photo morphs. No GSAP, no Three.js/WebGL.

## What's real vs. estimated, honestly

Every number on the site is either a **government dataset snapshot committed to this repo** or a **labeled curated estimate** — never a mystery number. The committed snapshots (all in `src/lib/data/`, each with a `_meta` provenance header, re-validated by `scripts/validate-datasets.mjs` on every build so a bad snapshot can never ship):

| Dataset | Source | Coverage |
|---|---|---|
| Monthly + annual visitation | NPS IRMA Stats (5-yr window, 2021–2025) | all 63 parks × 12 months |
| Climate normals (tmax/tmin/tavg) | NOAA NCEI 1991–2020 U.S. Climate Normals, nearest researched station per park (station + distance + elevation on file) | all 63 parks × 12 months |
| Acreage | NPS LWCF acreage report | all 63 parks (multi-component units summed, e.g. Gates of the Arctic park + preserve) |
| Unit crosswalk (codes, designations, combos) | NPS IRMA Unit Service | all 63 parks |
| Photo provenance | Wikimedia Commons file pages (author, license, badge, source resolution) | 61 parks |

What's still curated, and labeled as such in every Why panel: the **climate-suitability curve** (hand-authored mapping from the real normals to a 0–100 comfort score) and **seasonal accessibility** (NPS publishes no "% of roads open per month" dataset for any park — the four-park editorial cohort is hand-curated from published NPS closure patterns; the rest are deterministic estimates by park type, always labeled with what's missing).

What's **live at request time**: NPS park descriptions, entrance fees, photos, and current alerts (NPS Data API), plus real local time, temperature, and forecast for every park's actual location (National Weather Service — no key required).

## Phase status

- ✅ Month Fit engine (all 63 parks), Why/Why-not-now panels, Crowd Calendar, Best-Balance Month
- ✅ Interactive US map, tier-encoded pins, tap-to-zoom + summary card
- ✅ Live NPS photography (rights-filtered) + descriptions + fees + alerts, all 63 parks
- ✅ Live NWS local time/weather for every park
- ✅ OVERLOOK visual redesign (tokens, Year Scroller, park-page rebuild, index/rankings/month restyle)
- ✅ Production layer: per-page `generateMetadata` + OG images (dynamic, per park/month), `sitemap.ts`, `robots.ts`, `TouristAttraction` JSON-LD, branded `icon`/`apple-icon`, in-voice `error.tsx`/`not-found.tsx`, Vercel Analytics + Speed Insights wired, CI workflow (lint/test/build + Lighthouse CI)
- ✅ Gov-data pipeline: real NOAA 1991–2020 normals, NPS IRMA visitation (5-yr), LWCF acreage, unit crosswalk — all 63 parks, committed snapshots gated by `scripts/validate-datasets.mjs`
- ✅ Premium photography: Commons Featured/Quality heroes for 61/63 parks, license-verified, credit chips, blur placeholders; Year Scroller + card fallbacks self-hosted (Commons hotlink bursts get rate-limited)
- ✅ Living Hero video (home page: 1080p Glacier Bay humpback, public domain), ambient soundscape (opt-in, PD/CC0 loops), editorial typography pass (standfirsts, pull quotes, indexed chapters, running head, margin notes, month ledes)
- ✅ Mobile pass (full-screen menu, 44px tap targets, `svh` heroes) + revamped US map (plain-language buckets, month scrubber)
- ⏳ NPS accessibility dataset (doesn't exist publicly — curve stays curated until it does)
- ⏳ True-4K hero video source (nothing found yet that clears resolution + license + content bars; hunt notes in git history)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Motion · Lenis · d3-geo/topojson (US map, server-only) · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # add your NPS API key — free, instant: https://www.nps.gov/subjects/developer/get-started.htm
npm run dev
```

```bash
npm run build   # production build
npm run test    # pure-function test suite (scoring + repo)
npm run lint
```

### Living Heroes (video heroes)

Heroes upgrade from photo to short, silent, public-domain NPS b-roll where a clip has been curated — spec in `docs/specs/living-heroes-spec.md`, manifest in `src/lib/data/video-manifest.ts`, provenance in `docs/sources.md`. A missing manifest key = photo hero, automatically.

**Sourcing rules:** official NPS pages only (nps.gov / NPGallery), page must credit NPS with no copyright symbol / third-party rights holder (e.g. Yellowstone's Video Library pages state "Copyright Info: Public domain"); 8–15s loopable, slow subject motion, no identifiable people; every clip gets a row in `docs/sources.md`.

**Encode** (never hand-encode — the script enforces the budgets):

```bash
node scripts/encode-hero-video.mjs <input.mp4> <basename> [startSec] [durationSec]
# -> public/video/<basename>-1080.mp4 (≤4.0MB), -540.mp4 (≤1.0MB), -poster.jpg + blurDataURL
```

**Politeness rules** (enforced by `LivingHero` + smoke tests): the poster is the LCP (`next/image` priority) — never the video; `<video muted loop playsInline preload="none">` gets a `src` only once in-view with reduced-motion and Save-Data both off, so opted-out users load zero video bytes; 600ms crossfade on `canplay`; pauses offscreen; mobile gets the separately-encoded 540p file; mono `Video: NPS` credit links the source page. One video mounted per page.

### Smoke testing

`e2e/smoke.spec.ts` is a 12-test Playwright audit across `/`, `/parks/acad`, `/parks/zion`, `/discover/month/oct`, `/parks`, and `/rankings` — zero console/page/network errors (this is what catches Commons hotlink 429 bursts), stable `document.body.scrollHeight` while scrolling (catches the content-visibility class of scroll-height-drift bug), no duplicate `view-transition-name`s, LCP-is-an-image on video pages, hero video plays after settling in view, reduced-motion loads zero video bytes, plus interaction checks (WhyDrawer opens with real content, a ParkCard link navigates correctly).

```bash
npm run build && npm run start &
npm run smoke
```

Against a deployed site instead of local: `BASE_URL=https://parkatlas.vercel.app npm run smoke`.

### Deploying

`NPS_API_KEY` must be set as an environment variable **on the host**, not just locally — it's gitignored and never leaves your machine otherwise. On Vercel: Project → Settings → Environment Variables → add `NPS_API_KEY` for Production, then redeploy (env vars only apply to builds that happen after they're set, since pages are statically generated at build time). Works on the free Hobby plan, no Pro required. If `NPS_API_KEY` is unset, pages degrade gracefully — live NPS profile/images/alerts sections just don't render, everything else still works.

Optionally set `NEXT_PUBLIC_SITE_URL` (e.g. `https://parkatlas.vercel.app`) so metadata, the sitemap, and OG images point at the right domain; without it, it's inferred from Vercel's own env var at build time, falling back to `localhost:3000`.

**CI** (`.github/workflows/ci.yml`) runs lint/test/build plus a Lighthouse CI pass on every push/PR — add `NPS_API_KEY` as a **repository secret** (Settings → Secrets and variables → Actions) for the build step to see live data.

**Analytics**: `@vercel/analytics` and `@vercel/speed-insights` are wired into the root layout, but Vercel's dashboard toggle (Project → Analytics / Speed Insights → Enable) still has to be flipped on manually — code alone won't turn it on.

## Media licensing & attribution

The MIT license covers the **code**. Media files under `public/` carry their own licenses and are redistributed here under those terms:

- **Photos** (`public/scroller/`, `public/cards/`, plus hotlinked heroes): Wikimedia Commons picks, public domain / CC0 / CC BY / CC BY-SA **only** — no NC/ND ever. Per-file author, license, license URL, and Commons source page live in `src/lib/data/premium-photos.json` (the registry of record), and the site renders attribution as a credit chip linking each file page. If you reuse a CC BY / CC BY-SA image from this repo, you must carry its attribution with it.
- **Video** (`public/video/`): NPS-produced, public domain — source page, on-page credit, and the public-domain evidence observed at retrieval are logged per clip in `docs/sources.md`.
- **Audio** (`public/audio/`): NPS public domain and Freesound CC0 loops — same registry, `docs/sources.md`.

Nothing in this repo is sourced from any page that claimed copyright, "courtesy of", or third-party permission; the NPS-API photo pipeline filters those out at runtime (`src/lib/nps.ts`).

## Project structure

```
src/lib/scoring.ts       # Month Fit / tier / crowd-band math — pure, tested
src/lib/repo.ts          # query layer over park_month_scores — pure, tested
src/lib/data/            # committed dataset snapshots (visitation, normals, acreage,
                         # crosswalk, premium photos + provenance _meta headers)
src/lib/provenance.ts    # asserts snapshot _meta at import; derives UI source labels
scripts/validate-datasets.mjs  # build gate — re-validates every snapshot pre-build
src/lib/nps.ts           # NPS Data API client (server-only): profile, alerts, images
src/lib/live-context.ts  # NWS weather/timezone client (server-only)
src/lib/us-map-*.ts      # US map geometry, computed server-side
src/lib/park-theme.ts    # per-park accent/silhouette/region (image-placeholder use only)
src/components/          # UI — ParkHero, YearScroller, WhyDrawer, ChapterRail,
                         # ContourField (no-photo fallback), ParksIndexList, ...
src/app/                 # routes: /, /parks, /parks/[code], /rankings, /discover/*
```
