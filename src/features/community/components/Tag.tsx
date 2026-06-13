export function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded bg-surface-muted px-2 py-0.5 text-xs text-text-secondary ${className}`}
    >
      {children}
    </span>
  );
}
