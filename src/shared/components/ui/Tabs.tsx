import { Link } from "react-router-dom";
import { type ReactNode } from "react";
import { cn } from "./cn";

type TabListProps = {
  children: ReactNode;
  "aria-label"?: string;
  /** Visual variant. `underline` (default) draws a bottom border under the active tab. `pill` uses chip-style buttons. */
  variant?: "underline" | "pill";
  /** Wrap on overflow. By default tabs scroll horizontally on mobile (a more durable mobile pattern). */
  wrap?: boolean;
  className?: string;
};

/**
 * Tab strip. Compose with {@link TabLink} (router-driven) or {@link TabButton}
 * (controlled).
 *
 * Mobile behavior: horizontal scroll by default (touch-friendly carousel of
 * tabs). Pass `wrap` to force wrap-to-next-line.
 */
export function TabList({
  children,
  "aria-label": ariaLabel,
  variant = "underline",
  wrap,
  className,
}: TabListProps) {
  return (
    <nav
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1",
        variant === "underline" && "border-b border-border",
        wrap ? "flex-wrap" : "no-scrollbar overflow-x-auto whitespace-nowrap",
        className,
      )}
    >
      {children}
    </nav>
  );
}

type TabLinkProps = {
  to: string;
  isActive: boolean;
  children: ReactNode;
  variant?: "underline" | "pill";
  className?: string;
};

/** Router-aware tab. Hand it `isActive` (use `useLocation` or `useMatch`). */
export function TabLink({
  to,
  isActive,
  children,
  variant = "underline",
  className,
}: TabLinkProps) {
  return (
    <Link
      to={to}
      role="tab"
      aria-selected={isActive}
      className={cn(
        tabBaseClass(variant, isActive),
        className,
      )}
    >
      {children}
    </Link>
  );
}

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
  variant?: "underline" | "pill";
  className?: string;
};

/** Stateless / controlled button-style tab. */
export function TabButton({
  isActive,
  onClick,
  children,
  variant = "underline",
  className,
}: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        tabBaseClass(variant, isActive),
        className,
      )}
    >
      {children}
    </button>
  );
}

function tabBaseClass(variant: "underline" | "pill", isActive: boolean): string {
  if (variant === "pill") {
    return cn(
      "rounded-full px-3 py-1.5 text-sm font-medium transition",
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
    );
  }
  return cn(
    "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
    isActive
      ? "border-accent text-accent"
      : "border-transparent text-text-secondary hover:border-border hover:text-text-primary",
  );
}
