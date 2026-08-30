"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import type { ParkImage } from "@/lib/nps";
import type { VideoManifestEntry } from "@/lib/data/video-manifest";
import { ContourField } from "./ContourField";
import { LivingHero } from "./LivingHero";

export function HomeHero({
  image,
  accent,
  sourceStrip,
  video = null,
}: {
  image: ParkImage | null;
  accent: string;
  sourceStrip: string[];
  /** Living Hero clip for the current month (spec §1.4) — photo fallback when null. */
  video?: VideoManifestEntry | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.06]);

  return (
    // Mobile pass: h-screen (100vh) hid the headline's bottom + source strip
    // behind mobile browser chrome AND overshot by the in-flow banner+nav
    // above this section. svh is the stable small-viewport height (== vh on
    // desktop, so ≥lg is pixel-identical to the old h-screen); below lg we
    // also subtract the banner+nav rows (~7.25rem phone / ~6.25rem tablet) so
    // the whole hero — scroll cue included — fits the first screen.
    <section
      ref={ref}
      className="relative h-[calc(100svh-7.25rem)] md:h-[calc(100svh-6.25rem)] lg:h-svh w-full overflow-hidden bg-ink"
    >
      {/* filter-free: this layer is under a continuous scroll-linked transform */}
      <motion.div className="absolute inset-0" style={{ y, scale, willChange: "transform" }}>
        {video ? (
          // creditGlass off: this layer is under a continuous scroll-linked
          // transform, where backdrop-filter would re-filter every frame.
          <LivingHero entry={video} alt={image?.altText || "Living footage from a U.S. National Park"} creditGlass={false} />
        ) : image ? (
          <Image src={image.url} alt={image.altText || ""} fill priority sizes="100vw" quality={85} className="object-cover" />
        ) : (
          <ContourField name="" accent={accent} />
        )}
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />

      <div className="relative h-full max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-24 lg:pb-20">
        <motion.h1
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-display-xl leading-[0.95] text-bone mb-6"
        >
          Find your park.
          <br />
          Find your <em className="italic" style={{ color: "var(--brass)" }}>month</em>.
        </motion.h1>
        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="self-start glass-dark rounded-sm px-3 py-1.5 font-mono text-mono-sm uppercase tracking-wide text-bone/70 flex flex-wrap gap-x-4"
        >
          {sourceStrip.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </motion.p>
      </div>

      <Link
        href="#year-scroller"
        className="tap-44 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-bone/60 font-mono text-mono-sm"
      >
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-bone/40"
        />
        SCROLL
      </Link>
    </section>
  );
}
