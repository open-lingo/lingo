import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/tags";

/**
 * One canonical, admin-curated deck tag.
 *
 * Mirrors `app/tags/schemas.py:TagResponse` on the backend. Slugs follow the
 * pattern `^[a-z][a-z0-9-]{1,40}$` and are the stable identifier; everything
 * else (display name, description, color) is mutable via the admin tag UI.
 */
export interface Tag {
  slug: string;
  display_name: string;
  description?: string | null;
  color?: string | null;
  created_at?: string | null;
}

/**
 * Public read-only client for the canonical tag dictionary. Used by:
 *  - the community-browse facet sidebar (tag filter chips)
 *  - the deck create / edit pages (tag picker — wiring lands in a follow-up
 *    once the parallel UI redesign settles)
 *
 * No Auth0 token required — the GET endpoint is public so the funding meter
 * / community browse can paint without waiting on auth.
 */
export class TagsApi extends ApiClient {
  /** All canonical tags, sorted by slug on the server. */
  async listTags(signal?: AbortSignal): Promise<Tag[]> {
    return this.get<Tag[]>(PREFIX, { signal, tag: "tags:list" });
  }
}
