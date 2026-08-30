import Image from "next/image";
import { ContourField } from "./ContourField";
import { LivingHero } from "./LivingHero";
import type { ParkImage } from "@/lib/nps";
import type { VideoManifestEntry } from "@/lib/data/video-manifest";
import { pickHero } from "@/lib/image-select";
import { LiveBanner } from "./LiveBanner";
import type { LiveContext } from "@/lib/live-context";

/**
 * §6.3 park-page hero. Name overlaps the image's bottom edge onto the
 * following bone chapter — the page's visual signature. Mono strip sits in
 * its own reserved row so nothing is absolute-positioned over text (fixes
 * the old critter/scrim collision bug). Grain stays off the photo (grain
 * over a photo reads as sensor noise) — it only lives on ContourField.
 */
export function ParkHero({
  images,
  name,
  state,
  accent,
  description,
  acreageLabel,
  officialRankLabel,
  liveContext,
  parkCode,
  video = null,
}: {
  images: ParkImage[];
  name: string;
  state: string;
  accent: string;
  description?: string;
  acreageLabel?: string;
  officialRankLabel?: string;
  liveContext: LiveContext | null;
  parkCode: string;
  /** Living Hero clip (spec §1.4) — top-10 parks only; photo fallback when null. */
  video?: VideoManifestEntry | null;
}) {
  const hero = pickHero(images, parkCode);

  return (
    <section className="relative bg-ink">
      <div className="relative h-[78svh] min-h-[420px] w-full overflow-hidden">
        {video ? (
          <>
            <LivingHero entry={video} alt={hero?.altText || name} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
          </>
        ) : hero ? (
          <>
            <Image
              src={hero.url}
              alt={hero.altText || name}
              fill
              priority
              sizes="100vw"
              quality={75}
              {...(hero.blurDataURL ? { placeholder: "blur" as const, blurDataURL: hero.blurDataURL } : {})}
              className="object-cover"
              style={{ viewTransitionName: `park-hero-${parkCode}` }}
            />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
            {hero.creditUrl ? (
              <a href={hero.creditUrl} className="tap-44 absolute bottom-3 right-4 glass-dark rounded-sm px-2.5 py-1 font-mono text-mono-sm text-bone/70 hover:text-bone underline-offset-2 hover:underline">{hero.credit}</a>
            ) : (
              <p className="absolute bottom-3 right-4 glass-dark rounded-sm px-2.5 py-1 font-mono text-mono-sm text-bone/70">{hero.credit}</p>
            )}
          </>
        ) : (
          <ContourField name={name} accent={accent} />
        )}
      </div>

      {/* title overlaps the image's bottom edge onto the next (bone) chapter */}
      <div className="relative max-w-[1360px] mx-auto px-6 md:px-10 -mt-[0.4em]">
        <p className="font-mono text-mono-sm uppercase tracking-wide text-bone/70 mb-1">{state}</p>
        <h1 className="font-display italic text-display-xl leading-[0.95] text-bone mb-3">{name}</h1>
        {description && <p className="max-w-[62ch] text-bone/80 line-clamp-2">{description}</p>}
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
