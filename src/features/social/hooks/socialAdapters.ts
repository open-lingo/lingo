/**
 * Adapter functions that translate `SocialApi` responses (snake_case,
 * server-shaped) into the UI-shaped types in `mock/mockSocial.ts`. Keeps
 * the consumer components unchanged when the API path is active.
 *
 * If/when the UI types are renamed away from "mock" naming, these adapters
 * remain the single seam to update.
 */
import type {
  ActivityFeedItem as ApiActivityItem,
  ActivityReaction as ApiActivityReaction,
  Friend as ApiFriend,
  FriendRequest as ApiFriendRequest,
  FriendRequestsBundle,
  InviteOffer as ApiInviteOffer,
  LeaderboardEntry,
  LeagueSpotlight as ApiLeagueSpotlight,
  PublicProfile,
  StreakSnapshot as ApiStreakSnapshot,
  ThreadItem as ApiThreadItem,
} from "@/shared/api/social";
import type {
  ActivityItem,
  ActivityReaction,
  ChatThread,
  InviteOffer,
  LeaderboardRow,
  ReactionKind,
  SocialUser,
} from "../mock/mockSocial";
import type { LeagueSpotlight as UiLeagueSpotlight } from "./useSocial.types";

// Languages we know about. Map ISO codes → display tokens.
const LANG_DISPLAY: Record<string, { code: string; flag: string; label: string }> = {
  ja: { code: "ja", flag: "🇯🇵", label: "Japanese" },
  ko: { code: "ko", flag: "🇰🇷", label: "Korean" },
  es: { code: "es", flag: "🇪🇸", label: "Spanish" },
  en: { code: "en", flag: "🇺🇸", label: "English" },
};

function langOf(code: string | null | undefined) {
  if (!code) return LANG_DISPLAY.ja;
  return LANG_DISPLAY[code] ?? { code, flag: "🌐", label: code.toUpperCase() };
}

function lastActiveLabel(iso: string | null | undefined): {
  status: "active" | "idle";
  label: string;
} {
  if (!iso) return { status: "idle", label: "—" };
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (Number.isNaN(t)) return { status: "idle", label: "—" };
  const minutes = Math.max(0, Math.floor((now - t) / 60_000));
  if (minutes < 5) return { status: "active", label: "Active now" };
  if (minutes < 60) return { status: "active", label: `Active ${minutes}m ago` };
  if (minutes < 60 * 24) return { status: "idle", label: `${Math.floor(minutes / 60)}h ago` };
  const days = Math.floor(minutes / (60 * 24));
  if (days === 1) return { status: "idle", label: "Yesterday" };
  return { status: "idle", label: `${days}d ago` };
}

export function adaptFriend(f: ApiFriend): SocialUser {
  const { status, label } = lastActiveLabel(f.lastActiveAt);
  return {
    id: f.user_id,
    name: f.display_name || f.username,
    imageUrl: f.profile_picture_key ?? undefined,
    language: langOf(null),
    streakDays: f.streak,
    totalXp: f.xp,
    lessonsCompleted: 0,
    status,
    lastActiveLabel: label,
  };
}

export function adaptFriendRequest(r: ApiFriendRequest): SocialUser {
  return {
    id: r.user_id,
    name: r.display_name || r.username,
    language: langOf(null),
    streakDays: 0,
    totalXp: 0,
    lessonsCompleted: 0,
    status: "idle",
    lastActiveLabel: timeAgo(r.requestedAt),
  };
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const minutes = Math.max(0, Math.floor((Date.now() - t) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  const days = Math.floor(minutes / (60 * 24));
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function adaptIncomingRequests(bundle: FriendRequestsBundle | undefined): SocialUser[] {
  return (bundle?.incoming ?? []).map(adaptFriendRequest);
}

const VALID_REACTION_KINDS: ReactionKind[] = ["wave", "fire", "clap", "target"];

function adaptReaction(r: ApiActivityReaction): ActivityReaction {
  const k = VALID_REACTION_KINDS.includes(r.kind as ReactionKind)
    ? (r.kind as ReactionKind)
    : ("wave" as ReactionKind);
  return { kind: k, count: r.count, mine: r.mine };
}

export function adaptActivity(item: ApiActivityItem): ActivityItem {
  const { status, label } = lastActiveLabel(item.occurred_at);
  const reactions = (item.reactions ?? []).map(adaptReaction);
  return {
    id: item.id,
    user: {
      id: item.actor_id,
      name: item.actor_display_name || item.actor_username,
      imageUrl: item.actor_profile_picture_key ?? undefined,
      language: langOf(null),
      streakDays: 0,
      totalXp: 0,
      lessonsCompleted: 0,
      status,
      lastActiveLabel: label,
    },
    kind: item.kind,
    text: item.text,
    timeLabel: timeAgo(item.occurred_at),
    kudosCount: reactions.reduce((sum, r) => sum + r.count, 0),
    reactions,
  };
}

export function adaptLeaderboardEntry(e: LeaderboardEntry, isMe: boolean): LeaderboardRow {
  return {
    rank: e.rank,
    user: {
      id: e.user_id,
      name: e.display_name || e.username,
      imageUrl: e.profile_picture_key ?? undefined,
      language: langOf(null),
      streakDays: 0,
      totalXp: e.xp_this_period,
      lessonsCompleted: 0,
      status: "idle",
      lastActiveLabel: "",
    },
    xp: e.xp_this_period,
    lessons: 0,
    delta: "same",
    isMe,
  };
}

export function adaptInvite(o: ApiInviteOffer): InviteOffer {
  // Convert minutes → hours (round up) so the existing copy works.
  const hours = Math.max(1, Math.round((o.ad_free_minutes_inviter ?? 0) / 60));
  return {
    code: o.code,
    url: o.url,
    rewardLingots: o.lingot_reward_inviter,
    rewardAdFreeHours: hours,
    acceptedCount: o.redeemed_count_this_month,
    acceptedCap: o.monthly_cap,
  };
}

export function adaptStreakSnapshot(s: ApiStreakSnapshot): {
  mine: number;
  friendMedian: number;
  friendTop: number;
} {
  return {
    mine: s.my_streak_days,
    friendMedian: s.friend_median_streak_days,
    friendTop: s.best_friend_streak_days,
  };
}

export function adaptSpotlight(
  s: ApiLeagueSpotlight,
  weeklyMyRow: LeaderboardRow | null,
): UiLeagueSpotlight {
  // Build a synthetic League object so existing UI works.
  const league = {
    name: s.league,
    tierIndex: s.league_tier,
    tierTotal: 10,
    emoji: "💎",
    promotionZone: s.promotion_threshold,
    demotionZone: s.demotion_threshold,
    resetLabel: "",
  };
  return {
    league,
    myRow: weeklyMyRow ?? (s.my_row ? adaptLeaderboardEntry(s.my_row, true) : null),
    rankDeltaToday: s.rank_delta_today,
    dailyXp: s.daily_xp ?? [],
    friendMedianDaily: s.friend_median_daily_xp ?? [],
  };
}

export function adaptThread(t: ApiThreadItem): ChatThread {
  const { status, label } = lastActiveLabel(t.last_time_iso);
  return {
    id: t.id,
    user: {
      id: t.other_user.user_id,
      name: t.other_user.display_name || t.other_user.username,
      imageUrl: t.other_user.profile_picture_key ?? undefined,
      language: langOf(null),
      streakDays: 0,
      totalXp: 0,
      lessonsCompleted: 0,
      status: t.other_user.status ?? status,
      lastActiveLabel: label,
    },
    lastMessage: t.last_message,
    lastTimeLabel: timeAgo(t.last_time_iso),
    unreadCount: t.unread_count,
    messages: [],
  };
}

export function adaptPublicProfile(p: PublicProfile): {
  user: SocialUser;
  bio: string | null;
  joinedAt: string;
  friendshipStatus: PublicProfile["friendship_status"];
} {
  return {
    user: {
      id: p.user_id,
      name: p.display_name || p.username,
      imageUrl: p.profile_picture_key ?? undefined,
      language: langOf(p.learning_language),
      streakDays: p.streak,
      totalXp: p.xp,
      lessonsCompleted: 0,
      status: "idle",
      lastActiveLabel: "",
    },
    bio: p.bio,
    joinedAt: p.joined_at,
    friendshipStatus: p.friendship_status ?? "none",
  };
}
