import type { ReactNode } from "react";

/**
 * The learn page header: M roundel + title + subtitle, with a right-side
 * slot (view toggle). Shared by the map (Path) and list views, rendered
 * identically in both so toggling never flickers the header — the title is
 * static text (the per-character entrance animation was dropped 2026-07-17
 * because it replayed on every toggle and read as the header "switching").
 *
 * Unlike the in-map signage (station plates, district modal header — those
 * stay fixed-dark as part of the map art), this page-level header follows
 * the app surface theme like every other floating card.
 */
export function TransitSignageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-border bg-surface px-4 py-2.5 text-text-primary shadow-card">
      <div
        className="grid h-9 w-9 flex-none place-items-center rounded-full border-2 border-border text-[15px] font-bold text-accent-foreground"
        style={{ background: "var(--tmc-line-main)" }}
      >
        M
      </div>
      <div className="min-w-0 flex-1">
        {/* Wraps to two lines on narrow screens rather than truncating: the
            course name is the informative half and it was the half being cut
            ("学習路線図 — …" on a 390px phone). */}
        <h1 className="text-[17px] font-bold leading-tight line-clamp-2 sm:truncate sm:text-[21px] 2xl:text-[24px]">
          {title}
        </h1>
        {/* Hidden on phones: truncated it read as a cut-off sentence, and
            the header already spends a row on the wrapped title there. */}
        <div className="hidden truncate text-[12px] text-text-secondary sm:block">
          {subtitle}
        </div>
      </div>
      {/* Full width on mobile so the toggle drops to its own row instead of
          squeezing the title into ~140px of a 390px viewport. */}
      {right ? <div className="w-full sm:w-auto">{right}</div> : null}
    </div>
  );
}
