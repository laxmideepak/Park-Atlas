import Link from "next/link";
import { METHODOLOGY_VERSION, METHODOLOGY_CALCULATED_AT } from "@/lib/scoring";
import { MONTHS } from "@/lib/months";

/** §7.7 — ink chapter, serif sign-off, mono columns. */
export function Footer() {
  return (
    <footer className="bg-ink text-bone mt-16">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-16 flex flex-col gap-12">
        <p className="font-display text-display-lg leading-none">Public data. Plain answers.</p>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 font-mono text-mono-sm text-bone/70">
          <div className="flex flex-col gap-2">
            <span className="text-bone uppercase tracking-wide mb-1">Months</span>
            {MONTHS.slice(0, 6).map((m) => (
              <Link key={m.abbr} href={`/discover/month/${m.abbr}`} className="hover:text-brass transition-colors">{m.name}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-bone uppercase tracking-wide mb-1 sm:invisible">Months</span>
            {MONTHS.slice(6, 12).map((m) => (
              <Link key={m.abbr} href={`/discover/month/${m.abbr}`} className="hover:text-brass transition-colors">{m.name}</Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-bone uppercase tracking-wide mb-1">Parks</span>
            <Link href="/parks" className="hover:text-brass transition-colors">All 63 parks</Link>
            <Link href="/rankings" className="hover:text-brass transition-colors">Rankings</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-bone uppercase tracking-wide mb-1">Sources</span>
            <span>NPS Data API</span>
            <span>National Weather Service</span>
            <span>NOAA 1991&ndash;2020 Normals</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-3 text-xs text-bone/60 border-t border-bone/10 pt-6">
          <p className="max-w-2xl">
            ParkAtlas is an independent project and is not affiliated with or endorsed by the National Park Service.
            Park descriptions, fees, and alerts are fetched live from the NPS Data API for all 63 parks. Month
            Fit climate/accessibility curves are hand-authored for the 4-park validation cohort (Acadia,
            Yellowstone, Death Valley, Great Smoky Mountains) and estimated by park type for the rest &mdash; no
            live NOAA/NPS accessibility pipeline exists yet for any park.
          </p>
          <p className="font-mono whitespace-nowrap">
            Month Fit {METHODOLOGY_VERSION} &middot; calculated {METHODOLOGY_CALCULATED_AT}
          </p>
        </div>
      </div>
    </footer>
  );
}
