/**
 * Returning-user home — restructured layout (2026-05-18).
 * Spec: docs/superpowers/specs/2026-05-18-home-restructure-design.md
 * Mock-surface convention: search `// MOCK:` to find replacement sites.
 */
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockCompletedLessonIds, getMockProgressSummary } from "@/shared/domain/mockProgress";
import { getNextLesson } from "@/features/course/nextLesson";
import { HeroSection } from "./HeroSection";
import { AccountOverviewCard } from "./AccountOverviewCard";
import { FlashcardsTile } from "./FlashcardsTile";
import { RecentPracticeTile } from "./RecentPracticeTile";
import { QuestsCard } from "./QuestsCard";
import { SocialCard } from "./SocialCard";
import { CommunityStrip } from "./CommunityStrip";

type Props = {
  /** Friendly first-name greeting (already sanitized by HomePage). */
  greetingName: string;
};

export function RestructuredHome({ greetingName }: Props) {
  const { language } = useLanguage();
  const langPath = useLangPath();
  const course = language ? getMockCourse(language.id) : null;
  const completedIds = getMockCompletedLessonIds();
  const nextLesson = course ? getNextLesson(course, completedIds) : null;
  const langConfig = language ? getLanguageConfig(language.id) : null;
  const progress = getMockProgressSummary();

  // "Continue lesson" should drop the user directly into the lesson player
  // rather than the Learn pathway. Branch on lesson.kind to handle alphabet
  // lessons, which live under a different route. Fallback: Learn page.
  const startLessonHref = (() => {
    if (!nextLesson) return langPath("learn");
    const { kind, alphabetId, id } = nextLesson.lesson;
    if (kind === "alphabet" && alphabetId) {
      return langPath(`practice/alphabet/${alphabetId}/learn`);
    }
    return langPath(`learn/lessons/${id}`);
  })();

  // Module progress derived from how many lessons of the active module are done.
  // Falls back to 0 when no course/module is available (defensive — first-time
  // users don't render this component, so this is a safety net).
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

  return (
    <div className="space-y-6">
      <HeroSection
        name={greetingName}
        language={langConfig ?? null}
        startLessonHref={startLessonHref}
        nextLesson={nextLesson}
        streakDays={progress.streakDays}
        moduleProgressPercent={moduleProgressPercent}
        lessonIndexLabel={lessonIndexLabel}
      />

      {/* Main 3-column grid. Below lg: stacks single column. */}
      <div
        className="grid gap-5 lg:grid-cols-3"
        style={{
          gridTemplateAreas: `
            "account account social"
            "flash quests social"
            "recent quests social"
          `,
        }}
      >
        <div style={{ gridArea: "account" }} className="lg:col-span-2">
          <AccountOverviewCard />
        </div>
        <div style={{ gridArea: "social" }} className="lg:row-span-3">
          <SocialCard />
        </div>
        <div style={{ gridArea: "flash" }}>
          <FlashcardsTile />
        </div>
        <div style={{ gridArea: "quests" }} className="lg:row-span-2">
          <QuestsCard />
        </div>
        <div style={{ gridArea: "recent" }}>
          <RecentPracticeTile />
        </div>
      </div>

      <CommunityStrip />
    </div>
  );
}
