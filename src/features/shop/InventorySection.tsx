import { useTranslation } from "react-i18next";
import { Card, Button } from "@/shared/components/ui";
import { DECORATOR_ITEMS } from "./shopCatalog";
import { DECORATOR_STYLES } from "./decoratorStyles";
import { useShopState } from "./useShopState";
import { useEquippedDecorator } from "./useEquippedDecorator";

/**
 * Inventory section for the profile page.
 * Shows owned decorators and lets the user equip / unequip one.
 */
export function InventorySection() {
  const { t } = useTranslation();
  const { shop } = useShopState();
  const { equippedId, equip, isEquipping } = useEquippedDecorator();

  const ownedDecorators = DECORATOR_ITEMS.filter((item) =>
    shop.purchases.includes(item.id),
  );

  if (ownedDecorators.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("shop.sectionInventory", "Your decorators")}
        </h2>
        <p className="text-sm text-text-secondary">
          {t(
            "shop.noDecoratorsOwned",
            "You don't own any decorators yet. Visit the shop to buy one.",
          )}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("shop.sectionInventory", "Your decorators")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {ownedDecorators.map((item) => {
          const style = DECORATOR_STYLES[item.decoratorId!];
          const isEquipped = equippedId === item.id;

          return (
            <li key={item.id}>
              <Card padding="sm" className="flex items-center gap-3">
                {/* Ring preview swatch */}
                <div
                  className="h-10 w-10 shrink-0 rounded-full p-[3px]"
                  style={{ background: style?.background }}
                  aria-hidden
                >
                  <div className="h-full w-full rounded-full bg-surface" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {t(`shop.items.${item.titleKey}`, { defaultValue: item.id })}
                  </p>
                  {isEquipped && (
                    <p className="text-xs text-accent">
                      {t("shop.equipped", "Equipped")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isEquipped ? "outline" : "primary"}
                  disabled={isEquipping}
                  onClick={() => equip(isEquipped ? null : item.id)}
                >
                  {isEquipped
                    ? t("shop.unequip", "Unequip")
                    : t("shop.equip", "Equip")}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
