/**
 * Server-only NPS Data API client (P0-2: no browser-side calls, key stays
 * server-side, responses cached). Runs at build time for our statically
 * generated park pages, so the ~1,000 req/hr limit is a non-issue — each
 * park is fetched once per rebuild, not per visitor. `park` is the NPS
 * 4-letter park code directly (e.g. "acad", "zion") — used as-is, all 63.
 */

const NPS_BASE = "https://developer.nps.gov/api/v1";
const REVALIDATE_SECONDS = 60 * 60 * 24; // daily

interface RawImage {
  url: string;
  title: string;
  altText: string;
  caption: string;
  credit: string;
}

interface RawParksResponse {
  data: {
    description: string;
    url: string;
    entranceFees?: { cost: string; description: string; title: string }[];
    operatingHours?: { name: string; description: string }[];
    images?: RawImage[];
  }[];
}

interface RawAlertsResponse {
  data: {
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
      if (res.ok) return (await res.json()) as T;
      if (res.status !== 429 && res.status < 500) return null; // real error, don't hammer
    } catch {
      // network hiccup — fall through to retry
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1) + Math.floor(Math.random() * 500)));
  }
  return null;
}

export interface NpsParkProfile {
  description: string;
  entranceFeeCost: string | null;
  entranceFeeDescription: string | null;
  sourceUrl: string;
  retrievedAt: string;
}

export async function fetchParkProfile(park: string): Promise<NpsParkProfile | null> {
  const json = await npsFetch<RawParksResponse>("/parks", {
    parkCode: park,
    fields: "entranceFees",
  });
  const d = json?.data?.[0];
  if (!d) return null;
  const fee = d.entranceFees?.[0];
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
  return c.includes("nps") || c.includes("national park service");
}

export async function fetchParkImages(park: string): Promise<ParkImage[]> {
  const json = await npsFetch<RawParksResponse>("/parks", { parkCode: park, fields: "images" });
  const images = json?.data?.[0]?.images ?? [];
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

export async function fetchParkAlerts(park: string): Promise<NpsAlert[]> {
  const json = await npsFetch<RawAlertsResponse>("/alerts", { parkCode: park, limit: "6" });
  return json?.data?.map((a) => ({
    title: a.title,
    description: a.description,
    category: a.category,
    lastIndexedDate: a.lastIndexedDate,
    url: a.url,
  })) ?? [];
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
