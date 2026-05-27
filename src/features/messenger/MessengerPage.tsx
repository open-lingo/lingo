/**
 * Standalone messenger surface — full-height conversation app.
 *
 * Routes:
 *   /:lang/messenger              → opens with the most recent thread
 *   /:lang/messenger/:friendId    → opens directly to that friend
 *
 * Deep-link `friendId` matches `ChatThread.user.id` so friend-list rows can
 * link straight in.
 */
import { Link, useParams } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { MessagesSection } from "@/features/social/sections/MessagesSection";

export default function MessengerPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const langPath = useLangPath();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={langPath("social")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
            aria-label="Back to social"
          >
            <Icon name="chevronLeft" size={16} aria-hidden />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Messages
            </p>
            <h1 className="text-2xl font-bold text-text-primary">Messenger</h1>
          </div>
        </div>
        <Link
          to={langPath("social/friends")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        >
          <Icon name="users" size={15} aria-hidden />
          Friends
        </Link>
      </header>

      <MessagesSection
        initialFriendId={friendId}
        heightClassName="h-[calc(100vh-200px)] min-h-[480px]"
      />
    </div>
  );
}
