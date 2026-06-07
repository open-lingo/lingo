/**
 * Community / forum API client.
 *
 * Mirrors the backend at /api/core/v1/community/ — categories, tags,
 * threads, posts, addons, markdown. Backend wire format is snake_case
 * (see lingo-core/app/community/schemas.py); FE-facing TS interfaces
 * are camelCase. Conversion happens at the boundary via `_toCamel`.
 */

import { ApiClient } from "./client";

const PREFIX = "/api/core/v1/community";

// ── FE-facing types (camelCase) ───────────────────────────────

export interface CommunityCategory {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityTag {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  createdAt: string | null;
}

export interface CommunityContentLink {
  id: string;
  threadId: string;
  contentType: string;
  contentId: string;
  languageId: string | null;
  createdAt: string;
}

export interface CommunityThread {
  id: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  title: string;
  excerpt: string;
  bodyMarkdown: string;
  replyCount: number;
  upvoteCount: number;
  downvoteCount: number;
  viewCount: number;
  isPinned: boolean;
  status: string;
  tagIds: string[];
  contentLinks: CommunityContentLink[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  threadId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  bodyMarkdown: string;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityAddon {
  id: string;
  kind: string;
  languageId: string;
  name: string;
  description: string;
  sourceUrl: string | null;
  authorId: string;
  upvoteCount: number;
  itemCount: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMarkdown {
  key: string;
  content: string;
  contentType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Why: backend POST/DELETE vote endpoints currently return `{status: "ok"}`,
// NOT `{upvotes, downvotes, my_vote}` as the task spec promised. The richer
// shape doesn't exist yet — callers must re-fetch the thread/post (or use
// optimistic state) to get fresh counts. Track this gap.
export interface ThreadVoteState {
  status: "ok";
}

export interface CommunityContentLinkCreate {
  contentType: string;
  contentId: string;
  languageId?: string | null;
}

export interface CommunityThreadCreate {
  categoryId: string;
  title: string;
  excerpt?: string;
  bodyMarkdown?: string;
  tagIds?: string[];
  contentLinks?: CommunityContentLinkCreate[];
}

export interface CommunityThreadPatch {
  title?: string;
  excerpt?: string;
  bodyMarkdown?: string;
  status?: string;
}

export interface CommunityPostCreate {
  parentId?: string | null;
  bodyMarkdown?: string;
}

export interface CommunityPostPatch {
  bodyMarkdown?: string;
}

export interface CommunityTagCreate {
  slug: string;
  name: string;
  color?: string | null;
}

export interface CommunityAddonCreate {
  kind: string;
  languageId: string;
  name: string;
  description?: string;
  sourceUrl?: string | null;
  itemCount?: number | null;
  status?: string;
}

export interface CommunityAddonPatch {
  name?: string;
  description?: string;
  sourceUrl?: string | null;
  itemCount?: number | null;
  status?: string;
}

export interface CommunityMarkdownStore {
  key: string;
  content?: string;
  contentType?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ── snake_case ↔ camelCase converters ────────────────────────

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

function _toCamel<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => _toCamel(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeToCamel(k)] = _toCamel(v);
    }
    return out as T;
  }
  return value as T;
}

function _toSnake<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => _toSnake(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[camelToSnake(k)] = _toSnake(v);
    }
    return out as T;
  }
  return value as T;
}

// ── Client ────────────────────────────────────────────────────

export class CommunityApi extends ApiClient {
  // Categories

  async listCategories(signal?: AbortSignal): Promise<CommunityCategory[]> {
    const raw = await this.get<unknown[]>(`${PREFIX}/categories`, {
      signal,
      tag: "community:categories:list",
    });
    return _toCamel<CommunityCategory[]>(raw);
  }

  async getCategory(categoryId: string, signal?: AbortSignal): Promise<CommunityCategory> {
    const raw = await this.get<unknown>(
      `${PREFIX}/categories/${encodeURIComponent(categoryId)}`,
      { signal, tag: `community:category:${categoryId}` },
    );
    return _toCamel<CommunityCategory>(raw);
  }

  // Tags

  async listTags(signal?: AbortSignal): Promise<CommunityTag[]> {
    const raw = await this.get<unknown[]>(`${PREFIX}/tags`, {
      signal,
      tag: "community:tags:list",
    });
    return _toCamel<CommunityTag[]>(raw);
  }

  async createTag(body: CommunityTagCreate, signal?: AbortSignal): Promise<CommunityTag> {
    const raw = await this.post<unknown>(`${PREFIX}/tags`, _toSnake(body), {
      signal,
      tag: "community:tags:create",
    });
    return _toCamel<CommunityTag>(raw);
  }

  // Threads

  async listThreads(
    params?: {
      categoryId?: string;
      tagId?: string;
      contentType?: string;
      contentId?: string;
      sort?: "hot" | "new";
      limit?: number;
      offset?: number;
    },
    signal?: AbortSignal,
  ): Promise<CommunityThread[]> {
    const p = params ?? {};
    const queryParams: Record<string, string | number | undefined> = {
      category_id: p.categoryId,
      tag_id: p.tagId,
      content_type: p.contentType,
      content_id: p.contentId,
      sort: p.sort,
      limit: p.limit,
      offset: p.offset,
    };
    const raw = await this.get<unknown[]>(`${PREFIX}/threads`, {
      params: queryParams,
      signal,
      tag: "community:threads:list",
    });
    return _toCamel<CommunityThread[]>(raw);
  }

  async createThread(
    body: CommunityThreadCreate,
    signal?: AbortSignal,
  ): Promise<CommunityThread> {
    const raw = await this.post<unknown>(`${PREFIX}/threads`, _toSnake(body), {
      signal,
      tag: "community:threads:create",
    });
    return _toCamel<CommunityThread>(raw);
  }

  async getThread(threadId: string, signal?: AbortSignal): Promise<CommunityThread> {
    const raw = await this.get<unknown>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}`,
      { signal, tag: `community:thread:${threadId}` },
    );
    return _toCamel<CommunityThread>(raw);
  }

  async updateThread(
    threadId: string,
    body: CommunityThreadPatch,
    signal?: AbortSignal,
  ): Promise<CommunityThread> {
    const raw = await this.patch<unknown>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}`,
      _toSnake(body),
      { signal, tag: `community:thread:update:${threadId}` },
    );
    return _toCamel<CommunityThread>(raw);
  }

  async voteThread(
    threadId: string,
    value: 1 | -1,
    signal?: AbortSignal,
  ): Promise<ThreadVoteState> {
    const raw = await this.post<unknown>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}/vote`,
      { value },
      { signal, tag: `community:thread:vote:${threadId}` },
    );
    return _toCamel<ThreadVoteState>(raw);
  }

  async removeThreadVote(threadId: string, signal?: AbortSignal): Promise<ThreadVoteState> {
    const raw = await this.delete<unknown>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}/vote`,
      { signal, tag: `community:thread:vote-remove:${threadId}` },
    );
    return _toCamel<ThreadVoteState>(raw);
  }

  // Posts

  async listPosts(
    threadId: string,
    params?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ): Promise<CommunityPost[]> {
    const raw = await this.get<unknown[]>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}/posts`,
      {
        params: params as Record<string, number | undefined>,
        signal,
        tag: `community:posts:${threadId}`,
      },
    );
    return _toCamel<CommunityPost[]>(raw);
  }

  async createPost(
    threadId: string,
    body: CommunityPostCreate,
    signal?: AbortSignal,
  ): Promise<CommunityPost> {
    const raw = await this.post<unknown>(
      `${PREFIX}/threads/${encodeURIComponent(threadId)}/posts`,
      _toSnake(body),
      { signal, tag: `community:posts:create:${threadId}` },
    );
    return _toCamel<CommunityPost>(raw);
  }

  async updatePost(
    postId: string,
    body: CommunityPostPatch,
    signal?: AbortSignal,
  ): Promise<CommunityPost> {
    const raw = await this.patch<unknown>(
      `${PREFIX}/posts/${encodeURIComponent(postId)}`,
      _toSnake(body),
      { signal, tag: `community:post:update:${postId}` },
    );
    return _toCamel<CommunityPost>(raw);
  }

  async votePost(
    postId: string,
    value: 1 | -1,
    signal?: AbortSignal,
  ): Promise<ThreadVoteState> {
    const raw = await this.post<unknown>(
      `${PREFIX}/posts/${encodeURIComponent(postId)}/vote`,
      { value },
      { signal, tag: `community:post:vote:${postId}` },
    );
    return _toCamel<ThreadVoteState>(raw);
  }

  // Content links

  async listThreadsByContent(
    contentType: string,
    contentId: string,
    params?: { limit?: number },
    signal?: AbortSignal,
  ): Promise<CommunityThread[]> {
    const raw = await this.get<unknown[]>(
      `${PREFIX}/content/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/threads`,
      {
        params: params as Record<string, number | undefined>,
        signal,
        tag: `community:threads-by-content:${contentType}:${contentId}`,
      },
    );
    return _toCamel<CommunityThread[]>(raw);
  }

  // Addons

  async listAddons(
    params?: {
      kind?: string;
      languageId?: string;
      addonStatus?: string;
      authorId?: string;
      limit?: number;
      offset?: number;
    },
    signal?: AbortSignal,
  ): Promise<CommunityAddon[]> {
    const p = params ?? {};
    const queryParams: Record<string, string | number | undefined> = {
      kind: p.kind,
      language_id: p.languageId,
      addon_status: p.addonStatus,
      author_id: p.authorId,
      limit: p.limit,
      offset: p.offset,
    };
    const raw = await this.get<unknown[]>(`${PREFIX}/addons`, {
      params: queryParams,
      signal,
      tag: "community:addons:list",
    });
    return _toCamel<CommunityAddon[]>(raw);
  }

  async createAddon(
    body: CommunityAddonCreate,
    signal?: AbortSignal,
  ): Promise<CommunityAddon> {
    const raw = await this.post<unknown>(`${PREFIX}/addons`, _toSnake(body), {
      signal,
      tag: "community:addons:create",
    });
    return _toCamel<CommunityAddon>(raw);
  }

  async getAddon(addonId: string, signal?: AbortSignal): Promise<CommunityAddon> {
    const raw = await this.get<unknown>(
      `${PREFIX}/addons/${encodeURIComponent(addonId)}`,
      { signal, tag: `community:addon:${addonId}` },
    );
    return _toCamel<CommunityAddon>(raw);
  }

  async updateAddon(
    addonId: string,
    body: CommunityAddonPatch,
    signal?: AbortSignal,
  ): Promise<CommunityAddon> {
    const raw = await this.patch<unknown>(
      `${PREFIX}/addons/${encodeURIComponent(addonId)}`,
      _toSnake(body),
      { signal, tag: `community:addon:update:${addonId}` },
    );
    return _toCamel<CommunityAddon>(raw);
  }

  async putAddonDeck(
    addonId: string,
    cards: Record<string, unknown>[],
    signal?: AbortSignal,
  ): Promise<{ ok: boolean; cardCount: number }> {
    const raw = await this.put<unknown>(
      `${PREFIX}/addons/${encodeURIComponent(addonId)}/deck`,
      { cards },
      { signal, tag: `community:addon:deck-put:${addonId}` },
    );
    return _toCamel<{ ok: boolean; cardCount: number }>(raw);
  }

  async getAddonDeck(
    addonId: string,
    signal?: AbortSignal,
  ): Promise<{ cards: Record<string, unknown>[] }> {
    return this.get<{ cards: Record<string, unknown>[] }>(
      `${PREFIX}/addons/${encodeURIComponent(addonId)}/deck`,
      { signal, tag: `community:addon:deck-get:${addonId}` },
    );
  }

  // Markdown

  async storeMarkdown(
    body: CommunityMarkdownStore,
    signal?: AbortSignal,
  ): Promise<CommunityMarkdown> {
    const raw = await this.put<unknown>(`${PREFIX}/markdown`, _toSnake(body), {
      signal,
      tag: `community:markdown:store:${body.key}`,
    });
    return _toCamel<CommunityMarkdown>(raw);
  }

  async getMarkdown(key: string, signal?: AbortSignal): Promise<CommunityMarkdown> {
    const raw = await this.get<unknown>(
      `${PREFIX}/markdown/${key.split("/").map(encodeURIComponent).join("/")}`,
      { signal, tag: `community:markdown:get:${key}` },
    );
    return _toCamel<CommunityMarkdown>(raw);
  }

  async deleteMarkdown(key: string, signal?: AbortSignal): Promise<{ deleted: boolean }> {
    return this.delete<{ deleted: boolean }>(
      `${PREFIX}/markdown/${key.split("/").map(encodeURIComponent).join("/")}`,
      { signal, tag: `community:markdown:delete:${key}` },
    );
  }
}
