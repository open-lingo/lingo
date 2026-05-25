/**
 * Shared types extracted out of `useSocial.ts` so the adapter layer (which
 * the hooks themselves import from) can reference them without a circular
 * dependency.
 */
import type { LeaderboardRow } from "../mock/mockSocial";

export type LeagueInfo = {
  name: string;
  tierIndex: number;
  tierTotal: number;
  emoji: string;
  promotionZone: number;
  demotionZone: number;
  resetLabel: string;
};

/** League info + the user's current row + day-over-day delta. */
export type LeagueSpotlight = {
  league: LeagueInfo;
  myRow: LeaderboardRow | null;
  /** rankYesterday − rankToday (positive = climbed). */
  rankDeltaToday: number;
  dailyXp: number[];
  friendMedianDaily: number[];
};
