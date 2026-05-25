import { cn } from "./cn";

export type SkeletonProps = {
  /** Visual shape preset. Default `rect`. */
  shape?: "rect" | "circle" | "text";
  /** Tailwind width class (e.g. `w-24`, `w-full`). */
  width?: string;
  /** Tailwind height class (e.g. `h-6`, `h-24`). */
  height?: string;
  /** Number of `text` lines (only used when `shape === "text"`). Default 1. */
  lines?: number;
  className?: string;
};

const shimmer =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";

/**
 * Skeleton placeholder with a shimmering gradient. Compose multiple skeletons
 * to outline a loading card or table row.
 *
 * Mobile behavior: lines stack and use `w-full` by default; pass explicit
 * Tailwind width classes to constrain.
 *
 * @example
 *   <Skeleton shape="circle" width="w-10" height="h-10" />
 *   <Skeleton shape="text" lines={3} />
 */
export function Skeleton({
  shape = "rect",
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  if (shape === "text") {
    return (
      <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded bg-surface-muted",
              shimmer,
              width ?? (i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"),
            )}
          />
        ))}
      </div>
    );
  }
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-surface-muted",
        shapeClass,
        shimmer,
        width ?? "w-full",
        height ?? "h-6",
        className,
      )}
    />
  );
}
