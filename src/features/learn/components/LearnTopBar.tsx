import { useTranslation } from "react-i18next";
import { CollapsibleSection } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import type { Course, SideQuest } from "@/shared/domain/course";
import type { LearnProfile } from "../hooks/useLearnProfile";
import { ProfileCard } from "./ProfileCard";
import { LearnCourseOverviewCard } from "./LearnCourseOverviewCard";
import { SideQuestCard } from "./SideQuestCard";

export type LearnTopBarProps = {
  profile: LearnProfile;
  course: Course;
  completedSet: ReadonlySet<string>;
  onJumpToModule: (moduleId: string) => void;
  sideQuests: SideQuest[];
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  onSideQuestClick?: (quest: SideQuest) => void;
};

/**
 * Mobile-only top bar above the pathway: two cards side-by-side
 * (Profile + Course progress), with a collapsible Side quests bar below.
 * Desktop hides this and renders the same content as a right rail
 * (`LearnSidebar`).
 */
export function LearnTopBar({
  profile,
  course,
  completedSet,
  onJumpToModule,
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
}: LearnTopBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 lg:hidden">
      <div className="grid grid-cols-2 items-stretch gap-3">
        <ProfileCard profile={profile} />
        <LearnCourseOverviewCard
          course={course}
          completedSet={completedSet}
          onJumpToModule={onJumpToModule}
        />
      </div>

      {sideQuests.length > 0 ? (
        <div className="mt-3">
          <CollapsibleSection
            alwaysCollapsible
            persistKey="learn-side-quests-mobile"
            title={
              <>
                <Icon
                  name="star"
                  size={18}
                  className="text-accent"
                  aria-hidden
                />
                <span className="text-base font-bold">
                  {t("learn.sideQuestsTitle", "Side quests")}
                </span>
              </>
            }
            trailing={
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold tabular-nums text-accent">
                {sideQuests.length}
              </span>
            }
          >
            <ul className="grid gap-2 sm:grid-cols-2">
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
          </CollapsibleSection>
        </div>
      ) : null}
    </div>
  );
}
