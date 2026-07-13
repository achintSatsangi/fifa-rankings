#!/usr/bin/env node
/**
 * Mobile-framed Historical section walkthrough →
 *   docs/historical-demo-mobile.webm
 *
 * Beats:
 *   1. Load page, scroll down to the Past World Cups section.
 *   2. Horizontally scroll the year picker to reveal how many years
 *      are available (1954 through 2022), then scroll back to the
 *      start where 2022 sits.
 *   3. 2022 is already selected by default — hover two outer-ring
 *      flags to reveal match tooltips.
 *   4. Switch to Replay view (scoped to the historical section — the
 *      WC26 section above has its own Replay tab).
 *   5. Bump to 2× speed, scrub to the middle of the slider, press
 *      Play, and let it run through to the Final + confetti burst.
 *
 * Convert to 1080×1920 for social sharing:
 *
 *   ffmpeg -i docs/historical-demo-mobile.webm \
 *     -vf 'scale=1080:1920:flags=lanczos' \
 *     -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
 *     docs/historical-demo-mobile.mp4
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideTo,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "historical-demo-mobile.webm";
const VIEWPORT = { width: 540, height: 960 };

/** Smoothly scroll the horizontal year-picker container to a target
 *  scrollLeft, then wait for the momentum + snap to settle. */
async function scrollPickerTo(page, picker, targetLeft, dwellMs = 1200) {
  await picker.evaluate((el, left) => {
    el.scrollTo({ left, behavior: "smooth" });
  }, targetLeft);
  await page.waitForTimeout(dwellMs);
}

/** Slide the mouse to a fraction (x, y) of the given bounding box.
 *  Small helper so ring-relative hovers stay readable. */
async function hoverAtFraction(page, box, fx, fy, dwellMs = 1400) {
  await slideTo(page, box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(dwellMs);
}

/** Drag the slider knob to a target fraction of its width. Same
 *  pattern the replay-demo scripts use — Playwright's fill() on
 *  <input type=range> doesn't fire React's onChange consistently in
 *  Chromium, so we drive it via a real mouse drag. */
async function dragScrubberTo(page, slider, targetFraction) {
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) return;
  const current = await slider.evaluate((el) => {
    const input = el;
    const v = Number(input.value);
    const max = Number(input.max);
    return max > 0 ? v / max : 0;
  });
  const y = box.y + box.height / 2;
  const startX = box.x + box.width * current;
  const targetX = box.x + box.width * targetFraction;
  await page.mouse.move(startX, y, { steps: 8 });
  await page.mouse.down();
  await page.mouse.move(targetX, y, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(900);
}

console.log(`Recording historical demo (mobile): ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR, VIEWPORT);

// Hide the TanStack Router + React Query devtools UI (only mounted in
// dev builds). They render as floating buttons/panels and popped open
// mid-take on the previous recording. Safe no-op against the prod
// deploy since the devtools aren't in the DOM there.
await context.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent = `
    [class*="tsqd"],
    [id^="TanStackRouterDevtools"],
    [aria-label*="TanStack" i],
    [aria-label*="Devtool" i],
    button[title*="Query" i],
    button[title*="Router" i] { display: none !important; }
  `;
  const inject = () => document.head.appendChild(style);
  if (document.head) inject();
  else document.addEventListener("DOMContentLoaded", inject);
});

try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  await page.waitForTimeout(1800);

  // ─── Beat 1: scroll so the year picker sits near the TOP of the
  //     viewport and the ring below dominates the middle of frame.
  //     scrollIntoView({ block: 'start' }) puts the picker's top edge
  //     at the viewport top; then nudge down ~40 px so the section
  //     title above stays partially visible for context. ─────────────
  const histSection = page.locator("section").filter({ hasText: /past world cups/i }).first();
  const picker = histSection.locator('[role="radiogroup"]').first();
  await picker.evaluate((el) => {
    el.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollBy({ top: -40, behavior: "smooth" }));
  await page.waitForTimeout(1200);

  // Everything from here on is scoped to `histSection` so we don't
  // grab the WC26 bracket's Replay tab / scrubber up top.

  // ─── Beat 2: horizontal scroll through the year picker ────────
  const scrollWidth = await picker.evaluate((el) => el.scrollWidth - el.clientWidth);
  // Sweep to the far right (reveals 1954), pause, then sweep back to 0.
  await scrollPickerTo(page, picker, scrollWidth, 1600);
  await scrollPickerTo(page, picker, 0, 1200);

  // ─── Beat 3: 2022 is default; click it to make the selection
  //     explicit on camera, then hover 2 outer-ring flags. ─────────
  await clickOptional(
    page,
    picker.locator('[role="radio"]', { hasText: /^2022$/ }).first(),
    700,
    2000,
  );

  // Wait for the radial to settle before hovering.
  await page.waitForTimeout(1200);

  // Grab the historical ring container (the aspect-square wrapper).
  // Aspect-square by width means bbox is roughly a square just below
  // the year picker + host chip.
  const ring = histSection.locator("div.aspect-square").first();
  await ring.scrollIntoViewIfNeeded();
  const ringBox = await ring.boundingBox();
  if (ringBox) {
    // Outer ring geometry: 16 slots at radius 0.44 from centre.
    // slot i angle = (i + 0.5) / 16 * 2π; x = 0.5 + 0.44·sin, y = 0.5 - 0.44·cos.
    // Slot 2 = Argentina (upper-right, ~1 o'clock).
    // Slot 10 = France (lower-left, ~7 o'clock).
    // Both have match tooltips → good demo moments.
    const slot = (i) => {
      const a = ((i + 0.5) / 16) * Math.PI * 2;
      return { fx: 0.5 + 0.44 * Math.sin(a), fy: 0.5 - 0.44 * Math.cos(a) };
    };
    const s2 = slot(2);
    const s10 = slot(10);
    await hoverAtFraction(page, ringBox, s2.fx, s2.fy, 1800);
    await hoverAtFraction(page, ringBox, s10.fx, s10.fy, 1800);
    // Move cursor off the ring so the highlight resets before we
    // switch views.
    await slideTo(page, ringBox.x + ringBox.width / 2, ringBox.y - 40);
    await page.waitForTimeout(500);
  }

  // ─── Beat 4: switch to Replay view (historical toggle) ─────────
  await clickOptional(
    page,
    histSection.locator('[role="tab"]', { hasText: /^replay$/i }).first(),
    900,
    3000,
  );

  // Speed → 2× (fastest pill; internal speed=4 → ~600 ms per match).
  await clickOptional(
    page,
    histSection.locator('[role="radio"]', { hasText: /^2×$/ }).first(),
    500,
    2000,
  );

  // ─── Beat 5: scrub to the middle, then Play through to the end ─
  const scrubber = histSection.locator('input[type="range"]').first();
  await dragScrubberTo(page, scrubber, 0.5);

  await clickOptional(
    page,
    histSection.locator("button", { hasText: /^play$/i }).first(),
    400,
    2000,
  );

  // 2022 has 15 playable matches (R16 + QF + SF + F). From middle we
  // need ~7-8 more. At 2× (600 ms/step) that's ~5 s. Then confetti
  // burst runs 2.6 s + audio 2.2 s — wait a comfortable margin so the
  // celebration lands fully on camera.
  await page.waitForTimeout(6500);
  // Confetti + sound land right here — hold on the final frame.
  await page.waitForTimeout(3500);

  // Slide cursor away for a clean tail frame.
  if (ringBox) {
    await slideTo(page, ringBox.x + ringBox.width / 2, ringBox.y - 40);
  }
  await page.waitForTimeout(500);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
