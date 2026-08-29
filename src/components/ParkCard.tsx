import Image from "next/image";
import Link from "next/link";
import { ScoredMonth, ParkSummary } from "@/lib/repo";
import { TierBadge } from "./TierBadge";
import { WhyDrawer } from "./WhyDrawer";
import { ContourField } from "./ContourField";
import { getParkAccent } from "@/lib/park-theme";
import type { ParkImage } from "@/lib/nps";

/** §7.1 ParkFeatureCard. */
export function ParkCard({ park, row, image }: { park: ParkSummary; row: ScoredMonth; image?: ParkImage | null }) {
  const accent = getParkAccent(park.code);
  return (
    <div className="bg-bone-deep text-ink rounded-sm overflow-hidden flex flex-col h-full">
      <Link href={`/parks/${park.code}`} className="group block relative aspect-[4/5] overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || park.name}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover img-grade transition-transform duration-[600ms] group-hover:scale-[1.04]"
            style={{ viewTransitionName: `park-hero-${park.code}` }}
          />
        ) : (
          <ContourField name={park.name} accent={accent} />
        )}
      </Link>
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <TierBadge tier={row.tier} onLight />
        <Link href={`/parks/${park.code}`} className="font-display text-display-md leading-tight hover:underline underline-offset-4 decoration-1">
          {park.name}
        </Link>
        <p className="text-sm text-ink-soft flex-1">{park.tagline}</p>
        <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-mono-sm text-ink-soft border-t border-dashed border-ink/15 pt-2">
          <span>Fit {row.overallMonthFit}</span>
          <span>&middot;</span>
          <span>{row.tier}</span>
          <span>&middot;</span>
          <span>{row.percentOfAnnualVisits}% of annual visits</span>
        </div>
        <WhyDrawer row={row} parkName={park.name} />
      </div>
    </div>
  );
}
