/**
 * League tier ladder — static reference data for the leagues modal and any
 * other tier-aware UI. The backend already returns the user's current
 * ``league_tier`` index; this file maps that index to a human label,
 * emoji, and rough XP threshold so we can render the full ladder.
 *
 * Order: index 0 = lowest tier (Bronze), index N-1 = highest (Diamond+).
 * Modal displays the highest tier at the top.
 *
 * The XP thresholds are intentional design placeholders — they describe
 * the weekly XP roughly needed to *reach* that tier, not a hard backend
 * gate. They're surfaced to the player as soft targets in the modal.
 */

export type LeagueTier = {
  index: number;
  name: string;
  emoji: string;
  /** Approximate weekly XP needed to land in this tier. */
  weeklyXpThreshold: number;
  /** One-sentence description used in the modal subtitle. */
  description: string;
};

export const LEAGUE_TIERS: LeagueTier[] = [
  {
    index: 0,
    name: "Bronze League",
    emoji: "🥉",
    weeklyXpThreshold: 0,
    description: "Welcome tier — every learner starts here.",
  },
  {
    index: 1,
    name: "Silver League",
    emoji: "🥈",
    weeklyXpThreshold: 200,
    description: "A few lessons a week keeps you in the running.",
  },
  {
    index: 2,
    name: "Gold League",
    emoji: "🥇",
    weeklyXpThreshold: 500,
    description: "Hitting daily streaks puts you on the leaderboard.",
  },
  {
    index: 3,
    name: "Emerald League",
    emoji: "💚",
    weeklyXpThreshold: 900,
    description: "Consistent daily learners climb into Emerald.",
  },
  {
    index: 4,
    name: "Sapphire League",
    emoji: "💎",
    weeklyXpThreshold: 1_400,
    description: "Multiple lessons a day — committed learners.",
  },
  {
    index: 5,
    name: "Ruby League",
    emoji: "❤️",
    weeklyXpThreshold: 2_000,
    description: "Top quartile of weekly XP earners.",
  },
  {
    index: 6,
    name: "Amethyst League",
    emoji: "🟣",
    weeklyXpThreshold: 2_800,
    description: "Heavy investors in their language journey.",
  },
  {
    index: 7,
    name: "Pearl League",
    emoji: "🤍",
    weeklyXpThreshold: 3_800,
    description: "Power-user territory.",
  },
  {
    index: 8,
    name: "Obsidian League",
    emoji: "⚫",
    weeklyXpThreshold: 5_200,
    description: "Top 5% of weekly XP — fluent in grind.",
  },
  {
    index: 9,
    name: "Diamond League",
    emoji: "💠",
    weeklyXpThreshold: 7_500,
    description: "The peak. Reserved for the top 1%.",
  },
];

/** Total tier count — matches `LeagueInfo.tierTotal` from the API. */
export const LEAGUE_TIER_TOTAL = LEAGUE_TIERS.length;

/** Look up a tier by index, clamped to the valid range. */
export function getLeagueTier(index: number): LeagueTier {
  const clamped = Math.max(0, Math.min(LEAGUE_TIERS.length - 1, index));
  return LEAGUE_TIERS[clamped];
}
