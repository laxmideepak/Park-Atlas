import { ScoredMonth } from "@/lib/repo";
import { monthByAbbr } from "@/lib/months";

/** §6.3.4 — bone chart, ink bars, brass on the best-balance month, mono axis. */
export function CrowdCalendar({
  rows,
  estimated = false,
  bestBalanceMonth,
}: {
  rows: ScoredMonth[];
  estimated?: boolean;
  bestBalanceMonth?: string;
}) {
  const max = Math.max(...rows.map((r) => r.percentOfAnnualVisits));
  const min = Math.min(...rows.map((r) => r.percentOfAnnualVisits));
  const busiest = rows.find((r) => r.percentOfAnnualVisits === max)!;
  const quietest = rows.find((r) => r.percentOfAnnualVisits === min)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-6 text-mono-sm font-mono text-ink-soft flex-wrap">
        <span>Busiest: <strong className="text-ink">{monthByAbbr(busiest.month)!.name}</strong> ({busiest.percentOfAnnualVisits}% of visits)</span>
        <span>Quietest: <strong className="text-ink">{monthByAbbr(quietest.month)!.name}</strong> ({quietest.percentOfAnnualVisits}% of visits)</span>
        <span>{estimated ? "Estimated by park type · pending real IRMA data" : "5-yr medians · NPS IRMA"}</span>
      </div>
      <div className="flex items-end gap-2 h-40">
        {rows.map((r) => {
          const heightPct = (r.percentOfAnnualVisits / max) * 100;
          const pctOfPeak = Math.round((r.percentOfAnnualVisits / max) * 100);
          const isBest = r.month === bestBalanceMonth;
          return (
            <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-mono-sm font-mono text-ink-soft">{pctOfPeak}%</span>
              <div
                className="w-full rounded-t-sm"
                style={{ height: `${Math.max(heightPct, 4)}%`, background: isBest ? "var(--brass)" : "var(--ink)" }}
                title={`${monthByAbbr(r.month)!.name}: ${r.percentOfAnnualVisits}% of annual visits`}
              />
              <span className="text-mono-sm font-mono uppercase text-ink-soft">{r.month}</span>
            </div>
          );
        })}
      </div>
      <p className="text-mono-sm font-mono text-ink-soft">
        Bars show each month&rsquo;s share of annual visits as a % of the peak month &mdash; the number travelers can act on.
        Visitation is informational only and never enters the Month Fit score.
      </p>
    </div>
  );
}
