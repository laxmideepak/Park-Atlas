import Link from "next/link";
import { ParkCard } from "@/components/ParkCard";
import { getParkAccent } from "@/lib/park-theme";
import { UsMap } from "@/components/UsMap";
import { HomeHero } from "@/components/HomeHero";
import { YearScroller, type YearChapter } from "@/components/YearScroller";
import { Preloader } from "@/components/Preloader";
import { bestByMonth, hiddenGemsForMonth, getParkSummary, scoresForPark } from "@/lib/repo";
import { NearestGemFallback } from "@/components/NearestGemFallback";
import { monthByAbbr, currentMonthAbbr, MONTHS } from "@/lib/months";
import { US_MAP_WIDTH, US_MAP_HEIGHT, US_STATE_PATHS } from "@/lib/us-map-geo";
import { getMapPins, getOffMapParks } from "@/lib/us-map-pins";
import { fetchParkImages } from "@/lib/nps";
import { crowdRelief } from "@/lib/scoring";
import { pickHero, pickCard, pickScrollerChapter } from "@/lib/image-select";

export const revalidate = 86400; // re-check the calendar daily so "this month" never goes stale

/** One curated park per month for the hero photo — chosen for photography
 * quality and seasonal fit (alpine in August, desert in January), not
 * derived from the Fit engine. The Year Scroller below uses the real
 * engine (bestByMonth) instead. */
const HERO_BY_MONTH: Record<string, string> = {
  jan: "deva",
  feb: "jotr",
  mar: "grca",
  apr: "grsm",
  may: "acad",
  jun: "glac",
  jul: "yell",
  aug: "grte",
  sep: "zion",
  oct: "acad",
  nov: "romo",
  dec: "wrst",
};

export default async function Home() {
  const DEFAULT_MONTH = currentMonthAbbr();
  const month = monthByAbbr(DEFAULT_MONTH)!;
  const best = bestByMonth(DEFAULT_MONTH);
  const gems = hiddenGemsForMonth(DEFAULT_MONTH);
  const pins = await getMapPins();
  const offMap = getOffMapParks();

  const heroParkCode = HERO_BY_MONTH[DEFAULT_MONTH] ?? "yell";
  const heroImages = await fetchParkImages(heroParkCode);

  // One photo fetch per unique park needed anywhere on this page (Year
  // Scroller + Best-in-Month + Hidden Gems), deduped by code. Also fetch
  // each month's #2 park as a fallback source for the Scroller's >=2000px bar.
  const monthTops = MONTHS.map((m) => ({ m, top: bestByMonth(m.abbr)[0], runnerUp: bestByMonth(m.abbr)[1] }));
  const uniqueParkCodes = [
    ...new Set([
      ...monthTops.map((mt) => mt.top.park),
      ...monthTops.map((mt) => mt.runnerUp?.park).filter((c): c is string => Boolean(c)),
      ...best.slice(0, 8).map((r) => r.park),
      ...gems.map((g) => g.park),
    ]),
  ];
  const imagesByCode = new Map(
    await Promise.all(uniqueParkCodes.map(async (code) => [code, await fetchParkImages(code)] as const))
  );
  const yearChapters: YearChapter[] = monthTops.map(({ m, top, runnerUp }) => {
    const summary = getParkSummary(top.park);
    const rows = scoresForPark(top.park);
    const peak = Math.max(...rows.map((r) => r.percentOfAnnualVisits));
    const relief = crowdRelief(top.percentOfAnnualVisits, peak);
    // Scroller chapters are the site's 12 most-seen pixels — hold to a
    // higher resolution bar than a regular hero; fall through to the
    // month's runner-up park if the #1 has nothing that large.
    const chapterImage =
      pickScrollerChapter(imagesByCode.get(top.park) ?? [], top.park) ??
      (runnerUp ? pickScrollerChapter(imagesByCode.get(runnerUp.park) ?? [], runnerUp.park) : null);
    return {
      monthAbbr: m.abbr,
      monthName: m.name,
      parkCode: top.park,
      parkName: summary.name,
      accent: getParkAccent(top.park),
      image: chapterImage,
      fit: top.overallMonthFit,
      tier: top.tier,
      crowdReliefPct: Math.round(relief * 100),
    };
  });

  const preloaderFacts = yearChapters
    .filter((c) => c.tier === "Limited" || c.tier === "Specialized")
    .map((c) => `${c.parkName}'s toughest month is ${c.monthName} — its Fit is ${c.fit}.`);
  const facts = preloaderFacts.length > 0
    ? preloaderFacts
    : [`${month.name}'s best-scoring park right now is ${getParkSummary(best[0].park).name} — Fit ${best[0].overallMonthFit}.`];

  return (
    <>
      <Preloader facts={facts} />

      <HomeHero
        image={pickHero(heroImages, heroParkCode)}
        accent={getParkAccent(heroParkCode)}
        sourceStrip={["63 parks", "scored on climate + access", "never on popularity", "Month Fit v1.0"]}
      />

      <YearScroller chapters={yearChapters} />

      {/* Best right now — bone */}
      <section className="bg-bone text-ink py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <h2 className="font-display text-display-lg leading-none mb-2">This is {month.name}.</h2>
          <p className="font-mono text-mono-sm text-ink-soft mb-10">Climate 60 &middot; access 40 &middot; popularity 0</p>

          <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {best.slice(0, 8).map((row) => (
              <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
            ))}
          </div>
          <Link href={`/discover/month/${DEFAULT_MONTH}`} className="font-mono text-mono-sm underline underline-offset-2">
            See all 63 parks ranked for {month.name} &rarr;
          </Link>

          <div className="mt-16 pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <h3 className="font-display text-display-md">Hidden gems this month</h3>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={DEFAULT_MONTH} />
            ) : (
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Atlas — ink */}
      <section className="bg-ink text-bone py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <h2 className="font-display text-display-lg leading-none mb-8">Where it&rsquo;s good, right now.</h2>
          <UsMap statePaths={US_STATE_PATHS} width={US_MAP_WIDTH} height={US_MAP_HEIGHT} pins={pins} />
          <div className="flex justify-between items-start gap-4 mt-4 font-mono text-mono-sm text-bone/60 flex-wrap">
            <span className="flex items-center gap-4">
              <span><span className="inline-block w-2 h-2 rounded-full bg-brass mr-1.5" />Exceptional</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-brass/65 mr-1.5" />Excellent</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-bone/40 mr-1.5" />Good</span>
              <span><span className="inline-block w-2 h-2 rounded-full border border-bone/60 mr-1.5" />Specialized/Limited</span>
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
      </section>

      {/* Index teaser — bone */}
      <section className="bg-bone text-ink py-20">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="font-display text-display-md leading-tight max-w-[20ch]">Sixty-three parks. One page each. No exceptions.</p>
          <Link href="/parks" className="font-mono text-sm px-6 py-3.5 rounded-sm bg-brass text-ink font-semibold whitespace-nowrap">
            Browse all 63 &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
