/**
 * Particle PAIRS for the Combine drill (TestFlight #44).
 *
 * Each pair drills two particles that meet in one sentence: the learner fills
 * both blanks from one small option bank (the pair's two particles plus one
 * foil). The foil is chosen per pair so it is structurally wrong in the
 * frames the corpus serves — never a particle that would ALSO be correct (へ
 * is not a foil for に before a motion verb; を is not a foil for が on 〜たい).
 *
 * Usage cards are the "what changes when they meet" notes: three lines,
 * shown once before the first combined drill of that pair. They are teaching
 * notes, not lessons — the same slot as the conjugation free-drill rule card.
 *
 * Pair inventory (corpus counts up to m38, exactly-once + guards, 2026-09-09):
 * に+から 186 · から+まで 28 · は+が 216 · を+で 121 · に+で 75 · に+を 239.
 * へ+に was in the scope but the taught corpus has ONE sentence with both, so
 * it is not served; に+を (indirect vs direct object) takes its slot.
 */

export type UsageCard = {
  id: string;
  title: string;
  /** Exactly three lines. */
  lines: [string, string, string];
};

export type ParticlePair = {
  id: string;
  particles: [string, string];
  /** Third option in every blank's bank. */
  foil: string;
  /** Short English tagline for the picker chip. */
  tagline: string;
  card: UsageCard;
};

/** A pair needs this many sentences at the learner's level to be offered. */
export const MIN_PAIR_SENTENCES = 6;

/**
 * に's first usage card — the absolute-vs-relative time rule
 * (docs/ja-time-ni-lesson-scope.md). Shown once, before the first combined
 * drill of ANY pair that contains に, ahead of that pair's own card.
 */
export const NI_TIME_CARD: UsageCard = {
  id: "ni-time",
  title: "に and time",
  lines: [
    "に marks clock or calendar time: 三時に, 月曜日に, 七月に, たんじょうびに.",
    "Relative time takes no に: きょう, あした, きのう, 今週, 来月, 毎日.",
    "The test: if you can point at it on a clock or calendar without knowing what day it is now, it takes に.",
  ],
};

export const PARTICLE_PAIRS: readonly ParticlePair[] = [
  {
    id: "ni-kara",
    particles: ["に", "から"],
    foil: "で",
    tagline: "destination and starting point",
    card: {
      id: "ni-kara",
      title: "に with から",
      lines: [
        "に points at where you end up: だいがくに いく.",
        "から marks where or when something starts — and after a て-form it means “after doing”: たべてから.",
        "Together they draw a line: from here (から), to there (に). After a clause, から turns into “because”: さむいから うちに いる.",
      ],
    },
  },
  {
    id: "kara-made",
    particles: ["から", "まで"],
    foil: "に",
    tagline: "from … to …",
    card: {
      id: "kara-made",
      title: "から with まで",
      lines: [
        "から opens a span, まで closes it: くじから ごじまで — from nine to five.",
        "It works for places too: にほんから アメリカまで.",
        "Order is fixed: the start always takes から, the end always takes まで — swapping them reverses the trip.",
      ],
    },
  },
  {
    id: "wa-ga",
    particles: ["は", "が"],
    foil: "に",
    tagline: "topic and subject",
    card: {
      id: "wa-ga",
      title: "は with が",
      lines: [
        "は sets the frame — “as for today…”: きょうは.",
        "が marks what exists, what is missing, or what you want inside that frame: ごはんが ない, すしが たべたい.",
        "Read は as the stage and が as the actor on it. The frame word is often a time: きょうは — no に, because きょう is relative.",
      ],
    },
  },
  {
    id: "wo-de",
    particles: ["を", "で"],
    foil: "と",
    tagline: "object and place of action",
    card: {
      id: "wo-de",
      title: "を with で",
      lines: [
        "で says where the action happens: みせで.",
        "を says what the action is done to: ちゃを かう.",
        "Place first, thing second is the natural order: みせで ちゃを かう — at the shop, buy tea.",
      ],
    },
  },
  {
    id: "ni-de",
    particles: ["に", "で"],
    foil: "を",
    tagline: "time or destination vs place of action",
    card: {
      id: "ni-de",
      title: "に with で",
      lines: [
        "に marks the time an event happens or the place you end up: にちようびに, うみに いく.",
        "で marks the place where you DO something: いえで たべる.",
        "Ask “where does it happen?” → で. Ask “when, or where to?” → に. Existence (いる, ある) also takes に.",
      ],
    },
  },
  {
    id: "ni-wo",
    particles: ["に", "を"],
    foil: "で",
    tagline: "receiver and object",
    card: {
      id: "ni-wo",
      title: "に with を",
      lines: [
        "を marks the thing that gets moved, shown, or given: しゃしんを.",
        "に marks who receives it: ミカに しゃしんを みせる — show Mika the photo.",
        "With a motion verb に is the destination instead: うみに いく — the を then belongs to another verb in the sentence.",
      ],
    },
  },
];

export function getParticlePair(id: string | null | undefined): ParticlePair | null {
  if (!id) return null;
  return PARTICLE_PAIRS.find((p) => p.id === id) ?? null;
}

/** Usage cards owed before the first drill of `pair`, in display order. */
export function usageCardsForPair(pair: ParticlePair, seen: ReadonlySet<string>): UsageCard[] {
  const out: UsageCard[] = [];
  if (pair.particles.includes("に") && !seen.has(NI_TIME_CARD.id)) out.push(NI_TIME_CARD);
  if (!seen.has(pair.card.id)) out.push(pair.card);
  return out;
}
