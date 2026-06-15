import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getMockCourse } from "@/shared/domain/mockCourse";
import type { Course, CourseModule } from "@/shared/domain/course";
import { PageShell } from "@/shared/components/PageShell";
import { Card, Button, SegmentedControl } from "@/shared/components/ui";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/Icon";
import { useCompletedLessonIds } from "./hooks/useCompletedLessonIds";
import {
  getModuleStatus,
  getCurrentModuleIndex,
  getModuleDisplay,
  type ModuleStatus,
} from "./moduleProgress";
import { getModuleMastery } from "./moduleMastery";
import {
  getModuleLessonCounts,
  getModuleVocab,
  getMilestoneForModule,
  type VocabSample,
} from "./courseMapData";

type ViewMode = "detailed" | "simple";

/** Per-module derived view-model the map + panel both read from. */
type ModuleNode = {
  index: number;
  module: CourseModule;
  status: ModuleStatus;
  badgeLabel: string;
  isReview: boolean;
  isCurrent: boolean;
  mastered: boolean;
  lessonCount: number;
  vocabCount: number;
  vocabSamples: VocabSample[];
  milestone: string | null;
};

const STATUS_DISC: Record<ModuleStatus, string> = {
  completed:
    "border-accent bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-surface))] text-accent",
  current:
    "border-accent bg-accent text-white shadow-[0_0_0_6px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]",
  locked: "border-border bg-surface-muted text-text-muted",
};

function StatusBadge({ status }: { status: ModuleStatus }) {
  if (status === "completed")
    return <Icon name="check" size={13} aria-hidden />;
  if (status === "locked") return <Icon name="lock" size={12} aria-hidden />;
  return <Icon name="circle" size={10} aria-hidden />;
}

export function CourseMapPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const completedIds = useCompletedLessonIds();

  const course: Course | null = language ? getMockCourse(language.id) : null;
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const currentIndex = useMemo(
    () => (course ? getCurrentModuleIndex(course, completedSet) : 0),
    [course, completedSet],
  );

  const nodes: ModuleNode[] = useMemo(() => {
    if (!course) return [];
    return course.modules.map((module, index) => {
      const status = getModuleStatus(index, completedSet, course.modules);
      const display = getModuleDisplay(course.modules, index);
      const mastery = getModuleMastery(module, completedSet);
      const counts = getModuleLessonCounts(module);
      const vocab = getModuleVocab(module, course.languageId);
      return {
        index,
        module,
        status,
        badgeLabel: display.badgeLabel,
        isReview: display.isReview,
        isCurrent: index === currentIndex,
        mastered: mastery.mastered,
        lessonCount: counts.content,
        vocabCount: vocab.count,
        vocabSamples: vocab.samples,
        milestone: getMilestoneForModule(course.languageId, index),
      };
    });
  }, [course, completedSet, currentIndex]);

  const [view, setView] = useState<ViewMode>("detailed");
  const [selectedIndex, setSelectedIndex] = useState<number>(currentIndex);

  // Keep selection valid + defaulted to the current module on first paint /
  // when the course changes.
  const selected =
    nodes.find((n) => n.index === selectedIndex) ??
    nodes.find((n) => n.index === currentIndex) ??
    nodes[0];

  if (!course) {
    return (
      <PageShell variant="wide" spaceY="md">
        <EmptyState
          icon={<Icon name="compass" size={28} aria-hidden />}
          title={t("courseMap.noLanguage.title", {
            defaultValue: "Choose a language first",
          })}
          description={t("courseMap.noLanguage.body", {
            defaultValue:
              "Pick a learning language in Settings to explore its course map.",
          })}
          action={
            <Link to="/settings">
              <Button variant="primary">
                {t("common.settings", { defaultValue: "Settings" })}
              </Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell variant="wide" spaceY="md">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
          {t("courseMap.eyebrow", { defaultValue: "Course map" })}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            {t("courseMap.title", {
              defaultValue: "{{course}} — the whole journey",
              course: course.title,
            })}
          </h1>
          <SegmentedControl<ViewMode>
            ariaLabel={t("courseMap.view.label", {
              defaultValue: "Map detail level",
            })}
            value={view}
            onChange={setView}
            size="sm"
            options={[
              {
                value: "detailed",
                label: t("courseMap.view.detailed", {
                  defaultValue: "Detailed",
                }),
              },
              {
                value: "simple",
                label: t("courseMap.view.simple", { defaultValue: "Simple" }),
              },
            ]}
          />
        </div>
        <p className="max-w-2xl text-sm text-text-secondary">
          {t("courseMap.subtitle", {
            defaultValue:
              "Every module from your first sounds to holding a conversation. Follow the arrow — pick a module to see what it teaches.",
          })}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CourseMapTrail
          nodes={nodes}
          view={view}
          selectedIndex={selected?.index ?? -1}
          onSelect={setSelectedIndex}
        />
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected && (
            <ModuleDetailPanel node={selected} learnHref={langPath("learn")} />
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* --------------------------------------------------------------- the trail */

function CourseMapTrail({
  nodes,
  view,
  selectedIndex,
  onSelect,
}: {
  nodes: ModuleNode[];
  view: ViewMode;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card padding="lg" className="overflow-hidden">
      <ol className="relative space-y-3">
        {/* The fluency arrow — a continuous vertical line behind the nodes. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-[1.4375rem] top-3 w-0.5 bg-gradient-to-b from-accent/60 via-border to-border"
        />
        {nodes.map((node) => (
          <CourseMapNode
            key={node.module.id}
            node={node}
            view={view}
            selected={node.index === selectedIndex}
            onSelect={() => onSelect(node.index)}
          />
        ))}
        {/* Fluency arrowhead — terminus of the line. */}
        <li className="relative flex items-center gap-3 pl-1 pt-1 text-sm font-medium text-text-muted">
          <span className="flex h-12 w-12 items-center justify-center">
            <Icon name="flag" size={18} aria-hidden />
          </span>
          {t("courseMap.fluencyGoal", {
            defaultValue: "Conversational fluency",
          })}
        </li>
      </ol>
    </Card>
  );
}

function CourseMapNode({
  node,
  view,
  selected,
  onSelect,
}: {
  node: ModuleNode;
  view: ViewMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { module, status, milestone } = node;
  const detailed = view === "detailed";

  return (
    <li className="relative">
      {milestone && (
        <div className="mb-2 flex items-center gap-2 pl-[3.75rem] text-xs font-semibold text-accent">
          <Icon name="mapPin" size={13} aria-hidden />
          <span>{milestone}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={[
          "group flex w-full items-start gap-3 rounded-card border p-3 text-left transition",
          selected
            ? "border-accent bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))]"
            : "border-transparent hover:border-border hover:bg-surface-muted",
        ].join(" ")}
      >
        {/* Disc badge */}
        <span
          className={[
            "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold",
            STATUS_DISC[status],
            node.isCurrent && status !== "completed" ? "animate-pulse" : "",
          ].join(" ")}
        >
          {node.badgeLabel}
          <span
            className={[
              "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-surface",
              status === "completed" ? "text-accent" : "text-text-muted",
            ].join(" ")}
          >
            <StatusBadge status={status} />
          </span>
        </span>

        {/* Title + (detailed) annotations */}
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="flex flex-wrap items-center gap-2">
            {module.eyebrow && (
              <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-muted">
                {module.eyebrow}
              </span>
            )}
            {node.isCurrent && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-accent">
                {t("courseMap.current", { defaultValue: "You are here" })}
              </span>
            )}
            {node.mastered && (
              <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wide text-warning">
                <Icon name="star" size={11} fill="currentColor" aria-hidden />
                {t("courseMap.mastered", { defaultValue: "Mastered" })}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate font-semibold text-text-primary">
            {module.title}
          </span>
          {detailed && (
            <>
              {module.summary && (
                <span className="mt-1 block text-xs leading-snug text-text-secondary">
                  {module.summary}
                </span>
              )}
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                <MetaBadge
                  icon="bookOpen"
                  label={t("courseMap.lessonCount", {
                    defaultValue: "{{count}} lessons",
                    count: node.lessonCount,
                  })}
                />
                {node.vocabCount > 0 && (
                  <MetaBadge
                    icon="sparkles"
                    label={t("courseMap.vocabCount", {
                      defaultValue: "{{count}} words",
                      count: node.vocabCount,
                    })}
                  />
                )}
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

function MetaBadge({
  icon,
  label,
}: {
  icon: "bookOpen" | "sparkles";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-medium text-text-secondary">
      <Icon name={icon} size={11} aria-hidden />
      {label}
    </span>
  );
}

/* ---------------------------------------------------------- detail panel */

function ModuleDetailPanel({
  node,
  learnHref,
}: {
  node: ModuleNode;
  learnHref: string;
}) {
  const { t } = useTranslation();
  const { module, status } = node;

  return (
    <Card padding="lg" className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-accent">
            {node.badgeLabel}
          </span>
          {module.eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              {module.eyebrow}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-text-primary">{module.title}</h2>
        <StatusLine status={status} mastered={node.mastered} />
      </div>

      {module.summary && (
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("courseMap.whatYouLearn", { defaultValue: "What you learn" })}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {module.summary}
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-2">
        <Stat
          label={t("courseMap.lessonsLabel", { defaultValue: "Lessons" })}
          value={String(node.lessonCount)}
        />
        <Stat
          label={t("courseMap.vocabLabel", { defaultValue: "New words" })}
          value={String(node.vocabCount)}
        />
      </dl>

      {node.vocabSamples.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {t("courseMap.vocabIntroduced", {
              defaultValue: "Vocabulary introduced",
            })}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {node.vocabSamples.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-border bg-surface-muted px-2 py-1 text-xs"
                title={s.meaning}
              >
                <span className="font-semibold text-text-primary">
                  {s.surface}
                </span>
                <span className="ml-1.5 text-text-muted">{s.meaning}</span>
              </li>
            ))}
          </ul>
          {node.vocabCount > node.vocabSamples.length && (
            <p className="mt-1.5 text-xs text-text-muted">
              {t("courseMap.vocabMore", {
                defaultValue: "+{{count}} more",
                count: node.vocabCount - node.vocabSamples.length,
              })}
            </p>
          )}
        </div>
      )}

      <Link to={learnHref} className="block">
        <Button
          variant={status === "locked" ? "outline" : "primary"}
          className="w-full"
        >
          {t("courseMap.goToModule", { defaultValue: "Go to module" })}
          <Icon name="arrowRight" size={16} aria-hidden />
        </Button>
      </Link>
    </Card>
  );
}

function StatusLine({
  status,
  mastered,
}: {
  status: ModuleStatus;
  mastered: boolean;
}) {
  const { t } = useTranslation();
  if (mastered) {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-warning">
        <Icon name="star" size={14} fill="currentColor" aria-hidden />
        {t("courseMap.status.mastered", { defaultValue: "Mastered" })}
      </p>
    );
  }
  if (status === "completed") {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
        <Icon name="check" size={14} aria-hidden />
        {t("courseMap.status.completed", { defaultValue: "Completed" })}
      </p>
    );
  }
  if (status === "current") {
    return (
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
        <Icon name="circle" size={11} aria-hidden />
        {t("courseMap.status.current", { defaultValue: "In progress" })}
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted">
      <Icon name="lock" size={13} aria-hidden />
      {t("courseMap.status.locked", { defaultValue: "Locked" })}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
      <dt className="text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="text-lg font-bold text-text-primary">{value}</dd>
    </div>
  );
}

export default CourseMapPage;
