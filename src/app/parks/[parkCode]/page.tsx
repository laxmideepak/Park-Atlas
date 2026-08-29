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
import { Reveal, RevealGroup } from "@/components/Reveal";
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
        acreageLabel={cohortPark ? `${cohortPark.acreage.toLocaleString()} ac` : undefined}
        officialRankLabel={cohortPark?.officialVisitRank2025 ? `#${cohortPark.officialVisitRank2025} most visited (official)` : undefined}
        liveContext={liveContext}
        parkCode={parkCode}
      />

      <div className="bg-bone text-ink">
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 py-10 flex flex-col lg:flex-row gap-12">
          <ChapterRail chapters={chapters} />

          <div className="flex-1 min-w-0 flex flex-col gap-20">
            <section id="overview" className="scroll-mt-24 flex flex-col gap-6">
              <RevealGroup as="div" className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm" itemClassName="h-full">
                {cohortPark
                  ? [
                      <Stat key="acreage" label="Acreage" value={<CountUp value={cohortPark.acreage} suffix=" ac" />} />,
                      <Stat
                        key="fee"
                        label="Entry fee"
                        value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : cohortPark.entryFee}
                      />,
                      <Stat
                        key="visits"
                        label={`Visits (${cohortPark.visitsWindow})`}
                        value={`${cohortPark.medianAnnualVisits.toLocaleString()}${cohortPark.officialVisitRank2025 ? ` · #${cohortPark.officialVisitRank2025} official 2025` : " · outside 2025 top 10"}`}
                      />,
                      <Stat key="trip" label="Typical trip" value={cohortPark.quickStats.tripLength} />,
                    ]
                  : [
                      <Stat
                        key="fee"
                        label="Entry fee"
                        value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : "See nps.gov"}
                      />,
                      <Stat key="location" label="Location" value={state} />,
                      <Stat key="best-month" label="Best overall month" value={labels.bestOverall.name} />,
                      <Stat key="acreage" label="Acreage / visitation" value="Not yet live" />,
                    ]}
              </RevealGroup>

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

            <section id="when-to-go" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-1">When to go</Reveal>
              <Reveal as="p" delay={0.06} className="text-sm text-ink-soft mb-8">Weighed on climate and access, never on crowds.</Reveal>

              <RevealGroup as="div" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10" itemClassName="h-full">
                <FigureLabel label="Best overall" month={labels.bestOverall.name} />
                <FigureLabel label="Best weather" month={labels.bestWeather.name} />
                <FigureLabel label="Fewest crowds" month={labels.fewestCrowds.name} />
                <FigureLabel label="Best balance" month={labels.bestBalance.name} />
              </RevealGroup>

              <div className="flex items-end gap-2 h-32 mb-2">
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
              <div className="flex gap-2 mb-8">
                {months.map((m) => (
                  <span key={m.month} className="flex-1 text-center font-mono text-mono-sm uppercase text-ink-soft">{m.month}</span>
                ))}
              </div>
              <p className="text-mono-sm font-mono text-ink-soft">Tap any month for its full Why-panel — factor weights, sources, confidence.</p>
            </section>

            {detail && <EditorialSections detail={detail} />}
            {!detail && <NonCohortSections name={name} liveThings={liveThings} npsUrl={liveProfile?.sourceUrl} />}

            <section id="crowds" className="scroll-mt-24">
              <Reveal as="h2" className="font-display text-display-md mb-6">Crowd calendar</Reveal>
              <CrowdCalendar rows={months} estimated={!cohortPark} bestBalanceMonth={labels.bestBalance.month} />
            </section>
          </div>
        </div>
      </div>

      {/* Current Conditions — ink chapter */}
      <section className="bg-ink text-bone py-16" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
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
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastIndexedDate).toLocaleDateString()}</span>
                </Fragment>
              ))}
            </RevealGroup>
          ) : !cohortPark ? (
            <p className="text-sm text-bone/70">No active NPS alerts for {name} right now.</p>
          ) : (
            <RevealGroup as="div" className="flex flex-col gap-3" itemClassName="rounded-sm border border-bone/15 p-4 flex justify-between gap-4 flex-wrap">
              {detail!.alerts.map((a, i) => (
                <Fragment key={i}>
                  <div>
                    <span className="text-mono-sm font-mono uppercase tracking-wide text-brass">{a.type}</span>
                    <p className="text-sm mt-1">{a.description}</p>
                  </div>
                  <span className="text-mono-sm font-mono text-bone/60 whitespace-nowrap">{new Date(a.lastUpdated).toLocaleString()}</span>
                </Fragment>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>
    </div>
  );
}

function EditorialSections({ detail }: { detail: ParkDetail }) {
  return (
    <>
      <section id="hiking" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-1">Hiking & trekking</h2>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">Officially listed hikes (NPS) &mdash; computed GIS trail totals land in Phase 2</p>
        <div className="flex flex-col divide-y divide-ink/10 border-t border-b border-ink/10">
          {detail.hikes.map((h) => (
            <div key={h.name} className="py-4 flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-6">
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
            </div>
          ))}
        </div>
      </section>

      <section id="must-see" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-6">Must-see spots</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {detail.spots.map((s) => (
            <div key={s.name} className="flex-none w-56 snap-start rounded-sm border border-ink/12 bg-bone-deep p-4">
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{s.category}</span>
              <div className="font-display text-display-md leading-tight mt-1">{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="water" className="scroll-mt-24">
        <h2 className="font-display text-display-md mb-1">Lakes & water</h2>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">USGS GNIS naming + hydrography intersected with NPS boundary</p>
        <div className="grid md:grid-cols-3 gap-4">
          {detail.water.map((w) => (
            <div key={w.name} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
              <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{w.type}</span>
              <div className="font-display text-display-md leading-tight mt-1 mb-1">{w.name}</div>
              <p className="text-sm text-ink-soft">{w.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dining" className="scroll-mt-24">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="font-display text-display-md">Dining availability</h2>
          <span className="font-mono text-sm font-semibold uppercase tracking-wide">{detail.dining.label}</span>
        </div>
        <p className="text-mono-sm font-mono text-ink-soft mb-6">Categorical label &mdash; never a taste score. NPS authorized-concessioner records.</p>
        <div className="flex flex-wrap gap-6 text-sm mb-5 font-mono">
          <span>{detail.dining.restaurants} restaurants</span>
          <span>{detail.dining.quickService} quick service</span>
          <span>{detail.dining.generalStores} general stores</span>
          {detail.dining.bringFood && <span className="text-ink font-semibold">Recommend bringing food</span>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {detail.dining.operations.map((op) => (
            <div key={op.name} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
              <div className="font-display text-display-md leading-tight">{op.name}</div>
              <p className="text-sm text-ink-soft mt-1">{op.type} &middot; {op.location} &middot; {op.seasonal ? "Seasonal" : "Year-round"} &middot; Authorized NPS concessioner</p>
            </div>
          ))}
          {detail.dining.operations.length === 0 && (
            <p className="text-sm text-ink-soft">No concessioner dining inside the park &mdash; bring your own food.</p>
          )}
        </div>
      </section>
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
        <section id="must-see" className="scroll-mt-24">
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="font-display text-display-md">Must-see spots</h2>
            <span className="text-mono-sm font-mono text-ink-soft">Live &middot; NPS Data API</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {liveThings.map((t) => (
              <div key={t.title} className="rounded-sm border border-ink/12 bg-bone-deep p-4">
                {t.activity && <span className="font-mono text-mono-sm uppercase tracking-wide text-ink-soft">{t.activity}</span>}
                <div className="font-display text-display-md leading-tight mt-1 mb-1">{t.title}</div>
                <p className="text-sm text-ink-soft line-clamp-3">{t.shortDescription}</p>
              </div>
            ))}
          </div>
        </section>
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

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-sm border border-ink/12 px-4 py-3">
      <div className="text-mono-sm font-mono uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function FigureLabel({ label, month }: { label: string; month: string }) {
  return (
    <div className="rounded-sm bg-bone-deep px-4 py-3">
      <div className="text-mono-sm font-mono uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="font-display text-display-md leading-none mt-1">{month}</div>
    </div>
  );
}
