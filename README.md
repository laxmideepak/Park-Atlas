# ParkAtlas

**Which of the 63 U.S. National Parks should you visit, and when — scored on climate and access, never on popularity.**

Most "best time to visit" content is really just "when do the most people visit" in disguise. ParkAtlas inverts that: every park gets a **Month Fit** score (0–100) built from two things that actually determine whether a visit is good — **climate suitability** (60%) and **seasonal accessibility** (40%, road/facility status). Visitation never enters the score. It's shown separately, as a crowd calendar, so you can see when a park is *good* and when it's *empty* and decide for yourself how much those two things matter to you.

Every score ships with a **Why panel**: the exact component weights, the source, a data-confidence rating, and — for low-scoring months — a **Why not now?** explanation that reframes rather than just says "don't go" (Yellowstone in January isn't bad, it's a different, specialized trip).

## What's real vs. estimated, honestly

This is the part most trip-planning sites don't tell you: **there is no live public API for either input.**

- NOAA climate normals need a separate NCEI token plus per-park weather-station research.
- NPS publishes no "% of roads open per month" dataset at all, for any park.

So every Month Fit score on this site is a **curated estimate**, never a mystery number:

| Cohort | Coverage | How the numbers are made |
|---|---|---|
| **Acadia, Yellowstone, Death Valley, Great Smoky Mountains** | Full guide: hikes, water features, dining, curated tagline | Hand-authored month-by-month, informed by each park's known real seasonal patterns |
| **The other 59 parks** | Live NPS profile, fees, alerts, signature wildlife, Month Fit scoring | Deterministically estimated from climate/geography family (mountain / desert / coastal / forest) — same park always gets the same numbers, never randomized, always labeled Medium confidence with what's missing |

What genuinely **is** live: NPS park descriptions, entrance fees, and current alerts (NPS Data API), plus real local time, temperature, and forecast for every park's actual location (National Weather Service — no key required).

## Phase status

- ✅ Month Fit engine, Why/Why-not-now panels, Crowd Calendar, Best-Balance Month
- ✅ Interactive US map (real state geometry, computed server-side) with signature wildlife per park
- ✅ Live NPS + NWS data for all 63 parks
- ⏳ Real NOAA normals + NPS accessibility pipeline (would replace the estimated curves above)
- ⏳ Real acreage/visitation for the 59 parks outside the editorial cohort

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · Motion (Framer Motion) · d3-geo/topojson (US map, server-only) · Vitest

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

## Project structure

```
src/lib/scoring.ts       # Month Fit / tier / crowd-band math — pure, tested
src/lib/repo.ts          # query layer over park_month_scores — pure, tested
src/lib/data/            # seed data: parks, wildlife, official rankings
src/lib/nps.ts           # NPS Data API client (server-only)
src/lib/live-context.ts  # NWS weather/timezone client (server-only)
src/lib/us-map-*.ts      # US map geometry, computed server-side
src/components/          # UI, incl. ParkScape (illustrated skylines) and WhyPanel
src/app/                 # routes: /, /parks, /parks/[code], /rankings, /discover/*
```
