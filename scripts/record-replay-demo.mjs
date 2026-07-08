#!/usr/bin/env node
/**
 * Replay-mode walkthrough → docs/replay-demo.webm.
 *
 * Flow: switch to Replay tab → set speed to 2× → hit Play → watch a
 * few matches unfold at fast speed → hit Pause → drag the scrubber
 * forward → drag it backward. Shows off both autoplay and manual
 * scrubbing so viewers understand it's a full playback tool.
 *
 * Usage:
 *   node scripts/record-replay-demo.mjs
 *   TARGET=http://localhost:5173 node scripts/record-replay-demo.mjs
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideTo,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "replay-demo.webm";
/** Taller than the default 1280×900 so the ring + scrubber + speed/
 *  reset/play row all fit in-frame at once. Without the extra height
 *  the controls sit below the viewport and mouse.click(x, y) misses. */
const VIEWPORT = { width: 1280, height: 1100 };

/** Move the mouse to (targetFraction × slider width), press, drag from
 *  the current thumb position, release. Renders visually as the fake
 *  cursor overlay grabbing the pill and pulling it. */
async function dragScrubberTo(page, targetFraction) {
  const slider = page.locator('input[type="range"]').first();
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) return;
  // Read the slider's current normalized position so the drag STARTS
  // at the actual thumb — otherwise the "grab" flashes elsewhere.
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
  await page.waitForTimeout(1100);
}

/** Scroll the app's overflow-auto <main> by `dy` px. Playback controls
 *  sit below the ring, which itself hugs the vertical viewport limit —
 *  this brings them into frame before we start clicking. */
async function scrollMain(page, dy) {
  await page.evaluate((delta) => {
    const main = document.querySelector("main");
    if (main) main.scrollBy({ top: delta, behavior: "smooth" });
  }, dy);
}

console.log(`Recording replay demo: ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR, VIEWPORT);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  // The ring's ResizeObserver needs a moment after route mount before
  // it commits a size; without this the recording occasionally caught
  // a pre-hydrated, unstyled frame.
  await page.waitForTimeout(2200);

  // Switch to Replay.
  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /replay/i }).first(),
    900,
    3000,
  );

  // Scroll the main content down so the scrubber + speed/reset/play
  // row are fully in frame BEFORE we click anything. The ring is tall
  // enough on typical viewports that controls sit below the fold
  // otherwise, and mouse.click at off-screen coordinates misses.
  await scrollMain(page, 260);
  await page.waitForTimeout(900);

  // Speed → 2× (fastest of the three pills, labelled "2×").
  await clickOptional(
    page,
    page.locator('[role="radio"]', { hasText: /^2×$/ }).first(),
    700,
    2000,
  );

  // Play. Verify the click actually took (button text should flip
  // to "Pause") — helps debug when a future markup change silently
  // breaks the selector.
  await clickOptional(
    page,
    page.locator("button", { hasText: /^play$/i }).first(),
    400,
    2000,
  );
  const startedPlaying = await page.locator("button", { hasText: /^pause$/i }).count();
  if (startedPlaying === 0) {
    console.warn("⚠ Play button click didn't flip to Pause — autoplay may not have started");
  }

  // Watch autoplay for ~9 seconds → several matches at 2× labeled speed
  // (raw 4× multiplier = 600ms/step, so ~15 matches in ~9s).
  await page.waitForTimeout(9000);

  // Pause so we can scrub manually.
  await clickOptional(
    page,
    page.locator("button", { hasText: /pause/i }).first(),
    1200,
    2000,
  );

  // Drag scrubber forward — user is exploring what's ahead.
  await dragScrubberTo(page, 0.75);

  // Drag scrubber backward — user reviewing an earlier stage.
  await dragScrubberTo(page, 0.25);

  // Drag forward once more to end on a highlight.
  await dragScrubberTo(page, 0.55);

  // Move cursor off the slider so the last frame reads clean.
  await slideTo(page, 640, 300);
  await page.waitForTimeout(900);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
