import { useTranslation } from "react-i18next";
import { Card, ProgressRow } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";

// MOCK: trainer/lesson/hours stats are fabricated; replace with real progress aggregation.
const MOCK_TRAINER_COUNT = 4;
const MOCK_LESSON_COUNT = 0;
const MOCK_HOURS_PRACTICED = 0;

export function PracticeGrammarPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const langPath = useLangPath();
  const langId = language?.id ?? "ko";
  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const particleItem = navItems.find((item) => item.to.includes("/practice/particles"));

  const startChip = (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
      {t("practice.grammarPage.startChip", { defaultValue: "Start" })}
      <Icon name="arrowRight" size={12} aria-hidden />
    </span>
  );

  const soonChip = (
    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
      {t("practice.grammarPage.soon", { defaultValue: "Soon" })}
    </span>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Zone 1 — Header tile */}
      <Card padding="lg">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("practice.grammarPage.kicker", { defaultValue: "Grammar practice" })}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">
              {t("practice.grammarPage.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm text-text-secondary">
              {t("practice.grammarPage.intro", { language: languageName })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:shrink-0">
            {/* MOCK: trainer count is hard-coded. */}
            <div className="rounded-lg bg-surface-muted p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{MOCK_TRAINER_COUNT}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("practice.grammarPage.statTrainers", { defaultValue: "Trainers" })}
              </p>
            </div>
            {/* MOCK: lesson count is hard-coded. */}
            <div className="rounded-lg bg-surface-muted p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{MOCK_LESSON_COUNT}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("practice.grammarPage.statLessons", { defaultValue: "Lessons" })}
              </p>
            </div>
            {/* MOCK: hours practiced is hard-coded. */}
            <div className="rounded-lg bg-surface-muted p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{MOCK_HOURS_PRACTICED}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {t("practice.grammarPage.statHours", { defaultValue: "Hours" })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Zone 2 — Trainer rows */}
      <div className="space-y-2">
        <ProgressRow
          icon={<Icon name="layers" size={18} />}
          label={
            particleItem?.labelKey
              ? t(particleItem.labelKey)
              : t("practice.particlePractice", { defaultValue: "Particle practice" })
          }
          sublabel={t("practice.grammarPage.particlesDesc")}
          rightChip={startChip}
          to={particleItem?.to ?? langPath("practice/particles")}
        />
        <ProgressRow
          icon={<Icon name="bookText" size={18} />}
          label={t("practice.hub.grammarVerb")}
          sublabel={t("practice.grammarPage.verbSub", {
            defaultValue: "Tense, mood, agreement",
          })}
          rightChip={soonChip}
          disabled
        />
        <ProgressRow
          icon={<Icon name="fileText" size={18} />}
          label={t("practice.hub.grammarSentence")}
          sublabel={t("practice.grammarPage.sentenceSub", {
            defaultValue: "Clauses and patterns",
          })}
          rightChip={soonChip}
          disabled
        />
        <ProgressRow
          icon={<Icon name="user" size={18} />}
          label={t("practice.hub.grammarRegister")}
          sublabel={t("practice.grammarPage.registerSub", {
            defaultValue: "Honorifics and tone",
          })}
          rightChip={soonChip}
          disabled
        />
      </div>

      {/* Zone 3 — Suggested order */}
      <div className="rounded-lg border border-border bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("practice.grammarPage.suggestedOrder", { defaultValue: "Suggested order" })}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium text-text-secondary">
          <span>{t("practice.grammarPage.orderParticles", { defaultValue: "Particles" })}</span>
          <Icon name="chevronRight" size={14} className="text-text-muted" aria-hidden />
          <span>{t("practice.grammarPage.orderVerbs", { defaultValue: "Verbs" })}</span>
          <Icon name="chevronRight" size={14} className="text-text-muted" aria-hidden />
          <span>{t("practice.grammarPage.orderSentences", { defaultValue: "Sentences" })}</span>
          <Icon name="chevronRight" size={14} className="text-text-muted" aria-hidden />
          <span>{t("practice.grammarPage.orderPoliteness", { defaultValue: "Politeness" })}</span>
        </div>
      </div>

      <p className="text-center text-xs text-text-muted">{t("practice.grammarPage.footerHint")}</p>
    </div>
  );
}
