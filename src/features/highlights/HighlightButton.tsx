import { useState } from "react";
import { HighlightVideoOverlay } from "./HighlightVideoOverlay";
import type { HighlightSource } from "./resolver";

type Props = {
  url: string;
  source: HighlightSource;
  label: string;
};

/** Pill styling keyed off source so the origin of the video reads at a
 *  glance:
 *    youtube → YouTube brand red (opens inline player)
 *    fifa    → Vimeo-style teal-blue (opens FIFA article in a new tab)
 *    search  → muted grey (best-effort search-URL fallback, new tab) */
const STYLE_BY_SOURCE: Record<HighlightSource, string> = {
  youtube: "bg-[#ff0000] text-white hover:opacity-85",
  fifa: "bg-[#1AB7EA] text-white hover:opacity-85",
  search: "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
};

const PILL_CLASSES =
  "inline-flex h-4 w-6 items-center justify-center rounded-[3px] transition-colors";

function PlayIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Extract the YouTube video ID from either the full watch URL
 *  (`https://www.youtube.com/watch?v=<id>`) or the short form
 *  (`https://youtu.be/<id>`). Returns null on parse failure so the
 *  caller can fall back to opening the URL in a new tab. */
function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id.length > 0 ? id : null;
    }
    if (u.hostname.endsWith("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {
    /* fall through */
  }
  return null;
}

export function HighlightButton({ url, source, label }: Props) {
  const [videoOpen, setVideoOpen] = useState(false);
  const videoId = source === "youtube" ? youtubeVideoId(url) : null;

  // YouTube (with a parseable id): inline player overlay instead of
  // opening a new tab. Keeps the viewer inside the Journey Modal
  // context so closing the video returns them to the team's row.
  if (source === "youtube" && videoId) {
    return (
      <>
        <button
          type="button"
          onClick={() => setVideoOpen(true)}
          aria-label={label}
          title={label}
          className={`${PILL_CLASSES} ${STYLE_BY_SOURCE.youtube}`}
        >
          <PlayIcon />
        </button>
        {videoOpen ? (
          <HighlightVideoOverlay
            videoId={videoId}
            title={label}
            onClose={() => setVideoOpen(false)}
          />
        ) : null}
      </>
    );
  }

  // FIFA + search fallback: external site, open in a new tab.
  const title = source === "fifa" ? `${label} (fifa.com)` : label;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      title={title}
      className={`${PILL_CLASSES} ${STYLE_BY_SOURCE[source]}`}
    >
      <PlayIcon />
    </a>
  );
}
