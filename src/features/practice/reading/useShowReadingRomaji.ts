/**
 * Reading practice — reading-aid (romaji / RR) visibility gate.
 *
 * Consumes the SAME setting-aware decision the shared annotator uses
 * (`romajiVisibleForScript` for JA kana scripts + the `showRomanization` toggle
 * for other phonetic scripts), so the reading surface honors
 * `settings.learning.showRomanization`, the `romanizationOnForDay` escape hatch,
 * and the per-script auto-flip guards exactly like `AnnotatedText`.
 *
 * Reading practice runs OUTSIDE a lesson, so there is no module context —
 * `moduleIndex: null` keeps the JA gate guard-only (master toggle + "for today"
 * escape hatch), matching `AnnotatedText`'s no-lesson-provider behavior.
 */
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  romajiVisibleForScript,
  todayLocalDate,
  type KanaScript,
} from "@/shared/settings/romanizationAutoFlip";
import { isRomanizationOn } from "@/shared/settings/types";

const JA_SCRIPTS: KanaScript[] = ["hiragana", "katakana"];

export function useShowReadingRomaji(languageId: string): boolean {
  const { settings } = useSettings();
  if (languageId !== "ja") {
    return isRomanizationOn(settings.learning, languageId);
  }
  const today = todayLocalDate();
  return JA_SCRIPTS.some((script) =>
    romajiVisibleForScript({ settings, script, today, moduleIndex: null }),
  );
}
