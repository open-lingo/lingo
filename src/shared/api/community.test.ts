/**
 * CommunityApi — happy-path coverage over the snake_case ↔ camelCase
 * boundary. Uses a fetch spy (no msw); same pattern as `client.test.ts`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommunityApi } from "./community";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }) as Response;
}

function makeClient() {
  return new CommunityApi({
    baseUrl: "https://api.test",
    getAccessToken: async () => "token",
    retryBaseDelay: 0,
  });
}

describe("CommunityApi", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("listCategories returns camelCase items", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse([
        {
          id: "c1",
          slug: "general",
          name_key: "forum.categoryGeneral",
          description_key: "forum.categoryGeneralDesc",
          sort_order: 0,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );

    const out = await makeClient().listCategories();
    expect(out).toEqual([
      {
        id: "c1",
        slug: "general",
        nameKey: "forum.categoryGeneral",
        descriptionKey: "forum.categoryGeneralDesc",
        sortOrder: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    const url = fetchSpy.mock.calls[0]?.[0] as string;
    expect(url).toBe("https://api.test/api/core/v1/community/categories");
  });

  it("listThreads serialises filters as snake_case query params and converts response", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse([
        {
          id: "t1",
          category_id: "c1",
          author_id: "u1",
          author_name: "Alex",
          title: "Hello",
          excerpt: "Hi",
          body_markdown: "# Hi",
          reply_count: 2,
          upvote_count: 5,
          downvote_count: 1,
          view_count: 10,
          is_pinned: false,
          status: "open",
          tag_ids: ["tag1"],
          content_links: [],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
        },
      ]),
    );

    const out = await makeClient().listThreads({
      sort: "new",
      categoryId: "c1",
      tagId: "tag1",
      limit: 25,
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "t1",
      categoryId: "c1",
      authorName: "Alex",
      replyCount: 2,
      upvoteCount: 5,
      tagIds: ["tag1"],
      contentLinks: [],
    });
    const url = new URL(fetchSpy.mock.calls[0]?.[0] as string);
    expect(url.pathname).toBe("/api/core/v1/community/threads");
    expect(url.searchParams.get("sort")).toBe("new");
    expect(url.searchParams.get("category_id")).toBe("c1");
    expect(url.searchParams.get("tag_id")).toBe("tag1");
    expect(url.searchParams.get("limit")).toBe("25");
  });

  it("createThread converts camelCase body to snake_case and back", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: "t2",
        category_id: "c1",
        author_id: "u1",
        author_name: "Alex",
        title: "T",
        excerpt: "E",
        body_markdown: "B",
        reply_count: 0,
        upvote_count: 0,
        downvote_count: 0,
        view_count: 0,
        is_pinned: false,
        status: "open",
        tag_ids: ["tag1"],
        content_links: [],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    );

    const out = await makeClient().createThread({
      categoryId: "c1",
      title: "T",
      bodyMarkdown: "B",
      tagIds: ["tag1"],
    });

    expect(out.categoryId).toBe("c1");
    expect(out.tagIds).toEqual(["tag1"]);

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      category_id: "c1",
      title: "T",
      body_markdown: "B",
      tag_ids: ["tag1"],
    });
  });

  it("createPost posts to /threads/{id}/posts with snake_case body", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse({
        id: "p1",
        thread_id: "t1",
        parent_id: null,
        author_id: "u1",
        author_name: "Alex",
        body_markdown: "Reply",
        upvote_count: 0,
        downvote_count: 0,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      }),
    );

    const out = await makeClient().createPost("t1", { bodyMarkdown: "Reply" });
    expect(out.threadId).toBe("t1");
    expect(out.bodyMarkdown).toBe("Reply");

    const url = fetchSpy.mock.calls[0]?.[0] as string;
    expect(url).toBe("https://api.test/api/core/v1/community/threads/t1/posts");
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body).toEqual({ body_markdown: "Reply" });
  });

  it("voteThread sends {value} and returns the ack", async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const out = await makeClient().voteThread("t1", 1);
    expect(out.status).toBe("ok");

    const url = fetchSpy.mock.calls[0]?.[0] as string;
    expect(url).toBe("https://api.test/api/core/v1/community/threads/t1/vote");
    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ value: 1 });
  });

  it("listTags returns camelCase items", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse([
        {
          id: "tag1",
          slug: "help",
          name: "help",
          color: "blue",
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );
    const out = await makeClient().listTags();
    expect(out[0]).toMatchObject({
      id: "tag1",
      slug: "help",
      name: "help",
      color: "blue",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });
});
