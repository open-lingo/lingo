import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Card, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { LingotBalance } from "@/shared/components/LingotBalance";
import { useToast } from "@/shared/contexts/ToastContext";
import { useApi } from "@/shared/api";
import { ApiError } from "@/shared/api/client";
import { SHOP_ITEMS, type ShopItem } from "./shopCatalog";
import { useInvalidateShopQueries, useShopState } from "./useShopState";
import { AdFreeShopSection } from "@/features/adFree/AdFreeShopSection";

export default function ShopPage() {
  const { t } = useTranslation();
  const { progress } = useApi();
  const { showToast } = useToast();
  const invalidate = useInvalidateShopQueries();
  const { lingots, statsReady, isOwned, ownedQuantity } = useShopState();
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          {t("shop.kicker", { defaultValue: "Rewards" })}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">
          {t("shop.title", { defaultValue: "Lingot shop" })}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          {t("shop.subtitle", {
            defaultValue:
              "Spend lingots you earn from lessons. Sample items for now — cosmetics and power-ups will hook into gameplay soon.",
          })}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-2">
          <span className="text-sm text-text-secondary">
            {t("shop.balanceLabel", { defaultValue: "Your balance" })}
          </span>
          <LingotBalance linkToShop={false} size="md" />
        </div>
      </header>

      <AdFreeShopSection lingots={lingots} statsReady={statsReady} />

      <ShopSection
        title={t("shop.sectionPowerups", { defaultValue: "Power-ups" })}
        items={SHOP_ITEMS.filter((i) => i.category === "powerups")}
        lingots={lingots}
        statsReady={statsReady}
        pendingId={pendingId}
        isOwned={isOwned}
        ownedQuantity={ownedQuantity}
        onPurchase={handlePurchase}
      />

      <ShopSection
        title={t("shop.sectionCosmetics", { defaultValue: "Cosmetics" })}
        items={SHOP_ITEMS.filter((i) => i.category === "cosmetics")}
        lingots={lingots}
        statsReady={statsReady}
        pendingId={pendingId}
        isOwned={isOwned}
        ownedQuantity={ownedQuantity}
        onPurchase={handlePurchase}
      />

      <Card padding="md" className="border-dashed">
        <p className="text-sm text-text-secondary">
          <Icon name="info" size={16} className="mr-1 inline text-text-muted" aria-hidden />
          {t("shop.earnHint", {
            defaultValue:
              "Earn lingots by completing lessons. Streak bonuses and perfect scores coming soon.",
          })}
        </p>
      </Card>
    </div>
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
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const owned = isOwned(item.id, item.consumable);
          const qty = ownedQuantity(item.id);
          const canAfford = statsReady && lingots !== null && lingots >= item.price;
          const busy = pendingId === item.id;
          const showBuyAgain = item.consumable && qty > 0;

          return (
            <li key={item.id}>
              <Card padding="md" className="flex h-full flex-col">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {item.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-text-primary">
                      {t(`shop.items.${item.titleKey}`, { defaultValue: item.id })}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {t(`shop.items.${item.descriptionKey}`, { defaultValue: "" })}
                    </p>
                  </div>
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
