import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { Avatar } from "@/shared/components/ui/Avatar";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getDeckImageUrl } from "@/features/flashcards/data/loadDeck";
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
 * FeaturedHero — the large spotlight tile at the top of the marketplace home.
 * Cover-art background with a gradient scrim and overlaid metadata, mirroring
 * the profile-banner masthead treatment. Clicking opens the preview.
 */
export function FeaturedHero({ item, onPreview }: FeaturedHeroProps) {
  const { t } = useTranslation();
  const lang = getLanguageConfig(item.languageId);
  const langName = lang?.name ?? item.languageId;
  const flag = lang?.flag ?? "🌐";
  const coverUrl = getDeckImageUrl(item.id, item.image, "800/400");
  const creatorName = item.creator?.displayName;

  return (
    <button
      type="button"
      onClick={onPreview}
      disabled={!onPreview}
      className="group relative flex h-52 w-full flex-col justify-end overflow-hidden rounded-xl border border-border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-56"
    >
      <img
        src={coverUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        <Icon name="sparkles" size={13} aria-hidden />
        {t("community.homeFeaturedBadge", "Featured")}
      </span>

      <div className="relative z-10 space-y-2 p-5 text-white">
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
        <div className="flex items-center gap-3 pt-1 text-xs text-white/85">
          {creatorName ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar src={item.creator!.avatarUrl} name={creatorName} size="xs" />
              <span>{creatorName}</span>
            </span>
          ) : null}
          {typeof item.itemCount === "number" && item.kind !== "story" ? (
            <span className="tabular-nums">
              {item.itemCount} {t("community.addonsItems")}
            </span>
          ) : null}
          {item.upvoteCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              <Icon name="chevronUp" size={13} aria-hidden />
              {item.upvoteCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
