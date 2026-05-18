import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/auth/useAuth";
import { resolveUserAvatarUrl } from "@/shared/auth/resolveUserAvatarUrl";
import { useApi } from "@/shared/api/provider";
import {
  getMockCompletedLessonIds,
  getMockProgressSummary,
} from "@/shared/domain/mockProgress";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

export type LearnProfile = {
  displayName: string;
  avatarUrl?: string;
  levelLabel: string;
  streakDays: number;
  xpEarnedToday: number;
  /**
   * True when the user has zero recorded completions. Drives ProfileCard's
   * empty-state variant so fresh accounts aren't shown three "0" tiles —
   * the landing page promises "no fake gamification" and this is the
   * place that has to deliver on it.
   */
  hasNoProgress: boolean;
  isLoading: boolean;
};

/** Display name + progress stats for the learn sidebar (mock progress until API ships). */
export function useLearnProfile(): LearnProfile {
  const { isAuthenticated, user } = useAuth();
  const { users } = useApi();
  const { language } = useLanguage();
  const progress = getMockProgressSummary();
  const hasNoProgress = getMockCompletedLessonIds().length === 0;

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => users.getMe(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const displayName =
    me?.display_name?.trim() ??
    user?.name ??
    user?.given_name ??
    user?.nickname ??
    user?.email?.split("@")[0] ??
    "Learner";

  const langName = language ? getLanguageConfig(language.id)?.name ?? language.id : "";
  const weekSegment = hasNoProgress
    ? "Just getting started"
    : `${progress.lessonsCompletedThisWeek} lessons this week`;
  const levelLabel = langName
    ? `${langName} · ${weekSegment}`
    : weekSegment;

  return {
    displayName,
    avatarUrl: resolveUserAvatarUrl(me, user),
    levelLabel,
    streakDays: progress.streakDays,
    xpEarnedToday: progress.xpEarnedToday ?? 0,
    hasNoProgress,
    isLoading: isAuthenticated && meLoading,
  };
}
