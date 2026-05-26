type Variant = "default" | "success" | "warning" | "info" | "hot" | "solved" | "new";

const variants: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
  hot: "bg-orange-100 text-orange-800",
  solved: "bg-emerald-100 text-emerald-800",
  new: "bg-blue-100 text-blue-800",
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
