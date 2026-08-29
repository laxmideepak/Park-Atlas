# ParkAtlas

**Which of the 63 U.S. National Parks should you visit, and when — scored on climate and access, never on popularity.**

Most "best time to visit" content is really just "when do the most people visit" in disguise. ParkAtlas inverts that: every park gets a **Month Fit** score (0–100) built from two things that actually determine whether a visit is good — **climate suitability** (60%) and **seasonal accessibility** (40%, road/facility status). Visitation never enters the score. It's shown separately, as a crowd calendar, so you can see when a park is *good* and when it's *empty* and decide for yourself how much those two things matter to you.

Every score ships with a **Why panel**: the exact component weights, the source, a data-confidence rating, and — for low-scoring months — a **Why not now?** explanation that reframes rather than just says "don't go" (Yellowstone in January isn't bad, it's a different, specialized trip).

## Design — "OVERLOOK"

A cinematic field guide: full-bleed official NPS photography and large editorial serif type (National Geographic feature-story voice) sitting directly on top of a mono-typeset "instrument" layer — tier badges, methodology versions, Why-panels — that never goes away. The photography is the story; the mono layer is the receipts.

- **Real photography everywhere**, rights-filtered: only images the NPS API credits to NPS/National Park Service itself are used (a public-domain proxy, since the raw API has no explicit rights field). Parks with no cleared image get a dignified `ContourField` fallback — topo contour lines in the park's own color — never a fake landscape.
- **The Year Scroller** (home page signature): a pinned, scroll-scrubbed journey through all 12 months, each chapter driven by the real `bestByMonth()` engine — not hardcoded. Swipe carousel on mobile, static grid under `prefers-reduced-motion`.
- **Tokens**: bone (`#EDE7DA`) / ink (`#131711`) / brass (`#B8862B`, the *only* UI accent) / glacial (`#7FA3AD`, data-secondary only). Instrument Serif + Instrument Sans + IBM Plex Mono.
- Built on Motion (scroll-linked transforms, reveals) + Lenis (smooth scroll, auto-disables under reduced motion) + the native View Transitions API for card→hero photo morphs. No GSAP, no Three.js/WebGL.

## What's real vs. estimated, honestly

This is the part most trip-planning sites don't tell you: **there is no live public API for either Month Fit input.**

- NOAA climate normals need a separate NCEI token plus per-park weather-station research.
- NPS publishes no "% of roads open per month" dataset at all, for any park.

So every Month Fit score on this site is a **curated estimate**, never a mystery number:

| Cohort | Coverage | How the numbers are made |
|---|---|---|
| **Acadia, Yellowstone, Death Valley, Great Smoky Mountains** | Full guide: hikes, water features, dining, curated tagline | Hand-authored month-by-month, informed by each park's known real seasonal patterns |
| **The other 59 parks** | Live NPS profile, fees, alerts, real photo, signature wildlife, Month Fit scoring | Deterministically estimated from climate/geography family (mountain / desert / coastal / forest) — same park always gets the same numbers, never randomized, always labeled Medium confidence with what's missing |

What genuinely **is** live: NPS park descriptions, entrance fees, photos, and current alerts (NPS Data API), plus real local time, temperature, and forecast for every park's actual location (National Weather Service — no key required).

## Phase status

- ✅ Month Fit engine (all 63 parks), Why/Why-not-now panels, Crowd Calendar, Best-Balance Month
- ✅ Interactive US map, tier-encoded pins, tap-to-zoom + summary card
- ✅ Live NPS photography (rights-filtered) + descriptions + fees + alerts, all 63 parks
- ✅ Live NWS local time/weather for every park
- ✅ OVERLOOK visual redesign (tokens, Year Scroller, park-page rebuild, index/rankings/month restyle)
- ✅ Production layer: per-page `generateMetadata` + OG images (dynamic, per park/month), `sitemap.ts`, `robots.ts`, `TouristAttraction` JSON-LD, branded `icon`/`apple-icon`, in-voice `error.tsx`/`not-found.tsx`, Vercel Analytics + Speed Insights wired, CI workflow (lint/test/build + Lighthouse CI)
- ⏳ Real NOAA normals + NPS accessibility pipeline (would replace the estimated curves above)
- ⏳ Real acreage/visitation for the 59 parks outside the editorial cohort
- ⏳ Hand-picked hero image manifest (`src/lib/data/hero-manifest.ts` — mechanism built, empty by design; needs a human to pick real NPGallery URLs)
- ⏳ Map's mobile region-list view

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
# -> public/video/<basename>-1080.mp4 (≤2.5MB), -540.mp4 (≤1.0MB), -poster.jpg + blurDataURL
```

**Politeness rules** (enforced by `LivingHero` + smoke tests): the poster is the LCP (`next/image` priority) — never the video; `<video muted loop playsInline preload="none">` gets a `src` only once in-view with reduced-motion and Save-Data both off, so opted-out users load zero video bytes; 600ms crossfade on `canplay`; pauses offscreen; mobile gets the separately-encoded 540p file; mono `Video: NPS` credit links the source page. One video mounted per page.

### Smoke testing

`e2e/smoke.spec.ts` is a Playwright audit across `/`, `/parks/acad`, `/parks/zion`, `/discover/month/oct`, `/parks`, and `/rankings` — zero console/page/network errors, stable `document.body.scrollHeight` while scrolling (catches the content-visibility class of scroll-height-drift bug), and no duplicate `view-transition-name`s on a page. Plus two interaction checks (WhyDrawer opens with real content, a ParkCard link navigates correctly).

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

## Project structure

```
src/lib/scoring.ts       # Month Fit / tier / crowd-band math — pure, tested
src/lib/repo.ts          # query layer over park_month_scores — pure, tested
src/lib/data/            # seed data: parks, wildlife, official rankings
src/lib/nps.ts           # NPS Data API client (server-only): profile, alerts, images
src/lib/live-context.ts  # NWS weather/timezone client (server-only)
src/lib/us-map-*.ts      # US map geometry, computed server-side
src/lib/park-theme.ts    # per-park accent/silhouette/region (image-placeholder use only)
src/components/          # UI — ParkHero, YearScroller, WhyDrawer, ChapterRail,
                         # ContourField (no-photo fallback), ParksIndexList, ...
src/app/                 # routes: /, /parks, /parks/[code], /rankings, /discover/*
```
