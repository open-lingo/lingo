import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { ProfileCard } from "./ProfileCard";
import { FlashcardsReviewStrip } from "./FlashcardsReviewStrip";
import { QuestsCard } from "@/features/quests";

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
 *
 * Layout:
 *   1. ProfileCard          — identity + level + XP
 *   2. QuestsCard           — unified daily + side-quests + see-all
 *   3. FlashcardsReviewStrip — due-cards module strip
 *
 * The standalone course-progress card was removed — it's now part of
 * the YourPathCard hero on the main column. QuestsPill + QuestSpotlightCard
 * + the standalone side-quests section were folded into the single
 * QuestsCard so the same conceptual surface lives in one slot.
 */
export function LearnSidebar({
  profile,
  course: _course,
  completedSet: _completedSet,
  onJumpToModule: _onJumpToModule,
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: LearnSidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <ProfileCard profile={profile} />
      <QuestsCard
        sideQuests={sideQuests}
        isSideQuestUnlocked={isSideQuestUnlocked}
        onSideQuestClick={onSideQuestClick}
      />
      <FlashcardsReviewStrip />
    </aside>
  );
}
