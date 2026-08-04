/**
 * A- / A+ for the story reader — the in-context entry point to the SAME
 * persisted preference the Settings row writes (`useStoryFontSize`). Adjusting
 * it here is not a session-local override: it sticks, and Settings shows it.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useStoryFontSize } from "@/shared/settings/storyFontSize";

const BUTTON_CLASS =
  "inline-flex items-center rounded-md px-1.5 py-0.5 text-text-secondary transition " +
  "hover:text-text-primary disabled:cursor-default disabled:opacity-40 disabled:hover:text-text-secondary";

export function StoryFontSizeControl() {
  const { t } = useTranslation();
  const { index, setIndex, canShrink, canGrow } = useStoryFontSize();

  return (
    <span
      className="inline-flex items-center"
      role="group"
      aria-label={t("practice.stories.textSize", { defaultValue: "Story text size" })}
    >
      <button
        type="button"
        onClick={() => setIndex(index - 1)}
        disabled={!canShrink}
        className={BUTTON_CLASS}
        aria-label={t("practice.stories.textSmaller", { defaultValue: "Smaller text" })}
      >
        <Icon name="textSmaller" size={16} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setIndex(index + 1)}
        disabled={!canGrow}
        className={BUTTON_CLASS}
        aria-label={t("practice.stories.textLarger", { defaultValue: "Larger text" })}
      >
        <Icon name="textLarger" size={16} aria-hidden />
      </button>
    </span>
  );
}
