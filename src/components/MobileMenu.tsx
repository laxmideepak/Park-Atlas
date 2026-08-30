"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Mobile pass — phones previously had no nav links at all (the desktop link
 * row is hidden md:flex). A mono MENU trigger opens a full-screen ink sheet
 * with the same four destinations in display type. Closes on tap, Escape, or
 * route change; scroll parks (Lenis + html overflow) while it's up. */
export function MobileMenu({ monthAbbr }: { monthAbbr: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const lenis = useLenis();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Route change closes the menu — render-time state adjustment (the
  // React-endorsed alternative to a setState-in-effect) so a navigation that
  // keeps this component mounted can never leave the sheet up.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, lenis]);

  const links = [
    { href: `/discover/month/${monthAbbr}`, label: "Months" },
    { href: "/parks", label: "Parks" },
    { href: "/rankings", label: "Rankings" },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="min-h-11 min-w-11 -my-2 flex items-center font-mono text-mono-sm uppercase tracking-wide opacity-75 cursor-pointer"
      >
        Menu
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
            className="fixed inset-0 z-50 bg-ink text-bone flex flex-col overflow-y-auto"
          >
            <div aria-hidden className="grain-overlay" />

            <div className="relative flex items-center justify-between px-6 py-5 border-b border-bone/10">
              <Link href="/" onClick={() => setOpen(false)} className="font-display italic text-2xl min-h-11 flex items-center">
                ParkAtlas
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 min-w-11 flex items-center justify-end font-mono text-mono-sm uppercase tracking-wide opacity-75 cursor-pointer"
              >
                Close
              </button>
            </div>

            <nav aria-label="Site" className="relative flex-1 flex flex-col justify-center px-6 py-10 gap-1">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.06 + i * 0.05, ease: EASE }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-3 min-h-11 font-display text-display-lg leading-none hover:text-brass transition-colors"
                  >
                    <span className="font-mono text-mono-sm text-bone/50 w-6 flex-none">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.24, ease: EASE }}
              className="relative px-6 pb-10"
            >
              <Link
                href={`/discover/month/${monthAbbr}`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center min-h-11 px-5 rounded-full border border-bone/25 font-mono text-mono-sm uppercase tracking-wide hover:border-brass transition-colors"
              >
                This month: {monthAbbr}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
