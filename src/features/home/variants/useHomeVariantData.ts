/**
 * Single normalized data surface for the throwaway Home wireframe variants.
 *
 * Every /home-N variant reads the SAME real hooks through this one place, so
 * the eight designs are a fair comparison on identical live data (your real
 * next lesson, streak, XP, due cards, quests) rather than divergent mocks.
 *
 * Presentational only downstream: variants receive `HomeVariantData` as a prop
 * and render — they never call these hooks themselves.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig, type LanguageConfig } from "@/shared/domain/languageConfig";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { getNextLesson } from "@/features/course/nextLesson";
import { findInProgressLessonId } from "@/features/lesson/data/lessonProgress";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import { useQuests } from "@/features/quests/useQuests";
import { summarizeDailyPlan } from "@/features/home/restructured/planHelpers";
import { selectGoalQuests, type QuestProgressView } from "@/features/home/restructured/questsTileHelpers";
import { buildMemoryStrengthView, type MemoryStrengthView } from "@/features/home/restructured/memoryStrengthHelpers";
import type { NextLessonInfo } from "@/features/home/restructured/types";
import type { Quest } from "@/features/quests/types";
import { tipOfDay, pickWordOfDay, type LanguageTip, type WordOfDay } from "./homeVariantContent";

const XP_PER_LEVEL = 500;

export type DuePreviewCard = { id: string; front: string; back: string };

export type QuickActionKey =
  | "course"
  | "flashcards"
  | "listening"
  | "speaking"
  | "writing"
  | "grammar";

export type HomeVariantData = {
  /** Friendly first-name greeting (set by the route shell). */
  name: string;
  language: LanguageConfig | null;
  langId: string;

  // ── Continue / resume ────────────────────────────────
  nextLesson: NextLessonInfo | null;
  startLessonHref: string;
  isResume: boolean;
  /** Module title of the active lesson (e.g. "The Hangul Foundation"). */
  moduleName: string | null;
  courseName: string;
  moduleProgressPercent: number;
  lessonIndexLabel: { current: number; total: number } | null;
  /** Rough estimated minutes for the next lesson. */
  estMinutes: number;
  /** Illustrative lesson reward for the hero (placeholder — not from backend). */
  lessonReward: { xp: number; words: number };

  // ── Stats ────────────────────────────────────────────
  streak: number;
  level: number;
  xpTotal: number;
  xpIntoLevel: number;
  xpToNext: number;
  levelPct: number;
  lingots: number;

  // ── Flashcards / memory ──────────────────────────────
  dueCount: number;
  newToday: number;
  duePreview: DuePreviewCard[];
  masteredCount: number;
  learningCount: number;
  startedCount: number;
  weekReviews: number[];
  memory: MemoryStrengthView;

  // ── Quests / plan ────────────────────────────────────
  quests: Quest[];
  dailyPlan: { daily: Quest[]; doneCount: number; allDone: boolean };
  goalQuests: QuestProgressView[];
  /** Resolve a quest's i18n-key title to display text. */
  questLabel: (q: Quest) => string;

  // ── Course progress ──────────────────────────────────
  completedLessonsCount: number;
  totalLessonsCount: number;
  courseCompletionPct: number;
  /** Most-recently-completed lesson titles (course order), newest first. */
  recentlyCompleted: string[];

  // ── Ambient content (static, not backend) ────────────
  wordOfDay: WordOfDay | null;
  tip: LanguageTip;

  // ── Launch points ────────────────────────────────────
  hrefs: Record<QuickActionKey, string> & {
    flashcardsReview: string;
    practiceHub: string;
    courseMap: string;
  };
};

const EST_BY_KIND: Record<string, number> = {
  alphabet: 3,
  recap: 6,
  module_review: 6,
  lesson: 4,
};

export function useHomeVariantData(): HomeVariantData {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const langId = language?.id ?? "ko";
  const langConfig = language ? getLanguageConfig(language.id) : null;
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = useCompletedLessonIds();
  const { stats } = useUserStats();
  const summary = useFlashcardDueSummary(langId);
  const { quests } = useQuests();

  // Resume-or-next lesson — mirrors RestructuredHome's derivation exactly.
  const allowedLessonIds = useMemo(() => {
    if (!course) return new Set<string>();
    return new Set(course.modules.flatMap((m) => m.lessons.map((l) => l.id)));
  }, [course]);
  const inProgressLessonId = useMemo(
    () => (allowedLessonIds.size > 0 ? findInProgressLessonId(allowedLessonIds) : null),
    [allowedLessonIds],
  );
  const inProgressInfo: NextLessonInfo | null = useMemo(() => {
    if (!course || !inProgressLessonId) return null;
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === inProgressLessonId);
      if (lesson) {
        return {
          module: mod.title,
          lesson: { id: lesson.id, title: lesson.title, kind: lesson.kind, alphabetId: lesson.alphabetId },
        };
      }
    }
    return null;
  }, [course, inProgressLessonId]);
  const fallbackNext = course ? getNextLesson(course, completedIds) : null;
  const nextLesson = inProgressInfo ?? fallbackNext;
  const isResume = inProgressInfo !== null;

  const startLessonHref = (() => {
    if (!nextLesson) return langPath("learn");
    const { kind, alphabetId, id } = nextLesson.lesson;
    if (kind === "alphabet" && alphabetId) return langPath(`practice/alphabet/${alphabetId}/learn`);
    return langPath(`learn/lessons/${id}`);
  })();

  const activeModule = useMemo(() => {
    if (!course || !nextLesson) return null;
    return course.modules.find((m) => m.lessons.some((l) => l.id === nextLesson.lesson.id)) ?? null;
  }, [course, nextLesson]);

  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const moduleProgressPercent = (() => {
    if (!activeModule || activeModule.lessons.length === 0) return 0;
    const done = activeModule.lessons.filter((l) => completedSet.has(l.id)).length;
    return Math.round((done / activeModule.lessons.length) * 100);
  })();

  const lessonIndexLabel = (() => {
    if (!activeModule || !nextLesson) return null;
    const idx = activeModule.lessons.findIndex((l) => l.id === nextLesson.lesson.id);
    if (idx < 0) return null;
    return { current: idx + 1, total: activeModule.lessons.length };
  })();

  const estMinutes = nextLesson ? (EST_BY_KIND[nextLesson.lesson.kind ?? "lesson"] ?? 4) : 4;

  // Level / XP — keep parity with HeroContinue's reward strip math.
  const level = stats.level;
  const nextLevelXp = Math.max(1, level) * XP_PER_LEVEL;
  const levelPct = Math.min(100, Math.round((stats.xp / nextLevelXp) * 100));
  const xpToNext = Math.max(0, nextLevelXp - stats.xp);
  const xpIntoLevel = stats.xp % XP_PER_LEVEL;

  // Course completion across all lessons.
  const allLessons = useMemo(() => course?.modules.flatMap((m) => m.lessons) ?? [], [course]);
  const totalLessonsCount = allLessons.length;
  const completedLessonsCount = allLessons.filter((l) => completedSet.has(l.id)).length;
  const courseCompletionPct = totalLessonsCount
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
    : 0;
  const recentlyCompleted = useMemo(
    () =>
      allLessons
        .filter((l) => completedSet.has(l.id))
        .slice(-4)
        .reverse()
        .map((l) => l.title),
    [allLessons, completedSet],
  );

  const memory = buildMemoryStrengthView({
    learningCount: summary.learningCount,
    masteredCount: summary.masteredCount,
    totalCount: summary.totalCount,
    weekReviews: summary.weekReviews,
  });

  const duePreview: DuePreviewCard[] = (summary.dueQueue ?? [])
    .slice(0, 6)
    .map((c) => ({ id: c.id, front: c.front, back: c.back }));

  // Resolve quest i18n-key title/description to display strings ONCE, up front,
  // so every variant renders clean copy whether it reads questLabel(q), q.title,
  // or q.description.
  const resolvedQuests = useMemo(
    () =>
      quests.map((q) => ({
        ...q,
        title: t(q.title, { defaultValue: q.title }),
        description: t(q.description, { defaultValue: q.description }),
      })),
    [quests, t],
  );
  const dailyPlan = summarizeDailyPlan(resolvedQuests, 3);
  const goalQuests = selectGoalQuests(resolvedQuests, 4);

  // Word of the day from the learner's actually-unlocked vocabulary. The
  // flashcard summary already computed the course deck with correct unlock
  // state (its courseDecks[].deck.cards are the unlocked cards); fall back to
  // the due queue if no course deck is present.
  const wordOfDay = useMemo(() => {
    const courseCards = summary.courseDecks.flatMap((d) => d.deck.cards ?? []);
    const pool = courseCards.length > 0 ? courseCards : (summary.dueQueue ?? []);
    return pickWordOfDay(pool);
  }, [summary]);

  const tip = tipOfDay(langId);

  const hrefs = {
    course: langPath("learn"),
    flashcards: langPath("practice/flashcards"),
    flashcardsReview: langPath("practice/flashcards/review"),
    listening: langPath("practice/listening"),
    speaking: langPath("practice/speaking"),
    writing: langPath("practice/writing"),
    grammar: langPath("practice/grammar"),
    practiceHub: langPath("practice"),
    courseMap: langPath("course"),
  };

  return {
    name: "there",
    language: langConfig ?? null,
    langId,
    nextLesson,
    startLessonHref,
    isResume,
    moduleName: nextLesson?.module ?? null,
    courseName: langConfig ? `${langConfig.name} for Beginners` : "Your course",
    moduleProgressPercent,
    lessonIndexLabel,
    estMinutes,
    lessonReward: { xp: 15, words: 3 },
    streak: stats.streak,
    level,
    xpTotal: stats.xp,
    xpIntoLevel,
    xpToNext,
    levelPct,
    lingots: stats.lingots,
    dueCount: summary.dueCount,
    newToday: summary.newToday,
    duePreview,
    masteredCount: summary.masteredCount,
    learningCount: summary.learningCount,
    startedCount: memory.startedCount,
    weekReviews: summary.weekReviews,
    memory,
    quests: resolvedQuests,
    dailyPlan,
    goalQuests,
    questLabel: (q: Quest) => t(q.title, { defaultValue: q.title }),
    completedLessonsCount,
    totalLessonsCount,
    courseCompletionPct,
    recentlyCompleted,
    wordOfDay,
    tip,
    hrefs,
  };
}
