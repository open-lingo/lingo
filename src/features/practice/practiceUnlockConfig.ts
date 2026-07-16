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

const JA_FEATURES: PracticeFeatureConfig[] = [
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
    unlockAtModule: 8,
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

const KO_FEATURES: PracticeFeatureConfig[] = [
  {
    id: "conjugation",
    unlockAtModule: 2,
    title: "Conjugation",
    description: "Verb and adjective form drills",
    icon: "활",
    route: "practice/conjugation",
  },
  {
    id: "reading",
    unlockAtModule: 3,
    title: "Reading",
    description: "Short passage comprehension",
    icon: "읽",
    route: "practice/reading",
  },
  {
    id: "speaking",
    unlockAtModule: 1,
    title: "Speaking",
    description: "Pronunciation and response drills",
    icon: "말",
    route: "practice/speaking",
  },
  {
    id: "counters",
    unlockAtModule: 3,
    title: "Counters",
    description: "Counter word practice",
    icon: "개",
    route: "practice/counters",
  },
];

const ES_FEATURES: PracticeFeatureConfig[] = [
  {
    id: "conjugation",
    unlockAtModule: 8, // the -ar paradigm lands in M8 (Rutinas I)
    title: "Conjugation",
    description: "Verb form drills",
    icon: "ar",
    route: "practice/conjugation",
  },
  {
    id: "reading",
    unlockAtModule: 3,
    title: "Reading",
    description: "Short passage comprehension",
    icon: "¿",
    route: "practice/reading",
  },
  {
    id: "speaking",
    unlockAtModule: 1,
    title: "Speaking",
    description: "Pronunciation and response drills",
    icon: "¡",
    route: "practice/speaking",
  },
];

export function getPracticeFeatures(langId: string): PracticeFeatureConfig[] {
  if (langId === "ko") return KO_FEATURES;
  if (langId === "es") return ES_FEATURES;
  return JA_FEATURES;
}

export function isFeatureUnlocked(
  featureId: PracticeFeatureId,
  currentModule: number,
  langId: string = "ja",
): boolean {
  const features = getPracticeFeatures(langId);
  const config = features.find((f) => f.id === featureId);
  if (!config) return false;
  return currentModule >= config.unlockAtModule;
}
