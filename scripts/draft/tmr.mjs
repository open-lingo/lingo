/**
 * tmr.mjs — Token Miss Rate, a structural floor for drafted content.
 *
 *   TMR = tokens above the learner's level / total tokens
 *
 * From "Toward Beginner-Friendly LLMs for Language Learning" (Findings of
 * EACL 2026, aclanthology.org/2026.findings-eacl.47). Their headline result is
 * that PROMPTING ALONE FAILS to hold a CEFR level — decoding-time control moved
 * comprehensibility 39.4% → 83.3% and TMR 17.2% → 8.0% on Japanese A1–A2. We
 * get the same guarantee a different way, by letting the frame own the grammar
 * and an enum own each slot; TMR is how we VERIFY it rather than assume it.
 *
 * Why this and not a CEFR classifier: transformer readability classifiers
 * collapse out of domain — QWK 0.830 in-domain to 0.085 cross-domain (BEA 2026,
 * aclanthology.org/2026.bea-1.52). Generated drill sentences are a different
 * domain from the textbooks those classifiers are trained on. TMR is a lookup
 * against our OWN taught inventory, so it cannot drift out of domain: the
 * inventory IS the domain.
 *
 * What TMR does NOT tell you: whether the sentence means anything. It is a
 * necessary floor, not a quality measure. A run can be TMR-perfect and still
 * be «yo cocino el lápiz». Read the output.
 */

/**
 * Function words that never count against the level. Closed class, taught
 * implicitly by every sentence that uses them, and counting them makes the
 * metric noise. Mirrors the allowlist in `esPromptComprehensibility.test.ts`.
 */
const ES_FUNCTION_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "al", "del",
  "de", "a", "en", "con", "por", "para", "sin", "sobre", "entre", "hasta", "desde",
  "y", "o", "pero", "que", "si", "no", "ni", "como", "cuando", "porque",
  "yo", "tú", "tu", "él", "ella", "usted", "nosotros", "nosotras",
  "ustedes", "ellos", "ellas", "me", "te", "se", "lo", "le", "nos", "les",
  "mi", "su", "sus", "es", "son", "está", "están", "hay", "muy", "más",
]);

/**
 * Split on whitespace and punctuation, keeping accented letters and the
 * apostrophe (which is INSIDE a French word — l'ami is one token, not two).
 * Deliberately not a real tokenizer: our inventory is surface forms, so a
 * lemmatizer would introduce a second failure mode for no gain.
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .normalize("NFC")
    .split(/[^\p{L}\p{M}'’-]+/u)
    .filter(Boolean);
}

/**
 * @param {string[]} sentences
 * @param {Set<string>} taught  surfaces the learner has met
 * @param {Set<string>} functionWords
 */
export function tokenMissRate(sentences, taught, functionWords = ES_FUNCTION_WORDS) {
  let total = 0;
  const missed = new Map(); // token -> count

  for (const s of sentences) {
    for (const tok of tokenize(s)) {
      total += 1;
      if (functionWords.has(tok) || taught.has(tok)) continue;
      missed.set(tok, (missed.get(tok) ?? 0) + 1);
    }
  }

  const missCount = [...missed.values()].reduce((a, b) => a + b, 0);
  return {
    total,
    missCount,
    tmr: total ? Number((missCount / total).toFixed(4)) : 0,
    // Ranked so the worst offender is the first thing you fix. One bad pool
    // entry usually explains a whole column of misses.
    offenders: [...missed.entries()].sort((a, b) => b[1] - a[1]),
  };
}

export { ES_FUNCTION_WORDS };

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFile } = await import("node:fs/promises");
  const { esInventory } = await import("./inventory-es.mjs");
  const corpusPath = process.argv[2];
  const moduleId = process.argv[3] ?? "m8";
  if (!corpusPath) {
    console.error("usage: tmr.mjs <corpus.json> [module]");
    process.exit(2);
  }
  const corpus = JSON.parse(await readFile(corpusPath, "utf8"));
  const atoms = await esInventory(moduleId);

  // Inventory surfaces are multi-word for phrase atoms ("todos los días"), so
  // index every WORD of every taught surface — otherwise a legitimately taught
  // phrase reads as three untaught tokens and the metric slanders the content.
  const taught = new Set();
  for (const a of atoms) for (const w of tokenize(a.surface)) taught.add(w);
  // Inflected forms are built by morph-es from taught lemmas, so the conjugated
  // surface is licensed by its lemma. Add every form the frame can produce.
  const { conjugate, PERSONS } = await import("./morph-es.mjs");
  for (const a of atoms.filter((x) => x.pos === "verb")) {
    for (const p of PERSONS) {
      for (const t of ["present", "preterite", "imperfect"]) {
        try { taught.add(conjugate(a.surface, p, t).toLowerCase()); } catch { /* not a lemma */ }
      }
    }
  }

  const sentences = (corpus.kept ?? []).map((k) => k.es);
  const r = tokenMissRate(sentences, taught);
  console.log(`TMR over ${sentences.length} drafted sentences (taught through ${moduleId}):`);
  console.log(`  tokens        ${r.total}`);
  console.log(`  above level   ${r.missCount}`);
  console.log(`  TMR           ${(r.tmr * 100).toFixed(2)}%   (EACL 2026 baseline 17.2%, controlled 8.0%)`);
  if (r.offenders.length) {
    console.log(`\n  offenders (token × count):`);
    for (const [tok, n] of r.offenders.slice(0, 20)) console.log(`    ${n}×  ${tok}`);
  } else {
    console.log(`\n  No token above level. The frame's enums held.`);
  }
}
