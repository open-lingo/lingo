/**
 * Accepted-answer variant expansion for typed JA translation (Spencer QA
 * 2026-07-12): a learner who writes a grammatically correct sentence that
 * "doesn't line up" with the single authored answer must not be marked
 * wrong. Conservative, rule-based, fixpoint-expanded:
 *
 *  1. A leading first-person topic (わたしは/ぼくは/わたくしは) is droppable —
 *     Japanese omits established topics; the topicless sentence is the MORE
 *     natural production.
 *  2. First-person pronouns swap in topic position (わたし ↔ ぼく).
 *  3. A trailing です is droppable (casual register, still correct) —
 *     except after ん (のです/んです), where dropping strands the ん.
 *  4. The topic は after a LEADING temporal adverb is droppable (Spencer
 *     m6 walk 2026-07-23: きょうたべない was marked wrong against
 *     きょうは たべない — the bare adverb is at least as natural). The
 *     adverb itself stays; only its は goes.
 *  5. POLITE register is always accepted for a plain-form answer, and
 *  6. particle-marked phrases scramble freely — both from `jaAcceptedForms`
 *     (Spencer 2026-07-24: "we need as many grammatically correct or close
 *     translations of the sentence as possible to be correct").
 *
 * Rules compose: the queue is a fixpoint, so a scramble of a topic-added
 * sentence in polite register is reachable without enumerating that path.
 *
 * Pure and deterministic so it can be exercised by tests; the view applies
 * it only when translating INTO Japanese.
 */
import {
  politeSentenceVariants,
  scrambleVariants,
  REGISTER_GRADED_FROM_MODULE,
} from "@/features/languages/ja/jaAcceptedForms";

/** Fixpoint guard — a pathological sentence must not expand unbounded. */
const MAX_VARIANTS = 600;
const LEADING_TOPIC = /^(わたくし|わたし|ぼく)は\s*/;
const LEADING_TEMPORAL_TOPIC =
  /^(きょう|あした|あす|きのう|いま|けさ|こんばん|よる|あさ|まいにち)は\s*/;

/** Rules 1 and 4 again, but at the head of ANY sentence in the answer.
 *  Both were anchored to the start of the whole string, so in a build with
 *  two sentences — 「うちに かえらなきゃ。あしたは しごとが あるんだ」 — the
 *  second clause's topic sat behind a 。 where `^` could never reach it, and
 *  a learner who dropped that は was marked wrong (Spencer m28 build,
 *  2026-07-28). The droppability has nothing to do with being first in the
 *  string; it comes from opening a clause. 320 targets in the course are
 *  multi-sentence. */
const CLAUSE_TOPIC = /(^|。\s*)(わたくし|わたし|ぼく)は\s*/g;
const CLAUSE_TEMPORAL_TOPIC =
  /(^|。\s*)(きょう|あした|あす|きのう|いま|けさ|こんばん|よる|あさ|まいにち)は\s*/g;

export function expandAcceptedAnswers(
  accepted: readonly string[],
  options: { moduleIndex?: number | null } = {},
): string[] {
  // Register is ungraded until REGISTER_GRADED_FROM_MODULE — before then
  // either register passes and the learner is shown the pair. An unknown
  // module (null — practice decks, previews) stays permissive.
  const { moduleIndex = null } = options;
  const registerGraded =
    moduleIndex !== null && moduleIndex >= REGISTER_GRADED_FROM_MODULE;
  const out = new Set<string>();
  const queue = [...accepted];
  while (queue.length > 0 && out.size < MAX_VARIANTS) {
    const a = queue.pop() as string;
    if (out.has(a)) continue;
    out.add(a);

    // Register + word order (see header 5/6). Pushed onto the same queue so
    // the other rules apply to them in turn.
    if (!registerGraded) {
      for (const polite of politeSentenceVariants(a)) queue.push(polite);
    }
    for (const scrambled of scrambleVariants(a)) queue.push(scrambled);

    // Trailing punctuation is never load-bearing — normalizeTypedAnswer
    // does NOT strip it, so an authored "…です。" was failing a learner's
    // "…です" before this expander existed.
    const bare = a.replace(/[。．.、]\s*$/, "");
    if (bare !== a) queue.push(bare);

    // Drop a first-person topic, or a temporal adverb's は, at the head of
    // any clause. `m[1]` is the clause opener ("" or "。") and is put back
    // so only the topic marking changes.
    for (const m of a.matchAll(CLAUSE_TOPIC)) {
      const rest = a.slice(m.index + m[0].length);
      if (rest.length > 1) queue.push(`${a.slice(0, m.index)}${m[1]}${rest}`);
    }

    for (const m of a.matchAll(CLAUSE_TEMPORAL_TOPIC)) {
      const rest = a.slice(m.index + m[0].length);
      if (rest.length > 1)
        queue.push(`${a.slice(0, m.index)}${m[1]}${m[2]} ${rest}`);
    }

    // Rule 1's MIRROR (Fable sweep 2026-07-24): dropping an authored topic
    // was accepted, but ADDING one to a topicless authored answer wasn't —
    // わたしは しゃしんを みない graded wrong against しゃしんを みない.
    // Statements only (never questions), and never double-top a sentence
    // that already opens with a topic pronoun.
    if (
      !LEADING_TOPIC.test(a) &&
      !LEADING_TEMPORAL_TOPIC.test(a) &&
      !/[？?]\s*$/.test(a) &&
      // Never double-topic: if the sentence already carries a は anywhere
      // (ミカは こない), adding わたしは would accept broken Japanese.
      !a.includes("は") &&
      a.trim().length > 0
    ) {
      queue.push(`わたしは ${a}`);
      queue.push(`ぼくは ${a}`);
    }

    if (/^わたしは/.test(a)) queue.push(a.replace(/^わたしは/, "ぼくは"));
    if (/^ぼくは/.test(a)) queue.push(a.replace(/^ぼくは/, "わたしは"));

    const noPunct = a.replace(/[。．.]\s*$/, "");
    if (
      noPunct.endsWith("です") &&
      noPunct.length > 3 &&
      !noPunct.endsWith("んです")
    ) {
      queue.push(noPunct.slice(0, -2));
    }
  }
  return [...out];
}
