"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";

const RAIL_SCROLL_OFFSET = -96; // matches the sections' scroll-mt-24 (6rem)

export interface Chapter {
  id: string;
  label: string;
}

/** §7.3 — sticky section nav. IntersectionObserver drives the active state;
 * a brass tick slides between items via layoutId instead of just toggling color. */
export function ChapterRail({ chapters }: { chapters: Chapter[] }) {
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

  return (
    <>
      {/* desktop: sticky left rail */}
      <nav className="hidden lg:flex sticky top-24 flex-col gap-1 self-start font-mono text-mono-sm w-40 flex-none" aria-label="Section navigation">
        {chapters.map((c) => (
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
            {c.label}
          </a>
        ))}
      </nav>

      {/* mobile/tablet: horizontal scroll pill row */}
      <nav className="flex lg:hidden gap-2 overflow-x-auto pb-2 font-mono text-mono-sm" aria-label="Section navigation">
        {chapters.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            onClick={(e) => goToChapter(e, c.id)}
            className="flex-none px-3 py-1.5 rounded-full border"
            style={{
              borderColor: active === c.id ? "var(--brass)" : "var(--ink-soft)",
              color: active === c.id ? "var(--ink)" : "var(--ink-soft)",
            }}
          >
            {c.label}
          </a>
        ))}
      </nav>
    </>
  );
}
