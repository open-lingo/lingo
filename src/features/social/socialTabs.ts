/** The social surface's primary navigation tabs (sidebar on desktop,
 *  horizontal strip on mobile). URL-synced via `?tab=` in `SocialPage`. */
export type SocialTab = "overview" | "friends" | "league" | "messages";

export const SOCIAL_TABS: readonly SocialTab[] = [
  "overview",
  "friends",
  "league",
  "messages",
];

/** Default tab (unrepresented in the URL — bare `/social` shows this). */
export const DEFAULT_SOCIAL_TAB: SocialTab = "overview";

export function isSocialTab(value: string | null): value is SocialTab {
  return value !== null && (SOCIAL_TABS as readonly string[]).includes(value);
}
