# French (fr) v2 local-judge sweep — triage

Source: `docs/audits/module-qa-local-judge-2026-09-13/fr.md` (19 P1 + 6 P2 + 16 P3, m3–m26)
and raw verdicts `judge-v2/results/fr.jsonl`. Every P1 and P2 row was opened against the
built lesson JSON (`src/pub/content/v1/fr/m<N>.<hash>.json`) and its source
(`src/features/languages/fr/curriculum/m<N>.ts` — **fr has no `curriculum/ir/` directory;
every fr module is hand-authored TS**, so "source" below always means that hand-authored
file). Three P3 rows that allege a wrong answer/translation/spelling (not just prose
clarity) were verified the same way; the other 13 P3 rows (all garbled-explanation
`explanation_clarity`/`unclear_explanation` findings) were spot-checked for quote-existence
only, not deep-verified.

## Summary

**41 rows triaged: 35 TRUE / 6 FALSE / 0 UNSURE.**

FALSE breakdown (6):
- `distractor-or-design-misread` — 2 (fr-m12-4, fr-m25-5-info-quiestce)
- `language-error` (judge's own error) — 1 (fr-m17-1)
- `invented-rule` — 1 (fr-m20-8)
- `hallucinated-quote` — 2 (fr-m17-5 ×2)

## Verdict table

| lesson | step | sev | verdict | kind | one-line reason |
|---|---|---|---|---|---|
| fr-m12-4 | fr-m12-4-smcq-discrim | P1 | FALSE | distractor-or-design-misread | The lesson's own preceding info card teaches «cent» verbatim as "a round ceiling, not built from smaller pieces" — this is a recall-the-taught-label question, not a pure logic puzzle; "trente" was never called a ceiling. |
| fr-m12-8 | fr-m12-8-smcq-2 | P1 | TRUE | billed-answer-has-no-valid-target | All 4 options (39/49/59/69, all "…-neuf") are equally well-formed regular taught numbers; none is actually invalid, so "which is NOT valid" has no defensible correct answer. |
| fr-m17-1 | fr-m17-1-info-onze | P1 | FALSE | language-error | "le onze" (no elision) is the standard, well-documented French exception (parallels «huit»); the judge's claimed correct form "l'onze" is wrong. |
| fr-m20-3 | fr-m20-3-map-cematin | P1 | TRUE | gloss-inconsistency | word_map glosses "parler" as "spoken"; the same lesson's match_pairs step glosses "parler" = "to speak" — inconsistent within one lesson. |
| fr-m20-8 | fr-m20-8-build-ilnevientpas | P1 | FALSE | invented-rule | "de gâteau" (not "du gâteau") after negated "il ne vient pas de manger" is correct French — the partitive collapses to bare "de" under negation of the whole clause; `docs/fr-speech-negated-frames-2026-09-10.md` treats this exact sentence as canonical and calls the du→de collapse "expected leniency, not a defect." |
| fr-m20-9 | fr-m20-9-cloze-ilvisiteparis | P1 | TRUE | ungrammatical-billed-sentence | "visiter" is directly transitive (visiter Paris); the hardcoded after-text "à Paris" produces "visiter à Paris" for the billed particle — ungrammatical (fine for the "manger" distractor only). |
| fr-m25-2 | fr-m25-2-mcq-cestqui | P1 | TRUE | ambiguous-options | "qui est-ce ?" is glossed with the identical English meaning "who is it?" as the billed "c'est qui ?" throughout the module (`crossModuleVocabMcq` template); prompt gives no register cue. |
| fr-m25-3 | fr-m25-3-mcq-cestqui | P1 | TRUE | ambiguous-options | Same template bug as fr-m25-2. |
| fr-m25-4 | fr-m25-4-mcq-cestqui | P1 | TRUE | ambiguous-options | Same template bug. |
| fr-m25-5 | fr-m25-5-info-quiestce | P1 | FALSE | distractor-or-design-misread | The dialogue_sim turn uses `mode:"choice"` (select among 3 given options), the same recognition mechanism the module's own design doc calls "recognition-only" for «qui est-ce ?» — not free production/recall, so "never asked to say it yourself" is defensible under the course's own modality taxonomy. |
| fr-m25-5 | fr-m25-5-lc-quiestce | P1 | TRUE | ambiguous-options | Correct option text is "Who is it? (written)" vs distractor "Who is it?" — identical English strings except a meta register tag a learner can't derive from audio alone. |
| fr-m25-5 | fr-m25-5-mcq-cestqui2 | P1 | TRUE | ambiguous-options | Same `crossModuleVocabMcq` template bug. |
| fr-m25-7 | fr-m25-7-mcq-cestqui | P1 | TRUE | ambiguous-options | Same template bug. |
| fr-m25-8 | fr-m25-8-mcq-cestqui | P1 | TRUE | ambiguous-options | Same template bug. |
| fr-m25-8 | fr-m25-8-lc-quiestce | P1 | TRUE | ambiguous-options | Same "(written)" tag-only distinction as fr-m25-5-lc-quiestce. |
| fr-m25-9 | fr-m25-9-mcq-cestqui | P1 | TRUE | ambiguous-options | Same template bug. |
| fr-m5-8 | fr-m5-8-cloze-au | P1 | TRUE | leaked-authoring-shorthand | "«cinéma» — blue-m: the swallow." — "blue-m"/"the swallow" are real in-course mnemonics (L1's contraction metaphor + L7's color-coded gender-sort UI), but reused as plain text with no color rendering they read as gibberish. |
| fr-m5-8 | fr-m5-8-cloze-ala | P1 | TRUE | leaked-authoring-shorthand | Same class, "pink-f" side. |
| fr-m7-8 | fr-m7-8-cloze-etudiant | P1 | TRUE | leaked-authoring-shorthand/garbled | "keeps the t asleep: DYAHN" explains nothing about masculine gender agreement. |
| fr-m20-1 | fr-m20-1-map-frame | P2 | TRUE | gloss-inconsistency | Same "manger"→"eaten" vs "to eat" class as fr-m20-3/fr-m20-4. |
| fr-m20-4 | fr-m20-4-map-ilmange | P2 | TRUE | gloss-inconsistency | Same class. |
| fr-m23-1 | fr-m23-1-match | P2 | TRUE | translation-inconsistency | "un café"→"a coffee" (drink) in match_pairs vs "il y a un café"→"there's a café" (place) recalled via speaking in the same lesson — genuine same-lesson polysemy collision. |
| fr-m26-4 | fr-m26-4-match | P2 | TRUE | untranslated-gloss | Match pair leaves "café"→"café" untranslated; same lesson's drink list ("le lait, le chocolat, le café") establishes café=coffee, but bare English "café" reads as the establishment. |
| fr-m6-6 | fr-m6-6-sim-visite (t2-refill) | P2 | TRUE | goal-answer-inconsistency | goal "Yes — politely" but `alsoCorrectOptionIds` accepts "non merci" (a refusal). |
| fr-m6-6 | fr-m6-6-sim-visite (t3-dessert) | P2 | TRUE | goal-answer-inconsistency | goal "the bill, please" but `alsoCorrectOptionIds` accepts "non merci", which doesn't ask for the bill. |
| fr-m10-10 | fr-m10-10-cloze-les | P3 | TRUE | garbled-explanation | Dangling "lay" fragment, confirmed present verbatim. |
| fr-m10-3 | fr-m10-3-info-des | P3 | TRUE | garbled-explanation | Unexplained "(day)" parenthetical. |
| fr-m10-4 | fr-m10-4-map-deslivres | P3 | TRUE | inaccurate-phonetic-note | Confusingly implies "des livres" sounds like "un livre"; actual (true) point — plural -s is silent so livres=livre — is buried. |
| fr-m17-5 | fr-m17-5-map-72to76 | P3 | FALSE | hallucinated-quote | "soixante_seize" does not appear anywhere in source TS or built JSON; both source and JSON consistently use the hyphen "soixante-seize". |
| fr-m17-5 | fr-m17-5-match | P3 | FALSE | hallucinated-quote | Same — no underscore anywhere in this lesson. |
| fr-m21-2 | fr-m21-2-cloze-septcents | P3 | TRUE | misleading-explanation | "nothing follows «cents» here" is literally false — "euros" visibly follows in "sept cents euros". |
| fr-m21-5 | fr-m21-5-info-drop | P3 | TRUE | misleading-explanation | "-s only survives... very last word" contradicts the module's own "deux cents euros" example, where -s survives despite "euros" following. |
| fr-m23-5 | fr-m23-5-cloze-sept | P3 | TRUE | garbled-explanation | References internal module id "m6" and an unrelated phrase; meaningless to a learner. |
| fr-m4-10 | fr-m4-10-cloze-une | P3 | TRUE | leaked-authoring-shorthand (mild) | Terser instance of the blue-m/pink-f class; still unexplained to a first-time reader. |
| fr-m5-2 | fr-m5-2-cloze-au | P3 | TRUE | leaked-authoring-shorthand | Same class as fr-m5-8. |
| fr-m6-10 | fr-m6-10-cloze-une | P3 | TRUE | leaked-authoring-shorthand | Same class. |
| fr-m6-5 | fr-m6-5-cloze-le | P3 | TRUE | leaked-authoring-shorthand | Same class. |
| fr-m6-8 | fr-m6-8-cloze-un | P3 | TRUE | leaked-authoring-shorthand | Same class. |
| fr-m6-8 | fr-m6-8-cloze-stp | P3 | TRUE | garbled-explanation | "The L7 trial went to the server; this one stays at the table" conveys no grammar content. |
| fr-m7-10 | fr-m7-10-sim-diner | P3 | TRUE | field-mismatch | NPC display text "Enchantée !" (fem, correct for the female speaker) but `audioText: "enchanté"` (masc) — genuine field mismatch, though phonetically identical in speech. |
| fr-m9-9 | fr-m9-9-cloze-grande | P3 | TRUE | garbled-explanation | "however many of you there are" is irrelevant filler unrelated to gender agreement. |

## Real defects to fix (grouped by module; all sources are hand-authored TS — fr has no IR pipeline)

### m5 — `src/features/languages/fr/curriculum/m5.ts`
- `fr-m5-8-cloze-au` explanation: `«cinéma» — blue-m: the swallow.` → `«cinéma» is masculine (blue-m), so à + le contracts to au: au cinéma.`
- `fr-m5-8-cloze-ala` explanation: `«plage» — pink-f: both pieces stay.` → `«plage» is feminine (pink-f), so à + la doesn't contract — both pieces stay: à la plage.`
- `fr-m5-2-cloze-au` explanation: `«musée» lies about its ending — blue-m, so the swallow: «au musée».` → `«musée» looks like it could be feminine but is masculine (blue-m), so à + le contracts: au musée.`

### m6 — `src/features/languages/fr/curriculum/m6.ts`
- `fr-m6-10-cloze-une`: `«salade» — pink-f, seconds included.` → `«salade» is feminine (pink-f), so it takes «une».`
- `fr-m6-5-cloze-le`: `«fromage» — blue-m, whatever the menu says.` → `«fromage» is masculine (blue-m), so it takes «le».`
- `fr-m6-8-cloze-un`: `«sandwich» — blue-m, borrowed and filed.` → `«sandwich» is masculine (blue-m), a borrowed word, so it takes «un».`
- `fr-m6-8-cloze-stp`: `The friend-key — «te». The L7 trial went to the server; this one stays at the table.` → `Use «s'il te plaît» when speaking to a friend (tu form).`
- `fr-m6-6-sim-visite` t2-refill: `alsoCorrectOptionIds: ["nonmerci"]` (goal "Yes — politely") → remove "nonmerci"; only "oui s'il vous plaît" accomplishes the goal.
- `fr-m6-6-sim-visite` t3-dessert: `alsoCorrectOptionIds: ["nonmerci"]` (goal "the bill, please") → remove "nonmerci", or reword goal to "Decline dessert and/or ask for the bill."

### m7 — `src/features/languages/fr/curriculum/m7.ts`
- `fr-m7-8-cloze-etudiant`: `«mon frère» keeps the t asleep: DYAHN.` → `«frère» is masculine, so the adjective takes the masculine form: étudiant (the final -t stays silent).`
- `fr-m7-10-sim-diner` turn t2-lea: `audioText: "enchanté"` → `audioText: "enchantée"` (agrees with displayed "Enchantée !" and the female speaker).

### m9 — `src/features/languages/fr/curriculum/m9.ts`
- `fr-m9-9-cloze-grande`: `«famille» — pink-f: «grande», however many of you there are.` → `«famille» is feminine (pink-f), so the adjective takes the -e form: grande.`

### m10 — `src/features/languages/fr/curriculum/m10.ts`
- `fr-m10-10-cloze-les`: `Plural spelling, plural article — «les», lay.` → `Plural spelling, plural article — «les» (pronounced "lay").`
- `fr-m10-3-info-des`: `«des» — some, the plural 'a' (day)` → `«des» — some, the plural of un/une (pronounced like "day").`
- `fr-m10-4-map-deslivres`: `A shelf appears — «des livres», sounding exactly like one book plus «day».` → `A shelf appears — «des livres»: the -s in «livres» is silent, so it sounds like the singular «livre» — but «des» (some) is a different word from «un» (a).`

### m4 — `src/features/languages/fr/curriculum/m4.ts`
- `fr-m4-10-cloze-une`: `«gare» — pink-f, «une».` → `«gare» is feminine (pink-f), so it takes «une».`

### m12 — `src/features/languages/fr/curriculum/m12.ts`
- `fr-m12-8-smcq-2`: prompt "'It costs seventy euros' — wait, which of these is NOT a valid regular number this module taught?", `correctText: "soixante-neuf euros"`, distractors `["cinquante-neuf euros","quarante-neuf euros","trente-neuf euros"]` — all four are equally well-formed. Fix: either swap in a genuinely irregular option (e.g. "soixante-dix-neuf euros" — 79, which breaks the module's regular-tens pattern) as the billed correctText, or rewrite the prompt so it no longer implies one option is invalid.

### m20 — `src/features/languages/fr/curriculum/m20.ts`
- `fr-m20-9-cloze-ilvisiteparis`: `prompt.after: "à Paris."` with `correctParticle: "visiter"` → change after-field to `"Paris."` (drop "à"; "visiter" is directly transitive).
- `fr-m20-3-map-cematin` pair tokenIndex 2: `{"en":"spoken","tokenIndex":2}` (token "parler") → `{"en":"to speak","tokenIndex":2}`.
- `fr-m20-1-map-frame` pair tokenIndex 1: `{"en":"eaten","tokenIndex":1}` (token "manger") → `{"en":"to eat","tokenIndex":1}`.
- `fr-m20-4-map-ilmange` pair tokenIndex 1: `{"en":"eaten","tokenIndex":1}` (token "manger") → `{"en":"to eat","tokenIndex":1}`.

### m21 — `src/features/languages/fr/curriculum/m21.ts`
- `fr-m21-2-cloze-septcents`: `nothing follows «cents» here, so the -s stays.` → `No number follows «cents» here (unlike in «deux cent mille»), so the -s stays.`
- `fr-m21-5-info-drop`: `The -s only survives when «cent(s)» is the very last word.` → `The -s only survives when no other number follows «cent(s)» — e.g. «deux cents euros» keeps the -s, but «deux cent un» drops it.`

### m23 — `src/features/languages/fr/curriculum/m23.ts`
- `fr-m23-1-match` pair p-4: `"un café" → "a coffee"` → `"un café" → "a coffee (the drink)"` (disambiguates from "il y a un café" = "there's a café", recalled earlier in the same lesson).
- `fr-m23-5-cloze-sept`: `«sept» — the number that names m6's own «s'il te plaît» count, seven o'clock.` → `«sept» = seven. Il est sept heures = It's seven o'clock.`

### m26 — `src/features/languages/fr/curriculum/m26.ts`
- `fr-m26-4-match` pair p-5: `"café" → "café"` → `"café" → "coffee"` (matches the same lesson's "j'aime le lait/le chocolat/le café" drink list).

**Recurring class:** 8 of the "real defect" fixes above (m4, m5×3, m6×3, m7, m9) share one root cause — a color-coded gender mnemonic ("blue-m"/"pink-f", introduced properly once via `genderSort` bucket UI in m5 L7 and a "the swallow" contraction metaphor in m5 L1) gets reused as compressed plain-text shorthand in `explanation`/cloze-feedback strings elsewhere, where there is no color rendering, so the shorthand reads as gibberish. Worth a single sweep across all m4–m10 hand-authored modules rather than one-off fixes.

## Classes (FALSE verdicts)

- **hallucinated-quote (2)** — fr-m17-5 ×2: judge asserted a spelling ("soixante_seize" with underscore) that does not exist anywhere in source or built JSON; both places consistently use the hyphen.
- **distractor-or-design-misread (2)** — fr-m12-4, fr-m25-5-info-quiestce: judge missed direct textual evidence sitting in the same lesson/module (an info card teaching the exact phrase being tested; a module design doc explicitly calling the tested item "recognition-only") that resolves the apparent ambiguity/contradiction.
- **language-error (1)** — fr-m17-1: judge asserted a French elision rule backwards; "le onze" (not "l'onze") is the actual, well-documented exception, matching «huit».
- **invented-rule (1)** — fr-m20-8: judge asserted the partitive must stay "du" under negation of "venir de + infinitive"; actual French collapses it to bare "de", confirmed by the codebase's own `docs/fr-speech-negated-frames-2026-09-10.md`, which treats this exact sentence as the canonical, correct target.
