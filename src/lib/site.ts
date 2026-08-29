/** Single source for the deployed origin — Vercel sets `VERCEL_PROJECT_PRODUCTION_URL`
 * automatically; falls back to localhost so `next build`/tests never need it set. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const SITE_NAME = "ParkAtlas";
export const SITE_TAGLINE = "Find your park, find your month.";
