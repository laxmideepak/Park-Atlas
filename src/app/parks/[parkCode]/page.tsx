import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { PARK_DETAIL, type ParkDetail } from "@/lib/data/park-detail";
import { parkByCode, scoresForPark, parkHeaderLabels, getParkSummary } from "@/lib/repo";
import { WhyDrawer } from "@/components/WhyDrawer";
import { CrowdCalendar } from "@/components/CrowdCalendar";
import { ParkHero } from "@/components/ParkHero";
import { ChapterRail, type Chapter } from "@/components/ChapterRail";
import { getParkAccent } from "@/lib/park-theme";
import { fetchParkProfile, fetchParkAlerts, fetchThingsToDo, fetchParkImages } from "@/lib/nps";
import { getLiveContext } from "@/lib/live-context";
import { SITE_URL } from "@/lib/site";
import { VIDEO_MANIFEST } from "@/lib/data/video-manifest";
import { parkAcreage, parkVisitation, VISITATION_SOURCE_LABEL, ACREAGE_SOURCE_LABEL } from "@/lib/provenance";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { ThemedSection } from "@/components/ThemedSection";
import { CountUp } from "@/components/CountUp";

export function generateStaticParams() {
  return ALL_PARKS_MINI.map((p) => ({ parkCode: p.code }));
}

export async function generateMetadata(props: PageProps<"/parks/[parkCode]">): Promise<Metadata> {
  const { parkCode } = await props.params;
  const mini = ALL_PARKS_MINI.find((p) => p.code === parkCode);
  if (!mini) return {};
  const summary = getParkSummary(parkCode);
  const title = `${summary.name}, ${summary.state} — Best time to visit | ParkAtlas`;
  const description = `${summary.tagline} Month-by-month climate and crowd scoring for ${summary.name} National Park.`;
  return {
    title,
    description,
    alternates: { canonical: `/parks/${parkCode}` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const CHAPTERS: Chapter[] = [
  { id: "overview", label: "Overview" },
  { id: "when-to-go", label: "When to Go" },
  { id: "hiking", label: "Hiking" },
  { id: "must-see", label: "Must-See" },
  { id: "water", label: "Water" },
  { id: "dining", label: "Dining" },
  { id: "crowds", label: "Crowds" },
];

export default async function ParkPage(props: PageProps<"/parks/[parkCode]">) {
  const { parkCode } = await props.params;
  const mini = ALL_PARKS_MINI.find((p) => p.code === parkCode);
  if (!mini) notFound();

  const cohortPark = parkByCode(parkCode);
  const accent = getParkAccent(parkCode);
  const name = cohortPark?.name ?? mini.name;
  const state = cohortPark?.state ?? mini.state;

  const [liveProfile, liveAlerts, liveContext, liveThings, liveImages] = await Promise.all([
    fetchParkProfile(parkCode),
    fetchParkAlerts(parkCode),
    getLiveContext(mini.lat, mini.lng),
    cohortPark ? Promise.resolve<Awaited<ReturnType<typeof fetchThingsToDo>>>([]) : fetchThingsToDo(parkCode),
    fetchParkImages(parkCode),
  ]);

  const acreage = parkAcreage(parkCode);
  const visitation = parkVisitation(parkCode);
  const detail = cohortPark ? PARK_DETAIL[cohortPark.code] : null;
  const alerts = liveAlerts.length > 0 ? liveAlerts : null;
  const months = scoresForPark(parkCode);
  const labels = parkHeaderLabels(parkCode);
  const fieldNote = cohortPark?.fieldNote ?? liveProfile?.description;
  const hasMustSee = Boolean(detail) || liveThings.length > 0;
  const chapters = (detail ? CHAPTERS : CHAPTERS.filter((c) => ["overview", "when-to-go", "must-see", "crowds"].includes(c.id))).filter(
    (c) => c.id !== "must-see" || hasMustSee
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
    description: fieldNote,
    address: { "@type": "PostalAddress", addressRegion: state, addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: mini.lat, longitude: mini.lng },
    url: `${SITE_URL}/parks/${parkCode}`,
  };

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ParkHero
        images={liveImages}
        name={name}
        state={state}
        accent={accent}
        description={fieldNote}
        acreageLabel={acreage ? `${Math.round(acreage.grossAcres).toLocaleString()} ac` : undefined}
        officialRankLabel={cohortPark?.officialVisitRank2025 ? `#${cohortPark.officialVisitRank2025} most visited (official)` : undefined}
        liveContext={liveContext}
        parkCode={parkCode}
        video={VIDEO_MANIFEST[parkCode] ?? null}
      />

      <div className="bg-bone text-ink">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-10 flex flex-col lg:flex-row gap-12">
          <ChapterRail chapters={chapters} />

          <div className="flex-1 min-w-0 flex flex-col gap-20">
            <section id="overview" className="scroll-mt-24 flex flex-col gap-6">
              {/* Restoration C6: acreage + visitation are real for ALL 63
                  (LWCF quarterly report + IRMA Stats 5-yr medians) — the old
                  cohort-only figures and the "Not yet live" placeholder are
                  both retired. */}
              {/* Editorial standfirst — the full field note (curated cohort
                  prose, or the NPS live description fallback) opens the
                  overview in Instrument Serif roman; the hero keeps its
                  clamped italic line as the cover tease. */}
              {fieldNote && (
                <Reveal as="p" className="font-display text-standfirst leading-snug max-w-[58ch] text-ink">
                  {fieldNote}
                </Reveal>
              )}
              <RevealGroup as="div" className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm" itemClassName="h-full">
                {[
                  <Stat key="acreage" label="Acreage (official)" value={<CountUp value={Math.round(acreage?.grossAcres ?? 0)} suffix=" ac" />} />,
                  <Stat
                    key="fee"
                    label="Entry fee"
                    value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : cohortPark?.entryFee ?? "See nps.gov"}
                  />,
                  <Stat
                    key="visits"
                    label="Visits (5-yr median)"
                    value={`${(visitation?.medianAnnualVisits ?? 0).toLocaleString()}${cohortPark?.officialVisitRank2025 ? ` · #${cohortPark.officialVisitRank2025} official 2025` : ""}`}
                  />,
                  cohortPark ? (
                    <Stat key="trip" label="Typical trip" value={cohortPark.quickStats.tripLength} />
                  ) : (
                    <Stat key="best-month" label="Best overall month" value={labels.bestOverall.name} />
                  ),
                ]}
              </RevealGroup>
              <p className="font-mono text-mono-sm text-ink-soft -mt-2">
                {ACREAGE_SOURCE_LABEL} &middot; {VISITATION_SOURCE_LABEL}
              </p>

              {liveProfile && (
                <details className="group rounded-sm border border-ink/12 bg-bone-deep open:bg-bone-deep">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                    <span>Official NPS description</span>
                    <span className="font-mono text-mono-sm text-ink-soft group-open:rotate-180 transition-transform">&#9660;</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                    <p className="text-sm text-ink-soft">{liveProfile.description}</p>
                    <p className="text-mono-sm font-mono text-ink-soft">
                      Live &middot; NPS Data API &middot; <a href={liveProfile.sourceUrl} className="underline underline-offset-2">{liveProfile.sourceUrl}</a> &middot; fetched {new Date(liveProfile.retrievedAt).toLocaleDateString()}
                    </p>
                  </div>
                </details>
              )}
            </section>

            <ThemedSection id="when-to-go" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-1">When to go</Reveal>
              <Reveal as="p" delay={0.06} className="text-sm text-ink-soft mb-8">Weighed on climate and access, never on crowds.</Reveal>

              <RevealGroup as="div" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" itemClassName="h-full">
                <FigureLabel label="Best overall" month={labels.bestOverall.name} />
                <FigureLabel label="Best weather" month={labels.bestWeather.name} />
                <FigureLabel label="Fewest crowds" month={labels.fewestCrowds.name} />
                <FigureLabel label="Best balance" month={labels.bestBalance.name} />
              </RevealGroup>

              {/* Mobile pass: gap-1 under md widens each of the 12 tappable
                  bar columns (~21px → ~25px at 390px) — the drawer trigger is
                  the full column, so every extra pixel is hit area. */}
              <div className="flex items-end gap-1 md:gap-2 h-32 mb-2">
                {months.map((m) => (
                  <WhyDrawer
                    key={m.month}
                    row={m}
                    parkName={name}
                    triggerClassName="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group"
                    trigger={
                      <>
                        <span className="font-mono text-mono-sm text-ink-soft group-hover:text-brass transition-colors">{m.overallMonthFit}</span>
                        <span
                          className="w-full rounded-t-sm transition-opacity group-hover:opacity-80"
                          style={{
                            height: `${Math.max(m.overallMonthFit, 6)}%`,
                            background: m.month === labels.bestOverall.month ? "var(--brass)" : "var(--ink)",
                          }}
                        />
                      </>
                    }
                  />
                ))}
              </div>
              <div className="flex gap-1 md:gap-2 mb-8">
                {months.map((m) => (
                  <span key={m.month} className="flex-1 text-center font-mono text-mono-sm uppercase text-ink-soft">{m.month}</span>
                ))}
              </div>
              {/* Numbered-figure caption — uppercase via class, never hand-typed caps */}
              <p className="text-mono-sm font-mono uppercase text-ink-soft">
                Fig. 1 &mdash; Month fit, twelve bars. Climate 60 &middot; Access 40. Tap any month for its Why-panel.
              </p>
            </ThemedSection>

            {detail && <EditorialSections detail={detail} />}
            {!detail && <NonCohortSections name={name} liveThings={liveThings} npsUrl={liveProfile?.sourceUrl} />}

            <ThemedSection id="crowds" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-6">Crowd calendar</Reveal>
              <CrowdCalendar rows={months} sourceLabel={VISITATION_SOURCE_LABEL} bestBalanceMonth={labels.bestBalance.month} figNumber={2} />
            </ThemedSection>
          </div>
        </div>
      </div>

      {/* Current Conditions — ink chapter */}
      <section className="bg-ink text-bone py-16">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10">
          <div className="flex items-baseline gap-3 mb-6">
            <Reveal as="h2" className="font-display text-display-md">Current conditions</Reveal>
            <span className="text-mono-sm font-mono text-bone/60">{alerts ? "Live · NPS Alerts API" : "No alerts reported"}</span>
          </div>
          {alerts ? (
            <RevealGroup as="div" className="flex flex-col gap-3" itemClassName="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
              {alerts.map((a, i) => (
                <Fragment key={i}>
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.category}</span>
                    <p className="text-sm mt-1 font-medium">{a.title}</p>
                    <p className="text-sm text-bone/70 mt-0.5">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{formatAlertDate(a.lastIndexedDate)}</span>
                </Fragment>
              ))}
            </RevealGroup>
          ) : (
            <p className="text-sm text-bone/70">No active NPS alerts for {name} right now.</p>
          )}
          {/* Editorial seasonal notes are NOT live alerts — audit #7: they used
              to render styled identically to NPS alerts, under a "No alerts
              reported" header, with hardcoded fixture timestamps. Now they're
              their own honestly-labeled block, timestamps dropped. */}
          {detail && detail.alerts.length > 0 && (
            <div className="mt-8">
              <p className="text-mono-sm font-mono uppercase tracking-wide text-bone/60 mb-3">
                Editorial seasonal notes — not live NPS alerts
              </p>
              <RevealGroup as="div" className="flex flex-col gap-3" itemClassName="rounded-sm border border-bone/10 bg-bone/[0.03] p-4">
                {detail.alerts.map((a, i) => (
                  <Fragment key={i}>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-bone/50">{a.type}</span>
                    <p className="text-sm mt-1 text-bone/80">{a.description}</p>
                  </Fragment>
                ))}
              </RevealGroup>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EditorialSections({ detail }: { detail: ParkDetail }) {
  return (
    <>
      <ThemedSection id="hiking" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-1">Hiking & trekking</Reveal>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">Officially listed hikes (NPS) &mdash; computed GIS trail totals land in Phase 2</Reveal>
        <RevealGroup
          as="div"
          variant="slide"
          className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10"
          itemClassName="py-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6"
        >
          {detail.hikes.map((h) => (
            <Fragment key={h.name}>
              <div className="font-display text-display-md sm:w-64 flex-none leading-none">{h.name}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-mono-sm text-ink-soft">
                <span>{h.distanceMi} mi</span>
                <span>{h.difficulty}</span>
                <span>{h.durationHr} hr</span>
                <span>Best: {h.bestMonths}</span>
                {h.npsRecommended && <span>NPS-recommended</span>}
                {h.waterFeature && <span>Water feature</span>}
                {h.reservation && <span>Reservation required</span>}
              </div>
            </Fragment>
          ))}
        </RevealGroup>
      </ThemedSection>

      <ThemedSection id="must-see" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-6">Must-see spots</Reveal>
        <RevealGroup
          as="div"
          variant="scale"
          className="flex gap-4 overflow-x-auto pb-2 snap-x"
          itemClassName="flex-none w-56 snap-start rounded-sm border border-ink/12 bg-bone-deep p-4 h-full"
        >
          {detail.spots.map((s) => (
            <Fragment key={s.name}>
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{s.category}</span>
              <div className="font-display text-display-md leading-tight mt-1">{s.name}</div>
            </Fragment>
          ))}
        </RevealGroup>
      </ThemedSection>

      <ThemedSection id="water" className="scroll-mt-24">
        <Reveal as="h2" className="font-display text-display-md mb-1">Lakes & water</Reveal>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">Hand-curated — USGS GNIS/NHD boundary intersection planned</Reveal>
        <RevealGroup
          as="div"
          variant="float"
          className="grid md:grid-cols-3 gap-4"
          itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full"
        >
          {detail.water.map((w) => (
            <Fragment key={w.name}>
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{w.type}</span>
              <div className="font-display text-display-md leading-tight mt-1 mb-1">{w.name}</div>
              <p className="text-sm text-ink-soft">{w.note}</p>
            </Fragment>
          ))}
        </RevealGroup>
      </ThemedSection>

      <ThemedSection id="dining" className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-1">
          <Reveal as="h2" className="font-display text-display-md">Dining availability</Reveal>
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">{detail.dining.label}</span>
        </div>
        <Reveal as="p" delay={0.06} className="text-mono-sm font-mono text-ink-soft mb-6">Categorical label &mdash; never a taste score. NPS authorized-concessioner records.</Reveal>
        <div className="flex flex-wrap gap-6 text-sm mb-5 font-mono">
          <span>{detail.dining.restaurants} restaurants</span>
          <span>{detail.dining.quickService} quick service</span>
          <span>{detail.dining.generalStores} general stores</span>
          {detail.dining.bringFood && <span className="text-ink font-semibold">Recommend bringing food</span>}
        </div>
        <RevealGroup as="div" className="grid md:grid-cols-2 gap-4" itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full">
          {detail.dining.operations.map((op) => (
            <Fragment key={op.name}>
              <div className="font-display text-display-md leading-tight">{op.name}</div>
              <p className="text-sm text-ink-soft mt-1">{op.type} &middot; {op.location} &middot; {op.seasonal ? "Seasonal" : "Year-round"} &middot; Authorized NPS concessioner</p>
            </Fragment>
          ))}
        </RevealGroup>
        {detail.dining.operations.length === 0 && (
          <p className="text-sm text-ink-soft">No concessioner dining inside the park &mdash; bring your own food.</p>
        )}
      </ThemedSection>
    </>
  );
}

function NonCohortSections({
  name,
  liveThings,
  npsUrl,
}: {
  name: string;
  liveThings: { title: string; shortDescription: string; activity: string | null }[];
  npsUrl?: string;
}) {
  return (
    <>
      {liveThings.length > 0 && (
        <ThemedSection id="must-see" className="scroll-mt-24">
          <div className="flex items-baseline gap-3 mb-1">
            <Reveal as="h2" className="font-display text-display-md">Must-see spots</Reveal>
            <span className="text-mono-sm font-mono text-ink-soft">Live &middot; NPS Data API</span>
          </div>
          <RevealGroup as="div" variant="scale" className="grid sm:grid-cols-2 md:grid-cols-3 gap-4" itemClassName="rounded-sm border border-ink/12 bg-bone-deep p-4 h-full">
            {liveThings.map((t) => (
              <Fragment key={t.title}>
                {t.activity && <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{t.activity}</span>}
                <div className="font-display text-display-md leading-tight mt-1 mb-1">{t.title}</div>
                <p className="text-sm text-ink-soft line-clamp-3">{t.shortDescription}</p>
              </Fragment>
            ))}
          </RevealGroup>
        </ThemedSection>
      )}

      {npsUrl && (
        <section>
          <div className="rounded-sm border border-ink/12 bg-bone-deep p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-ink-soft">Hiking, dining, and lodging details for {name} aren&rsquo;t in ParkAtlas yet.</p>
            <Link href={npsUrl} className="text-sm underline underline-offset-2 whitespace-nowrap">
              See the official NPS page &rarr;
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

/** NPS alert `lastIndexedDate` is non-ISO ("2025-01-27 12:37:06.0") — V8
 * happens to parse it today, but that's engine luck, not a contract
 * (audit #15). Parse defensively; hide the date rather than show
 * "Invalid Date". */
function formatAlertDate(raw: string): string {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="h-full rounded-sm border border-ink/12 px-4 py-3">
      <div className="text-mono-sm font-mono uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function FigureLabel({ label, month }: { label: string; month: string }) {
  return (
    <div className="h-full rounded-sm bg-bone-deep px-4 py-3">
      <div className="text-mono-sm font-mono uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="font-display text-display-md leading-none mt-1">{month}</div>
    </div>
  );
}
