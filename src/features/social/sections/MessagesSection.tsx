/**
 * Messages tab — thread list (left) + active conversation (right). 1-1 only
 * for v1; group chat / voice / read receipts are out of scope.
 *
 * Active thread is selected by local state. The thread list comes from
 * `useThreads()` (real API when enabled, mock otherwise). When a thread is
 * selected we lazy-load its messages via `socialApi.getThread(threadId)` so
 * the seeded history (Trevor↔Sora, Trevor↔Kenji) actually paints.
 *
 * Composer persists via `POST /threads/{id}/messages`. Sends are optimistic
 * (append a synthetic message to client state immediately, then reconcile
 * with the server-issued id on success or roll back on error).
 *
 * "New conversation" picker uses `getOrCreateThreadWith(userId)` so the
 * caller can spin up a thread for any friend without first checking whether
 * one exists.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { userSlug } from "@/features/social/userSlug";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { cn } from "@/shared/components/ui/cn";
import { UserAvatar } from "../components/UserAvatar";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { KudosButton } from "../components/KudosButton";
import { PickFriendModal } from "../components/PickFriendModal";
import { useThreads } from "../hooks/useSocial";
import { useApiOptional } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { adaptThread, adaptThreadDetail } from "../hooks/socialAdapters";
import type { ChatMessage, ChatThread, SocialUser } from "../types";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

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

  /** Open (or create) a thread with the picked friend. Reuses the existing
   *  thread when one already exists locally, otherwise asks the backend via
   *  `getOrCreateThreadWith` and splices the result into the local list. In
   *  the mock-only / no-API path we fall back to a synthetic local thread. */
  const handlePickFriend = async (friend: SocialUser) => {
    setPickerOpen(false);
    const existing = threads.find((th) => th.user.id === friend.id);
    if (existing) {
      setActiveId(existing.id);
      setMobilePane("thread");
      return;
    }
    if (apiOpt) {
      try {
        const item = await apiOpt.social.getOrCreateThreadWith(friend.id);
        const adapted = adaptThread(item);
        setThreads((prev) =>
          prev.some((th) => th.id === adapted.id) ? prev : [adapted, ...prev],
        );
        setActiveId(adapted.id);
        setMobilePane("thread");
        return;
      } catch {
        // Fall through to the local-thread fallback below so the picker
        // still feels responsive when the endpoint is unreachable.
      }
    }
    // Mock / offline fallback: synthesize a thread that lives only in client
    // state (matches the existing local-only send pattern).
    const stub: ChatThread = {
      id: `t-local-${friend.id}`,
      user: friend,
      lastMessage: "",
      lastTimeLabel: "",
      unreadCount: 0,
      messages: [],
    };
    setThreads((prev) =>
      prev.some((th) => th.user.id === friend.id) ? prev : [stub, ...prev],
    );
    setActiveId(stub.id);
    setMobilePane("thread");
  };

  if (isLoading || threads.length === 0) {
    if (!isLoading && (data?.length ?? 0) === 0) {
      return (
        <>
          <Card padding="md">
            <EmptyState
              icon={<Icon name="messageCircle" size={20} aria-hidden />}
              title={t("social.messages.emptyTitle", "No messages yet")}
              description={t(
                "social.messages.emptyDesc",
                "Once you add friends, your conversations will show up here.",
              )}
              action={
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  {t("social.messages.startConversation", "New conversation")}
                </button>
              }
            />
          </Card>
          <PickFriendModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onPick={handlePickFriend}
          />
        </>
      );
    }
    return <MessagesSkeleton heightClassName={heightClassName} />;
  }

  const active = threads.find((th) => th.id === activeId) ?? threads[0];

  // Compose: persist via POST /threads/{id}/messages with an optimistic
  // append + rollback. The synthetic id is replaced with the server-issued
  // one on success. Mock / no-API path keeps the original local-only
  // behavior so the demo flow stays functional offline.
  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    const tempId = `m-temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      fromId: "me",
      text,
      timeLabel: "Now",
    };
    const targetId = active.id;
    setThreads((prev) =>
      prev.map((th) =>
        th.id === targetId
          ? {
              ...th,
              messages: [...th.messages, optimistic],
              lastMessage: text,
              lastTimeLabel: "Now",
            }
          : th,
      ),
    );
    setDraft("");

    // Skip the network call for mock / local-only threads (no API client OR
    // a local-thread stub id).
    if (!apiOpt || !/^[0-9a-f-]{8,}$/i.test(targetId)) return;
    try {
      const persisted = await apiOpt.social.sendThreadMessage(targetId, text);
      setThreads((prev) =>
        prev.map((th) =>
          th.id === targetId
            ? {
                ...th,
                messages: th.messages.map((m) =>
                  m.id === tempId ? { ...m, id: persisted.id } : m,
                ),
              }
            : th,
        ),
      );
    } catch {
      // Roll back the optimistic append and restore the draft so the user
      // doesn't lose their text.
      setThreads((prev) =>
        prev.map((th) =>
          th.id === targetId
            ? { ...th, messages: th.messages.filter((m) => m.id !== tempId) }
            : th,
        ),
      );
      setDraft(text);
    }
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
              {/* Per the messenger redesign, the "New conversation" affordance
               *  sits at the TOP-LEFT of the thread list so right-handed
               *  thumbs can reach it on mobile. Plus-icon button reads as
               *  "create" — the legacy pencil Link merely jumped back to
               *  the social page, which was a different action. */}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent-muted hover:text-accent"
                aria-label={t(
                  "social.messages.newAria",
                  "Start a new conversation",
                )}
                title={t("social.messages.newAria", "Start a new conversation")}
              >
                <Icon name="plus" size={16} aria-hidden />
              </button>
              <h3 className="text-sm font-semibold text-text-primary">
                {t("social.messages.title", "Messages")}
              </h3>
              <span className="h-7 w-7" aria-hidden />
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
            <Link to={`/u/${userSlug(active.user)}`}>
              <UserAvatar
                name={active.user.name}
                imageUrl={active.user.imageUrl}
                status={active.user.status}
                frame={active.user.frame}
                size="sm"
              />
            </Link>
            <Link
              to={`/u/${userSlug(active.user)}`}
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
            <div className="flex items-end gap-2">
              {/* Emoji picker trigger + popover. We keep the popover tightly
               *  scoped to a hand-curated grid (no library, no unicode
               *  search) — Spencer's brief: "20-30 chars … no need for
               *  unicode search / categories". Clicking an emoji appends
               *  to the draft and returns focus to the textarea so the user
               *  can keep typing. */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((o) => !o)}
                  aria-haspopup="dialog"
                  aria-expanded={emojiOpen}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition",
                    emojiOpen
                      ? "bg-accent-muted text-accent"
                      : "text-text-muted hover:bg-surface-muted hover:text-text-primary",
                  )}
                  aria-label={t("social.messages.addEmojiAria", "Add emoji")}
                >
                  <Icon name="smile" size={18} aria-hidden />
                </button>
                {emojiOpen ? (
                  <EmojiPickerPopover
                    onPick={(emoji) => {
                      setDraft((d) => d + emoji);
                      // Return focus to the textarea so the user can keep
                      // typing after picking. Close-on-outside-click handles
                      // dismissal.
                      requestAnimationFrame(() => composerRef.current?.focus());
                    }}
                    onClose={() => setEmojiOpen(false)}
                  />
                ) : null}
              </div>
              <textarea
                ref={composerRef}
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

      <PickFriendModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickFriend}
      />
    </Card>
  );
}

/** Hand-curated grid of common chat emoji. No library, no unicode search,
 *  no category tabs — keep the popover small and quick to scan. Tap an
 *  emoji to append it to the composer draft. */
const QUICK_EMOJI = [
  "😀", "😂", "🤣", "😊", "😍", "😘",
  "😎", "🤔", "😅", "🙃", "😴", "🥳",
  "😭", "😡", "🤯", "🙄", "👍", "👎",
  "👏", "🙏", "🙌", "👌", "💪", "🤝",
  "❤️", "🔥", "✨", "🎉", "💯", "🌟",
];

function EmojiPickerPopover({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji picker"
      className="absolute bottom-full left-0 z-40 mb-2 w-[260px] rounded-lg border border-border bg-surface p-2 shadow-popover"
    >
      <div className="grid grid-cols-6 gap-1">
        {QUICK_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition hover:bg-surface-muted focus:bg-surface-muted focus:outline-none"
            aria-label={`Insert ${emoji}`}
          >
            <span aria-hidden>{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyThread({ name }: { name: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col items-center justify-center py-6 text-center">
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
