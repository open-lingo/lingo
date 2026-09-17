import { useTranslation } from "react-i18next";
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
  /**
   * `"stack"` (default) — the historical markup: one scroll area around the
   * whole card, three sections spread by whitespace. Every caller below `lg`
   * and the classic LearnPage use this, so those surfaces are byte-identical
   * to before.
   *
   * `"rail"` — the fixed-height right rail on the transit map (TestFlight
   * #172). See the layout note on the component.
   */
  layout?: "stack" | "rail";
};

/**
 * Desktop-only right rail. Mobile uses `LearnTopBar` above the pathway.
 *
 * One cohesive "You today" card — three sections separated by whitespace
 * alone (dividers dropped 2026-07-16; no nested borders):
 *   1. identity + level + XP + course progress   (ProfileCardBody)
 *   2. today's quests                            (QuestsCardBody)
 *   3. review & practice                         (ReviewPracticeBody)
 *
 * ── `layout="rail"` (TestFlight #172) ──
 * Spencer on an 11" iPad in landscape: the two buttons at the bottom of this
 * column ("Review due cards" / "Practice") were 49px BELOW the fold, because
 * the rail sized itself from its own content while the map sized itself from
 * a viewport clamp — whichever was taller set the grid row, and the rail won
 * by ~73px. The caller now pins this column to the map's height
 * (`.tmc-rail`), and in rail mode the card becomes a three-part flex column:
 *
 *   profile        flex-none   always visible
 *   quests         flex-1      the ONLY scroll region
 *   review+CTAs    flex-none   always visible — the buttons can't fall off
 *
 * That makes the promise structural rather than arithmetic: it holds at two
 * quests or at twelve, and on a 900px laptop as well as an 820px iPad.
 *
 * The standalone course-progress card was removed earlier — it was the
 * ProgressFloatCard overlay on the map until #172 retired that too; its two
 * numbers are now the second line of ProfileCardBody's level row.
 */
export function LearnSidebar({
  profile,
  course,
  completedSet,
  onJumpToModule: _onJumpToModule,
  sideQuests,
  isSideQuestUnlocked,
  onSideQuestClick,
  layout = "stack",
}: LearnSidebarProps) {
  const { t } = useTranslation();
  // Distinct from SidebarNav's own <aside> (axe `landmark-unique`): the
  // transit map (`.tmc-rail`) mounts this aside alongside the fixed desktop
  // rail, and two unlabelled `role="complementary"` landmarks on one page
  // collide as indistinguishable to assistive tech.
  const sidebarLabel = t("learn.sidebarLabel", "Your progress");
  const quests = (
    <QuestsCardBody
      sideQuests={sideQuests}
      isSideQuestUnlocked={isSideQuestUnlocked}
      onSideQuestClick={onSideQuestClick}
    />
  );

  if (layout === "rail") {
    return (
      <aside className="lg:h-full" aria-label={sidebarLabel}>
        {/* sr-only: this rail's inner cards jump straight to h3 (quests,
            review) with no h2 between them and the page's own h1 — axe
            `heading-order` flags the skip. A hidden heading here (not a
            re-level of the shared h3 components, which also render on
            Home/LearnPage with their own, already-valid, chains) closes
            the gap without touching any visible typography. */}
        <h2 className="sr-only">{sidebarLabel}</h2>
        <Card
          as="section"
          padding="md"
          className="shadow-card lg:flex lg:h-full lg:flex-col lg:overflow-hidden"
        >
          {/* Rhythm comes from one token (`--tmc-rail-gap`, tightened on
              short landscape screens) instead of the per-section literals
              this stack used to carry. */}
          <div className="space-y-5 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-[var(--tmc-rail-gap)] lg:space-y-0">
            <ProfileCardBody
              profile={profile}
              course={course}
              completedSet={completedSet}
              dense
            />
            {/* The one elastic section. `min-h-0` is load-bearing: without it
                a flex child refuses to shrink below its content and the
                overflow reappears on the page instead of here. `pr` keeps
                quest rewards clear of the overlay scrollbar. */}
            <ScrollArea className="min-w-0 lg:min-h-0 lg:flex-1">
              <div className="lg:pr-1">{quests}</div>
            </ScrollArea>
            <ReviewPracticeBody course={course} completedSet={completedSet} dense />
          </div>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="lg:h-full" aria-label={sidebarLabel}>
      <h2 className="sr-only">{sidebarLabel}</h2>
      <ScrollArea className="lg:h-full">
        <Card as="section" padding="md" className="shadow-card lg:flex lg:min-h-full lg:flex-col">
          {/* On desktop the rail matches the map height: the three sections
              spread apart (justify-between) to fill it, and scroll if they
              overrun. `pr` keeps quest rewards clear of the overlay bar. */}
          <div className="space-y-5 lg:flex lg:min-h-full lg:flex-1 lg:flex-col lg:justify-between lg:space-y-0 lg:pr-1">
            <ProfileCardBody profile={profile} />
            {quests}
            <ReviewPracticeBody course={course} completedSet={completedSet} />
          </div>
        </Card>
      </ScrollArea>
    </aside>
  );
}
