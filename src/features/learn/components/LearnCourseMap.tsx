import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import type { Course, Lesson } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleStatus,
  getNextLessonIndex,
  isLessonLocked,
} from "../moduleProgress";
import { buildModuleStatusPill, buildMasteryPill } from "../utils/moduleStatusPill";
import { getModuleMastery } from "../moduleMastery";
import { ModuleCard } from "./ModuleCard";
import { ModulePathway } from "./ModulePathway";
import { ModulePreview } from "./ModulePreview";
import { ResumeBar } from "./ResumeBar";
import { Button } from "@/shared/components/ui";

export type LearnCourseMapProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  devUnlock: boolean;
  langPath: (path: string) => string;
  isModuleOpen: (moduleId: string) => boolean;
  onToggleModule: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
  onStartOver: () => void;
};

export function LearnCourseMap({
  course,
  completedSet,
  devUnlock,
  langPath,
  isModuleOpen,
  onToggleModule,
  onLessonClick,
  onStartOver,
}: LearnCourseMapProps) {
  const { t } = useTranslation();
  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx] ?? course.modules[0];
  const nextIdx = getNextLessonIndex(currentModule.lessons, completedSet);
  const currentLesson: Lesson | undefined = currentModule.lessons[nextIdx];
  const hasProgress = completedSet.size > 0;

  const [testOutModuleIdx, setTestOutModuleIdx] = useState<number | null>(null);

  const resumeCurrent = () => {
    if (currentLesson) onLessonClick(currentLesson);
  };

  const testOut = (moduleId: string) => {
    const n = course.modules.findIndex((m) => m.id === moduleId);
    setTestOutModuleIdx(n);
  };

  return (
    <section className="min-w-0 pb-4">
      <div className="space-y-0">
        {course.modules.map((mod, i) => {
          const status = getModuleStatus(i, completedSet, course.modules);
          const open = isModuleOpen(mod.id);
          const lessonsDone = mod.lessons.filter((l) => completedSet.has(l.id)).length;
          const pill = buildModuleStatusPill(
            i,
            status,
            lessonsDone,
            mod.lessons.length,
            mod.comingSoon,
          );
          const mastery = mod.comingSoon
            ? null
            : getModuleMastery(mod, completedSet);
          const masteryPill = mastery?.mastered ? buildMasteryPill() : undefined;

          const isCurrent = i === currentIdx;
          const pathway =
            isCurrent ? (
              <ModulePathway
                lessons={mod.lessons}
                completedIds={completedSet}
                currentLessonId={currentLesson?.id}
                isLessonLocked={(id) =>
                  isLessonLocked(id, i, course, completedSet, devUnlock)
                }
                onLessonClick={onLessonClick}
              />
            ) : undefined;

          const preview =
            !isCurrent ? (
              <ModulePreview
                moduleNumber={i}
                summary={mod.summary}
                lessons={mod.lessons}
                comingSoon={mod.comingSoon}
              />
            ) : undefined;

          const actions =
            isCurrent && currentLesson ? (
              <>
                {hasProgress ? (
                  <Button type="button" variant="primary" onClick={resumeCurrent}>
                    {t("learn.resumeLesson", { title: currentLesson.title })}
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => testOut(mod.id)}>
                  {t("learn.testOutModule", { n: i })}
                </Button>
                <p className="lingo-test-out-note basis-full">
                  {t(
                    "learn.testOutNote",
                    "Testing out marks every lesson up to here as complete and jumps you to the next module.",
                  )}
                </p>
                <Link
                  to={langPath("practice/flashcards/review?scope=lessons")}
                  className={composeButtonClasses({
                    variant: "outline",
                    accent: true,
                    className: "basis-full w-full sm:w-auto",
                  })}
                >
                  {t("learn.flashcardsLessonDecksButton")}
                </Link>
              </>
            ) : !isCurrent && !mod.comingSoon ? (
              <Button type="button" variant="secondary" onClick={() => testOut(mod.id)}>
                {t("learn.testOutModule", { n: i })}
              </Button>
            ) : null;

          return (
            <ModuleCard
              key={mod.id}
              module={mod}
              moduleNumber={i}
              status={status}
              isOpen={open}
              onToggleOpen={() => onToggleModule(mod.id)}
              statusPill={pill}
              masteryPill={masteryPill}
              pathway={pathway}
              preview={preview}
              actions={actions}
            />
          );
        })}
      </div>

      {currentLesson ? (
        <ResumeBar
          currentLessonTitle={currentLesson.title}
          currentModuleTitle={currentModule.title}
          onResume={resumeCurrent}
        />
      ) : null}

      <div className="mt-6">
        <button
          type="button"
          onClick={onStartOver}
          className="text-xs font-medium text-text-muted hover:text-text-primary"
        >
          {t("learn.startOver")}
        </button>
      </div>

      {testOutModuleIdx !== null ? (
        <ConfirmModal
          title={t("learn.testOutComingSoonTitle", "Test-out is coming soon")}
          message={t(
            "learn.testOutComingSoonBody",
            "We're building a diagnostic that'll let you skip ahead by passing a quick check. For now, work through the lessons — your progress saves automatically.",
          )}
          cancelLabel={t("learn.testOutComingSoonDismiss", "Got it")}
          confirmLabel={t("learn.testOutComingSoonCta", "Keep learning")}
          onConfirm={() => setTestOutModuleIdx(null)}
          onCancel={() => setTestOutModuleIdx(null)}
        />
      ) : null}
    </section>
  );
}
