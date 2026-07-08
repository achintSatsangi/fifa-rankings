import { useEffect, useState } from "react";

type Props = {
  message: string;
  /** Bumped whenever a new pick is made — used as the React key so the
   *  toast remounts and its enter animation replays. */
  tick: number;
};

/**
 * Transient badge above the interactive bracket. Slides in, holds for
 * ~2s, fades out. No manual dismiss — the animation itself drives the
 * lifecycle, and a new pick replaces the message.
 */
export function PickToast({ message, tick }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (tick === 0) return;
    setVisible(true);
    // Match the animation duration in index.css (pick-toast-in).
    const timer = window.setTimeout(() => setVisible(false), 2400);
    return () => window.clearTimeout(timer);
  }, [tick]);

  if (!visible) return null;

  return (
    <div
      key={tick}
      role="status"
      aria-live="polite"
      // Fixed to the viewport (below the sticky header) instead of the
      // ring container so on mobile — where the outer flags sit right
      // at the container's top edge — the toast doesn't overlay them.
      className="pointer-events-none fixed left-1/2 top-16 z-40 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--accent)]/40 bg-[var(--surface-elevated)] px-3.5 py-1.5 text-xs font-medium text-[var(--text)] shadow-lg motion-safe:animate-pick-toast"
      style={{ boxShadow: "0 6px 24px var(--accent-glow)" }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
        style={{ boxShadow: "0 0 6px var(--accent-glow)" }}
      />
      <span>{message}</span>
    </div>
  );
}
