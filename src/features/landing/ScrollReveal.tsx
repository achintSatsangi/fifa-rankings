import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Milliseconds to delay the transition after the element enters view. */
  delay?: number;
  /** Fraction of the element (0–1) that must be visible to trigger. */
  threshold?: number;
  /** Wrapper element tag. Defaults to div. */
  as?: "div" | "section" | "p" | "h1" | "h2" | "span";
  className?: string;
};

/**
 * Fades + translates its children up into place the first time they
 * enter the viewport. Uses IntersectionObserver + Tailwind transitions
 * so there's no framer-motion dependency. Reduced-motion viewers get
 * the destination state immediately.
 */
export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.15,
  as: Tag = "div",
  className = "",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Respect prefers-reduced-motion: skip the animation entirely so
    // screen readers and vestibular-disorder users don't see motion.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const baseClasses =
    "transition-all duration-700 ease-out will-change-transform " +
    (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4");

  return (
    <Tag
      ref={ref as never}
      className={`${baseClasses} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
