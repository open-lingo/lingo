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
 *
 * Pure and deterministic so it can be exercised by tests; the view applies
 * it only when translating INTO Japanese.
 */
const LEADING_TOPIC = /^(わたくし|わたし|ぼく)は\s*/;

export function expandAcceptedAnswers(
  accepted: readonly string[],
): string[] {
  const out = new Set<string>();
  const queue = [...accepted];
  while (queue.length > 0) {
    const a = queue.pop() as string;
    if (out.has(a)) continue;
    out.add(a);

    // Trailing punctuation is never load-bearing — normalizeTypedAnswer
    // does NOT strip it, so an authored "…です。" was failing a learner's
    // "…です" before this expander existed.
    const bare = a.replace(/[。．.、]\s*$/, "");
    if (bare !== a) queue.push(bare);

    const topic = a.match(LEADING_TOPIC);
    if (topic && a.length > topic[0].length + 1) {
      queue.push(a.slice(topic[0].length));
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
