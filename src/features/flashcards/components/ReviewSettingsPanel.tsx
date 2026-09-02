import { useTranslation } from "react-i18next";
import { useSettings } from "@/shared/contexts/SettingsContext";

/**
 * The review-settings controls. ONE copy, two hosts: the desktop popover
 * anchored in `ReviewToolbar`, and the mobile bottom sheet
 * (`ReviewDetailsSheet`). Extracted so the two cannot drift — a setting added
 * to one and not the other is exactly the kind of thing nobody notices for a
 * quarter.
 *
 * `highlightMode` is session-local (it lives in `FlashcardTester` state, not in
 * persisted settings) so it comes in as a prop; everything else writes straight
 * through `updateFlashcards`.
 */
type Props = {
  highlightMode: boolean;
  onHighlightModeChange: (value: boolean) => void;
};

export function ReviewSettingsPanel({
  highlightMode,
  onHighlightModeChange,
}: Props) {
  const { t } = useTranslation();
  const { settings, updateFlashcards } = useSettings();
  const gradingLayout = settings.flashcards?.gradingLayout ?? "simple";
  const showIntervalPreviews = settings.flashcards?.showIntervalPreviews ?? false;

  return (
    <div className="space-y-3">
      <label className="flex min-h-[44px] items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={highlightMode}
          onChange={(e) => onHighlightModeChange(e.target.checked)}
          className="rounded border-border accent-accent"
        />
        Highlight particles
      </label>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-text-muted"
          htmlFor="fc-grading-layout"
        >
          {t("flashcards.gradingLayoutLabel", "Grading buttons")}
        </label>
        <select
          id="fc-grading-layout"
          value={gradingLayout}
          onChange={(e) =>
            updateFlashcards({ gradingLayout: e.target.value as "simple" | "full" })
          }
          className="min-h-[44px] w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="simple">
            {t("flashcards.gradingLayoutSimple", "Simple (2)")}
          </option>
          <option value="full">
            {t("flashcards.gradingLayoutFull", "Full (4)")}
          </option>
        </select>
      </div>
      <label className="flex min-h-[44px] items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={showIntervalPreviews}
          onChange={(e) =>
            updateFlashcards({ showIntervalPreviews: e.target.checked })
          }
          className="rounded border-border accent-accent"
        />
        {t("flashcards.showIntervalPreviews", "Show scheduling intervals")}
      </label>
      <div>
        <label
          className="mb-1 block text-xs font-medium text-text-muted"
          htmlFor="fc-max-new"
        >
          {t("flashcards.maxNewPerDayLabel", "New cards per session")}
        </label>
        <select
          id="fc-max-new"
          value={String(settings.flashcards?.maxNewCardsPerDay ?? "")}
          onChange={(e) =>
            updateFlashcards({
              maxNewCardsPerDay:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
          className="min-h-[44px] w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">
            {t("flashcards.maxNewPerDayAll", "All unlocked (default)")}
          </option>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="0">
            {t("flashcards.maxNewPerDayNone", "None — reviews only")}
          </option>
        </select>
        <p className="mt-1 text-[11px] leading-snug text-text-muted">
          {t(
            "flashcards.maxNewPerDayHelp",
            "Caps how many never-studied words each session introduces. Lessons stay the natural pace — set a cap if your queue feels too long.",
          )}
        </p>
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={settings.flashcards?.frequencyVocab ?? false}
            onChange={(e) => updateFlashcards({ frequencyVocab: e.target.checked })}
            className="mt-0.5 rounded border-border accent-accent"
          />
          <span>
            {t(
              "flashcards.frequencyVocabLabel",
              "Frequency vocabulary (optional words)",
            )}
          </span>
        </label>
        <p className="mt-1 text-[11px] leading-snug text-text-muted">
          {t(
            "flashcards.frequencyVocabHelp",
            "Unlock common words beyond your lessons as you reach each module — reviewed alongside your cards.",
          )}
        </p>
      </div>
    </div>
  );
}
