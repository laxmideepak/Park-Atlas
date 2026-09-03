#!/usr/bin/env node
/**
 * Submits every sitemap URL to IndexNow (Bing, DuckDuckGo, Seznam, Yandex
 * share the endpoint). Google does not support IndexNow — Google discovery
 * happens via Search Console + the sitemap.
 *
 * The key file (public/<key>.txt, containing exactly the key) must be live
 * on the site BEFORE submitting — IndexNow verifies ownership by fetching
 * <site>/<key>.txt. So: deploy first, then run this.
 *
 * Run: node scripts/submit-indexnow.mjs [siteUrl]
 * Re-run after adding routes; resubmitting unchanged URLs is harmless
 * (engines rate-limit per key, one bulk call a day is plenty).
 */
const SITE = (process.argv[2] ?? "https://parkatlas.vercel.app").replace(/\/$/, "");
const KEY = "a99d58ee47244505ba689738a3196fda";

const sitemapXml = await (await fetch(`${SITE}/sitemap.xml`)).text();
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error("sitemap.xml yielded no <loc> entries");

const keyCheck = await fetch(`${SITE}/${KEY}.txt`);
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  throw new Error(`key file ${SITE}/${KEY}.txt not live yet — deploy before submitting`);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs — HTTP ${res.status} ${res.statusText}`);
if (!res.ok && res.status !== 202) process.exit(1);
