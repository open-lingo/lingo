import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { CARD_SURFACE_CLASSES } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import type { PracticeNavItem } from "@/features/practice/practiceNavItems";
import type { IconName } from "@/shared/iconRegistry";

function trainerLabel(item: PracticeNavItem, t: (k: string) => string): string {
  return item.labelKey ? t(item.labelKey) : (item.label ?? item.to);
}

function HubCard({
  to,
  iconName,
  title,
  description,
  emphasis,
}: {
  to?: string;
  iconName: IconName;
  title: string;
  description: string;
  emphasis?: boolean;
}) {
  const inner = (
    <>
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-primary"
        aria-hidden
      >
        <Icon name={iconName} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold leading-tight text-text-primary sm:text-lg">{title}</h2>
        <p className="mt-1 text-pretty text-xs leading-snug text-text-secondary sm:text-sm">{description}</p>
      </div>
      {to ? (
        <Icon name="arrowBigRight" size={18} className="shrink-0 text-accent rtl:rotate-180" aria-hidden />
      ) : null}
    </>
  );

  const shell = cn(
    CARD_SURFACE_CLASSES.default,
    "flex items-start gap-3 rounded-xl border p-4 text-left transition sm:gap-4 sm:p-5",
    "min-w-0 [overflow-wrap:anywhere]",
    to ? "hover:border-border-muted hover:shadow-sm" : "cursor-not-allowed opacity-75",
  );

  if (!to) {
    return (
      <div className={shell} aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={cn(shell, emphasis && "border-l-[3px] border-l-accent")}
    >
      {inner}
    </Link>
  );
}

export function PracticeGrammarPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const langId = language?.id ?? "ko";
  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const particleItem = navItems.find((item) => item.to.includes("/practice/particles"));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{t("practice.grammarPage.title")}</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-text-secondary">
          {t("practice.grammarPage.intro", { language: languageName })}
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {particleItem ? (
          <li>
            <HubCard
              to={particleItem.to}
              iconName="layers"
              title={trainerLabel(particleItem, t)}
              description={t("practice.grammarPage.particlesDesc")}
              emphasis
            />
          </li>
        ) : null}
        <li>
          <HubCard
            iconName="bookOpen"
            title={t("practice.hub.grammarVerb")}
            description={t("practice.hub.grammarVerbDesc")}
          />
        </li>
        <li>
          <HubCard
            iconName="bookOpen"
            title={t("practice.hub.grammarSentence")}
            description={t("practice.hub.grammarSentenceDesc")}
          />
        </li>
        <li>
          <HubCard
            iconName="bookOpen"
            title={t("practice.hub.grammarRegister")}
            description={t("practice.hub.grammarRegisterDesc")}
          />
        </li>
      </ul>

      <p className="text-center text-xs text-text-muted">{t("practice.grammarPage.footerHint")}</p>
    </div>
  );
}
