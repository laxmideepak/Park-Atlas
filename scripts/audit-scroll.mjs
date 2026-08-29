import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3000/";
const FRAMES_TO_SAMPLE = 240;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: "load" });

  const framesPromise = page.evaluate((frameCount) => {
    return new Promise((resolve) => {
      const deltas = [];
      let last = performance.now();
      function frame(t) {
        deltas.push(t - last);
        last = t;
        if (deltas.length < frameCount) requestAnimationFrame(frame);
        else resolve(deltas);
      }
      requestAnimationFrame(frame);
    });
  }, FRAMES_TO_SAMPLE);

  // Real wheel events, so Lenis's own listener drives the smooth-scroll loop —
  // window.scrollBy()/scrollTo() bypass Lenis entirely and would measure native
  // browser scroll performance, not what users actually experience.
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(33);
  }

  const frameDeltas = await framesPromise;
  await browser.close();

  const avg = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
  const worst = Math.max(...frameDeltas);
  const over26 = frameDeltas.filter((d) => d > 26).length;

  console.log(`URL: ${URL}`);
  console.log(`Frames sampled: ${frameDeltas.length}`);
  console.log(`Avg frame: ${avg.toFixed(1)}ms`);
  console.log(`Worst frame: ${worst.toFixed(1)}ms`);
  console.log(`Frames >26ms: ${over26}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
