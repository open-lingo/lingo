export type PracticeFeatureId =
  | "conjugation"
  | "kanji"
  | "reading"
  | "speaking"
  | "counters";

export type PracticeFeatureConfig = {
  id: PracticeFeatureId;
  unlockAtModule: number;
  title: string;
  description: string;
  icon: string;
  route: string;
};

export const PRACTICE_FEATURES: PracticeFeatureConfig[] = [
  {
    id: "conjugation",
    unlockAtModule: 7,
    title: "Conjugation",
    description: "Verb and adjective form drills",
    icon: "変",
    route: "practice/conjugation",
  },
  {
    id: "kanji",
    unlockAtModule: 3,
    title: "N5 Kanji",
    description: "Kanji recognition and reading",
    icon: "漢",
    route: "practice/kanji",
  },
  {
    id: "reading",
    unlockAtModule: 7,
    title: "Reading",
    description: "Short passage comprehension",
    icon: "読",
    route: "practice/reading",
  },
  {
    id: "speaking",
    unlockAtModule: 5,
    title: "Speaking",
    description: "Pronunciation and response drills",
    icon: "話",
    route: "practice/speaking",
  },
  {
    id: "counters",
    unlockAtModule: 5,
    title: "Counters",
    description: "Irregular counter word readings",
    icon: "本",
    route: "practice/counters",
  },
];

export function isFeatureUnlocked(
  featureId: PracticeFeatureId,
  currentModule: number,
): boolean {
  const config = PRACTICE_FEATURES.find((f) => f.id === featureId);
  if (!config) return false;
  return currentModule >= config.unlockAtModule;
}
