/**
 * Shared practice nav items by language.
 * Used by: Layout nav dropdown, PracticeLayout tabs, PracticeCard dropdown.
 * Alphabets use the same AlphabetPracticePage; manifest (AlphabetDef) controls display.
 */

import { getLanguageConfig } from "@/core/languageConfig";
import { getPracticeRoute } from "./practiceTypeRoutes";

export type PracticeNavItem = {
  to: string;
  /** i18n key for standard items (flashcards, stories, particles, etc.) */
  labelKey?: string;
  /** Raw label when language-specific (e.g. "Hiragana (Alphabet)") */
  label?: string;
  /** Sample character for tab/dropdown icon (e.g. し, シ, 日, 한) */
  sampleCharacter?: string;
};

/** Flashcards and Stories are always first; then language-specific trainers. */
export function getPracticeItemsForLanguage(
  languageId: string | undefined
): PracticeNavItem[] {
  const base: PracticeNavItem[] = [
    { to: "/practice/flashcards", labelKey: "nav.flashcards", sampleCharacter: "📚" },
    { to: "/practice/stories", labelKey: "nav.stories", sampleCharacter: "📖" },
  ];

  if (!languageId) {
    return base;
  }

  const config = getLanguageConfig(languageId);
  const options = config?.practiceOptions ?? config?.practiceTypes?.map((type) => ({ type, label: type })) ?? [];

  const trainers: PracticeNavItem[] = [];
  for (const opt of options) {
    if (opt.type === "general") continue;
    const id = "id" in opt ? opt.id : undefined;
    const label = "label" in opt ? opt.label : undefined;
    const sampleCharacter = "sampleCharacter" in opt ? opt.sampleCharacter : undefined;
    const to = getPracticeRoute(opt.type, id);
    const item: PracticeNavItem = {
      to,
      label: typeof label === "string" ? label : undefined,
      sampleCharacter,
    };
    if (opt.type === "particles") item.labelKey = "practice.particlePractice";
    else if (opt.type === "kanji") item.labelKey = "practice.kanji";
    else if (opt.type === "components") item.labelKey = "practice.components";
    trainers.push(item);
  }

  return [...base, ...trainers];
}
