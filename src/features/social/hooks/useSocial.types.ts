import type { LeaderboardRow, LeagueInfo } from "../types";

export type { LeagueInfo } from "../types";

export type LeagueSpotlight = {
  league: LeagueInfo;
  myRow: LeaderboardRow | null;
  rankDeltaToday: number;
  dailyXp: number[];
  friendMedianDaily: number[];
};
