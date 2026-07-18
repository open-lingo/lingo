/**
 * SLA pillar catalog for the practice hub. Six pillars (skills + systems);
 * each activity is an existing route made targetable from one place.
 * Vocabulary/Grammar tiles reuse their existing hub pages; the four skill
 * pillars route to the generic PillarHubPage (practice/pillar/:pillarId).
 */
import {
  isCommunityEnabled,
  type FeatureFlags,
} from "@/shared/config/featureFlags";
import type { IconName } from "@/shared/iconRegistry";

export type PillarId =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "listening"
  | "speaking"
  | "writing";

export type PillarActivity = {
  id: string;
  titleKey: string;
  titleDefault: string;
  descKey: string;
  descDefault: string;
  /** Language-relative route — wrap with langPath() at render. */
  route: string;
  /** Restrict to these language ids; omitted = all languages. */
  languages?: string[];
  /** Feature flag gate (flags.practice.<flag>) */
  flag?: "stories" | "externalContent";
  /** Hide while the community surface ships dark (MVP). */
  requiresCommunity?: boolean;
  /** New in the pillar revamp — renders a small badge. */
  isNew?: boolean;
};

export type Pillar = {
  id: PillarId;
  icon: IconName;
  titleKey: string;
  titleDefault: string;
  taglineKey: string;
  taglineDefault: string;
  /** Tile destination. Generic skill pillars use practice/pillar/<id>. */
  route: string;
  activities: PillarActivity[];
};

const PILLARS: Pillar[] = [
  {
    id: "vocabulary",
    icon: "graduationCap",
    titleKey: "practice.pillars.vocabulary.title",
    titleDefault: "Vocabulary",
    taglineKey: "practice.pillars.vocabulary.tagline",
    taglineDefault: "Words and phrases on a spaced-repetition schedule",
    route: "practice/flashcards",
    activities: [
      {
        id: "flashcards-review",
        titleKey: "practice.pillars.vocabulary.review",
        titleDefault: "Review flashcards",
        descKey: "practice.pillars.vocabulary.reviewDesc",
        descDefault: "Your SRS queue",
        route: "practice/flashcards/review",
      },
      {
        // Second slot on purpose: PillarTile previews the first 3
        // activities, and this is the discoverable "your words" surface.
        id: "vocab-browser",
        titleKey: "practice.pillars.vocabulary.vocabBrowser",
        titleDefault: "Your vocabulary",
        descKey: "practice.pillars.vocabulary.vocabBrowserDesc",
        descDefault: "Every word in your course, with your progress",
        route: "vocab",
      },
      {
        id: "deck-manager",
        titleKey: "flashcards.deckManager.title",
        titleDefault: "Deck manager",
        descKey: "practice.pillars.vocabulary.decksDesc",
        descDefault: "Organize your decks",
        route: "practice/flashcards/decks",
      },
      {
        id: "card-manager",
        titleKey: "flashcards.cardManager.title",
        titleDefault: "Card manager",
        descKey: "practice.pillars.vocabulary.cardsDesc",
        descDefault: "Browse and edit cards",
        route: "practice/flashcards/cards",
      },
      {
        id: "browse-decks",
        titleKey: "flashcards.browseDecks",
        titleDefault: "Browse community decks",
        descKey: "practice.pillars.vocabulary.browseDesc",
        descDefault: "Shared by other learners",
        route: "community/explore",
        requiresCommunity: true,
      },
    ],
  },
  {
    id: "grammar",
    icon: "bookOpen",
    titleKey: "practice.pillars.grammar.title",
    titleDefault: "Grammar",
    taglineKey: "practice.pillars.grammar.tagline",
    taglineDefault: "The systems that glue words together",
    route: "practice/grammar",
    activities: [
      {
        id: "grammar-drills",
        titleKey: "practice.pillars.grammar.drills",
        titleDefault: "Review drills",
        descKey: "practice.pillars.grammar.drillsDesc",
        descDefault: "Targeted drills tied to lessons",
        route: "practice/grammar",
      },
      {
        id: "conjugation",
        titleKey: "practice.pillars.grammar.conjugation",
        titleDefault: "Conjugation trainer",
        descKey: "practice.pillars.grammar.conjugationDesc",
        descDefault: "Verb and adjective form drills",
        route: "practice/conjugation",
        languages: ["ja", "ko"],
      },
      {
        id: "particles",
        titleKey: "practice.particlePractice",
        titleDefault: "Particles",
        descKey: "practice.pillars.grammar.particlesDesc",
        descDefault: "Reference guide and meanings",
        route: "practice/particles",
        languages: ["ja", "ko", "es"],
      },
      {
        id: "counters",
        titleKey: "practice.pillars.grammar.counters",
        titleDefault: "Counters",
        descKey: "practice.pillars.grammar.countersDesc",
        descDefault: "Irregular counter word readings",
        route: "practice/counters",
        languages: ["ja"],
      },
    ],
  },
  {
    id: "reading",
    icon: "stories",
    titleKey: "practice.pillars.reading.title",
    titleDefault: "Reading",
    taglineKey: "practice.pillars.reading.tagline",
    taglineDefault: "Understand written language at your level",
    route: "practice/pillar/reading",
    activities: [
      {
        id: "passages",
        titleKey: "practice.pillars.reading.passages",
        titleDefault: "Reading passages",
        descKey: "practice.pillars.reading.passagesDesc",
        descDefault: "Short passages with comprehension questions",
        route: "practice/reading",
      },
      {
        id: "stories-read",
        titleKey: "nav.stories",
        titleDefault: "Stories",
        descKey: "practice.pillars.reading.storiesDesc",
        descDefault: "Narrative reading with audio",
        route: "practice/stories",
        flag: "stories",
      },
      {
        id: "alphabet-read",
        titleKey: "practice.pillars.reading.alphabet",
        titleDefault: "Script recognition",
        descKey: "practice.pillars.reading.alphabetDesc",
        descDefault: "Read your target script fluently",
        route: "practice/alphabet",
        languages: ["ja", "ko"],
      },
      {
        id: "external-content",
        titleKey: "externalContent.practice.tabLabel",
        titleDefault: "External content",
        descKey: "practice.pillars.reading.externalDesc",
        descDefault: "Real-world material from the community",
        route: "practice/external-content",
        flag: "externalContent",
      },
    ],
  },
  {
    id: "listening",
    icon: "headphones",
    titleKey: "practice.pillars.listening.title",
    titleDefault: "Listening",
    taglineKey: "practice.pillars.listening.tagline",
    taglineDefault: "Train your ear on native-speed audio",
    route: "practice/pillar/listening",
    activities: [
      {
        id: "listen-choose",
        titleKey: "practice.pillars.listening.listenChoose",
        titleDefault: "Listen & choose",
        descKey: "practice.pillars.listening.listenChooseDesc",
        descDefault: "Hear a phrase, pick its meaning",
        route: "practice/listening",
        isNew: true,
      },
      {
        id: "stories-listen",
        titleKey: "practice.pillars.listening.stories",
        titleDefault: "Stories (audio)",
        descKey: "practice.pillars.listening.storiesDesc",
        descDefault: "Follow narrated stories",
        route: "practice/stories",
        flag: "stories",
      },
      {
        id: "echo",
        titleKey: "practice.pillars.listening.echo",
        titleDefault: "Echo practice",
        descKey: "practice.pillars.listening.echoDesc",
        descDefault: "Listen, then repeat what you heard",
        route: "practice/speaking",
      },
    ],
  },
  {
    id: "speaking",
    icon: "mic",
    titleKey: "practice.pillars.speaking.title",
    titleDefault: "Speaking",
    taglineKey: "practice.pillars.speaking.tagline",
    taglineDefault: "Say it out loud — pronunciation and responses",
    route: "practice/pillar/speaking",
    activities: [
      {
        id: "speaking-drills",
        titleKey: "practice.pillars.speaking.drills",
        titleDefault: "Speaking practice",
        descKey: "practice.pillars.speaking.drillsDesc",
        descDefault: "Echo and response drills with speech recognition",
        route: "practice/speaking",
      },
      {
        id: "mic-tuning",
        titleKey: "practice.pillars.speaking.micTuning",
        titleDefault: "Mic tuning",
        descKey: "practice.pillars.speaking.micTuningDesc",
        descDefault: "Calibrate speech recognition for your voice",
        route: "speech-tune",
      },
    ],
  },
  {
    id: "writing",
    icon: "pencil",
    titleKey: "practice.pillars.writing.title",
    titleDefault: "Writing",
    taglineKey: "practice.pillars.writing.tagline",
    taglineDefault: "Produce the language, character by character",
    route: "practice/pillar/writing",
    activities: [
      {
        id: "type-it",
        titleKey: "practice.pillars.writing.typeIt",
        titleDefault: "Type it",
        descKey: "practice.pillars.writing.typeItDesc",
        descDefault: "See the meaning, type the phrase",
        route: "practice/writing",
        isNew: true,
      },
      {
        id: "alphabet-write",
        titleKey: "practice.pillars.writing.alphabet",
        titleDefault: "Alphabet drills",
        descKey: "practice.pillars.writing.alphabetDesc",
        descDefault: "Reading, writing, and listening drills",
        route: "practice/alphabet",
        languages: ["ja", "ko"],
      },
      {
        id: "kanji",
        titleKey: "practice.kanji",
        titleDefault: "Kanji",
        descKey: "practice.pillars.writing.kanjiDesc",
        descDefault: "Recognition and readings",
        route: "practice/kanji",
        languages: ["ja"],
      },
      {
        id: "components",
        titleKey: "practice.components",
        titleDefault: "Components",
        descKey: "practice.pillars.writing.componentsDesc",
        descDefault: "Radicals and character parts",
        route: "practice/components",
        languages: ["ja"],
      },
    ],
  },
];

function activityVisible(
  a: PillarActivity,
  langId: string,
  flags: FeatureFlags,
): boolean {
  if (a.languages && !a.languages.includes(langId)) return false;
  if (a.flag && !flags.practice[a.flag]) return false;
  if (a.requiresCommunity && !isCommunityEnabled(flags)) return false;
  return true;
}

export function getPillarsForLanguage(
  langId: string,
  flags: FeatureFlags,
): Pillar[] {
  return PILLARS.map((p) => ({
    ...p,
    activities: p.activities.filter((a) => activityVisible(a, langId, flags)),
  }));
}

export function getPillar(
  pillarId: string,
  langId: string,
  flags: FeatureFlags,
): Pillar | null {
  return getPillarsForLanguage(langId, flags).find((p) => p.id === pillarId) ?? null;
}
