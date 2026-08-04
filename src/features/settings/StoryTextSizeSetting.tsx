/**
 * Settings entry point for the story-reading text size. The story reader has
 * its own A- / A+ control (`StoryFontSizeControl`); both write the SAME
 * persisted value through `useStoryFontSize`, so whichever the learner reaches
 * for first, the other one already agrees with it.
 */
import { useTranslation } from "react-i18next";
import { Select } from "@/shared/components/ui/Select";
import { STORY_FONT_STEPS, useStoryFontSize } from "@/shared/settings/storyFontSize";
import { SettingRow } from "./SettingsPrimitives";

export function StoryTextSizeSetting() {
  const { t } = useTranslation();
  const { index, setIndex } = useStoryFontSize();

  return (
    <SettingRow
      htmlFor="settings-story-font-size"
      label={t("settings.storyTextSize", "Story text size")}
      help={t(
        "settings.storyTextSizeHelp",
        "How big story text reads. Only the story itself changes — the rest of the app keeps its own size. You can also adjust this while reading.",
      )}
      stacked
      control={
        <Select
          id="settings-story-font-size"
          aria-label={t("settings.storyTextSize", "Story text size")}
          value={String(index)}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {STORY_FONT_STEPS.map((step, i) => (
            <option key={step.labelKey} value={i}>
              {t(step.labelKey, step.defaultLabel)}
            </option>
          ))}
        </Select>
      }
    />
  );
}
