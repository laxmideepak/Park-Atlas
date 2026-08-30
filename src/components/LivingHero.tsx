"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import type { VideoManifestEntry } from "@/lib/data/video-manifest";

/**
 * Living Hero (spec §1.3) — poster-first, video as progressive enhancement.
 * The politeness rules are the whole feature:
 *
 * 1. The poster renders via next/image with priority — the LCP is always an
 *    image, never the video.
 * 2. The <video> mounts with muted/loop/playsInline/preload="none" and NO src.
 *    Its src is assigned (and bytes first requested) only when ALL are true:
 *    in view · prefers-reduced-motion off · saveData off. Under reduced
 *    motion or Save-Data, zero video bytes ever load.
 * 3. Poster -> video crossfade over 600ms once canplay fires. If the video
 *    never loads, nobody knows — the poster was already beautiful.
 * 4. Pauses when scrolled offscreen; resumes on return.
 * 5. Mobile (<= 768px) gets the separately-encoded 540p file.
 */
export function LivingHero({
  entry,
  alt,
  creditGlass = true,
}: {
  entry: VideoManifestEntry;
  alt: string;
  /** Glass pass: frost the credit chip. Pass false when the hero sits inside a
   * continuously-animating transform (HomeHero's scroll parallax layer) —
   * backdrop-filter under continuous transform re-filters every frame (same
   * guardrail as the .img-grade note in globals.css). */
  creditGlass?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData === true) return;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!startedRef.current) {
            // First entry into view: pick the per-device encode and only now
            // request bytes. (This effect runs post-hydration, after the
            // priority poster has painted — the poster is already the LCP.)
            startedRef.current = true;
            video.src = window.matchMedia("(max-width: 768px)").matches ? entry.srcMobile : entry.srcDesktop;
            video.addEventListener(
              "canplay",
              () => {
                setVideoVisible(true);
                video.play().catch(() => {}); // autoplay veto -> poster stays, no harm
              },
              { once: true }
            );
            video.load();
          } else {
            video.play().catch(() => {});
          }
        } else if (startedRef.current) {
          video.pause();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [reduceMotion, entry.srcDesktop, entry.srcMobile]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Image
        src={entry.poster}
        alt={alt}
        fill
        priority
        sizes="100vw"
        quality={85}
        placeholder="blur"
        blurDataURL={entry.posterBlur}
        className="object-cover"
      />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[600ms] ease-linear"
        style={{ opacity: videoVisible ? 1 : 0 }}
      />
      <a
        href={entry.sourceUrl}
        className={`absolute bottom-3 right-4 z-10 font-mono text-mono-sm text-bone/70 hover:text-bone underline-offset-2 hover:underline ${
          creditGlass ? "glass-dark rounded-sm px-2.5 py-1" : ""
        }`}
      >
        Video: {entry.credit}
      </a>
    </div>
  );
}
