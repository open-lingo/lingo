import type { PracticeType } from "@/core/languageConfig";

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  general: "General practice",
  particles: "Particle practice",
  kanji: "Kanji",
  alphabet: "Alphabet",
  components: "Character components",
};

/** Base route for each practice type. Alphabet uses path param: /practice/alphabet/:id */
export function getPracticeRoute(type: PracticeType, alphabetId?: string): string {
  if (type === "alphabet" && alphabetId) {
    return `/practice/alphabet/${encodeURIComponent(alphabetId)}`;
  }
  return PRACTICE_TYPE_ROUTES[type];
}

export const PRACTICE_TYPE_ROUTES: Record<PracticeType, string> = {
  general: "/practice/flashcards",
  particles: "/practice/particles",
  kanji: "/practice/kanji",
  alphabet: "/practice/alphabet",
  components: "/practice/components",
};
