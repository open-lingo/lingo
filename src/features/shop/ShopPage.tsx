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
  const { lingots, statsReady, isOwned, ownedQuantity } = useShopState();
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

      <AdFreeShopSection lingots={lingots} statsReady={statsReady} />

      {grouped.powerups.length > 0 && (
        <ShopSection
          title={t("shop.sectionPowerups", { defaultValue: "Power-ups" })}
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

type SectionProps = {
  title: string;
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
      <h2 className="mb-3 text-lg font-semibold text-text-primary">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const owned = isOwned(item.id, item.consumable);
          const qty = ownedQuantity(item.id);
          const canAfford = statsReady && lingots !== null && lingots >= item.price;
          const busy = pendingId === item.id;
          const showBuyAgain = item.consumable && qty > 0;

          return (
            <li key={item.id}>
              <Card padding="md" className="flex h-full flex-col">
                <ShopItemPreview item={item} />
                <div className="mt-3 min-w-0">
                  <p className="font-semibold text-text-primary">
                    {t(`shop.items.${item.titleKey}`, { defaultValue: item.id })}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {t(`shop.items.${item.descriptionKey}`, { defaultValue: "" })}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    <Icon name="gem" size={14} aria-hidden />
                    {item.price}
                  </span>
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
                    busy ||
                    (!item.consumable && owned) ||
                    (!canAfford && !showBuyAgain)
                  }
                  onClick={() => onPurchase(item.id, item.price)}
                >
                  {busy
                    ? t("common.loading", { defaultValue: "Loading…" })
                    : !item.consumable && owned
                      ? t("shop.owned", { defaultValue: "Owned" })
                      : showBuyAgain
                        ? t("shop.buyAgain", { defaultValue: "Buy again" })
                        : canAfford
                          ? t("shop.buy", { defaultValue: "Buy" })
                          : t("shop.needMore", { defaultValue: "Need more lingots" })}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
