"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/** §3.9 — session-once, first visit only. Renders as an overlay above the
 * already-painted hero (never blocks LCP), hard-capped at 1.2s, skippable
 * by click. Reduced motion skips it entirely. */
export function Preloader({ facts }: { facts: string[] }) {
  const [shouldShow, setShouldShow] = useState(false);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [fact] = useState(() => facts[Math.floor(Math.random() * facts.length)]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // One-time read of sessionStorage to decide whether this is a repeat
    // view this session — there's no external-store subscription here (the
    // flag is write-once), so this is the mount-check itself, not a loop.
    const seen = sessionStorage.getItem("overlook-preloader-seen");
    if (seen || reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      return;
    }
    sessionStorage.setItem("overlook-preloader-seen", "1");
    setShouldShow(true);
  }, [reduceMotion]);

  useEffect(() => {
    if (!shouldShow || done) return;
    const start = performance.now();
    const DURATION = 1200;
    let raf: number;
    const tick = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(100, Math.round((elapsed / DURATION) * 100));
      setPct(p);
      if (p >= 100) {
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldShow, done]);

  return (
    <AnimatePresence>
      {shouldShow && !done && (
        <motion.div
          className="fixed inset-0 z-[100] bg-ink flex flex-col items-center justify-center gap-6 cursor-pointer"
          onClick={() => setDone(true)}
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-mono-sm text-bone/50 tracking-widest">CLICK TO SKIP</span>
          <span className="font-mono text-5xl text-bone tabular-nums">{String(pct).padStart(2, "0")}</span>
          <p className="font-display italic text-display-md text-bone/80 max-w-[36ch] text-center px-6">{fact}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
