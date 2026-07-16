import type { CSSProperties, ReactNode } from "react";

/**
 * The transit-map signage board: M roundel + per-character animated title +
 * subtitle, with a right-side slot (view toggle / classic link). Shared by
 * the map view and the list view so the header survives the switch.
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
    <div
      className="mb-5 flex flex-wrap items-center gap-4 rounded-md px-5 py-4"
      style={{ background: "var(--tmc-signage-bg)", color: "var(--tmc-signage-fg)" }}
    >
      <div
        className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[18px] font-extrabold"
        style={{ borderColor: "var(--tmc-signage-fg)", background: "var(--tmc-line-main)", color: "#fff" }}
      >
        M
      </div>
      <div className="min-w-0 flex-1">
        <h1
          className="text-[19px] font-extrabold leading-tight sm:text-[24px] 2xl:text-[28px]"
          aria-label={title}
        >
          {title.split("").map((ch, i) => (
            <span key={i} className="tmc-title-ch" style={{ "--i": i } as CSSProperties} aria-hidden>
              {/* inline-block spans collapse plain spaces — use NBSP */}
              {ch === " " ? " " : ch}
            </span>
          ))}
        </h1>
        <div className="text-[12px] opacity-75 2xl:text-[13px]">{subtitle}</div>
      </div>
      {right}
    </div>
  );
}
