/**
 * Shared practice nav items by language.
 * Used by: Practice hub (trainer grid), legacy helpers.
 * Alphabets use the same AlphabetPracticePage; manifest (AlphabetDef) controls display.
 */

import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { FeatureFlags } from "@/shared/config/featureFlags";
import { getPracticeRoute } from "./practiceTypeRoutes";

export type PracticeNavItem = {
  to: string;
  /** i18n key for standard items (flashcards, stories, particles, etc.) */
  labelKey?: string;
  /** Raw label when language-specific (e.g. "Hiragana (Alphabet)") */
  label?: string;
  /** Sample character for tab/dropdown icon (e.g. し, シ, 日, 한) */
  sampleCharacter?: string;
  /** Icon name when using Icon component instead of sampleCharacter */
  iconName?: "stories" | "decks" | "graduationCap" | "link" | "video";
};

/** Flashcards and Stories are always first; then language-specific trainers. */
export function getPracticeItemsForLanguage(
  languageId: string | undefined,
  flags: FeatureFlags
): PracticeNavItem[] {
  const lang = languageId ?? "ko";
  const prefix = `/${lang}`;
  const base: PracticeNavItem[] = [
    { to: `${prefix}/practice/flashcards`, labelKey: "nav.flashcards", iconName: "graduationCap" },
  ];
  if (flags.practice.stories) {
    base.push({
      to: `${prefix}/practice/stories`,
      labelKey: "nav.stories",
      iconName: "stories",
    });
  }
  if (flags.practice.externalContent) {
    base.push({
      to: `${prefix}/practice/external-content`,
      labelKey: "externalContent.practice.tabLabel",
      iconName: "link",
    });
  }

  if (!languageId) {
    return base;
  }

  const config = getLanguageConfig(languageId);
  const options = config?.practiceOptions ?? config?.practiceTypes?.map((type) => ({ type, label: type })) ?? [];

  const trainers: PracticeNavItem[] = [];
  for (const opt of options) {
    if (opt.type === "general") continue;
    if (opt.type === "videos" && !flags.practice.videoTrainers) continue;
    const id = "id" in opt ? opt.id : undefined;
    const label = "label" in opt ? opt.label : undefined;
    const sampleCharacter = "sampleCharacter" in opt ? opt.sampleCharacter : undefined;
    const to = getPracticeRoute(opt.type, id, lang);
    const item: PracticeNavItem = {
      to,
      label: typeof label === "string" ? label : undefined,
      sampleCharacter,
    };
    if (opt.type === "particles") item.labelKey = "practice.particlePractice";
    else if (opt.type === "kanji") item.labelKey = "practice.kanji";
    else if (opt.type === "components") item.labelKey = "practice.components";
    else if (opt.type === "videos") {
      item.labelKey = "practice.videos";
      item.iconName = "video";
      delete item.sampleCharacter;
    }
    trainers.push(item);
  }

  return [...base, ...trainers];
}
