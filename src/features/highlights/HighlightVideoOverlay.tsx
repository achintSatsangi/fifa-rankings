import { useEffect } from "react";

type Props = {
  videoId: string;
  title: string;
  onClose: () => void;
};

/**
 * Lightweight inline YouTube player. Deliberately does NOT use the
 * shared `Modal` primitive because we're rendered inside another Modal
 * (the Journey Modal) — both would attach their own Escape listener on
 * `document`, and a single Esc keypress would close both. Here we own
 * a capture-phase listener + stopImmediatePropagation so the inner
 * overlay eats the Escape without bubbling out to the parent modal.
 *
 * z-[60] sits above the parent Modal's z-50 backdrop.
 */
export function HighlightVideoOverlay({ videoId, title, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Capture-phase + stopImmediatePropagation prevents the parent
      // Modal's Esc handler from firing on the same keystroke.
      e.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute -right-2 -top-2 rounded-full bg-black/80 p-2 text-white ring-1 ring-white/20 transition-colors hover:bg-black"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
