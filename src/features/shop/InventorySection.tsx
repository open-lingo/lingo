import { useTranslation } from "react-i18next";
import { Card, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { DECORATOR_ITEMS, TITLE_ITEMS, type ShopItem } from "./shopCatalog";
import { DECORATOR_STYLES } from "./decoratorStyles";
import { useShopState } from "./useShopState";
import { useEquippedDecorator } from "./useEquippedDecorator";
import { useEquippedTitle } from "./useEquippedTitle";

type InventorySectionProps = {
  /**
   * Called after the user equips a cosmetic (i.e. equips a new one — NOT
   * after unequipping). The profile popout uses this to close itself on
   * equip as a small UX delight while staying open for unequip so the
   * user can browse and pick a different one.
   */
  onAfterEquip?: () => void;
  /**
   * When true the top-level section header is suppressed — useful when
   * the section is embedded in a popout that already has its own title
   * bar.
   */
  hideHeading?: boolean;
};

/**
 * Inventory — the unified cosmetic editor. One panel per cosmetic
 * category (Frames, Titles, future: Banners), each with a "currently
 * equipped" strip + a grid of owned items. Equipping flips the user's
 * settings for that category; unequipping is one-tap from the equipped
 * strip.
 *
 * Used as the body of the profile-page inventory popout.
 */
export function InventorySection({ onAfterEquip, hideHeading }: InventorySectionProps = {}) {
  const { t } = useTranslation();
  const { shop } = useShopState();
  const decorator = useEquippedDecorator();
  const title = useEquippedTitle();

  const ownedFrames = DECORATOR_ITEMS.filter((i) => shop.purchases.includes(i.id));
  const ownedTitles = TITLE_ITEMS.filter((i) => shop.purchases.includes(i.id));

  const hasAny = ownedFrames.length > 0 || ownedTitles.length > 0;

  return (
    <section className={hideHeading ? undefined : "mt-10"}>
      {!hideHeading && (
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("shop.sectionInventory", "Your decorators")}
        </h2>
      )}

      {!hasAny ? (
        <p className="text-sm text-text-secondary">
          {t(
            "shop.noCosmeticsOwned",
            "You don't own any cosmetics yet. Visit the shop to buy some.",
          )}
        </p>
      ) : (
        <div className="space-y-6">
          <CosmeticCategory
            label={t("shop.sectionFrames", "Avatar frames")}
            owned={ownedFrames}
            equippedId={decorator.equippedId}
            isEquipping={decorator.isEquipping}
            renderSwatch={(item) => (
              <FrameSwatch decoratorId={item.decoratorId!} />
            )}
            renderEquippedSwatch={() =>
              decorator.equippedId ? (
                <FrameSwatch
                  decoratorId={
                    DECORATOR_ITEMS.find((d) => d.id === decorator.equippedId)
                      ?.decoratorId ?? ""
                  }
                />
              ) : null
            }
            onEquip={(id) => {
              decorator.equip(id);
              onAfterEquip?.();
            }}
            onUnequip={() => decorator.equip(null)}
            emptyLabel={t("shop.noFramesOwned", "No frames owned.")}
            t={t}
            getLabel={(item) =>
              t(`shop.items.${item.titleKey}`, { defaultValue: item.id })
            }
            equippedLabel={
              decorator.equippedId
                ? t(
                    `shop.items.${
                      DECORATOR_ITEMS.find((d) => d.id === decorator.equippedId)
                        ?.titleKey ?? ""
                    }`,
                    { defaultValue: decorator.equippedId },
                  )
                : null
            }
          />

          <CosmeticCategory
            label={t("shop.sectionTitles", "Profile titles")}
            owned={ownedTitles}
            equippedId={title.equippedId}
            isEquipping={title.isEquipping}
            renderSwatch={() => (
              <TitleSwatch />
            )}
            renderEquippedSwatch={() =>
              title.equippedId ? <TitleSwatch /> : null
            }
            onEquip={(id) => {
              title.equip(id);
              onAfterEquip?.();
            }}
            onUnequip={() => title.equip(null)}
            emptyLabel={t("shop.noTitlesOwned", "No titles owned.")}
            t={t}
            getLabel={(item) => {
              const base = item.titleKey.replace(/\.title$/, "");
              return t(`shop.items.${base}.wear`, {
                defaultValue: t(`shop.items.${item.titleKey}`, {
                  defaultValue: item.id,
                }),
              });
            }}
            equippedLabel={(() => {
              if (!title.equippedId) return null;
              const item = TITLE_ITEMS.find((i) => i.id === title.equippedId);
              if (!item) return title.equippedId;
              const base = item.titleKey.replace(/\.title$/, "");
              return t(`shop.items.${base}.wear`, {
                defaultValue: t(`shop.items.${item.titleKey}`, {
                  defaultValue: item.id,
                }),
              });
            })()}
          />

          {/* Banners — stub. No banner SKUs ship yet, but rendering the
              category empty-state communicates that this surface will
              hold them when they do, so testers stop reporting "where
              are my banners". */}
          <CosmeticCategory
            label={t("shop.sectionBanners", "Profile banners")}
            owned={[]}
            equippedId={null}
            isEquipping={false}
            renderSwatch={() => null}
            renderEquippedSwatch={() => null}
            onEquip={() => {}}
            onUnequip={() => {}}
            emptyLabel={t(
              "shop.noBannersOwned",
              "No banners available yet.",
            )}
            t={t}
            getLabel={() => ""}
            equippedLabel={null}
          />
        </div>
      )}
    </section>
  );
}

// ─── Category block ──────────────────────────────────────────────────────────

type CosmeticCategoryProps = {
  label: string;
  owned: ShopItem[];
  equippedId: string | null;
  isEquipping: boolean;
  renderSwatch: (item: ShopItem) => React.ReactNode;
  renderEquippedSwatch: () => React.ReactNode;
  onEquip: (itemId: string) => void;
  onUnequip: () => void;
  emptyLabel: string;
  equippedLabel: string | null;
  getLabel: (item: ShopItem) => string;
  t: ReturnType<typeof useTranslation>["t"];
};

function CosmeticCategory({
  label,
  owned,
  equippedId,
  isEquipping,
  renderSwatch,
  renderEquippedSwatch,
  onEquip,
  onUnequip,
  emptyLabel,
  equippedLabel,
  getLabel,
  t,
}: CosmeticCategoryProps) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </h3>

      {/* Currently-equipped strip. Always present (even when nothing is
          equipped) so the user has a fixed place to look for the
          "currently on" cosmetic + a one-tap unequip. */}
      <div className="mb-3 rounded-lg border border-border bg-surface-muted/40 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t("shop.currentlyEquipped", "Currently equipped")}
        </p>
        {equippedId && equippedLabel ? (
          <div className="flex items-center gap-3">
            {renderEquippedSwatch()}
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
              {equippedLabel}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isEquipping}
              onClick={onUnequip}
              className="!gap-1.5"
            >
              <Icon name="close" size={14} aria-hidden />
              {t("shop.unequip", "Unequip")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {t("shop.noneEquipped", "Nothing equipped.")}
          </p>
        )}
      </div>

      {owned.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {owned.map((item) => {
            const isEquipped = equippedId === item.id;
            return (
              <li key={item.id}>
                <Card padding="sm" className="flex items-center gap-3">
                  {renderSwatch(item)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {getLabel(item)}
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
                    onClick={() => {
                      if (isEquipped) {
                        onUnequip();
                      } else {
                        onEquip(item.id);
                      }
                    }}
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
      )}
    </div>
  );
}

// ─── Swatches ────────────────────────────────────────────────────────────────

function FrameSwatch({ decoratorId }: { decoratorId: string }) {
  const style = DECORATOR_STYLES[decoratorId];
  if (!style) return null;
  return (
    <div
      className="h-10 w-10 shrink-0 rounded-full p-[3px]"
      style={{ background: style.background }}
      aria-hidden
    >
      <div className="h-full w-full rounded-full bg-surface" />
    </div>
  );
}

function TitleSwatch() {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-muted"
      aria-hidden
    >
      <Icon name="crown" size={18} />
    </div>
  );
}
