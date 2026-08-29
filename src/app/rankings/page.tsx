import Link from "next/link";
import { OFFICIAL_MOST_VISITED_2025, OFFICIAL_SYSTEMWIDE_2025 } from "@/lib/data/official-rankings";
import { PARKS } from "@/lib/data/parks";
import { hiddenGemsForMonth, getParkSummary, visitsPerAcre, crowdBandsForMonth } from "@/lib/repo";
import { TierBadge } from "@/components/TierBadge";
import { CROWD_BAND_COLOR, type CrowdBand } from "@/lib/scoring";
import { currentMonthAbbr } from "@/lib/months";
import { NearestGemFallback } from "@/components/NearestGemFallback";

export const revalidate = 86400; // re-check the calendar daily so "this month" never goes stale

export const metadata = {
  title: "Rankings — Official vs. Calculated | ParkAtlas",
  description:
    "Official NPS visitation rankings alongside ParkAtlas's own versioned, confidence-rated tier rankings — least crowded, hidden gems, and largest parks.",
  alternates: { canonical: "/rankings" },
};

export default function RankingsPage() {
  const CURRENT_MONTH = currentMonthAbbr();
  const gems = hiddenGemsForMonth(CURRENT_MONTH);
  const largest = [...PARKS].sort((a, b) => b.acreage - a.acreage);
  const leastCrowded = crowdBandsForMonth(CURRENT_MONTH).slice(0, 10);

  return (
    <div className="bg-bone text-ink min-h-screen py-16">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col gap-16">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-display-xl leading-none mb-4">Rankings</h1>
            <p className="text-ink-soft max-w-[65ch]">
              Official rankings use raw government data and get ordinal ranks. Calculated rankings are versioned,
              confidence-rated, and display as tiers &mdash; never a false-precision #1&ndash;63.
            </p>
          </div>
          <Link href="/parks" className="font-mono text-mono-sm underline underline-offset-2 whitespace-nowrap">
            Browse all 63 parks &rarr;
          </Link>
        </div>

        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Most visited <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">{OFFICIAL_SYSTEMWIDE_2025.source}</p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {OFFICIAL_MOST_VISITED_2025.map((r) => (
              <li key={r.rank} className="flex items-center gap-4 py-3">
                <span className="font-mono text-mono-sm text-ink-soft w-6">{r.rank}</span>
                <Link href={`/parks/${r.parkCode}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {r.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{r.visits.toLocaleString()} visits</span>
              </li>
            ))}
          </ol>
          <p className="font-mono text-mono-sm text-ink-soft mt-3">{OFFICIAL_SYSTEMWIDE_2025.note}</p>
        </section>

        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Largest <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Official, cohort only</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">NPS Land Resources, quarterly reports &middot; full 63-park ranking lands Phase 1</p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {largest.map((p, i) => (
              <li key={p.code} className="flex items-center gap-4 py-3">
                <span className="font-mono text-mono-sm text-ink-soft w-6">{i + 1}</span>
                <Link href={`/parks/${p.code}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                  {p.name}
                </Link>
                <span className="font-mono text-mono-sm text-ink-soft">{p.acreage.toLocaleString()} acres</span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Least crowded <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">
            Cross-park crowd percentile for {CURRENT_MONTH}, lowest first &mdash; a band, not an ordinal rank.
          </p>
          <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
            {leastCrowded.map((p) => {
              const summary = getParkSummary(p.park);
              return (
                <li key={p.park} className="flex items-center gap-4 py-3">
                  <Link href={`/parks/${p.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                    {summary.name}
                  </Link>
                  <CrowdBandBadge band={p.band} />
                  <span className="font-mono text-mono-sm text-ink-soft">{p.crowdPercentile}th pctile</span>
                </li>
              );
            })}
          </ol>
          <details className="mt-4 group">
            <summary className="cursor-pointer font-mono text-mono-sm text-ink-soft underline underline-offset-2 list-none">
              Visits per acre (experimental, 4-park sample only) &darr;
            </summary>
            <p className="font-mono text-mono-sm text-ink-soft mt-2 mb-3">
              Always approximate: a huge wilderness park can look empty on paper while everyone shares one
              corridor (e.g. Death Valley&rsquo;s Badwater Road) &mdash; this is exactly the misleading case the
              percentile ranking above is designed to avoid. Real acreage/visitation only exists for the
              4-park editorial cohort today.
            </p>
            <ol className="flex flex-col divide-y divide-ink/10">
              {PARKS.map((p) => (
                <li key={p.code} className="flex items-center gap-4 py-2">
                  <Link href={`/parks/${p.code}`} className="hover:underline underline-offset-2 flex-1 text-sm">{p.name}</Link>
                  <span className="font-mono text-mono-sm text-ink-soft">{visitsPerAcre(p.code)} visits/acre</span>
                </li>
              ))}
            </ol>
          </details>
        </section>

        <section>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
            <h2 className="font-display text-display-lg leading-none">Hidden gems this month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
            <Link href={`/discover/month/${CURRENT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">See all months &rarr;</Link>
          </div>
          <p className="font-mono text-mono-sm text-ink-soft mb-6">Month Fit &ge;85 AND crowd percentile &le;40 &middot; recomputed monthly</p>
          {gems.length === 0 ? (
            <NearestGemFallback currentMonth={CURRENT_MONTH} />
          ) : (
            <ol className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
              {gems.map((g) => {
                const p = getParkSummary(g.park);
                return (
                  <li key={g.park} className="flex items-center gap-4 py-3">
                    <Link href={`/parks/${g.park}`} className="font-display text-display-md leading-tight flex-1 hover:underline underline-offset-4">
                      {p.name}
                    </Link>
                    <TierBadge tier={g.tier} onLight />
                    <span className="font-mono text-mono-sm text-ink-soft">Fit {g.overallMonthFit}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section>
          <h2 className="font-display text-display-lg leading-none mb-1">Best by month <span className="font-mono text-mono-sm text-ink-soft normal-case">&middot; Calculated</span></h2>
          <p className="text-ink-soft mb-6">Tiered results for any month of the year, across all 63 parks.</p>
          <div className="flex flex-wrap gap-2">
            {["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].map((m) => (
              <Link key={m} href={`/discover/month/${m}`} className="px-3 py-1.5 rounded-full border border-ink/20 font-mono text-mono-sm uppercase hover:border-brass transition-colors">
                {m}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CrowdBandBadge({ band }: { band: CrowdBand }) {
  return (
    <span
      className="font-mono text-mono-sm uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border border-ink/15 text-ink"
      style={{ background: CROWD_BAND_COLOR[band] }}
    >
      {band}
    </span>
  );
}
