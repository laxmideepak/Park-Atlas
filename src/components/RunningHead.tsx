"use client";

import { useSyncExternalStore } from "react";
import { getChapterSpy, getChapterSpyServerSnapshot, subscribeChapterSpy } from "@/lib/chapter-spy";

/**
 * Running head — `ACADIA — 03 HIKING` in the nav on park pages, right of
 * center, updating with the active chapter (via the chapter-spy store the
 * ChapterRail writes). Hero-exit condition: it appears only once the reader
 * is past the first chapter (active index > 1) — no per-pixel animation, the
 * text just swaps. Hidden below md, where the mobile menu button owns that
 * side of the bar. Empty on every non-park route (store is null there).
 */
export function RunningHead() {
  const spy = useSyncExternalStore(subscribeChapterSpy, getChapterSpy, getChapterSpyServerSnapshot);
  if (!spy || spy.index <= 1) return null;
  return (
    <span className="hidden md:block font-mono text-mono-sm uppercase tracking-wide text-bone/70 whitespace-nowrap truncate min-w-0">
      {spy.park} &mdash; {String(spy.index).padStart(2, "0")} {spy.label}
    </span>
  );
}
