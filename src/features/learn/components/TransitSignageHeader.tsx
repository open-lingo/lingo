import type { CSSProperties, ReactNode } from "react";

/**
 * The transit-map page header: M roundel + per-character animated title +
 * subtitle, with a right-side slot (view toggle / classic link). Shared by
 * the map view and the list view so the header survives the switch.
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
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-2.5 text-text-primary shadow-card">
      <div
        className="grid h-9 w-9 flex-none place-items-center rounded-full border-2 border-border text-[15px] font-extrabold text-white"
        style={{ background: "var(--tmc-line-main)" }}
      >
        M
      </div>
      <div className="min-w-0 flex-1">
        <h1
          className="text-[17px] font-extrabold leading-tight sm:text-[21px] 2xl:text-[24px]"
          aria-label={title}
        >
          {title.split("").map((ch, i) => (
            <span key={i} className="tmc-title-ch" style={{ "--i": i } as CSSProperties} aria-hidden>
              {/* inline-block spans collapse plain spaces — use NBSP */}
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <div className="text-[12px] text-text-secondary">{subtitle}</div>
      </div>
      {right}
    </div>
  );
}
