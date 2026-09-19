/**
 * lib/packSections.mjs — the SPEC-format / atom-fields / taught-vocabulary
 * sections of `docs/pt-authoring-pack.md`. Split out of `pack.mjs` purely
 * to keep every file under this lane's 150-line budget.
 */
export function appendSpecFormat(w) {
  w(`## SPEC format`);
  w("```yaml");
  w(`lesson: 3                      # positive integer`);
  w(`id: pt-m1-l3                   # lesson id, matches the spec's filename`);
  w(`title: "Eu tenho uma família"`);
  w(`grammar: "ter present sg.; um/uma agreement"   # authoring-only metadata — NEVER learner copy`);
  w(`infoTitle: "Ter: tenho / tem"  # REQUIRED, learner-facing info-card title, != grammar`);
  w(`info: "..."                    # REQUIRED, learner-facing info-card body, != grammar`);
  w(`antiPattern: { ok: "Sam está cansado.", wrong: "Sam é cansado." }   # optional, structured`);
  w(`allow: [e, não, mas]           # optional, declared function words (taught-vocab residual check)`);
  w(`words:                         # <= 8 new atoms, debut order (0 allowed only when checkpoint: true)`);
  w(`  - { pt: família, en: family, pos: noun, gender: f, emoji: "👨‍👩‍👧", cognate: true }`);
  w(`  - { pt: tenho, en: "I have", pos: verb-form, of: ter }`);
  w(`recall: [sou, é]               # optional, already-taught surfaces usable in "uses" — NO cap, no new atom`);
  w(`contrastSet: [[tenho, tem]]    # optional, list of surface-groups; a cloze on a member's options`);
  w(`                                # MUST be exactly that group (never a random same-POS noun);`);
  w(`                                # checkpoint auto-tops-up coverage from a spare recall sentence`);
  w(`contrast: [{ a: sou, b: é, note: "1st vs 2nd/3rd person" }]  # optional, minimal-pair -> textMcq`);
  w(`pattern: { frame: "Eu ___ de ___", slots: [{ pt: "Eu gosto de música.", en: "I like music.", distractorsEn: ["I have music.", "I am music."] }] }`);
  w(`conjugation: { verb: falar, forms: [{ pt: "Eu falo português.", en: "I speak Portuguese.", blank: falo }, { pt: "Você fala português.", en: "You speak Portuguese.", blank: fala }] }`);
  w(`sentences:                     # roles drive step generation; uses = credited atoms`);
  w(`  - { pt: "Eu tenho uma família grande.", en: "I have a big family.", roles: [build, debut], uses: [tenho, família] }`);
  w(`  - { pt: "Você tem um irmão?", en: "Do you have a brother?", roles: ["cloze:tem", listen], uses: [tem, um, irmão] }`);
  w(`agreement:                     # optional -> ONE agreementLit, >= 2 real blanks, no proper-noun answer`);
  w(`  sentence: "Eu tenho um amigo e uma irmã."`);
  w(`  en: "I have a friend and a sister."`);
  w(`  blanks: [{ answer: um, options: [um, uma] }, { answer: uma, options: [um, uma] }]`);
  w(`dialogue: { npc: Bia, turns: [{ npc: "Você tem família aqui?", gloss: "...", goal: "...", options: ["Tenho, sim.", "Sou estudante."], correct: 0 }] }  # REQUIRED, >= 1 turn`);
  w(`win: { pt: "Eu tenho uma família e um gato.", en: "I have a family and a cat." }`);
  w("```");
  w(`Roles: \`build\`, \`listen\`, \`speak\` (mid-lesson speakLit, not just the closing win), \`cloze:<word>\`,`);
  w(`\`debut\` (waives the tile floor). A word tagged \`build\` whose \`uses\` includes a contraction is`);
  w(`forced to \`cloze:\` automatically — if that sentence's own atoms have no OTHER intro-capable`);
  w(`appearance, the scheduler auto-inserts a \`phrase\` debut immediately before it (never the info card).`);
  w(`\`checkpoint: true\` — a zero-new-atom recall lesson: \`words\` may be empty (padded from \`recall\`),`);
  w(`no \`imageMcq\` debut allowed, and the lesson ends \`matchLit -> speakLit -> sim\` (module law: the`);
  w(`LAST lesson always ends on the sim) instead of the usual \`sim -> matchLit -> speakLit\`.`);
  w(`\`ir.checkpoint\` (the compiler's OWN module-header field, separate from this per-lesson flag) is the`);
  w(`INTERIOR mastery-review lesson index (\`1 < checkpoint < lessons.length\`, strictly) — a checkpoint`);
  w(`that is also the module's FINAL lesson satisfies the ends-on-sim law instead and cannot legally be`);
  w(`\`ir.checkpoint\`'s value; leave \`ir.checkpoint\` at an interior review lesson, or omit it, when the`);
  w(`module's own zero-new-atom lesson is its last (m1's own situation — see PTINT/PTR1-L6's reports).`);
  w(`A slash pair in a design-doc row (e.g. "no/na", "cansado/cansada") is TWO atoms and counts twice`);
  w(`toward the 8-word \`words\` cap — it is not one atom with two surfaces.`);
  w(`A dialogue turn may set \`mode: build\` instead of \`options\`/\`correct\`: \`{ npc: "...", mode: build,`);
  w(`tiles: [...], answer: "..." }\` — a real tiles+answer sim reply (assemble.mjs's own "build" shape),`);
  w(`never MCQ; \`tiles\` must cover \`answer\` (and any \`alsoAccepted\`) by word count.`);
  w();
}

export function appendAtomFields(w) {
  w(`## \`words:\` entry fields`);
  w(`| field | meaning |`);
  w(`|---|---|`);
  w(`| \`pt\` | surface form, required |`);
  w(`| \`en\` | English gloss, required |`);
  w(`| \`pos\` | noun/verb/verb-form/particle/adjective/adverb/pronoun/proper-noun/interjection/article;`);
  w(`  \`verb-form\` folds onto \`verb\`, \`article\` folds onto \`determiner\` in the emitted atom`);
  w(`  (\`Atom.partOfSpeech\` has no \`verb-form\`/\`article\` member) |`);
  w(`| \`gender\` | \`m\`/\`f\` for a real masc/fem pair; \`epicene\` for a noun whose surface is IDENTICAL`);
  w(`  across genders (e.g. \`estudante\`) — carried straight through, not guessed |`);
  w(`| \`emoji\` | REQUIRED for \`pos: noun\` (unless \`imageable: false\`); must be vendored |`);
  w(`| \`imageable\` | \`false\` opts a noun OUT of imageMcq — requires \`imageableReason\` |`);
  w(`| \`cognate\` | documentation only — front-loads it as a low-risk debut, no generator effect yet |`);
  w(`| \`falseFriend\` | documentation only — flags for a future antiPattern step |`);
  w(`| \`of\` | which verb a conjugated \`verb-form\` belongs to, documentation only |`);
  w(`| \`hint\` | pronunciation nudge, carried straight to the atom |`);
  w();
}

/** "Lesson briefs" — round 2 (lane PTTOOL2) pack-hygiene finding 3: embed
 *  each real m1 lesson's design-doc §4 row so a lane reads ONE file
 *  instead of also opening the design doc. Hand-maintained (the design doc
 *  is the source of truth; this is a copy for reading convenience) —
 *  update it if a lesson's brief changes. */
export function appendLessonBriefs(w) {
  w(`## Lesson briefs (docs/pt-course-design-2026-09-18.md §4, m1 L1-L6)`);
  w(`| L | Title | Grammar point | Atoms (exact set, this pack's real specs) | Win |`);
  w(`|---|---|---|---|---|`);
  w(`| 1 | Eu sou Sam | ser present sg. (sou/é); greetings | olá, eu, você, sou, é, estudante, professor, Brasil | «Eu sou Sam, sou estudante.» |`);
  w(`| 2 | De onde você é? | ser + de (origin); do/da contractions | de, onde, do, da, cidade, país, França, Califórnia | «Eu sou do Brasil, e você?» |`);
  w(`| 3 | Eu tenho uma família | ter present sg.; um/uma agreement | tenho, um, gato, uma, irmã, amigo, família, tem | «Eu tenho um amigo e uma irmã.» |`);
  w(`| 4 | Eu estou cansado | estar present sg.; ser-vs-estar; em+o (no) | estou, está, em, no, cansado, feliz, aqui, hospital | «Eu estou cansado, mas estou feliz.» |`);
  w(`| 5 | O que você gosta de fazer? | gostar de + infinitivo; -ar/-er/-ir preview | gosto, gosta, falar, comer, assistir, filme, música, pizza | «Sam gosta de comer pizza e assistir filme.» |`);
  w(`| 6 | Eu sou, estou, tenho e gosto | CHECKPOINT — recall only, 0 new atoms | (recall: sou, é, estou, está, tenho, tem, gosto, gosta) | «Eu estou feliz porque sou estudante, tenho amigos e gosto do Brasil.» |`);
  w();
}

export function appendTaughtVocab(w, taught) {
  w(`## Taught vocabulary so far (generated from \`courseAtoms.m1-l*.ts\`)`);
  if (!taught.length) { w(`_none yet._`); w(); return; }
  for (const { module, lesson, atoms } of taught) {
    w(`**${module} L${lesson}** (${atoms.length}): ${atoms.map((a) => `${a.surface} (${a.meaningEn})`).join(", ")}`);
  }
  w();
}
