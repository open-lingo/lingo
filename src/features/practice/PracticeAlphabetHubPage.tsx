import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { CARD_SURFACE_CLASSES } from "@/shared/components/ui/Card";
import { cn } from "@/shared/components/ui/cn";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import type { PracticeNavItem } from "@/features/practice/practiceNavItems";
import type { AlphabetDef } from "@/shared/domain/languageConfig";
import type { IconName } from "@/shared/iconRegistry";

function trainerLabel(item: PracticeNavItem, t: (k: string) => string): string {
  return item.labelKey ? t(item.labelKey) : (item.label ?? item.to);
}

function ScriptCard({
  title,
  description,
  practiceHref,
  learnHref,
  sample,
}: {
  title: string;
  description?: string;
  practiceHref: string;
  learnHref: string;
  sample?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        CARD_SURFACE_CLASSES.default,
        "flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4 sm:p-5",
        "min-w-0 [overflow-wrap:anywhere]",
      )}
    >
      <div className="flex min-w-0 gap-3">
        {sample ? (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-lg font-medium text-text-primary"
            aria-hidden
          >
            {sample}
          </span>
        ) : (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-muted text-text-primary"
            aria-hidden
          >
            <Icon name="layers" size={22} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 text-pretty text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:w-44">
        <Link
          to={practiceHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover"
        >
          {t("practice.alphabetHub.openScript")}
          <Icon name="arrowBigRight" size={16} className="rtl:rotate-180" aria-hidden />
        </Link>
        <Link
          to={learnHref}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-3 py-2 text-center text-sm font-medium text-text-primary transition hover:bg-surface"
        >
          {t("practice.alphabetHub.guidedLesson")}
        </Link>
      </div>
    </div>
  );
}

function TrainerShortcutCard({
  item,
  iconName,
}: {
  item: PracticeNavItem;
  iconName: IconName;
}) {
  const { t } = useTranslation();
  const label = trainerLabel(item, t);
  return (
    <Link
      to={item.to}
      className={cn(
        CARD_SURFACE_CLASSES.muted,
        "flex items-center gap-3 rounded-card border border-border p-4 transition hover:border-border-muted hover:bg-surface sm:p-5",
        "min-w-0 [overflow-wrap:anywhere]",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-text-primary" aria-hidden>
        {item.iconName ? (
          <Icon name={item.iconName} size={20} />
        ) : item.sampleCharacter ? (
          <span className="text-lg">{item.sampleCharacter}</span>
        ) : (
          <Icon name={iconName} size={20} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-text-primary">{label}</span>
        <p className="mt-0.5 text-xs text-text-secondary">{t("practice.alphabetHub.trainerShortcutHint")}</p>
      </div>
      <Icon name="arrowBigRight" size={18} className="shrink-0 text-accent rtl:rotate-180" aria-hidden />
    </Link>
  );
}

function firstCharSample(alpha: AlphabetDef): string | undefined {
  const c = alpha.characters?.[0] ?? alpha.sections?.[0]?.characters?.[0];
  return c;
}

export function PracticeAlphabetHubPage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const cfg = language ? getLanguageConfig(language.id) : null;
  const scripts = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const trainers = navItems.filter((i) => !i.to.endsWith("/practice/flashcards"));
  const kanji = trainers.filter((i) => i.to.includes("/practice/kanji"));
  const components = trainers.filter((i) => i.to.includes("/practice/components"));

  const hasScripts = scripts.length > 0 || kanji.length > 0 || components.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{t("practice.alphabetHub.title")}</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-text-secondary">
          {t("practice.alphabetHub.intro")}
        </p>
      </header>

      {!hasScripts ? (
        <p className="rounded-card border border-border bg-surface-muted px-4 py-6 text-center text-sm text-text-secondary">
          {t("practice.alphabetHub.empty")}
        </p>
      ) : (
        <>
          {scripts.length > 0 ? (
            <section aria-labelledby="alphabet-hub-scripts">
              <h2 id="alphabet-hub-scripts" className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t("practice.alphabetHub.scriptsHeading")}
              </h2>
              <ul className="space-y-3">
                {scripts.map((alpha) => (
                  <li key={alpha.id}>
                    <ScriptCard
                      title={alpha.name}
                      description={alpha.description}
                      practiceHref={langPath(`practice/alphabet/${alpha.id}`)}
                      learnHref={langPath(`practice/alphabet/${alpha.id}/learn`)}
                      sample={firstCharSample(alpha)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(kanji.length > 0 || components.length > 0) && (
            <section aria-labelledby="alphabet-hub-trainers">
              <h2 id="alphabet-hub-trainers" className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t("practice.alphabetHub.relatedHeading")}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {kanji.map((item) => (
                  <li key={item.to}>
                    <TrainerShortcutCard item={item} iconName="layers" />
                  </li>
                ))}
                {components.map((item) => (
                  <li key={item.to}>
                    <TrainerShortcutCard item={item} iconName="layers" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
