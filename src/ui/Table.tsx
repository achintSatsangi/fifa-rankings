import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table {...props} className={`w-full border-collapse text-base ${className}`} />;
}

export function THead({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...props}
      className={`text-[11px] uppercase tracking-wide text-[var(--text-muted)] ${className}`}
    />
  );
}

export function TBody({ className = "", ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className={className} />;
}

export function TR({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={`border-b border-[var(--border-subtle)] last:border-b-0 ${className}`}
    />
  );
}

export function TH({ className = "", align = "left", ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      {...props}
      className={`px-2 py-2.5 font-medium text-${align} ${className}`}
    />
  );
}

export function TD({ className = "", align = "left", ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      {...props}
      className={`px-2 py-2.5 text-${align} ${className}`}
    />
  );
}
