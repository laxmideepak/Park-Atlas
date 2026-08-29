# Research: Interactive US Map + "Feels Like a National Park" Redesign

> **Note on convention:** this is the first file in `docs/research/`. There was no existing notes
> convention in this repo before now — treating this as the template for future research docs:
> Summary up top, tables for comparisons, sources inline, a concrete punch list at the end.

Researched 2026-08-28. Compiled from live sites and primary docs (Awwwards, GitHub, official
library docs, nps.gov, loc.gov) — see inline citations. Confirmed current ParkAtlas stack before
writing the punch list: Next.js 16 (App Router) + React 19 + Tailwind v4, **zero client-side
dependencies in `package.json`, zero `'use client'` files in the repo today.** That constraint
drives most of the recommendations below.

---

## Summary / Recommendation

Don't chase a WebGL "real map" — it fights the illustrated, hand-drawn aesthetic ParkAtlas already
has and it's the wrong tool for 63 known points on one country. Build the US map as **hand-authored
SVG (d3-geo projecting a US topojson at build/dev time, output committed as static paths) with a
thin **React island** for interaction** — no Mapbox/MapLibre, no react-simple-maps runtime
dependency if you want to keep it lean, though react-simple-maps is a perfectly reasonable
alternative if you'd rather not hand-roll the projection math. Animate with **Motion (Framer
Motion)** confined to a handful of `'use client'` leaf components (the map, the Month Dial, park
detail transitions) — this is the first library ParkAtlas should adopt, since it's the only one of
the four animation options that's actually idiomatic inside RSC (server page renders, one small
client wrapper animates). Skip GSAP/ScrollTrigger and Lenis for v1: they're genuinely free now and
excellent, but they're built for full-page scroll-hijacking storytelling sites (see Floema, Diamond
Rose Sanctuary below) — a different genre than a data-driven trip-planning tool, and they add a
second animation paradigm alongside Motion for no clear win. For the "feels like an actual national
park" brief, the highest-leverage, lowest-risk move is leaning into **WPA National Park poster
style** (flat color, bold linework, limited earthy-plus-accent palettes) and **NPS Unigrid**
conventions (black identity bands, confident grid, Frutiger/Rawlinson-style geometric sans) layered
over a subtle topographic contour-line texture — all achievable in pure SVG/CSS with no new runtime
dependency at all.

---

## Site-by-site findings

All of these were pulled live from Awwwards project pages on 2026-08-28 (URLs cited per row). None
are National Park Service sites — no official NPS partner site or state tourism board appears to
have won an Awwwards/FWA award; the closest matches are tourism-board sites recognized by other
award bodies (noted below the table).

| Site | URL | What it does well (concrete) | What to avoid |
|---|---|---|---|
| **100 Years of National Parks** (Dallas Barnes, Awwwards Honorable Mention 2016) | [awwwards.com/sites/100-years-of-national-parks](https://www.awwwards.com/sites/100-years-of-national-parks) | Interactive timeline of NPS history; restrained 3-color palette (black / warm brown #987654 / white) proves a nature site doesn't need to be photo-heavy or loud to read as "national park." Directly relevant precedent for an illustrated, non-photographic park site. | Site is 10 years old and minimal by today's standard — don't treat it as an interaction-pattern reference, just a palette/tone one. |
| **National Parks** (Joe Lee, Awwwards Honorable Mention Aug 2023) | [awwwards.com/sites/national-parks](https://www.awwwards.com/sites/national-parks) | Online archive of the world's most-visited parks with an **interactive map for exploring park locations**, animated gallery, sidebar nav, smooth page-to-page transitions. Closest direct comp to ParkAtlas's "click a pin, surface a park" feature. | Minimal palette (black/off-white) works for a gallery-first site but would fight ParkAtlas's illustrated color skylines — don't copy the palette, copy the map-to-detail interaction flow. |
| **armenia.travel** (Concept Studio, Honorable Mention Jan 2026) | [awwwards.com/sites/armenia-travel](https://www.awwwards.com/sites/armenia-travel) | Official tourism-board site, built React/Next.js/Node — proof a government/tourism site can hit Awwwards with mainstream stack. Confident 2-color palette (navy #15233B + gold #F59C00), hero scroll animation, strong photo/video integration. | Heavy reliance on photography — not applicable to ParkAtlas's illustrated-only art direction; treat as a proof of "tourism sites can be award-caliber," not a visual reference. |
| **Floema** (Bürocratik, Site of the Day May 2026) | [awwwards.com/sites/floema](https://www.awwwards.com/sites/floema) | Sustainable outdoor-furniture brand. Scroll-triggered video zoom, 3D material viewer, WebGL + GSAP-driven header animation, bold 2-color palette (#E9E778 warm yellow / #241F21 charcoal). Best-in-class example of GSAP+WebGL storytelling done tastefully. | Full WebGL/3D stack is a big lift for a solo dev and a poor fit for an "illustrated, not photographic" brief — admire the restraint of the palette, skip the 3D tooling. |
| **Nature Beyond Technology** (Robin Navas, Honorable Mention Nov 2025) | [awwwards.com/sites/nature-beyond-technology](https://www.awwwards.com/sites/nature-beyond-technology) | Drag-and-drop tree interactions, particle/rain effects, Three.js + Blender assets — genuinely playful, gamified nature storytelling. | Awwwards' own reviewers flagged it: "heavy reliance on WebGL and 3D graphics may impact load performance on lower-end devices" — exactly the gimmick-that-hurts-usability trap the brief warns against. Don't import Three.js for pin hover states. |
| **Vertdure** (Mambo Mambo, Honorable Mention Jan 2026) | [awwwards.com/sites/vertdure](https://www.awwwards.com/sites/vertdure) | Lawn-care brand that reads as genuinely **playful**: bento grid, marquee, scroll-triggered micro-interactions, saturated green/yellow palette (#56AF31 / #FFE900). Good proof that "playful outdoors" doesn't require restraint — bold color + friendly type can still feel premium. | Bento-grid/e-commerce layout patterns don't map cleanly onto a trip-planning tool; take the *tone* (playful micro-interactions, saturated palette), not the layout. |
| **Airfield La Caminera** (Jota Marques + PAISANA Studio, Honorable Mention Jun 2026) | [awwwards.com/sites/airfield-la-caminera](https://www.awwwards.com/sites/airfield-la-caminera) | "Luxury of landing in nature" concept site — earthy 2-color palette (#6B5942 brown / #1A1A1A charcoal), clean minimal microinteractions, no framework overkill (CSS3 + JS only). Good evidence that earthy/natural palettes plus light CSS animation alone can win awards — no WebGL required. | Pure lookbook/storytelling site, no functional interactive feature (no map, no state) — a tone reference only. |
| **Diamond Rose Sanctuary** (Artemii Lebedev, Honorable Mention Apr 2026) | [awwwards.com/sites/diamond-rose-sanctuary](https://www.awwwards.com/sites/diamond-rose-sanctuary) | Nature-retreat site, Webflow + GSAP + Cinema 4D. Layered 3D scroll sequences, warm beige/charcoal palette (#DFD7C9 / #303030). Shows GSAP-driven layered scroll as the dominant pattern in this genre in 2026. | Cinema 4D asset pipeline is out of scope for an illustrated-SVG site; the palette (warm neutral + near-black) is a more transferable takeaway than the 3D technique. |
| **Visit California** (Appnovation redesign, MUSE + UX Design Awards, not Awwwards) | [ux-design-awards.com/winners/visit-california-full-website-redesign](https://ux-design-awards.com/winners/visit-california-full-website-redesign) | Card-based, mobile-first tourism-board redesign; explicitly optimized for findability (+15% per case study) over spectacle. Useful counter-example: award recognition for tourism sites often comes from UX-focused bodies (MUSE, UX Design Awards), not Awwwards/FWA, and rewards restraint over flash. | Doesn't have a from-scratch interactive map feature per the case study — don't treat as a map-implementation reference. |

**On NPS/state-tourism specifically:** no evidence found of an official NPS partner microsite or a
state "Visit ___" campaign site winning an Awwwards Site of the Day/Month or FWA award as of
2026-08-28 — [awwwards.com/inspiration_search/nature/](https://www.awwwards.com/inspiration_search/nature/)
and the "Interactive Maps" Awwwards collection ([awwwards.com/awwwards/collections/maps-geolocation-streetview/](https://www.awwwards.com/awwwards/collections/maps-geolocation-streetview/))
turn up nature/eco-brand sites, not government tourism properties. Tourism-board recognition (Visit
California, VisitNH.gov) comes from separate, UX-focused award circuits, not the design-forward
Awwwards/FWA world. Treat that as a genre gap ParkAtlas can actually fill rather than something to
copy.

**General "avoid" list across all sites above:** slow-loading WebGL/3D intros, drag-and-drop
gimmicks that don't map to real navigation, scroll-hijacking that breaks native browser scroll,
and cursor-replacement effects that break on touch devices — every one of these appears in at least
one honorable-mention/Site-of-the-Day winner above, so awards don't guarantee usability.

---

## Map library comparison

| Option | Bundle / perf | Pins, hover, pan/zoom | Fits illustrated aesthetic? | License / cost | Source |
|---|---|---|---|---|---|
| **react-simple-maps** | ~34.8 kB min+gzip per Bundlephobia (pulls in d3-geo, d3-selection, d3-zoom, topojson-client) | Yes — dedicated `Marker`, `Geography` (hover via normal React events), and `ZoomableGroup` (+ `useZoomPan` hook) components | **Best fit.** Pure SVG output — every state/pin is a styleable DOM node, so it composes naturally with hand-drawn SVG illustrations already used for park skylines | MIT | [react-simple-maps.io/docs/getting-started](https://www.react-simple-maps.io/docs/getting-started/), [github.com/zcreativelabs/react-simple-maps](https://github.com/zcreativelabs/react-simple-maps) |
| **d3-geo + hand-rolled SVG** (no react-simple-maps wrapper) | Smallest possible — import only `d3-geo` (projection + path) and `topojson-client`, skip d3-selection/d3-zoom if you roll your own zoom | Full control, but you write the hover/pan/zoom code yourself | **Best fit**, same reasoning as above, more work for more control | ISC (d3-geo) | [github.com](https://github.com/) search results on d3-geo react choropleth patterns; no single canonical doc, multiple tutorials confirm the pattern |
| **Mapbox GL JS** | WebGL, real vector-tile basemap; heavier runtime, needs internet + API key at runtime | Yes, mature marker/popup API, native pan/zoom/fly-to | **Poor fit** — a real photographic/cartographic basemap visually clashes with "hand-drawn illustrated, not photographic" | Free to 50,000 map loads/mo, then $5/1,000 (50k–100k), scaling down to $2.50/1,000 above 1M | [docs.mapbox.com/accounts/guides/pricing](https://docs.mapbox.com/accounts/guides/pricing/), [mapbox.com/pricing](https://www.mapbox.com/pricing/) |
| **MapLibre GL JS** | Same WebGL engine class as Mapbox GL v1, open-source fork | Same marker/pan/zoom capability as Mapbox GL | **Poor fit**, same reasoning — real basemap tiles fight the illustrated art direction | Free, 3-Clause BSD (forked from Mapbox GL JS before its Dec 2020 license change) | [github.com/maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js), [maptiler.com/news/2021/01/maplibre-mapbox-gl-open-source-fork](https://www.maptiler.com/news/2021/01/maplibre-mapbox-gl-open-source-fork/) |
| **usa-map-react / react-usa-map / react-usa-map-select** (off-the-shelf illustrated US map components) | Small, purpose-built, no d3 dependency in some (e.g. `react-usa-map` advertises "no D3 needed") | Click handling + per-state customization/styling in all three; hover states vary by library, check each README | Good fit for a fast v1 (pre-made US state SVG paths), but generic and not park-pin-specific — would still need a custom pin-marker layer on top | MIT (all three, per GitHub) | [github.com/MiraWision/usa-map-react](https://github.com/MiraWision/usa-map-react), [github.com/gabidavila/react-usa-map](https://github.com/gabidavila/react-usa-map), [github.com/token-ed/react-usa-map-select](https://github.com/token-ed/react-usa-map-select) |
| **kaohman/national-parks** (existing open-source reference app) | N/A (reference only, not a library) | Interactive map of all 58 US National Parks (pre-Jan 2025 park count), save-to-list feature — directly relevant prior art for exactly ParkAtlas's problem | Illustrated-friendly since it's just an app, not a design system | Check repo license before reusing any code | [github.com/kaohman/national-parks](https://github.com/kaohman/national-parks) |

**Recommendation:** react-simple-maps (or bare d3-geo if you want zero extra deps) over a
pre-made US map component, because ParkAtlas needs park **pins**, not just clickable state shapes
— the state click is secondary to the pin click per the brief ("clicking/hovering a state **or
park pin**"). A topojson US states file is the only new "asset," and it can be fetched/processed at
build time so no runtime geo-processing cost is paid by the client.

---

## Animation library comparison

| Option | RSC / App Router fit | Bundle | Reduced-motion support | Notes |
|---|---|---|---|---|
| **Motion (Framer Motion)** | Requires `'use client'` on any component using `motion.*` — the `motion` component needs DOM access Server Components don't have. Standard pattern: keep the page a Server Component, wrap only the animated leaf in a small client component. | Moderate; tree-shakeable, "mini" bundle available | Built-in `useReducedMotion` hook; respects `prefers-reduced-motion` when wired up | Confirmed via GitHub issue thread requesting `'use client'` directives be added upstream — as of research date you still add the directive yourself in consuming code. [github.com/framer/motion/issues/2054](https://github.com/framer/motion/issues/2054), [hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components) |
| **GSAP + ScrollTrigger** | No React-specific RSC constraint (imperative API, not component-based), but any code touching it must run client-side — same `'use client'` boundary needed | Core is small; all plugins (ScrollTrigger, SplitText, MorphSVG, DrawSVG, ScrollSmoother, Inertia) now bundled free | No automatic reduced-motion handling — you must gate `gsap.to()` calls yourself behind a `matchMedia('(prefers-reduced-motion: reduce)')` check | **License update, verified 2026-08-28:** Webflow acquired GreenSock in fall 2024; as of **April 30, 2025** GSAP is 100% free, including every formerly-paid Club GreenSock plugin, for commercial use. Only remaining restriction: you can't build a competing no-code visual-animation-builder product with it, or resell GSAP itself. [gsap.com/community/standard-license](https://gsap.com/community/standard-license/), [webflow.com/blog/gsap-becomes-free](https://webflow.com/blog/gsap-becomes-free) |
| **Lenis** | Framework-agnostic; has a React adapter | "A few KB," zero runtime dependencies | **Automatically disables smoothing and makes programmatic scrolls instant when `prefers-reduced-motion` is set** — best-in-class default here | Pairs with GSAP ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)`. [github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) |
| **CSS-only / View Transitions API** | Next.js 15+/React 19.2 has first-class support (`nextjs.org/docs/app/guides/view-transitions`); falls back to instant navigation gracefully on unsupported browsers (works in Chromium 125+, recent Safari/Firefox) | Zero JS bundle cost — native browser API | Straightforward: zero out `::view-transition-*` animations inside a `prefers-reduced-motion: reduce` media query, keep the DOM update | [nextjs.org/docs/app/guides/view-transitions](https://nextjs.org/docs/app/guides/view-transitions), reduced-motion pattern confirmed across multiple 2026 guides |

**Which combination the Awwwards sites above actually use:** GSAP (+ WebGL/Three.js for the more
experimental ones) dominates this genre — Floema and Diamond Rose Sanctuary both explicitly tag
GSAP; Nature Beyond Technology uses Three.js. None of the sites researched advertise Framer
Motion/Motion or Lenis in their public tech tags, though Lenis is very commonly paired with GSAP in
this space per multiple 2026 dev guides (not from the specific sites above, but from the broader
GSAP+Lenis ecosystem, e.g. [devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap)).

**Trade-off for ParkAtlas specifically:** the site is currently 100% RSC with no client
JavaScript at all. Every one of these libraries except native View Transitions requires opting
individual components into `'use client'`. Motion is the gentlest opt-in (component-scoped,
declarative, one hook for reduced motion) and has the smallest conceptual surface for a solo dev
adding animation to a handful of places (map pins, dial ticks, card entrances) rather than
building a full scroll-driven narrative site. GSAP+Lenis is the right call only if the redesign
grows into genuine scroll-storytelling (e.g., a full-bleed parallax "choose your park" landing
sequence) — worth revisiting post-v1, not day one.

---

## National park visual motifs

- **NPS Unigrid system** — the standardized brochure design system NPS has used since 1977,
  created with modernist designer Massimo Vignelli (Publications Chief Vincent Gleason led the
  effort). Core, verifiable elements: a modular grid built from 4×8¼-inch panels (arranged 1–2
  panels wide, up to 6 long), a **black identity band across the top of every brochure** (the NPS
  arrowhead has appeared inside that band since 1999), and a defined typographic system — originally
  Helvetica/Times Roman, later standardized on **Frutiger + NPS Rawlinson** (a typeface
  commissioned from Terminal Design in 2000 specifically to feel "fresh and lively" while
  respecting NPS history). The system won a Presidential Design Award in 1985.
  [nps.gov/subjects/hfc/a-brief-history-of-the-unigrid.htm](https://www.nps.gov/subjects/hfc/a-brief-history-of-the-unigrid.htm),
  [nps.gov/subjects/hfc/nps-graphic-identity-and-style-guides.htm](https://www.nps.gov/subjects/hfc/nps-graphic-identity-and-style-guides.htm)
  — **directly transferable to ParkAtlas:** a confident black (or "basalt") header band with the
  park name/arrowhead-style mark, and a real grid discipline instead of ad hoc card layouts, is
  on-brand and free to imitate (it's a design system, not a copyrighted asset).

- **WPA National Park poster style** — Federal Art Project (Works Progress Administration,
  1935–1943) produced roughly 14 National Park poster designs (two artists: Chester Don Powell and
  printer Dale Miller, working out of a Berkeley NPS office). This is the single most commonly
  cited aesthetic reference for "national park branding" in design writeups. **Important legal
  nuance surfaced in research: only 5 of the original WPA National Park posters are confirmed
  public domain** — not all WPA posters are automatically free to use, so don't assume the whole
  original set is fair game. What *is* safely public domain and reusable: the Library of Congress's
  own "Free to Use and Reuse: WPA Posters" curated collection.
  [loc.gov/free-to-use/wpa-posters](https://www.loc.gov/free-to-use/wpa-posters) (confirm rights
  status per-image on that page before use) and
  [medium.com/siren-apparel-press](https://medium.com/siren-apparel-press/the-search-for-the-original-14-national-park-posters-from-the-works-progress-administration-cfbb0ff6f0cf)
  for the "only 5 public domain" caveat. **The safest and most on-brief move is not to reuse actual
  WPA images at all, but to imitate the *style*** (flat 3–4 color illustration, bold simplified
  linework, WPA-era geometric type) in ParkAtlas's own hand-drawn SVGs — style isn't copyrightable,
  only the specific artworks are.

- **Topographic contour-line texture** — genuinely on-trend right now as a background/texture
  device for outdoor-brand and data-viz sites. Achievable with **pure CSS** via
  `repeating-radial-gradient` (concentric rings mimicking elevation lines) — zero image assets,
  zero JS, negligible page weight.
  [blog.spoongraphics.co.uk/freebies/8-free-seamless-vector-topographic-map-patterns](https://blog.spoongraphics.co.uk/freebies/8-free-seamless-vector-topographic-map-patterns)
  and the CSS pattern technique at
  [cssshowcase.com/snippets/color/topographic-lines](https://www.cssshowcase.com/snippets/color/topographic-lines).
  This is the cheapest, lowest-risk texture upgrade available — it costs nothing in bundle size and
  reads immediately as "outdoor/terrain," reinforcing the Month Dial and map without adding new
  dependencies.

- **REI / Patagonia / Cotopaxi** — checked per the brief's "only if genuinely relevant" caveat.
  Couldn't find primary-source detail on their actual *web design* systems (search results were
  product/brand-positioning pages, not design case studies), so treat this as weak evidence only.
  What is fair to take from brand positioning alone: Cotopaxi is explicitly the "playful, colorful"
  outdoor brand (bright, saturated palette) versus Patagonia's more restrained earthy palette — a
  useful two-point spectrum for calibrating how far "playful" should push ParkAtlas's existing dark
  basalt scheme, but not a set of concrete techniques to copy.

---

## What to actually keep for ParkAtlas (priority order)

1. **Build the US map as SVG (react-simple-maps or hand-rolled d3-geo), not Mapbox/MapLibre.**
   ParkAtlas is illustrated-not-photographic by design; a WebGL basemap with satellite/street tiles
   directly contradicts that art direction, and it's the only option here that costs money at scale
   (Mapbox: free to 50k loads/mo, then billed — [docs.mapbox.com/accounts/guides/pricing](https://docs.mapbox.com/accounts/guides/pricing/)).
   SVG paths also compose naturally with the existing hand-drawn park skylines.

2. **Adopt Motion (Framer Motion), scoped to a handful of `'use client'` leaf components — not
   site-wide.** This is the only animation option that fits cleanly into an RSC-first codebase with
   zero existing client components: pages stay Server Components, only the map, the Month Dial, and
   park-card transitions become small client islands. Has a built-in `useReducedMotion` hook, so
   accessibility isn't bolted on.

3. **Use native View Transitions API for page-to-page navigation (park list → park detail) before
   reaching for a JS library for that specific transition.** Next.js has first-party support, it's
   zero bundle cost, and it degrades gracefully (instant nav) on unsupported browsers — the cheapest
   possible upgrade to "feels alive" for the biggest navigation path in a trip-planning site.

4. **Steal WPA poster *style* (flat color blocks, bold outlines, 3–4 color earthy+accent palettes),
   not actual WPA images.** Directly on-brief for "feels like an actual national park," zero new
   dependencies (it's an art-direction instruction for the existing hand-drawn SVG illustrations,
   not a library), and legally uncomplicated since only style is being borrowed — verified that only
   5 of the original WPA park posters are confirmed public domain, so don't trace or embed the actual
   historical artworks.

5. **Adopt NPS Unigrid conventions for structure: a confident black header band + real grid
   discipline + a Frutiger/geometric-sans-style type pairing.** Free, official, easy to imitate as a
   design system (not copyrightable), and it's the fastest way to make "plain data-card layouts"
   stop looking like a dashboard — this is a layout/typography change, not a new dependency.

6. **Add a topographic contour-line background texture via pure CSS
   (`repeating-radial-gradient`), no image assets, no JS.** Reinforces "natural, textured, alive"
   at effectively zero performance cost — the single cheapest visual upgrade on this whole list.

7. **Hold off on GSAP + ScrollTrigger + Lenis for v1.** It's the dominant stack among the
   Awwwards-winning sites researched (Floema, Diamond Rose Sanctuary), it's now genuinely free for
   commercial use as of April 2025, and Lenis has excellent reduced-motion defaults out of the box —
   but it's built for full-page scroll-hijacking storytelling, a different genre than a
   trip-planning tool with a data core. Revisit only if the redesign grows a genuine full-bleed
   scroll-narrative landing sequence; don't add a second animation paradigm alongside Motion for
   marginal gain.

8. **Do not add Three.js/WebGL 3D effects (drag-and-drop trees, particle systems, Cinema 4D
   assets).** Awwwards' own judges flagged the closest example (Nature Beyond Technology) for
   likely poor performance on lower-end devices — exactly the "gimmick that hurts usability" the
   brief explicitly warns against, and a poor fit for a fast, accessible trip-planning tool.
