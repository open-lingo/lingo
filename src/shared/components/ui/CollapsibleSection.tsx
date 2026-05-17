import { useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";
import { cn } from "./cn";

type Props = {
  title: ReactNode;
  /** Optional small badge/count rendered next to the title. */
  trailing?: ReactNode;
  /** Default open state. */
  defaultOpen?: boolean;
  /** Storage key for persisting the open state across reloads. */
  persistKey?: string;
  /**
   * When true, stays collapsible at every breakpoint (desktop bars).
   * When false (default), collapses below `lg` and inlines at `lg+`.
   */
  alwaysCollapsible?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * A section that collapses below `lg` (mobile/tablet) and always renders
 * its children at `lg+`. Use `alwaysCollapsible` to keep the chevron at
 * every breakpoint (for full-width bars on desktop).
 */
export function CollapsibleSection({
  title,
  trailing,
  defaultOpen = false,
  persistKey,
  alwaysCollapsible = false,
  children,
  className,
}: Props) {
  const [open, setOpen] = useState(() => readPersisted(persistKey, defaultOpen));

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      writePersisted(persistKey, next);
      return next;
    });
  }

  return (
    <section className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left shadow-card transition hover:bg-surface-muted active:scale-[0.99]",
          !alwaysCollapsible && "lg:hidden",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text-primary">
          {title}
          {trailing ? <span className="ml-auto">{trailing}</span> : null}
        </span>
        <Icon
          name="chevronDown"
          size={18}
          className={cn(
            "shrink-0 text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          !open && "hidden",
          "mt-2",
          !alwaysCollapsible && "lg:mt-0 lg:block",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function readPersisted(key: string | undefined, fallback: boolean): boolean {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`lingo_collapse_${key}`);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    // ignore
  }
  return fallback;
}

function writePersisted(key: string | undefined, value: boolean): void {
  if (!key || typeof window === "undefined") return;
  try {
    localStorage.setItem(`lingo_collapse_${key}`, value ? "1" : "0");
  } catch {
    // ignore quota
  }
}
