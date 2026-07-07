import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, ProgressRow } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { getPracticeItemsForLanguage } from "@/features/practice/practiceNavItems";
import { buildGrammarReviewQueue } from "@/features/flashcards/engine/grammarSrs";
import { getGrammarPool } from "@/features/lesson/data/grammarReviewPools";
import { useCourseLevel } from "@/features/practice/useCourseLevel";
import {
  CONJUGATION_TRAINER_TYPES,
  isTypeUnlocked,
  dueGrammarPointCount,
} from "@/features/practice/conjugation/trainerRegistry";

export function PracticeGrammarPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const flags = useFeatureFlags();
  const langPath = useLangPath();
  const langId = language?.id ?? "ko";
  const languageName = getLanguageConfig(langId)?.name ?? langId;

  const navItems = getPracticeItemsForLanguage(language?.id, flags);
  const particleItem = navItems.find((item) => item.to.includes("/practice/particles"));

  // Track B is JA-only. Compute the due/new grammar count once on mount — the
  // grammar store has no revision pub/sub, and review writes happen on the
  // session page (which navigates away and back), so mount recompute suffices.
  const grammarReview = useMemo(() => {
    if (langId !== "ja") return { due: 0, isNew: 0 };
    // Pool-aware, same as the review session — points with no renderable
    // steps (POOL_GAP_EXEMPTIONS) must not keep the badge non-zero forever.
    const q = buildGrammarReviewQueue(undefined, undefined, {
      hasPool: (id) => getGrammarPool(id).length > 0,
    });
    return { due: q.dueCount, isNew: q.newCount };
  }, [langId]);
  const grammarReviewTotal = grammarReview.due + grammarReview.isNew;

  const reachedModule = useCourseLevel();
  // Conjugation trainer due badge = sum of due points over UNLOCKED types.
  // Same mount-recompute rationale as grammarReview above (writes happen on the
  // session page, which navigates away and back).
  const conjugationDue = useMemo(() => {
    if (langId !== "ja") return 0;
    return CONJUGATION_TRAINER_TYPES.reduce(
      (sum, type) =>
        sum + (isTypeUnlocked(type, reachedModule) ? dueGrammarPointCount(type) : 0),
      0,
    );
  }, [langId, reachedModule]);

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
      {/* Stat tiles (trainers / lessons / hours) removed 2026-06-12 — they
          were hardcoded mocks with no real backing source. Reintroduce only
          once grammar practice records real activity. */}
      <Card padding="lg">
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
      </Card>

      {/* Zone 2 — Trainer rows */}
      <div className="space-y-2">
        {langId === "ja" && (
          <ProgressRow
            icon={<Icon name="refresh" size={18} />}
            label={t("practice.grammarReview.rowLabel", { defaultValue: "Grammar review" })}
            sublabel={t("practice.grammarReview.rowSub", {
              defaultValue: "Spaced review of the grammar points you've learned",
            })}
            rightChip={
              grammarReviewTotal > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
                  {t("practice.grammarReview.dueBadge", {
                    defaultValue: "{{count}} due",
                    count: grammarReviewTotal,
                  })}
                  <Icon name="arrowRight" size={12} aria-hidden />
                </span>
              ) : (
                startChip
              )
            }
            to={langPath("practice/grammar/review")}
          />
        )}
        {langId === "ja" && (
          <ProgressRow
            icon={<Icon name="refresh" size={18} />}
            label={t("practice.conjugation.rowLabel", { defaultValue: "Conjugation trainer" })}
            sublabel={t("practice.conjugation.rowSub", {
              defaultValue: "Formation drills for verb and adjective forms",
            })}
            rightChip={
              conjugationDue > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-on-accent">
                  {t("practice.conjugation.dueBadge", {
                    defaultValue: "{{count}} due",
                    count: conjugationDue,
                  })}
                  <Icon name="arrowRight" size={12} aria-hidden />
                </span>
              ) : (
                startChip
              )
            }
            to={langPath("practice/conjugation")}
          />
        )}
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
        {/* The "Verb conjugation — Soon" placeholder retired 2026-07-02:
            the Conjugation trainer row above IS that feature now. */}
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
