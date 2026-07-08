/**
 * Shared Playwright helpers for the docs/*.webm recordings.
 *
 * Two scripts consume these: record-radial-demo.mjs and
 * record-interactive-demo.mjs. Each spins up a fresh browser context
 * (so the interactive picks store starts clean) and produces a
 * separate video.
 */

import { chromium } from "@playwright/test";
import { mkdirSync, existsSync, readdirSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

/** Default (desktop) viewport. Individual scripts can pass their own
 *  size to `launchRecording()` — the mobile demo uses 540x960 so the
 *  site renders below the sm breakpoint. */
export const VIEWPORT = { width: 1280, height: 900 };

/** Injected once per page — paints a red dot that follows the mouse
 *  and pulses on click, so viewers can track where the cursor is. */
const CURSOR_SCRIPT = () => {
  const dot = document.createElement("div");
  dot.id = "__demo-cursor";
  dot.style.cssText = [
    "position:fixed",
    "z-index:2147483647",
    "top:-100px",
    "left:-100px",
    "width:22px",
    "height:22px",
    "border:2px solid rgba(255,51,51,0.9)",
    "background:rgba(255,51,51,0.35)",
    "border-radius:50%",
    "pointer-events:none",
    "transform:translate(-50%,-50%)",
    "transition:left 60ms linear, top 60ms linear",
    "box-shadow:0 0 12px rgba(255,51,51,0.6)",
  ].join(";");
  document.documentElement.appendChild(dot);
  document.addEventListener("mousemove", (e) => {
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
  });
  document.addEventListener(
    "click",
    () => {
      dot.animate(
        [
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
          { transform: "translate(-50%,-50%) scale(2.2)", opacity: 0.25 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        ],
        { duration: 380 },
      );
    },
    true,
  );
};

export async function launchRecording(outDir, viewport = VIEWPORT) {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
    recordVideo: { dir: outDir, size: viewport },
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  return { browser, context, page };
}

export async function slideTo(page, x, y) {
  await page.mouse.move(x, y, { steps: 24 });
  await page.waitForTimeout(180);
}

/** Try to hover a locator. If it doesn't resolve within `timeoutMs`,
 *  log and skip — the beat is optional. Returns true if it fired. */
export async function slideToOptional(page, locator, dwellMs = 800, timeoutMs = 4000) {
  try {
    const box = await locator.boundingBox({ timeout: timeoutMs });
    if (!box) return false;
    await slideTo(page, box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(dwellMs);
    return true;
  } catch {
    return false;
  }
}

/** Click a locator; skips silently if it isn't present. */
export async function clickOptional(page, locator, postWaitMs = 500, timeoutMs = 4000) {
  try {
    const box = await locator.boundingBox({ timeout: timeoutMs });
    if (!box) return false;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await slideTo(page, cx, cy);
    await page.mouse.click(cx, cy);
    await page.waitForTimeout(postWaitMs);
    return true;
  } catch {
    return false;
  }
}

/** Playwright names videos with a random UUID (e.g. `page@abc123.webm`);
 *  rename the newest .webm in `outDir` to a stable file name. Uses
 *  mtime — an earlier version filtered by name and picked an unrelated
 *  older webm that happened to be first alphabetically, clobbering a
 *  previous stable recording. */
export async function renameLatestVideo(context, outDir, targetName) {
  await context.close();
  const files = readdirSync(outDir)
    .filter((f) => f.endsWith(".webm") && f !== targetName)
    .map((f) => ({ f, mtime: statSync(join(outDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  const source = files[0]?.f;
  if (!source) return null;
  const src = join(outDir, source);
  const dest = join(outDir, targetName);
  renameSync(src, dest);
  return dest;
}
