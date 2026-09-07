import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { useToast } from "@/shared/contexts/ToastContext";
import { AD_FREE_SKUS, type AdFreeSku } from "./config";
import { useAdFreeStatus } from "./useAdFreeStatus";
import {
  useBuyAdFreeTime,
  type AdFreePurchaseFailure,
} from "./useBuyAdFreeTime";

type Props = {
  lingots: number | null;
  statsReady: boolean;
};

function formatHM(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDeadline(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Ad-free SKU cards rendered in the shop. Each card shows the
 * duration, price, and current ad-free remaining time. Confirms before
 * spending lingots; toasts the result.
 */
export function AdFreeShopSection({ lingots, statsReady }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const status = useAdFreeStatus();
  const buyAdFreeTime = useBuyAdFreeTime();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmSku, setConfirmSku] = useState<AdFreeSku | null>(null);

  const handleConfirm = async () => {
    if (!confirmSku) return;
    const sku = confirmSku;
    setConfirmSku(null);
    setPendingId(sku.id);
    try {
      const result = await buyAdFreeTime(sku.id);
      if (result.ok) {
        showToast(
          t("adFree.toast.success", {
            defaultValue: "You're ad-free until {{time}}!",
            time: formatDeadline(result.newUntil),
          }),
          "success",
        );
      } else {
        showToast(failureMessage(result, t), "error");
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <section id="ad-free">
      <h2 className="mb-1 text-lg font-semibold text-text-primary">
        {t("adFree.shop.sectionTitle", { defaultValue: "Ad-free time" })}
      </h2>
      <p className="mb-3 text-sm text-text-secondary">
        {t("adFree.shop.sectionBlurb", {
          defaultValue:
            "Hide every ad surface for a while. Ad-free is a reward for genuine learning — pace yourself.",
        })}
      </p>

      <div
        className="mb-3 rounded-card border border-border bg-surface-muted px-3 py-2 text-sm"
        role="status"
        aria-live="polite"
      >
        {status.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-success">
            <Icon name="shieldCheck" size={14} aria-hidden />
            {t("adFree.shop.statusActive", {
              defaultValue: "You have {{remaining}} of ad-free time remaining.",
              remaining: formatHM(status.remainingMs),
            })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Icon name="shield" size={14} aria-hidden />
            {t("adFree.shop.statusInactive", {
              defaultValue: "No ad-free time active right now.",
            })}
          </span>
        )}
      </div>

      {/* Spencer TestFlight #45: 3 full-width stacked cards (icon + title +
          description + a right-aligned duration row + a full-width Buy
          button) ran long on a phone for what is, at a glance, "pick a
          duration, buy it". 2-up below `sm` with a tighter, icon+title+price
          compact card; the fuller sm:+ card (description, separate duration
          row) is unchanged at tablet/desktop width. */}
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {AD_FREE_SKUS.map((sku) => {
          const canAfford = statsReady && lingots !== null && lingots >= sku.price;
          const busy = pendingId === sku.id;
          return (
            <li key={sku.id}>
              <Card padding="sm" className="flex h-full flex-col sm:p-5">
                <div className="flex items-center gap-2 sm:items-start sm:gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent sm:h-9 sm:w-9"
                    aria-hidden
                  >
                    <Icon
                      name={sku.id === "30m" ? "clock" : sku.id === "2h" ? "shield" : "moon"}
                      size={16}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text-primary">
                      {t(`adFree.skus.${sku.i18nKey}.title`, {
                        defaultValue: sku.id,
                      })}
                    </p>
                    {/* Duration folds into the header on the compact mobile
                        card instead of its own row — description drops below
                        `sm` (title + duration + Buy is the whole compact
                        card; the fuller card at `sm`+ keeps it). */}
                    <p className="text-xs text-text-muted tabular-nums sm:hidden">
                      {formatHM(sku.durationMs)}
                    </p>
                    <p className="mt-0.5 hidden text-sm text-text-secondary sm:block">
                      {t(`adFree.skus.${sku.i18nKey}.description`, {
                        defaultValue: "",
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 hidden items-center justify-end gap-2 sm:flex">
                  <span className="text-xs text-text-muted tabular-nums">
                    {formatHM(sku.durationMs)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="mt-2.5 w-full sm:mt-3"
                  disabled={!statsReady || busy || !canAfford}
                  title={
                    !canAfford && statsReady
                      ? t("adFree.shop.tooltipInsufficient", {
                          defaultValue:
                            "You need {{needed}} more lingots.",
                          needed: lingots === null ? sku.price : sku.price - lingots,
                        })
                      : undefined
                  }
                  onClick={() => setConfirmSku(sku)}
                >
                  {busy ? (
                    t("common.loading", { defaultValue: "Loading…" })
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {!canAfford ? (
                        <Icon name="lock" size={15} aria-hidden />
                      ) : null}
                      {t("adFree.shop.buy", { defaultValue: "Buy" })}
                      <span className="inline-flex items-center gap-0.5 font-bold">
                        <Icon name="gem" size={13} aria-hidden />
                        {sku.price}
                      </span>
                    </span>
                  )}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>

      {confirmSku ? (
        <ConfirmModal
          title={t("adFree.confirm.title", {
            defaultValue: "Confirm ad-free purchase",
          })}
          message={t("adFree.confirm.message", {
            defaultValue:
              "Spend {{price}} lingots for {{duration}} of ad-free time?",
            price: confirmSku.price,
            duration: formatHM(confirmSku.durationMs),
          })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          confirmLabel={t("adFree.confirm.confirm", {
            defaultValue: "Spend lingots",
          })}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmSku(null)}
        />
      ) : null}
    </section>
  );
}

function failureMessage(
  result: AdFreePurchaseFailure,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  switch (result.reason) {
    case "insufficient_lingots":
      return t("adFree.toast.insufficient", {
        defaultValue: "Not enough lingots for that pack.",
      });
    case "grind_lock":
      return t("adFree.toast.grindLock", {
        defaultValue:
          "Ad-free time is a reward for genuine learning, not lingot farming. Take a break and come back tomorrow.",
      });
    case "cap_reached":
      return t("adFree.toast.capReached", {
        defaultValue:
          "You've hit the 6h daily ad-free cap. Try again later.",
      });
  }
}
