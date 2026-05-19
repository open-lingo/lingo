/**
 * Social page — compact single-viewport layout (revised 2026-05-18).
 *
 * Target: fit within a 1440×900 viewport without scrolling.
 *
 *   ┌─ SocialHeader (~56px) ─────────────────────────────────────┐
 *   ├─ ActivityFeedStrip (~110px) ───────────────────────────────┤
 *   ├──────────────────────────────────┬─────────────────────────┤
 *   │  FriendsSearchAndList            │  CompactUnifiedLeader-  │
 *   │  (col-span-8, ~600px tall)        │  boardCard              │
 *   │                                  │  ─────────────────────  │
 *   │                                  │  FriendRequestsPanel    │
 *   │                                  │  ─────────────────────  │
 *   │                                  │  FriendSuggestionsPanel │
 *   └──────────────────────────────────┴─────────────────────────┘
 *
 * Right rail uses a narrow ~33% column so the leaderboard reads as a
 * snapshot, not a sprawling table. "See full" links route out to the
 * future `/:lang/leaderboards` deep view.
 *
 * Spec: docs/superpowers/specs/2026-05-18-social-page-design.md
 */
import { SocialHeader } from "../components/SocialHeader";
import { ActivityFeedStrip } from "../sections/ActivityFeedStrip";
import {
  FriendsSearchAndList,
  FriendRequestsPanel,
  FriendSuggestionsPanel,
} from "../sections/FriendsSection";
import { CompactUnifiedLeaderboardCard } from "../sections/LeaderboardsSection";

export default function SocialPreviewPage() {
  return (
    <div className="flex flex-col gap-2">
      <SocialHeader />
      <ActivityFeedStrip />

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FriendsSearchAndList />
        </div>
        <div className="flex flex-col gap-2 lg:col-span-4">
          <CompactUnifiedLeaderboardCard />
          <FriendRequestsPanel />
          <FriendSuggestionsPanel />
        </div>
      </div>
    </div>
  );
}
