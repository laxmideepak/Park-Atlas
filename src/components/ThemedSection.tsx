import type { ReactNode } from "react";
import { SECTION_THEMES } from "@/lib/section-themes";
import { SectionPattern } from "@/components/SectionPattern";

/**
 * Section wrapper that gives park-page chapters their quiet identity: a ~5%
 * hue wash bleeding slightly past the content, a low-opacity line pattern,
 * and a mono eyebrow led by a 2px hue tick (the label itself stays ink-soft
 * for contrast). Unthemed ids (overview, current conditions) pass through as
 * a plain <section> — the id always lands on the outer <section> so the
 * ChapterRail's IntersectionObserver and anchor scrolls keep working.
 */
export function ThemedSection({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const theme = SECTION_THEMES[id];
  if (!theme) {
    return (
      <section id={id} className={className}>
        {children}
      </section>
    );
  }
  return (
    <section id={id} className={`relative ${className ?? ""}`}>
      <div
        className="absolute -inset-x-6 -inset-y-8 rounded-sm overflow-hidden pointer-events-none"
        aria-hidden
        style={{ background: `${theme.hue}0D` }}
      >
        <SectionPattern kind={theme.pattern} hue={theme.hue} />
      </div>
      <div className="relative">
        <p className="font-mono text-mono-sm uppercase tracking-wide mb-1 flex items-center gap-2">
          <span aria-hidden className="inline-block w-4 h-[2px]" style={{ background: theme.hue }} />
          <span className="text-ink-soft">{theme.eyebrow}</span>
        </p>
        {children}
      </div>
    </section>
  );
}
