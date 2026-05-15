import type { CSSProperties, ReactNode, MouseEvent } from "react";
import type { CourseModule } from "@/shared/domain/course";
import type { ModuleStatus } from "../moduleProgress";
import "./pathway.css";

export type ModuleCardProps = {
  module: CourseModule;
  moduleNumber: number;
  status: ModuleStatus;
  isOpen: boolean;
  onToggleOpen: () => void;
  /** Inline accessory pill (e.g. "5 of 13 lessons", "Finish M1 to unlock"). */
  statusPillText?: string;
  /** Rendered inside .lingo-module-body when status === "current". */
  pathway?: ReactNode;
  /** Rendered inside .lingo-module-body when status === "locked". */
  preview?: ReactNode;
  /** Footer actions (rendered below pathway/preview). */
  actions?: ReactNode;
};

export function ModuleCard({
  module,
  moduleNumber,
  status,
  isOpen,
  onToggleOpen,
  statusPillText,
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
    // Block bubble-up so inner clicks (pathway nodes, action buttons,
    // preview rows) don't collapse the card.
    event.stopPropagation();
  };

  const pillFallback =
    status === "completed"
      ? "✓ Complete · 100%"
      : status === "locked"
        ? moduleNumber > 0
          ? `🔒 After Module ${moduleNumber - 1}`
          : "🔒 Locked"
        : `In progress`;

  return (
    <article
      className="lingo-module-card"
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
        <div className="lingo-mnum">M{moduleNumber}</div>
        <div className="min-w-0 flex-1">
          {module.eyebrow ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-90">
              {module.eyebrow}
            </div>
          ) : null}
          <h2 className="m-0 mt-0.5 text-[18px] font-bold">{module.title}</h2>
          <span className="lingo-status-pill">
            {statusPillText ?? pillFallback}
          </span>
        </div>
        <div className="lingo-mchev" aria-hidden="true">
          ▾
        </div>
      </header>
      {isOpen ? (
        <div className="lingo-module-body" onClick={handleBodyClick}>
          {pathway}
          {preview}
          {actions ? (
            <div className="lingo-module-actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
