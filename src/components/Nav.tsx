import Link from "next/link";
import { currentMonthAbbr, monthByAbbr } from "@/lib/months";
import { AmbientSound } from "./AmbientSound";

/** §7.6, simplified: a solid ink bar rather than transparent-over-hero — the
 * transparent variant would go invisible on bone-first pages (rankings,
 * season pages), which is a worse trade than skipping the scroll effect. */
export function Nav() {
  const month = monthByAbbr(currentMonthAbbr())!;
  return (
    <header className="sticky top-0 z-30 bg-ink text-bone border-b border-bone/10">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-10 px-6 md:px-10 py-5">
        <Link href="/" className="font-display italic text-2xl">
          ParkAtlas
        </Link>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8 font-mono text-mono-sm">
            <Link href={`/discover/month/${month.abbr}`} className="opacity-75 hover:opacity-100 hover:text-brass transition-colors">Months</Link>
            <Link href="/parks" className="opacity-75 hover:opacity-100 hover:text-brass transition-colors">Parks</Link>
            <Link href="/rankings" className="opacity-75 hover:opacity-100 hover:text-brass transition-colors">Rankings</Link>
            <Link
              href={`/discover/month/${month.abbr}`}
              className="px-3 py-1.5 rounded-full border border-bone/25 uppercase tracking-wide hover:border-brass transition-colors"
            >
              This month: {month.abbr}
            </Link>
          </nav>
          <AmbientSound />
        </div>
      </div>
    </header>
  );
}
