import { test, expect, type Page } from "playwright/test";

const ROUTES = ["/", "/parks/acad", "/parks/zion", "/discover/month/oct", "/parks", "/rankings"];

/** Same-origin request/console/error collection, wired before navigation so
 * nothing fired during initial load is missed. */
function watch(page: Page, baseURL: string) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const origin = new URL(baseURL).origin;

  page.on("console", (msg) => {
    // Browser-native "Failed to load resource" messages are redundant with
    // the response listener below (which already filters out the one known
    // benign case) — only track real console.error() calls here, or this
    // would double-report the same signal without the ability to filter it.
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("response", (res) => {
    try {
      const url = new URL(res.url());
      // @vercel/analytics and @vercel/speed-insights request these paths on
      // every page; they only resolve on Vercel's own edge routing and 404
      // under a plain `next start` — expected locally, resolves in the real
      // deployment this suite is also meant to run against (BASE_URL=prod).
      if (url.pathname.startsWith("/_vercel/")) return;
      if (url.origin === origin && res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    } catch {
      // non-http(s) response URL (e.g. data:) — ignore
    }
  });

  return { consoleErrors, pageErrors, failedRequests };
}

/** Scrolls to the bottom in ~700px steps, sampling document.body.scrollHeight
 * at each stop. A real regression here means the browser's layout-height
 * estimate is drifting as sections enter/leave the viewport (the exact
 * content-visibility bug this suite guards against). */
async function sampleScrollHeights(page: Page): Promise<number[]> {
  const heights: number[] = [await page.evaluate(() => document.body.scrollHeight)];
  let pos = 0;
  // Re-read scrollHeight each iteration since it's the thing under test —
  // a fixed loop bound computed once up front could stop early/late as the
  // page (mis)reports its own height.
  for (let i = 0; i < 200; i++) {
    const total = await page.evaluate(() => document.body.scrollHeight);
    if (pos >= total) break;
    pos += 700;
    await page.evaluate((y) => window.scrollTo(0, y), pos);
    await page.waitForTimeout(60);
    heights.push(await page.evaluate(() => document.body.scrollHeight));
  }
  return heights;
}

/** Collects every element's computed view-transition-name, ignoring "none". */
async function viewTransitionNames(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const names: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const name = getComputedStyle(el).viewTransitionName;
      if (name && name !== "none") names.push(name);
    });
    return names;
  });
}

/** The LAST buffered LCP entry is the real one — resolving on the first
 * observer callback races the image entry and mis-reports (learned the
 * hard way during Living Heroes verification). */
async function lcpElementTag(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      new Promise<string>((res) => {
        const entries: LargestContentfulPaint[] = [];
        new PerformanceObserver((list) => {
          entries.push(...(list.getEntries() as LargestContentfulPaint[]));
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => res(entries.at(-1)?.element?.tagName ?? "none"), 2500);
      })
  );
}

for (const route of ROUTES) {
  test(`${route} — no console/page/network errors, stable scroll height, unique view-transition names`, async ({
    page,
    baseURL,
  }) => {
    const { consoleErrors, pageErrors, failedRequests } = watch(page, baseURL!);

    await page.goto(route, { waitUntil: "load" });
    await page.waitForTimeout(300); // let any client-side settling finish

    const heights = await sampleScrollHeights(page);
    const max = Math.max(...heights);
    const min = Math.min(...heights);

    const names = await viewTransitionNames(page);
    const duplicates = names.filter((name, i) => names.indexOf(name) !== i);

    // Living Heroes politeness (spec §3): any <video> anywhere must be a
    // polite one — poster-first, byte-frugal, silent.
    const impoliteVideos = await page.evaluate(() =>
      Array.from(document.querySelectorAll("video"))
        .filter((v) => v.getAttribute("preload") !== "none" || !v.muted || !v.hasAttribute("playsinline"))
        .map((v) => v.outerHTML.slice(0, 120))
    );

    expect(consoleErrors, "console errors").toEqual([]);
    expect(pageErrors, "uncaught page errors").toEqual([]);
    expect(failedRequests, "failed same-origin requests").toEqual([]);
    expect(max - min, `scrollHeight drift on ${route} (samples: ${heights.join(", ")})`).toBeLessThanOrEqual(100);
    expect(duplicates, `duplicate view-transition-name on ${route}`).toEqual([]);
    expect(impoliteVideos, "videos missing preload=none/muted/playsinline").toEqual([]);
  });
}

for (const route of ["/", "/parks/acad"]) {
  test(`${route} — LCP element is an IMG (never the video)`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    const tag = await lcpElementTag(page);
    expect(tag, `LCP element on ${route}`).toBe("IMG");
  });
}

test("home: hero video plays after settling in view (when a clip is curated for this month)", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });
  const hasVideo = (await page.locator("video").count()) > 0;
  test.skip(!hasVideo, "no Living Hero clip curated for the current month — photo fallback in effect");
  await page.waitForTimeout(5000);
  const state = await page.evaluate(() => {
    const v = document.querySelector("video")!;
    return { playing: !v.paused && v.currentTime > 0, src: v.currentSrc.split("/").pop() };
  });
  expect(state.playing, `hero video should be playing (src: ${state.src})`).toBe(true);
});

test("home: reduced motion loads zero video bytes and plays nothing", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const videoRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) videoRequests.push(r.url());
  });
  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const anyPlaying = await page.evaluate(() =>
    Array.from(document.querySelectorAll("video")).some((v) => !v.paused && v.currentTime > 0)
  );
  expect(videoRequests, "reduced motion must never request video bytes").toEqual([]);
  expect(anyPlaying, "no video may play under reduced motion").toBe(false);
  await ctx.close();
});

test("park detail: WhyDrawer opens and mentions data confidence", async ({ page }) => {
  await page.goto("/parks/acad", { waitUntil: "load" });

  // WhyDrawer's default trigger content is customized per call site (a Fit
  // number + bar, not literal "Why" text), so find it structurally: it's the
  // only interactive control inside the "When to go" section.
  await page.locator("#when-to-go button").first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/confidence/i);
});

test("home: clicking the first ParkCard link navigates to a park page", async ({ page }) => {
  await page.goto("/", { waitUntil: "load" });

  const firstParkLink = page.locator('a[href^="/parks/"]').first();
  await firstParkLink.click();

  await expect(page).toHaveURL(/\/parks\/[a-z]{4}$/);
});
