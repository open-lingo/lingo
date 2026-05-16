import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
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
    }
  }, [course, completedSet]);

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

  const sideQuests: SideQuest[] = course.sideQuests ?? [];
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

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1">
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
        <div className="order-1 lg:order-2">
          <LearnSidebar
            profile={profile}
            course={course}
            completedSet={completedSet}
            onJumpToModule={handleJumpToModule}
            sideQuests={sideQuests}
            isSideQuestUnlocked={isSideQuestUnlocked}
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
