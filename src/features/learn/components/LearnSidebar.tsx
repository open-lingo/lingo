import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { Card } from "@/shared/components/ui";
import { ScrollArea } from "@/shared/components/ScrollArea";
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
 * One cohesive "You today" card — three sections separated by whitespace
 * alone (dividers dropped 2026-07-16; no nested borders):
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
    <aside className="lg:h-full">
      <ScrollArea className="lg:h-full">
        <Card as="section" padding="md" className="shadow-card lg:flex lg:min-h-full lg:flex-col">
          {/* On desktop the rail matches the map height: the three sections
              spread apart (justify-between) to fill it, and scroll if they
              overrun. `pr` keeps quest rewards clear of the overlay bar. */}
          <div className="space-y-5 lg:flex lg:min-h-full lg:flex-1 lg:flex-col lg:justify-between lg:space-y-0 lg:pr-1">
            <ProfileCardBody profile={profile} />
            <QuestsCardBody
              sideQuests={sideQuests}
              isSideQuestUnlocked={isSideQuestUnlocked}
              onSideQuestClick={onSideQuestClick}
            />
            <ReviewPracticeBody course={course} completedSet={completedSet} />
          </div>
        </Card>
      </ScrollArea>
    </aside>
  );
}
