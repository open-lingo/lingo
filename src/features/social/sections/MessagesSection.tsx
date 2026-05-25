/**
 * Messages tab — thread list (left) + active conversation (right). 1-1 only
 * for v1; group chat / voice / read receipts are out of scope.
 *
 * Active thread is selected by local state. The thread list comes from
 * `useThreads()` (real API when enabled, mock otherwise). When a thread is
 * selected we lazy-load its messages via `socialApi.getThread(threadId)` so
 * the seeded history (Trevor↔Sora, Trevor↔Kenji) actually paints.
 *
 * Composer is currently local-only: there is no `POST /threads/{id}/messages`
 * endpoint yet, so optimistic sends append to client state with a clear UX
 * hint ("Saved locally") and do NOT persist on the server.
 *
 * TODO(backend): POST /social/threads/{thread_id}/messages → 201 Message
 * TODO(backend): POST /social/threads/with/{user_id} → 200 ThreadItem
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState } from "@/shared/components/EmptyState";
import { cn } from "@/shared/components/ui/cn";
import { UserAvatar } from "../components/UserAvatar";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { KudosButton } from "../components/KudosButton";
import { useThreads } from "../hooks/useSocial";
import { useApiOptional } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { adaptThreadDetail } from "../hooks/socialAdapters";
import type { ChatMessage, ChatThread } from "../mock/mockSocial";

type Props = {
  /** Pre-select a thread by user id (deep-link path param `friendId`). */
  initialFriendId?: string;
  /** Tailwind height utility for the container. Default keeps card height. */
  heightClassName?: string;
};

export function MessagesSection({ initialFriendId, heightClassName }: Props = {}) {
  const { t } = useTranslation();
  const { data, isLoading } = useThreads();
  const apiOpt = useApiOptional();
  const { user: auth0User, isAuthenticated } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [mobilePane, setMobilePane] = useState<"list" | "thread">(
    initialFriendId ? "thread" : "list",
  );

  // Hydrate local thread state once data lands. Subsequent edits (sends)
  // live in local state until the real API offers a send-message endpoint.
  useEffect(() => {
    if (!data || threads.length > 0) return;
    setThreads(data);
    const initial =
      (initialFriendId && data.find((th) => th.user.id === initialFriendId)) || data[0];
    if (initial) setActiveId(initial.id);
  }, [data, threads.length, initialFriendId]);

  // Resolve the current user's backend id so message bubbles can correctly
  // mark "me". We use the lightweight `users.getMe()` call already
  // memoized by `useApi`. Falls back to the auth0 sub when offline / mock.
  const meQuery = useQuery({
    queryKey: ["users", auth0User?.sub ?? "anon", "me"],
    queryFn: () => apiOpt!.users.getMe(),
    enabled: !!apiOpt && isAuthenticated,
    staleTime: 60_000,
  });
  const meUserId = meQuery.data?.id ?? null;

  // When a thread is selected and we don't have its messages yet, fetch the
  // detail and splice in the seeded history. Subsequent local sends append
  // to that array.
  const needsDetail = useMemo(() => {
    if (!activeId) return false;
    const thread = threads.find((th) => th.id === activeId);
    return !!thread && thread.messages.length === 0;
  }, [activeId, threads]);

  // Only fetch detail when we have a live API client AND the active id
  // looks like a server UUID (rules out mock thread ids that are prefixed
  // with `t-`). The mock threads already carry their seed messages inline.
  const looksLikeServerId = /^[0-9a-f-]{8,}$/i.test(activeId);
  const detailQuery = useQuery({
    queryKey: ["social", "thread-detail", activeId],
    queryFn: () => apiOpt!.social.getThread(activeId),
    enabled: !!apiOpt && needsDetail && looksLikeServerId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const hydrated = adaptThreadDetail(detailQuery.data, meUserId);
    setThreads((prev) =>
      prev.map((th) =>
        th.id === hydrated.id ? { ...th, messages: hydrated.messages } : th,
      ),
    );
  }, [detailQuery.data, meUserId]);

  if (isLoading || threads.length === 0) {
    if (!isLoading && (data?.length ?? 0) === 0) {
      return (
        <Card padding="md">
          <EmptyState
            icon={<Icon name="messageCircle" size={20} aria-hidden />}
            title={t("social.messages.emptyTitle", "No messages yet")}
            description={t(
              "social.messages.emptyDesc",
              "Once you add friends, your conversations will show up here.",
            )}
          />
        </Card>
      );
    }
    return <MessagesSkeleton heightClassName={heightClassName} />;
  }

  const active = threads.find((th) => th.id === activeId) ?? threads[0];

  // Compose: the backend does not have a `POST /threads/{id}/messages`
  // endpoint yet so sends are local-only. We optimistically append to
  // client state; the next reload will lose the message until backend
  // support lands.
  // TODO(backend): POST /social/threads/{thread_id}/messages
  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      fromId: "me",
      text,
      timeLabel: "Now",
    };
    setThreads((prev) =>
      prev.map((th) =>
        th.id === active.id
          ? {
              ...th,
              messages: [...th.messages, newMsg],
              lastMessage: text,
              lastTimeLabel: "Now",
            }
          : th,
      ),
    );
    setDraft("");
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-[280px_1fr]",
          heightClassName ?? "h-[560px]",
        )}
      >
        {/* Thread list */}
        <aside
          className={cn(
            "flex flex-col border-r border-border bg-surface",
            mobilePane === "list" ? "flex" : "hidden md:flex",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text-primary">
                {t("social.messages.title", "Messages")}
              </h3>
              <Link
                to="../social"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent-muted hover:text-accent"
                aria-label={t("social.messages.newAria", "Start a new conversation from your friends list")}
                title={t("social.messages.newAria", "Start a new conversation from your friends list")}
              >
                <Icon name="pencil" size={14} aria-hidden />
              </Link>
            </div>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <Icon name="search" size={13} aria-hidden />
              </span>
              <input
                type="search"
                placeholder={t("social.messages.searchPlaceholder", "Search messages…")}
                className="w-full rounded-md border border-border bg-surface-muted py-1.5 pl-8 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {threads.map((th) => (
              <li key={th.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(th.id);
                    setMobilePane("thread");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    th.id === active.id
                      ? "bg-accent-muted"
                      : "hover:bg-surface-muted",
                  )}
                >
                  <UserAvatar
                    name={th.user.name}
                    imageUrl={th.user.imageUrl}
                    status={th.user.status}
                    frame={th.user.frame}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <UsernameDisplay
                        name={th.user.name}
                        cosmetic={th.user.cosmetic}
                        className="truncate text-sm"
                      />
                      <span className="shrink-0 text-[10px] text-text-muted">
                        {th.lastTimeLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-xs",
                          th.unreadCount > 0
                            ? "font-semibold text-text-primary"
                            : "text-text-muted",
                        )}
                      >
                        {th.lastMessage}
                      </p>
                      {th.unreadCount > 0 ? (
                        <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
                          {th.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Active thread */}
        <section
          className={cn(
            "flex flex-col bg-surface-muted",
            mobilePane === "thread" ? "flex" : "hidden md:flex",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
            <button
              type="button"
              onClick={() => setMobilePane("list")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary md:hidden"
              aria-label={t("social.messages.backAria", "Back to thread list")}
            >
              <Icon name="chevronLeft" size={16} aria-hidden />
            </button>
            <Link to={`/u/${encodeURIComponent(active.user.name)}`}>
              <UserAvatar
                name={active.user.name}
                imageUrl={active.user.imageUrl}
                status={active.user.status}
                frame={active.user.frame}
                size="sm"
              />
            </Link>
            <Link
              to={`/u/${encodeURIComponent(active.user.name)}`}
              className="min-w-0 flex-1 hover:underline focus:underline focus:outline-none"
            >
              <UsernameDisplay
                name={active.user.name}
                cosmetic={active.user.cosmetic}
                className="text-sm"
              />
              <p className="text-[10px] text-text-muted">
                {active.user.status === "active"
                  ? t("social.messages.activeNow", "Active now")
                  : active.user.lastActiveLabel}
              </p>
            </Link>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label={t("social.messages.moreAria", "More options")}
            >
              <Icon name="moreHorizontal" size={16} aria-hidden />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {detailQuery.isFetching && active.messages.length === 0 ? (
              <ThreadMessagesSkeleton />
            ) : active.messages.length === 0 ? (
              <EmptyThread name={active.user.name} />
            ) : (
              active.messages.map((m, i) => {
                const isMine = m.fromId === "me";
                const showDay = i === 0;
                return (
                  <div key={m.id}>
                    {showDay ? (
                      <p className="my-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        {t("social.messages.today", "Today")}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "flex flex-col",
                        isMine ? "items-end" : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                          isMine
                            ? "rounded-br-md bg-accent text-on-accent"
                            : "rounded-bl-md bg-surface text-text-primary",
                        )}
                      >
                        {m.text}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">{m.timeLabel}</span>
                        {m.reactions?.map((r) => (
                          <span
                            key={r.emoji}
                            className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary"
                          >
                            <span aria-hidden>{r.emoji}</span>
                            {r.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-surface px-3 py-3">
            <p className="mb-1.5 text-[10px] text-text-muted">
              {t(
                "social.messages.sendsLocalOnly",
                "Drafts stay on this device — server-side delivery is rolling out.",
              )}
            </p>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
                aria-label={t("social.messages.addEmojiAria", "Add emoji")}
              >
                <Icon name="smile" size={18} aria-hidden />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={t("social.messages.composerPlaceholder", "Message {{name}}…", {
                  name: active.user.name,
                })}
                className="max-h-24 min-h-[36px] flex-1 resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draft.trim()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition",
                  draft.trim()
                    ? "bg-accent text-on-accent hover:bg-accent-hover"
                    : "bg-surface-muted text-text-muted",
                )}
                aria-label={t("social.messages.sendAria", "Send message")}
              >
                <Icon name="send" size={16} aria-hidden />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
}

function EmptyThread({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
        <Icon name="hand" size={22} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-text-primary">
        {t("social.messages.sayHi", "Say hi to {{name}}", { name })}
      </p>
      <p className="mt-1 max-w-xs text-xs text-text-muted">
        {t(
          "social.messages.iceBreaker",
          "Send a wave to break the ice — they'll see it pop in your activity feed too.",
        )}
      </p>
      <div className="mt-4">
        <KudosButton initialCount={0} emoji="👋" size="md" />
      </div>
    </div>
  );
}

function ThreadMessagesSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "h-10 animate-pulse rounded-2xl bg-surface",
            i % 2 ? "ml-auto w-[60%]" : "w-[70%]",
          )}
        />
      ))}
    </div>
  );
}

function MessagesSkeleton({ heightClassName }: { heightClassName?: string }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-[280px_1fr]",
          heightClassName ?? "h-[560px]",
        )}
        aria-hidden
      >
        <div className="space-y-px border-r border-border bg-border">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3 bg-surface px-4 py-3"
            >
              <div className="h-10 w-10 rounded-full bg-border" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-border" />
                <div className="h-2.5 w-40 rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden flex-col bg-surface-muted md:flex">
          <div className="border-b border-border bg-surface px-4 py-3">
            <div className="h-4 w-32 animate-pulse rounded bg-border" />
          </div>
          <div className="flex-1 space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-10 animate-pulse rounded-2xl bg-border",
                  i % 2 ? "ml-auto w-[60%]" : "w-[70%]",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
