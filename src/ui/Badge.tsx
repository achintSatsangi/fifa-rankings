import type { HTMLAttributes } from "react";

type Variant = "neutral" | "success" | "warning" | "danger" | "accent";

const VARIANTS: Record<Variant, string> = {
  neutral: "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-subtle)]",
  success: "bg-[color-mix(in_srgb,var(--success)_16%,transparent)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_40%,transparent)]",
  warning: "bg-[color-mix(in_srgb,#c58a00_16%,transparent)] text-[#a06e00] border-[color-mix(in_srgb,#c58a00_40%,transparent)] dark:text-[#e0b04a]",
  danger: "bg-[color-mix(in_srgb,var(--error)_16%,transparent)] text-[var(--error)] border-[color-mix(in_srgb,var(--error)_40%,transparent)]",
  accent: "bg-[var(--accent)] text-[var(--btn-text)] border-[var(--accent)]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { variant?: Variant };

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-none ${VARIANTS[variant]} ${className}`}
    />
  );
}
