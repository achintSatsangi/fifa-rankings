export function Trophy({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute z-10 select-none"
      style={{
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M17 4h3v2a3 3 0 0 1-3 3" />
        <path d="M7 4H4v2a3 3 0 0 0 3 3" />
      </svg>
    </span>
  );
}
