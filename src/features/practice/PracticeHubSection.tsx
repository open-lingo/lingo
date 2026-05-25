import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { CARD_SURFACE_CLASSES } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import type { IconName } from "@/shared/iconRegistry";

export type HubQuickLink =
  | { kind: "link"; to: string; label: string; emphasis?: "accent" }
  | { kind: "soon"; label: string }
  | { kind: "empty" };

function padQuickLinksToFour(links: HubQuickLink[]): HubQuickLink[] {
  const out = links.slice(0, 4);
  while (out.length < 4) {
    out.push({ kind: "empty" });
  }
  return out;
}

function QuickTile({
  q,
  slotKey,
}: {
  q: HubQuickLink;
  slotKey: string;
}) {
  if (q.kind === "empty") {
    return (
      <li
        key={slotKey}
        className="min-h-[4.5rem] rounded-lg border border-border/40 bg-surface-muted/30 sm:min-h-[5.25rem]"
        aria-hidden
      />
    );
  }
  if (q.kind === "soon") {
    return (
      <li key={slotKey}>
        <span
          className={cn(
            "flex min-h-[4.5rem] h-full cursor-not-allowed flex-col items-stretch justify-center rounded-lg border border-dashed border-border px-2 py-2.5 text-center sm:min-h-[5.25rem] sm:px-2.5 sm:py-3",
            "text-[11px] font-medium leading-snug text-text-muted sm:text-xs",
            "break-words [overflow-wrap:anywhere] hyphens-auto",
          )}
          aria-disabled
        >
          {q.label}
        </span>
      </li>
    );
  }
  return (
    <li key={slotKey} className="min-h-0">
      <Link
        to={q.to}
        className={cn(
          "flex min-h-[4.5rem] h-full flex-col items-stretch justify-center rounded-lg border px-2 py-2.5 text-center transition sm:min-h-[5.25rem] sm:px-2.5 sm:py-3",
          "text-[11px] font-semibold leading-snug sm:text-xs",
          "break-words [overflow-wrap:anywhere] hyphens-auto",
          q.emphasis === "accent"
            ? "border-accent bg-accent-muted text-accent hover:bg-accent hover:text-accent-foreground"
            : "border-border bg-surface-muted text-text-primary hover:border-border-muted hover:bg-surface",
        )}
      >
        {q.label}
      </Link>
    </li>
  );
}

export function PracticeHubSection({
  iconName,
  title,
  subtitle,
  primaryTo,
  primaryLabel,
  quickLinks,
  ariaLabelledBy,
}: {
  iconName: IconName;
  title: string;
  subtitle?: string;
  primaryTo: string;
  primaryLabel: string;
  quickLinks: HubQuickLink[];
  ariaLabelledBy: string;
}) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const gridFour = padQuickLinksToFour(quickLinks);
  const overflow = quickLinks.slice(4);

  return (
    <section
      className={cn(CARD_SURFACE_CLASSES.default, "overflow-hidden p-3 sm:p-4")}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        className={cn(
          "grid gap-3 sm:gap-4 md:grid-cols-2 md:items-stretch md:gap-5",
          isRtl && "md:[direction:rtl]",
        )}
      >
        <Link
          to={primaryTo}
          className={cn(
            CARD_SURFACE_CLASSES.muted,
            "flex min-h-[10.5rem] flex-col rounded-xl border border-border p-4 transition hover:border-border-muted hover:shadow-sm sm:min-h-[11.5rem] sm:p-5",
            "min-w-0 [overflow-wrap:anywhere]",
          )}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-primary"
            aria-hidden
          >
            <Icon name={iconName} size={24} />
          </span>
          <h2
            id={ariaLabelledBy}
            className="mt-3 text-balance text-lg font-semibold leading-tight text-text-primary sm:text-xl"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1.5 text-pretty text-xs leading-snug text-text-secondary sm:text-sm">{subtitle}</p>
          ) : null}
          <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-accent sm:text-base">
            {primaryLabel}
            <Icon name="arrowBigRight" size={18} className="shrink-0 opacity-90 rtl:rotate-180" aria-hidden />
          </span>
        </Link>

        <div className="flex min-w-0 flex-col gap-2">
          <ul className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5">
            {gridFour.map((q, i) => (
              <QuickTile key={`slot-${i}`} q={q} slotKey={`slot-${i}-${q.kind === "link" ? q.to : q.kind}`} />
            ))}
          </ul>
          {overflow.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 border-t border-border pt-2 md:pt-2.5">
              {overflow.map((q, i) =>
                q.kind === "link" ? (
                  <li key={`ov-${q.to}-${i}`}>
                    <Link
                      to={q.to}
                      className="inline-block max-w-full rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium leading-snug text-text-primary hover:bg-surface sm:text-xs"
                    >
                      <span className="break-words [overflow-wrap:anywhere]">{q.label}</span>
                    </Link>
                  </li>
                ) : q.kind === "soon" ? (
                  <li key={`ov-soon-${i}`}>
                    <span className="inline-block max-w-full rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-text-muted sm:text-xs">
                      {q.label}
                    </span>
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function PracticeHubJumpCard({
  to,
  iconName,
  title,
  subtitle,
  footerLabel,
}: {
  to: string;
  iconName: IconName;
  title: string;
  subtitle?: string;
  footerLabel: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        CARD_SURFACE_CLASSES.default,
        "flex min-h-[5.25rem] flex-col justify-between rounded-xl border-l-[3px] border-l-accent p-3 transition hover:shadow-md sm:min-h-[5.5rem] sm:p-3.5",
        "min-w-0 [overflow-wrap:anywhere]",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-primary"
          aria-hidden
        >
          <Icon name={iconName} size={20} />
        </span>
        <div className="min-w-0">
          <span className="block text-pretty text-sm font-semibold leading-tight text-text-primary">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-secondary">{subtitle}</span>
          ) : null}
        </div>
      </div>
      <span className="mt-1.5 text-[11px] font-medium text-accent">{footerLabel}</span>
    </Link>
  );
}
