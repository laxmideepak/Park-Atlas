/**
 * Server-only NPS Data API client (P0-2: no browser-side calls, key stays
 * server-side, responses cached). Runs at build time for our statically
 * generated park pages, so the ~1,000 req/hr limit is a non-issue — each
 * park is fetched once per rebuild, not per visitor. `park` is the NPS
 * 4-letter park code directly (e.g. "acad", "zion") — used as-is, all 63.
 */

const NPS_BASE = "https://developer.nps.gov/api/v1";
const REVALIDATE_SECONDS = 60 * 60 * 24; // daily

interface RawParksResponse {
  data: {
    description: string;
    url: string;
    entranceFees?: { cost: string; description: string; title: string }[];
    operatingHours?: { name: string; description: string }[];
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
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${NPS_BASE}${path}?${qs}`, {
      headers: { "X-Api-Key": key },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
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
