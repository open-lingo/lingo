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
import { groupModulesByLevel, type FluencyLevel } from "./courseLevels";
import { getItemsForModule } from "@/features/placement/questionBank";

type ViewMode = "detailed" | "simple";

/** Course-level rollup shown in the map header strip. */
type CourseRollup = {
  total: number;
  completed: number;
  percent: number;
  vocabSeen: number;
  vocabTotal: number;
};

/** Per-module derived view-model the map + panel both read from. */
type ModuleNode = {
  index: number;
  module: CourseModule;
  status: ModuleStatus;
  badgeLabel: string;
  isReview: boolean;
  /** 1-indexed content-module number (null for review modules). */
  contentNumber: number | null;
  isCurrent: boolean;
  mastered: boolean;
  lessonCount: number;
  vocabCount: number;
  vocabSamples: VocabSample[];
  milestone: string | null;
  /** Whether the learner can "test out" of this ahead-of module. */
  canTestOut: boolean;
};

const STATUS_DISC: Record<ModuleStatus, string> = {
  completed:
    "border-accent bg-[color-mix(in_srgb,rgb(var(--color-accent))_14%,rgb(var(--color-surface)))] text-accent",
  current:
    "border-accent bg-accent text-white shadow-[0_0_0_6px_color-mix(in_srgb,rgb(var(--color-accent))_22%,transparent)]",
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
      const isCurrent = index === currentIndex;
      // A learner can test out of a module that's ahead of them (not the
      // current module, not already cleared) as long as a placement bank
      // exists for it. The bank existence naturally excludes far-future
      // modules with no authored items.
      const canTestOut =
        status !== "completed" &&
        !isCurrent &&
        !display.isReview &&
        getItemsForModule(module.id, course.languageId).length > 0;
      return {
        index,
        module,
        status,
        badgeLabel: display.badgeLabel,
        isReview: display.isReview,
        contentNumber: display.contentNumber,
        isCurrent,
        mastered: mastery.mastered,
        lessonCount: counts.content,
        vocabCount: vocab.count,
        vocabSamples: vocab.samples,
        milestone: getMilestoneForModule(course.languageId, index),
        canTestOut,
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

  // Course-level rollup — real data, drives the informative header strip.
  const rollup: CourseRollup = useMemo(() => {
    const total = nodes.length;
    const completed = nodes.filter((n) => n.status === "completed").length;
    const vocabTotal = nodes.reduce((sum, n) => sum + n.vocabCount, 0);
    const vocabSeen = nodes
      .filter((n) => n.status === "completed" || n.isCurrent)
      .reduce(
        (sum, n) => sum + (n.status === "completed" ? n.vocabCount : 0),
        0,
      );
    return {
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      vocabSeen,
      vocabTotal,
    };
  }, [nodes]);

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

  const learnHref = langPath("learn");

  return (
    <PageShell variant="wide" spaceY="md">
      <header className="space-y-2">
        <Link
          to={learnHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition hover:text-text-primary"
        >
          <Icon name="arrowLeft" size={16} aria-hidden />
          {t("courseMap.backToLearn", { defaultValue: "Back to Learn" })}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
              {t("courseMap.eyebrow", { defaultValue: "Course map" })}
            </p>
            <h1 className="text-2xl font-bold text-text-primary">
              {t("courseMap.title", {
                defaultValue: "{{course}} — the whole journey",
                course: course.title,
              })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={langPath("learn/placement-test")}>
              <Button variant="ghost" size="sm">
                <Icon name="compass" size={15} aria-hidden />
                {t("courseMap.retakePlacement", {
                  defaultValue: "Retake placement",
                })}
              </Button>
            </Link>
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
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        {/* The map card: selected-module summary pinned on TOP, then the
            flowing node grid below it on the same surface. */}
        <Card padding="none" className="overflow-hidden">
          {selected && (
            <SelectedModuleSummary node={selected} rollup={rollup} view={view} />
          )}
          <CourseMapTrail
            nodes={nodes}
            view={view}
            selectedIndex={selected?.index ?? -1}
            onSelect={setSelectedIndex}
            languageId={course.languageId}
          />
        </Card>

        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected && (
            <ModuleDetailPanel
              node={selected}
              learnHref={learnHref}
              testOutHref={langPath("learn/test-out/" + selected.module.id)}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* ----------------------------------------- selected-module summary (on top) */

/**
 * Pinned summary at the TOP of the map card — reflects the currently selected
 * node so the map and the detail clearly read as one connected surface (the
 * 2026-06-17 feedback: the detail panel read as a disconnected sidebar card).
 * Also carries the course-level rollup so the page is informative at a glance.
 */
function SelectedModuleSummary({
  node,
  rollup,
  view,
}: {
  node: ModuleNode;
  rollup: CourseRollup;
  view: ViewMode;
}) {
  const { t } = useTranslation();
  const { module, status } = node;
  return (
    <div className="border-b border-border bg-surface-muted/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold",
                STATUS_DISC[status],
              ].join(" ")}
            >
              {node.badgeLabel}
            </span>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-accent">
                {t("courseMap.selected", { defaultValue: "Selected module" })}
              </p>
              <h2 className="truncate text-lg font-bold leading-tight text-text-primary">
                {module.title}
              </h2>
            </div>
          </div>
          {module.summary && (
            <p className="max-w-prose text-sm leading-snug text-text-secondary">
              {module.summary}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-text-muted">
            <StatusLine status={status} mastered={node.mastered} />
            <span className="inline-flex items-center gap-1">
              <Icon name="bookOpen" size={13} aria-hidden />
              {t("courseMap.lessonCount", {
                defaultValue: "{{count}} lessons",
                count: node.lessonCount,
              })}
            </span>
            {node.vocabCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="sparkles" size={13} aria-hidden />
                {t("courseMap.vocabCount", {
                  defaultValue: "{{count}} words",
                  count: node.vocabCount,
                })}
              </span>
            )}
          </div>
        </div>

        {/* Course-level rollup — the informative header. */}
        <dl className="flex shrink-0 items-center gap-4 sm:gap-5">
          <div className="text-right">
            <dd className="text-2xl font-extrabold leading-none text-text-primary">
              {rollup.percent}
              <span className="text-base font-bold text-text-muted">%</span>
            </dd>
            <dt className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-text-muted">
              {t("courseMap.rollup.complete", { defaultValue: "Complete" })}
            </dt>
          </div>
          <div className="h-9 w-px bg-border" aria-hidden />
          <div className="text-right">
            <dd className="text-2xl font-extrabold leading-none text-text-primary">
              {rollup.completed}
              <span className="text-base font-bold text-text-muted">
                /{rollup.total}
              </span>
            </dd>
            <dt className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-text-muted">
              {t("courseMap.rollup.modules", { defaultValue: "Modules" })}
            </dt>
          </div>
          {view === "detailed" && rollup.vocabTotal > 0 && (
            <>
              <div className="hidden h-9 w-px bg-border sm:block" aria-hidden />
              <div className="hidden text-right sm:block">
                <dd className="text-2xl font-extrabold leading-none text-text-primary">
                  {rollup.vocabTotal}
                </dd>
                <dt className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-text-muted">
                  {t("courseMap.rollup.words", { defaultValue: "Words" })}
                </dt>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- the trail */

function CourseMapTrail({
  nodes,
  view,
  selectedIndex,
  onSelect,
  languageId,
}: {
  nodes: ModuleNode[];
  view: ViewMode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  languageId: string;
}) {
  return view === "simple" ? (
    <SimpleMap
      nodes={nodes}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
    />
  ) : (
    <DetailedMap
      nodes={nodes}
      selectedIndex={selectedIndex}
      onSelect={onSelect}
      languageId={languageId}
    />
  );
}

/* --------------------------------------------------------- detailed map */

/**
 * Detailed map: nodes grouped under fluency-level section headers (A1, A2…),
 * each carrying a "By the end" outcome so the page answers "where will I be by
 * module X?". Within a level, node cards still flow into a multi-column grid so
 * the whole journey reads as a board at a glance rather than an endless scroll.
 */
function DetailedMap({
  nodes,
  selectedIndex,
  onSelect,
  languageId,
}: {
  nodes: ModuleNode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  languageId: string;
}) {
  const { t } = useTranslation();
  const groups = useMemo(
    () => groupModulesByLevel(languageId, nodes, (n) => n.contentNumber),
    [languageId, nodes],
  );
  return (
    <div className="space-y-6 p-4 sm:p-5">
      {groups.map((group) => (
        <section key={group.level.id} className="space-y-2.5">
          <LevelSectionHeader level={group.level} />
          <ol className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((node) => (
              <CourseMapNode
                key={node.module.id}
                node={node}
                selected={node.index === selectedIndex}
                onSelect={() => onSelect(node.index)}
              />
            ))}
          </ol>
        </section>
      ))}
      {/* Fluency goal — terminus of the journey. */}
      <div className="flex items-center gap-2.5 rounded-card border border-dashed border-border p-3 text-sm font-semibold text-text-muted">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-accent">
          <Icon name="flag" size={16} aria-hidden />
        </span>
        {t("courseMap.fluencyGoal", {
          defaultValue: "Conversational fluency",
        })}
      </div>
    </div>
  );
}

/**
 * Fluency-level section header — CEFR badge + human title + a "By the end"
 * outcome line. This is the answer to "what will I be able to do by the end of
 * this level?" and is the anchor that makes the whole map scannable.
 */
function LevelSectionHeader({ level }: { level: FluencyLevel }) {
  const { t } = useTranslation();
  return (
    <header className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-[color-mix(in_srgb,rgb(var(--color-accent))_14%,rgb(var(--color-surface)))] px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-accent">
        {level.cefr}
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold leading-tight text-text-primary">
          {level.title}
        </h3>
        <p className="mt-0.5 text-xs leading-snug text-text-secondary">
          <span className="font-semibold text-text-muted">
            {t("courseMap.byTheEnd", { defaultValue: "By the end:" })}{" "}
          </span>
          {level.outcome}
        </p>
      </div>
    </header>
  );
}

/* ----------------------------------------------------------- simple map */

/**
 * Simple map: a true minimap. Just numbered discs in a dense wrapped grid —
 * no summaries, no meta badges, no inline milestones. Reads the whole course
 * shape in a few rows. Distinct from Detailed (feedback: "Simple isn't
 * simple"). Milestones collapse to a single dot marker on the disc.
 */
function SimpleMap({
  nodes,
  selectedIndex,
  onSelect,
}: {
  nodes: ModuleNode[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="p-4 sm:p-5">
      <ol className="flex flex-wrap gap-2">
        {nodes.map((node) => {
          const selected = node.index === selectedIndex;
          return (
            <li key={node.module.id}>
              <button
                type="button"
                onClick={() => onSelect(node.index)}
                aria-pressed={selected}
                aria-current={selected ? "true" : undefined}
                title={node.module.title}
                className={[
                  "relative flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-extrabold transition",
                  STATUS_DISC[node.status],
                  selected
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                    : "hover:brightness-105",
                ].join(" ")}
              >
                {node.badgeLabel}
                {node.milestone && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-surface bg-accent"
                  />
                )}
                {node.mastered && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-surface bg-surface text-warning">
                    <Icon name="star" size={9} fill="currentColor" aria-hidden />
                  </span>
                )}
              </button>
            </li>
          );
        })}
        <li className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-border text-accent">
          <Icon name="flag" size={16} aria-hidden />
        </li>
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
        {t("courseMap.simpleMilestoneHint", {
          defaultValue: "Dot marks a milestone module",
        })}
      </p>
    </div>
  );
}

function CourseMapNode({
  node,
  selected,
  onSelect,
}: {
  node: ModuleNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const { module, status, milestone } = node;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-current={selected ? "true" : undefined}
        className={[
          "group flex h-full w-full flex-col gap-2 rounded-card border p-3 text-left transition",
          selected
            ? "border-accent bg-[color-mix(in_srgb,rgb(var(--color-accent))_8%,rgb(var(--color-surface)))] ring-2 ring-accent/40"
            : "border-border hover:border-accent/50 hover:bg-surface-muted",
        ].join(" ")}
      >
        {milestone && (
          <span className="-mt-0.5 flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wide text-accent">
            <Icon name="mapPin" size={11} aria-hidden />
            <span className="truncate">{milestone}</span>
          </span>
        )}
        <span className="flex items-start gap-2.5">
          {/* Disc badge */}
          <span
            className={[
              "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold",
              STATUS_DISC[status],
              node.isCurrent && status !== "completed" ? "animate-pulse" : "",
            ].join(" ")}
          >
            {node.badgeLabel}
            <span
              className={[
                "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-surface",
                status === "completed" ? "text-accent" : "text-text-muted",
              ].join(" ")}
            >
              <StatusBadge status={status} />
            </span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              {node.isCurrent ? (
                <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-accent">
                  {t("courseMap.current", { defaultValue: "You are here" })}
                </span>
              ) : (
                module.eyebrow && (
                  <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-muted">
                    {module.eyebrow}
                  </span>
                )
              )}
              {node.mastered && (
                <Icon
                  name="star"
                  size={11}
                  fill="currentColor"
                  className="text-warning"
                  aria-hidden
                />
              )}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-text-primary">
              {module.title}
            </span>
          </span>
        </span>

        <span className="mt-auto flex flex-wrap gap-1.5">
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
  testOutHref,
}: {
  node: ModuleNode;
  learnHref: string;
  testOutHref: string;
}) {
  const { t } = useTranslation();
  const { module, status } = node;

  return (
    <Card padding="lg" className="space-y-4">
      {/* Echoes the selected node so panel ↔ map read as one selection. */}
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold",
            STATUS_DISC[status],
          ].join(" ")}
        >
          {node.badgeLabel}
        </span>
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-muted">
            {t("courseMap.detailFor", { defaultValue: "Module detail" })}
          </p>
          <h2 className="truncate text-base font-bold leading-tight text-text-primary">
            {module.title}
          </h2>
        </div>
      </div>

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

      <div className="space-y-2">
        <Link to={learnHref} className="block">
          <Button
            variant={status === "locked" ? "outline" : "primary"}
            className="w-full"
          >
            {t("courseMap.goToModule", { defaultValue: "Go to module" })}
            <Icon name="arrowRight" size={16} aria-hidden />
          </Button>
        </Link>
        {node.canTestOut && (
          <Link to={testOutHref} className="block">
            <Button variant="ghost" className="w-full">
              <Icon name="compass" size={16} aria-hidden />
              {t("courseMap.testOut", {
                defaultValue: "Test out of this module",
              })}
            </Button>
          </Link>
        )}
      </div>
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
