#!/usr/bin/env node
/**
 * Combined walkthrough of both bracket views in one continuous session,
 * → docs/demo.webm. Radial first (freshness chip → trophy tooltip →
 * played-team hover → Journey Modal open/close), then switches to
 * Interactive (advance 5 teams to show slide + pop + toast → reset).
 *
 * The narrower split scripts (record-radial-demo, record-interactive-
 * demo) stay in the repo for regenerating a single flow when only
 * one view changed.
 *
 * Usage:
 *   node scripts/record-demo.mjs
 *   TARGET=http://localhost:5173 node scripts/record-demo.mjs
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
  slideToOptional,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "demo.webm";

console.log(`Recording combined demo: ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  await page.waitForTimeout(1600);

  // ══════════════════ PART 1: RADIAL (read-only) ══════════════════

  // Ensure Radial (page default) — no-op click that also flushes any
  // stale localStorage picks from a prior run's context reuse.
  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /^radial$/i }).first(),
    600,
    2000,
  );

  // Freshness chip in the header.
  await slideToOptional(page, page.locator("header [title]").first(), 1400, 3000);

  // Trophy tooltip = Final match info.
  await slideToOptional(page, page.locator('[aria-label="Final"]'), 1600);

  // Played team → score tooltip.
  for (const name of ["Norway", "France", "Argentina", "Spain", "England"]) {
    if (await slideToOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 1500, 2000)) {
      break;
    }
  }

  // Click a team → Journey Modal.
  for (const name of ["Norway", "France", "England", "Brazil"]) {
    if (
      await clickOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 2800, 2000)
    ) {
      break;
    }
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  // ══════════════════ PART 2: INTERACTIVE (picks flow) ══════════════

  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /interactive/i }).first(),
    1200,
    3000,
  );

  // Advance a handful of teams — each click triggers slide + pop + toast.
  const advanceCandidates = [
    "France",
    "Morocco",
    "England",
    "Brazil",
    "Norway",
    "Portugal",
    "Spain",
    "Argentina",
  ];
  let advanced = 0;
  for (const name of advanceCandidates) {
    if (advanced >= 5) break;
    if (
      await clickOptional(page, page.locator(`button[aria-label="${name}"]`).first(), 1500, 2500)
    ) {
      advanced++;
    }
  }

  // Let the last toast fade cleanly.
  await page.waitForTimeout(1500);

  // Reset — teams slide back to their outer slots.
  await clickOptional(page, page.locator("button", { hasText: /reset/i }).first(), 2000, 3000);

  // Trailing dwell so the last frame isn't mid-click.
  await page.waitForTimeout(800);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
