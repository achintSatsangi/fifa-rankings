#!/usr/bin/env node
/**
 * Interactive picks walkthrough → docs/interactive-demo.webm.
 *
 * Beats: switch to Interactive tab, click 5 teams to demo slide + pop
 * + gamified toast, reset. Fresh browser context = clean picks store.
 *
 * Usage:
 *   node scripts/record-interactive-demo.mjs
 *   TARGET=http://localhost:5173 node scripts/record-interactive-demo.mjs
 */

import {
  clickOptional,
  launchRecording,
  renameLatestVideo,
} from "./lib/demo-helpers.mjs";

const TARGET = process.env.TARGET ?? "https://achintsatsangi.github.io/fifa-rankings/";
const OUT_DIR = "docs";
const OUT_NAME = "interactive-demo.webm";

console.log(`Recording interactive demo: ${TARGET} → ${OUT_DIR}/${OUT_NAME}`);

const { browser, context, page } = await launchRecording(OUT_DIR);
try {
  await page.goto(TARGET, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
  await page.waitForTimeout(1200);

  // Ensure clean picks state — persist storage is scoped to the fresh
  // browser context (empty on launch). Just switch the tab.
  await clickOptional(
    page,
    page.locator('[role="tab"]', { hasText: /interactive/i }).first(),
    1000,
    3000,
  );

  // Give the ring one beat to settle in interactive layout.
  await page.waitForTimeout(700);

  // ── Advance a handful of teams ────────────────────────────────────
  // Ordered so each pick has a valid opponent already resolved. Any
  // team not currently in the R32 outer ring (or not clickable for
  // some reason) is skipped, so the script tolerates the tournament
  // state changing over time.
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
    const flag = page.locator(`button[aria-label="${name}"]`).first();
    // Longer post-wait so the slide + pop + toast are all fully visible.
    if (await clickOptional(page, flag, 1500, 2500)) {
      advanced++;
    }
  }

  // Let the last toast fade completely.
  await page.waitForTimeout(1600);

  // ── Reset — teams slide back to their outer slots ────────────────
  await clickOptional(page, page.locator("button", { hasText: /reset/i }).first(), 2000, 3000);

  // Trailing dwell.
  await page.waitForTimeout(800);

  const out = await renameLatestVideo(context, OUT_DIR, OUT_NAME);
  console.log(`Wrote ${out ?? "(no file emitted)"}`);
} finally {
  await browser.close();
}
