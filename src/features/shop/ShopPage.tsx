import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  Button,
  EmptyState,
  SegmentedControl,
  type SegmentedOption,
} from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { LingotBalance } from "@/shared/components/LingotBalance";
import { PageShell } from "@/shared/components/PageShell";
import { useToast } from "@/shared/contexts/ToastContext";
import { useApi } from "@/shared/api";
import { ApiError } from "@/shared/api/client";
import { SHOP_ITEMS, type ShopItem } from "./shopCatalog";
import { useInvalidateShopQueries, useShopState } from "./useShopState";
import { AdFreeShopSection } from "@/features/adFree/AdFreeShopSection";
import { getBannerStyle } from "./bannerStyles";
import { ShopItemPreview } from "./components/ShopItemPreview";
import { useRewardedAd } from "@/features/ads/useRewardedAd";

/**
 * Ownership filter applied to the whole page. "All" is the default; the
 * other two trim every section to either owned-only or unowned-only
 * items. Ad-free time is exempt — it's a timed power-up with no purchase
 * record, so it always renders.
 */
type OwnershipFilter = "all" | "owned" | "unowned";

/**
 * One of the four item-type bands we group cosmetics by. Power-ups are
 * the first band (consumable, no decorator); the rest are cosmetics
 * grouped by what visual slot they fill on the profile masthead.
 */
type GroupKey = "powerups" | "frames" | "titles" | "banners";

function getGroupKey(item: ShopItem): GroupKey | null {
  if (item.category === "powerups") return "powerups";
  if (item.decoratorId) return "frames";
  if (item.titleId) return "titles";
  if (item.bannerId) return "banners";
  return null;
}

export default function ShopPage() {
  const { t } = useTranslation();
  const { progress } = useApi();
  const { showToast } = useToast();
  const invalidate = useInvalidateShopQueries();
  const { lingots, statsReady, statsError, isOwned, ownedQuantity, refetchStats } =
    useShopState();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OwnershipFilter>("all");
  const rewardedAd = useRewardedAd();

  const purchaseMutation = useMutation({
    mutationFn: (itemId: string) => progress.purchaseShopItem(itemId),
    onSuccess: (_res, itemId) => {
      invalidate();
      const item = SHOP_ITEMS.find((i) => i.id === itemId);
      showToast(
        t("shop.purchaseSuccess", {
          defaultValue: "Purchased {{name}}!",
          name: item
            ? t(`shop.items.${item.titleKey}`, { defaultValue: item.id })
            : itemId,
        }),
        "success",
      );
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 400) {
        showToast(
          t("shop.insufficientLingots", { defaultValue: "Not enough lingots." }),
          "error",
        );
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        showToast(t("shop.alreadyOwned", { defaultValue: "You already own this." }), "info");
        return;
      }
      showToast(
        t("shop.purchaseFailed", { defaultValue: "Purchase failed — try again." }),
        "error",
      );
    },
    onSettled: () => setPendingId(null),
  });

  const handlePurchase = (itemId: string, price: number) => {
    if (!statsReady || lingots === null) return;
    if (lingots < price) {
      showToast(
        t("shop.insufficientLingots", { defaultValue: "Not enough lingots." }),
        "error",
      );
      return;
    }
    // One purchase at a time. Two taps ~200ms apart used to abort the first
    // request client-side (shared abort tag) AFTER the server had already
    // deducted lingots — the user saw "Purchase failed" for a purchase that
    // succeeded, and retrying a consumable double-charged. The tag is gone
    // from the POST; this keeps a second request from being started at all.
    if (pendingId !== null) return;
    setPendingId(itemId);
    purchaseMutation.mutate(itemId);
  };

  // Predicate the active tab applies to every item. "all" is permissive
  // (everything renders); the other two narrow by purchase state. For
  // consumables, "owned" means at least one is in inventory.
  const passesFilter = (item: ShopItem): boolean => {
    if (filter === "all") return true;
    const owned = isOwned(item.id, item.consumable);
    return filter === "owned" ? owned : !owned;
  };

  // Group + filter in one pass so each section knows whether it has any
  // surviving items under the active tab (and can hide its heading if
  // not). The group order here drives the on-page order.
  const grouped = useMemo(() => {
    const groups: Record<GroupKey, ShopItem[]> = {
      powerups: [],
      frames: [],
      titles: [],
      banners: [],
    };
    for (const item of SHOP_ITEMS) {
      const key = getGroupKey(item);
      if (!key) continue;
      if (!passesFilter(item)) continue;
      groups[key].push(item);
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, isOwned]);

  const allGroupsEmpty =
    grouped.powerups.length === 0 &&
    grouped.frames.length === 0 &&
    grouped.titles.length === 0 &&
    grouped.banners.length === 0;

  const tabOptions: SegmentedOption<OwnershipFilter>[] = [
    { value: "all", label: t("shop.tabAll", { defaultValue: "All" }) },
    { value: "owned", label: t("shop.tabOwned", { defaultValue: "Owned" }) },
    {
      value: "unowned",
      label: t("shop.tabUnowned", { defaultValue: "Not owned" }),
    },
  ];

  return (
    <PageShell variant="wide" spaceY="lg" className="pb-8">
      <header className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
            {t("shop.title", { defaultValue: "Lingot shop" })}
          </h1>
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            {t("shop.subtitle", {
              defaultValue: "Spend lingots from lessons on cosmetics and power-ups.",
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={rewardedAd.open}
            className="gap-1.5"
            data-testid="shop-get-free-lingots"
          >
            <Icon name="plus" size={14} aria-hidden />
            {t("shop.watchAdCta", { defaultValue: "Get free lingots" })}
          </Button>
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2">
            <span className="text-sm text-text-secondary">
              {t("shop.balanceLabel", { defaultValue: "Your balance" })}
            </span>
            <LingotBalance linkToShop={false} size="md" />
          </div>
        </div>
      </header>

      {/* Balance failed to load. Without this the page silently behaves as if
          the user had 0 lingots — every Buy disabled, no explanation. Say so,
          and offer a retry, rather than letting them conclude they're broke. */}
      {statsError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3"
        >
          <p className="text-sm text-text-primary">
            {t("shop.balanceUnavailable", {
              defaultValue:
                "Couldn't load your lingot balance, so purchases are paused. Your lingots are safe.",
            })}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={refetchStats}>
            {t("common.retry", { defaultValue: "Retry" })}
          </Button>
        </div>
      )}

      {/* Ownership tabs — applies to every section below except ad-free
          (ad-free has no notion of "owned"; it's a timed power-up). */}
      <div data-testid="shop-ownership-tabs" className="flex">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={tabOptions}
          ariaLabel={t("shop.tabsAria", { defaultValue: "Filter by ownership" })}
          size="sm"
        />
      </div>

      {rewardedAd.modalNode}

      <FeaturedBanner
        items={grouped.banners}
        lingots={lingots}
        statsReady={statsReady}
        pendingId={pendingId}
        isOwned={isOwned}
        onPurchase={handlePurchase}
      />

      <AdFreeShopSection lingots={lingots} statsReady={statsReady} />

      {grouped.powerups.length > 0 && (
        <ShopSection
          title={t("shop.sectionPowerups", { defaultValue: "Power-ups" })}
          tint={{ chip: "bg-sky-500", tile: "bg-sky-500/15 text-sky-500" }}
          items={grouped.powerups}
          lingots={lingots}
          statsReady={statsReady}
          pendingId={pendingId}
          isOwned={isOwned}
          ownedQuantity={ownedQuantity}
          onPurchase={handlePurchase}
        />
      )}

      {grouped.frames.length > 0 && (
        <ShopSection
          title={t("shop.sectionFrames", { defaultValue: "Avatar frames" })}
          tint={{ chip: "bg-amber-500", tile: "bg-amber-500/15 text-amber-600" }}
          items={grouped.frames}
          lingots={lingots}
          statsReady={statsReady}
          pendingId={pendingId}
          isOwned={isOwned}
          ownedQuantity={ownedQuantity}
          onPurchase={handlePurchase}
        />
      )}

      {grouped.titles.length > 0 && (
        <ShopSection
          title={t("shop.sectionTitles", { defaultValue: "Profile titles" })}
          tint={{ chip: "bg-violet-500", tile: "bg-violet-500/15 text-violet-500" }}
          items={grouped.titles}
          lingots={lingots}
          statsReady={statsReady}
          pendingId={pendingId}
          isOwned={isOwned}
          ownedQuantity={ownedQuantity}
          onPurchase={handlePurchase}
        />
      )}

      {grouped.banners.length > 0 && (
        <ShopSection
          title={t("shop.sectionBanners", { defaultValue: "Profile banners" })}
          tint={{ chip: "bg-pink-500", tile: "bg-pink-500/15 text-pink-500" }}
          items={grouped.banners}
          lingots={lingots}
          statsReady={statsReady}
          pendingId={pendingId}
          isOwned={isOwned}
          ownedQuantity={ownedQuantity}
          onPurchase={handlePurchase}
        />
      )}

      {/* When the active tab matches zero items across every type band,
          show an EmptyState rather than a wall of empty section
          headings. Copy depends on which filter the user chose. */}
      {allGroupsEmpty && (
        <EmptyState
          title={
            filter === "owned"
              ? t("shop.emptyOwned", {
                  defaultValue: "You don't own anything yet.",
                })
              : t("shop.emptyUnowned", {
                  defaultValue: "You own everything in the shop. Nice.",
                })
          }
          description={
            filter === "owned"
              ? t("shop.emptyOwnedDesc", {
                  defaultValue:
                    "Buy something with your lingots and it'll show up here.",
                })
              : t("shop.emptyUnownedDesc", {
                  defaultValue: "Try the All tab to see your collection.",
                })
          }
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFilter("all")}
            >
              {t("shop.viewAll", { defaultValue: "View all items" })}
            </Button>
          }
        />
      )}

      <Card padding="md" className="border-dashed">
        <p className="text-sm text-text-secondary">
          <Icon name="info" size={16} className="mr-1 inline text-text-muted" aria-hidden />
          {t("shop.earnHint", {
            defaultValue:
              "Earn lingots by completing lessons. Streak bonuses and perfect scores coming soon.",
          })}
        </p>
      </Card>
    </PageShell>
  );
}

/**
 * "Spend your boldness in one place" — a single full-bleed featured
 * banner anchors the page; every card below stays disciplined. Picks
 * the first banner the user doesn't own yet.
 */
function FeaturedBanner({
  items,
  lingots,
  statsReady,
  pendingId,
  isOwned,
  onPurchase,
}: {
  items: ShopItem[];
  lingots: number | null;
  statsReady: boolean;
  pendingId: string | null;
  isOwned: (id: string, consumable: boolean) => boolean;
  onPurchase: (itemId: string, price: number) => void;
}) {
  const { t } = useTranslation();
  const item = items.find((b) => !isOwned(b.id, false));
  if (!item || !item.bannerId) return null;
  const style = getBannerStyle(item.bannerId);
  if (!style) return null;
  const Svg = style.Svg;
  const canAfford = statsReady && lingots !== null && lingots >= item.price;
  const busy = pendingId === item.id;
  // Any purchase in flight locks every buy control — see handlePurchase.
  const anyPending = pendingId !== null;
  return (
    <section
      className="relative overflow-hidden rounded-card border border-border shadow-[var(--shadow-card)]"
      aria-label={t("shop.featured", { defaultValue: "Featured banner" })}
    >
      <Svg
        preserveAspectRatio="xMidYMid slice"
        className="block h-36 w-full sm:h-44"
        aria-hidden
      />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-black/10 to-transparent p-4 sm:p-5">
        <div className="flex w-full items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/80">
              {t("shop.featuredLabel", { defaultValue: "Featured" })}
            </p>
            <p className="truncate text-lg font-extrabold text-white">
              {t(`shop.items.${item.titleKey}`, { defaultValue: item.id })}
            </p>
          </div>
          <Button
            type="button"
            variant="primary-3d"
            size="sm"
            className="shrink-0"
            disabled={!statsReady || anyPending || !canAfford}
            onClick={() => onPurchase(item.id, item.price)}
          >
            {busy ? (
              t("common.loading", { defaultValue: "Loading…" })
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {!canAfford ? <Icon name="lock" size={13} aria-hidden /> : null}
                <Icon name="gem" size={13} aria-hidden />
                {item.price}
              </span>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

type SectionProps = {
  title: string;
  /** Section identity — `chip` colors the header marker, `tile` the
   *  icon previews. One sharp hue per section (power-ups ice, frames
   *  gold, titles violet); fixed hues w/ alpha stay theme-safe. */
  tint?: { chip: string; tile: string };
  items: ShopItem[];
  lingots: number | null;
  statsReady: boolean;
  pendingId: string | null;
  isOwned: (id: string, consumable: boolean) => boolean;
  ownedQuantity: (id: string) => number;
  onPurchase: (itemId: string, price: number) => void;
};

function ShopSection({
  title,
  tint,
  items,
  lingots,
  statsReady,
  pendingId,
  isOwned,
  ownedQuantity,
  onPurchase,
}: SectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary">
        {tint ? (
          <span className={`h-5 w-1.5 rounded-full ${tint.chip}`} aria-hidden />
        ) : null}
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const owned = isOwned(item.id, item.consumable);
          const qty = ownedQuantity(item.id);
          const canAfford = statsReady && lingots !== null && lingots >= item.price;
          const busy = pendingId === item.id;
          // Any purchase in flight locks every buy control — see handlePurchase.
          const anyPending = pendingId !== null;
          const showBuyAgain = item.consumable && qty > 0;

          return (
            <li key={item.id}>
              <Card padding="md" className="flex h-full flex-col">
                <ShopItemPreview item={item} tint={tint?.tile} />
                <div className="mt-3 min-w-0">
                  <p className="font-semibold text-text-primary">
                    {t(`shop.items.${item.titleKey}`, { defaultValue: item.id })}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {t(`shop.items.${item.descriptionKey}`, { defaultValue: "" })}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  {!item.consumable && owned ? (
                    <span className="text-xs font-medium text-success">
                      {t("shop.owned", { defaultValue: "Owned" })}
                    </span>
                  ) : item.consumable && qty > 0 ? (
                    <span className="text-xs font-medium text-text-muted">
                      {t("shop.ownedCount", { defaultValue: "×{{count}} owned", count: qty })}
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant={showBuyAgain ? "outline" : "primary"}
                  size="sm"
                  className="mt-3 w-full"
                  disabled={
                    !statsReady ||
                    anyPending ||
                    (!item.consumable && owned) ||
                    (!canAfford && !showBuyAgain)
                  }
                  onClick={() => onPurchase(item.id, item.price)}
                >
                  {busy ? (
                    t("common.loading", { defaultValue: "Loading…" })
                  ) : !item.consumable && owned ? (
                    t("shop.owned", { defaultValue: "Owned" })
                  ) : (
                    // Price IS the label — a page of "Need more lingots"
                    // read as switched-off; a price + lock still sells.
                    <span className="inline-flex items-center gap-1.5">
                      {!canAfford && !showBuyAgain ? (
                        <Icon name="lock" size={13} aria-hidden />
                      ) : null}
                      {showBuyAgain
                        ? t("shop.buyAgain", { defaultValue: "Buy again" })
                        : t("shop.buy", { defaultValue: "Buy" })}
                      <span className="inline-flex items-center gap-0.5 font-bold">
                        <Icon name="gem" size={13} aria-hidden />
                        {item.price}
                      </span>
                    </span>
                  )}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
