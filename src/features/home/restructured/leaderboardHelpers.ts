import type { LeaderboardRow } from "@/features/social/types";

export type LeaderboardView = {
  /** Rows to render — always includes the leader; the viewer is force-kept in
   *  view even when ranked below the cutoff. */
  visible: LeaderboardRow[];
  myRow: LeaderboardRow | null;
  /** Friend ranked directly above the viewer, if any. */
  aboveMe: LeaderboardRow | null;
  /** XP needed to overtake the friend above — null when leading / no rows. */
  xpToOvertake: number | null;
};

export function buildLeaderboardView(
  rows: LeaderboardRow[],
  rowLimit = 4,
): LeaderboardView {
  const meIdx = rows.findIndex((r) => r.isMe);
  const myRow = meIdx >= 0 ? rows[meIdx] : null;
  const aboveMe = meIdx > 0 ? rows[meIdx - 1] : null;
  const xpToOvertake = aboveMe && myRow ? aboveMe.xp - myRow.xp + 1 : null;

  const top = rows.slice(0, rowLimit);
  const visible =
    myRow && !top.some((r) => r.isMe)
      ? [...rows.slice(0, rowLimit - 1), myRow]
      : top;

  return { visible, myRow, aboveMe, xpToOvertake };
}
