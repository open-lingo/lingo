export function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 ${className}`}
    >
      {children}
    </span>
  );
}
