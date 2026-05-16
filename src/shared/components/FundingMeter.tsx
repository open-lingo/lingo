import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useFundingTransparency } from "@/features/funding/useFundingTransparency";

export function FundingMeter() {
  const { t } = useTranslation();
  const { data } = useFundingTransparency();
  const adPercent = data?.adFundedPercent ?? 40;
  const premiumPercent = data?.premiumPercent ?? 100 - adPercent;
  const source = data?.source ?? "estimated";

  return (
    <div
      className="funding-meter fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-surface px-4 py-2 shadow-card"
      role="status"
      aria-label={t("funding.ariaLabel", {
        adPercent,
        premiumPercent,
      })}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-warning transition-[width] duration-500"
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
          title={t("funding.tooltip", {
            period: data?.periodLabel ?? "Last 30 days",
            source,
            defaultValue:
              "{{period}} · {{source}} data. Premium reduces ads. We do not sell your data.",
          })}
          aria-label={t("funding.hideWithPremium")}
        >
          <Icon name="info" size={16} />
        </span>
      </div>
    </div>
  );
}
