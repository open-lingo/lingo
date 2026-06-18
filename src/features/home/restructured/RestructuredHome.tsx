/**
 * Returning-user home — bento dashboard.
 *
 * A dense, viewport-filling bento built around motivation loops, NOT a
 * vertical widget feed. Mild scroll on tall content is fine:
 *   Row 1  Hero "Continue learning" + reward strip (streak / level / XP)
 *   Row 2  Motivation core (lg: a 12-col stretch grid)
 *            · Today's Plan        (daily checklist — "what should I do?")
 *            · Quests / Goals      (weekly + bonus progress — "what's worth grinding?")
 *            · Right rail (stacked): Flashcards due + Friend leaderboard
 *   Row 3  Trending community strip (taller 4-up — "what's cool out there?")
 *
 * Each block answers one question: what should I do? / how am I doing? /
 * what are my friends doing? / what's cool in the community? / what reward
 * am I about to earn?
 */
import { useMemo } from "react";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useUserStats } from "@/shared/hooks/useUserStats";
import { getNextLesson } from "@/features/course/nextLesson";
import { findInProgressLessonId } from "@/features/lesson/data/lessonProgress";
import type { NextLessonInfo } from "./types";
import { HeroContinue } from "./HeroContinue";
import { TodaysPlan } from "./TodaysPlan";
import { MemoryStrengthTile } from "./MemoryStrengthTile";
import { QuestsTile } from "./QuestsTile";
import { FlashcardsTile } from "./FlashcardsTile";
import { LeaderboardCard } from "./LeaderboardCard";
import { TrendingRow } from "./TrendingRow";

const XP_PER_LEVEL = 500;

type Props = {
  /** Friendly first-name greeting (already sanitized by HomePage). */
  greetingName: string;
};

export function RestructuredHome({ greetingName }: Props) {
  const { language } = useLanguage();
  const langPath = useLangPath();
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = useCompletedLessonIds();
  const langConfig = language ? getLanguageConfig(language.id) : null;
  const { stats } = useUserStats();

  // Resume an in-progress lesson when one exists for this course; otherwise
  // fall through to the next non-completed lesson. The allow-list of lesson
  // ids comes from the course modules so a stale/foreign resume record is
  // ignored.
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
          lesson: {
            id: lesson.id,
            title: lesson.title,
            kind: lesson.kind,
            alphabetId: lesson.alphabetId,
          },
        };
      }
    }
    return null;
  }, [course, inProgressLessonId]);
  const fallbackNext = course ? getNextLesson(course, completedIds) : null;
  const nextLesson = inProgressInfo ?? fallbackNext;
  const isResume = inProgressInfo !== null;

  // "Continue" drops the user directly into the lesson player. Alphabet
  // lessons live under a different route; fall back to the Learn page.
  const startLessonHref = (() => {
    if (!nextLesson) return langPath("learn");
    const { kind, alphabetId, id } = nextLesson.lesson;
    if (kind === "alphabet" && alphabetId) {
      return langPath(`practice/alphabet/${alphabetId}/learn`);
    }
    return langPath(`learn/lessons/${id}`);
  })();

  const moduleProgressPercent = (() => {
    if (!course || !nextLesson) return 0;
    const completed = new Set(completedIds);
    const activeModule = course.modules.find((m) =>
      m.lessons.some((l) => l.id === nextLesson.lesson.id),
    );
    if (!activeModule || activeModule.lessons.length === 0) return 0;
    const doneInModule = activeModule.lessons.filter((l) => completed.has(l.id)).length;
    return Math.round((doneInModule / activeModule.lessons.length) * 100);
  })();

  const lessonIndexLabel = (() => {
    if (!course || !nextLesson) return null;
    const activeModule = course.modules.find((m) =>
      m.lessons.some((l) => l.id === nextLesson.lesson.id),
    );
    if (!activeModule) return null;
    const idx = activeModule.lessons.findIndex((l) => l.id === nextLesson.lesson.id);
    if (idx < 0) return null;
    return { current: idx + 1, total: activeModule.lessons.length };
  })();

  // Level / XP-to-next for the hero reward strip.
  const level = stats.level;
  const nextLevelXp = Math.max(1, level) * XP_PER_LEVEL;
  const levelPct = Math.min(100, Math.round((stats.xp / nextLevelXp) * 100));
  const xpToNext = Math.max(0, nextLevelXp - stats.xp);

  return (
    <div className="space-y-4">
      <HeroContinue
        name={greetingName}
        language={langConfig ?? null}
        startLessonHref={startLessonHref}
        nextLesson={nextLesson}
        streakDays={stats.streak}
        moduleProgressPercent={moduleProgressPercent}
        lessonIndexLabel={lessonIndexLabel}
        isResume={isResume}
        level={level}
        xpTotal={stats.xp}
        xpToNext={xpToNext}
        levelPct={levelPct}
      />

      {/* Row 2 — the motivation core. Single column on mobile; at lg+ it's a
          12-col stretch grid so every cell shares the tallest column's height
          and the band fills the viewport instead of leaving a thin strip.
          Symmetric stacked rails flank the tall Quests centre:
            · Left rail  (4 cols) — Today's Plan (now a half-card) stacked over
              Memory Strength, which flexes to absorb the remaining height.
            · Quests/Goals (4 cols) — the tall centre column.
            · Right rail (4 cols) — Flashcards stacked over Leaderboard, the
              leaderboard flexing to absorb the remaining height. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-4">
          <TodaysPlan />
          <div className="flex-1">
            <MemoryStrengthTile />
          </div>
        </div>
        <div className="lg:col-span-4">
          <QuestsTile />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          <FlashcardsTile />
          <div className="flex-1">
            <LeaderboardCard />
          </div>
        </div>
      </div>

      {/* Row 3 — community discovery strip. */}
      <TrendingRow />
    </div>
  );
}
