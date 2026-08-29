import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { ALL_PARKS_MINI } from "@/lib/data/all-parks-mini";
import { MONTHS, SEASONS } from "@/lib/months";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/parks`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/rankings`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const monthRoutes: MetadataRoute.Sitemap = MONTHS.map((m) => ({
    url: `${SITE_URL}/discover/month/${m.abbr}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const seasonRoutes: MetadataRoute.Sitemap = SEASONS.map((s) => ({
    url: `${SITE_URL}/discover/season/${s.key}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const parkRoutes: MetadataRoute.Sitemap = ALL_PARKS_MINI.map((p) => ({
    url: `${SITE_URL}/parks/${p.code}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.cohort ? 0.9 : 0.6,
  }));

  return [...staticRoutes, ...monthRoutes, ...seasonRoutes, ...parkRoutes];
}
