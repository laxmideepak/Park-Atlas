import { METHODOLOGY_VERSION, METHODOLOGY_CALCULATED_AT } from "@/lib/scoring";

export function Footer() {
  return (
    <footer className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 border-t border-white/10 mt-16 flex flex-col md:flex-row justify-between gap-3 text-xs text-paper-dim">
      <p className="max-w-2xl">
        ParkAtlas is an independent project and is not affiliated with or endorsed by the National Park Service.
        Park descriptions, fees, and alerts are fetched live from the NPS Data API for all 63 parks. Month
        Fit climate/accessibility curves are hand-authored for the 4-park validation cohort (Acadia,
        Yellowstone, Death Valley, Great Smoky Mountains) and estimated by park type for the rest — no
        live NOAA/NPS accessibility pipeline exists yet for any park.
      </p>
      <p className="font-mono whitespace-nowrap">
        Month Fit {METHODOLOGY_VERSION} &middot; calculated {METHODOLOGY_CALCULATED_AT}
      </p>
    </footer>
  );
}
