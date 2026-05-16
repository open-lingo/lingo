import type { CSSProperties, ReactNode, MouseEvent } from "react";
import { Icon } from "@/shared/components/Icon";
import type { CourseModule } from "@/shared/domain/course";
import type { ModuleStatus } from "../moduleProgress";
import type { ModuleStatusPill } from "../utils/moduleStatusPill";
import "./pathway.css";

export type ModuleCardProps = {
  module: CourseModule;
  moduleNumber: number;
  status: ModuleStatus;
  isOpen: boolean;
  onToggleOpen: () => void;
  statusPill?: ModuleStatusPill;
  pathway?: ReactNode;
  preview?: ReactNode;
  actions?: ReactNode;
};

export function ModuleCard({
  module,
  moduleNumber,
  status,
  isOpen,
  onToggleOpen,
  statusPill,
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
            text: moduleNumber > 0 ? `After Module ${moduleNumber - 1}` : "Locked",
            variant: "locked",
          }
        : { text: "In progress", variant: "progress" };

  const pill = statusPill ?? pillFallback;

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
        <div className="lingo-mnum">M{moduleNumber}</div>
        <div className="min-w-0 flex-1">
          {module.eyebrow ? (
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-90">
              {module.eyebrow}
            </div>
          ) : null}
          <h2 className="m-0 mt-0.5 text-lg font-bold">{module.title}</h2>
          <span className="lingo-status-pill inline-flex items-center gap-1">
            {pill.variant === "locked" ? (
              <Icon name="lock" size={12} className="opacity-90" aria-hidden />
            ) : null}
            {pill.variant === "complete" ? (
              <Icon name="check" size={12} className="opacity-90" aria-hidden />
            ) : null}
            {pill.text}
          </span>
        </div>
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
