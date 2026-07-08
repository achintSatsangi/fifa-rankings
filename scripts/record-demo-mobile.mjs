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
 * Beats mirror the desktop demo but tuned for the narrower viewport:
 * freshness chip (compact form) → trophy tooltip → played-team hover
 * → team click → Journey Modal (mobile columns) → switch to
 * Interactive → advance 4 teams → reset.
 *
 * Usage:
 *   node scripts/record-demo-mobile.mjs
 *   TARGET=http://localhost:5173 node scripts/record-demo-mobile.mjs
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

  // ══════════════════ PART 1: RADIAL (read-only) ══════════════════

  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /^radial$/i }).first(),
    600,
    2000,
  );

  // Freshness chip in the header. Mobile renders the compact form
  // (just the pulse dot + "Xm ago") but hover still surfaces the
  // full title-attribute tooltip.
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

  // ══════════════════ PART 2: INTERACTIVE ══════════════════════════

  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /interactive/i }).first(),
    1200,
    3000,
  );

  // Four picks (narrower viewport = fewer visible flags at once, so
  // one fewer than desktop's five).
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

  await page.waitForTimeout(1500);

  await clickOptional(page, page.locator("button", { hasText: /reset/i }).first(), 2000, 3000);

  await page.waitForTimeout(800);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
