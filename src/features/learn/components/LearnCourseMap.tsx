import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import type { Course, Lesson } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleDisplay,
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

/**
 * Feature flag — test-out (diagnostic skip-ahead) is live. Buttons route
 * to ``/learn/test-out/:moduleId`` which uses the adaptive placement
 * engine to probe the module; on pass, ``applyPlacementResult`` marks
 * every lesson up to and including that module complete locally and
 * ``syncTestOutToServer`` mirrors the same completions to /progress/
 * lessons/batch so the state travels with the user across devices.
 * Flip to false if a regression makes the buttons unsafe to render.
 */
const TEST_OUT_ENABLED = true;

export type LearnCourseMapProps = {
  course: Course;
  completedSet: ReadonlySet<string>;
  devUnlock: boolean;
  langPath: (path: string) => string;
  isModuleOpen: (moduleId: string) => boolean;
  onToggleModule: (moduleId: string) => void;
  onLessonClick: (lesson: Lesson) => void;
};

export function LearnCourseMap({
  course,
  completedSet,
  devUnlock,
  langPath,
  isModuleOpen,
  onToggleModule,
  onLessonClick,
}: LearnCourseMapProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentIdx = getCurrentModuleIndex(course, completedSet);
  const currentModule = course.modules[currentIdx] ?? course.modules[0];
  const nextIdx = getNextLessonIndex(currentModule.lessons, completedSet);
  const currentLesson: Lesson | undefined = currentModule.lessons[nextIdx];
  const hasProgress = completedSet.size > 0;

  const resumeCurrent = () => {
    if (currentLesson) onLessonClick(currentLesson);
  };

  return (
    <section className="min-w-0 pb-4">
      <div className="space-y-0">
        {course.modules.map((mod, i) => {
          const status = getModuleStatus(i, completedSet, course.modules);
          const open = isModuleOpen(mod.id);
          const lessonsDone = mod.lessons.filter((l) => completedSet.has(l.id)).length;
          const display = getModuleDisplay(course.modules, i);
          const pill = buildModuleStatusPill(
            display.gateAfterLabel,
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
          // Dev unlock expands every module to its clickable pathway
          // (not just the current one) so Spencer can jump into any
          // lesson without grinding to it. Without this, non-current
          // modules render as a preview list and look "unreachable" even
          // when the per-lesson lock is bypassed.
          const showPathway = isCurrent || status === "completed" || devUnlock;
          const pathway =
            showPathway ? (
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
            !showPathway ? (
              <ModulePreview
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
                {TEST_OUT_ENABLED && status !== "completed" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate(langPath(`learn/test-out/${mod.id}`))}
                    >
                      {t("learn.testOutModule", {
                        n: display.contentNumber ?? display.badgeLabel,
                      })}
                    </Button>
                    <p className="lingo-test-out-note basis-full">
                      {t(
                        "learn.testOutNote",
                        "Testing out marks every lesson up to here as complete and jumps you to the next module.",
                      )}
                    </p>
                  </>
                ) : null}
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
            ) : TEST_OUT_ENABLED && !isCurrent && !mod.comingSoon && status !== "completed" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(langPath(`learn/test-out/${mod.id}`))}
              >
                {t("learn.testOutModule", { n: i })}
              </Button>
            ) : null;

          return (
            <ModuleCard
              key={mod.id}
              module={mod}
              badgeLabel={display.badgeLabel}
              gateAfterLabel={display.gateAfterLabel}
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

    </section>
  );
}
