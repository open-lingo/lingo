import type { ReactNode } from "react";
import { cn } from "@/shared/components/ui/cn";

/**
 * Shared layout primitives for the Settings modal so every panel reads as one
 * designed surface: a section is a titled group; a row is a labeled control.
 *
 * Hierarchy (largest → smallest weight):
 *   SectionHeader.title  — semibold, text-primary
 *   SectionHeader.desc   — sm, text-secondary
 *   SettingRow.label     — medium, text-primary
 *   SettingRow.help      — sm, text-muted
 */

/** Section title + one-line description. Anchors the top of each panel. */
export function SectionHeader({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description ? (
        <p className="text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A grouped block of settings under an optional sub-label. Provides the
 * consistent vertical rhythm + a hairline divider between rows.
 */
export function SettingsGroup({
  label,
  children,
  className,
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {label ? (
        <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </h4>
      ) : null}
      <div className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border bg-surface">
        {children}
      </div>
    </section>
  );
}

type SettingRowProps = {
  /** Optional id wired to a control's htmlFor for a11y. */
  htmlFor?: string;
  label: ReactNode;
  help?: ReactNode;
  /** The control (Switch / Select / Slider / button). */
  control?: ReactNode;
  /**
   * When true, the control drops below the label instead of sitting to the
   * right. Use for wide controls (selects, sliders, multi-chip pickers).
   */
  stacked?: boolean;
  className?: string;
  /** Render the whole row as a <label> so clicking the label hits the control. */
  asLabel?: boolean;
};

/**
 * One setting: label + helper text on the left, control on the right (or below
 * when `stacked`). Consistent padding gives the panels their shared rhythm.
 */
export function SettingRow({
  htmlFor,
  label,
  help,
  control,
  stacked = false,
  className,
  asLabel = false,
}: SettingRowProps) {
  const text = (
    <div className="min-w-0 space-y-0.5">
      <div className="text-sm font-medium text-text-primary">{label}</div>
      {help ? (
        <p className="text-sm leading-snug text-text-muted">{help}</p>
      ) : null}
    </div>
  );

  const Wrapper = asLabel ? "label" : "div";

  if (stacked) {
    return (
      <Wrapper
        htmlFor={asLabel ? undefined : htmlFor}
        className={cn(
          "block space-y-3 px-4 py-3.5",
          asLabel && "cursor-pointer",
          className,
        )}
      >
        {text}
        {control ? <div>{control}</div> : null}
      </Wrapper>
    );
  }

  return (
    <Wrapper
      htmlFor={asLabel ? undefined : htmlFor}
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-3.5",
        asLabel && "cursor-pointer",
        className,
      )}
    >
      {text}
      {control ? <div className="shrink-0">{control}</div> : null}
    </Wrapper>
  );
}
