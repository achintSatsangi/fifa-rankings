import { useTranslation } from "react-i18next";
import { ScrollReveal } from "./ScrollReveal";

const PAUL_NOBLE_HREF = "https://fwc2026-knockout.vercel.app/";

/**
 * Hero narrative that opens the one-pager. Seven beats, revealed in
 * sequence as the visitor scrolls. Frames the circular bracket concept
 * and credits Paul Noble at the end. Sits in a ~90vh section so the
 * bracket teases into view on scroll.
 */
export function Storyline() {
  const { t } = useTranslation();
  const beats = [1, 2, 3, 4, 5, 6, 7].map((n) => t(`landing.storyline.beat${n}`));

  return (
    <section className="mx-auto flex min-h-[85svh] w-full max-w-3xl flex-col justify-center gap-6 px-2 py-16 sm:gap-8 sm:py-24">
      {beats.map((text, i) => (
        <ScrollReveal
          key={i}
          delay={i === 0 ? 60 : 0}
          as="p"
          className={
            // First beat is the hook — larger and bolder. Every other
            // beat slightly smaller. The single-emphasis beats ("refuses
            // that story") get their own visual weight via being on
            // their own line with no siblings around them.
            i === 0
              ? "text-2xl font-semibold leading-snug text-[var(--text)] sm:text-4xl"
              : "text-lg leading-relaxed text-[var(--text-secondary)] sm:text-2xl"
          }
        >
          {text}
        </ScrollReveal>
      ))}

      <ScrollReveal
        as="p"
        delay={100}
        className="mt-4 text-sm text-[var(--text-muted)] sm:text-base"
      >
        {t("landing.storyline.creditPrefix")}{" "}
        <a
          href={PAUL_NOBLE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text)]"
        >
          {t("landing.storyline.creditName")}
        </a>
        {t("landing.storyline.creditSuffix")}
      </ScrollReveal>

      <ScrollReveal delay={200} className="mt-10 flex justify-center text-[var(--text-muted)]">
        <span
          className="motion-safe:animate-bounce text-xs uppercase tracking-widest"
          aria-hidden="true"
        >
          ↓ {t("landing.scrollHint")}
        </span>
      </ScrollReveal>
    </section>
  );
}
