import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";

/**
 * Honest "how we stay free" note for the landing page. No fabricated funding
 * percentages — the project is free + open-source today and ad-funding is the
 * aspirational sustainability model, not a live metric.
 */
export function LandingFundingBlock() {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-surface p-4" role="note">
      <div className="flex items-center gap-2">
        <Icon name="info" size={18} className="shrink-0 text-text-muted" />
        <h3 className="text-sm font-medium text-text-primary">
          {t("landing.fundingTitle", "How we stay free")}
        </h3>
      </div>
      <p className="mt-2 text-xs text-text-secondary">
        {t(
          "landing.fundingDesc",
          "Open Lingo is free and open-source. We'll keep the lights on with light, optional ads — never on the learning path — and we'll never sell your data.",
        )}
      </p>
    </div>
  );
}
