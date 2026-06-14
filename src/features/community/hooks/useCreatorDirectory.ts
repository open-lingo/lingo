/**
 * useCreatorDirectory — resolve a content author's `userId` into a public
 * profile (username / display name / avatar) for rendering creator avatars on
 * community content.
 *
 * Backend gap: there is no `GET /users/{id}` lookup and `DeckResponse` only
 * carries an opaque `authorId` (no name / avatar). The closest real directory
 * is `GET /users/discover`, which returns `{user_id, username, display_name,
 * profile_picture_key}` for discoverable learners. We pull that list once and
 * index it by `user_id`. Authors not present in the directory (private
 * accounts, deactivated users) fall back to initials at render time.
 *
 * When a real `POST /users/batch` (resolve many ids → public summaries) ships,
 * swap the query body — the `resolveCreator(id)` consumer API stays stable.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useApi } from "@/shared/api/provider";
import type { PublicUserSummary } from "@/shared/api/users";

export type CreatorSummary = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
};

const DISCOVER_PAGE = 50;

function toCreator(u: PublicUserSummary): CreatorSummary {
  return {
    userId: u.user_id,
    username: u.username,
    displayName: u.display_name || u.username,
    avatarUrl: u.profile_picture_key ?? undefined,
  };
}

export type CreatorDirectory = {
  /** Resolve a creator by author id. Returns undefined when unknown. */
  resolveCreator: (userId: string | undefined | null) => CreatorSummary | undefined;
  /** All known creators (used by the contributors rail when richer aggregates are absent). */
  creators: CreatorSummary[];
  byId: Map<string, CreatorSummary>;
  isLoading: boolean;
};

export function useCreatorDirectory(): CreatorDirectory {
  const { users } = useApi();

  const query = useQuery({
    queryKey: ["community", "creator-directory"],
    queryFn: ({ signal }) => users.discover({ limit: DISCOVER_PAGE }, signal),
    // Author metadata changes rarely; the directory is a cross-rail lookup so a
    // long staleTime keeps the home page from re-fetching per section.
    staleTime: 10 * 60_000,
  });

  const byId = new Map<string, CreatorSummary>();
  for (const u of query.data?.users ?? []) {
    byId.set(u.user_id, toCreator(u));
  }

  const resolveCreator = useCallback(
    (userId: string | undefined | null) =>
      userId ? byId.get(userId) : undefined,
    // byId is rebuilt each render but its identity tracks the query data; key on
    // the query data reference to keep the callback stable between refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data],
  );

  return {
    resolveCreator,
    creators: Array.from(byId.values()),
    byId,
    isLoading: query.isLoading,
  };
}
