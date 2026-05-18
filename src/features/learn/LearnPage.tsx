import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/contexts/ToastContext";
import { getModuleMastery } from "./moduleMastery";
import {
  getDueReviews,
  scheduleFirstReview,
  reviewModuleIdFor,
} from "@/features/lesson/data/moduleReviewSchedule";

/** localStorage key shape for the one-shot mastery-transition toast.
 *  Versioned so a future copy/UX change can re-fire it for everyone. */
const MASTERY_TOAST_KEY_PREFIX = "lingo_mastery_toasted_v1_";
import { Icon } from "@/shared/components/Icon";
import { useModal } from "@/shared/contexts/ModalContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";
import { getMockCourse, ALPHABET_LESSON_ID } from "@/shared/domain/mockCourse";
import {
  clearMockProgress,
  getMockCompletedLessonIds,
  isDevUnlockOn,
  setDevUnlock,
} from "@/shared/domain/mockProgress";
import { applySpeechQueryParams, setSpeechFlag } from "@/shared/speech";
import { applyDensityQueryParams } from "@/features/lesson/data/lessonDensity";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import {
  clearGraduatedVocab,
  graduateModule,
} from "@/features/japanese/vocabGraduation";
import type { Lesson, SideQuest } from "@/shared/domain/course";
import { getCurrentModuleIndex } from "./moduleProgress";
import { useModuleAccordion } from "./useModuleAccordion";
import { useLearnProfile } from "./hooks/useLearnProfile";
import { LearnCourseMap } from "./components/LearnCourseMap";
import { LearnSidebar } from "./components/LearnSidebar";
import { LearnTopBar } from "./components/LearnTopBar";
import { LearnDevPanel } from "./components/LearnDevPanel";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

export function LearnPage() {
  const { t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const profile = useLearnProfile();

  const [completedIds, setCompletedIds] = useState(() =>
    getMockCompletedLessonIds(),
  );
  const [devUnlock, setDevUnlockState] = useState(() => isDevUnlockOn());

  // Telemetry: one page_view per language visit. Stable ref so React 19
  // StrictMode + language changes during dev don't double-fire.
  const learnViewFiredRef = useRef<string | null>(null);
  useEffect(() => {
    const langId = language?.id ?? "unknown";
    if (learnViewFiredRef.current === langId) return;
    learnViewFiredRef.current = langId;
    logSessionEvent("page_view", {
      page: "learn",
      langId,
      completedCount: completedIds.length,
    });
  }, [language?.id, completedIds.length]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);

  useEffect(() => {
    const dev = searchParams.get("dev");
    if (dev === "1") {
      setDevUnlock(true);
      setDevUnlockState(true);
      const next = new URLSearchParams(searchParams);
      next.delete("dev");
      setSearchParams(next, { replace: true });
    } else if (dev === "0") {
      setDevUnlock(false);
      setDevUnlockState(false);
      const next = new URLSearchParams(searchParams);
      next.delete("dev");
      setSearchParams(next, { replace: true });
    }

    const speech = searchParams.get("speech");
    let speechChanged = false;
    if (speech === "1") {
      setSpeechFlag(true);
      speechChanged = true;
    } else if (speech === "0") {
      setSpeechFlag(false);
      speechChanged = true;
    }
    const next = new URLSearchParams(searchParams);
    if (speechChanged) next.delete("speech");
    const dialsChanged = applySpeechQueryParams(next);
    const densityChanged = applyDensityQueryParams(next);
    if (speechChanged || dialsChanged || densityChanged) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setCompletedIds(getMockCompletedLessonIds());
  }, []);

  const firstLesson = course?.modules[0]?.lessons[0];
  const alphabetLesson =
    firstLesson?.kind === "alphabet" && firstLesson.alphabetId
      ? firstLesson
      : null;
  const alphabetProgress =
    language && alphabetLesson && alphabetLesson.alphabetId
      ? getAlphabetProgress(language.id, alphabetLesson.alphabetId)
      : null;
  const alphabetCompleted = alphabetProgress?.fullTestPassed ?? false;
  const completedLessonIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...completedIds,
          ...(alphabetCompleted ? [ALPHABET_LESSON_ID] : []),
        ]),
      ),
    [completedIds, alphabetCompleted],
  );
  const completedSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds],
  );

  useEffect(() => {
    if (!course) return;
    for (const mod of course.modules) {
      if (mod.comingSoon) continue;
      if (mod.lessons.length === 0) continue;
      const allDone = mod.lessons.every((l) => completedSet.has(l.id));
      if (!allDone) continue;
      graduateModule(course.id, mod);
      // Schedule first review for content modules (not review modules
      // themselves). Idempotent — re-running after re-mastery is a no-op.
      // Skip module ids that look like review modules (ending in -review).
      if (!mod.id.endsWith("-review")) {
        scheduleFirstReview(mod.id);
      }
    }
  }, [course, completedSet]);

  // Surface the count of due reviews on the Learn header. Re-evaluated
  // when completedSet changes (which fires after each lesson finishes).
  const dueReviews = useMemo(
    () => (course ? getDueReviews(course) : []),
    [course, completedSet],
  );

  // One-shot mastery toast — fires once per module the first time it
  // transitions to mastered (sub-lessons done + every row-test passed).
  // Keyed by module id in localStorage so the toast doesn't replay on
  // subsequent visits to /learn.
  const { showToast } = useToast();
  const masteryToastRefs = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!course) return;
    for (const mod of course.modules) {
      if (mod.comingSoon) continue;
      if (mod.lessons.length === 0) continue;
      const key = `${MASTERY_TOAST_KEY_PREFIX}${course.id}-${mod.id}`;
      if (masteryToastRefs.current.has(key)) continue;
      try {
        if (localStorage.getItem(key) === "1") {
          masteryToastRefs.current.add(key);
          continue;
        }
      } catch {
        // ignore — toast will fire next render, no-op if localStorage broken
      }
      const mastery = getModuleMastery(mod, completedSet);
      if (!mastery.mastered) continue;
      try {
        localStorage.setItem(key, "1");
      } catch {
        // ignore quota errors
      }
      masteryToastRefs.current.add(key);
      showToast(
        t("learn.moduleMasteredToast", {
          defaultValue: "★ Module mastered — {{module}}",
          module: mod.eyebrow ?? mod.title,
        }),
        "success",
      );
    }
  }, [course, completedSet, showToast, t]);

  const handleStartOver = () => {
    clearMockProgress();
    setCompletedIds([]);
  };

  const handleToggleDevUnlock = () => {
    const next = !devUnlock;
    setDevUnlock(next);
    setDevUnlockState(next);
  };

  const safeCourse = course ?? {
    id: "noop",
    title: "",
    languageId: "",
    modules: [{ id: "noop", title: "", lessons: [] }],
  };
  const currentModuleIdx = course
    ? getCurrentModuleIndex(course, completedSet)
    : 0;
  const currentModuleId =
    course?.modules[currentModuleIdx]?.id ?? course?.modules[0]?.id ?? "noop";
  const accordion = useModuleAccordion(safeCourse.id, currentModuleId);

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-text-muted">
          {t("learn.pickLanguage", "Select a learning language in Settings to see your course path.")}
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          <Icon name="settings" size={16} aria-hidden />
          {t("nav.settings")}
        </button>
      </div>
    );
  }

  const goToLesson = (lesson: Lesson) => {
    if (lesson.kind === "alphabet" && lesson.alphabetId) {
      navigate(langPath(`practice/alphabet/${lesson.alphabetId}/learn`));
    } else {
      navigate(langPath(`learn/lessons/${lesson.id}`));
    }
  };

  // Sidequest id → lesson id. Map only the wired quests; unmapped ones
  // stay click-no-op (existing behavior) until their lessons land.
  const SIDEQUEST_TO_LESSON: Record<string, string> = {
    "ja-survival-phrasebook": "ja-sidequest-survival-phrases",
  };
  const sideQuests: SideQuest[] = (course.sideQuests ?? []).map((q) => {
    const lessonId = SIDEQUEST_TO_LESSON[q.id];
    if (lessonId && completedSet.has(lessonId)) {
      return { ...q, progress: 100 };
    }
    return q;
  });
  const onSideQuestClick = (quest: SideQuest) => {
    const lessonId = SIDEQUEST_TO_LESSON[quest.id];
    if (!lessonId) return;
    navigate(langPath(`learn/lessons/${lessonId}`));
  };
  const isSideQuestUnlocked = (quest: SideQuest): boolean => {
    if (!quest.unlockAfter) return true;
    const m = /^([a-z]+)-m(\d+)-complete$/.exec(quest.unlockAfter);
    if (!m) return false;
    const moduleNum = Number(m[2]);
    const targetModule = course.modules[moduleNum];
    if (!targetModule || targetModule.lessons.length === 0) return false;
    return targetModule.lessons.every((l) => completedSet.has(l.id));
  };

  const handleJumpToModule = (moduleId: string) => {
    accordion.expand(moduleId);
    requestAnimationFrame(() => {
      document.getElementById(`learn-module-${moduleId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleReviewChipClick = () => {
    if (dueReviews.length === 0) return;
    const top = dueReviews[0];
    const reviewModuleId = reviewModuleIdFor(top.moduleId);
    // Open the first non-mastery lesson of the review module — users
    // walk lessons 1 → 2 → 3 → test in order.
    navigate(langPath(`learn/lessons/ja-${reviewModuleId}-1`));
  };

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {course.title}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t("learn.pathHint", "Tap a module to expand. The pulsing node is what we suggest — you choose.")}
        </p>
        {dueReviews.length > 0 ? (
          <button
            type="button"
            onClick={handleReviewChipClick}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
            aria-label={t("learn.reviewsDueAria", {
              defaultValue: "{{count}} module reviews due",
              count: dueReviews.length,
            })}
          >
            <span aria-hidden>🔄</span>
            {t("learn.reviewsDue", {
              defaultValue:
                dueReviews.length === 1
                  ? "{{count}} review due"
                  : "{{count}} reviews due",
              count: dueReviews.length,
            })}
          </button>
        ) : null}
      </header>
      <LearnTopBar
        profile={profile}
        course={course}
        completedSet={completedSet}
        onJumpToModule={handleJumpToModule}
        sideQuests={sideQuests}
        isSideQuestUnlocked={isSideQuestUnlocked}
        onSideQuestClick={onSideQuestClick}
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
        <div className="min-w-0">
          <LearnCourseMap
            course={course}
            completedSet={completedSet}
            devUnlock={devUnlock}
            langPath={langPath}
            isModuleOpen={accordion.isOpen}
            onToggleModule={accordion.toggle}
            onLessonClick={goToLesson}
            onStartOver={() => setShowStartOverConfirm(true)}
          />
        </div>
        <div className="hidden lg:block">
          <LearnSidebar
            profile={profile}
            course={course}
            completedSet={completedSet}
            onJumpToModule={handleJumpToModule}
            sideQuests={sideQuests}
            isSideQuestUnlocked={isSideQuestUnlocked}
            onSideQuestClick={onSideQuestClick}
          />
        </div>
      </div>

      {showStartOverConfirm ? (
        <ConfirmModal
          title={t("learn.startOverTitle")}
          message={t("learn.startOverConfirm")}
          cancelLabel={t("forum.cancel")}
          confirmLabel={t("learn.startOver")}
          danger
          onConfirm={() => {
            handleStartOver();
            setShowStartOverConfirm(false);
          }}
          onCancel={() => setShowStartOverConfirm(false)}
        />
      ) : null}

      <LearnDevPanel
        unlocked={devUnlock}
        onToggle={handleToggleDevUnlock}
        onClearProgress={handleStartOver}
        onClearGraduatedVocab={() => clearGraduatedVocab(course.id)}
      />
    </>
  );
}

export default LearnPage;
