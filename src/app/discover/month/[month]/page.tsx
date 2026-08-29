import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthDial } from "@/components/MonthDial";
import { ParkCard } from "@/components/ParkCard";
import { ParkScape } from "@/components/ParkScape";
import { WildlifeIcon } from "@/components/WildlifeIcon";
import { getParkAccent } from "@/lib/park-theme";
import { getWildlife } from "@/lib/data/park-wildlife";
import { bestByMonth, hiddenGemsForMonth, getParkSummary } from "@/lib/repo";
import { MONTHS, monthByAbbr } from "@/lib/months";
import { MonthAbbr } from "@/lib/types";

export function generateStaticParams() {
  return MONTHS.map((m) => ({ month: m.abbr }));
}

export default async function MonthPage(props: PageProps<"/discover/month/[month]">) {
  const { month: monthParam } = await props.params;
  const month = monthByAbbr(monthParam);
  if (!month) notFound();

  const best = bestByMonth(month.abbr as MonthAbbr);
  const gems = hiddenGemsForMonth(month.abbr as MonthAbbr);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center mb-10">
        <div>
          <p className="text-xs font-mono text-paper-dim uppercase tracking-wide mb-2">By Month</p>
          <h1 className="font-display uppercase text-4xl md:text-5xl mb-3">Best parks in {month.name}</h1>
          <p className="text-paper-dim max-w-[50ch]">
            Ranked by Month Fit &mdash; climate suitability (60%) and seasonal accessibility (40%). Never by popularity.
          </p>
        </div>
        <MonthDial activeMonth={month.abbr} subtitle={`${best.length} of 63 parks scored`} />
      </div>

      <div className="grid gap-5 mb-14" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {best.map((row) => (
          <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} />
        ))}
      </div>

      <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
        <h2 className="font-display uppercase text-2xl">Hidden Gems This Month</h2>
        <span className="text-xs font-mono text-paper-dim">Month Fit &ge;85 AND crowd percentile &le;40</span>
      </div>
      {gems.length === 0 ? (
        <p className="text-paper-dim text-sm">No park clears the Hidden Gems bar for {month.name}.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {gems.map((g) => {
            const p = getParkSummary(g.park);
            const accent = getParkAccent(g.park);
            const wildlife = getWildlife(g.park);
            return (
              <Link
                key={g.park}
                href={`/parks/${g.park}`}
                className="flex-none w-[240px] rounded-sm overflow-hidden bg-paper text-basalt-deep flex flex-col"
              >
                <div className="relative">
                  <ParkScape park={g.park} state={p.state} accent={accent} aspect="16/8" />
                  {wildlife && (
                    <span className="absolute bottom-2 left-2 rounded-full p-1" style={{ background: `${accent}55` }}>
                      <WildlifeIcon wildlife={wildlife} color={accent} size={20} />
                    </span>
                  )}
                </div>
                <div className="p-3.5 flex flex-col gap-1">
                  <span className="font-bold">{p.name}</span>
                  <p className="text-xs text-basalt-deep/70">Fit {g.overallMonthFit} &middot; {g.crowdPercentile}th crowd percentile</p>
                  <span className="text-xs font-semibold" style={{ color: accent }}>{g.percentOfAnnualVisits}% of annual visits</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
