import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { playCelebrationSound } from "./celebrationSound";

/**
 * Champion celebration. Uses `canvas-confetti` — the pieces render on
 * a full-screen canvas the library manages, above the page content.
 *
 * Fires on every `active` false → true transition (so scrubbing back
 * to the Final replays the celebration). Nothing to render in React;
 * we just dispatch the effect.
 */

const COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#facc15",
  "#10b981",
  "#ec4899",
  "#22d3ee",
  "#f97316",
  "#a855f7",
];

const BURST_DURATION_MS = 2600;

function celebrate() {
  // Reduced motion → skip the animation entirely.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  // Fire the horn fanfare + crowd swell alongside the visuals. Sound
  // module has its own reduced-motion + browser-support guards.
  playCelebrationSound();

  // Desktop viewports get chunkier confetti so pieces stay readable on
  // large screens; mobile keeps the default (feels right at phone
  // distance). Breakpoint matches Tailwind's `sm`.
  const isDesktop = window.innerWidth >= 640;
  const openingScalar = isDesktop ? 1.65 : 1.1;
  const cannonScalar = isDesktop ? 1.5 : 1.0;

  // Opening blast — a big burst from mid-lower to establish the moment.
  confetti({
    particleCount: 160,
    spread: 110,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.6 },
    colors: COLORS,
    scalar: openingScalar,
    zIndex: 100,
  });

  // Sustained cross-fire — two cannons from the bottom corners shoot
  // inward continuously for a few seconds, so the moment lingers
  // instead of being one bang.
  const end = performance.now() + BURST_DURATION_MS;
  const tick = () => {
    const now = performance.now();
    if (now >= end) return;
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 60,
      startVelocity: 50,
      origin: { x: 0, y: 0.85 },
      colors: COLORS,
      scalar: cannonScalar,
      zIndex: 100,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 60,
      startVelocity: 50,
      origin: { x: 1, y: 0.85 },
      colors: COLORS,
      scalar: cannonScalar,
      zIndex: 100,
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function Confetti({ active }: { active: boolean }) {
  // Track previous value so we only fire on false → true transitions.
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      celebrate();
    }
    wasActiveRef.current = active;
  }, [active]);

  return null;
}
