import { useTranslation } from "react-i18next";
import { Modal, Button } from "@/shared/components/ui";
import type { ButtonVariant } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { ShopItemPreview } from "./ShopItemPreview";
import type { ShopItem } from "../shopCatalog";

/** Mirrors `ActionState` in ShopPage.tsx (not imported to keep this file
 *  standalone) — the card and the modal render the exact same action so
 *  tapping through from Preview never shows a different state. */
type ModalAction = {
  label: string;
  variant: ButtonVariant;
  disabled: boolean;
  showLock: boolean;
  onClick: () => void;
};

type ShopItemPreviewModalProps = {
  /** The item being previewed, or `null` when the modal is closed. */
  item: ShopItem | null;
  /** Section identity tint, passed straight through to ShopItemPreview so
   *  a power-up's icon preview matches its card. */
  tint?: string;
  onClose: () => void;
  /** Buy/Equip action mirrored from the card. `null` only when `item` is
   *  `null` (modal closed). */
  action: ModalAction | null;
};

/**
 * "Try it on" preview — TestFlight #143: the founder's cards were too
 * cramped for a real look at the cosmetic ("Button sizes too small to
 * purchase... Preview and buy button maybe all we need?"). This is the
 * smallest correct version of that: an enlarged, uncluttered look at the
 * same visual the card already renders (frame ring / title wear-text /
 * banner art), plus price and the same primary action as the card — no
 * purchase happens just from opening it.
 */
export function ShopItemPreviewModal({
  item,
  tint,
  onClose,
  action,
}: ShopItemPreviewModalProps) {
  const { t } = useTranslation();
  const name = item ? t(`shop.items.${item.titleKey}`, { defaultValue: item.id }) : "";

  return (
    <Modal open={item !== null} onClose={onClose} title={name} size="sm">
      {item && action && (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-full max-w-[240px]">
            <ShopItemPreview item={item} tint={tint} />
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary">
            <Icon name="gem" size={14} aria-hidden />
            {item.price}
          </p>
          <Button
            type="button"
            variant={action.variant}
            className="min-h-[44px] w-full"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <span className="inline-flex items-center gap-1.5">
              {action.showLock ? <Icon name="lock" size={13} aria-hidden /> : null}
              {action.label}
            </span>
          </Button>
        </div>
      )}
    </Modal>
  );
}
