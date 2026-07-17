import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "./cn";

type NavCardBase = {
  icon: ReactNode;
  title: string;
  count?: number;
  description?: string;
  variant?: "default" | "primary";
  /** "hero" = full landing card with description; "pill" = compact tab strip variant */
  size?: "hero" | "pill";
  active?: boolean;
  className?: string;
};

type NavCardLink = NavCardBase & {
  to: string;
  onClick?: never;
};

type NavCardButton = NavCardBase & {
  onClick: () => void;
  to?: never;
};

type NavCardProps = NavCardLink | NavCardButton;

const heroBase =
  "group relative flex flex-col gap-2 rounded-card border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const pillBase =
  "group relative inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const defaultVariantClasses =
  "border-border bg-surface text-text-primary hover:border-accent hover:bg-surface-muted";

const primaryVariantClasses =
  "border-accent bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover";

const heroActiveRing = "ring-2 ring-accent ring-offset-2 ring-offset-surface-muted";
const pillActive =
  "border-accent bg-accent-muted text-accent hover:bg-accent-muted hover:border-accent";

export function NavCard(props: NavCardProps) {
  const {
    icon,
    title,
    count,
    description,
    variant = "default",
    size = "hero",
    active = false,
    className,
  } = props;

  const isPrimary = variant === "primary";
  const isPill = size === "pill";

  const composed = cn(
    isPill ? pillBase : heroBase,
    isPrimary ? primaryVariantClasses : defaultVariantClasses,
    active && (isPill ? pillActive : heroActiveRing),
    className,
  );

  const pillBody = (
    <>
      <span
        className={cn(
          "inline-flex h-5 w-5 shrink-0 items-center justify-center",
          isPrimary ? "text-accent-foreground" : "text-accent",
          active && !isPrimary && "text-accent",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="truncate">{title}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
            isPrimary
              ? "bg-accent-foreground/20 text-accent-foreground"
              : active
                ? "bg-accent/15 text-accent"
                : "bg-surface-muted text-text-secondary",
          )}
        >
          {count}
        </span>
      )}
    </>
  );

  const heroBody = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            isPrimary
              ? "bg-accent-foreground/15 text-accent-foreground"
              : "bg-accent-muted text-accent group-hover:bg-accent-muted",
          )}
          aria-hidden
        >
          {icon}
        </span>
        {typeof count === "number" && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              isPrimary
                ? "bg-accent-foreground/20 text-accent-foreground"
                : "bg-surface-muted text-text-secondary",
            )}
          >
            {count}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3
          className={cn(
            "truncate text-base font-semibold",
            isPrimary ? "text-accent-foreground" : "text-text-primary",
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "mt-0.5 line-clamp-2 text-sm",
              isPrimary ? "text-accent-foreground/85" : "text-text-secondary",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </>
  );

  const body = isPill ? pillBody : heroBody;

  if ("to" in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={composed} aria-current={active ? "page" : undefined}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(props as NavCardButton).onClick}
      className={composed}
      aria-pressed={active}
    >
      {body}
    </button>
  );
}
