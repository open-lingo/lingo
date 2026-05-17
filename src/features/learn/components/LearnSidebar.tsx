import { useTranslation } from "react-i18next";
import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { ProfileCard } from "./ProfileCard";
import { LearnCourseOverviewCard } from "./LearnCourseOverviewCard";
import { FlashcardsReviewStrip } from "./FlashcardsReviewStrip";
import { SideQuestCard } from "./SideQuestCard";

export type LearnSidebarProps = {
  profile: LearnProfile;
  course: Course;
  completedSet: ReadonlySet<string>;
  onJumpToModule: (moduleId: string) => void;
  sideQuests: SideQuest[];
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  onSideQuestClick?: (quest: SideQuest) => void;
};

/**
 * Desktop-only right rail. Mobile uses `LearnTopBar` above the pathway.
 */
export function LearnSidebar({
  profile,
  course,
  completedSet,
  onJumpToModule,
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: LearnSidebarProps) {
  const { t } = useTranslation();

  return (
    <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start">
      <ProfileCard profile={profile} />
      <LearnCourseOverviewCard
        course={course}
        completedSet={completedSet}
        onJumpToModule={onJumpToModule}
      />
      <FlashcardsReviewStrip />
      {sideQuests.length > 0 ? (
        <section aria-labelledby="learn-side-quests-heading">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2
              id="learn-side-quests-heading"
              className="m-0 text-xs font-semibold uppercase tracking-wide text-text-muted"
            >
              {t("learn.sideQuestsTitle", "Side quests")}
            </h2>
          </div>
          <ul className="space-y-2">
            {sideQuests.map((quest) => (
              <li key={quest.id}>
                <SideQuestCard
                  quest={quest}
                  locked={!isSideQuestUnlocked(quest)}
                  onClick={() => onSideQuestClick?.(quest)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
