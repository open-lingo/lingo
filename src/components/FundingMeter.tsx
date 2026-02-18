import { useTranslation } from "react-i18next";

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
      className="border-b border-gray-200 bg-gray-50 px-4 py-1.5 dark:border-gray-800 dark:bg-gray-800/80"
      role="status"
      aria-label={t("funding.ariaLabel", {
        adPercent,
        premiumPercent,
      })}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-amber-500 dark:bg-amber-600"
              style={{ width: `${adPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("funding.adFunded", { percent: adPercent })}
          </span>
        </div>
        <span className="hidden text-xs text-gray-500 dark:text-gray-500 sm:inline">
          {t("funding.premium", { percent: premiumPercent })}
        </span>
      </div>
    </div>
  );
}
