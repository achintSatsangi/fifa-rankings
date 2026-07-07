#!/usr/bin/env node
/**
 * Radial (read-only) walkthrough → docs/radial-demo.webm.
 *
 * Beats: freshness chip hover, trophy hover (Final info), played-team
 * hover (score tooltip), team click → Journey Modal → close. Skips
 * beats whose targets aren't present so the recording never hard-fails.
 *
 * Usage:
 *   node scripts/record-radial-demo.mjs
 *   TARGET=http://localhost:5173 node scripts/record-radial-demo.mjs
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideToOptional,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "radial-demo.webm";

console.log(`Recording radial demo: ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  // Give ResizeObserver time to size the ring.
  await page.waitForTimeout(1600);

  // Ensure we're on Radial (default), not Interactive.
  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /^radial$/i }).first(),
    600,
    2000,
  );

  // ── Freshness chip in the header (skips if BUILD_TIMESTAMP unset) ─
  await slideToOptional(page, page.locator("header [title]").first(), 1400, 3000);

  // ── Trophy at the centre = Final match tooltip ────────────────────
  await slideToOptional(page, page.locator('[aria-label="Final"]'), 1600);

  // ── Played team hover (score tooltip) ─────────────────────────────
  for (const name of ["Norway", "France", "Argentina", "Spain", "England"]) {
    if (await slideToOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 1500, 2000)) {
      break;
    }
  }

  // ── Click a team → Journey Modal ──────────────────────────────────
  for (const name of ["Norway", "France", "England", "Brazil"]) {
    if (
      await clickOptional(
        page,
        page.locator(`button[aria-label="${name}"]`).first(),
        2800,
        2000,
      )
    ) {
      break;
    }
  }

  // Close the modal.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  // Trailing dwell so the last frame isn't a click flash.
  await page.waitForTimeout(600);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
