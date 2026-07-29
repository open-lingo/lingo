import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { composeButtonClasses } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";

/**
 * "You've accumulated X optional words" cue for the Learn path.
 *
 * Only rendered when the opt-in frequency ("optional") vocab feature is on
 * AND the learner has an accumulated backlog of unlocked-but-unstudied words
 * (`unseenTotal - newToday` from the throttled review queue). Off or zero →
 * renders nothing (no empty-state noise). Links to the flashcards reviewer,
 * where the words flow in through the same adaptive new-card intake.
 */
export function FrequencyBacklogCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const langPath = useLangPath();
  const { settings } = useSettings();
  const freqEnabled = settings.flashcards?.frequencyVocab ?? false;

  const { backlogCount, isLoading } = useFlashcardDueSummary(
    language?.id ?? "",
  );

  if (!freqEnabled || isLoading || backlogCount <= 0) return null;

  return (
    <Card
      padding="sm"
      className="mt-4 flex flex-col gap-3 border-accent/40 bg-accent/5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon name="sparkles" size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            {t("learn.frequencyBacklog.title", {
              defaultValue: "{{count}} new words ready to review",
              count: backlogCount,
            })}
          </p>
          <p className="text-xs leading-snug text-text-muted">
            {t("learn.frequencyBacklog.desc", {
              defaultValue:
                "Optional high-frequency words you've unlocked. Review them alongside your cards.",
            })}
          </p>
        </div>
      </div>
      <Link
        to={langPath("practice/flashcards/review")}
        className={composeButtonClasses({
          variant: "primary",
          size: "sm",
          className: "shrink-0",
        })}
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon name="refresh" size={14} aria-hidden />
          {t("learn.frequencyBacklog.cta", { defaultValue: "Review now" })}
        </span>
      </Link>
    </Card>
  );
}
