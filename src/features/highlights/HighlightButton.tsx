import type { HighlightSource } from "./resolver";

type Props = {
  url: string;
  source: HighlightSource;
  label: string;
};

/** YouTube-red pill when we have a direct FIFA-channel video; a muted
 *  neutral pill when we're falling back to a channel search URL. Both
 *  share the play-triangle glyph so the affordance reads the same. */
export function HighlightButton({ url, source, label }: Props) {
  const isYouTube = source === "youtube";
  const classes = isYouTube
    ? "bg-[#ff0000] text-white hover:opacity-85"
    : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={
        "inline-flex h-4 w-6 items-center justify-center rounded-[3px] transition-colors " +
        classes
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
