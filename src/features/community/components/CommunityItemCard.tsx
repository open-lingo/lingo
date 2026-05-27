import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { useDeckVote } from "../hooks/useDeckVote";
import { Avatar } from "./Avatar";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { cn } from "@/shared/components/ui/cn";
import type { AddonKind } from "../types";

const ADDON_KIND_KEYS: Record<AddonKind, string> = {
  course: "community.addonKindCourse",
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  grammar: "community.addonKindGrammar",
};

/**
 * Editorial library cards get a thin accent strip down the left edge, colored
 * per language. Gives a wall of cards visual rhythm without requiring real
 * cover art for every deck. Falls back to a neutral accent for unknown
 * languages so anything new still renders.
 */
function languageAccentClass(languageId: string): string {
  switch (languageId) {
    case "ja":
      return "bg-gradient-to-b from-rose-400 to-rose-600";
    case "ko":
      return "bg-gradient-to-b from-sky-400 to-indigo-600";
    case "zh":
      return "bg-gradient-to-b from-red-500 to-amber-500";
    case "es":
      return "bg-gradient-to-b from-amber-400 to-orange-600";
    case "fr":
      return "bg-gradient-to-b from-blue-500 to-indigo-700";
    case "de":
      return "bg-gradient-to-b from-zinc-700 to-amber-500";
    case "en":
      return "bg-gradient-to-b from-emerald-400 to-emerald-600";
    default:
      return "bg-gradient-to-b from-accent to-accent-hover";
  }
}

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
  /** Public handle of the maintainer — when present, the maintainer chip
   *  opens a profile preview popover with an "Add friend" action. */
  maintainerUsername?: string;
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

  // full — editorial library card. Vertical layout with a language-accent
  // strip on the left, serif title, and a bottom-aligned footer so cards
  // share equal heights in a grid (use `auto-rows-fr` on the parent).
  const accentClass = languageAccentClass(item.languageId);
  return (
    <article
      className="group/card relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
    >
      {/* Language accent strip — vertical bar on the left edge */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-[3px] transition-opacity",
          accentClass,
          "opacity-70 group-hover/card:opacity-100",
        )}
      />

      <div className="flex flex-1 flex-col gap-3 p-5 pl-6">
        {/* Top: language chip + kind + community badge + owner-status */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 font-medium uppercase tracking-wider text-text-secondary"
            aria-label={langName}
          >
            <span aria-hidden className="text-sm leading-none">{flag}</span>
            <span>{langName}</span>
          </span>
          {item.kind && (
            <span className="inline-flex items-center rounded-full border border-border/70 px-2 py-0.5 font-medium uppercase tracking-wider text-text-muted">
              {t(ADDON_KIND_KEYS[item.kind])}
            </span>
          )}
          {showCommunityBadge && (
            <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 font-medium uppercase tracking-wider text-accent">
              {t("community.communityPackBadge")}
            </span>
          )}
          {ownedDeckId && ownedStatus && (
            <span
              className={cn(
                "ml-auto inline-flex items-center rounded-full px-2 py-0.5 font-medium uppercase tracking-wider",
                ownedStatus === "published"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning",
              )}
            >
              {ownedStatus}
            </span>
          )}
        </div>

        {/* Title — editorial serif, 2 lines max */}
        <h3
          className="font-display text-[19px] font-semibold leading-snug text-text-primary line-clamp-2 transition-colors group-hover/card:text-accent"
          style={{ fontVariationSettings: '"opsz" 24' }}
        >
          {item.name}
        </h3>

        {/* Description — 2 lines max, takes available vertical space so the
            footer stays bottom-aligned across cards of varying length */}
        <p className="line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-text-secondary">
          {item.description || (
            <span className="font-display italic text-text-muted">No description yet.</span>
          )}
        </p>

        {/* Footer: maintainer (left) + counts + actions (right) */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
          <div className="flex min-w-0 items-center gap-3">
            {item.maintainerName ? (
              item.maintainerUsername ? (
                <UserPreviewPopover
                  username={item.maintainerUsername}
                  displayName={item.maintainerName}
                >
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <Avatar name={item.maintainerName} size="xs" />
                    <span className="truncate text-text-secondary hover:text-text-primary">
                      {item.maintainerName}
                    </span>
                  </span>
                </UserPreviewPopover>
              ) : (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Avatar name={item.maintainerName} size="xs" />
                  <span className="truncate text-text-secondary">
                    {item.maintainerName}
                  </span>
                </span>
              )
            ) : (
              <span className="font-display italic text-text-muted">unattributed</span>
            )}
            <span
              className="font-display tabular-nums text-text-muted"
              style={{ fontVariationSettings: '"opsz" 10' }}
              aria-label={`${item.itemCount ?? 0} ${t("community.addonsItems")}`}
            >
              {item.itemCount ?? "—"} {t("community.addonsItems")}
            </span>
            {item.discussionCount != null && item.discussionCount > 0 && (
              <span
                className="font-display tabular-nums text-text-muted"
                style={{ fontVariationSettings: '"opsz" 10' }}
              >
                · {item.discussionCount} {t("community.discussions")}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
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
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
            >
              {t("community.contentBrowserOpen")}
            </Link>
          ) : isStory && storyId ? (
            <Link
              to={langPath(`practice/stories/${storyId}`)}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent shadow-sm hover:bg-accent-hover"
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
        </footer>
      </div>
    </article>
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
