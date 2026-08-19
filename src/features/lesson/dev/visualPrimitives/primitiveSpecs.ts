import type { TimelineSpec } from "@/features/lesson/components/steps/TimelineScene";
import type { RegisterSpec } from "@/features/lesson/components/steps/RegisterScene";
import type { ScaleSpec } from "@/features/lesson/components/steps/ScaleScene";
import {
  DEFAULT_REGISTER_CAST,
  castView,
} from "@/features/languages/ja/registerCast";
import { lookupKanaEmoji, notoEmojiUrl } from "@/shared/assets/notoEmoji";

/**
 * DEV · Executable specs for the proposed scene primitives. Every sentence
 * here is drawn from the module named in its comment and uses only taught
 * vocabulary; nothing is authored into a lesson yet.
 */

/**
 * m15 L9/L10/L11 — まえに vs てから.
 *
 * REBUILT 2026-08-18. Spencer, on the first draft: *"I eat rice and before
 * sleep intersecting doesnt make sense to me."* Both sentences here are
 * VERBATIM m15 beats (`m15.ir.yaml:208` and `:217`) and they share the same
 * two events, so the connective is the only variable — which is exactly what
 * L11 ("a lesson that runs them against each other") is for.
 */
export const M15_TIMELINE: TimelineSpec = {
  kind: "timeline",
  early: { label: "ごはんを たべる", clock: "7:00", color: "#f97316" },
  late: { label: "だいがくに いく", clock: "9:00", color: "#14b8a6" },
  frames: [
    {
      id: "mae-ni",
      connective: "まえに",
      first: { text: "だいがくに いく まえに", at: "late" },
      second: { text: "ごはんを たべる", at: "early" },
      en: "Before going to university, I eat.",
      note: "「だいがくに いく まえに ごはんを たべる。」 — the clause you hear FIRST is the thing that happens SECOND. That inversion is the whole difficulty of まえに, and it is why the verb in front of it stays in the dictionary form: the tense is carried by the verb at the end, not by this one.",
    },
    {
      id: "te-kara",
      connective: "てから",
      first: { text: "ごはんを たべてから", at: "early" },
      second: { text: "だいがくに いく", at: "late" },
      en: "After eating, I go to university.",
      note: "「ごはんを たべてから だいがくに いく。」 — same two events, opposite reading order. てから says them in the order they happen, so the badges count up.",
    },
    {
      id: "toki",
      connective: "とき",
      first: { text: "ごはんを たべる とき", at: "early" },
      second: { text: "みずを のむ", at: "early" },
      en: "When I eat, I drink water.",
      moments: {
        early: { label: "ごはんを たべる", clock: "7:00", color: "#f97316" },
        late: { label: "—", clock: "", color: "#14b8a6" },
      },
      note: "「ごはんを たべる とき みずを のむ。」 — とき does not order anything. Both clauses name one moment, so there is only one badge and only one point on the clock.",
    },
  ],
};

/**
 * m20/m26/m28 — one axis read three ways, on a dimension where SIZE IS THE
 * MEANING.
 *
 * Spencer 2026-08-18: *"I think the boxes should probably be replaced with the
 * images themselves and then we use identifable fruit emojis or something …
 * grape, apple, watermelon, works for weight comparisons too."* Exactly right,
 * and the course already owns a better ladder than fruit: ねこ / いぬ / ぞう are
 * taught in m1/m1/m2, they order unambiguously, and they order the same way
 * for おおきい AND おもい — so one picture serves two adjectives. (No fruit is
 * taught anywhere in the course; ぶどう, りんご and すいか are not atoms.)
 */
export const M26_SIZE_SCALE: ScaleSpec = {
  kind: "scale",
  dimension: "おおきい",
  items: [
    {
      id: "neko",
      label: "ねこ",
      color: "#f59e0b",
      artUrl: notoEmojiUrl(lookupKanaEmoji("ねこ") ?? "🐱"),
    },
    {
      id: "inu",
      label: "いぬ",
      color: "#22c55e",
      artUrl: notoEmojiUrl(lookupKanaEmoji("いぬ") ?? "🐕"),
    },
    {
      id: "zou",
      label: "ぞう",
      color: "#6366f1",
      artUrl: notoEmojiUrl(lookupKanaEmoji("ぞう") ?? "🐘"),
    },
  ],
  frames: [
    {
      id: "yori",
      pattern: "より",
      subject: "inu",
      against: "neko",
      ja: "いぬは ねこより おおきい。",
      note: "より names ONE step on the axis. The sentence is about いぬ — ねこ only supplies the yardstick, which is why it takes より and not は.",
    },
    {
      id: "ichiban",
      pattern: "いちばん",
      subject: "zou",
      ja: "ぞうが いちばん おおきい。",
      note: "いちばん names the TOP of the axis, so it needs no comparison partner — the whole field is the yardstick.",
    },
    {
      id: "hou",
      pattern: "ほうがいい",
      subject: "neko",
      against: "inu",
      ja: "ねこの ほうが いい。",
      note: "ほうがいい points at a SIDE rather than measuring a gap: same two items, but the sentence is a preference, not a fact about size.",
    },
  ],
};

/**
 * The same scene where size is NOT the meaning — price.
 *
 * Spencer 2026-08-18: *"for comparison ranking, you can use dollar signs or
 * something if needed."* That resolves the open question from the first pass.
 * Drawing a book larger than a shoe to mean "more expensive" is a claim the
 * picture cannot check; stacking ¥ over it is exactly the claim being made.
 * Height still encodes rank, so the axis is read the same way — only the unit
 * changed from "how big" to "how many". ¥ rather than $ because the course is
 * Japanese and えん is taught (m5).
 */
export const M26_SCALE: ScaleSpec = {
  kind: "scale",
  dimension: "たかい",
  rankAs: "count",
  rankGlyph: "¥",
  /* Art is resolved from the course's OWN vocab map, so the picture on the
     axis is the same picture the learner met on the flashcard. ちゃ carries no
     emoji in courseAtoms, so it falls back to the canonical cup. */
  items: [
    {
      id: "cha",
      label: "ちゃ",
      color: "#22c55e",
      artUrl: notoEmojiUrl(lookupKanaEmoji("ちゃ") ?? "🍵"),
    },
    {
      id: "kutsu",
      label: "くつ",
      color: "#f59e0b",
      artUrl: notoEmojiUrl(lookupKanaEmoji("くつ") ?? "👟"),
    },
    {
      id: "hon",
      label: "ほん",
      color: "#6366f1",
      artUrl: notoEmojiUrl(lookupKanaEmoji("ほん") ?? "📖"),
    },
  ],
  frames: [
    {
      id: "yori",
      pattern: "より",
      subject: "kutsu",
      against: "cha",
      ja: "くつは ちゃより たかい。",
      note: "より names ONE step on the axis. The sentence is about くつ — ちゃ only supplies the yardstick, which is why it takes より and not は.",
    },
    {
      id: "ichiban",
      pattern: "いちばん",
      subject: "hon",
      ja: "ほんが いちばん たかい。",
      note: "いちばん names the TOP of the axis, so it needs no comparison partner — the whole field is the yardstick.",
    },
    {
      id: "hou",
      pattern: "ほうがいい",
      subject: "cha",
      against: "kutsu",
      ja: "ちゃの ほうが いい。",
      note: "ほうがいい points at a SIDE rather than measuring a gap: same two items, but the sentence is a recommendation, not a fact about price.",
    },
  ],
};

/* The cast now comes from `registerCast.ts`, which is also what the compiler
   resolves an IR `cast: [...]` through — so this page shows the same faces the
   lesson will. */
const CAST = DEFAULT_REGISTER_CAST.map((id) => castView(id));

/** Same cast, drawn rather than generated — the fallback path, kept visible on
 *  the QA page so the two can be compared at the size they actually render. */
const DRAWN_CAST = CAST.map(({ portraitUrl: _drop, ...rest }) => rest);

/** m10 — 「いく」 said to three audiences. Meaning fixed, ending moves. */
export const M10_REGISTER: RegisterSpec = {
  kind: "register",
  gloss: "I'll go",
  forms: { 1: "いく。", 2: "いきます。", 3: "いきます。" },
  audiences: CAST,
};

/**
 * m10's yes-word ladder — the case where all three levels DIFFER, so the
 * scene shows a real three-way contrast rather than a 2/3 collapse.
 *
 * CORRECTED 2026-08-18: this had はい at level 2 and ええ at level 3, which is
 * the reverse of what the module's own rule card says — *"Casual: うん /
 * ううん. Neutral-polite: ええ. Formal: はい / いいえ."* A QA page that
 * contradicts the lesson it is QA-ing is worse than no QA page.
 *
 * This spec is NOT wired to m10. Levels 2 and 3 are ともだち-adjacent roles the
 * learner has not met at m10 — おばあさん is an m19 atom and てんいん is taught
 * nowhere in the course at all — so the three-way ladder cannot be drawn until
 * m19 at the earliest. The shipped register scene is m29's, with two faces.
 */
export const M10_YES: RegisterSpec = {
  kind: "register",
  gloss: "Yes",
  forms: { 1: "うん。", 2: "ええ。", 3: "はい。" },
  audiences: CAST,
};

/** The drawn-figure fallback, same content as M10_YES. */
export const M10_YES_DRAWN: RegisterSpec = {
  ...M10_YES,
  audiences: DRAWN_CAST,
};
