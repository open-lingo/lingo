import { type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  /** Visual divider between items. Default `border`. */
  divider?: "border" | "none";
  /** Render as `<ol>` with semantic numbered list. */
  ordered?: boolean;
};

/**
 * Vertical list primitive — light wrapper around `<ul>` / `<ol>` with optional
 * dividers between {@link ListItem}s.
 *
 * Mobile behavior: full-width; items stack and dividers run edge-to-edge.
 */
export function List({
  divider = "border",
  ordered,
  className,
  children,
  ...rest
}: ListProps) {
  const Tag: "ul" | "ol" = ordered ? "ol" : "ul";
  return (
    <Tag
      className={cn(
        "flex flex-col rounded-lg border border-border bg-surface",
        divider === "border" && "divide-y divide-border",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export type ListItemProps = LiHTMLAttributes<HTMLLIElement> & {
  /** Optional leading slot (icon, avatar). */
  leading?: ReactNode;
  /** Optional trailing slot (chevron, badge). */
  trailing?: ReactNode;
  /** Optional secondary line below the primary content. */
  description?: ReactNode;
  /** Make the row clickable. */
  interactive?: boolean;
};

/** Single row inside {@link List}. */
export function ListItem({
  leading,
  trailing,
  description,
  interactive,
  className,
  children,
  ...rest
}: ListItemProps) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm text-text-primary",
        interactive && "cursor-pointer transition hover:bg-surface-muted",
        className,
      )}
      {...rest}
    >
      {leading && <span className="shrink-0">{leading}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate">{children}</div>
        {description && (
          <div className="truncate text-xs text-text-muted">{description}</div>
        )}
      </div>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </li>
  );
}
