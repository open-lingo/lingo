import type { PracticeType } from "@/shared/domain/languageConfig";

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  general: "General practice",
  particles: "Particle practice",
  kanji: "Kanji",
  alphabet: "Alphabet",
  components: "Character components",
  videos: "Videos",
};

/** Base route for each practice type. Alphabet uses path param: /:lang/practice/alphabet/:id */
export function getPracticeRoute(type: PracticeType, alphabetId?: string, lang?: string): string {
  const base = type === "alphabet" && alphabetId
    ? `/practice/alphabet/${encodeURIComponent(alphabetId)}`
    : PRACTICE_TYPE_ROUTES[type];
  const prefix = lang ? `/${lang}` : "";
  return prefix ? `${prefix}${base}` : base;
}

export const PRACTICE_TYPE_ROUTES: Record<PracticeType, string> = {
  general: "/practice/flashcards",
  particles: "/practice/particles",
  kanji: "/practice/kanji",
  alphabet: "/practice/alphabet",
  components: "/practice/components",
  videos: "/practice/videos",
};
