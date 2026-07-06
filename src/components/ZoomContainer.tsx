import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { getStorageItem, removeStorageItem, setStorageItem } from "../lib/storage";

type Transform = {
  scale: number;
  positionX: number;
  positionY: number;
};

type Props = {
  /** Unique key so each view persists its own state. */
  storageKey: string;
  /** Natural size of the content in CSS pixels. Used to compute the
   *  initial fit-to-viewport scale. */
  contentWidth: number;
  contentHeight: number;
  minScale?: number;
  maxScale?: number;
  children: ReactNode;
};

const DEFAULT_MIN = 0.3;
const DEFAULT_MAX = 4;
const SAVE_DEBOUNCE_MS = 200;

function readSaved(key: string): Transform | null {
  const raw = getStorageItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Transform>;
    if (typeof parsed.scale !== "number" || typeof parsed.positionX !== "number" || typeof parsed.positionY !== "number") return null;
    if (!Number.isFinite(parsed.scale) || parsed.scale <= 0) return null;
    return { scale: parsed.scale, positionX: parsed.positionX, positionY: parsed.positionY };
  } catch {
    return null;
  }
}

function fitTransform(
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
): Transform {
  const scale = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight, 1);
  const positionX = (viewportWidth - contentWidth * scale) / 2;
  const positionY = (viewportHeight - contentHeight * scale) / 2;
  return { scale, positionX, positionY };
}

export function ZoomContainer({
  storageKey,
  contentWidth,
  contentHeight,
  minScale = DEFAULT_MIN,
  maxScale = DEFAULT_MAX,
  children,
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<ReactZoomPanPinchRef | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const [saved] = useState(() => readSaved(storageKey));

  const fitToView = useCallback(() => {
    const outer = outerRef.current;
    const wrapper = wrapperRef.current;
    if (!outer || !wrapper) return;
    const { width, height } = outer.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const t = fitTransform(width, height, contentWidth, contentHeight);
    wrapper.setTransform(t.positionX, t.positionY, t.scale, 0);
  }, [contentWidth, contentHeight]);

  // If no saved state, fit content to the viewport once we have measurements.
  useLayoutEffect(() => {
    if (saved) return;
    fitToView();
  }, [saved, fitToView]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTransformed = (
    _ref: ReactZoomPanPinchRef,
    state: { scale: number; positionX: number; positionY: number },
  ) => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setStorageItem(
        storageKey,
        JSON.stringify({
          scale: state.scale,
          positionX: state.positionX,
          positionY: state.positionY,
        }),
      );
    }, SAVE_DEBOUNCE_MS);
  };

  const handleReset = () => {
    removeStorageItem(storageKey);
    fitToView();
  };

  return (
    <div ref={outerRef} className="relative h-full w-full">
      <TransformWrapper
        ref={wrapperRef}
        initialScale={saved?.scale ?? 1}
        initialPositionX={saved?.positionX ?? 0}
        initialPositionY={saved?.positionY ?? 0}
        minScale={minScale}
        maxScale={maxScale}
        limitToBounds={false}
        centerZoomedOut={false}
        wheel={{ step: 0.15 }}
        pinch={{ step: 5 }}
        doubleClick={{ mode: "toggle", step: 1.4 }}
        onTransform={handleTransformed}
      >
        <ZoomControls onReset={handleReset} />
        <TransformComponent
          wrapperClass="!h-full !w-full"
          contentClass="!h-auto !w-auto"
        >
          <div
            style={{ width: contentWidth, height: contentHeight }}
            className="relative"
          >
            {children}
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}

function ZoomControls({ onReset }: { onReset: () => void }) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col gap-1">
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset zoom and pan"
        title="Reset zoom and pan"
        className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2 py-1 text-xs text-[var(--text-secondary)] shadow-sm hover:text-[var(--text)]"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Reset
      </button>
    </div>
  );
}
