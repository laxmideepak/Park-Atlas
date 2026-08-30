"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Glass pass — the Vantara signature moment: the nav is a solid ink bar at
 * rest (a transparent/glass bar over the very top of bone-first pages would
 * read as nothing), and frosts into .glass-dark once the page has scrolled
 * under it (>24px). Plain passive scroll listener; Lenis drives native
 * window scroll, so window.scrollY stays truthful.
 */
export function NavShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 text-bone transition-colors duration-300 ${
        scrolled ? "glass-dark" : "bg-ink border-b border-bone/10"
      }`}
    >
      {children}
    </header>
  );
}
