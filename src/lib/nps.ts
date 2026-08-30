/**
 * Server-only NPS Data API client (P0-2: no browser-side calls, key stays
 * server-side, responses cached). `park` is the NPS 4-letter park code
 * directly (e.g. "acad", "zion") — used as-is, all 63.
 *
 * Rate-limit budget (data-audit spec §5): the 1,000 req/hr cap is real and
 * was exhausted twice in one day before this design. Parks and alerts are
 * now fetched in BULK — one comma-list request each for all 63 codes
 * (verified: `parkCode` accepts comma lists) — served per-park from the
 * shared cached response. Only /thingstodo stays per-park (59 non-cohort
 * pages). Build cost: ~61 calls with a cold cache, ~2 typical.
 */

import { ALL_PARKS_MINI } from "./data/all-parks-mini";

const NPS_BASE = "https://developer.nps.gov/api/v1";
const REVALIDATE_SECONDS = 60 * 60 * 24; // daily

// Sorted for a deterministic URL: Next's fetch cache dedupes by exact URL
// across build workers, so all 9 workers share one real request.
const ALL_CODES = ALL_PARKS_MINI.map((p) => p.code).sort().join(",");

interface RawImage {
  url: string;
  title: string;
  altText: string;
  caption: string;
  credit: string;
}

interface RawPark {
  parkCode: string;
  description: string;
  url: string;
  entranceFees?: { cost: string; description: string; title: string }[];
  operatingHours?: { name: string; description: string }[];
  images?: RawImage[];
}

interface RawParksResponse {
  data: RawPark[];
}

interface RawAlertsResponse {
  data: {
    parkCode: string;
    title: string;
    description: string;
    category: string;
    lastIndexedDate: string;
    url: string;
  }[];
}

async function npsFetch<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = process.env.NPS_API_KEY;
  if (!key) return null;
  const qs = new URLSearchParams(params).toString();
  const url = `${NPS_BASE}${path}?${qs}`;
  // The static build fires a couple hundred of these in one burst (63 park
  // pages x 3-4 endpoints, plus home/month/index pages). The NPS API
  // throttles bursts, and a silently-nulled response here means a park page
  // prerenders imageless until its next ISR pass — so failed calls retry
  // with backoff instead of giving up on the first 429.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "X-Api-Key": key },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining !== null && Number(remaining) <= 100 && Number(remaining) % 25 === 0) {
        console.warn(`[nps] quota low: ${remaining} requests remaining this hour`);
      }
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429 && res.status < 500) return null; // real error, don't hammer
    } catch {
      // network hiccup — fall through to retry
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) + Math.floor(Math.random() * 500)));
  }
  // Exhausted retries — almost always OVER_RATE_LIMIT. Silence here is how
  // builds used to bake missing images/fees into static pages with no
  // warning (audit #9): fail the BUILD loudly; at runtime (ISR revalidation)
  // degrade gracefully so a quota blip never crashes a live page.
  const message = `[nps] ${path}?${qs} failed after 3 attempts — likely OVER_RATE_LIMIT; static pages would bake in missing data`;
  if (process.env.NEXT_PHASE === "phase-production-build") throw new Error(message);
  console.error(message);
  return null;
}

export interface NpsParkProfile {
  description: string;
  entranceFeeCost: string | null;
  entranceFeeDescription: string | null;
  sourceUrl: string;
  retrievedAt: string;
}

/** ONE bulk /parks request for all 63 codes, shared by every profile and
 * image lookup on every page — the deterministic URL means Next's fetch
 * cache serves all build workers and all pages from a single real request.
 * (Previously: 2 requests per park x 63; audit #9/#12.) */
async function fetchAllParks(): Promise<Map<string, RawPark>> {
  const json = await npsFetch<RawParksResponse>("/parks", { parkCode: ALL_CODES, limit: "70" });
  return new Map((json?.data ?? []).map((p) => [p.parkCode.toLowerCase(), p]));
}

async function fetchParkRaw(park: string): Promise<RawPark | null> {
  return (await fetchAllParks()).get(park.toLowerCase()) ?? null;
}

/** The fees array has no guaranteed order — Acadia's [0] is the $6 Cadillac
 * Summit timed-entry reservation, not the $35 vehicle fee (live-verified in
 * the gov-data audit). Prefer the private-vehicle entrance fee, then the
 * cheapest "Entrance -" item, never blindly [0]. */
function pickEntranceFee(fees: { cost: string; description: string; title: string }[] | undefined) {
  if (!fees?.length) return undefined;
  return (
    fees.find((f) => f.title === "Entrance - Private Vehicle") ??
    fees
      .filter((f) => f.title.startsWith("Entrance -"))
      .sort((a, b) => parseFloat(a.cost) - parseFloat(b.cost))[0]
  );
}

export async function fetchParkProfile(park: string): Promise<NpsParkProfile | null> {
  const d = await fetchParkRaw(park);
  if (!d) return null;
  const fee = pickEntranceFee(d.entranceFees);
  return {
    description: d.description,
    entranceFeeCost: fee ? `$${fee.cost}` : null,
    entranceFeeDescription: fee?.description ?? null,
    sourceUrl: d.url,
    retrievedAt: new Date().toISOString(),
  };
}

export interface ParkImage {
  url: string;
  title: string;
  altText: string;
  credit: string;
}

/**
 * P0-10 rights gate: display only if public_domain OR approved_usage. The
 * NPS `/parks` images array has no explicit rights field, only a free-text
 * credit line — so "NPS" (or "National Park Service") appearing in the
 * credit is used as the public-domain proxy (federal work product), the
 * same signal NPGallery itself surfaces. A credit naming a private
 * photographer or partner org ("Photo courtesy of ..., Friends of Acadia")
 * is excluded — approved_usage review for those is a future pipeline step,
 * not something to assume here. Parks with zero images passing this filter
 * get the ContourField fallback, on purpose — never a fake landscape.
 */
function isPublicDomainCredit(credit: string): boolean {
  const c = credit.toLowerCase();
  // Exclusions first (audit #11): a credit can mention NPS and still not be
  // federal work product — "Photo courtesy of X / NPS", partner co-credits,
  // or an explicit ©. When in doubt, exclude; ContourField is the honest
  // fallback, never a rights gamble.
  if (c.includes("courtesy") || c.includes("permission") || c.includes("©") || c.includes("(c)")) return false;
  // Word-boundary match — bare includes("nps") false-positives on strings
  // that merely contain the letters (org names, nps.gov URLs in prose).
  return /(^|[^a-z])nps([^a-z]|$)/.test(c) || c.includes("national park service");
}

export async function fetchParkImages(park: string): Promise<ParkImage[]> {
  const p = await fetchParkRaw(park);
  const images = p?.images ?? [];
  return images
    .filter((im) => im.url && isPublicDomainCredit(im.credit ?? ""))
    .slice(0, 8)
    .map((im) => ({ url: im.url, title: im.title, altText: im.altText, credit: im.credit }));
}

export interface NpsAlert {
  title: string;
  description: string;
  category: string;
  lastIndexedDate: string;
  url: string;
}

/** ONE bulk /alerts request for all 63 codes; per-park slices served from
 * the shared cached response (each alert carries its parkCode). limit=800
 * comfortably exceeds the systemwide active-alert count for 63 parks. */
async function fetchAllAlerts(): Promise<Map<string, NpsAlert[]>> {
  const json = await npsFetch<RawAlertsResponse>("/alerts", { parkCode: ALL_CODES, limit: "800" });
  const byPark = new Map<string, NpsAlert[]>();
  for (const a of json?.data ?? []) {
    const code = (a.parkCode ?? "").toLowerCase();
    const list = byPark.get(code) ?? [];
    if (list.length < 6) {
      list.push({ title: a.title, description: a.description, category: a.category, lastIndexedDate: a.lastIndexedDate, url: a.url });
      byPark.set(code, list);
    }
  }
  return byPark;
}

export async function fetchParkAlerts(park: string): Promise<NpsAlert[]> {
  return (await fetchAllAlerts()).get(park.toLowerCase()) ?? [];
}

interface RawThingsToDoResponse {
  data: {
    title: string;
    shortDescription: string;
    activities?: { name: string }[];
  }[];
}

export interface NpsThing {
  title: string;
  shortDescription: string;
  activity: string | null;
}

/** Real NPS "things to do" — used for the Must-See section on non-cohort parks, which have no hand-curated fixture. */
export async function fetchThingsToDo(park: string): Promise<NpsThing[]> {
  const json = await npsFetch<RawThingsToDoResponse>("/thingstodo", { parkCode: park, limit: "6" });
  return json?.data?.map((t) => ({
    title: t.title,
    shortDescription: t.shortDescription,
    activity: t.activities?.[0]?.name ?? null,
  })) ?? [];
}
