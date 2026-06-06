import { User } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "./cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export type AvatarProps = {
  /** Image URL. When omitted, falls back to initials / icon. */
  src?: string | null;
  /** Accessible alt text — also drives initials when no `name`. */
  alt?: string;
  /** Optional display name to derive initials from when `src` is missing. */
  name?: string;
  size?: AvatarSize;
  /** Render shape. Default `circle`. */
  shape?: "circle" | "square";
  /** Fallback icon node (used when no name, no src). */
  fallback?: ReactNode;
  className?: string;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase();
}

/**
 * User avatar — image with graceful fallback to initials, then icon.
 *
 * Mobile behavior: stable; pick the smallest size token that satisfies your
 * tap-target needs.
 */
export function Avatar({
  src,
  alt,
  name,
  size = "md",
  shape = "circle",
  fallback,
  className,
}: AvatarProps) {
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-md";
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? ""}
        loading="lazy"
        decoding="async"
        className={cn(
          "inline-block shrink-0 object-cover ring-1 ring-border",
          sizeClasses[size],
          shapeClass,
          className,
        )}
      />
    );
  }
  const initials = name ? initialsOf(name) : "";
  return (
    <span
      role="img"
      aria-label={alt ?? name ?? "Avatar"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-surface-muted font-semibold text-text-secondary",
        sizeClasses[size],
        shapeClass,
        className,
      )}
    >
      {initials || fallback || <User size={16} />}
    </span>
  );
}
