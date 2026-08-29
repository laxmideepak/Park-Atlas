"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { TierBadge } from "./TierBadge";
import { ContourField } from "./ContourField";
import type { ParkImage } from "@/lib/nps";
import type { Tier } from "@/lib/types";

export interface YearChapter {
  monthAbbr: string;
  monthName: string;
  parkCode: string;
  parkName: string;
  accent: string;
  image: ParkImage | null;
  fit: number;
  tier: Tier;
  crowdReliefPct: number; // % fewer visitors than peak
}

const N = 12;
const VH_PER_CHAPTER = 55; // was 100 — 12x100vh (1200vh) felt endless, not directed
const WINDOW = 2; // only mount <Image> for chapters within ±this of the active one

/** §6.2 — the signature. Desktop: pinned scroll-scrub through all 12 months.
 * Reduced motion: static grid. Mobile: swipe-snap carousel (see below). */
export function YearScroller({ chapters }: { chapters: YearChapter[] }) {
  const reduceMotion = useReducedMotion();
  const pinRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const lenis = useLenis();

  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `-${(N - 1) * 100}vw`]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(N - 1, Math.max(0, Math.round(v * (N - 1)))));
  });

  const goTo = (i: number) => {
    const el = pinRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const docTop = window.scrollY + rect.top;
    const range = el.offsetHeight - window.innerHeight;
    const top = docTop + (i / (N - 1)) * range;
    if (lenis) {
      lenis.scrollTo(top, reduceMotion ? { immediate: true } : { duration: 0.9 });
    } else {
      window.scrollTo(0, top);
    }
  };

  useEffect(() => {
    if (reduceMotion) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(Math.min(N - 1, active + 1));
      if (e.key === "ArrowLeft") goTo(Math.max(0, active - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduceMotion]);

  if (reduceMotion) {
    return (
      <section id="year-scroller" className="bg-ink py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((c) => (
            <ChapterCard key={c.monthAbbr} c={c} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      {/* mobile: swipe-snap carousel, no pinning */}
      <section id="year-scroller" className="lg:hidden bg-ink py-16">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4">
          {chapters.map((c) => (
            <div key={c.monthAbbr} className="flex-none w-[85vw] snap-center">
              <ChapterCard c={c} />
            </div>
          ))}
        </div>
      </section>

      {/* desktop: pinned scrub */}
      <section
        id="year-scroller"
        ref={pinRef}
        className="hidden lg:block relative"
        style={{ height: `${N * VH_PER_CHAPTER}vh` }}
        role="region"
        aria-roledescription="carousel"
        aria-label="The year, month by month"
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-ink">
          <motion.div className="flex h-full" style={{ x, width: `${N * 100}vw`, willChange: "transform" }}>
            {chapters.map((c, i) => {
              const inWindow = Math.abs(i - active) <= WINDOW;
              return (
                <div
                  key={c.monthAbbr}
                  className="relative h-full flex-none"
                  style={{ width: "100vw", contain: "layout paint" }}
                  aria-label={`${c.monthName} — ${c.parkName}`}
                >
                  {inWindow && c.image ? (
                    <Image src={c.image.url} alt={c.image.altText || ""} fill sizes="100vw" quality={85} className="object-cover" />
                  ) : (
                    <ContourField name="" accent={c.accent} />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />

                  <div className="absolute inset-0 max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-24">
                    <h2 className="font-display text-display-xl leading-[0.9] text-bone mb-6">{c.monthName}</h2>
                    <div className="flex flex-wrap items-center gap-4 font-mono text-mono-sm text-bone/80">
                      <span className="text-bone font-medium">{c.parkName}</span>
                      <span>Fit {c.fit}</span>
                      <TierBadge tier={c.tier} />
                      <span>{c.crowdReliefPct}% fewer visitors than peak</span>
                    </div>
                    <Link
                      href={`/discover/month/${c.monthAbbr}`}
                      className="mt-6 inline-flex items-center gap-2 font-mono text-mono-sm text-bone underline underline-offset-2 w-fit hover:text-brass transition-colors"
                    >
                      Everything good in {c.monthName} &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* progress rail */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {chapters.map((c, i) => (
              <button
                key={c.monthAbbr}
                onClick={() => goTo(i)}
                aria-label={`Go to ${c.monthName}`}
                className="w-8 h-[3px] rounded-full transition-colors"
                style={{ background: i === active ? "var(--brass)" : "rgba(237,231,218,0.25)" }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function ChapterCard({ c }: { c: YearChapter }) {
  return (
    <Link href={`/discover/month/${c.monthAbbr}`} className="relative block aspect-[4/5] rounded-sm overflow-hidden group">
      {c.image ? (
        <Image src={c.image.url} alt={c.image.altText || ""} fill sizes="50vw" quality={85} className="object-cover" style={{ filter: "saturate(0.97)" }} />
      ) : (
        <ContourField name={c.monthName} accent={c.accent} />
      )}
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
      <div className="absolute inset-0 p-5 flex flex-col justify-end gap-2">
        <h3 className="font-display text-display-md text-bone leading-none">{c.monthName}</h3>
        <div className="flex flex-wrap items-center gap-3 font-mono text-mono-sm text-bone/80">
          <span className="text-bone">{c.parkName}</span>
          <span>Fit {c.fit}</span>
          <TierBadge tier={c.tier} />
        </div>
      </div>
    </Link>
  );
}
