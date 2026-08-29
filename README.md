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
- ⏳ Real NOAA normals + NPS accessibility pipeline (would replace the estimated curves above)
- ⏳ Real acreage/visitation for the 59 parks outside the editorial cohort
- ⏳ Map's mobile region-list view; a Lighthouse pass against the perf/a11y budget

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

### Deploying

`NPS_API_KEY` must be set as an environment variable **on the host**, not just locally — it's gitignored and never leaves your machine otherwise. On Vercel: Project → Settings → Environment Variables → add `NPS_API_KEY` for Production, then redeploy (env vars only apply to builds that happen after they're set, since pages are statically generated at build time). Works on the free Hobby plan, no Pro required.

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
