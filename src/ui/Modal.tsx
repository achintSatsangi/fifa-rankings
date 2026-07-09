import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "focus-trap-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function Modal({ open, onClose, title, children, size = "lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to document.body so `fixed inset-0` is bounded by the
  // viewport, not by an ancestor with a `transform` (e.g. ScrollReveal's
  // translate-y). Without this, the modal renders inside the transformed
  // ancestor's stacking context and page content bleeds through below it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-8"
      style={{ background: "var(--modal-overlay)" }}
      onClick={onClose}
      role="presentation"
    >
      <FocusTrap
        focusTrapOptions={{
          escapeDeactivates: false,
          allowOutsideClick: true,
          clickOutsideDeactivates: true,
        }}
      >
        <div
          className={`flex max-h-[90vh] w-full ${SIZES[size]} flex-col rounded-lg`}
          style={{
            background: "var(--surface-elevated)",
            boxShadow: "var(--modal-shadow)",
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {title ? (
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="m-0 text-xl font-semibold text-[var(--text)]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </header>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">{children}</div>
        </div>
      </FocusTrap>
    </div>,
    document.body,
  );
}
