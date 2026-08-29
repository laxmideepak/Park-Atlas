"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScoredMonth } from "@/lib/repo";
import { monthByAbbr } from "@/lib/months";
import { CLIMATE_WEIGHT, ACCESSIBILITY_WEIGHT, METHODOLOGY_VERSION, METHODOLOGY_CALCULATED_AT } from "@/lib/scoring";
import { TierBadge } from "./TierBadge";

/** §7.4 — replaces the old <details> WhyPanel with a slide-in sheet.
 * Factor-table content, confidence, and methodology footer are verbatim. */
export function WhyDrawer({
  row,
  parkName,
  trigger,
  triggerClassName,
}: {
  row: ScoredMonth;
  parkName: string;
  /** Custom trigger content (plain JSX — no event handlers of its own; WhyDrawer supplies the click). */
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const month = monthByAbbr(row.month)!;
  const showWhyNotNow = (row.tier === "Specialized" || row.tier === "Limited") && row.whyNotNow?.length;
  const isEstimated = row.climateStationElevFt === 0;

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName ?? "font-mono text-mono-sm text-ink-soft underline underline-offset-2 hover:text-brass transition-colors"}
      >
        {trigger ?? <>Why {row.overallMonthFit}? &#8599;</>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="fixed inset-0 bg-ink/50 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              ref={sheetRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`Why ${parkName} scores ${row.overallMonthFit} in ${month.name}`}
              initial={reduceMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 bg-bone text-ink overflow-y-auto
                         inset-x-0 bottom-0 max-h-[85vh] rounded-t-md
                         md:inset-y-0 md:left-auto md:right-0 md:bottom-auto md:w-[440px] md:max-h-none md:rounded-none
                         p-6 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-display-md">
                  Why {row.overallMonthFit}?
                </h3>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-ink-soft hover:text-ink text-xl leading-none">
                  &times;
                </button>
              </div>
              <p className="font-mono text-mono-sm text-ink-soft -mt-3">
                {parkName} &middot; {month.name} <TierBadge tier={row.tier} onLight />
              </p>

              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-ink-soft border-b border-ink/10">
                    <th className="py-1 pr-2 font-normal">Component</th>
                    <th className="py-1 pr-2 font-normal">Weight</th>
                    <th className="py-1 pr-2 font-normal">Score</th>
                    <th className="py-1 font-normal">Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-ink/5">
                    <td className="py-1.5 pr-2">Climate suitability</td>
                    <td className="py-1.5 pr-2">{Math.round(CLIMATE_WEIGHT * 100)}%</td>
                    <td className="py-1.5 pr-2">{row.climateScore}</td>
                    <td className="py-1.5">
                      {isEstimated ? row.climateStation : `NOAA 1991–2020 Normals · ${row.climateStation} (${row.climateStationElevFt} ft)`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-2">Seasonal accessibility</td>
                    <td className="py-1.5 pr-2">{Math.round(ACCESSIBILITY_WEIGHT * 100)}%</td>
                    <td className="py-1.5 pr-2">{row.accessibilityScore}</td>
                    <td className="py-1.5">{isEstimated ? "Estimated by park type — no NPS monthly-access dataset exists" : "NPS operating seasons · road status"}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex flex-col gap-1 font-mono text-xs text-ink-soft">
                <span>Data confidence: <strong className="text-ink">{row.dataConfidence}</strong></span>
                <span>Popularity this month: {row.percentOfAnnualVisits}% of annual visits (informational, not scored)</span>
                <span>Month Fit {METHODOLOGY_VERSION} &middot; calculated {METHODOLOGY_CALCULATED_AT}</span>
              </div>

              {row.missingComponents.length > 0 && (
                <p className="text-xs text-ink-soft">Missing: {row.missingComponents.join("; ")}</p>
              )}

              {row.experienceTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {row.experienceTags.map((tag) => (
                    <span key={tag} className="text-[0.7rem] px-2 py-0.5 rounded-full border border-ink/20 text-ink-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {showWhyNotNow && (
                <div className="rounded-sm border border-brass/40 bg-brass/10 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brass mb-2">Why not now?</p>
                  <ul className="text-sm space-y-1 mb-2">
                    {row.whyNotNow!.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-ink-soft">
                    This is a specialized experience, not a typical first visit &mdash; not &ldquo;don&rsquo;t go.&rdquo;
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
