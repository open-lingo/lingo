type Variant = "default" | "success" | "warning" | "info" | "hot" | "solved" | "new";

const variants: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  hot: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  solved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
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
