import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { Icon } from "@/shared/components/Icon";
import type { CourseModule } from "@/shared/domain/course";
import type { ModuleStatus } from "../moduleProgress";
import type { ModuleStatusPill } from "../utils/moduleStatusPill";
import "./pathway.css";

export type ModuleCardProps = {
  module: CourseModule;
  badgeLabel: string;
  /** "Module N" prerequisite label, or null when this module has no
   *  predecessor. Drives the locked-status fallback pill. */
  gateAfterLabel: string | null;
  status: ModuleStatus;
  isOpen: boolean;
  onToggleOpen: () => void;
  statusPill?: ModuleStatusPill;
  /** Second pill rendered to the right of `statusPill` when the module
   *  is fully mastered (sub-lessons done + every row-test passed
   *  un-skipped). Falsey = no second pill. */
  masteryPill?: ModuleStatusPill;
  pathway?: ReactNode;
  preview?: ReactNode;
  actions?: ReactNode;
};

export function ModuleCard({
  module,
  badgeLabel,
  gateAfterLabel,
  status,
  isOpen,
  onToggleOpen,
  statusPill,
  masteryPill,
  pathway,
  preview,
  actions,
}: ModuleCardProps) {
  const accentStyle: CSSProperties | undefined = module.accent
    ? ({
        ["--m-c1" as never]: module.accent.from,
        ["--m-c2" as never]: module.accent.to,
      } as CSSProperties)
    : undefined;

  const handleBodyClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const pillFallback: ModuleStatusPill =
    status === "completed"
      ? { text: "Complete · 100%", variant: "complete" }
      : status === "locked"
        ? {
            text: gateAfterLabel ? `After ${gateAfterLabel}` : "Locked",
            variant: "locked",
          }
        : { text: "In progress", variant: "progress" };

  const pill = statusPill ?? pillFallback;

  const statusPillNode = (
    <span className="lingo-status-pill">
      {pill.variant === "locked" ? (
        <Icon name="lock" size={12} className="opacity-90" aria-hidden />
      ) : null}
      {pill.variant === "complete" ? (
        <Icon name="check" size={12} className="opacity-90" aria-hidden />
      ) : null}
      {pill.text}
    </span>
  );

  return (
    <article
      id={`learn-module-${module.id}`}
      className="lingo-module-card scroll-mt-24"
      data-state={status}
      data-open={isOpen}
      style={accentStyle}
    >
      <header
        className="lingo-module-head"
        onClick={onToggleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleOpen();
          }
        }}
      >
        <div className="lingo-mnum">{badgeLabel}</div>
        <div className="min-w-0 flex-1">
          {module.eyebrow ? (
            <div className="text-[0.688rem] font-bold uppercase tracking-[0.12em] opacity-90">
              {module.eyebrow}
            </div>
          ) : null}
          <h2 className="m-0 mt-0.5 text-lg font-bold">{module.title}</h2>
          {/* Locked modules render their "After X" pill right-aligned in the
           * header row (see below) — keep the column pills for non-locked
           * states (in-progress / complete + optional mastery pill). */}
          {status !== "locked" ? (
            <div className="lingo-module-pills">
              {statusPillNode}
              {masteryPill ? (
                <span className="lingo-mastery-pill" title={masteryPill.text}>
                  {masteryPill.text}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {status === "locked" ? (
          <div className="ml-auto flex-shrink-0 [&>.lingo-status-pill]:mt-0">
            {statusPillNode}
          </div>
        ) : null}
        <div
          className={`lingo-mchev${isOpen ? " lingo-mchev-open" : ""}`}
          aria-hidden
        >
          <Icon name="chevronDown" size={16} />
        </div>
      </header>
      {isOpen ? (
        <div className="lingo-module-body" onClick={handleBodyClick}>
          {pathway}
          {preview}
          {actions ? <div className="lingo-module-actions">{actions}</div> : null}
        </div>
      ) : null}
    </article>
  );
}
