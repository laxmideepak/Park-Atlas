# Reveal Primitive + Jank Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide scroll-reveal system (`Reveal`/`RevealGroup`/`CountUp`) to every section that currently just appears with no motion, and fix three verified jank sources on the home page's map, so scrolling ParkAtlas feels alive instead of inert.

**Architecture:** Two new tiny client components (`Reveal`/`RevealGroup` wrapping `whileInView`, `CountUp` wrapping a gated spring) get applied across 7 page files and 2 shared components (`CrowdCalendar`, `UsMap`). No new runtime dependency — only Playwright as a dev-only measurement tool. Pages stay Server Components; only the wrapper components are client.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, `motion` (framer-motion) via `motion/react`, Playwright (new devDependency, measurement only).

**Spec:** `docs/superpowers/specs/2026-08-29-reveal-jank-pass-design.md`

---

## Task 1: Baseline scroll-jank measurement

**Files:**
- Create: `scripts/audit-scroll.mjs`
- Modify: `package.json` (add `audit-scroll` script + `playwright` devDependency)

- [x] **Step 1: Install Playwright and its browser binary**

Run:
```bash
npm install -D playwright
npx playwright install chromium
```
Expected: both commands exit 0. `playwright` appears under `devDependencies` in `package.json`.

- [x] **Step 2: Write the audit script**

Create `scripts/audit-scroll.mjs`:

```js
import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3000/";
const FRAMES_TO_SAMPLE = 240;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "load" });

  const frameDeltas = await page.evaluate(async (frameCount) => {
    const deltas = [];
    let last = performance.now();

    const collect = () =>
      new Promise((resolve) => {
        function frame(t) {
          deltas.push(t - last);
          last = t;
          if (deltas.length < frameCount) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });

    const total = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const steps = 60;
    const perStep = total / steps;
    let step = 0;
    const scrollLoop = setInterval(() => {
      step++;
      window.scrollBy(0, perStep);
      if (step >= steps) clearInterval(scrollLoop);
    }, 33);

    await collect();
    clearInterval(scrollLoop);
    return deltas;
  }, FRAMES_TO_SAMPLE);

  await browser.close();

  const avg = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
  const worst = Math.max(...frameDeltas);
  const over26 = frameDeltas.filter((d) => d > 26).length;

  console.log(`URL: ${URL}`);
  console.log(`Frames sampled: ${frameDeltas.length}`);
  console.log(`Avg frame: ${avg.toFixed(1)}ms`);
  console.log(`Worst frame: ${worst.toFixed(1)}ms`);
  console.log(`Frames >26ms: ${over26}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [x] **Step 3: Add the npm script**

In `package.json`, inside `"scripts"`, add (after `"pick-hero-manifest"`):
```json
    "audit-scroll": "node scripts/audit-scroll.mjs"
```

- [x] **Step 4: Capture the BEFORE baseline**

Run:
```bash
npm run build
npm run start &
sleep 2
npm run audit-scroll
kill %1
```
Expected: prints `Avg frame:`, `Worst frame:`, `Frames >26ms:` lines. **Write these three numbers down** (in your task notes / PR description) — they're the "before" numbers Task 14 compares against. Do not commit them anywhere as code; they're a spoken record for the final report only.

- [x] **Step 5: Commit**

```bash
git add scripts/audit-scroll.mjs package.json package-lock.json
git commit -m "Add scripts/audit-scroll.mjs: reproducible scroll frame-timing measurement"
```

---

## Task 2: `Reveal` / `RevealGroup` primitive

**Files:**
- Create: `src/components/Reveal.tsx`

- [x] **Step 1: Write the component**

```tsx
"use client";

import { createElement, Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const REVEAL_TAGS = {
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  li: motion.li,
  span: motion.span,
} as const;

type RevealTag = keyof typeof REVEAL_TAGS;

/** Wraps a single element with the site's one scroll-reveal recipe: fade + rise
 * 24px, once, 20% in view, 0.6s, same easing as the hero/Scroller on-mount
 * reveals so scroll-triggered content reads as the same animation language. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  as = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: RevealTag;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const Tag = REVEAL_TAGS[as];
  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Staggers a list of children, capping the stagger at `cap` items so a long
 * list doesn't take seconds to finish revealing — item 6+ arrives alongside
 * item `cap`. Renders `as` as the real container element (e.g. the actual
 * grid div, or an `<ol>`) and `itemAs` as each child's wrapper (e.g. `<li>` —
 * must match what a valid child of `as` is). If a child is a keyed element
 * (including a `<Fragment key={...}>`), that key carries over to its wrapper. */
export function RevealGroup({
  children,
  stagger = 0.04,
  cap = 5,
  as = "div",
  className,
  style,
  itemAs = "div",
  itemClassName,
}: {
  children: ReactNode;
  stagger?: number;
  cap?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  style?: CSSProperties;
  itemAs?: RevealTag;
  itemClassName?: string;
}) {
  const items = Children.toArray(children);
  return createElement(
    as,
    { className, style },
    items.map((child, i) => (
      <Reveal
        key={isValidElement(child) && child.key != null ? child.key : i}
        delay={Math.min(i, cap) * stagger}
        as={itemAs}
        className={itemClassName}
      >
        {child}
      </Reveal>
    ))
  );
}
```

- [x] **Step 2: Verify it type-checks and lints**

Run: `npm run build`
Expected: build succeeds (this file isn't imported anywhere yet, so it only needs to compile standalone — Next's TypeScript pass covers unimported files in `src/`).

Run: `npm run lint`
Expected: no errors.

- [x] **Step 3: Commit**

```bash
git add src/components/Reveal.tsx
git commit -m "Add Reveal/RevealGroup scroll-reveal primitive"
```

---

## Task 3: `CountUp` component

**Files:**
- Create: `src/components/CountUp.tsx`

- [x] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring, useMotionValueEvent, useReducedMotion } from "motion/react";

/** A number that counts up from 0 once it scrolls into view. Reduced motion
 * renders the final value immediately, no animation. Scoped intentionally to
 * single clean numeric values (e.g. acreage) — see the design spec for why
 * this isn't applied to every number on the site. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (reduce) {
      setDisplay(value.toLocaleString());
    } else if (inView) {
      motionValue.set(value);
    }
  }, [inView, reduce, value, motionValue]);

  useMotionValueEvent(spring, "change", (v) => {
    if (!reduce) setDisplay(Math.round(v).toLocaleString());
  });

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
```

- [x] **Step 2: Verify it type-checks and lints**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [x] **Step 3: Commit**

```bash
git add src/components/CountUp.tsx
git commit -m "Add CountUp component"
```

---

## Task 4: `ParkCard` — add `h-full` (prerequisite for grid `RevealGroup` usage)

**Files:**
- Modify: `src/components/ParkCard.tsx:14`

**Why:** `RevealGroup` wraps each grid child in its own wrapper div. CSS Grid's default `align-items: stretch` stretches that *wrapper* to the row's full height, but `ParkCard`'s own root div (height:auto) won't automatically fill the taller wrapper unless it also has `h-full` — without this, cards in the same row would end up misaligned/different heights instead of the current equal-height look.

- [x] **Step 1: Edit the root div's className**

In `src/components/ParkCard.tsx`, change line 14:
```tsx
    <div className="bg-bone-deep text-ink rounded-sm overflow-hidden flex flex-col">
```
to:
```tsx
    <div className="bg-bone-deep text-ink rounded-sm overflow-hidden flex flex-col h-full">
```

- [x] **Step 2: Verify no visual regression on a page that already uses ParkCard**

Run: `npm run dev` (if not already running), then in another terminal:
```bash
curl -s http://localhost:3000/ | grep -o 'bg-bone-deep[^"]*' | head -1
```
Expected: output includes `h-full`.

- [x] **Step 3: Commit**

```bash
git add src/components/ParkCard.tsx
git commit -m "ParkCard: add h-full (prerequisite for RevealGroup grid wrapping)"
```

---

## Task 5: `UsMap.tsx` jank fixes

**Files:**
- Modify: `src/components/UsMap.tsx`

- [x] **Step 1: Memo the state-path layer**

At the top of `src/components/UsMap.tsx`, change:
```tsx
"use client";

import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { StatePath } from "@/lib/us-map-geo";
import type { MapPin } from "@/lib/us-map-pins";
import type { Tier } from "@/lib/types";
import { MapSummaryCard } from "./MapSummaryCard";
```
to:
```tsx
"use client";

import { useRef, useState, memo } from "react";
import { motion, useReducedMotion, useInView, AnimatePresence } from "motion/react";
import type { StatePath } from "@/lib/us-map-geo";
import type { MapPin } from "@/lib/us-map-pins";
import type { Tier } from "@/lib/types";
import { MapSummaryCard } from "./MapSummaryCard";
```

Then, still in `UsMap.tsx`, replace the state-path rendering:
```tsx
          <g>
            {statePaths.map((sp) => (
              <path key={sp.id} d={sp.d} fill="var(--ink-deep, #1c211a)" stroke="var(--bone)" strokeOpacity={0.08} strokeWidth={1} />
            ))}
          </g>
```
with a call to a new memoized sibling component defined below:
```tsx
          <StatePaths statePaths={statePaths} />
```

Add this component at the bottom of the file (after the closing brace of `UsMap`):
```tsx
const StatePaths = memo(function StatePaths({ statePaths }: { statePaths: StatePath[] }) {
  return (
    <g>
      {statePaths.map((sp) => (
        <path key={sp.id} d={sp.d} fill="var(--ink-deep, #1c211a)" stroke="var(--bone)" strokeOpacity={0.08} strokeWidth={1} />
      ))}
    </g>
  );
});
```

- [x] **Step 2: Gate the pin-entrance stagger behind in-view instead of mount**

Today the pins' `initial`/`animate` fire on component mount, even if the map section is below the fold on page load — wasting the entrance polish before anyone scrolls to it. Change the component body: add a ref and `useInView` near the top of `UsMap`:

Find:
```tsx
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
```
Replace with:
```tsx
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });
```

Find the outer wrapper div's opening tag:
```tsx
  return (
    <div className="relative w-full">
```
Replace with:
```tsx
  return (
    <div ref={sectionRef} className="relative w-full">
```

Find the pin's `motion.g`:
```tsx
                <motion.g
                  key={pin.code}
                  initial={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: i * 0.012, type: "spring", stiffness: 320, damping: 22 }}
```
Replace with:
```tsx
                <motion.g
                  key={pin.code}
                  initial={reduceMotion ? undefined : { scale: 0, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : undefined}
                  transition={reduceMotion ? { duration: 0 } : { delay: i * 0.012, type: "spring", stiffness: 320, damping: 22 }}
```

- [x] **Step 3: Verify**

Run: `npm run build && npm run lint`
Expected: both succeed. `npm run test` — expected 32/32 still passing (no pure-logic files touched).

Manually: `npm run dev`, open `http://localhost:3000/`, scroll to the map section — pins should cascade in as the section enters view, not before.

- [x] **Step 4: Commit**

```bash
git add src/components/UsMap.tsx
git commit -m "UsMap: memo state-path layer, gate pin entrance behind in-view"
```

---

## Task 6: `CrowdCalendar` bar-growth animation

**Files:**
- Modify: `src/components/CrowdCalendar.tsx`

- [x] **Step 1: Convert to a client component and animate the bars**

Replace the full file content of `src/components/CrowdCalendar.tsx` with:

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { ScoredMonth } from "@/lib/repo";
import { monthByAbbr } from "@/lib/months";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** §6.3.4 — bone chart, ink bars, brass on the best-balance month, mono axis. */
export function CrowdCalendar({
  rows,
  estimated = false,
  bestBalanceMonth,
}: {
  rows: ScoredMonth[];
  estimated?: boolean;
  bestBalanceMonth?: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...rows.map((r) => r.percentOfAnnualVisits));
  const min = Math.min(...rows.map((r) => r.percentOfAnnualVisits));
  const busiest = rows.find((r) => r.percentOfAnnualVisits === max)!;
  const quietest = rows.find((r) => r.percentOfAnnualVisits === min)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-6 text-mono-sm font-mono text-ink-soft flex-wrap">
        <span>Busiest: <strong className="text-ink">{monthByAbbr(busiest.month)!.name}</strong> ({busiest.percentOfAnnualVisits}% of visits)</span>
        <span>Quietest: <strong className="text-ink">{monthByAbbr(quietest.month)!.name}</strong> ({quietest.percentOfAnnualVisits}% of visits)</span>
        <span>{estimated ? "Estimated by park type · pending real IRMA data" : "5-yr medians · NPS IRMA"}</span>
      </div>
      <div className="flex items-end gap-2 h-40">
        {rows.map((r, i) => {
          const heightPct = (r.percentOfAnnualVisits / max) * 100;
          const pctOfPeak = Math.round((r.percentOfAnnualVisits / max) * 100);
          const isBest = r.month === bestBalanceMonth;
          return (
            <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-mono-sm font-mono text-ink-soft">{pctOfPeak}%</span>
              <motion.div
                className="w-full rounded-t-sm"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background: isBest ? "var(--brass)" : "var(--ink)",
                  originY: 1,
                }}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                title={`${monthByAbbr(r.month)!.name}: ${r.percentOfAnnualVisits}% of annual visits`}
              />
              <span className="text-mono-sm font-mono uppercase text-ink-soft">{r.month}</span>
            </div>
          );
        })}
      </div>
      <p className="text-mono-sm font-mono text-ink-soft">
        Bars show each month&rsquo;s share of annual visits as a % of the peak month &mdash; the number travelers can act on.
        Visitation is informational only and never enters the Month Fit score.
      </p>
    </div>
  );
}
```

- [x] **Step 2: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build/lint clean, 32/32 tests pass (this component has no pure-logic tests, `CrowdCalendar` is only consumed by the park detail page which is exercised at build time via `generateStaticParams`, so a build failure here would show up immediately).

- [x] **Step 3: Commit**

```bash
git add src/components/CrowdCalendar.tsx
git commit -m "CrowdCalendar: animate bars growing in on scroll (scaleY, staggered)"
```

---

## Task 7: Home page (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

- [x] **Step 1: Import the new components**

Add to the top import block (after the `image-select` import):
```tsx
import { Reveal, RevealGroup } from "@/components/Reveal";
```

- [x] **Step 2: Reveal the "This is {month}" section heading/subtitle, stagger its two ParkCard grids, and gate the section's paint cost**

Replace:
```tsx
      {/* Best right now — bone */}
      <section className="bg-bone text-ink py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <h2 className="font-display text-display-lg leading-none mb-2">This is {month.name}.</h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-10">Climate 60 &middot; access 40 &middot; popularity 0</p>

          <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {best.slice(0, 8).map((row) => (
              <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
            ))}
          </div>
          <Link href={`/discover/month/${DEFAULT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">
            See all 63 parks ranked for {month.name} &rarr;
          </Link>

          <div className="mt-16 pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <h3 className="font-display text-display-md">Hidden gems this month</h3>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={DEFAULT_MONTH} />
            ) : (
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
```
with:
```tsx
      {/* Best right now — bone */}
      <section className="bg-bone text-ink py-20" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 800px" }}>
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-2">This is {month.name}.</Reveal>
          <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-10">Climate 60 &middot; access 40 &middot; popularity 0</Reveal>

          <RevealGroup
            as="div"
            className="grid gap-5 mb-8"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            itemClassName="h-full"
            stagger={0.05}
          >
            {best.slice(0, 8).map((row) => (
              <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
            ))}
          </RevealGroup>
          <Link href={`/discover/month/${DEFAULT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">
            See all 63 parks ranked for {month.name} &rarr;
          </Link>

          <div className="mt-16 pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <h3 className="font-display text-display-md">Hidden gems this month</h3>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={DEFAULT_MONTH} />
            ) : (
              <RevealGroup
                as="div"
                className="grid gap-5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
                itemClassName="h-full"
                stagger={0.05}
              >
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </RevealGroup>
            )}
          </div>
        </div>
      </section>
```

- [x] **Step 3: Reveal the map section's heading + legend, gate its paint cost**

Replace:
```tsx
      {/* The Atlas — ink */}
      <section className="bg-ink text-bone py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <h2 className="font-display text-display-lg leading-none mb-8">Where it&rsquo;s good, right now.</h2>
          <UsMap statePaths={US_STATE_PATHS} width={US_MAP_WIDTH} height={US_MAP_HEIGHT} pins={pins} />
          <div className="flex justify-between items-start gap-4 mt-4 font-mono text-mono-sm text-bone/60 flex-wrap">
```
with:
```tsx
      {/* The Atlas — ink */}
      <section className="bg-ink text-bone py-20" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 800px" }}>
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-8">Where it&rsquo;s good, right now.</Reveal>
          <UsMap statePaths={US_STATE_PATHS} width={US_MAP_WIDTH} height={US_MAP_HEIGHT} pins={pins} />
          <Reveal as="div" delay={0.1} className="flex justify-between items-start gap-4 mt-4 font-mono text-mono-sm text-bone/60 flex-wrap">
```
(Note: this changes the last replaced line from a plain `<div ...>` opening tag to `<Reveal as="div" ...>` — its matching closing `</div>` further down (right before `</section>`) must become `</Reveal>`. Find:
```tsx
            )}
          </div>
        </div>
      </section>

      {/* Index teaser — bone */}
```
and replace with:
```tsx
            )}
          </Reveal>
        </div>
      </section>

      {/* Index teaser — bone */}
```
)

- [x] **Step 4: Reveal the index-teaser section, gate its paint cost**

Replace:
```tsx
      {/* Index teaser — bone */}
      <section className="bg-bone text-ink py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="font-display text-display-md leading-tight max-w-[20ch]">Sixty-three parks. One page each. No exceptions.</p>
          <Link href="/parks" className="font-mono text-sm px-6 py-3.5 rounded-sm bg-brass text-ink font-semibold whitespace-nowrap">
            Browse all 63 &rarr;
          </Link>
        </div>
      </section>
```
with:
```tsx
      {/* Index teaser — bone */}
      <section className="bg-bone text-ink py-20" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 300px" }}>
        <Reveal as="div" className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="font-display text-display-md leading-tight max-w-[20ch]">Sixty-three parks. One page each. No exceptions.</p>
          <Link href="/parks" className="font-mono text-sm px-6 py-3.5 rounded-sm bg-brass text-ink font-semibold whitespace-nowrap">
            Browse all 63 &rarr;
          </Link>
        </Reveal>
      </section>
```

- [x] **Step 5: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds (all 165 pages), lint clean, 32/32 tests pass.

Manually: `npm run dev`, open `http://localhost:3000/`, scroll down — the "This is {month}" heading, card grids, map heading/legend, and index teaser should each fade+rise in as they enter view; card grids should stagger.

- [x] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "Home: apply Reveal/RevealGroup to below-fold sections, content-visibility"
```

---

## Task 8: Park detail page — headings, Stat grid + CountUp, FigureLabel grid

**Files:**
- Modify: `src/app/parks/[parkCode]/page.tsx`

- [x] **Step 1: Import the new components**

Add to the top import block (after the `SITE_URL` import):
```tsx
import { Reveal, RevealGroup } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
```

- [x] **Step 2: Convert the Stat grid's ternary to an array so `RevealGroup` staggers the 4 real children, and gate Acreage through `CountUp`**

Replace:
```tsx
            <section id="overview" className="scroll-mt-24 flex flex-col gap-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {cohortPark ? (
                  <>
                    <Stat label="Acreage" value={`${cohortPark.acreage.toLocaleString()} ac`} />
                    <Stat label="Entry fee" value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : cohortPark.entryFee} />
                    <Stat
                      label={`Visits (${cohortPark.visitsWindow})`}
                      value={`${cohortPark.medianAnnualVisits.toLocaleString()}${cohortPark.officialVisitRank2025 ? ` · #${cohortPark.officialVisitRank2025} official 2025` : " · outside 2025 top 10"}`}
                    />
                    <Stat label="Typical trip" value={cohortPark.quickStats.tripLength} />
                  </>
                ) : (
                  <>
                    <Stat label="Entry fee" value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : "See nps.gov"} />
                    <Stat label="Location" value={state} />
                    <Stat label="Best overall month" value={labels.bestOverall.name} />
                    <Stat label="Acreage / visitation" value="Not yet live" />
                  </>
                )}
              </div>
```
with:
```tsx
            <section id="overview" className="scroll-mt-24 flex flex-col gap-6">
              <RevealGroup as="div" className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm" itemClassName="h-full">
                {cohortPark
                  ? [
                      <Stat key="acreage" label="Acreage" value={<CountUp value={cohortPark.acreage} suffix=" ac" />} />,
                      <Stat
                        key="fee"
                        label="Entry fee"
                        value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : cohortPark.entryFee}
                      />,
                      <Stat
                        key="visits"
                        label={`Visits (${cohortPark.visitsWindow})`}
                        value={`${cohortPark.medianAnnualVisits.toLocaleString()}${cohortPark.officialVisitRank2025 ? ` · #${cohortPark.officialVisitRank2025} official 2025` : " · outside 2025 top 10"}`}
                      />,
                      <Stat key="trip" label="Typical trip" value={cohortPark.quickStats.tripLength} />,
                    ]
                  : [
                      <Stat
                        key="fee"
                        label="Entry fee"
                        value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : "See nps.gov"}
                      />,
                      <Stat key="location" label="Location" value={state} />,
                      <Stat key="best-month" label="Best overall month" value={labels.bestOverall.name} />,
                      <Stat key="acreage" label="Acreage / visitation" value="Not yet live" />,
                    ]}
              </RevealGroup>
```

- [x] **Step 3: Update `Stat`'s type to accept a `ReactNode` value (needed for `CountUp`)**

At the bottom of the file, change:
```tsx
function Stat({ label, value }: { label: string; value: string }) {
```
to:
```tsx
function Stat({ label, value }: { label: string; value: ReactNode }) {
```
Add `ReactNode` to the React import at the top of the file — change:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
```
to:
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
```

- [x] **Step 4: Reveal the "When to go" heading/subtitle and stagger the 4 `FigureLabel`s**

Replace:
```tsx
            <section id="when-to-go" className="scroll-mt-24">
              <h2 className="font-display text-display-md mb-1">When to go</h2>
              <p className="text-sm text-ink-soft mb-8">Weighed on climate and access, never on crowds.</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                <FigureLabel label="Best overall" month={labels.bestOverall.name} />
                <FigureLabel label="Best weather" month={labels.bestWeather.name} />
                <FigureLabel label="Fewest crowds" month={labels.fewestCrowds.name} />
                <FigureLabel label="Best balance" month={labels.bestBalance.name} />
              </div>
```
with:
```tsx
            <section id="when-to-go" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-1">When to go</Reveal>
              <Reveal as="p" delay={0.06} className="text-sm text-ink-soft mb-8">Weighed on climate and access, never on crowds.</Reveal>

              <RevealGroup as="div" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" itemClassName="h-full">
                <FigureLabel label="Best overall" month={labels.bestOverall.name} />
                <FigureLabel label="Best weather" month={labels.bestWeather.name} />
                <FigureLabel label="Fewest crowds" month={labels.fewestCrowds.name} />
                <FigureLabel label="Best balance" month={labels.bestBalance.name} />
              </RevealGroup>
```

- [x] **Step 5: Reveal the Crowd Calendar section heading**

Replace:
```tsx
            <section id="crowds" className="scroll-mt-24">
              <h2 className="font-display text-display-md mb-6">Crowd calendar</h2>
              <CrowdCalendar rows={months} estimated={!cohortPark} bestBalanceMonth={labels.bestBalance.month} />
            </section>
```
with:
```tsx
            <section id="crowds" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-6">Crowd calendar</Reveal>
              <CrowdCalendar rows={months} estimated={!cohortPark} bestBalanceMonth={labels.bestBalance.month} />
            </section>
```

- [x] **Step 6: Reveal the Current Conditions heading and each alert row**

Replace:
```tsx
      {/* Current Conditions — ink chapter */}
      <section className="bg-ink text-bone py-16">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-display text-display-md">Current conditions</h2>
            <span className="text-mono-sm font-mono text-bone/60">{alerts ? "Live · NPS Alerts API" : "No alerts reported"}</span>
          </div>
          <div className="flex flex-col gap-3">
            {alerts ? (
              alerts.map((a, i) => (
                <div key={i} className="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.category}</span>
                    <p className="text-sm mt-1 font-medium">{a.title}</p>
                    <p className="text-sm text-bone/70 mt-0.5">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastIndexedDate).toLocaleDateString()}</span>
                </div>
              ))
            ) : !cohortPark ? (
              <p className="text-sm text-bone/70">No active NPS alerts for {name} right now.</p>
            ) : (
              detail!.alerts.map((a, i) => (
                <div key={i} className="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.type}</span>
                    <p className="text-sm mt-1">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastUpdated).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
```
with:
```tsx
      {/* Current Conditions — ink chapter */}
      <section className="bg-ink text-bone py-16" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <div className="flex items-baseline gap-3 mb-6">
            <Reveal as="h2" className="font-display text-display-md">Current conditions</Reveal>
            <span className="text-mono-sm font-mono text-bone/60">{alerts ? "Live · NPS Alerts API" : "No alerts reported"}</span>
          </div>
          {alerts ? (
            <RevealGroup as="div" className="flex flex-col gap-3" itemClassName="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
              {alerts.map((a, i) => (
                <Fragment key={i}>
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.category}</span>
                    <p className="text-sm mt-1 font-medium">{a.title}</p>
                    <p className="text-sm text-bone/70 mt-0.5">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastIndexedDate).toLocaleDateString()}</span>
                </Fragment>
              ))}
            </RevealGroup>
          ) : !cohortPark ? (
            <p className="text-sm text-bone/70">No active NPS alerts for {name} right now.</p>
          ) : (
            <RevealGroup as="div" className="flex flex-col gap-3" itemClassName="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
              {detail!.alerts.map((a, i) => (
                <Fragment key={i}>
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.type}</span>
                    <p className="text-sm mt-1">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastUpdated).toLocaleString()}</span>
                </Fragment>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>
```
Add `Fragment` to the React import — change the import added in Step 3 to:
```tsx
import { Fragment, type ReactNode } from "react";
```

- [x] **Step 7: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds (all 63 park pages), lint clean, 32/32 tests pass.

- [x] **Step 8: Commit**

```bash
git add src/app/parks/\[parkCode\]/page.tsx
git commit -m "Park detail: Reveal headings/figures/alerts, CountUp on Acreage"
```

---

## Task 9: Park detail page — hike/must-see/water/dining rows

**Files:**
- Modify: `src/app/parks/[parkCode]/page.tsx` (the `EditorialSections` and `NonCohortSections` functions)

- [x] **Step 1: Add `Fragment` usage (already imported in Task 8) and reveal the Hiking section**

Replace:
```tsx
      <section id="hiking" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-1">Hiking & trekking</h2>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">Officially listed hikes (NPS) &mdash; computed GIS trail totals land in Phase 2</p>
        <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
          {detail.hikes.map((h) => (
            <div key={h.name} className="py-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6">
              <div className="font-display text-display-md sm:w-64 flex-none leading-none">{h.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-mono-sm text-ink-soft">
                <span>{h.distanceMi} mi</span>
                <span>{h.difficulty}</span>
                <span>{h.durationHr} hr</span>
                <span>Best: {h.bestMonths}</span>
                {h.npsRecommended && <span>NPS-recommended</span>}
                {h.waterFeature && <span>Water feature</span>}
                {h.reservation && <span>Reservation required</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
```
with:
```tsx
      <section id="hiking" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-1">Hiking & trekking</Reveal>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">Officially listed hikes (NPS) &mdash; computed GIS trail totals land in Phase 2</Reveal>
        <RevealGroup
          as="div"
          className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10"
          itemClassName="py-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6"
        >
          {detail.hikes.map((h) => (
            <Fragment key={h.name}>
              <div className="font-display text-display-md sm:w-64 flex-none leading-none">{h.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-mono-sm text-ink-soft">
                <span>{h.distanceMi} mi</span>
                <span>{h.difficulty}</span>
                <span>{h.durationHr} hr</span>
                <span>Best: {h.bestMonths}</span>
                {h.npsRecommended && <span>NPS-recommended</span>}
                {h.waterFeature && <span>Water feature</span>}
                {h.reservation && <span>Reservation required</span>}
              </div>
            </Fragment>
          ))}
        </RevealGroup>
      </section>
```

- [x] **Step 2: Reveal the Must-see section**

Replace:
```tsx
      <section id="must-see" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-6">Must-see spots</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {detail.spots.map((s) => (
            <div key={s.name} className="flex-none w-56 snap-start rounded-sm border border-ink/12 bg-bone-deep p-4">
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{s.category}</span>
              <div className="font-display text-display-md leading-tight mt-1">{s.name}</div>
            </div>
          ))}
        </div>
      </section>
```
with:
```tsx
      <section id="must-see" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-6">Must-see spots</Reveal>
        <RevealGroup
          as="div"
          className="flex gap-4 overflow-x-auto pb-2 snap-x"
          itemClassName="flex-none w-56 snap-start rounded-sm border border-ink/12 bg-bone-deep p-4 h-full"
        >
          {detail.spots.map((s) => (
            <Fragment key={s.name}>
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{s.category}</span>
              <div className="font-display text-display-md leading-tight mt-1">{s.name}</div>
            </Fragment>
          ))}
        </RevealGroup>
      </section>
```

- [x] **Step 3: Reveal the Water section**

Replace:
```tsx
      <section id="water" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-1">Lakes & water</h2>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">USGS GNIS naming + hydrography intersected with NPS boundary</p>
        <div className="grid md:grid-cols-3 gap-4">
          {detail.water.map((w) => (
            <div key={w.name} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{w.type}</span>
              <div className="font-display text-display-md leading-tight mt-1 mb-1">{w.name}</div>
              <p className="text-sm text-ink-soft">{w.note}</p>
            </div>
          ))}
        </div>
      </section>
```
with:
```tsx
      <section id="water" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-1">Lakes & water</Reveal>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">USGS GNIS naming + hydrography intersected with NPS boundary</Reveal>
        <RevealGroup
          as="div"
          className="grid md:grid-cols-3 gap-4"
          itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full"
        >
          {detail.water.map((w) => (
            <Fragment key={w.name}>
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{w.type}</span>
              <div className="font-display text-display-md leading-tight mt-1 mb-1">{w.name}</div>
              <p className="text-sm text-ink-soft">{w.note}</p>
            </Fragment>
          ))}
        </RevealGroup>
      </section>
```

- [x] **Step 4: Reveal the Dining section's operations grid**

Replace:
```tsx
        <div className="grid md:grid-cols-2 gap-4">
          {detail.dining.operations.map((op) => (
            <div key={op.name} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
              <div className="font-display text-display-md leading-tight">{op.name}</div>
              <p className="text-sm text-ink-soft mt-1">{op.type} &middot; {op.location} &middot; {op.seasonal ? "Seasonal" : "Year-round"} &middot; Authorized NPS concessioner</p>
            </div>
          ))}
          {detail.dining.operations.length === 0 && (
            <p className="text-sm text-ink-soft">No concessioner dining inside the park &mdash; bring your own food.</p>
          )}
        </div>
```
with:
```tsx
        <RevealGroup as="div" className="grid md:grid-cols-2 gap-4" itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full">
          {detail.dining.operations.map((op) => (
            <Fragment key={op.name}>
              <div className="font-display text-display-md leading-tight">{op.name}</div>
              <p className="text-sm text-ink-soft mt-1">{op.type} &middot; {op.location} &middot; {op.seasonal ? "Seasonal" : "Year-round"} &middot; Authorized NPS concessioner</p>
            </Fragment>
          ))}
        </RevealGroup>
        {detail.dining.operations.length === 0 && (
          <p className="text-sm text-ink-soft">No concessioner dining inside the park &mdash; bring your own food.</p>
        )}
```
(Note: `{detail.dining.operations.length === 0 && (...)}` moves outside the `RevealGroup` — `RevealGroup` requires real children to stagger over an empty array produces zero children, which is fine, but the "no dining" message is a sibling fallback, not a grid item, so it shouldn't be inside the grid.)

- [x] **Step 5: Reveal the Dining section's own heading**

Replace:
```tsx
      <section id="dining" className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="font-display text-display-md">Dining availability</h2>
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">{detail.dining.label}</span>
        </div>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">Categorical label &mdash; never a taste score. NPS authorized-concessioner records.</p>
```
with:
```tsx
      <section id="dining" className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-1">
          <Reveal as="h2" className="font-display text-display-md">Dining availability</Reveal>
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">{detail.dining.label}</span>
        </div>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">Categorical label &mdash; never a taste score. NPS authorized-concessioner records.</Reveal>
```

- [x] **Step 6: Reveal `NonCohortSections`' must-see grid**

Replace:
```tsx
      {liveThings.length > 0 && (
        <section id="must-see" className="scroll-mt-24">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="font-display text-display-md">Must-see spots</h2>
            <span className="text-mono-sm font-mono text-ink-soft">Live &middot; NPS Data API</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {liveThings.map((t) => (
              <div key={t.title} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
                {t.activity && <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{t.activity}</span>}
                <div className="font-display text-display-md leading-tight mt-1 mb-1">{t.title}</div>
                <p className="text-sm text-ink-soft line-clamp-3">{t.shortDescription}</p>
              </div>
            ))}
          </div>
        </section>
      )}
```
with:
```tsx
      {liveThings.length > 0 && (
        <section id="must-see" className="scroll-mt-24">
          <div className="flex items-baseline gap-3 mb-1">
            <Reveal as="h2" className="font-display text-display-md">Must-see spots</Reveal>
            <span className="text-mono-sm font-mono text-ink-soft">Live &middot; NPS Data API</span>
          </div>
          <RevealGroup as="div" className="grid sm:grid-cols-2 md:grid-cols-3 gap-4" itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full">
            {liveThings.map((t) => (
              <Fragment key={t.title}>
                {t.activity && <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{t.activity}</span>}
                <div className="font-display text-display-md leading-tight mt-1 mb-1">{t.title}</div>
                <p className="text-sm text-ink-soft line-clamp-3">{t.shortDescription}</p>
              </Fragment>
            ))}
          </RevealGroup>
        </section>
      )}
```

- [x] **Step 7: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds (exercises both `EditorialSections` — cohort parks — and `NonCohortSections` — the other 59), lint clean, 32/32 tests pass.

Manually check one cohort park and one non-cohort park render correctly:
```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/parks/acad | grep -c "font-display"
curl -s http://localhost:3000/parks/zion | grep -c "font-display"
kill %1
```
Expected: both print a nonzero count (page rendered without a 500).

- [x] **Step 8: Commit**

```bash
git add src/app/parks/\[parkCode\]/page.tsx
git commit -m "Park detail: Reveal hiking/must-see/water/dining rows"
```

---

## Task 10: Month page (`src/app/discover/month/[month]/page.tsx`)

**Files:**
- Modify: `src/app/discover/month/[month]/page.tsx`

- [x] **Step 1: Import the new components**

Add to the top import block (after the `ContourField` import):
```tsx
import { Reveal, RevealGroup } from "@/components/Reveal";
```

- [x] **Step 2: Reveal each tier group's heading/subtitle and stagger its `ParkCard` grid**

Replace:
```tsx
              <section key={tier}>
                <h2 className="font-display text-display-lg leading-none mb-1">{tier}</h2>
                <p className="font-mono text-mono-sm text-ink-soft mb-6">{rows.length} park{rows.length === 1 ? "" : "s"}</p>
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {rows.map((row) => (
                    <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
                  ))}
                </div>
              </section>
```
with:
```tsx
              <section key={tier}>
                <Reveal as="h2" className="font-display text-display-lg leading-none mb-1">{tier}</Reveal>
                <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-6">{rows.length} park{rows.length === 1 ? "" : "s"}</Reveal>
                <RevealGroup
                  as="div"
                  className="grid gap-5"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
                  itemClassName="h-full"
                  stagger={0.04}
                >
                  {rows.map((row) => (
                    <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
                  ))}
                </RevealGroup>
              </section>
```

- [x] **Step 3: Reveal the Hidden gems heading and stagger its grid**

Replace:
```tsx
          <section className="pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <h2 className="font-display text-display-md">Hidden gems this month</h2>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={month.abbr} />
            ) : (
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </div>
            )}
          </section>
```
with:
```tsx
          <section className="pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <Reveal as="h2" className="font-display text-display-md">Hidden gems this month</Reveal>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={month.abbr} />
            ) : (
              <RevealGroup
                as="div"
                className="grid gap-5"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
                itemClassName="h-full"
                stagger={0.04}
              >
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </RevealGroup>
            )}
          </section>
```

- [x] **Step 4: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds (all 12 month pages), lint clean, 32/32 tests pass.

- [x] **Step 5: Commit**

```bash
git add src/app/discover/month/\[month\]/page.tsx
git commit -m "Month page: Reveal tier headings, stagger ParkCard grids"
```

---

## Task 11: Season page (`src/app/discover/season/[season]/page.tsx`)

**Files:**
- Modify: `src/app/discover/season/[season]/page.tsx`

- [x] **Step 1: Import the new component**

Add to the top import block (after the `Link` import):
```tsx
import { RevealGroup } from "@/components/Reveal";
```
(No `Reveal` needed standalone here — the page's own heading already uses plain tags and this page's brief only calls for the ranked list to stagger; keeping the diff minimal.)

- [x] **Step 2: Stagger the ranked list**

Replace:
```tsx
        <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
          {ranked.map(({ park, fit, tier }) => {
            const p = getParkSummary(park);
            return (
              <div key={park} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/parks/${park}`} className="font-display text-display-md leading-tight hover:underline underline-offset-4">
                    {p.name}
                  </Link>
                  <p className="font-mono text-mono-sm text-ink-soft">{p.state}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-mono-sm text-ink-soft">
                  <span>Season Fit {fit}</span>
                  <TierBadge tier={tier} onLight />
                </div>
              </div>
            );
          })}
        </div>
```
with:
```tsx
        <RevealGroup
          as="div"
          className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10"
          itemClassName="flex items-center justify-between gap-4 py-4"
        >
          {ranked.map(({ park, fit, tier }) => {
            const p = getParkSummary(park);
            return (
              <Fragment key={park}>
                <div>
                  <Link href={`/parks/${park}`} className="font-display text-display-md leading-tight hover:underline underline-offset-4">
                    {p.name}
                  </Link>
                  <p className="font-mono text-mono-sm text-ink-soft">{p.state}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-mono-sm text-ink-soft">
                  <span>Season Fit {fit}</span>
                  <TierBadge tier={tier} onLight />
                </div>
              </Fragment>
            );
          })}
        </RevealGroup>
```
Add `Fragment` to the React import at the top of the file — change:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
```
to:
```tsx
import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
```

- [x] **Step 3: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds (all 4 season pages), lint clean, 32/32 tests pass.

- [x] **Step 4: Commit**

```bash
git add src/app/discover/season/\[season\]/page.tsx
git commit -m "Season page: stagger the ranked list"
```

---

## Task 12: Rankings page (`src/app/rankings/page.tsx`)

**Files:**
- Modify: `src/app/rankings/page.tsx`

- [x] **Step 1: Import the new components**

Add to the top import block (after the `NearestGemFallback` import):
```tsx
import { Fragment } from "react";
import { Reveal, RevealGroup } from "@/components/Reveal";
```

- [x] **Step 2: Reveal the "Most visited" section**

Replace:
```tsx
        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Most visited <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">{OFFICIAL_SYSTEMWIDE_2025.source}</p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {OFFICIAL_MOST_VISITED_2025.map((r) => (
              <li key={r.rank} className="flex items-center gap-4 py-3">
                <span className="font-mono text-mono-sm text-ink-soft w-6">{r.rank}</span>
                <Link href={`/parks/${r.parkCode}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {r.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{r.visits.toLocaleString()} visits</span>
              </li>
            ))}
          </ol>
          <p className="font-mono text-mono-sm text-ink-soft mt-3">{OFFICIAL_SYSTEMWIDE_2025.note}</p>
        </section>
```
with:
```tsx
        <section>
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-1">Most visited <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official</span></Reveal>
          <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-6">{OFFICIAL_SYSTEMWIDE_2025.source}</Reveal>
          <RevealGroup as="ol" className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10" itemAs="li" itemClassName="flex items-center gap-4 py-3">
            {OFFICIAL_MOST_VISITED_2025.map((r) => (
              <Fragment key={r.rank}>
                <span className="font-mono text-mono-sm text-ink-soft w-6">{r.rank}</span>
                <Link href={`/parks/${r.parkCode}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {r.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{r.visits.toLocaleString()} visits</span>
              </Fragment>
            ))}
          </RevealGroup>
          <p className="font-mono text-mono-sm text-ink-soft mt-3">{OFFICIAL_SYSTEMWIDE_2025.note}</p>
        </section>
```

- [x] **Step 3: Reveal the "Largest" section**

Replace:
```tsx
        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Largest <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official, cohort only</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">NPS Land Resources, quarterly reports &middot; full 63-park ranking lands Phase 1</p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {largest.map((p, i) => (
              <li key={p.code} className="flex items-center gap-4 py-3">
                <span className="font-mono text-mono-sm text-ink-soft w-6">{i + 1}</span>
                <Link href={`/parks/${p.code}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {p.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{p.acreage.toLocaleString()} acres</span>
              </li>
            ))}
          </ol>
        </section>
```
with:
```tsx
        <section>
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-1">Largest <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official, cohort only</span></Reveal>
          <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-6">NPS Land Resources, quarterly reports &middot; full 63-park ranking lands Phase 1</Reveal>
          <RevealGroup as="ol" className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10" itemAs="li" itemClassName="flex items-center gap-4 py-3">
            {largest.map((p, i) => (
              <Fragment key={p.code}>
                <span className="font-mono text-mono-sm text-ink-soft w-6">{i + 1}</span>
                <Link href={`/parks/${p.code}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {p.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{p.acreage.toLocaleString()} acres</span>
              </Fragment>
            ))}
          </RevealGroup>
        </section>
```

- [x] **Step 4: Reveal the "Least crowded" section (its heading/subtitle and its `RevealGroup`), leave the `<details>`-nested visits-per-acre table alone**

The visits-per-acre table is inside a collapsed `<details>` element — it's not visible until the user expands it, so `whileInView` would never fire naturally there (it starts `display:none` in most browsers' default `<details>` rendering, meaning it's never "in view" until manually opened, and once opened it should just show, not re-trigger a scroll animation). Leave that inner `<ol>` untouched.

Replace only:
```tsx
        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Least crowded <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">
            Cross-park crowd percentile for {CURRENT_MONTH}, lowest first &mdash; a band, not an ordinal rank.
          </p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {leastCrowded.map((p) => {
              const summary = getParkSummary(p.park);
              return (
                <li key={p.park} className="flex items-center gap-4 py-3">
                  <Link href={`/parks/${p.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                    {summary.name}
                  </Link>
                  <CrowdBandBadge band={p.band} />
                  <span className="font-mono text-mono-sm text-ink-soft">{p.crowdPercentile}th pctile</span>
                </li>
              );
            })}
          </ol>
```
with:
```tsx
        <section>
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-1">Least crowded <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></Reveal>
          <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-6">
            Cross-park crowd percentile for {CURRENT_MONTH}, lowest first &mdash; a band, not an ordinal rank.
          </Reveal>
          <RevealGroup as="ol" className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10" itemAs="li" itemClassName="flex items-center gap-4 py-3">
            {leastCrowded.map((p) => {
              const summary = getParkSummary(p.park);
              return (
                <Fragment key={p.park}>
                  <Link href={`/parks/${p.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                    {summary.name}
                  </Link>
                  <CrowdBandBadge band={p.band} />
                  <span className="font-mono text-mono-sm text-ink-soft">{p.crowdPercentile}th pctile</span>
                </Fragment>
              );
            })}
          </RevealGroup>
```
(everything from the `<details>` block onward stays exactly as-is)

- [x] **Step 5: Reveal the "Hidden gems this month" section**

Replace:
```tsx
        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-display text-display-lg leading-none">Hidden gems this month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
            <Link href={`/discover/month/${CURRENT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">See all months &rarr;</Link>
          </div>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">Month Fit &ge;85 AND crowd percentile &le;40 &middot; recomputed monthly</p>
          {gems.length === 0 ? (
            <NearestGemFallback currentMonth={CURRENT_MONTH} />
          ) : (
            <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
              {gems.map((g) => {
                const p = getParkSummary(g.park);
                return (
                  <li key={g.park} className="flex items-center gap-4 py-3">
                    <Link href={`/parks/${g.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                      {p.name}
                    </Link>
                    <TierBadge tier={g.tier} onLight />
                    <span className="font-mono text-mono-sm text-ink-soft">Fit {g.overallMonthFit}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
```
with:
```tsx
        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <Reveal as="h2" className="font-display text-display-lg leading-none">Hidden gems this month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></Reveal>
            <Link href={`/discover/month/${CURRENT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">See all months &rarr;</Link>
          </div>
          <Reveal as="p" delay={0.06} className="font-mono text-mono-sm text-ink-soft mb-6">Month Fit &ge;85 AND crowd percentile &le;40 &middot; recomputed monthly</Reveal>
          {gems.length === 0 ? (
            <NearestGemFallback currentMonth={CURRENT_MONTH} />
          ) : (
            <RevealGroup as="ol" className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10" itemAs="li" itemClassName="flex items-center gap-4 py-3">
              {gems.map((g) => {
                const p = getParkSummary(g.park);
                return (
                  <Fragment key={g.park}>
                    <Link href={`/parks/${g.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                      {p.name}
                    </Link>
                    <TierBadge tier={g.tier} onLight />
                    <span className="font-mono text-mono-sm text-ink-soft">Fit {g.overallMonthFit}</span>
                  </Fragment>
                );
              })}
            </RevealGroup>
          )}
        </section>
```

- [x] **Step 6: Reveal the "Best by month" heading (leave the 12 nav pills unstaggered — they're navigation chrome, not data rows; staggering 12 tiny pills would read as noise, not polish)**

Replace:
```tsx
        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Best by month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
          <p className="text-ink-soft mb-6">Tiered results for any month of the year, across all 63 parks.</p>
```
with:
```tsx
        <section>
          <Reveal as="h2" className="font-display text-display-lg leading-none mb-1">Best by month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></Reveal>
          <Reveal as="p" delay={0.06} className="text-ink-soft mb-6">Tiered results for any month of the year, across all 63 parks.</Reveal>
```

- [x] **Step 7: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds, lint clean, 32/32 tests pass.

- [x] **Step 8: Commit**

```bash
git add src/app/rankings/page.tsx
git commit -m "Rankings: Reveal section headings, stagger the 3 open list sections"
```

---

## Task 13: Parks index page (`src/app/parks/page.tsx`)

**Files:**
- Modify: `src/app/parks/page.tsx`

- [ ] **Step 1: Import and apply**

Add to the top import block (after the `ParksIndexList` import):
```tsx
import { Reveal } from "@/components/Reveal";
```

Replace:
```tsx
        <h1 className="font-display text-display-xl leading-none mb-4">All 63 National Parks</h1>
        <p className="text-ink-soft max-w-[65ch] mb-10">
          Every designated National Park now has Month Fit scoring &mdash; hand-authored for the 4-park
          validation cohort, estimated by park type for the rest pending real NOAA/NPS data. Only the
          cohort carries the full curated guide (hikes, water, dining); every park gets a live profile,
          current conditions, and a real photo where NPS rights allow it.
        </p>
```
with:
```tsx
        <Reveal as="h1" className="font-display text-display-xl leading-none mb-4">All 63 National Parks</Reveal>
        <Reveal as="p" delay={0.06} className="text-ink-soft max-w-[65ch] mb-10">
          Every designated National Park now has Month Fit scoring &mdash; hand-authored for the 4-park
          validation cohort, estimated by park type for the rest pending real NOAA/NPS data. Only the
          cohort carries the full curated guide (hikes, water, dining); every park gets a live profile,
          current conditions, and a real photo where NPS rights allow it.
        </Reveal>
```
(`ParksIndexList` itself — the interactive hover-preview list — is left untouched, per the approved design: it's already a complex client component with its own hover state, out of scope for this pass.)

- [ ] **Step 2: Verify**

Run: `npm run build && npm run lint && npm run test`
Expected: build succeeds, lint clean, 32/32 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/parks/page.tsx
git commit -m "Parks index: Reveal heading and intro paragraph"
```

---

## Task 14: Footer sign-off + final verification

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Reveal the sign-off line**

Add to the top of `src/components/Footer.tsx`, after the existing imports:
```tsx
import { Reveal } from "./Reveal";
```

Replace:
```tsx
        <p className="font-display text-display-lg leading-none">Public data. Plain answers.</p>
```
with:
```tsx
        <Reveal as="p" className="font-display text-display-lg leading-none">Public data. Plain answers.</Reveal>
```

- [ ] **Step 2: Full verification**

Run:
```bash
npm run build && npm run lint && npm run test
```
Expected: build succeeds (165 pages), lint clean, 32/32 tests pass.

- [ ] **Step 3: Re-run the scroll-jank audit and compare to Task 1's baseline**

Run:
```bash
npm run start &
sleep 2
npm run audit-scroll
kill %1
```
Expected: `Avg frame:` ≤ 18ms, `Frames >26ms:` ≤ 5, `Worst frame:` ≤ 60ms (per the spec's accept criteria). If the real numbers don't hit that, report the honest numbers rather than rounding up — do not edit the audit script to make the numbers look better.

- [ ] **Step 4: Manual pass with reduced motion**

In Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce", reload `http://localhost:3000/` and click through a park page, a month page, and rankings. Expected: every section that used to just appear now still just appears (no animation), nothing is invisible or stuck at `opacity:0`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "Footer: Reveal the sign-off line"
```

- [ ] **Step 6: Update the spec/README with the real before/after numbers**

In `docs/superpowers/specs/2026-08-29-reveal-jank-pass-design.md`, under "Measurement", add a final line with the actual before/after numbers from Task 1 Step 4 and Task 14 Step 3. Commit:
```bash
git add docs/superpowers/specs/2026-08-29-reveal-jank-pass-design.md
git commit -m "Record real before/after scroll-jank numbers in the spec"
```

---

## Self-review notes (for whoever executes this)

- **Spec coverage:** Reveal/RevealGroup (Task 2) ✅, CountUp scoped to Acreage only (Task 3, 8) ✅, application checklist — Home/Park/Month/Season/Rankings/Parks-index/Footer — all covered (Tasks 7–14) ✅, UsMap memo+in-view gate (Task 5) ✅, content-visibility (Tasks 7, 8) ✅, audit script + before/after (Tasks 1, 14) ✅. Map glow and Year Scroller windowing are correctly *not* re-touched (already fixed).
- **Type consistency:** `Stat`'s `value` prop changes from `string` to `ReactNode` in Task 8 Step 3 — verified every other `Stat` call site (Task 8 Step 2, both branches) still passes either a plain string or the one `CountUp` element, both valid `ReactNode`s.
- **Out of scope, confirmed:** `WildlifeCard`/`WildlifeIcon` (unused, dead code) and the Living Atlas map revamp are untouched — they belong to future specs per the brainstorm.
