"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import type { ParkImage } from "@/lib/nps";

export function HomeHero({
  image,
  accent,
  sourceStrip,
}: {
  image: ParkImage | null;
  accent: string;
  sourceStrip: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.06]);

  return (
    <section ref={ref} className="relative h-screen w-full overflow-hidden bg-ink">
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {image ? (
          <Image src={image.url} alt={image.altText || ""} fill priority sizes="100vw" className="object-cover img-grade" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, var(--ink), ${accent}22)` }} />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-ink/25" />
      <div className="grain-overlay" />

      <div className="relative h-full max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-20">
        <motion.h1
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-display-xl leading-[0.95] text-bone mb-6"
        >
          Find your park.
          <br />
          Find your <em className="italic" style={{ color: "var(--brass)" }}>month</em>.
        </motion.h1>
        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono text-mono-sm uppercase tracking-wide text-bone/70 flex flex-wrap gap-x-4"
        >
          {sourceStrip.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </motion.p>
      </div>

      <Link
        href="#year-scroller"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-bone/60 font-mono text-mono-sm"
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
