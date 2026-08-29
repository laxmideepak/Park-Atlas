import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParkCard } from "@/components/ParkCard";
import { getParkSummary } from "@/lib/repo";
import { bestByMonth, hiddenGemsForMonth } from "@/lib/repo";
import { NearestGemFallback } from "@/components/NearestGemFallback";
import { MONTHS, monthByAbbr } from "@/lib/months";
import { MonthAbbr, Tier } from "@/lib/types";
import { TIER_ORDER } from "@/lib/scoring";
import { fetchParkImages } from "@/lib/nps";
import { pickHero, pickCard } from "@/lib/image-select";
import { getParkAccent } from "@/lib/park-theme";
import { ContourField } from "@/components/ContourField";

export function generateStaticParams() {
  return MONTHS.map((m) => ({ month: m.abbr }));
}

export default async function MonthPage(props: PageProps<"/discover/month/[month]">) {
  const { month: monthParam } = await props.params;
  const month = monthByAbbr(monthParam);
  if (!month) notFound();

  const best = bestByMonth(month.abbr as MonthAbbr);
  const gems = hiddenGemsForMonth(month.abbr as MonthAbbr);
  const top = best[0];
  const topSummary = getParkSummary(top.park);

  const uniqueCodes = [...new Set([...best.map((r) => r.park), ...gems.map((g) => g.park)])];
  const imagesByCode = new Map(
    await Promise.all(uniqueCodes.map(async (code) => [code, await fetchParkImages(code)] as const))
  );
  const heroImage = pickHero(imagesByCode.get(top.park) ?? []);

  const byTier = new Map<Tier, typeof best>();
  for (const t of TIER_ORDER) byTier.set(t, []);
  for (const row of best) byTier.get(row.tier)!.push(row);

  return (
    <div className="flex flex-col">
      {/* ink hero */}
      <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden bg-ink">
        {heroImage ? (
          <Image src={heroImage.url} alt={heroImage.altText || ""} fill priority sizes="100vw" quality={85} className="object-cover" />
        ) : (
          <ContourField name={topSummary.name} accent={getParkAccent(top.park)} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
        <div className="relative h-full max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col justify-end pb-10">
          <p className="font-mono text-mono-sm uppercase tracking-wide text-bone/70 mb-1">By month</p>
          <h1 className="font-display text-display-xl leading-[0.95] text-bone mb-3">{month.name}</h1>
          <p className="font-mono text-mono-sm text-bone/70">climate 60 &middot; access 40 &middot; popularity 0 &middot; #1 right now: {topSummary.name}</p>
        </div>
      </section>

      {/* month switcher */}
      <nav className="bg-ink border-t border-bone/10 overflow-x-auto" aria-label="Choose a month">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex gap-1">
          {MONTHS.map((m) => (
            <Link
              key={m.abbr}
              href={`/discover/month/${m.abbr}`}
              className="relative flex-none px-4 py-4 font-mono text-mono-sm uppercase tracking-wide min-w-[44px] text-center"
              style={{ color: "var(--bone)", opacity: m.abbr === month.abbr ? 1 : 0.5 }}
            >
              {m.abbr}
              {m.abbr === month.abbr && <span className="absolute left-2 right-2 bottom-2 h-[2px]" style={{ background: "var(--brass)" }} />}
            </Link>
          ))}
        </div>
      </nav>

      {/* bone body, grouped by tier */}
      <div className="bg-bone text-ink py-16">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 flex flex-col gap-16">
          {TIER_ORDER.map((tier) => {
            const rows = byTier.get(tier)!;
            if (rows.length === 0) return null;
            return (
              <section key={tier}>
                <h2 className="font-display text-display-lg leading-none mb-1">{tier}</h2>
                <p className="font-mono text-mono-sm text-ink-soft mb-6">{rows.length} park{rows.length === 1 ? "" : "s"}</p>
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                  {rows.map((row) => (
                    <ParkCard key={row.park} park={getParkSummary(row.park)} row={row} image={pickCard(imagesByCode.get(row.park) ?? [])} />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="pt-10 border-t border-ink/10">
            <div className="flex justify-between items-baseline flex-wrap gap-2 mb-6">
              <h2 className="font-display text-display-md">Hidden gems this month</h2>
              <span className="font-mono text-mono-sm text-ink-soft">Month Fit &ge;85 AND crowd percentile &le;40</span>
            </div>
            {gems.length === 0 ? (
              <NearestGemFallback currentMonth={month.abbr} />
            ) : (
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
                {gems.map((g) => (
                  <ParkCard key={g.park} park={getParkSummary(g.park)} row={g} image={pickCard(imagesByCode.get(g.park) ?? [])} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
