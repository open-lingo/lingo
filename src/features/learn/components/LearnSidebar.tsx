import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { Card } from "@/shared/components/ui";
import { ProfileCardBody } from "./ProfileCard";
import { QuestsCardBody } from "@/features/quests";
import { ReviewPracticeBody } from "./LearnToolsRow";

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
 *   2. today's quests          (QuestsCardBody — daily/weekly + side)
 *   3. review & practice       (ReviewPracticeBody — moved from the
 *      retired bottom tools row 2026-07-16)
 *
 * The standalone course-progress card was removed earlier — it's now the
 * ProgressFloatCard overlay on the map (and YourPathCard on classic).
 */
export function LearnSidebar({
  profile,
  course,
  completedSet,
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

        <ReviewPracticeBody course={course} completedSet={completedSet} />
      </Card>
    </aside>
  );
}
