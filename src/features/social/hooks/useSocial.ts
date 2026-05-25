/**
 * Social graph + activity — mock today, API tomorrow.
 *
 * Swap `source: "mock"` for TanStack queries against `shared/api/social.ts`
 * without touching home or social page components.
 */
import { useMemo } from "react";
import {
  MOCK_ACTIVITY,
  MOCK_FRIEND_QUEST,
  MOCK_FRIEND_REQUESTS,
  MOCK_FRIEND_SUGGESTIONS,
  MOCK_FRIENDS,
  MOCK_FRIENDS_LB,
  MOCK_LEAGUE,
  MOCK_ME,
  MOCK_MONTHLY_LB,
  MOCK_THREADS,
  MOCK_WEEKLY_LB,
  getHomeFriendsPreview,
  type ActivityItem,
  type ChatThread,
  type FriendQuest,
  type HomeFriendPreview,
  type SocialUser,
} from "../mock/mockSocial";

export type SocialDataSource = "mock" | "api";

export type UseSocialResult = {
  source: SocialDataSource;
  isLoading: boolean;
  isError: boolean;
  me: SocialUser;
  friends: SocialUser[];
  /** Sorted subset for the home Social card. */
  homeFriendsPreview: HomeFriendPreview[];
  friendRequests: SocialUser[];
  friendSuggestions: { user: SocialUser; reason: string }[];
  primarySuggestion: { user: SocialUser; reason: string } | null;
  friendQuest: FriendQuest;
  activity: ActivityItem[];
  threads: ChatThread[];
  weeklyLeaderboard: typeof MOCK_WEEKLY_LB;
  monthlyLeaderboard: typeof MOCK_MONTHLY_LB;
  friendsLeaderboard: typeof MOCK_FRIENDS_LB;
  league: typeof MOCK_LEAGUE;
};

export function useSocial(options?: { homeFriendsLimit?: number }): UseSocialResult {
  const homeLimit = options?.homeFriendsLimit ?? 3;

  return useMemo(
    () => ({
      source: "mock",
      isLoading: false,
      isError: false,
      me: MOCK_ME,
      friends: MOCK_FRIENDS,
      homeFriendsPreview: getHomeFriendsPreview(homeLimit),
      friendRequests: MOCK_FRIEND_REQUESTS,
      friendSuggestions: MOCK_FRIEND_SUGGESTIONS,
      primarySuggestion: MOCK_FRIEND_SUGGESTIONS[0] ?? null,
      friendQuest: MOCK_FRIEND_QUEST,
      activity: MOCK_ACTIVITY,
      threads: MOCK_THREADS,
      weeklyLeaderboard: MOCK_WEEKLY_LB,
      monthlyLeaderboard: MOCK_MONTHLY_LB,
      friendsLeaderboard: MOCK_FRIENDS_LB,
      league: MOCK_LEAGUE,
    }),
    [homeLimit],
  );
}
