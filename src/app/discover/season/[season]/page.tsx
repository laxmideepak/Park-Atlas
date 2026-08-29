import { notFound } from "next/navigation";
import { TierBadge } from "@/components/TierBadge";
import { bestBySeason, getParkSummary } from "@/lib/repo";
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
    <div className="bg-bone text-ink min-h-screen py-16">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10">
        <p className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft mb-2">By season</p>
        <h1 className="font-display text-display-xl leading-none mb-4">{season.name}</h1>
        <p className="text-ink-soft max-w-[60ch] mb-10">
          Season Fit is the mean of the season&rsquo;s three Month Fit scores &mdash; an aggregation, not a separate model.
          For the exact per-month picture, use{" "}
          {season.months.map((m, i) => (
            <span key={m}>
              <Link href={`/discover/month/${m}`} className="underline underline-offset-2 hover:text-brass transition-colors">
                {m}
              </Link>
              {i < season.months.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>

        <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
          {ranked.map(({ park, fit, tier }) => {
            const p = getParkSummary(park);
            return (
              <div key={park} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`/parks/${park}`} className="font-display text-display-md leading-tight hover:underline underline-offset-4">
                    {p.name}
                  </Link>
                  <p className="font-mono text-mono-sm text-ink-soft">{p.state}</p>
                </div>
                <div className="flex items-center gap-3 font-mono text-mono-sm text-ink-soft">
                  <span>Season Fit {fit}</span>
                  <TierBadge tier={tier} onLight />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
