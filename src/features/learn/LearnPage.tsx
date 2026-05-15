import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useTranslation } from "react-i18next";
import { useModal } from "@/shared/contexts/ModalContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getMockCourse, ALPHABET_LESSON_ID } from "@/shared/domain/mockCourse";
import {
  clearMockProgress,
  getMockCompletedLessonIds,
  isDevUnlockOn,
  setDevUnlock,
} from "@/shared/domain/mockProgress";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { getTrendingCourses } from "@/features/community/mockCommunity";
import { getCommunityProgressMap } from "./communityProgress";
import { MainCourseCard, CommunityModuleCard } from "./components";

export function LearnPage() {
  const { t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;
  const [completedIds, setCompletedIds] = useState(() =>
    getMockCompletedLessonIds(),
  );
  const [devUnlock, setDevUnlockState] = useState(() => isDevUnlockOn());
  const [searchParams, setSearchParams] = useSearchParams();
  const customCourses = language ? getTrendingCourses(language.id) : [];
  const communityProgress = getCommunityProgressMap();

  // URL-based dev mode toggle. `?dev=1` flips the unlock flag on (and
  // strips the param so the URL stays clean); `?dev=0` turns it off.
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
  }, [searchParams, setSearchParams]);

  // Re-read completion list whenever the page is shown (returning from a
  // finished lesson should immediately reflect the new state).
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
  const completedLessonIds = Array.from(
    new Set([
      ...completedIds,
      ...(alphabetCompleted ? [ALPHABET_LESSON_ID] : []),
    ]),
  );

  const communityCourseAddons = customCourses.filter(
    (a) => a.kind === "course",
  );

  const handleStartOver = () => {
    clearMockProgress();
    setCompletedIds([]);
  };

  const handleToggleDevUnlock = () => {
    const next = !devUnlock;
    setDevUnlock(next);
    setDevUnlockState(next);
  };

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-text-muted">
          Select a learning language in Settings to see your course path.
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="text-sm text-accent"
        >
          <Icon name="arrowBigRight" size={14} className="inline" /> Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          {course.title}
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          {t("learn.officialCourseDesc")}
        </p>
        <MainCourseCard
          course={course}
          completedLessonIds={completedLessonIds}
          onStartOver={handleStartOver}
          devUnlock={devUnlock}
        />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-text-primary">
          {t("learn.communityModules")}
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          {t("learn.communityModulesDesc")}
        </p>
        {communityCourseAddons.length === 0 ? (
          <p className="text-sm text-text-muted">
            {t("learn.noCommunityModules")}
          </p>
        ) : (
          <div className="space-y-3">
            {communityCourseAddons.map((addon) => (
              <CommunityModuleCard
                key={addon.id}
                addon={addon}
                completedCount={communityProgress.get(addon.id) ?? 0}
              />
            ))}
          </div>
        )}
        <Link
          to={langPath("community/explore")}
          className="mt-3 inline-block text-sm font-medium text-accent hover:text-accent-hover"
        >
          {t("learn.browseAllCourses")}{" "}
          <Icon name="arrowBigRight" size={14} className="inline" />
        </Link>
      </section>

      <Link
        to={langPath("")}
        className="inline-block text-sm text-text-secondary hover:text-text-primary"
      >
        {t("common.backToHome")}
      </Link>

      <DevPanel
        unlocked={devUnlock}
        onToggle={handleToggleDevUnlock}
        onClearProgress={handleStartOver}
      />
    </div>
  );
}

/**
 * Floating dev panel — fixed to the bottom-right corner. Shown whenever
 * either the dev-unlock flag is on, or the user has visited the page
 * with `?dev=1` at any point (the flag is persistent until cleared).
 * Lets the user flip unlock and clear progress without entering Settings.
 */
function DevPanel({
  unlocked,
  onToggle,
  onClearProgress,
}: {
  unlocked: boolean;
  onToggle: () => void;
  onClearProgress: () => void;
}) {
  // Only render when the flag is set so production UI is unchanged.
  if (!unlocked && !isDevUnlockOn()) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 backdrop-blur">
      <div className="font-semibold">DEV</div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={unlocked} onChange={onToggle} />
        Unlock all lessons
      </label>
      <button
        type="button"
        onClick={onClearProgress}
        className="rounded border border-amber-500/40 px-2 py-1 text-left hover:bg-amber-500/20"
      >
        Clear progress
      </button>
    </div>
  );
}
