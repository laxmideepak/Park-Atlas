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
  // Eyebrow text takes the hue mixed 55/45 toward ink — hue-flavored but
  // always >= 4.5:1 on bone (pure #D6A63B/#7FA3AD would fail as text).
  const eyebrowColor = `color-mix(in srgb, ${theme.hue} 55%, var(--ink))`;
  return (
    <section id={id} className={["relative", className].filter(Boolean).join(" ")}>
      <div
        className="absolute -inset-x-6 -inset-y-8 rounded-sm overflow-hidden pointer-events-none"
        aria-hidden
        style={{ background: `${theme.hue}14`, boxShadow: `inset 3px 0 0 0 ${theme.hue}B3` }}
      >
        <SectionPattern kind={theme.pattern} hue={theme.hue} uid={id} />
      </div>
      <div className="relative">
        <p className="font-mono text-mono-sm uppercase tracking-wide mb-2 flex items-center gap-2">
          <span aria-hidden className="inline-block w-6 h-[2px]" style={{ background: theme.hue }} />
          <span className="font-semibold" style={{ color: eyebrowColor }}>{theme.eyebrow}</span>
        </p>
        {children}
      </div>
    </section>
  );
}
