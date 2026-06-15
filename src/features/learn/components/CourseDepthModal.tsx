import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import type { Course, CourseModule } from "@/shared/domain/course";
import { getModuleMastery } from "../moduleMastery";
import { getModuleVocab, type ModuleVocabEntry } from "../moduleVocab";

export type CourseDepthModalProps = {
  open: boolean;
  onClose: () => void;
  course: Course;
  completedSet: ReadonlySet<string>;
};

type ModuleStatus = "mastered" | "in-progress" | "locked";

type ModuleRow = {
  module: CourseModule;
  number: number;
  lessonsDone: number;
  lessonsTotal: number;
  pct: number;
  status: ModuleStatus;
  vocab: ModuleVocabEntry[];
};

/** How many sample words to preview inline before "+N more". */
const SAMPLE_WORDS = 6;

function statusFor(
  module: CourseModule,
  completedSet: ReadonlySet<string>,
): ModuleStatus {
  if (module.comingSoon) return "locked";
  const { mastered } = getModuleMastery(module, completedSet);
  if (mastered) return "mastered";
  return "in-progress";
}

/**
 * "Explore the full course" depth view. Lists every module with real data:
 * lesson counts, mastery state, lessons-completed % as a progress proxy, and
 * the genuine vocabulary the module introduces (from the curriculum atom
 * catalog). No fabricated levels — only what the data supports.
 */
export function CourseDepthModal({
  open,
  onClose,
  course,
  completedSet,
}: CourseDepthModalProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<ModuleRow[]>(() => {
    return course.modules.map((module, idx) => {
      const lessonsTotal = module.lessons.length;
      const lessonsDone = module.lessons.filter((l) =>
        completedSet.has(l.id),
      ).length;
      const pct =
        lessonsTotal > 0 ? Math.round((lessonsDone / lessonsTotal) * 100) : 0;
      return {
        module,
        number: idx,
        lessonsDone,
        lessonsTotal,
        pct,
        status: statusFor(module, completedSet),
        vocab: getModuleVocab(course.languageId, module.id),
      };
    });
  }, [course.modules, course.languageId, completedSet]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="3xl"
      title={t("learn.tools.depth.title", {
        defaultValue: "Explore the full course",
      })}
      subtitle={t("learn.tools.depth.subtitle", {
        defaultValue: "{{count}} modules · everything you'll learn",
        count: rows.length,
      })}
    >
      <ol className="space-y-2.5">
        {rows.map((row) => (
          <DepthRow
            key={row.module.id}
            row={row}
            expanded={expanded === row.module.id}
            onToggle={() =>
              setExpanded((cur) =>
                cur === row.module.id ? null : row.module.id,
              )
            }
          />
        ))}
      </ol>
    </Modal>
  );
}

function StatusBadge({ status }: { status: ModuleStatus }) {
  const { t } = useTranslation();
  if (status === "mastered") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[0.65rem] font-semibold text-success">
        <Icon name="trophy" size={12} aria-hidden />
        {t("learn.tools.depth.statusMastered", { defaultValue: "Mastered" })}
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[0.65rem] font-semibold text-text-muted">
        <Icon name="lock" size={12} aria-hidden />
        {t("learn.tools.depth.statusLocked", { defaultValue: "Coming soon" })}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[0.65rem] font-semibold text-accent">
      <Icon name="compass" size={12} aria-hidden />
      {t("learn.tools.depth.statusInProgress", {
        defaultValue: "In progress",
      })}
    </span>
  );
}

function DepthRow({
  row,
  expanded,
  onToggle,
}: {
  row: ModuleRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { module, number, lessonsDone, lessonsTotal, pct, status, vocab } = row;
  const sampleWords = expanded ? vocab : vocab.slice(0, SAMPLE_WORDS);
  const moreWords = vocab.length - sampleWords.length;

  return (
    <li className="rounded-lg border border-border bg-surface-muted/30">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-surface-muted/60"
      >
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent tabular-nums">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {module.eyebrow ? (
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted">
                {module.eyebrow}
              </span>
            ) : null}
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {module.title}
          </p>
          {module.summary ? (
            <p className="mt-0.5 text-xs text-text-muted">{module.summary}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="bookOpen" size={12} aria-hidden />
              {t("learn.tools.depth.lessons", {
                defaultValue: "{{done}}/{{total}} lessons",
                done: lessonsDone,
                total: lessonsTotal,
              })}
            </span>
            {vocab.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="library" size={12} aria-hidden />
                {t("learn.tools.depth.words", {
                  defaultValue: "{{count}} words",
                  count: vocab.length,
                })}
              </span>
            ) : null}
          </div>

          {/* Lessons-completed % as an honest progress proxy. */}
          {lessonsTotal > 0 && !module.comingSoon ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    status === "mastered" ? "bg-success" : "bg-accent",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right text-[0.7rem] font-semibold tabular-nums text-text-muted">
                {pct}%
              </span>
            </div>
          ) : null}

          {sampleWords.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sampleWords.map((w) => (
                <span
                  key={`${w.label}-${w.meaning}`}
                  className="inline-flex items-baseline gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[0.7rem]"
                  title={w.meaning}
                >
                  <span className="font-semibold text-text-primary">
                    {w.label}
                  </span>
                  <span className="text-text-muted">{w.meaning}</span>
                </span>
              ))}
              {moreWords > 0 ? (
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium text-accent">
                  {t("learn.tools.depth.moreWords", {
                    defaultValue: "+{{count}} more",
                    count: moreWords,
                  })}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <Icon
          name={expanded ? "chevronUp" : "chevronDown"}
          size={16}
          className="mt-1 shrink-0 text-text-muted"
          aria-hidden
        />
      </button>
    </li>
  );
}
