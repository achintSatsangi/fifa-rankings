#!/usr/bin/env node
/**
 * Mobile-framed Replay walkthrough → docs/replay-demo-mobile.webm.
 *
 * Same beats as record-replay-demo.mjs: switch to Replay → set 2×
 * speed → Play → watch autoplay → Pause → drag scrubber forward,
 * back, forward.
 *
 * At 540×960 (below the Tailwind `sm` breakpoint) the mobile layout
 * fits the ring + all controls in the viewport without any scroll —
 * so no scrollMain() call needed. Convert to 1080×1920 for social:
 *
 *   ffmpeg -i docs/replay-demo-mobile.webm \
 *     -vf 'scale=1080:1920:flags=lanczos' \
 *     -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
 *     docs/replay-demo-mobile.mp4
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideTo,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "replay-demo-mobile.webm";
const VIEWPORT = { width: 540, height: 960 };

async function dragScrubberTo(page, targetFraction) {
  const slider = page.locator('input[type="range"]').first();
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
  await page.waitForTimeout(1100);
}

console.log(`Recording replay demo (mobile): ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR, VIEWPORT);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  await page.waitForTimeout(2200);

  // Switch to Replay.
  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /replay/i }).first(),
    900,
    3000,
  );

  // Speed → 2× (fastest of the three pills, labelled "2×").
  await clickOptional(
    page,
    page.locator('[role="radio"]', { hasText: /^2×$/ }).first(),
    700,
    2000,
  );

  // Play. Verify the click actually took (button text flips to Pause).
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

  // Watch autoplay for ~9 seconds — labelled 2× is real 4× = 600ms/step,
  // so ~15 matches advance in that time.
  await page.waitForTimeout(9000);

  // Pause so we can scrub manually.
  await clickOptional(
    page,
    page.locator("button", { hasText: /pause/i }).first(),
    1200,
    2000,
  );

  // Drag scrubber forward → back → forward.
  await dragScrubberTo(page, 0.75);
  await dragScrubberTo(page, 0.25);
  await dragScrubberTo(page, 0.55);

  // Move cursor away for a clean final frame.
  await slideTo(page, 270, 250);
  await page.waitForTimeout(900);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
