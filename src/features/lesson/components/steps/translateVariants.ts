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
 *  4. The topic は on a clause-opening temporal adverb is OPTIONAL, in both
 *     directions (Spencer m6 walk 2026-07-23: きょうたべない was marked wrong
 *     against きょうは たべない; m28 walk 2026-08-05, the mirror: あしたは …
 *     was marked wrong against an authored bare あした …). The adverb itself
 *     never moves; only its marking changes.
 *  5. POLITE register is always accepted for a plain-form answer,
 *  6. particle-marked phrases scramble freely,
 *  7. 〜なきゃ / 〜なくちゃ / 〜なければ ならない are one obligation in three
 *     spellings, and
 *  8. かえる's destination may be implied or spelled out — 4–8 from
 *     `jaAcceptedForms` (Spencer 2026-07-24: "we need as many grammatically
 *     correct or close translations of the sentence as possible to be
 *     correct").
 *
 * Rules compose: the queue is a fixpoint, so a scramble of a topic-added
 * sentence in polite register is reachable without enumerating that path.
 *
 * Pure and deterministic so it can be exercised by tests; the view applies
 * it only when translating INTO Japanese.
 */
import {
  politeSentenceVariants,
  plainSentenceVariants,
  scrambleVariants,
  mustFormVariants,
  longMustFormVariants,
  homeReturnVariants,
  copulaVariants,
  teRequestVariants,
  listOrderVariants,
  nDesuVariants,
  dewaVariants,
  REGISTER_GRADED_FROM_MODULE,
} from "@/features/languages/ja/jaAcceptedForms";

/** Fixpoint guard — a pathological sentence must not expand unbounded. */
const MAX_VARIANTS = 2000;
// ごご/ごぜん/ばん join the list on the same grounds as あさ/よる: a bare
// time-of-day noun that can open a clause with or without its topic は
// (「ごご ひまじゃない」 ≡ 「ごごは ひまじゃない」, m29).
const TEMPORALS =
  "きょう|あした|あす|きのう|いま|けさ|こんばん|ごぜん|ごご|よる|あさ|ばん|まいにち";
const LEADING_TOPIC = /^(わたくし|わたし|ぼく)は\s*/;
const LEADING_TEMPORAL_TOPIC = new RegExp(`^(${TEMPORALS})は\\s*`);

/** Rules 1 and 4 again, but at the head of ANY sentence in the answer.
 *  Both were anchored to the start of the whole string, so in a build with
 *  two sentences — 「うちに かえらなきゃ。あしたは しごとが あるんだ」 — the
 *  second clause's topic sat behind a 。 where `^` could never reach it, and
 *  a learner who dropped that は was marked wrong (Spencer m28 build,
 *  2026-07-28). The droppability has nothing to do with being first in the
 *  string; it comes from opening a clause. 320 targets in the course are
 *  multi-sentence. */
const CLAUSE_TOPIC = /(^|。\s*)(わたくし|わたし|ぼく)は\s*/g;
const CLAUSE_TEMPORAL_TOPIC = new RegExp(`(^|。\\s*)(${TEMPORALS})は\\s*`, "g");

/**
 * Rule 4's MIRROR (Spencer m28 walk, 2026-08-05). Dropping an authored
 * 「あしたは」 to 「あした」 was accepted; the reverse — typing 「あしたは いかなければ
 * ならない」 against an authored bare 「あした いかなければ ならない」 — was not. The
 * two spellings are one sentence, so acceptance has to be symmetric.
 *
 * Guarded like rule 1's mirror: the clause must not already carry a topic は,
 * or we would accept a double-topic the authored answer never had.
 */
const CLAUSE_BARE_TEMPORAL = new RegExp(`(^|。\\s*)(${TEMPORALS})(\\s+)`, "g");

/**
 * A は acting as a PARTICLE — one that closes a token. Testing for a bare "は"
 * character instead reads the はたらく in 「まいにち はたらかなきゃ」 as a topic
 * marker and suppresses the rule that sentence exists to exercise. Every
 * content word starting in は (はたらく, はなす, はいる, はやい) trips the naive
 * check.
 */
const TOPIC_PARTICLE = /は(?=[\s、。]|$)/;

/** A です closing an interior clause — see the drop rule for why. */
const CLAUSE_DESU = /です(?=。)/g;

/**
 * Phrases whose topic は is optional in the same way a temporal adverb's is.
 *
 *  - **これ/それ/あれ as a subject.** 「これ、なに？」 and 「これは なに？」 are the
 *    same question; the course authors the comma form and rejected the は one.
 *    Matched only clause-initially, so an OBJECT これ is never topic-marked —
 *    「これを ください」 must not become 「これは ください」.
 *  - **〜の なかで**, the superlative's scope phrase. 「のみものの なかで」 ⇄
 *    「のみものの なかでは」 is ordinary mild-contrast marking (8 m26 steps).
 *    Scoped to なかで, NOT to every で-phrase, and it cannot touch the が that
 *    marks the superlative's winner — m26 teaches が there and は would say
 *    something else.
 *  - **とき**, whose clause may be topic-marked or not.
 */
const CLAUSE_DEMONSTRATIVE = /(^|。\s*)(これ|それ|あれ)([、,]\s*|\s+)/g;
const CLAUSE_DEMONSTRATIVE_TOPIC = /(^|。\s*)(これ|それ|あれ)は\s*/g;
const MARKABLE_PHRASE = /(なかで|とき)(?=\s)/g;
const MARKED_PHRASE = /(なかで|とき)は(?=\s)/g;

/**
 * Apply a sentence-level rule to each CLAUSE of a multi-sentence answer,
 * returning the whole answer with one clause rewritten at a time.
 *
 * The register generators all read the string-FINAL predicate, so in
 * 「やすいです。かいます。」 the first clause was unreachable — the same bug the
 * topic rules had before they were re-anchored to clause openings. 320 course
 * targets carry more than one sentence.
 *
 * Single-clause answers take the fast path and behave exactly as before.
 */
function perClause(answer: string, rule: (clause: string) => string[]): string[] {
  // Keep the 。 with the clause it closes so the rules see the punctuation
  // they key off (a question mark decides whether か is added).
  const parts = answer.match(/[^。]*。|[^。]+/g);
  if (!parts || parts.length < 2) return rule(answer);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const clause = parts[i];
    if (!clause.trim()) continue;
    for (const rewritten of rule(clause.trim())) {
      const copy = [...parts];
      // Preserve whatever spacing followed the original clause.
      copy[i] = clause.replace(clause.trim(), rewritten);
      out.push(copy.join(""));
    }
  }
  return out;
}

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
  // The cap counts SENTENCES, not spellings. Every answer is seeded in both a
  // spaced and a spaceless rendering, and `normalizeTypedAnswer` ignores
  // whitespace on both sides at grading time — so expanding both renderings
  // produces two identically-graded trees and burns half the budget on a
  // distinction the grader cannot see. Whitespace-identical strings are still
  // KEPT (a caller may show them), they are just not expanded twice, and the
  // cap is spent on genuinely different sentences.
  const expanded = new Set<string>();
  // BREADTH-first, and the direction matters. Depth-first (`pop`) spends the
  // budget on one deep corner — a scramble of a scramble of a polite rewrite —
  // and can exhaust it before ever applying a single rule to the authored
  // answer on its own. 「じかんが ないから もう かえらなくちゃ」 is ONE swap away
  // from the authored sentence and was being cut while five-rule permutations
  // of it survived. A cursor rather than `shift()` keeps it O(1) per step.
  const queue = [...accepted];
  let cursor = 0;
  while (cursor < queue.length && expanded.size < MAX_VARIANTS) {
    const a = queue[cursor++];
    if (out.has(a)) continue;
    out.add(a);
    const shape = a.replace(/[\s　]/g, "");
    if (expanded.has(shape)) continue;
    expanded.add(shape);

    // Register + word order (see header 5/6). Pushed onto the same queue so
    // the other rules apply to them in turn.
    if (!registerGraded) {
      // SYMMETRIC. Only the plain→polite half used to run, so which register a
      // learner could answer in depended on which one the author happened to
      // write: a 「Say to a friend」 step accepted the polite answer, while
      // 「Say politely」 rejected the plain one. Both directions below the
      // grading threshold (Spencer, 2026-08-05).
      //
      // Applied PER CLAUSE. Register lives on a predicate, and a two-sentence
      // answer has two of them — 「やすいです。かいます。」 rejected
      // 「やすいです。かう。」 because only the string-final predicate was ever
      // rewritten. Same generalisation the topic rules needed. Each clause is
      // rewritten on its own and the fixpoint composes the combinations.
      for (const variant of perClause(a, (clause) => [
        ...politeSentenceVariants(clause),
        ...plainSentenceVariants(clause),
        ...teRequestVariants(clause),
      ])) {
        queue.push(variant);
      }
    }
    for (const list of listOrderVariants(a)) queue.push(list);
    for (const scrambled of scrambleVariants(a)) queue.push(scrambled);
    // Obligation spelling (7) and かえる's implied destination (8). Both are
    // meaning-preserving, so they feed the same queue and compose with the
    // topic and register rules rather than being enumerated against them.
    for (const must of mustFormVariants(a)) queue.push(must);
    for (const must of longMustFormVariants(a)) queue.push(must);
    for (const home of homeReturnVariants(a)) queue.push(home);
    for (const copula of copulaVariants(a)) queue.push(copula);
    // Spoken contractions (9): ん⇄の on んだ/んです, じゃ⇄では. Both are
    // spelling, not register — they stay on below m20 and above it alike.
    for (const n of nDesuVariants(a)) queue.push(n);
    for (const d of dewaVariants(a)) queue.push(d);

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

    // …and back the other way: mark a bare clause-opening temporal, unless
    // that clause already has a は to be marked with.
    for (const m of a.matchAll(CLAUSE_BARE_TEMPORAL)) {
      const rest = a.slice(m.index + m[0].length);
      const clause = rest.split("。")[0];
      if (rest.length > 1 && !TOPIC_PARTICLE.test(clause)) {
        queue.push(`${a.slice(0, m.index)}${m[1]}${m[2]}は${m[3]}${rest}`);
      }
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

    // The same swap in the POSSESSIVE slot. わたし↔ぼく were interchangeable
    // as topics but not as owners, so 「これは ぼくの けいたいだ」 graded wrong
    // against 「…わたしの けいたいだ」. Nothing distinguishes the two slots.
    // (global regex, not String.replaceAll — tsconfig targets ES2020)
    if (a.includes("わたしの")) queue.push(a.replace(/わたしの/g, "ぼくの"));
    if (a.includes("ぼくの")) queue.push(a.replace(/ぼくの/g, "わたしの"));

    // A clause-opening demonstrative subject may take は or a comma pause.
    for (const m of a.matchAll(CLAUSE_DEMONSTRATIVE)) {
      const rest = a.slice(m.index + m[0].length);
      if (rest.length > 1 && !TOPIC_PARTICLE.test(rest.split("。")[0])) {
        queue.push(`${a.slice(0, m.index)}${m[1]}${m[2]}は ${rest}`);
      }
    }
    for (const m of a.matchAll(CLAUSE_DEMONSTRATIVE_TOPIC)) {
      const rest = a.slice(m.index + m[0].length);
      if (rest.length > 1) {
        queue.push(`${a.slice(0, m.index)}${m[1]}${m[2]}、${rest}`);
        queue.push(`${a.slice(0, m.index)}${m[1]}${m[2]} ${rest}`);
      }
    }

    // Optional topic marking on a scope phrase (〜の なかで) or a とき clause.
    for (const m of a.matchAll(MARKABLE_PHRASE)) {
      queue.push(`${a.slice(0, m.index)}${m[1]}は${a.slice(m.index + m[0].length)}`);
    }
    for (const m of a.matchAll(MARKED_PHRASE)) {
      queue.push(`${a.slice(0, m.index)}${m[1]}${a.slice(m.index + m[0].length)}`);
    }

    const noPunct = a.replace(/[。．.]\s*$/, "");
    if (
      noPunct.endsWith("です") &&
      noPunct.length > 3 &&
      !noPunct.endsWith("んです")
    ) {
      queue.push(noPunct.slice(0, -2));
    }

    // …and at the end of an INTERIOR clause. Same bug the topic rules had:
    // anchored to the end of the STRING, so in 「やすいです。かいます。」 the
    // first clause's です sat where `$` could never reach it. です is
    // droppable because it closes a clause, not because it closes the answer.
    for (const m of a.matchAll(CLAUSE_DESU)) {
      const at = m.index as number;
      // んです keeps its です — dropping it strands the ん.
      if (a.slice(0, at).endsWith("ん")) continue;
      if (at < 2) continue;
      queue.push(`${a.slice(0, at)}${a.slice(at + 2)}`);
    }
  }
  return [...out];
}
