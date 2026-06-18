import { type ReactNode } from "react";
import { cn } from "./cn";

export type EmptyStateProps = {
  /** Optional icon / illustration node at the top. */
  icon?: ReactNode;
  /** Required title. */
  title: string;
  /** Optional supporting description. */
  description?: ReactNode;
  /** Optional primary action (usually a `<Button>`). */
  action?: ReactNode;
  /** Optional secondary action node. */
  secondaryAction?: ReactNode;
  /** Override the wrapper element. Default `div`. */
  as?: "div" | "section";
  className?: string;
};

/**
 * EmptyState — "nothing to show" panel with title + description + optional action.
 *
 * Mobile behavior: collapses gracefully to a centered single column; actions
 * stack vertically when both primary and secondary are present.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  as: Component = "div",
  className,
}: EmptyStateProps) {
  return (
    <Component
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface-muted px-4 py-10 text-center sm:px-8 sm:py-14",
        className,
      )}
    >
      {icon && <div className="text-text-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-text-primary sm:text-lg">{title}</h3>
      {description && (
        <p className="max-w-prose text-sm text-text-secondary">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {action}
          {secondaryAction}
        </div>
      )}
    </Component>
  );
}
