/**
 * Adapter functions that translate `SocialApi` responses (snake_case,
 * server-shaped) into the UI-shaped types in `../types.ts`.
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
} from "@/shared/api/social";
import type {
  ActivityItem,
  ActivityReaction,
  InviteOffer,
  LeaderboardRow,
  ReactionKind,
  SocialUser,
} from "../types";
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
    username: f.username,
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
    username: r.username,
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

/** Map backend activity kinds → the UI kind union. The UI
 *  only renders a couple of pre-defined kinds (`streak`/`module`/etc.),
 *  so we fold the broader backend enum down to the closest match.
 *  Defaults to ``"module"`` since the dominant case today is
 *  ``lesson_completed``. */
function adaptKind(k: ApiActivityItem["kind"]): ActivityItem["kind"] {
  switch (k) {
    case "lesson_completed":
      return "module";
    case "streak_milestone":
      return "streak";
    case "level_up":
      return "league";
    case "friend_joined":
      return "joined";
    case "achievement":
      return "milestone";
    default:
      return "module";
  }
}

function buildActivityText(item: ApiActivityItem): string {
  const lessonId =
    typeof item.payload?.lessonId === "string" ? item.payload.lessonId : null;
  switch (item.kind) {
    case "lesson_completed":
      return lessonId ? `Finished ${lessonId}` : "Finished a lesson";
    case "streak_milestone":
      return "Hit a streak milestone";
    case "level_up":
      return "Leveled up";
    case "friend_joined":
      return "Joined Open Lingo";
    case "achievement":
      return "Unlocked an achievement";
    default:
      return "Made progress";
  }
}

export function adaptActivity(item: ApiActivityItem): ActivityItem {
  const { status, label } = lastActiveLabel(item.created_at);
  const reactions = (item.reactions ?? []).map(adaptReaction);
  return {
    id: item.id,
    user: {
      id: item.user_id,
      name: item.display_name || item.username,
      username: item.username,
      imageUrl: item.profile_picture_key ?? undefined,
      language: langOf(null),
      streakDays: 0,
      totalXp: 0,
      lessonsCompleted: 0,
      status,
      lastActiveLabel: label,
    },
    kind: adaptKind(item.kind),
    text: buildActivityText(item),
    timeLabel: timeAgo(item.created_at),
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
      username: e.username,
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
  // promotion_threshold / demotion_threshold are null at the top/bottom tiers
  // (obsidian has no promotion; bronze has no demotion). Coerce to 0 so the
  // zone-row math (rank <= promotionZone) never blows up with null arithmetic.
  const league = {
    name: s.league,
    tierIndex: s.league_tier,
    tierTotal: 10,
    emoji: "💎",
    promotionZone: s.promotion_threshold ?? 0,
    demotionZone: s.demotion_threshold ?? 0,
    resetLabel: "",
  };
  return {
    league,
    myRow: weeklyMyRow ?? (s.my_row ? adaptLeaderboardEntry(s.my_row, true) : null),
    rankDeltaToday: s.rank_delta_today,
    dailyXp: Array.isArray(s.daily_xp) ? s.daily_xp : [],
    friendMedianDaily: Array.isArray(s.friend_median_daily_xp) ? s.friend_median_daily_xp : [],
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
      username: p.username,
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
