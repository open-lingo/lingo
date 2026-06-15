import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { Card } from "@/shared/components/ui";
import { ProfileCardBody } from "./ProfileCard";
import { FlashcardsReviewBody } from "./FlashcardsReviewStrip";
import { QuestsCardBody } from "@/features/quests";

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
 * One cohesive "You today" card — three sections separated by hairline
 * dividers (no nested borders):
 *   1. identity + level + XP   (ProfileCardBody)
 *   2. today's quests          (QuestsCardBody — daily / weekly / side)
 *   3. due-review strip        (FlashcardsReviewBody)
 *
 * The standalone course-progress card was removed earlier — it's now part
 * of YourPathCard in the main column. Folding profile + quests + reviews
 * into one card trades three competing borders for a single quiet block.
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
    <aside className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <Card as="section" padding="md" className="shadow-card">
        <ProfileCardBody profile={profile} />

        <div aria-hidden className="my-4 h-px bg-border" />

        <QuestsCardBody
          sideQuests={sideQuests}
          isSideQuestUnlocked={isSideQuestUnlocked}
          onSideQuestClick={onSideQuestClick}
        />

        <div aria-hidden className="my-4 h-px bg-border" />

        <FlashcardsReviewBody />
      </Card>
    </aside>
  );
}
