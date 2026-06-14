import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { useDeckVote } from "@/features/community/hooks/useDeckVote";
import { cn } from "@/shared/components/ui/cn";

export type DeckPreviewAuthor = {
  displayName: string;
  username?: string;
  avatarUrl?: string;
};

export type DeckPreviewHeaderProps = {
  title: string;
  coverUrl: string;
  languageName: string;
  languageFlag?: string;
  /** Resolved author, when known. Absent → "Community" attribution. */
  author?: DeckPreviewAuthor;
  /** Deck id — when present the live vote control renders; otherwise a static count. */
  deckId?: string;
  /** Fallback upvote count used before the live vote query resolves (or when no deckId). */
  fallbackUpvotes?: number;
  /** Hide the vote control entirely (e.g. course decks with no vote API). */
  showVotes?: boolean;
};

/**
 * DeckPreviewHeader — author-forward masthead for the deck preview. Cover art
 * with a gradient scrim, the deck title, the author avatar + name, a language
 * chip, and the live upvote control.
 */
export function DeckPreviewHeader({
  title,
  coverUrl,
  languageName,
  languageFlag,
  author,
  deckId,
  fallbackUpvotes = 0,
  showVotes = true,
}: DeckPreviewHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="relative h-36 w-full overflow-hidden sm:h-44">
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {languageFlag && (
            <span aria-hidden className="leading-none">
              {languageFlag}
            </span>
          )}
          <span>{languageName}</span>
        </span>
        <h2
          id="deck-preview-title"
          className="absolute inset-x-3 bottom-2 line-clamp-2 text-lg font-semibold text-white drop-shadow sm:text-xl"
        >
          {title}
        </h2>
      </div>

      <div className="flex items-center justify-between gap-3 px-1 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar
            src={author?.avatarUrl}
            name={author?.displayName}
            size="md"
            fallback={<Icon name="users" size={16} aria-hidden />}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {author?.displayName ?? t("flashcards.creatorUnknown", "Community")}
            </p>
            <p className="text-xs text-text-muted">
              {t("flashcards.maintainerLabel", "Maintainer")}
            </p>
          </div>
        </div>

        {showVotes && (
          <UpvoteControl deckId={deckId} fallbackCount={fallbackUpvotes} />
        )}
      </div>
    </div>
  );
}

/**
 * Live upvote control. When a `deckId` is present it wires up `useDeckVote`
 * (optimistic toggle, login redirect for guests). With no deckId it renders a
 * static, non-interactive count so the modal still surfaces popularity.
 */
function UpvoteControl({
  deckId,
  fallbackCount,
}: {
  deckId?: string;
  fallbackCount: number;
}) {
  const { t } = useTranslation();
  const { count, voted, isLoading, isPending, toggle } = useDeckVote(deckId);

  if (!deckId) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary">
        <Icon name="chevronUp" size={16} aria-hidden />
        <span className="tabular-nums">{fallbackCount}</span>
      </span>
    );
  }

  const displayCount = isLoading ? fallbackCount : count;
  const label = voted
    ? t("flashcards.removeUpvote", "Remove upvote")
    : t("flashcards.upvote", "Upvote");

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition",
        voted
          ? "border-accent bg-accent-muted text-accent"
          : "border-border text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <Icon name="chevronUp" size={16} aria-hidden />
      <span className="tabular-nums">{displayCount}</span>
    </button>
  );
}
