import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { CardCover } from "./CardCover";
import type { MarketplaceItem } from "../hooks/useMarketplaceContent";

const KIND_KEYS: Record<MarketplaceItem["kind"], string> = {
  "flashcard-pack": "community.addonKindFlashcardPack",
  story: "community.addonKindStory",
  course: "community.addonKindCourse",
};

export type FeaturedHeroProps = {
  item: MarketplaceItem;
  onPreview?: () => void;
};

/**
 * FeaturedHero — the large spotlight tile leading the marketplace home. A
 * cover-art canvas with a gradient scrim and overlaid title sits above a solid
 * bottom info bar carrying the same creator / count / upvote metadata the grid
 * cards show, so the hero reads as a bigger sibling of the cards rather than a
 * different component. Clicking opens the preview.
 */
export function FeaturedHero({ item, onPreview }: FeaturedHeroProps) {
  const { t } = useTranslation();
  const lang = getLanguageConfig(item.languageId);
  const langName = lang?.name ?? item.languageId;
  const flag = lang?.flag ?? "🌐";
  const creatorName = item.creator?.displayName;

  return (
    <button
      type="button"
      onClick={onPreview}
      disabled={!onPreview}
      className="group flex h-full min-h-[18rem] w-full flex-col overflow-hidden rounded-card border border-border bg-surface text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* Cover canvas with overlaid title */}
      <div className="relative min-h-0 flex-1">
        <CardCover
          id={item.id}
          kind={item.kind}
          src={item.image}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">
          <Icon name="flame" size={13} aria-hidden />
          {t("community.homePopularBadge", "Most popular")}
        </span>

        <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-5 text-white">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-medium backdrop-blur-sm">
              <span aria-hidden className="leading-none">{flag}</span>
              <span>{langName}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 font-medium uppercase tracking-wide backdrop-blur-sm">
              {t(KIND_KEYS[item.kind])}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-tight drop-shadow-sm line-clamp-2">
            {item.name}
          </h2>
          {item.description ? (
            <p className="line-clamp-2 max-w-2xl text-sm text-white/85">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Solid bottom info bar — matches the grid cards' footer. */}
      <footer className="flex items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs">
        {creatorName ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-text-secondary">
            <Avatar src={item.creator!.avatarUrl} name={creatorName} size="xs" />
            <span className="truncate">{creatorName}</span>
          </span>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-text-muted">
            <Avatar name="?" size="xs" />
            <span className="truncate italic">
              {t("community.marketplaceUnattributed", "Community")}
            </span>
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-3 text-text-muted">
          {typeof item.itemCount === "number" && item.kind !== "story" ? (
            <span className="tabular-nums">
              {item.itemCount} {t("community.addonsItems")}
            </span>
          ) : null}
          {item.upvoteCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 tabular-nums font-semibold text-text-secondary">
              <Icon name="chevronUp" size={13} aria-hidden />
              {item.upvoteCount}
            </span>
          ) : null}
        </span>
      </footer>
    </button>
  );
}
