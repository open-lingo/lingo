/**
 * lib/packSections.mjs — the SPEC-format / atom-fields / taught-vocabulary
 * sections of `docs/pt-authoring-pack.md`. Split out of `pack.mjs` purely
 * to keep every file under this lane's 150-line budget.
 */
export function appendSpecFormat(w) {
  w(`## SPEC format`);
  w("```yaml");
  w(`lesson: 3                      # 1-5 (m1 only, this lane's scope)`);
  w(`id: pt-m1-l3                   # lesson id, matches the spec's filename`);
  w(`title: "Eu tenho uma família"`);
  w(`grammar: "ter present sg.; um/uma agreement"   # one line -> the info step`);
  w(`info: "..."                    # optional, <=3 lines plain English (defaults to grammar)`);
  w(`words:                         # <= 8 new atoms, debut order`);
  w(`  - { pt: família, en: family, pos: noun, gender: f, emoji: "👨‍👩‍👧", cognate: true }`);
  w(`  - { pt: tenho, en: "I have", pos: verb-form, of: ter }`);
  w(`sentences:                     # roles drive step generation; uses = credited atoms`);
  w(`  - { pt: "Eu tenho uma família grande.", en: "I have a big family.", roles: [build, debut], uses: [tenho, família] }`);
  w(`  - { pt: "Você tem um irmão?", en: "Do you have a brother?", roles: ["cloze:tem", listen], uses: [tem, um, irmão] }`);
  w(`agreement: [{ m: "um irmão", f: "uma irmã" }]     # optional -> agreementLit`);
  w(`dialogue: { npc: Bia, turns: [{ npc: "Você tem família aqui?", gloss: "...", goal: "...", options: ["Tenho, sim.", "Sou estudante."], correct: 0 }] }`);
  w(`win: { pt: "Eu tenho uma família e um gato.", en: "I have a family and a cat." }`);
  w("```");
  w(`Roles: \`build\`, \`listen\`, \`cloze:<word>\`, \`debut\` (waives the tile floor). A word`);
  w(`tagged \`build\` whose \`uses\` includes a contraction is forced to \`cloze:\` automatically.`);
  w();
}

export function appendAtomFields(w) {
  w(`## \`words:\` entry fields`);
  w(`| field | meaning |`);
  w(`|---|---|`);
  w(`| \`pt\` | surface form, required |`);
  w(`| \`en\` | English gloss, required |`);
  w(`| \`pos\` | noun/verb/verb-form/particle/adjective/adverb/pronoun/proper-noun/interjection;`);
  w(`  \`verb-form\` folds onto \`verb\` in the emitted atom (\`Atom.partOfSpeech\` has no such member) |`);
  w(`| \`gender\` | \`m\`/\`f\`, nouns only |`);
  w(`| \`emoji\` | enables imageMcq debut; check it's vendored first |`);
  w(`| \`cognate\` | documentation only — front-loads it as a low-risk debut, no generator effect yet |`);
  w(`| \`falseFriend\` | documentation only — flags for a future antiPattern step |`);
  w(`| \`of\` | which verb a conjugated \`verb-form\` belongs to, documentation only |`);
  w(`| \`hint\` | pronunciation nudge, carried straight to the atom |`);
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
