import Link from "next/link";
import { ScoredMonth, ParkSummary } from "@/lib/repo";
import { TierBadge } from "./TierBadge";
import { WhyPanel } from "./WhyPanel";
import { ParkScape } from "./ParkScape";
import { getParkAccent } from "@/lib/park-theme";

export function ParkCard({ park, row }: { park: ParkSummary; row: ScoredMonth }) {
  return (
    <div className="bg-paper text-basalt-deep rounded-sm overflow-hidden flex flex-col">
      <ParkScape park={park.code} state={park.state} accent={getParkAccent(park.code)} aspect="16/8" />
      <div className="p-5 flex flex-col gap-2.5 flex-1">
      <TierBadge tier={row.tier} onLight />
      <Link href={`/parks/${park.code}`} className="text-lg font-bold hover:underline underline-offset-2">
        {park.name}
      </Link>
      <p className="text-sm text-basalt-deep/70 flex-1">{park.tagline}</p>
      <div className="flex justify-between text-xs text-basalt-deep/60 border-t border-dashed border-black/15 pt-2 font-mono">
        <span>Fit {row.overallMonthFit} &middot; Conf: {row.dataConfidence}</span>
        <span>{row.percentOfAnnualVisits}% of annual visits</span>
      </div>
      <div className="text-basalt-deep">
        <WhyPanel row={row} parkName={park.name} />
      </div>
      </div>
    </div>
  );
}
