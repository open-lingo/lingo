import { Link } from "react-router-dom";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";

/**
 * Compact row for the Subscribed library view.
 * Keeps CommunityItemCard focused on discovery/marketing cards; this is the
 * dense "I already know what this is" library row.
 */
export type SubscribedRowProps = {
  /** Either "deck" or "story". */
  kind: "deck" | "story";
  /** Underlying content id (deckId or storyId). Used for unsubscribe + open route. */
  contentId: string;
  title: string;
  languageId: string;
  /** Card count for decks; undefined for stories. */
  itemCount?: number;
  /** Optional author display name. Falls back to language name when absent. */
  authorName?: string;
  /** Custom image URL for the thumbnail. */
  image?: string | null;
  /** Where the Open button navigates to. */
  openTo: string;
  /** Whether the unsubscribe request is in flight for this row. */
  unsubscribeLoading?: boolean;
  onUnsubscribe: () => void;
  t: (key: string, defaultValue?: string) => string;
};

export function SubscribedRow({
  kind,
  contentId,
  title,
  languageId,
  itemCount,
  authorName,
  image,
  openTo,
  unsubscribeLoading,
  onUnsubscribe,
  t,
}: SubscribedRowProps) {
  const lang = getLanguageConfig(languageId);
  const langName = lang?.name ?? languageId;
  const flag = lang?.flag ?? "🌐";
  const cover = kind === "deck" ? getDeckImageUrl(contentId, image) : null;
  const byline = authorName ?? langName;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition hover:border-accent/40">
      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Title + byline */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-text-primary">
            {title}
          </span>
          {kind === "story" && (
            <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              {t("community.subscribedKindStory", "Story")}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-text-muted">
          {t("community.subscribedBy", "by {{name}}").replace(
            "{{name}}",
            byline,
          )}
        </p>
      </div>

      {/* Middle meta: cards + flag */}
      <div className="hidden shrink-0 items-center gap-3 text-xs text-text-muted sm:flex">
        {kind === "deck" && (
          <span className="tabular-nums">
            {t("community.subscribedCardCount", "{{count}} cards").replace(
              "{{count}}",
              String(itemCount ?? 0),
            )}
          </span>
        )}
        <span className="text-base leading-none" role="img" aria-label={langName}>
          {flag}
        </span>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onUnsubscribe}
          disabled={unsubscribeLoading}
          className="rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-muted hover:text-text-primary disabled:opacity-50"
        >
          {unsubscribeLoading
            ? "…"
            : t("community.contentBrowserUnsubscribe", "Unsubscribe")}
        </button>
        <Link
          to={openTo}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover"
        >
          {t("community.contentBrowserOpen", "Open")}
        </Link>
      </div>
    </div>
  );
}
