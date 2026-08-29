import Link from "next/link";
import { MonthDial } from "@/components/MonthDial";
import { ParkCard } from "@/components/ParkCard";
import { ParkScape } from "@/components/ParkScape";
import { WildlifeIcon } from "@/components/WildlifeIcon";
import { getParkAccent } from "@/lib/park-theme";
import { UsMap } from "@/components/UsMap";
import { bestByMonth, hiddenGemsForMonth, parkByCode } from "@/lib/repo";
import { monthByAbbr, currentMonthAbbr } from "@/lib/months";
import { US_MAP_WIDTH, US_MAP_HEIGHT, US_STATE_PATHS } from "@/lib/us-map-geo";
import { getMapPins, getOffMapParks } from "@/lib/us-map-pins";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { getWildlife } from "@/lib/data/park-wildlife";

/** Real species, real parks, real links — one per wildlife category so the mix isn't all bears. */
const WILDLIFE_SHOWCASE = ["yell", "deva", "ever", "indu", "grca", "acad"];

export const revalidate = 86400; // re-check the calendar daily so "this month" never goes stale

export default async function Home() {
  const DEFAULT_MONTH = currentMonthAbbr();
  const month = monthByAbbr(DEFAULT_MONTH)!;
  const best = bestByMonth(DEFAULT_MONTH);
  const gems = hiddenGemsForMonth(DEFAULT_MONTH);
  const pins = await getMapPins();
  const offMap = getOffMapParks();

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-10 pb-6 grid md:grid-cols-[1fr_1.15fr] gap-12 items-center">
        <div>
          <h1 className="font-display uppercase text-5xl md:text-7xl leading-[0.98] mb-5">
            Find your park.<br />
            Find your <span className="text-accent">month</span>.
          </h1>
          <p className="max-w-[36ch] text-paper-dim mb-7">
            63 National Parks, scored on climate and access &mdash; never on popularity.
            Click a pin to see what&rsquo;s actually good right now.
          </p>
          <div className="flex flex-wrap gap-4 mb-7">
            <Link href="#results" className="px-6 py-3.5 rounded-sm bg-accent text-basalt-deep font-semibold text-sm">
              Explore by month &rarr;
            </Link>
            <Link href="/rankings" className="px-6 py-3.5 rounded-sm border border-paper-dim text-sm">
              See rankings
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-mono text-paper-dim border-t border-white/15 pt-3">
            <span>Climate: NOAA 1991&ndash;2020 Normals</span>
            <span>Visitation: NPS IRMA, 5-yr median</span>
            <span>Month Fit v1.0</span>
          </div>
        </div>
        <div>
          <UsMap statePaths={US_STATE_PATHS} width={US_MAP_WIDTH} height={US_MAP_HEIGHT} pins={pins} />
          <div className="flex justify-between items-start gap-4 mt-3 text-xs text-paper-dim flex-wrap">
            <span className="flex items-center gap-4">
              <span><span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />Full Month Fit scoring</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-full border border-paper-dim mr-1.5" />Profile &amp; live conditions</span>
            </span>
            {offMap.length > 0 && (
              <span>
                Not shown on this projection:{" "}
                {offMap.map((p, i) => (
                  <span key={p.name}>
                    <Link href={`/parks/${p.code}`} className="underline underline-offset-2">{p.name}</Link>
                    {i < offMap.length - 1 ? " & " : ""}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <TopoDivider accent={getParkAccent(best[0].park)} />

      <section id="results" className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="flex items-center gap-8 flex-wrap mb-8">
          <div className="flex-1 min-w-[240px]">
            <h2 className="font-display uppercase text-3xl mb-1">Best in {month.name}</h2>
            <span className="text-xs font-mono text-paper-dim">Tiered, not ranked &middot; Why-panel on every card</span>
          </div>
          <MonthDial activeMonth={DEFAULT_MONTH} subtitle="Turn to change month" />
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {best.map((row) => (
            <ParkCard key={row.park} park={parkByCode(row.park)!} row={row} />
          ))}
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
          <h2 className="font-display uppercase text-3xl">Hidden Gems This Month</h2>
          <span className="text-xs font-mono text-paper-dim">Month Fit &ge;85 AND crowd percentile &le;40</span>
        </div>
        {gems.length === 0 ? (
          <p className="text-paper-dim text-sm">No cohort park clears the Hidden Gems bar for {month.name} yet &mdash; check another month.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {gems.map((g) => {
              const p = parkByCode(g.park)!;
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
      </section>

      <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
          <h2 className="font-display uppercase text-3xl">Who You Might Meet</h2>
          <Link href="/parks" className="text-xs underline underline-offset-2">See every park &rarr;</Link>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {WILDLIFE_SHOWCASE.map((code) => {
            const p = ALL_PARKS_MINI.find((mp) => mp.code === code)!;
            const wildlife = getWildlife(code)!;
            const accent = getParkAccent(code);
            return (
              <Link key={code} href={`/parks/${code}`} className="rounded-sm border border-white/15 p-4 flex flex-col gap-2 hover:border-white/30 transition-colors">
                <span className="rounded-full p-1.5 self-start" style={{ background: `${accent}33` }}>
                  <WildlifeIcon wildlife={wildlife} color={accent} size={32} />
                </span>
                <div>
                  <div className="font-bold">{wildlife.name}</div>
                  <p className="text-xs text-paper-dim">{p.name}, {p.state}</p>
                </div>
                <p className="text-sm text-paper-dim">{wildlife.fact}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function TopoDivider({ accent }: { accent: string }) {
  return (
    <svg className="w-full h-[50px] block" viewBox="0 0 1400 50" preserveAspectRatio="none" aria-hidden>
      <path d="M0,25 Q175,5 350,25 T700,25 T1050,25 T1400,25" fill="none" stroke={accent} strokeWidth={1.5} opacity={0.8} />
      <path d="M0,35 Q175,18 350,35 T700,35 T1050,35 T1400,35" fill="none" stroke="#cfc9b8" strokeWidth={1} opacity={0.3} />
    </svg>
  );
}
