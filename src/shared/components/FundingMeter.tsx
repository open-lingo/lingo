import { useTranslation } from "react-i18next";

/**
 * Shows how much the service is funded by ads vs premium.
 * Lower ad % = more sustainable. Mock value for now; plug in real data later.
 */
const MOCK_AD_FUNDED_PERCENT = 40;

function InfoIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function FundingMeter() {
  const { t } = useTranslation();
  const adPercent = MOCK_AD_FUNDED_PERCENT;
  const premiumPercent = 100 - adPercent;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-800 dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]"
      role="status"
      aria-label={t("funding.ariaLabel", {
        adPercent,
        premiumPercent,
      })}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
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
        <span
          className="flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
          title={t("funding.hideWithPremium")}
          aria-label={t("funding.hideWithPremium")}
        >
          <InfoIcon />
        </span>
      </div>
    </div>
  );
}
