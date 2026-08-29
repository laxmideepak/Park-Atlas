import Image from "next/image";
import { ContourField } from "./ContourField";
import type { ParkImage } from "@/lib/nps";
import { LiveBanner } from "./LiveBanner";
import type { LiveContext } from "@/lib/live-context";

/**
 * §6.3 park-page hero. Name overlaps the image's bottom edge onto the
 * following bone chapter — the page's visual signature. Mono strip sits in
 * its own reserved row so nothing is absolute-positioned over text (fixes
 * the old critter/scrim collision bug).
 */
export function ParkHero({
  images,
  name,
  state,
  accent,
  acreageLabel,
  officialRankLabel,
  liveContext,
  parkCode,
}: {
  images: ParkImage[];
  name: string;
  state: string;
  accent: string;
  acreageLabel?: string;
  officialRankLabel?: string;
  liveContext: LiveContext | null;
  parkCode: string;
}) {
  const hero = images[0];

  return (
    <section className="relative bg-ink">
      <div className="relative h-[78vh] min-h-[420px] w-full overflow-hidden">
        {hero ? (
          <>
            <Image
              src={hero.url}
              alt={hero.altText || name}
              fill
              priority
              sizes="100vw"
              className="object-cover img-grade"
              style={{ viewTransitionName: `park-hero-${parkCode}` }}
            />
            <div className="absolute inset-0 bg-ink/20" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink to-transparent" />
            <p className="absolute bottom-3 right-4 font-mono text-mono-sm text-bone/70">{hero.credit}</p>
          </>
        ) : (
          <ContourField name={name} accent={accent} />
        )}
        <div className="grain-overlay" />
      </div>

      {/* title overlaps the image's bottom edge onto the next (bone) chapter */}
      <div className="relative max-w-[1360px] mx-auto px-6 md:px-10 -mt-[0.4em]">
        <p className="font-mono text-mono-sm uppercase tracking-wide text-bone/70 mb-1">{state}</p>
        <h1 className="font-display italic text-display-xl leading-[0.95] text-bone">{name}</h1>
      </div>

      {/* mono strip — its own reserved row, never overlapping text */}
      <div className="relative max-w-[1360px] mx-auto px-6 md:px-10 py-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-mono-sm text-bone/70 border-t border-bone/10 mt-6">
        <span>{state}</span>
        {acreageLabel && <span>{acreageLabel}</span>}
        {officialRankLabel && <span>{officialRankLabel}</span>}
        <LiveBanner context={liveContext} state={state} />
      </div>
    </section>
  );
}
