#!/usr/bin/env node
/**
 * Phone-framed walkthrough → docs/demo-mobile.webm.
 *
 * Records at 540×960 (9:16, below the Tailwind `sm` breakpoint of 640
 * so the site renders its mobile layout). Convert to 1080×1920 with
 * ffmpeg for Instagram Reels / YouTube Shorts:
 *
 *   ffmpeg -i docs/demo-mobile.webm \
 *     -vf 'scale=1080:1920:flags=lanczos' \
 *     -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
 *     docs/demo-mobile.mp4
 *
 * Flow order is deliberately Interactive-first for phone-vertical
 * viewing: the slide + pop + toast pops in the first few seconds so a
 * scroller sees the reward mechanic immediately. The Radial section
 * runs after with the read-only feature tour (freshness chip, trophy
 * tooltip, played-team score, Journey Modal).
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideToOptional,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "demo-mobile.webm";
const VIEWPORT = { width: 540, height: 960 };

console.log(`Recording mobile demo: ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR, VIEWPORT);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  await page.waitForTimeout(1800);

  // ══════════════════ PART 1: INTERACTIVE (hook) ══════════════════

  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /interactive/i }).first(),
    1200,
    3000,
  );

  const advanceCandidates = [
    "France",
    "Morocco",
    "England",
    "Brazil",
    "Norway",
    "Portugal",
    "Spain",
  ];
  let advanced = 0;
  for (const name of advanceCandidates) {
    if (advanced >= 4) break;
    if (
      await clickOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 1500, 2500)
    ) {
      advanced++;
    }
  }

  // Let the last toast fade cleanly before switching modes.
  await page.waitForTimeout(1500);

  // Reset — teams slide back to their outer slots.
  await clickOptional(page, page.locator("button", { hasText: /reset/i }).first(), 1800, 3000);

  // ══════════════════ PART 2: RADIAL (read-only tour) ══════════════

  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /^radial$/i }).first(),
    1000,
    3000,
  );

  // Freshness chip in the header. Mobile renders the compact form,
  // hover still surfaces the full title-attribute tooltip.
  await slideToOptional(page, page.locator("header [title]").first(), 1400, 3000);

  // Trophy tooltip = Final match info.
  await slideToOptional(page, page.locator('[aria-label="Final"]'), 1600);

  // Played team → score tooltip.
  for (const name of ["Norway", "France", "Argentina", "Spain", "England"]) {
    if (await slideToOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 1400, 2000)) {
      break;
    }
  }

  // Click a team → Journey Modal (mobile column layout).
  for (const name of ["Norway", "France", "England", "Brazil"]) {
    if (
      await clickOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 3000, 2000)
    ) {
      break;
    }
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  // Trailing dwell so the last frame isn't mid-click.
  await page.waitForTimeout(800);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
