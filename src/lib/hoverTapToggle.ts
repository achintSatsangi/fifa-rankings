import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";

export type HoverTapTriggers = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e: MouseEvent) => void;
};

/**
 * Combined hover + tap toggle for popovers that need to work on both
 * desktop (hover shows) and mobile (tap opens, tap outside closes).
 *
 * - Mouse: onMouseEnter/Leave drive visibility.
 * - Touch: onClick toggles a persistent `tapped` state. Tapping
 *   outside the container closes it.
 *
 * `visible` is `hovered || tapped`. Attach the returned `ref` to the
 * container that "counts" as inside (the tooltip should be a
 * descendant so tapping it doesn't dismiss).
 */
export function useHoverTapToggle(): {
  visible: boolean;
  triggerProps: HoverTapTriggers;
  containerRef: RefObject<HTMLElement | null>;
} {
  const [hovered, setHovered] = useState(false);
  const [tapped, setTapped] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!tapped) return;
    const onOutside = (e: PointerEvent) => {
      const node = e.target as Node | null;
      if (node && containerRef.current?.contains(node)) return;
      setTapped(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [tapped]);

  const triggerProps: HoverTapTriggers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onClick: (e) => {
      e.stopPropagation();
      setTapped((t) => !t);
    },
  };

  return { visible: hovered || tapped, triggerProps, containerRef };
}
