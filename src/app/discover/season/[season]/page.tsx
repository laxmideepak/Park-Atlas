import { notFound } from "next/navigation";
import { TierBadge } from "@/components/TierBadge";
import { bestBySeason, parkByCode } from "@/lib/repo";
import { SEASONS } from "@/lib/months";
import Link from "next/link";

export function generateStaticParams() {
  return SEASONS.map((s) => ({ season: s.key }));
}

export default async function SeasonPage(props: PageProps<"/discover/season/[season]">) {
  const { season: seasonParam } = await props.params;
  const season = SEASONS.find((s) => s.key === seasonParam);
  if (!season) notFound();

  const ranked = bestBySeason(season.key);

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
      <p className="text-xs font-mono text-paper-dim uppercase tracking-wide mb-2">By Season</p>
      <h1 className="font-display uppercase text-4xl md:text-5xl mb-3">{season.name}</h1>
      <p className="text-paper-dim max-w-[60ch] mb-3">
        Season Fit is the mean of the season&rsquo;s three Month Fit scores &mdash; an aggregation, not a separate model.
        For the exact per-month picture, use{" "}
        {season.months.map((m, i) => (
          <span key={m}>
            <Link href={`/discover/month/${m}`} className="underline underline-offset-2">
              {m}
            </Link>
            {i < season.months.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>

      <div className="flex flex-col gap-3 mt-8">
        {ranked.map(({ park, fit, tier }) => {
          const p = parkByCode(park)!;
          return (
            <div key={park} className="flex items-center justify-between gap-4 rounded-sm border border-white/15 px-5 py-4">
              <div>
                <Link href={`/parks/${park}`} className="font-bold hover:underline underline-offset-2">
                  {p.name}
                </Link>
                <p className="text-xs text-paper-dim">{p.state}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-paper-dim">Season Fit {fit}</span>
                <TierBadge tier={tier} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
