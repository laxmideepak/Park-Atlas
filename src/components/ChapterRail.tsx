"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { setChapterSpy } from "@/lib/chapter-spy";

const RAIL_SCROLL_OFFSET = -96; // matches the sections' scroll-mt-24 (6rem)

export interface Chapter {
  id: string;
  label: string;
}

/** §7.3 — sticky section nav. IntersectionObserver drives the active state;
 * a brass tick slides between items via layoutId instead of just toggling color.
 *
 * Items carry a dimmed two-digit numeral (`01 Overview`) derived from their
 * position in the already-filtered `chapters` prop — the same contiguous
 * numbering the ThemedSection eyebrows use, so rail and sections share one
 * table of contents.
 *
 * `runningHead` (the park name) opts the page into the nav's running head:
 * the rail publishes park + active chapter to the chapter-spy store, and
 * clears it on unmount so other routes show nothing. */
export function ChapterRail({ chapters, runningHead }: { chapters: Chapter[]; runningHead?: string }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const lenis = useLenis();
  const reduceMotion = useReducedMotion();

  const goToChapter = (e: React.MouseEvent, id: string) => {
    if (!lenis) return; // let the native #hash jump happen
    e.preventDefault();
    lenis.scrollTo(`#${id}`, {
      offset: RAIL_SCROLL_OFFSET,
      ...(reduceMotion ? { immediate: true } : { duration: 0.9 }),
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [chapters]);

  useEffect(() => {
    if (!runningHead) return;
    const i = chapters.findIndex((c) => c.id === active);
    if (i === -1) return;
    setChapterSpy({ park: runningHead, id: chapters[i].id, label: chapters[i].label, index: i + 1 });
  }, [active, chapters, runningHead]);

  // Clear on unmount only — the store must outlive re-runs of the effect above.
  useEffect(() => () => setChapterSpy(null), []);

  return (
    <>
      {/* desktop: sticky left rail */}
      <nav className="hidden lg:flex sticky top-24 flex-col gap-1 self-start font-mono text-mono-sm w-40 flex-none" aria-label="Section navigation">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={(e) => goToChapter(e, c.id)}
            className="relative pl-4 py-1.5"
            style={{ color: active === c.id ? "var(--ink)" : "var(--ink-soft)" }}
          >
            {active === c.id && (
              <motion.span
                layoutId="chapter-rail-tick"
                className="absolute left-0 top-0 bottom-0 w-[2px] bg-brass"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="text-ink-soft/70 mr-2">{String(i + 1).padStart(2, "0")}</span>
            {c.label}
          </a>
        ))}
      </nav>

      {/* mobile/tablet: horizontal scroll pill row (tap-44 extends each
          pill's hit box to 44px on touch — single row, so no overlap risk) */}
      <nav className="flex lg:hidden gap-2 overflow-x-auto py-2 font-mono text-mono-sm" aria-label="Section navigation">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={(e) => goToChapter(e, c.id)}
            className="tap-44 flex-none px-3 py-1.5 rounded-full border"
            style={{
              borderColor: active === c.id ? "var(--brass)" : "var(--ink-soft)",
              color: active === c.id ? "var(--ink)" : "var(--ink-soft)",
            }}
          >
            <span className="text-ink-soft/70 mr-1.5">{String(i + 1).padStart(2, "0")}</span>
            {c.label}
          </a>
        ))}
      </nav>
    </>
  );
}
