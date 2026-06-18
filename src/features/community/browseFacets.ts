/**
 * Shared Browse facet keys + deep-link builders.
 *
 * Owns the contract between surfaces that LINK INTO Browse (Contributors page,
 * profile "See their decks") and Browse itself (`ContentBrowserPage`). Keeping
 * the query-param keys in one module means the linking side and the facet UI
 * can't drift.
 *
 * The Browse facet UI is owned by another agent. As of this writing the
 * `creator` facet param is READ but the matching sidebar/chip UI may not be
 * wired yet.
 *
 * TODO(browse-agent): consume `creator` (and optional `creatorName`) in
 * ContentBrowserPage — filter results to `item.authorId === creatorId` and
 * render a removable "Creator: <name>" chip in the selected-facets row. Until
 * then the deep link still lands on Browse with the param present (no-op
 * filter), so this is safe to ship ahead of the facet UI.
 */

/** Query-param key carrying the author/creator user id to filter Browse by. */
export const BROWSE_CREATOR_FACET = "creator";

/** Optional companion key carrying a human-readable creator label for the chip. */
export const BROWSE_CREATOR_NAME_PARAM = "creatorName";

/**
 * Build a lang-relative path into Browse pre-filtered to one creator's
 * content. Pass through `useLangPath()` to prefix the language segment.
 */
export function browseCreatorPath(creatorId: string, creatorName?: string): string {
  const params = new URLSearchParams();
  params.set(BROWSE_CREATOR_FACET, creatorId);
  if (creatorName) params.set(BROWSE_CREATOR_NAME_PARAM, creatorName);
  return `community/browse?${params.toString()}`;
}
