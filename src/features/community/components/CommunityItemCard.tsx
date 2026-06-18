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
  /** Resolved maintainer avatar URL — falls back to initials when absent. */
  maintainerAvatarUrl?: string;
  image?: string | null;
  deckId?: string;
  storyId?: string;
  /**
   * A few sample entries (deck card fronts, or a story excerpt) surfaced on
   * hover so the card is skimmable before opening the full preview modal.
   * Loaded up-front with the list — no extra fetch on hover.
   */
  previewSamples?: string[];
  /** Relative "updated N ago" string shown in the hover preview. */
  updatedLabel?: string;
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
  // Unified preview opener — deck preview or story preview, whichever applies.
  const openPreview = isDeck ? onPreview : isStory ? onStoryPreview : undefined;
  const samples = item.previewSamples?.filter(Boolean) ?? [];

  if (variant === "minimal") {
    return (
      <li className="flex items-start gap-3 rounded-card border border-border bg-surface p-4 transition hover:border-accent">
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
          loading="lazy"
          decoding="async"
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

  // full — library card. Vertical layout, bottom-aligned footer so cards
  // share equal heights in a grid (use `auto-rows-fr` on the parent).
  // Cover art will land later; until then the cards stay calm.
  return (
    <article className="group/card relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card">
      <div className="flex flex-1 flex-col gap-3 p-5">
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

        {/* Title — bold sans, 2 lines max. Body font for app-wide consistency.
            When a preview handler exists, the title is a button that opens the
            full modal (the hover preview teases it). */}
        {openPreview ? (
          <button
            type="button"
            onClick={openPreview}
            className="text-left text-[17px] font-semibold leading-snug text-text-primary line-clamp-2 transition-colors hover:text-accent group-hover/card:text-accent focus:outline-none focus-visible:underline"
          >
            {item.name}
          </button>
        ) : (
          <h3 className="text-[17px] font-semibold leading-snug text-text-primary line-clamp-2 transition-colors group-hover/card:text-accent">
            {item.name}
          </h3>
        )}

        {/* Description — 2 lines max, takes available vertical space so the
            footer stays bottom-aligned across cards of varying length */}
        <p className="line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-text-secondary">
          {item.description || (
            <span className="italic text-text-muted">No description yet.</span>
          )}
        </p>

        {/* Hover preview — richer skim strip revealed on hover. Sample entries
            are loaded up-front with the list (no fetch on hover). Clicking
            anywhere on it opens the full preview modal. */}
        {(samples.length > 0 || item.updatedLabel) && (
          <div
            className={cn(
              "overflow-hidden text-[12px] text-text-secondary transition-all duration-200",
              "max-h-0 opacity-0 group-hover/card:max-h-32 group-hover/card:opacity-100",
            )}
          >
            <div className="rounded-md border border-border/60 bg-surface-muted/60 px-2.5 py-2">
              {samples.length > 0 && (
                <button
                  type="button"
                  onClick={openPreview}
                  className="flex w-full flex-wrap gap-1.5 text-left"
                  aria-label={t("community.contentBrowserPreview")}
                >
                  {samples.slice(0, 4).map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex max-w-[10rem] truncate rounded bg-surface px-1.5 py-0.5 text-text-secondary"
                    >
                      {s}
                    </span>
                  ))}
                </button>
              )}
              {item.updatedLabel && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
                  <Icon name="clock" size={11} aria-hidden />
                  {item.updatedLabel}
                </p>
              )}
            </div>
          </div>
        )}

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
                    <Avatar name={item.maintainerName} src={item.maintainerAvatarUrl} size="xs" />
                    <span className="truncate text-text-secondary hover:text-text-primary">
                      {item.maintainerName}
                    </span>
                  </span>
                </UserPreviewPopover>
              ) : (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Avatar name={item.maintainerName} src={item.maintainerAvatarUrl} size="xs" />
                  <span className="truncate text-text-secondary">
                    {item.maintainerName}
                  </span>
                </span>
              )
            ) : (
              <span className="italic text-text-muted">unattributed</span>
            )}
            {/* Item count only makes sense for things that have a card
                count (decks / courses). Stories don't render this. */}
            {!isStory && typeof item.itemCount === "number" && (
              <span
                className="tabular-nums text-text-muted"
                aria-label={`${item.itemCount} ${t("community.addonsItems")}`}
              >
                {item.itemCount} {t("community.addonsItems")}
              </span>
            )}
            {item.discussionCount != null && item.discussionCount > 0 && (
              <span className="tabular-nums text-text-muted">
                · {item.discussionCount} {t("community.discussions")}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Upvote only renders for decks — no vote API for stories yet,
                and rendering a dead button was the kind of AI-blip the
                maintainer keeps flagging. */}
            {isDeck && deckId && (
              <DeckUpvoteButton deckId={deckId} fallbackCount={item.upvoteCount ?? 0} />
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
