import Link from "next/link";
import { OFFICIAL_MOST_VISITED_2025, OFFICIAL_SYSTEMWIDE_2025 } from "@/lib/data/official-rankings";
import { PARKS } from "@/lib/data/parks";
import { hiddenGemsForMonth, parkByCode, visitsPerAcre } from "@/lib/repo";
import { TierBadge } from "@/components/TierBadge";
import { getParkAccent } from "@/lib/park-theme";
import { currentMonthAbbr } from "@/lib/months";

export const revalidate = 86400; // re-check the calendar daily so "this month" never goes stale

export default function RankingsPage() {
  const CURRENT_MONTH = currentMonthAbbr();
  const gems = hiddenGemsForMonth(CURRENT_MONTH);
  const largest = [...PARKS].sort((a, b) => b.acreage - a.acreage);
  const leastCrowded = [...PARKS].sort((a, b) => visitsPerAcre(a.code) - visitsPerAcre(b.code));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 flex flex-col gap-16">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display uppercase text-4xl md:text-5xl mb-2">Rankings</h1>
          <p className="text-paper-dim max-w-[65ch]">
            Official rankings use raw government data and get ordinal ranks. Calculated rankings are versioned,
            confidence-rated, and display as tiers &mdash; never a false-precision #1&ndash;63.
          </p>
        </div>
        <Link href="/parks" className="text-sm underline underline-offset-2 whitespace-nowrap">
          Browse all 63 parks &rarr;
        </Link>
      </div>

      <section>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h2 className="font-display uppercase text-2xl">Most Visited <span className="text-xs font-mono text-paper-dim normal-case">&middot; Official</span></h2>
        </div>
        <p className="text-xs text-paper-dim font-mono mb-4">{OFFICIAL_SYSTEMWIDE_2025.source}</p>
        <ol className="flex flex-col gap-1">
          {OFFICIAL_MOST_VISITED_2025.map((r) => (
            <li key={r.rank} className="flex items-center gap-4 py-2 border-b border-white/10 text-sm">
              <span className="font-mono text-paper-dim w-6">{r.rank}</span>
              <Dot accent={getParkAccent(r.parkCode!)} />
              <Link href={`/parks/${r.parkCode}`} className="font-medium hover:underline underline-offset-2 flex-1">
                {r.name}
              </Link>
              <span className="font-mono text-paper-dim">{r.visits.toLocaleString()} visits</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-paper-dim mt-3">{OFFICIAL_SYSTEMWIDE_2025.note}</p>
      </section>

      <section>
        <h2 className="font-display uppercase text-2xl mb-1">Largest <span className="text-xs font-mono text-paper-dim normal-case">&middot; Official, cohort only</span></h2>
        <p className="text-xs text-paper-dim font-mono mb-4">NPS Land Resources, quarterly reports &middot; full 63-park ranking lands Phase 1</p>
        <ol className="flex flex-col gap-1">
          {largest.map((p, i) => (
            <li key={p.code} className="flex items-center gap-4 py-2 border-b border-white/10 text-sm">
              <span className="font-mono text-paper-dim w-6">{i + 1}</span>
              <Dot accent={getParkAccent(p.code)} />
              <Link href={`/parks/${p.code}`} className="font-medium hover:underline underline-offset-2 flex-1">
                {p.name}
              </Link>
              <span className="font-mono text-paper-dim">{p.acreage.toLocaleString()} acres</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="font-display uppercase text-2xl mb-1">Least Crowded <span className="text-xs font-mono text-paper-dim normal-case">&middot; Calculated, experimental</span></h2>
        <p className="text-xs text-paper-dim font-mono mb-4">Visits per acre &mdash; always approximate: a huge wilderness park can look empty while everyone shares one corridor.</p>
        <ol className="flex flex-col gap-1">
          {leastCrowded.map((p, i) => (
            <li key={p.code} className="flex items-center gap-4 py-2 border-b border-white/10 text-sm">
              <span className="font-mono text-paper-dim w-6">{i + 1}</span>
              <Dot accent={getParkAccent(p.code)} />
              <Link href={`/parks/${p.code}`} className="font-medium hover:underline underline-offset-2 flex-1">
                {p.name}
              </Link>
              <span className="font-mono text-paper-dim">{visitsPerAcre(p.code)} visits/acre</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h2 className="font-display uppercase text-2xl">Hidden Gems This Month <span className="text-xs font-mono text-paper-dim normal-case">&middot; Calculated</span></h2>
          <Link href={`/discover/month/${CURRENT_MONTH}`} className="text-xs underline underline-offset-2">See all months &rarr;</Link>
        </div>
        <p className="text-xs text-paper-dim font-mono mb-4">Month Fit &ge;85 AND crowd percentile &le;40 &middot; recomputed monthly</p>
        {gems.length === 0 ? (
          <p className="text-sm text-paper-dim">No cohort park clears the bar this month.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {gems.map((g, i) => {
              const p = parkByCode(g.park)!;
              return (
                <li key={g.park} className="flex items-center gap-4 py-2 border-b border-white/10 text-sm">
                  <span className="font-mono text-paper-dim w-6">{i + 1}</span>
                  <Dot accent={getParkAccent(g.park)} />
                  <Link href={`/parks/${g.park}`} className="font-medium hover:underline underline-offset-2 flex-1">
                    {p.name}
                  </Link>
                  <TierBadge tier={g.tier} />
                  <span className="font-mono text-paper-dim">Fit {g.overallMonthFit}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-display uppercase text-2xl mb-1">Best by Month <span className="text-xs font-mono text-paper-dim normal-case">&middot; Calculated</span></h2>
        <p className="text-sm text-paper-dim mb-4">Tiered results for any month of the year, cohort-wide.</p>
        <div className="flex flex-wrap gap-2">
          {["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].map((m) => (
            <Link key={m} href={`/discover/month/${m}`} className="px-3 py-1.5 rounded-full border border-white/20 text-xs uppercase font-mono hover:border-accent transition-colors">
              {m}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Dot({ accent }: { accent: string }) {
  return <span className="inline-block w-2 h-2 rounded-full flex-none" style={{ background: accent }} />;
}
