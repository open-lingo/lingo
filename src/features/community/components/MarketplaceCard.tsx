import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
import { UserPreviewPopover } from "@/features/social/components/UserPreviewPopover";
import { cn } from "@/shared/components/ui/cn";
import type { MarketplaceItem } from "../hooks/useMarketplaceContent";

const KIND_KEYS: Record<MarketplaceItem["kind"], string> = {
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  course: "community.addonKindCourse",
};

export type MarketplaceCardProps = {
  item: MarketplaceItem;
  /** Open the preview modal for this item (deck or story). */
  onPreview?: () => void;
  /** `rail` = fixed-width snap card (default). `grid` = fluid-width card. */
  variant?: "rail" | "grid";
  className?: string;
};

/**
 * MarketplaceCard — a streaming-style content tile with cover art, language +
 * kind chips, the creator's avatar (graceful initials fallback), and an upvote
 * count. Clicking the body opens the content preview.
 *
 * Mobile behavior: rail variant keeps a fixed width so it scrolls cleanly;
 * grid variant fills its column.
 */
export function MarketplaceCard({
  item,
  onPreview,
  variant = "rail",
  className,
}: MarketplaceCardProps) {
  const { t } = useTranslation();
  const lang = getLanguageConfig(item.languageId);
  const langName = lang?.name ?? item.languageId;
  const flag = lang?.flag ?? "🌐";
  const coverUrl =
    item.kind === "flashcard-pack"
      ? getDeckImageUrl(item.id, item.image)
      : getDeckImageUrl(item.id, item.image, "400/200");

  const creatorName = item.creator?.displayName;

  return (
    <article
      className={cn(
        "group/card flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card",
        variant === "rail" ? "w-64 shrink-0 snap-start sm:w-72" : "w-full",
        className,
      )}
    >
      <button
        type="button"
        onClick={onPreview}
        disabled={!onPreview}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={t("community.contentBrowserPreview")}
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-surface-muted">
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover/card:scale-[1.03]"
          />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <span aria-hidden className="leading-none">{flag}</span>
            <span>{langName}</span>
          </span>
          <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {t(KIND_KEYS[item.kind])}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={!onPreview}
          className="text-left focus:outline-none"
        >
          <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-text-primary transition-colors group-hover/card:text-accent">
            {item.name}
          </h3>
        </button>
        <p className="line-clamp-2 flex-1 text-[13px] leading-relaxed text-text-secondary">
          {item.description || (
            <span className="italic text-text-muted">
              {t("community.marketplaceNoDescription", "No description yet.")}
            </span>
          )}
        </p>

        <footer className="flex items-center justify-between gap-2 pt-1 text-xs">
          {creatorName ? (
            <UserPreviewPopover
              username={item.creator!.username}
              displayName={creatorName}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Avatar
                  src={item.creator!.avatarUrl}
                  name={creatorName}
                  size="xs"
                />
                <span className="truncate text-text-secondary hover:text-text-primary">
                  {creatorName}
                </span>
              </span>
            </UserPreviewPopover>
          ) : (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-text-muted">
              <Avatar name="?" size="xs" />
              <span className="truncate italic">
                {t("community.marketplaceUnattributed", "Community")}
              </span>
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-2 text-text-muted">
            {typeof item.itemCount === "number" && item.kind !== "story" ? (
              <span className="tabular-nums">
                {item.itemCount} {t("community.addonsItems")}
              </span>
            ) : null}
            {item.upvoteCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 tabular-nums">
                <Icon name="chevronUp" size={12} aria-hidden />
                {item.upvoteCount}
              </span>
            ) : null}
          </span>
        </footer>
      </div>
    </article>
  );
}
