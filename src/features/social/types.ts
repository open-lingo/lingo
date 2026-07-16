import type { AvatarFrame } from "./components/UserAvatar";
import type { UsernameCosmetic } from "./components/UsernameDisplay";

export type SocialUser = {
  id: string;
  name: string;
  username?: string;
  imageUrl?: string;
  language: { code: string; flag: string; label: string };
  streakDays: number;
  totalXp: number;
  lessonsCompleted: number;
  status: "active" | "idle";
  lastActiveLabel: string;
  frame?: AvatarFrame;
  cosmetic?: UsernameCosmetic;
};

export type FriendQuest = {
  labelKey: string;
  labelDefault: string;
  you: number;
  friend: number;
  friendName: string;
  partnerId: string;
};

export type HomeFriendPreview = {
  id: string;
  name: string;
  username?: string;
  streak: number;
  status: "active" | "idle";
};

export type ReactionKind = "wave" | "fire" | "clap" | "target";

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  wave: "👋",
  fire: "🔥",
  clap: "👏",
  target: "🎯",
};

export type ActivityReaction = {
  kind: ReactionKind;
  count: number;
  mine?: boolean;
};

export type ActivityItem = {
  id: string;
  user: SocialUser;
  kind: "streak" | "module" | "league" | "joined" | "milestone";
  text: string;
  timeLabel: string;
  kudosCount: number;
  reactions?: ActivityReaction[];
};

export type LeaderboardRow = {
  rank: number;
  user: SocialUser;
  xp: number;
  lessons: number;
  delta: "up" | "down" | "same";
  rankDelta?: number;
  isMe?: boolean;
};

export type LeagueInfo = {
  name: string;
  tierIndex: number;
  tierTotal: number;
  emoji: string;
  promotionZone: number;
  demotionZone: number;
  resetLabel: string;
};

export type StreakSnapshot = {
  mine: number;
  friendMedian: number;
  friendTop: number;
};

export type InviteOffer = {
  code: string;
  url: string;
  rewardLingots: number;
  rewardAdFreeHours: number;
  acceptedCount: number;
  acceptedCap: number;
};
