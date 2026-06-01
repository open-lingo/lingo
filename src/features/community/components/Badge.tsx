type Variant = "default" | "success" | "warning" | "info" | "hot" | "solved" | "new";

const variants: Record<Variant, string> = {
  default: "bg-surface-muted text-text-secondary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-accent-muted text-accent",
  hot: "bg-warning/10 text-warning",
  solved: "bg-success/10 text-success",
  new: "bg-accent-muted text-accent",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
