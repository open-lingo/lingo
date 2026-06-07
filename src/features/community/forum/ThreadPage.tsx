import { useState } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { MarkdownRenderer } from "@/shared/components/MarkdownRenderer";
import { CenteredLoader } from "@/shared/components/ui/CenteredLoader";
import { useApi } from "@/shared/api";
import type {
  CommunityPost,
  CommunityTag,
  CommunityThread,
} from "@/shared/api/community";
import { MarkdownEditor } from "./MarkdownEditor";
import { useDateFormat } from "@/shared/utils/formatDate";
import { useToast } from "@/shared/contexts/ToastContext";

type VoteTarget =
  | { kind: "thread"; id: string }
  | { kind: "post"; id: string };

function VoteButtons({
  up,
  down,
  userVote,
  onVote,
}: {
  up: number;
  down: number;
  userVote?: 1 | -1;
  onVote?: (v: 1 | -1) => void;
}) {
  const score = up - down;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={() => onVote?.(1)}
        className={`rounded p-1 ${userVote === 1 ? "text-accent" : "text-gray-500 hover:text-gray-700"}`}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="text-sm font-medium tabular-nums">{score}</span>
      <button
        type="button"
        onClick={() => onVote?.(-1)}
        className={`rounded p-1 ${userVote === -1 ? "text-destructive" : "text-gray-500 hover:text-gray-700"}`}
        aria-label="Downvote"
      >
        ▼
      </button>
    </div>
  );
}

export function ThreadPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { formatDate } = useDateFormat();
  const { threadId } = useParams<{ threadId: string }>();
  const { community } = useApi();
  const qc = useQueryClient();
  const { showToast } = useToast();

  const [replyBody, setReplyBody] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  const threadQuery = useQuery<CommunityThread>({
    queryKey: ["community", "thread", threadId],
    queryFn: ({ signal }) => community.getThread(threadId!, signal),
    enabled: Boolean(threadId),
    staleTime: 60_000,
  });

  const postsQuery = useQuery<CommunityPost[]>({
    queryKey: ["community", "thread", threadId, "posts"],
    queryFn: ({ signal }) => community.listPosts(threadId!, undefined, signal),
    enabled: Boolean(threadId),
    staleTime: 60_000,
  });

  const tagsQuery = useQuery<CommunityTag[]>({
    queryKey: ["community", "tags"],
    queryFn: ({ signal }) => community.listTags(signal),
    staleTime: 5 * 60_000,
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) =>
      community.createPost(threadId!, { bodyMarkdown: body }),
    onSuccess: () => {
      setReplyBody("");
      setShowReplyForm(false);
      qc.invalidateQueries({ queryKey: ["community", "thread", threadId, "posts"] });
      qc.invalidateQueries({ queryKey: ["community", "thread", threadId] });
    },
    onError: () => {
      showToast(t("forum.replyError") ?? "Could not post reply", "error");
    },
  });

  // Why: backend vote endpoints return `{status: "ok"}` only — no fresh counts.
  // We optimistically bump the cached thread/post and re-fetch on error.
  const voteMutation = useMutation({
    mutationFn: ({ target, value }: { target: VoteTarget; value: 1 | -1 }) =>
      target.kind === "thread"
        ? community.voteThread(target.id, value)
        : community.votePost(target.id, value),
    onMutate: async ({ target, value }) => {
      if (target.kind === "thread") {
        await qc.cancelQueries({ queryKey: ["community", "thread", target.id] });
        const prev = qc.getQueryData<CommunityThread>(["community", "thread", target.id]);
        if (prev) {
          qc.setQueryData<CommunityThread>(["community", "thread", target.id], {
            ...prev,
            upvoteCount: prev.upvoteCount + (value === 1 ? 1 : 0),
            downvoteCount: prev.downvoteCount + (value === -1 ? 1 : 0),
          });
        }
        return { prev };
      }
      const key = ["community", "thread", threadId, "posts"] as const;
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<CommunityPost[]>(key);
      if (prevList) {
        qc.setQueryData<CommunityPost[]>(
          key,
          prevList.map((p) =>
            p.id === target.id
              ? {
                  ...p,
                  upvoteCount: p.upvoteCount + (value === 1 ? 1 : 0),
                  downvoteCount: p.downvoteCount + (value === -1 ? 1 : 0),
                }
              : p,
          ),
        );
      }
      return { prevList };
    },
    onError: (_err, { target }, ctx) => {
      if (target.kind === "thread" && ctx && "prev" in ctx && ctx.prev) {
        qc.setQueryData(["community", "thread", target.id], ctx.prev);
      } else if (target.kind === "post" && ctx && "prevList" in ctx && ctx.prevList) {
        qc.setQueryData(["community", "thread", threadId, "posts"], ctx.prevList);
      }
      showToast(t("forum.voteError") ?? "Could not record vote", "error");
    },
  });

  if (threadQuery.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <CenteredLoader py="lg" />
      </div>
    );
  }

  const thread = threadQuery.data;
  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link to={langPath("community/discuss")} className="text-sm text-gray-600 hover:underline">
          <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("forum.backToForum")}
        </Link>
        <p className="text-text-muted">{t("forum.threadNotFound")}</p>
      </div>
    );
  }

  const posts = postsQuery.data ?? [];
  const tagById = new Map((tagsQuery.data ?? []).map((tag) => [tag.id, tag]));
  const threadTags = thread.tagIds
    .map((tid) => tagById.get(tid))
    .filter((tag): tag is CommunityTag => Boolean(tag));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={langPath("community/discuss")} className="text-sm text-gray-600 hover:text-gray-900">
        <Icon name="arrowBigLeft" size={16} className="mr-1 inline" /> {t("forum.backToForum")}
      </Link>

      {/* Thread */}
      <article className="flex gap-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="shrink-0">
          <VoteButtons
            up={thread.upvoteCount}
            down={thread.downvoteCount}
            onVote={(v) =>
              voteMutation.mutate({ target: { kind: "thread", id: thread.id }, value: v })
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.isPinned && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                {t("forum.pinned")}
              </span>
            )}
            {threadTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {tag.name}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-xl font-bold text-text-primary">
            {thread.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {thread.authorName} · {formatDate(thread.createdAt)}
          </p>
          <div className="mt-4">
            <MarkdownRenderer>{thread.bodyMarkdown}</MarkdownRenderer>
          </div>
        </div>
      </article>

      {/* Replies */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary">
          {thread.replyCount} {t("forum.replies")}
        </h2>
        <div className="mt-4 space-y-4">
          {postsQuery.isLoading ? (
            <CenteredLoader py="md" />
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="shrink-0">
                  <VoteButtons
                    up={post.upvoteCount}
                    down={post.downvoteCount}
                    onVote={(v) =>
                      voteMutation.mutate({
                        target: { kind: "post", id: post.id },
                        value: v,
                      })
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-muted">
                    {post.authorName} · {formatDate(post.createdAt)}
                  </p>
                  <div className="mt-2">
                    <MarkdownRenderer>{post.bodyMarkdown}</MarkdownRenderer>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Reply form */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("forum.reply")}
        </h2>
        {showReplyForm ? (
          <div className="mt-4 space-y-4">
            <MarkdownEditor
              value={replyBody}
              onChange={setReplyBody}
              placeholder={t("forum.replyPlaceholder")}
              minRows={4}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setReplyBody("");
                  setShowReplyForm(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("forum.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!replyBody.trim()) return;
                  replyMutation.mutate(replyBody);
                }}
                disabled={!replyBody.trim() || replyMutation.isPending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {t("forum.postReply")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowReplyForm(true)}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t("forum.writeReply")}
          </button>
        )}
      </section>
    </div>
  );
}
