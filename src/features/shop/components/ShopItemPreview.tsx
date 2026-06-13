import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { getDecoratorStyle } from "../decoratorStyles";
import { getBannerStyle } from "../bannerStyles";
import type { ShopItem } from "../shopCatalog";

/**
 * Per-item visual preview rendered at the top of each shop card.
 *
 * The preview always wins over the small icon — buyers want to see what
 * they're buying, not a 20px lucide glyph. We dispatch on the item's
 * cosmetic flavor:
 *
 *   - frame   → empty-avatar silhouette + the gradient ring
 *   - title   → crown + the wear-text styled like the profile masthead
 *   - banner  → 6:1 inline-SVG thumbnail at ~60px tall
 *   - other   → fallback to the lucide icon at large size (power-ups etc.)
 *
 * Always fills the width of its parent and is `aria-hidden` — the card's
 * title + description carry the semantic label.
 */
export function ShopItemPreview({
  item,
  tint,
}: {
  item: ShopItem;
  /** Section identity tint for icon items — one sharp colored element
   *  per card (frames/banners carry their own color). */
  tint?: string;
}) {
  if (item.decoratorId) {
    return <FramePreview decoratorId={item.decoratorId} />;
  }
  if (item.titleId) {
    return <TitlePreview item={item} />;
  }
  if (item.bannerId) {
    return <BannerPreview bannerId={item.bannerId} />;
  }
  return <IconPreview iconName={item.iconName as IconName} tint={tint} />;
}

// ─── Frame ───────────────────────────────────────────────────────────────────

/**
 * Empty-avatar silhouette ringed by the frame's gradient. The placeholder
 * silhouette is a `user` lucide on a muted disc so the ring is the loud
 * element and the inside reads as "your avatar will sit here".
 */
function FramePreview({ decoratorId }: { decoratorId: string }) {
  const style = getDecoratorStyle(decoratorId);
  if (!style) return null;
  return (
    <div className="flex items-center justify-center py-2" aria-hidden>
      <div
        className="inline-flex items-center justify-center rounded-full p-[4px]"
        style={{ background: style.background }}
        role="presentation"
      >
        <div className="rounded-full bg-surface p-[3px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-muted">
            <Icon name="user" size={36} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Title ───────────────────────────────────────────────────────────────────

/**
 * Renders the wear-text the same way it appears under the display name on
 * the public profile masthead: small crown + accent-colored medium-weight
 * text. Showing the actual text makes the value tangible (vs. a generic
 * "title" icon).
 */
function TitlePreview({ item }: { item: ShopItem }) {
  const { t } = useTranslation();
  const base = item.titleKey.replace(/\.title$/, "");
  const wear = t(`shop.items.${base}.wear`, {
    defaultValue: t(`shop.items.${item.titleKey}`, { defaultValue: item.id }),
  });
  return (
    <div className="flex items-center justify-center py-4" aria-hidden>
      <span className="inline-flex items-center gap-1.5 text-base font-medium text-accent">
        <Icon name="crown" size={16} strokeWidth={2.25} aria-hidden />
        {wear}
      </span>
    </div>
  );
}

// ─── Banner ──────────────────────────────────────────────────────────────────

/**
 * Banner thumbnail. Renders the inline SVG art via the bannerStyles
 * registry so the buyer sees what they'll equip on their profile. The
 * svg uses `xMidYMid slice` so the 6:1 art fills the strip without
 * letterboxing; ~60px tall keeps the shop card compact.
 */
function BannerPreview({ bannerId }: { bannerId: string }) {
  const style = getBannerStyle(bannerId);
  if (!style) return null;
  const Svg = style.Svg;
  return (
    <div
      className="-mx-1 overflow-hidden rounded-md border border-border"
      aria-hidden
    >
      <Svg
        preserveAspectRatio="xMidYMid slice"
        className="block h-[60px] w-full"
      />
    </div>
  );
}

// ─── Fallback (powerups) ─────────────────────────────────────────────────────

/**
 * Bigger version of the small icon. Power-ups don't have a "what does it
 * look like equipped" preview, so we promote the lucide glyph to a larger
 * disc to match the visual weight of frame/title/banner previews.
 */
function IconPreview({ iconName, tint }: { iconName: IconName; tint?: string }) {
  return (
    <div className="flex items-center justify-center py-2" aria-hidden>
      <span
        className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${
          tint ?? "bg-surface-muted text-text-muted"
        }`}
      >
        <Icon name={iconName} size={32} strokeWidth={1.75} />
      </span>
    </div>
  );
}
