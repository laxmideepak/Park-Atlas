import Link from "next/link";
import { nearestHiddenGem, getParkSummary } from "@/lib/repo";
import { monthByAbbr } from "@/lib/months";
import { MonthAbbr } from "@/lib/types";

/** Hidden Gems empty state that points somewhere real instead of an empty box. */
export function NearestGemFallback({ currentMonth }: { currentMonth: MonthAbbr }) {
  const nearest = nearestHiddenGem(currentMonth);
  const monthName = monthByAbbr(currentMonth)!.name;

  if (!nearest) {
    return <p className="text-paper-dim text-sm font-mono">No park clears the Hidden Gems bar in {monthName}.</p>;
  }

  const park = getParkSummary(nearest.park);
  const nearestMonthName = monthByAbbr(nearest.month)!.name;

  return (
    <p className="text-paper-dim text-sm font-mono">
      No park clears the Hidden Gems bar in {monthName} &mdash; nearest:{" "}
      <Link href={`/parks/${nearest.park}`} className="underline underline-offset-2 text-paper">
        {park.name}
      </Link>{" "}
      in{" "}
      <Link href={`/discover/month/${nearest.month}`} className="underline underline-offset-2 text-paper">
        {nearestMonthName}
      </Link>{" "}
      &rarr;
    </p>
  );
}
