import type { HighlightSource } from "./resolver";

type Props = {
  url: string;
  source: HighlightSource;
  label: string;
};

/** Pill styling keyed off source so the origin of the video reads at a
 *  glance:
 *    youtube → YouTube brand red
 *    fifa    → Vimeo-style teal-blue (FIFA article with embedded player)
 *    search  → muted grey (best-effort search-URL fallback) */
const STYLE_BY_SOURCE: Record<HighlightSource, string> = {
  youtube: "bg-[#ff0000] text-white hover:opacity-85",
  fifa: "bg-[#1AB7EA] text-white hover:opacity-85",
  search: "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
};

export function HighlightButton({ url, source, label }: Props) {
  const title = source === "fifa" ? `${label} (fifa.com)` : label;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title}
      title={title}
      className={
        "inline-flex h-4 w-6 items-center justify-center rounded-[3px] transition-colors " +
        STYLE_BY_SOURCE[source]
      }
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </a>
  );
}
