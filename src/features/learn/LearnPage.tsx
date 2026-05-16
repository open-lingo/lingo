import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useModal } from "@/shared/contexts/ModalContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { Icon } from "@/shared/components/Icon";
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
import {
  getCurrentModuleIndex,
  getModuleStatus,
  getNextLessonIndex,
  isLessonLocked,
} from "./moduleProgress";
import { useModuleAccordion } from "./useModuleAccordion";
import {
  ModuleCard,
  ModulePathway,
  ModulePreview,
  ProfileCard,
  ResumeBar,
  SideQuestCard,
} from "./components";

const MOCK_STATS = {
  username: "spencer",
  level: "A1 Beginner · 38% to A2",
  streak: 4,
  xpToday: 32,
  coins: 24,
};

export function LearnPage() {
  const { t: _t } = useTranslation();
  const { openSettings } = useModal();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const course = language ? getMockCourse(language.id) : null;

  const [completedIds, setCompletedIds] = useState(() =>
    getMockCompletedLessonIds(),
  );
  const [devUnlock, setDevUnlockState] = useState(() => isDevUnlockOn());
  const [searchParams, setSearchParams] = useSearchParams();
  const [showStartOverConfirm, setShowStartOverConfirm] = useState(false);

  // URL-based dev mode toggle. `?dev=1` flips the unlock flag on (and strips
  // the param so the URL stays clean); `?dev=0` turns it off.
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
    // Parallel toggle for the speech-recognition feature flag. `?speech=1`
    // opts the session into the pronunciation step renderer in
    // `SpeakingStepView`; default users see no change. The same pass
    // also picks up the matcher dials (`?speech-perfect=`,
    // `?speech-close=`, `?speech-strict=`, `?speech-alts=`,
    // `?speech-debug=`).
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
    // Sub-lesson density preset + per-key overrides. See
    // `lessonDensity.ts` — `?density=standard` to pick a preset,
    // `?density-recognition=N` (etc.) to override a single dial.
    const densityChanged = applyDensityQueryParams(next);
    if (speechChanged || dialsChanged || densityChanged) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Re-read completion list whenever the page is shown.
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

  // Vocab graduation: any module whose lessons are all completed gets its
  // anchor words snapshotted into the graduation store. Idempotent — the
  // graduateModule call short-circuits on a per-course/module flag. Also
  // serves as the one-time migration for modules that completed before
  // this code shipped (the flag store starts empty).
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

  // Always call hooks unconditionally (rules of hooks). When the course is
  // missing we still need a valid course/currentModule reference; the
  // post-hook early-return handles the user-visible empty state.
  const safeCourse = course ?? {
    id: "noop",
    title: "",
    languageId: "",
    modules: [{ id: "noop", title: "", lessons: [] }],
  };
  const currentIdx = course
    ? getCurrentModuleIndex(course, completedSet)
    : 0;
  const currentModule = safeCourse.modules[currentIdx] ?? safeCourse.modules[0];

  const accordion = useModuleAccordion(safeCourse.id, currentModule.id);

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

  // Navigation helper — preserves the routing logic from MainCourseCard.
  const goToLesson = (lesson: Lesson) => {
    if (lesson.kind === "alphabet" && lesson.alphabetId) {
      navigate(langPath(`practice/alphabet/${lesson.alphabetId}/learn`));
    } else {
      navigate(langPath(`learn/lessons/${lesson.id}`));
    }
  };

  const nextIdx = getNextLessonIndex(currentModule.lessons, completedSet);
  const currentLesson: Lesson | undefined = currentModule.lessons[nextIdx];

  const resumeCurrent = () => {
    if (currentLesson) goToLesson(currentLesson);
  };

  const testOut = (moduleId: string) => {
    const n = course.modules.findIndex((m) => m.id === moduleId);
    alert(
      `Test-out coming soon — will mark Module ${n} complete on 85%+ score`,
    );
  };

  const sideQuests: SideQuest[] = course.sideQuests ?? [];
  const isSideQuestUnlocked = (quest: SideQuest): boolean => {
    if (!quest.unlockAfter) return true;
    // Supported tokens: "<courseLang>-m<N>-complete" — true once every
    // lesson in that module is completed. Unknown tokens stay locked.
    const m = /^([a-z]+)-m(\d+)-complete$/.exec(quest.unlockAfter);
    if (!m) return false;
    const moduleNum = Number(m[2]);
    const targetModule = course.modules[moduleNum];
    if (!targetModule || targetModule.lessons.length === 0) return false;
    return targetModule.lessons.every((l) => completedSet.has(l.id));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-9">
      <section className="min-w-0">
        <h1 className="mb-1 text-[26px] font-extrabold tracking-tight text-text-primary">
          {course.title}
        </h1>
        <p className="mb-5 text-sm text-text-muted">
          Tap a module to expand. The pulsing node is what we suggest — but
          you choose.
        </p>

        {course.modules.map((mod, i) => {
          const status = getModuleStatus(i, completedSet, course.modules);
          const open = accordion.isOpen(mod.id);

          const lessonsDone = mod.lessons.filter((l) =>
            completedSet.has(l.id),
          ).length;
          const totalLessons = mod.lessons.length;
          // Alphabet-streamline: module pill collapses to `XX%` once a row
          // splits into many sub-lessons (50+ in m1). "N of M" gets noisy.
          let pillText: string | undefined;
          if (mod.comingSoon) {
            // Coming-soon stubs have 0 lessons, which would otherwise resolve
            // as "completed" — short-circuit first.
            pillText = "🔒 Coming soon";
          } else if (totalLessons === 0) {
            pillText = undefined;
          } else {
            const pct = Math.round((lessonsDone / totalLessons) * 100);
            if (pct >= 100) {
              pillText = "✓ Complete · 100%";
            } else if (pct === 0 && status === "locked") {
              pillText = `🔒 After Module ${i - 1}`;
            } else {
              pillText = `${pct}%`;
            }
          }

          const isCurrent = i === currentIdx;
          const pathway = isCurrent ? (
            <ModulePathway
              lessons={mod.lessons}
              completedIds={completedSet}
              currentLessonId={currentLesson?.id}
              isLessonLocked={(id) =>
                isLessonLocked(id, i, course, completedSet, devUnlock)
              }
              onLessonClick={goToLesson}
            />
          ) : undefined;

          const preview = !isCurrent ? (
            <ModulePreview
              moduleNumber={i}
              summary={mod.summary}
              lessons={mod.lessons}
              comingSoon={mod.comingSoon}
            />
          ) : undefined;

          // Zero-progress collision: on a brand-new account, the "Resume X"
          // button in the module actions duplicates the green "Start" pill
          // on the first pathway node — and reads as misleading ("resume
          // what? I haven't done anything yet"). When completedSet is empty,
          // hide the Resume button entirely and let the START pill on the
          // node be the sole CTA. Retiree audit P0.
          const hasProgress = completedSet.size > 0;
          const actions =
            isCurrent && currentLesson ? (
              <>
                {hasProgress ? (
                  <button
                    type="button"
                    onClick={resumeCurrent}
                    className="rounded-[11px] border border-accent-hover bg-accent px-4 py-3 text-[14px] font-semibold text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:bg-accent-hover"
                  >
                    Resume {currentLesson.title}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => testOut(mod.id)}
                  className="rounded-[11px] border border-border bg-surface px-4 py-3 text-[14px] font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
                >
                  Test out of Module {i}
                </button>
                <p className="lingo-test-out-note basis-full">
                  Testing out marks every lesson up to here as complete and
                  jumps you to the next module.
                </p>
              </>
            ) : !isCurrent && !mod.comingSoon ? (
              <button
                type="button"
                onClick={() => testOut(mod.id)}
                className="rounded-[11px] border border-border bg-surface px-4 py-3 text-[14px] font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
              >
                Test out of Module {i}
              </button>
            ) : null;

          return (
            <ModuleCard
              key={mod.id}
              module={mod}
              moduleNumber={i}
              status={status}
              isOpen={open}
              onToggleOpen={() => accordion.toggle(mod.id)}
              statusPillText={pillText}
              pathway={pathway}
              preview={preview}
              actions={actions}
            />
          );
        })}

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
            onClick={() => setShowStartOverConfirm(true)}
            className="text-xs font-medium text-text-muted hover:text-text-primary"
          >
            Start over
          </button>
        </div>
      </section>

      <aside className="order-first lg:order-none lg:mt-[78px]">
        <div className="mb-6">
          <ProfileCard
            stats={MOCK_STATS}
            onOpenShop={() =>
              alert(
                "Shop coming soon — Streak Shield, XP boosts, lesson unlocks",
              )
            }
          />
        </div>
        {sideQuests.length > 0 ? (
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Side Quests
              </h3>
              <span className="text-[12px] font-semibold text-accent">
                See all ›
              </span>
            </div>
            {sideQuests.map((quest) => (
              <SideQuestCard
                key={quest.id}
                quest={quest}
                locked={!isSideQuestUnlocked(quest)}
                onClick={() => {
                  // TODO(side-quests): wire to a real route once side-quest
                  // decks exist. For now this is a no-op stub.
                }}
              />
            ))}
          </div>
        ) : null}
      </aside>

      {showStartOverConfirm ? (
        <StartOverModal
          onConfirm={() => {
            handleStartOver();
            setShowStartOverConfirm(false);
          }}
          onCancel={() => setShowStartOverConfirm(false)}
        />
      ) : null}

      <DevPanel
        unlocked={devUnlock}
        onToggle={handleToggleDevUnlock}
        onClearProgress={handleStartOver}
        onClearGraduatedVocab={() => clearGraduatedVocab(course.id)}
      />
    </div>
  );
}

function StartOverModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-over-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2
          id="start-over-title"
          className="text-lg font-semibold text-text-primary"
        >
          {t("learn.startOverTitle")}
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {t("learn.startOverConfirm")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            {t("forum.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
          >
            {t("learn.startOver")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating dev panel — fixed to the bottom-right corner. Shown whenever
 * either the dev-unlock flag is on, or the user has visited the page
 * with `?dev=1` at any point (the flag is persistent until cleared).
 */
function DevPanel({
  unlocked,
  onToggle,
  onClearProgress,
  onClearGraduatedVocab,
}: {
  unlocked: boolean;
  onToggle: () => void;
  onClearProgress: () => void;
  onClearGraduatedVocab: () => void;
}) {
  if (!unlocked && !isDevUnlockOn()) return null;
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 backdrop-blur sm:bottom-24">
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
      <button
        type="button"
        onClick={onClearGraduatedVocab}
        className="rounded border border-amber-500/40 px-2 py-1 text-left hover:bg-amber-500/20"
      >
        Clear graduated vocab
      </button>
    </div>
  );
}
