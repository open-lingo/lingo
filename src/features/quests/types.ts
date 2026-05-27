/**
 * Quest system — data model.
 *
 * Quests are user-facing goals with progress + rewards. Four flavors:
 *   - daily   : resets every 24h. "Earn 50 XP today."
 *   - weekly  : resets every 7 days. "Master 2 modules this week."
 *   - random  : ad-hoc, expiring. "Try a story today (next 6h)."
 *   - friend  : tied to a friend. "Beat Sora in XP this week."
 *
 * Localization: `title` / `description` carry i18n KEYS (e.g.
 * "quests.daily.fiftyXp.title") rendered with t() at the view layer. The
 * fallback raw text shipped in mock data is the English copy — production
 * data will only ship the keys.
 */

export type QuestType = "daily" | "weekly" | "random" | "friend";

/**
 * - active     : user is making progress, target not yet hit
 * - claimable  : progress.current >= target — show "Claim" CTA
 * - completed  : claimed; reward credited
 * - expired    : `expiresAt` passed without completion
 *
 * NOTE: "completed" only fires after the user explicitly claims the
 * reward. We never auto-claim — claiming is the dopamine moment.
 */
export type QuestStatus = "active" | "claimable" | "completed" | "expired";

export type QuestRewards = {
  /** In-app currency. */
  lingots?: number;
  /** Bonus XP credited on claim. */
  xp?: number;
  /** Minutes of ad-free playback. Granted via `useBuyAdFreeTime` /
   *  `useAdFreeStatus` in `features/adFree/`. */
  adFreeMinutes?: number;
  /** "Streak shield" — saves a streak on a missed day. */
  streakShield?: boolean;
};

export type QuestProgress = {
  /** Current count of the tracked metric (XP, lessons, reviews, etc.). */
  current: number;
  /** Threshold to mark as claimable. */
  target: number;
  /** Display unit — "XP", "lessons", "cards", "minutes", etc. */
  unit: string;
};

export type Quest = {
  id: string;
  type: QuestType;
  /** i18n key — fall back to literal string in mock data. */
  title: string;
  /** i18n key — fall back to literal string in mock data. */
  description: string;
  /** Hero emoji for the quest card. */
  emoji: string;
  progress: QuestProgress;
  rewards: QuestRewards;
  /** Unix ms timestamp. Undefined = no expiry (rare). */
  expiresAt?: number;
  /** For "friend" quests. */
  friendId?: string;
  friendDisplayName?: string;
  /** Computed state. Persisted so claimable/completed flips survive reload. */
  status: QuestStatus;
};

/** Storage shape — only mutable fields are kept; static metadata derives
 *  from the catalog merge on read. */
export type QuestStorageEntry = {
  id: string;
  current: number;
  status: QuestStatus;
  claimedAt?: number;
};
