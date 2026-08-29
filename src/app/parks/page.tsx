import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { getRegion } from "@/lib/park-theme";
import { scoreForParkMonth } from "@/lib/repo";
import { currentMonthAbbr } from "@/lib/months";
import { fetchParkImages } from "@/lib/nps";
import { pickCard } from "@/lib/image-select";
import { ParksIndexList, type IndexRow } from "@/components/ParksIndexList";

export const metadata = {
  title: "All 63 National Parks — ParkAtlas",
};

export const revalidate = 86400;

export default async function ParksIndexPage() {
  const month = currentMonthAbbr();
  const parks = [...ALL_PARKS_MINI].sort((a, b) => a.name.localeCompare(b.name));

  const imagesByCode = new Map(
    await Promise.all(parks.map(async (p) => [p.code, await fetchParkImages(p.code)] as const))
  );

  const rows: IndexRow[] = parks.map((p) => {
    const score = scoreForParkMonth(p.code, month);
    return {
      code: p.code,
      name: p.name,
      state: p.state,
      region: getRegion(p.state),
      tier: score?.tier ?? "Limited",
      hasFullGuide: Boolean(p.cohort),
      image: pickCard(imagesByCode.get(p.code) ?? []),
    };
  });

  return (
    <div className="bg-bone text-ink min-h-screen py-16">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10">
        <h1 className="font-display text-display-xl leading-none mb-4">All 63 National Parks</h1>
        <p className="text-ink-soft max-w-[65ch] mb-10">
          Every designated National Park now has Month Fit scoring &mdash; hand-authored for the 4-park
          validation cohort, estimated by park type for the rest pending real NOAA/NPS data. Only the
          cohort carries the full curated guide (hikes, water, dining); every park gets a live profile,
          current conditions, and a real photo where NPS rights allow it.
        </p>

        <ParksIndexList rows={rows} />
      </div>
    </div>
  );
}
