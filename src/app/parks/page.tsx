import Link from "next/link";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { ParkScape } from "@/components/ParkScape";
import { WildlifeIcon } from "@/components/WildlifeIcon";
import { getParkAccent } from "@/lib/park-theme";
import { getWildlife } from "@/lib/data/park-wildlife";

export const metadata = {
  title: "All 63 National Parks — ParkAtlas",
};

export default function ParksIndexPage() {
  const parks = [...ALL_PARKS_MINI].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-display uppercase text-4xl md:text-5xl mb-2">All 63 National Parks</h1>
          <p className="text-paper-dim max-w-[65ch]">
            Every designated National Park now has Month Fit scoring — hand-authored for the 4-park
            validation cohort, estimated by park type for the rest pending real NOAA/NPS data. Only the
            cohort carries the full curated guide (hikes, water, dining); every park gets a live profile,
            current conditions, and its own signature wildlife.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-paper-dim flex-none">
          <span><span className="inline-block w-2 h-2 rounded-full bg-accent mr-1.5" />Full guide (hikes, water, dining)</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full border border-paper-dim mr-1.5" />Scored + live profile</span>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {parks.map((p) => {
          const accent = getParkAccent(p.code);
          const wildlife = getWildlife(p.code);
          return (
            <Link
              key={p.code}
              href={`/parks/${p.code}`}
              className="group rounded-sm overflow-hidden bg-paper text-basalt-deep flex flex-col"
            >
              <div className="relative">
                <ParkScape park={p.code} state={p.state} accent={accent} aspect="16/9" />
                <span
                  className="absolute top-2 right-2 w-3 h-3 rounded-full"
                  style={{ background: p.cohort ? accent : "transparent", border: p.cohort ? "none" : "1.5px solid #ffffffaa" }}
                  title={p.cohort ? "Full guide (hikes, water, dining)" : "Scored + live profile"}
                />
                {wildlife && (
                  <span className="absolute bottom-2 left-2 rounded-full p-1" style={{ background: `${accent}55` }}>
                    <WildlifeIcon wildlife={wildlife} color={accent} size={20} />
                  </span>
                )}
              </div>
              <div className="p-3.5 flex flex-col gap-0.5">
                <span className="font-bold group-hover:underline underline-offset-2">{p.name}</span>
                <span className="text-xs text-basalt-deep/60">{p.state}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
