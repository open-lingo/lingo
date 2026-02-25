import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * Shows how much the service is funded by ads vs premium.
 * Lower ad % = more sustainable. Mock value for now; plug in real data later.
 */
const MOCK_AD_FUNDED_PERCENT = 40;

export function FundingMeter() {
  const { t } = useTranslation();
  const adPercent = MOCK_AD_FUNDED_PERCENT;
  const premiumPercent = 100 - adPercent;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-surface px-4 py-2 shadow-card"
      role="status"
      aria-label={t("funding.ariaLabel", {
        adPercent,
        premiumPercent,
      })}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-warning"
              style={{ width: `${adPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-text-secondary">
            {t("funding.adFunded", { percent: adPercent })}
          </span>
        </div>
        <span className="hidden text-xs text-text-muted sm:inline">
          {t("funding.premium", { percent: premiumPercent })}
        </span>
        <span
          className="flex h-5 w-5 shrink-0 cursor-help items-center justify-center text-text-muted transition hover:text-text-primary"
          title={t("funding.hideWithPremium")}
          aria-label={t("funding.hideWithPremium")}
        >
          <Icon name="info" size={16} />
        </span>
      </div>
    </div>
  );
}
