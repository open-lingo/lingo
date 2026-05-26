export function Avatar({
  name,
  src,
  size = "sm",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
  };
  const initial = name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600 ${sizeClasses[size]} ${className}`}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initial || "?"
      )}
    </div>
  );
}
