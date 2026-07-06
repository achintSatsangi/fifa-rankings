import { useEffect } from "react";
import { FocusTrap } from "focus-trap-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

const SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
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
          className={`w-full ${SIZES[size]} rounded-lg`}
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
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
              <h2 className="m-0 text-lg font-semibold text-[var(--text)]">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </header>
          ) : null}
          <div className="px-5 py-4">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
}
