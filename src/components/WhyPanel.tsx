import { ScoredMonth } from "@/lib/repo";
import { monthByAbbr } from "@/lib/months";
import { CLIMATE_WEIGHT, ACCESSIBILITY_WEIGHT, METHODOLOGY_VERSION, METHODOLOGY_CALCULATED_AT } from "@/lib/scoring";
import { TierBadge } from "./TierBadge";

export function WhyPanel({ row, parkName }: { row: ScoredMonth; parkName: string }) {
  const month = monthByAbbr(row.month)!;
  const showWhyNotNow = (row.tier === "Specialized" || row.tier === "Limited") && row.whyNotNow?.length;

  return (
    <details className="group rounded-sm border border-white/15 bg-basalt-deep/60 open:bg-basalt-deep">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
        <span>Why? {parkName} &middot; {month.name} &middot; Fit {row.overallMonthFit} <TierBadge tier={row.tier} /></span>
        <span className="font-mono text-xs text-paper-dim group-open:rotate-180 transition-transform">&#9660;</span>
      </summary>
      <div className="px-4 pb-4 pt-1 flex flex-col gap-4 text-sm">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="text-paper-dim border-b border-white/10">
              <th className="py-1 pr-2 font-normal">Component</th>
              <th className="py-1 pr-2 font-normal">Weight</th>
              <th className="py-1 pr-2 font-normal">Score</th>
              <th className="py-1 font-normal">Source</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-1.5 pr-2">Climate suitability</td>
              <td className="py-1.5 pr-2">{Math.round(CLIMATE_WEIGHT * 100)}%</td>
              <td className="py-1.5 pr-2">{row.climateScore}</td>
              <td className="py-1.5">NOAA 1991&ndash;2020 Normals &middot; {row.climateStation} ({row.climateStationElevFt} ft)</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2">Seasonal accessibility</td>
              <td className="py-1.5 pr-2">{Math.round(ACCESSIBILITY_WEIGHT * 100)}%</td>
              <td className="py-1.5 pr-2">{row.accessibilityScore}</td>
              <td className="py-1.5">NPS operating seasons &middot; road status</td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-paper-dim">
          <span>Data confidence: <strong className="text-paper">{row.dataConfidence}</strong></span>
          <span>Popularity this month: {row.percentOfAnnualVisits}% of annual visits (informational, not scored)</span>
          <span>Month Fit {METHODOLOGY_VERSION} &middot; calculated {METHODOLOGY_CALCULATED_AT}</span>
        </div>

        {row.missingComponents.length > 0 && (
          <p className="text-xs text-paper-dim">Missing: {row.missingComponents.join("; ")}</p>
        )}

        {row.experienceTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {row.experienceTags.map((tag) => (
              <span key={tag} className="text-[0.7rem] px-2 py-0.5 rounded-full border border-white/20 text-paper-dim">
                {tag}
              </span>
            ))}
          </div>
        )}

        {showWhyNotNow && (
          <div className="rounded-sm border border-accent/40 bg-accent/10 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent mb-2">Why not now?</p>
            <ul className="text-sm space-y-1 mb-2">
              {row.whyNotNow!.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="text-xs text-paper-dim">
              This is a specialized experience, not a typical first visit &mdash; not &ldquo;don&rsquo;t go.&rdquo;
            </p>
          </div>
        )}
      </div>
    </details>
  );
}
