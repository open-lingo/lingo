import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import type { IconName } from "@/shared/iconRegistry";
import { getDecoratorStyle } from "../decoratorStyles";
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
 *   - banner  → small banner SVG thumbnail in a 6:1 strip (added with banners SKUs)
 *   - other   → fallback to the lucide icon at large size (power-ups etc.)
 *
 * Always fills the width of its parent and is `aria-hidden` — the card's
 * title + description carry the semantic label.
 */
export function ShopItemPreview({ item }: { item: ShopItem }) {
  if (item.decoratorId) {
    return <FramePreview decoratorId={item.decoratorId} />;
  }
  if (item.titleId) {
    return <TitlePreview item={item} />;
  }
  return <IconPreview iconName={item.iconName as IconName} />;
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

// ─── Fallback (powerups) ─────────────────────────────────────────────────────

/**
 * Bigger version of the small icon. Power-ups don't have a "what does it
 * look like equipped" preview, so we promote the lucide glyph to a larger
 * disc to match the visual weight of frame/title/banner previews.
 */
function IconPreview({ iconName }: { iconName: IconName }) {
  return (
    <div className="flex items-center justify-center py-2" aria-hidden>
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-muted">
        <Icon name={iconName} size={32} strokeWidth={1.75} />
      </span>
    </div>
  );
}
