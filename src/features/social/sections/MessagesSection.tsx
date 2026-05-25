/**
 * Messages tab — thread list (left) + active conversation (right). 1-1 only
 * for v1; group chat / voice / read receipts are out of scope.
 *
 * Active thread is selected by local state. Composer state is local and
 * mock-only — sending appends to the in-memory transcript so Spencer can
 * test the empty-state-to-message flow visually.
 */
import { useState } from "react";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { UserAvatar } from "../components/UserAvatar";
import { UsernameDisplay } from "../components/UsernameDisplay";
import { KudosButton } from "../components/KudosButton";
import { useSocial } from "../hooks/useSocial";
import type { ChatMessage, ChatThread } from "../mock/mockSocial";

type Props = {
  /** Pre-select a thread by user id (deep-link path param `friendId`). */
  initialFriendId?: string;
  /** Tailwind height utility for the container. Default keeps card height. */
  heightClassName?: string;
};

export function MessagesSection({ initialFriendId, heightClassName }: Props = {}) {
  const { threads: mockThreads } = useSocial();
  const initialThread =
    (initialFriendId && mockThreads.find((t) => t.user.id === initialFriendId)) ||
    mockThreads[0];
  const [threads, setThreads] = useState<ChatThread[]>(mockThreads);
  const [activeId, setActiveId] = useState<string>(initialThread.id);
  const [draft, setDraft] = useState("");
  const [mobilePane, setMobilePane] = useState<"list" | "thread">(
    initialFriendId ? "thread" : "list",
  );

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

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
      prev.map((t) =>
        t.id === active.id
          ? { ...t, messages: [...t.messages, newMsg], lastMessage: text, lastTimeLabel: "Now" }
          : t,
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
              <h3 className="text-sm font-semibold text-text-primary">Messages</h3>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent-muted hover:text-accent"
                aria-label="New message"
              >
                <Icon name="pencil" size={14} aria-hidden />
              </button>
            </div>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <Icon name="search" size={13} aria-hidden />
              </span>
              <input
                type="search"
                placeholder="Search messages…"
                className="w-full rounded-md border border-border bg-surface-muted py-1.5 pl-8 pr-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(t.id);
                    setMobilePane("thread");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    t.id === active.id
                      ? "bg-accent-muted"
                      : "hover:bg-surface-muted",
                  )}
                >
                  <UserAvatar
                    name={t.user.name}
                    imageUrl={t.user.imageUrl}
                    status={t.user.status}
                    frame={t.user.frame}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <UsernameDisplay
                        name={t.user.name}
                        cosmetic={t.user.cosmetic}
                        className="truncate text-sm"
                      />
                      <span className="shrink-0 text-[10px] text-text-muted">{t.lastTimeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-xs",
                          t.unreadCount > 0 ? "font-semibold text-text-primary" : "text-text-muted",
                        )}
                      >
                        {t.lastMessage}
                      </p>
                      {t.unreadCount > 0 ? (
                        <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
                          {t.unreadCount}
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
              aria-label="Back to thread list"
            >
              <Icon name="chevronLeft" size={16} aria-hidden />
            </button>
            <UserAvatar
              name={active.user.name}
              imageUrl={active.user.imageUrl}
              status={active.user.status}
              frame={active.user.frame}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <UsernameDisplay
                name={active.user.name}
                cosmetic={active.user.cosmetic}
                className="text-sm"
              />
              <p className="text-[10px] text-text-muted">
                {active.user.status === "active" ? "Active now" : active.user.lastActiveLabel}
              </p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
              aria-label="More options"
            >
              <Icon name="moreHorizontal" size={16} aria-hidden />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {active.messages.length === 0 ? (
              <EmptyThread name={active.user.name} />
            ) : (
              active.messages.map((m, i) => {
                const isMine = m.fromId === "me";
                const showDay = i === 0;
                return (
                  <div key={m.id}>
                    {showDay ? (
                      <p className="my-3 text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Today
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
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
                aria-label="Add emoji"
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
                placeholder={`Message ${active.user.name}…`}
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
                aria-label="Send message"
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
  return (
    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
        <Icon name="hand" size={22} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-text-primary">Say hi to {name}</p>
      <p className="mt-1 max-w-xs text-xs text-text-muted">
        Send a wave to break the ice — they'll see it pop in your activity feed too.
      </p>
      <div className="mt-4">
        <KudosButton initialCount={0} emoji="👋" size="md" />
      </div>
    </div>
  );
}
