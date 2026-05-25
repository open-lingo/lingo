import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { useDeckVote } from "../hooks/useDeckVote";
import { Avatar } from "./Avatar";
import type { AddonKind } from "../types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

export type CommunityItemCardItem = {
  id: string;
  name: string;
  description: string;
  languageId: string;
  kind?: AddonKind;
  itemCount?: number;
  upvoteCount?: number;
  discussionCount?: number;
  maintainerName?: string;
  image?: string | null;
  deckId?: string;
  storyId?: string;
};

export type CommunityItemCardProps = {
  item: CommunityItemCardItem;
  variant: "full" | "compact" | "minimal";
  t: (k: string) => string;
  langPath: (p: string) => string;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  onPreview?: () => void;
  onStoryPreview?: () => void;
  subscribeLoading?: boolean;
  /** Compact variant: primary action (e.g. Preview) */
  onPrimaryAction?: () => void;
  /** Minimal: show subscribe button */
  canSubscribe?: boolean;
  /** Full: show community pack badge */
  showCommunityBadge?: boolean;
  /** When set, renders the card in owner mode: Edit + Open actions, no Subscribe. */
  ownedDeckId?: string;
  /** Author's deck status (draft / published) — shown as a status pill in owner mode. */
  ownedStatus?: string;
};

export function CommunityItemCard({
  item,
  variant,
  t,
  langPath,
  isSubscribed,
  onSubscribe,
  onUnsubscribe,
  onPreview,
  onStoryPreview,
  subscribeLoading,
  onPrimaryAction,
  canSubscribe = false,
  showCommunityBadge = false,
  ownedDeckId,
  ownedStatus,
}: CommunityItemCardProps) {
  const lang = getLanguageConfig(item.languageId);
  const langName = lang?.name ?? item.languageId;
  const flag = lang?.flag ?? "🌐";
  const deckId = item.deckId ?? (item.kind === "flashcard-pack" ? item.id : undefined);
  const storyId = item.storyId ?? (item.kind === "story" ? item.id : undefined);
  const isDeck = item.kind === "flashcard-pack";
  const isStory = item.kind === "story" || !!storyId;
  const showSubscribe = (deckId || storyId || canSubscribe) && isSubscribed !== undefined;

  if (variant === "minimal") {
    return (
      <li className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-accent">
        <Link to={langPath(`practice/stories/${storyId ?? item.id}`)} className="min-w-0 flex-1">
          <span className="font-medium text-text-primary">{item.name}</span>
          {item.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">{item.description}</p>
          )}
          <div className="mt-2 flex gap-2 text-xs text-text-muted">
            <span>{t("stories.communityStories")}</span>
          </div>
        </Link>
        {canSubscribe && (
          <button
            type="button"
            disabled={subscribeLoading}
            onClick={(e) => {
              e.preventDefault();
              if (isSubscribed) onUnsubscribe?.();
              else onSubscribe?.();
            }}
            className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition ${
              isSubscribed ? "bg-accent-muted text-accent" : "text-accent hover:bg-accent-muted"
            }`}
          >
            {subscribeLoading ? "…" : isSubscribed ? t("community.contentBrowserSubscribed") : t("community.contentBrowserSubscribe")}
          </button>
        )}
      </li>
    );
  }

  if (variant === "compact") {
    const coverUrl = getDeckImageUrl(deckId ?? item.id, item.image);
    return (
      <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4">
        <img
          src={coverUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text-primary">{item.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{item.description}</p>
          <p className="mt-2 text-xs text-text-muted">
            {item.itemCount ?? "—"} {t("flashcards.cards")} · <Icon name="chevronUp" size={12} className="inline" /> {item.upvoteCount ?? 0}
          </p>
        </div>
        <button
          type="button"
          onClick={onPrimaryAction ?? onPreview}
          className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-muted"
        >
          {t("flashcards.preview")}
        </button>
      </div>
    );
  }

  // full
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-4">
      <span className="text-2xl" role="img" aria-label={langName}>
        {flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-text-primary">{item.name}</span>
          {showCommunityBadge && (
            <span className="rounded bg-accent-muted px-1.5 py-0.5 text-xs font-medium text-accent">
              {t("community.communityPackBadge")}
            </span>
          )}
          {item.kind && (
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text-secondary">
              {t(ADDON_KIND_KEYS[item.kind])}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-text-secondary line-clamp-2">{item.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
          <span>{item.itemCount ?? "—"} {t("community.addonsItems")}</span>
          <span className="inline-flex items-center gap-0.5"><Icon name="chevronUp" size={14} /> {item.upvoteCount ?? 0}</span>
          {item.discussionCount != null && item.discussionCount > 0 && (
            <span>💬 {item.discussionCount} {t("community.discussions")}</span>
          )}
        </div>
        {item.maintainerName && (
          <div className="mt-2 flex items-center gap-1.5">
            <Avatar name={item.maintainerName} size="xs" />
            <span className="text-xs text-text-muted">{item.maintainerName}</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {ownedDeckId && ownedStatus && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              ownedStatus === "published"
                ? "bg-accent-muted text-accent"
                : "bg-surface-muted text-text-secondary"
            }`}
          >
            {ownedStatus}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {isDeck && deckId ? (
            <DeckUpvoteButton deckId={deckId} fallbackCount={item.upvoteCount ?? 0} />
          ) : (
            <button
              type="button"
              className="rounded px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
              aria-label="Upvote"
            >
              <Icon name="chevronUp" size={14} className="inline" />
            </button>
          )}
          {ownedDeckId ? (
            <Link
              to={langPath(`community/decks/${ownedDeckId}`)}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-muted"
            >
              {t("community.contentBrowserEdit")}
            </Link>
          ) : (
            showSubscribe && (
              <button
                type="button"
                disabled={subscribeLoading}
                onClick={isSubscribed ? onUnsubscribe : onSubscribe}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isSubscribed
                    ? "border border-accent-muted bg-accent-muted text-accent"
                    : "border border-accent text-accent hover:bg-accent-muted"
                }`}
              >
                {subscribeLoading
                  ? "…"
                  : isSubscribed
                    ? t("community.contentBrowserSubscribed")
                    : t("community.contentBrowserSubscribe")}
              </button>
            )
          )}
          {isStory && storyId && onStoryPreview && (
            <button
              type="button"
              onClick={onStoryPreview}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
            >
              {t("community.contentBrowserPreview")}
            </button>
          )}
          {isDeck && onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
            >
              {t("community.contentBrowserPreview")}
            </button>
          )}
          {isDeck ? (
            <Link
              to={langPath("practice/flashcards")}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent/90"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          ) : isStory && storyId ? (
            <Link
              to={langPath(`practice/stories/${storyId}`)}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent/90"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          ) : (
            <Link
              to={item.kind === "story" ? langPath("practice/stories") : langPath("practice/flashcards")}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-muted"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Wired upvote button — pulls live count + voted flag from the API and
 * flips state optimistically. The card always renders some count
 * (server value falls back to the addon's reported ``upvoteCount`` so
 * the UI doesn't flash a zero on first paint).
 */
function DeckUpvoteButton({
  deckId,
  fallbackCount,
}: {
  deckId: string;
  fallbackCount: number;
}) {
  const { count, voted, isLoading, isPending, toggle } = useDeckVote(deckId);
  // Show server count once loaded, else the mock/preview number.
  const displayCount = isLoading ? fallbackCount : count;
  const label = voted ? "Remove upvote" : "Upvote";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition ${
        voted
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-surface-muted"
      }`}
    >
      <Icon name="chevronUp" size={14} className="inline" />
      <span className="tabular-nums">{displayCount}</span>
    </button>
  );
}
