import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/components/ui/cn";

type EmptyStateAction = {
  label: string;
  to?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text-muted"
          aria-hidden
        >
          {icon}
        </span>
      )}
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-text-secondary">{description}</p>
      )}
      {action &&
        (action.to ? (
          <Link
            to={action.to}
            className="mt-2 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
