import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "./cn";

export type AccordionItemProps = {
  /** Heading content (string or rich node). */
  title: ReactNode;
  /** Optional trailing slot rendered in the header (badge, count, etc.). */
  trailing?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Open by default. */
  defaultOpen?: boolean;
  /** Controlled-open. When provided, `onOpenChange` becomes required. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Visual variant. */
  variant?: "default" | "ghost";
  className?: string;
};

const variantClasses = {
  default: "rounded-lg border border-border bg-surface",
  ghost: "",
} as const;

/**
 * Single collapsible section. Use multiple `AccordionItem`s alongside (or nest
 * inside) another wrapper to compose an accordion group.
 *
 * Mobile behavior: full-width; header tap area is the whole row.
 */
export function AccordionItem({
  title,
  trailing,
  children,
  defaultOpen,
  open: openProp,
  onOpenChange,
  variant = "default",
  className,
}: AccordionItemProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? !!openProp : internalOpen;
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  };
  const id = useId();

  return (
    <div className={cn(variantClasses[variant], className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-surface-muted"
      >
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-text-muted transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
          {title}
        </span>
        {trailing && <span className="ml-2 shrink-0">{trailing}</span>}
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          role="region"
          className="border-t border-border px-4 py-3 text-sm text-text-secondary"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export type AccordionProps = {
  children: ReactNode;
  className?: string;
};

/** Visual grouping for adjacent {@link AccordionItem}s. Pure layout — no state. */
export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>{children}</div>
  );
}
