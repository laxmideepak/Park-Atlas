/**
 * Live location context per park — U.S. National Weather Service API
 * (api.weather.gov). No key required; a descriptive User-Agent is the only
 * requirement per NWS's own usage guidance. Covers CONUS, Alaska, Hawaii,
 * and territories (confirmed against American Samoa & US Virgin Islands
 * coordinates). Cached server-side; never called from the browser.
 */

const USER_AGENT = "ParkAtlas (github.com/parkatlas, contact: hello@parkatlas.example)";
const REVALIDATE_SECONDS = 60 * 30; // 30 min

interface PointsResponse {
  properties: {
    timeZone: string;
    forecast: string;
    relativeLocation: { properties: { city: string; state: string } };
  };
}

interface ForecastResponse {
  properties: {
    periods: { name: string; temperature: number; temperatureUnit: string; shortForecast: string }[];
  };
}

export interface LiveContext {
  timezone: string;
  tempF: number | null;
  shortForecast: string | null;
  nearestCity: string | null;
}

async function nwsFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getLiveContext(lat: number, lng: number): Promise<LiveContext | null> {
  const points = await nwsFetch<PointsResponse>(`https://api.weather.gov/points/${lat},${lng}`);
  if (!points) return null;
  const timezone = points.properties.timeZone;
  const nearestCity = points.properties.relativeLocation?.properties
    ? `${points.properties.relativeLocation.properties.city}, ${points.properties.relativeLocation.properties.state}`
    : null;

  const forecast = await nwsFetch<ForecastResponse>(points.properties.forecast);
  const period = forecast?.properties.periods?.[0];

  return {
    timezone,
    tempF: period && period.temperatureUnit === "F" ? period.temperature : null,
    shortForecast: period?.shortForecast ?? null,
    nearestCity,
  };
}

/** Timezone-only lookup (no forecast follow-up) — cheap enough to run for all 63 parks at once, e.g. on the map. */
export async function getTimezone(lat: number, lng: number): Promise<string | null> {
  const points = await nwsFetch<PointsResponse>(`https://api.weather.gov/points/${lat},${lng}`);
  return points?.properties.timeZone ?? null;
}
