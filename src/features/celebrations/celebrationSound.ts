/**
 * Champion celebration sound — one pre-mixed clip stored at
 * `public/sounds/celebration.mp3` (~55 KB, 3.4 s).
 *
 * The mix is authored offline by `scripts/build-celebration-sound.sh`:
 * three Mixkit source clips (whistle + brass fanfare + crowd cheer at
 * 50 %) layered with ffmpeg into a single tightly-cropped file. Doing
 * the mix at build time — rather than three concurrent
 * HTMLAudioElements at runtime — keeps the timing exact, gives us
 * proper crossfade tails, and cuts the network payload.
 *
 * We cache the Audio element on first play and rewind on re-trigger
 * so scrubbing back to the Final replays cleanly.
 *
 * Browser autoplay policy: Replay always starts on a user gesture
 * (Play button / scrubber drag), so `.play()` resolves.
 */

let cached: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (cached) return cached;
  const el = new Audio(`${import.meta.env.BASE_URL}sounds/celebration.mp3`);
  el.preload = "auto";
  el.volume = 1.0;
  cached = el;
  return el;
}

export function playCelebrationSound() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const el = getAudio();
  el.currentTime = 0;
  el.play().catch(() => {});
}
