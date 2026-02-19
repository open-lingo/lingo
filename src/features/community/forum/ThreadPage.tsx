import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import ReactMarkdown from "react-markdown";
import { getThreadById, getPostsByThreadId, getTagById } from "./mockForum";
import { MarkdownEditor } from "./MarkdownEditor";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function VoteButtons({ up, down, userVote, onVote }: {
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
        className={`rounded p-1 ${userVote === 1 ? "text-green-600 dark:text-green-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"}`}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="text-sm font-medium tabular-nums">{score}</span>
      <button
        type="button"
        onClick={() => onVote?.(-1)}
        className={`rounded p-1 ${userVote === -1 ? "text-red-600 dark:text-red-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"}`}
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
  const { threadId } = useParams<{ threadId: string }>();
  const [replyBody, setReplyBody] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);

  const thread = threadId ? getThreadById(threadId) : undefined;
  const posts = thread ? getPostsByThreadId(thread.id) : [];

  if (!thread) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link to={langPath("community/forum")} className="text-sm text-gray-600 hover:underline dark:text-gray-400">
          ← {t("forum.backToForum")}
        </Link>
        <p className="text-gray-500 dark:text-gray-400">{t("forum.threadNotFound")}</p>
      </div>
    );
  }

  const tags = thread.tagIds.map((tid) => getTagById(tid)).filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={langPath("community/forum")} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        ← {t("forum.backToForum")}
      </Link>

      {/* Thread */}
      <article className="flex gap-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="shrink-0">
          <VoteButtons
            up={thread.upvoteCount}
            down={thread.downvoteCount}
            userVote={thread.userVote}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {thread.isPinned && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                {t("forum.pinned")}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag!.id}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag!.name}
              </span>
            ))}
          </div>
          <h1 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {thread.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {thread.authorName} · {formatDate(thread.createdAt)}
          </p>
          <div className="prose prose-sm mt-4 max-w-none dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown>{thread.bodyMarkdown}</ReactMarkdown>
          </div>
        </div>
      </article>

      {/* Replies */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {thread.replyCount} {t("forum.replies")}
        </h2>
        <div className="mt-4 space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="shrink-0">
                <VoteButtons
                  up={post.upvoteCount}
                  down={post.downvoteCount}
                  userVote={post.userVote}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.authorName} · {formatDate(post.createdAt)}
                </p>
                <div className="prose prose-sm mt-2 max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                  <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reply form */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
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
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {t("forum.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Mock: would submit to API
                  setReplyBody("");
                  setShowReplyForm(false);
                }}
                disabled={!replyBody.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {t("forum.postReply")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowReplyForm(true)}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("forum.writeReply")}
          </button>
        )}
      </section>
    </div>
  );
}
