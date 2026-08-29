# Spec: Reveal primitive + jank pass (W1 + W2)

**Status:** Approved, ready for implementation plan.
**Scope:** First of three sub-projects split out of "The Living Atlas + Field Companions" brief (2026-08-29). This spec covers only W1 (site-wide scroll-reveal) and W2 (jank fixes). The Living Atlas map revamp (W3/W4) and Field Companions wildlife animation (W5/W6) are separate specs, to be brainstormed after this one ships.

## Why

`grep -r whileInView src/` returns zero results — the OVERLOOK brief's standard reveal recipe exists nowhere in the codebase. Outside the hero and the Year Scroller (which already animate on mount), every section simply *is there* when scrolled to. Combined with Lenis's weighted smooth scroll, static pages read as "slow AND lifeless" — the smoothing adds inertia while nothing rewards the scrolling.

Separately, scroll performance has real jank on production-scale interaction: frame sampling showed ~40fps average with frames spiking past 100ms.

## Context findings (verified against current code, not assumed)

The originating brief made several claims about the codebase that turned out to be stale or partially already fixed:

- **YearScroller image windowing** — already implemented (`WINDOW = 2` in `src/components/YearScroller.tsx`), fixed in an earlier pass. Nothing to do.
- **Map pin glow** — already a plain second circle (`src/components/UsMap.tsx:89`), not an SVG `<filter>`. That specific jank fix is already done.
- **Stat-strip count-ups "already exist"** — they don't. Grepped for `countUp`/`useMotionValue` — zero real hits. Building from scratch, scoped down (see below).
- **`WildlifeCard.tsx`/`WildlifeIcon.tsx`** — exist (12-species full-body silhouette system from an earlier phase) but are unused anywhere in `src/app`, and still carry pre-OVERLOOK class names (`bg-paper`, `text-basalt-deep`). Out of scope here — relevant to the future Field Companions spec, noted for that brainstorm.
- **`sharp`** — only a transitive dependency (via another package), not installed directly. Irrelevant to this spec; relevant to the future Atlas relief-map spec.
- **No `audit2.mjs`** exists in this repo — it was the brief author's own external tool. This spec adds an equivalent, committed, re-runnable script instead of relying on an external one-off measurement.

## Architecture

Two new tiny client components. No new page-level state, no new dependencies except Playwright (dev-only, for measurement).

### `src/components/Reveal.tsx`

```
<Reveal delay?={0} y?={24} as?="div">{children}</Reveal>
<RevealGroup stagger?={0.04} cap?={5}>{children}</RevealGroup>
```

- `Reveal`: `motion[as]` (typed via a small lookup, not an unsafe string index), `initial={reduce ? false : {opacity:0, y}}`, `whileInView={{opacity:1, y:0}}`, `viewport={{once:true, amount:0.2}}`, `transition={{duration:0.6, delay, ease:[0.16,1,0.3,1]}}`. Same duration/easing already used in `HomeHero`/`ParkHero`'s on-mount reveals, so scroll-triggered content feels like the same animation language as the hero, not a second one.
- `RevealGroup`: wraps children in `Reveal`s with `delay = Math.min(index, cap) * stagger`, so a 10-item list staggers its first 5 then the rest arrive together with the 5th — no absurd multi-second stagger chains on long lists.
- Reduced motion: `Reveal`'s `initial={false}` means it renders in its final state immediately, no animation — matches the existing reduced-motion pattern in `HomeHero`/`YearScroller`.

### `src/components/CountUp.tsx`

```
<CountUp value={436000} suffix?=" ac" />
```

- `useInView` gates start; `useMotionValue(0)` → `useSpring` → subscribe via `useMotionValueEvent` to update displayed text, formatted with `toLocaleString()`.
- **Scope: one usage site only** — the park detail page's Acreage stat (`Stat` component in `src/app/parks/[parkCode]/page.tsx`). Every other "stat-strip"-shaped surface in the app (rankings-page lists, visits-per-acre table) is a dense list of per-row numbers in a scrolling list — animating each row's count would be noise, not polish. Acreage is the one genuinely clean single-number moment; over-applying this would look like a template, not a considered choice.

## Application checklist (site-wide, per the brief's own list)

Pages stay Server Components; only `Reveal`/`RevealGroup`/`CountUp` wrappers are client. Hero and Year Scroller are explicitly **not** touched — they already have working on-mount reveals; this work is only for content that today just appears with no motion.

- **Home** (`src/app/page.tsx`): the 3 post-Scroller `<section>` headings + mono subtitles (subtitle at `delay=0.06`), both `ParkCard` grids via `RevealGroup`, map legend row.
- **Park detail** (`src/app/parks/[parkCode]/page.tsx`): every section heading + subtitle, the Stat grid (with `CountUp` on Acreage), the 4 When-to-Go `FigureLabel`s, hike/must-see/dining rows via `RevealGroup`, Crowd Calendar bars (additional `scaleY 0→1` origin-bottom, 40ms stagger — the one chart flourish, done inside `CrowdCalendar.tsx` itself since the bars are already discrete elements there), current-conditions alerts.
- **Month page** (`src/app/discover/month/[month]/page.tsx`): tier-group headings + `ParkCard` grids, hidden-gems section.
- **Season page**: ranked list via `RevealGroup`.
- **Rankings page**: all 5 list sections' headings; lists themselves via `RevealGroup` (capped stagger keeps the 10-row lists sane).
- **Parks index page**: heading + intro paragraph.
- **Footer**: the "Public data. Plain answers." sign-off line.

## W2 — jank pass

Verified against current code before deciding what's actually left to do:

1. **`UsMap.tsx`**: `React.memo` the state-path `<g>` (cheap regardless, correctly signals "this never changes" to React). Gate the pin-entrance stagger animation behind `useInView` on the map `<section>` instead of firing on page mount — today pins animate in immediately even when the map is below the fold on load, which is both wasted work and a real (if minor) UX bug: the "west→east cascade" polish is spent before anyone can see it.
2. **Home page**: `content-visibility: auto; contain-intrinsic-size: auto 800px;` on the 3 below-fold `<section>`s, so their layout/paint is skipped until they're near the viewport.
3. ~~Map glow~~ — already fixed (plain circle, not SVG filter). No action.
4. ~~Year Scroller windowing~~ — already fixed. No action.

## Measurement

`scripts/audit-scroll.mjs` (new file, Playwright, dev-only devDependency):

- `npm run build && npm run start` against a real production build (matches how the original 24.8ms/40fps numbers were measured — dev-mode HMR overhead would give a false reading).
- Headless Chromium loads `/`, waits for load, then programmatically scrolls the full document height over a few seconds while sampling `requestAnimationFrame` deltas via an injected script.
- Prints avg frame time, worst frame, and count of frames >26ms — before running the W1/W2 changes and after, so the before/after comparison is real and reproducible, not a one-time claim. Committed to the repo (`npm run audit-scroll`) so it can be re-run after any future change, not just this one.

**Accept:** avg frame ≤ 18ms, frames >26ms ≤ 5, worst ≤ 60ms (matches the brief's own target). If the real numbers don't hit that after the fixes above, report the honest number rather than rounding up — same practice as the T5 static/ISR verification earlier this project.

## Testing

No changes to pure-logic files, so the existing Vitest suite (`scoring.test.ts`, `repo.test.ts`) is untouched and should still pass 32/32. `CountUp`'s formatting is a one-line `toLocaleString()` call — not worth a dedicated test file for that alone.

## Out of scope (belongs to a later spec)

- The Living Atlas map revamp (terrain relief, entrance choreography beyond the two W2 fixes above, month scrubber, layers, region panel) — W3/W4.
- Field Companions wildlife animation system, and the decision on what to do with the currently-unused `WildlifeCard`/`WildlifeIcon` — W5/W6.
