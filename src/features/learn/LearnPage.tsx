import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApi } from "@/shared/api/provider";
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
import { useUserStats } from "@/shared/hooks/useUserStats";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";
import { getMockCourse, ALPHABET_LESSON_ID } from "@/shared/domain/mockCourse";
import {
  isDevUnlockOn,
  setDevUnlock,
} from "@/shared/domain/mockProgress";
import { useCompletedLessonIds } from "./hooks/useCompletedLessonIds";
import { resetLearnProgress } from "./resetLearnProgress";
import { applySpeechQueryParams, setSpeechFlag } from "@/shared/speech";
import { applyDensityQueryParams } from "@/features/lesson/data/lessonDensity";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import {
  clearGraduatedVocab,
  graduateModule,
} from "@/features/japanese/vocabGraduation";
import type { Lesson, SideQuest } from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getNextLessonIndex,
} from "./moduleProgress";
import { useModuleAccordion } from "./useModuleAccordion";
import { useLearnProfile } from "./hooks/useLearnProfile";
import { LearnMapScrollArea } from "./components/LearnMapScrollArea";
import { PlacementPrompt } from "@/features/placement/components/PlacementPrompt";
import { isPlacementDismissed, dismissPlacement } from "@/features/placement/hooks/usePlacementDismissed";
import { LearnSidebar } from "./components/LearnSidebar";
import { LearnTopBar } from "./components/LearnTopBar";
import { LearnDevPanel } from "./components/LearnDevPanel";
import { YourPathCard } from "./components/YourPathCard";
import { ConfirmModal } from "@/shared/components/ConfirmModal";

export function LearnPage() {
  const { t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const profile = useLearnProfile();
  const { stats: userStats } = useUserStats();

  const completedIds = useCompletedLessonIds();
  const [devUnlock, setDevUnlockState] = useState(() => isDevUnlockOn());
  const [placementDismissedByUser, setPlacementDismissedByUser] = useState(false);
  const showPlacement =
    !placementDismissedByUser &&
    language?.id === "ja" &&
    !isPlacementDismissed() &&
    completedIds.length === 0;

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

  const { progress: progressApi, srs: srsApi } = useApi();

  const handleStartOver = async () => {
    if (!course) return;
    try {
      await resetLearnProgress(course.id, { progress: progressApi, srs: srsApi });
      showToast(
        t("learn.startOverDone", {
          defaultValue:
            "Progress reset across your account — you're back at the start.",
        }),
        "success",
      );
    } catch (_err) {
      showToast(
        t("learn.startOverError", {
          defaultValue: "Couldn't fully reset on the server. Try again.",
        }),
        "error",
      );
    }
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
  const SIDEQUEST_TO_ROUTE: Record<string, string> = {
    "ja-travel-sprint": "learn/travel-sprint",
  };
  const TRAVEL_SPRINT_LESSONS = [
    "ja-sidequest-travel-navigation",
    "ja-sidequest-travel-ordering",
    "ja-sidequest-travel-help",
    "ja-sidequest-travel-shopping",
  ];
  const sideQuests: SideQuest[] = (course.sideQuests ?? []).map((q) => {
    if (q.id === "ja-travel-sprint") {
      const done = TRAVEL_SPRINT_LESSONS.filter((l) => completedSet.has(l)).length;
      return { ...q, progress: Math.round((done / TRAVEL_SPRINT_LESSONS.length) * 100) };
    }
    const lessonId = SIDEQUEST_TO_LESSON[q.id];
    if (lessonId && completedSet.has(lessonId)) {
      return { ...q, progress: 100 };
    }
    return q;
  });
  const onSideQuestClick = (quest: SideQuest) => {
    // ``comingSoon`` quests render in the rail but have no real target —
    // the card itself is disabled, but this guard is a safety net in
    // case any path-through-state triggers a click on a Soon quest.
    if (quest.comingSoon) return;
    const route = SIDEQUEST_TO_ROUTE[quest.id];
    if (route) {
      navigate(langPath(route));
      return;
    }
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
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning transition hover:bg-warning/20"
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
          <YourPathCard
            course={course}
            completedSet={completedSet}
            streakDays={userStats.streak}
            onResume={() => {
              const currentModule = course.modules[currentModuleIdx];
              if (!currentModule) return;
              const idx = getNextLessonIndex(
                currentModule.lessons,
                completedSet,
              );
              const lesson = currentModule.lessons[idx];
              if (lesson) goToLesson(lesson);
            }}
            onJumpToModule={handleJumpToModule}
            onStartOver={() => setShowStartOverConfirm(true)}
          />
          <LearnMapScrollArea
            course={course}
            completedSet={completedSet}
            devUnlock={devUnlock}
            langPath={langPath}
            isModuleOpen={accordion.isOpen}
            onToggleModule={accordion.toggle}
            onLessonClick={goToLesson}
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

      {/* Low-key footer — bottom-of-page reset entry. The full settings
          page has a louder version per-language. We want this hidden
          enough that it's not the first thing people see, but findable
          by anyone scanning the bottom for "danger / reset" controls. */}
      <div className="mt-12 flex flex-col items-center gap-2 pb-8 text-center">
        <button
          type="button"
          onClick={() => setShowStartOverConfirm(true)}
          className="text-xs text-text-muted/70 underline-offset-2 hover:text-text-secondary hover:underline"
        >
          {t("learn.startOver", { defaultValue: "Start over" })}
        </button>
        <p className="max-w-xs text-[0.65rem] text-text-muted/60">
          {t("learn.startOverFooterHint", {
            defaultValue:
              "Wipes this course's progress across your whole account. Same control lives in Settings.",
          })}
        </p>
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
        onClearProgress={() => {
          if (course) resetLearnProgress(course.id);
        }}
        onClearGraduatedVocab={() => clearGraduatedVocab(course.id)}
      />
      {showPlacement && (
        <PlacementPrompt
          onStart={() => {
            setPlacementDismissedByUser(true);
            navigate(langPath("learn/placement-test"));
          }}
          onSkip={() => {
            dismissPlacement();
            setPlacementDismissedByUser(true);
          }}
        />
      )}
    </>
  );
}

export default LearnPage;
