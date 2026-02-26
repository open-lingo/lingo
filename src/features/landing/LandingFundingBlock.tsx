import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/** Same mock as FundingMeter; centralize if needed. */
const AD_FUNDED_PERCENT = 40;

export function LandingFundingBlock() {
  const { t } = useTranslation();
  const adPercent = AD_FUNDED_PERCENT;
  const premiumPercent = 100 - adPercent;

  return (
    <div
      className="rounded-xl border border-border bg-surface p-4"
      role="status"
      aria-label={t("funding.ariaLabel", {
        adPercent,
        premiumPercent,
      })}
    >
      <div className="flex items-center gap-2">
        <Icon name="info" size={18} className="shrink-0 text-text-muted" />
        <h3 className="text-sm font-medium text-text-primary">
          {t("landing.fundingTitle", "How we stay free")}
        </h3>
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        {t(
          "landing.fundingDesc",
          "Open Lingo is funded by a mix of ads and premium support. Lower ad share = more sustainable. Premium users can hide the funding bar."
        )}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-warning"
            style={{ width: `${adPercent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-text-secondary">
          {t("funding.adFunded", { percent: adPercent })}
        </span>
        <span className="shrink-0 text-xs text-text-muted">
          {t("funding.premium", { percent: premiumPercent })}
        </span>
      </div>
    </div>
  );
}
