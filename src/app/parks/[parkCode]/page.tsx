import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { PARK_DETAIL, type ParkDetail } from "@/lib/data/park-detail";
import { parkByCode, scoresForPark, parkHeaderLabels } from "@/lib/repo";
import { TIER_COLOR } from "@/lib/scoring";
import { TierBadge } from "@/components/TierBadge";
import { WhyPanel } from "@/components/WhyPanel";
import { CrowdCalendar } from "@/components/CrowdCalendar";
import { ParkScape } from "@/components/ParkScape";
import { LiveBanner } from "@/components/LiveBanner";
import { getParkAccent } from "@/lib/park-theme";
import { fetchParkProfile, fetchParkAlerts, fetchThingsToDo } from "@/lib/nps";
import { getLiveContext } from "@/lib/live-context";
import { getWildlife } from "@/lib/data/park-wildlife";
import { WildlifeCritter } from "@/components/WildlifeCritter";

export function generateStaticParams() {
  return ALL_PARKS_MINI.map((p) => ({ parkCode: p.code }));
}

export default async function ParkPage(props: PageProps<"/parks/[parkCode]">) {
  const { parkCode } = await props.params;
  const mini = ALL_PARKS_MINI.find((p) => p.code === parkCode);
  if (!mini) notFound();

  const cohortPark = parkByCode(parkCode);
  const accent = getParkAccent(parkCode);
  const name = cohortPark?.name ?? mini.name;
  const state = cohortPark?.state ?? mini.state;

  const [liveProfile, liveAlerts, liveContext, liveThings] = await Promise.all([
    fetchParkProfile(parkCode),
    fetchParkAlerts(parkCode),
    getLiveContext(mini.lat, mini.lng),
    cohortPark ? Promise.resolve<Awaited<ReturnType<typeof fetchThingsToDo>>>([]) : fetchThingsToDo(parkCode),
  ]);

  const detail = cohortPark ? PARK_DETAIL[cohortPark.code] : null;
  const alerts = liveAlerts.length > 0 ? liveAlerts : null;
  const fieldNote = cohortPark?.fieldNote ?? liveProfile?.description ?? `${name} is one of the 63 U.S. National Parks.`;
  const wildlife = getWildlife(parkCode);
  const months = scoresForPark(parkCode);
  const labels = parkHeaderLabels(parkCode);

  return (
    <div className="flex flex-col gap-16 pb-10">
      {/* Overview — hero */}
      <section className="relative">
        <ParkScape park={parkCode} state={state} accent={accent} fill />
        {wildlife && <WildlifeCritter wildlife={wildlife} accent={accent} />}
        <div className="relative pt-20 px-6 md:px-10 pb-8 max-w-[1400px] mx-auto flex flex-col gap-4">
          <p className="text-xs uppercase tracking-wide" style={{ color: accent }}>{state}</p>
          <h1 className="font-display uppercase text-4xl md:text-6xl max-w-[16ch]">{name}</h1>
          <p className="max-w-[62ch] text-paper/90 line-clamp-3">{fieldNote}</p>
          <LiveBanner context={liveContext} state={state} />
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col gap-16 w-full">
        <section className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {cohortPark ? (
              <>
                <Stat label="Acreage" value={`${cohortPark.acreage.toLocaleString()} ac`} />
                <Stat label="Entry fee" value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : cohortPark.entryFee} />
                <Stat
                  label={`Visits (${cohortPark.visitsWindow})`}
                  value={`${cohortPark.medianAnnualVisits.toLocaleString()}${cohortPark.officialVisitRank2025 ? ` · #${cohortPark.officialVisitRank2025} official 2025` : " · outside 2025 top 10"}`}
                />
                <Stat label="Typical trip" value={cohortPark.quickStats.tripLength} />
              </>
            ) : (
              <>
                <Stat label="Entry fee" value={liveProfile?.entranceFeeCost ? `${liveProfile.entranceFeeCost} ${liveProfile.entranceFeeDescription ?? ""}`.trim() : "See nps.gov"} />
                <Stat label="Location" value={state} />
                <Stat label="Best overall month" value={labels.bestOverall.name} />
                <Stat label="Acreage / visitation" value="Not yet live" />
              </>
            )}
          </div>

          {liveProfile && (
            <details className="group rounded-sm border border-white/15 bg-basalt-deep/60 open:bg-basalt-deep">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                <span>Official NPS description</span>
                <span className="font-mono text-xs text-paper-dim group-open:rotate-180 transition-transform">&#9660;</span>
              </summary>
              <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                <p className="text-sm text-paper-dim">{liveProfile.description}</p>
                <p className="text-xs font-mono text-paper-dim">
                  Live &middot; NPS Data API &middot; <a href={liveProfile.sourceUrl} className="underline underline-offset-2">{liveProfile.sourceUrl}</a> &middot; fetched {new Date(liveProfile.retrievedAt).toLocaleDateString()}
                </p>
              </div>
            </details>
          )}
        </section>

        {/* When to Go — every park now has Month Fit scoring (hand-authored for the
            4-park cohort, estimated-by-park-type for the rest; see Why-panel/footer) */}
        <section>
          <h2 className="font-display uppercase text-3xl mb-1">When to Go ⭐</h2>
          <p className="text-sm text-paper-dim mb-8">Weighed on climate and access, never on crowds — see below for how each month scores and why.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <Label label="Best overall" month={labels.bestOverall.name} accent={accent} />
            <Label label="Best weather" month={labels.bestWeather.name} accent={accent} />
            <Label label="Fewest crowds" month={labels.fewestCrowds.name} accent={accent} />
            <Label label="Best balance" month={labels.bestBalance.name} accent={accent} />
          </div>

          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mb-6">
            {months.map((m) => (
              <a key={m.month} href={`#why-${m.month}`} className="flex flex-col items-center gap-1 rounded-sm py-3 text-center" style={{ background: TIER_COLOR[m.tier] }}>
                <span className="text-[0.65rem] uppercase">{m.month}</span>
                <span className="text-sm font-semibold">{m.overallMonthFit}</span>
              </a>
            ))}
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm text-paper-dim underline underline-offset-2 mb-3 list-none">
              See the full 12-month Month Fit breakdown &amp; Why panels &darr;
            </summary>
            <div className="flex flex-col gap-2 mt-3">
              {months.map((m) => (
                <div key={m.month} id={`why-${m.month}`} className="scroll-mt-24">
                  <WhyPanel row={m} parkName={name} />
                </div>
              ))}
            </div>
          </details>
        </section>

        {cohortPark && detail ? (
          <EditorialSections detail={detail} />
        ) : (
          <NonCohortSections name={name} liveThings={liveThings} npsUrl={liveProfile?.sourceUrl} />
        )}

        {/* Crowd Calendar */}
        <section>
          <h2 className="font-display uppercase text-3xl mb-6">Crowd Calendar ⭐</h2>
          <CrowdCalendar rows={months} estimated={!cohortPark} />
        </section>

        {/* Current Conditions */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-display uppercase text-3xl">Current Conditions</h2>
            <span className="text-xs font-mono text-paper-dim">{alerts ? "Live · NPS Alerts API" : "No alerts reported"}</span>
          </div>
          <div className="flex flex-col gap-3">
            {alerts ? (
              alerts.map((a, i) => (
                <div key={i} className="rounded-sm border border-white/15 p-4 flex justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wide text-accent">{a.category}</span>
                    <p className="text-sm mt-1 font-medium">{a.title}</p>
                    <p className="text-sm text-paper-dim mt-0.5">{a.description}</p>
                  </div>
                  <span className="text-xs text-paper-dim font-mono whitespace-nowrap">{new Date(a.lastIndexedDate).toLocaleDateString()}</span>
                </div>
              ))
            ) : !cohortPark ? (
              <p className="text-sm text-paper-dim">No active NPS alerts for {name} right now.</p>
            ) : (
              detail!.alerts.map((a, i) => (
                <div key={i} className="rounded-sm border border-white/15 p-4 flex justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wide text-accent">{a.type}</span>
                    <p className="text-sm mt-1">{a.description}</p>
                  </div>
                  <span className="text-xs text-paper-dim font-mono whitespace-nowrap">{new Date(a.lastUpdated).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function EditorialSections({ detail }: { detail: ParkDetail }) {
  return (
    <>
      {/* Hiking & Trekking */}
      <section>
        <h2 className="font-display uppercase text-3xl mb-1">Hiking & Trekking</h2>
        <p className="text-xs text-paper-dim font-mono mb-6">Officially listed hikes (NPS) &mdash; computed GIS trail totals land in Phase 2</p>
        <div className="grid md:grid-cols-3 gap-4">
          {detail.hikes.map((h) => (
            <div key={h.name} className="rounded-sm border border-white/15 p-4 flex flex-col gap-1.5">
              <div className="font-bold">{h.name}</div>
              <p className="text-sm text-paper-dim">{h.distanceMi} mi &middot; {h.difficulty} &middot; {h.durationHr} hr</p>
              <p className="text-xs text-paper-dim">Best: {h.bestMonths}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {h.npsRecommended && <Tag>NPS-recommended</Tag>}
                {h.waterFeature && <Tag>Water feature</Tag>}
                {h.reservation && <Tag>Reservation required</Tag>}
                <Tag>{h.officiallyListed ? "Officially listed" : "Computed"}</Tag>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Must-See Spots */}
      <section>
        <h2 className="font-display uppercase text-3xl mb-6">Must-See Spots</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {detail.spots.map((s) => (
            <div key={s.name} className="rounded-sm border border-white/15 p-4">
              <span className="text-[0.65rem] uppercase tracking-wide text-accent">{s.category}</span>
              <div className="font-bold mt-1">{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Lakes & Water */}
      <section>
        <h2 className="font-display uppercase text-3xl mb-1">Lakes & Water</h2>
        <p className="text-xs text-paper-dim font-mono mb-6">USGS GNIS naming + hydrography intersected with NPS boundary</p>
        <div className="grid md:grid-cols-3 gap-4">
          {detail.water.map((w) => (
            <div key={w.name} className="rounded-sm border border-white/15 p-4">
              <span className="text-[0.65rem] uppercase tracking-wide text-accent">{w.type}</span>
              <div className="font-bold mt-1 mb-1">{w.name}</div>
              <p className="text-sm text-paper-dim">{w.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dining Availability */}
      <section>
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="font-display uppercase text-3xl">Dining Availability</h2>
          <TierBadge tier={detail.dining.label === "Excellent" || detail.dining.label === "Good" ? "Excellent" : "Specialized"} />
          <span className="font-semibold">{detail.dining.label}</span>
        </div>
        <p className="text-xs text-paper-dim font-mono mb-6">Categorical label &mdash; never a taste score. NPS authorized-concessioner records.</p>
        <div className="flex flex-wrap gap-6 text-sm mb-5">
          <span>{detail.dining.restaurants} restaurants</span>
          <span>{detail.dining.quickService} quick service</span>
          <span>{detail.dining.generalStores} general stores</span>
          {detail.dining.bringFood && <span className="text-accent">Recommend bringing food</span>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {detail.dining.operations.map((op) => (
            <div key={op.name} className="rounded-sm border border-white/15 p-4">
              <div className="font-bold">{op.name}</div>
              <p className="text-sm text-paper-dim">{op.type} &middot; {op.location} &middot; {op.seasonal ? "Seasonal" : "Year-round"} &middot; Authorized NPS concessioner</p>
            </div>
          ))}
          {detail.dining.operations.length === 0 && (
            <p className="text-sm text-paper-dim">No concessioner dining inside the park &mdash; bring your own food.</p>
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
        <section>
          <div className="flex items-baseline gap-3 mb-1">
            <h2 className="font-display uppercase text-3xl">Must-See Spots</h2>
            <span className="text-xs font-mono text-paper-dim">Live &middot; NPS Data API</span>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {liveThings.map((t) => (
              <div key={t.title} className="rounded-sm border border-white/15 p-4">
                {t.activity && <span className="text-[0.65rem] uppercase tracking-wide text-accent">{t.activity}</span>}
                <div className="font-bold mt-1 mb-1">{t.title}</div>
                <p className="text-sm text-paper-dim line-clamp-3">{t.shortDescription}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {npsUrl && (
        <section>
          <div className="rounded-sm border border-white/15 p-5 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-paper-dim">Hiking, dining, and lodging details for {name} aren&rsquo;t in ParkAtlas yet.</p>
            <Link href={npsUrl} className="text-sm underline underline-offset-2 whitespace-nowrap">
              See the official NPS page &rarr;
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/15 px-4 py-3">
      <div className="text-[0.65rem] uppercase tracking-wide text-paper-dim font-mono">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Label({ label, month, accent }: { label: string; month: string; accent: string }) {
  return (
    <div className="rounded-sm bg-paper text-basalt-deep px-4 py-3 border-l-4" style={{ borderColor: accent }}>
      <div className="text-[0.65rem] uppercase tracking-wide opacity-60">{label}</div>
      <div className="font-bold">{month}</div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="text-[0.65rem] px-2 py-0.5 rounded-full border border-white/20 text-paper-dim">{children}</span>;
}
