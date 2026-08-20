/**
 * fr-ir/assemble.mjs — the FRENCH step emitters, FRAMELESS-ONLY.
 *
 * The ES assembler is the parent (es-ir/assemble.mjs); this is its literal
 * half with the drafted-pool machinery removed rather than stubbed: French
 * has no frames, no drafted pools and no morphology module yet (fr guide §9),
 * and a pick() that throws at runtime is worse than a pick that does not
 * exist. When the first FR verb module lands, the frame half gets built the
 * way the guide prescribes — by parameterizing the ES one, not by copying it.
 *
 * WHAT IS FRENCH HERE rather than renamed-Spanish:
 *   · accepted() for translate carries NO deaccent variants. The ES policy
 *     (accept the accent-stripped answer as fully right) is wrong for the
 *     French minimal pairs where the accent IS the word (a/à, ou/où — fr pin
 *     F5); leniency stays in the shared accentFold grading path, which
 *     accepts-but-flags. Nothing here blesses the bare form.
 *   · three literal beats the ES compiler has no kind for: silentLetterLit,
 *     liaisonListenLit, genderSortLit — the French rungs of the ja script
 *     ladder (fr guide §0.1 on ja §4e).
 *   · deep validation (elision breaches, homophone tiles, liaison junction
 *     legality) lives in fr/grammarHelpers.ts and fires when the generated
 *     module is imported — ONE implementation, not a compiler copy that can
 *     drift (the es guide's own instrument-vs-content lesson).
 */

const q = (s) => JSON.stringify(s);
const bare = (s) => s.replace(/\.$/, "");
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const words = (fr) => bare(fr).split(" ");

/** Accepted typed answers: capitalised or not — and NOTHING accent-stripped
 *  (fr pin F5; see the header). */
const accepted = (fr) => [...new Set([lower1(bare(fr)), bare(fr)])];

/** A literal beat missing a field fails by NAME at compile time. */
function requireLit(id, o, fields) {
  for (const f of fields) {
    const v = o?.[f];
    const missing =
      v === undefined ||
      v === null ||
      (typeof v === "string" && !v.trim()) ||
      (Array.isArray(v) && v.length === 0);
    if (missing) throw new Error(`${id}: literal beat is missing "${f}"`);
  }
}

export function makeAssembler({ moduleId }) {
  if (!/^m\d+$/.test(moduleId)) throw new Error(`makeAssembler: bad moduleId "${moduleId}"`);

  /** Same compile-time tile check as ES: a distractor tile that is also an
   *  answer token oversupplies it and the step cannot be assembled as
   *  intended. (Elision/homophone checks run in the factories — see header.) */
  function checkDistractors(id, fr, distractors) {
    const answer = new Set(words(fr).map(lower1));
    const collide = distractors.filter((d) => answer.has(lower1(d)));
    if (collide.length) {
      throw new Error(
        `${id}: distractor tile(s) ${collide.join(", ")} already appear in the answer "${bare(fr)}"`,
      );
    }
    return distractors;
  }

  const S = {
    info: (id, title, body, variant = "grammar") =>
      `    infoStep(\n      ${q(id)},\n      ${q(title)},\n      ${q(body)},\n      ${q(variant)},\n    ),`,

    phrase: (id, meaning, text, emoji) =>
      emoji
        ? `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}, undefined, { emoji: ${q(emoji)} }),`
        : `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}),`,

    mcq: (id, prompt, correct, distractors, why, atoms) =>
      `    sentenceMcq({\n      id: ${q(id)},\n      prompt: ${q(prompt)},\n      correctText: ${q(correct)},\n      distractorsText: [${distractors.map(q).join(", ")}],\n      explanation: ${q(why)},\n      exercisedAtomSurfaces: [${atoms.map(q).join(", ")}],\n    }),`,

    textMcq: (id, target, distractors, prompt) =>
      `    vocabTextMcq(${q(id)}, ${q(target)}, [${distractors.map(q).join(", ")}]${prompt ? `, ${q(prompt)}` : ""}),`,

    match: (id, surfaces) => `    matchPairs(${q(id)}, [${surfaces.map(q).join(", ")}]),`,

    selfExplain: (o) =>
      `    selfExplain({\n      id: ${q(o.id)},\n      anchorLabel: ${q(o.anchorLabel)},\n      anchorAudioText: ${q(o.anchorAudioText)},\n      question: ${q(o.question)},\n      rule: { text: ${q(o.rule)} },\n      surface: { text: ${q(o.surface)} },\n      distractor: { text: ${q(o.distractor)} },\n      ruleExplanation: ${q(o.ruleExplanation)},\n    }),`,

    // ── literal beats (the whole FR m1 vocabulary — no frame, no pool) ──

    /** Requires the atom to have an emoji (the factory throws without one). */
    vocabMcq: (id, target, distractors) => {
      if (!target?.emoji) {
        throw new Error(`vocabMcq(${id}): target "${target?.surface}" has no emoji`);
      }
      if (!Array.isArray(distractors) || distractors.length < 3) {
        throw new Error(`vocabMcq(${id}): needs >= 3 distractors`);
      }
      const d = distractors
        .map((x) => `{ surface: ${q(x.surface)}, emoji: ${q(x.emoji)} }`)
        .join(", ");
      return `    vocabMcq(${q(id)}, { surface: ${q(target.surface)}, meaningEn: ${q(target.meaningEn)}, emoji: ${q(target.emoji)} }, [${d}]),`;
    },

    buildLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "atoms"]);
      checkDistractors(id, o.fr, o.tiles ?? []);
      if (/[?!,]/.test(o.fr)) {
        // words() would glue «?» onto a tile or emit it as one. Build targets
        // are declarative by rule; question phrases are spoken or listened to.
        throw new Error(`buildLit(${id}): "${o.fr}" carries punctuation — build targets must be plain word sequences`);
      }
      return `    build(\n      ${q(id)},\n      ${q(`Build: '${bare(o.en)}'`)},\n      ${q(lower1(bare(o.fr)))},\n      [${[...words(o.fr).map(lower1), ...(o.tiles ?? [])].map(q).join(", ")}],\n      [${words(o.fr).map(lower1).map(q).join(", ")}],\n      [${o.atoms.map(q).join(", ")}],\n    ),`;
    },

    translateLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "atoms"]);
      return `    translateStep({\n      id: ${q(id)},\n      promptEn: ${q(bare(o.en))},\n      acceptedAnswers: [${accepted(o.fr).map(q).join(", ")}],\n      audioText: ${q(lower1(bare(o.fr)))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    speakLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "atoms"]);
      return `    speaking(${q(id)}, ${q(lower1(bare(o.fr)))}, ${q(bare(o.en))}, [${o.atoms.map(q).join(", ")}]),`;
    },

    listenCompLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "atoms", "distractorsEn"]);
      const d = o.distractorsEn;
      if (!Array.isArray(d) || d.length !== 3 || new Set(d).size !== 3 || d.includes(o.en)) {
        throw new Error(
          `listenCompLit(${id}): needs exactly 3 distinct English distractors, none equal to the answer`,
        );
      }
      return `    listeningCompSentence({\n      id: ${q(id)},\n      audioText: ${q(lower1(bare(o.fr)))},\n      correctMeaningEn: ${q(bare(o.en))},\n      distractorsEn: [${d.map((x) => q(bare(x))).join(", ")}],\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    listenBuildLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "atoms"]);
      checkDistractors(id, o.fr, o.tiles ?? []);
      if (/[?!,]/.test(o.fr)) {
        throw new Error(`listenBuildLit(${id}): "${o.fr}" carries punctuation — build targets must be plain word sequences`);
      }
      return `    listeningBuildSentence({\n      id: ${q(id)},\n      target: ${q(lower1(bare(o.fr)))},\n      tiles: [${[...words(o.fr).map(lower1), ...(o.tiles ?? [])].map(q).join(", ")}],\n      correctOrder: [${words(o.fr).map(lower1).map(q).join(", ")}],\n      promptEn: ${q(bare(o.en))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    clozeLit: (id, o) => {
      requireLit(id, o, ["fr", "en", "blank", "options", "atoms"]);
      const w = words(o.fr);
      const i = w.indexOf(o.blank);
      if (i === -1) {
        throw new Error(`clozeLit(${id}): "${o.blank}" is not a word of "${o.fr}"`);
      }
      if (!o.options.includes(o.blank)) {
        throw new Error(`clozeLit(${id}): options must include the blanked word "${o.blank}"`);
      }
      if (new Set(o.options).size !== o.options.length) {
        throw new Error(`clozeLit(${id}): duplicate options`);
      }
      const before = w.slice(0, i).join(" ") + (i > 0 ? " " : "");
      const after = (i < w.length - 1 ? " " : "") + w.slice(i + 1).join(" ") + ".";
      return `    cloze(\n      ${q(id)},\n      ${q(before)},\n      ${q(after)},\n      ${q(o.blank)},\n      [${o.options.map(q).join(", ")}],\n      ${q(bare(o.en))},\n      ${q(lower1(bare(o.fr)))},\n      ${q(o.why ?? "")},\n      [${o.atoms.map(q).join(", ")}],\n    ),`;
    },

    dialogueLit: (id, o) => {
      requireLit(id, o, ["lines", "questions", "atoms"]);
      const lines = o.lines
        .map((l) => `        { speaker: ${q(l.speaker)}, text: ${q(l.text)} },`)
        .join("\n");
      const questions = o.questions
        .map((qu) => {
          if (!Array.isArray(qu.distractors) || qu.distractors.length !== 3) {
            throw new Error(`dialogueLit(${id}): question "${qu.id}" needs exactly 3 distractors`);
          }
          return `        {\n          id: ${q(qu.id)},\n          prompt: ${q(qu.prompt)},\n          correctText: ${q(qu.correctText)},\n          distractors: [${qu.distractors.map(q).join(", ")}],\n        },`;
        })
        .join("\n");
      return `    dialogueListen({\n      id: ${q(id)},\n      lines: [\n${lines}\n      ],\n      questions: [\n${questions}\n      ],\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    // ── FRENCH literal beats — the sound/spelling rungs ──────────────────

    silentLetterLit: (id, o) => {
      requireLit(id, o, ["writtenForm", "graphemes", "silent", "en"]);
      // The factory re-checks all of this at import time; failing here too
      // costs nothing and names the IR line instead of the generated one.
      if (o.graphemes.join("") !== o.writtenForm) {
        throw new Error(
          `silentLetterLit(${id}): graphemes spell "${o.graphemes.join("")}" but writtenForm is "${o.writtenForm}"`,
        );
      }
      const fields = [
        `      id: ${q(id)},`,
        `      writtenForm: ${q(o.writtenForm)},`,
        `      graphemes: [${o.graphemes.map(q).join(", ")}],`,
        `      silentIndices: [${o.silent.join(", ")}],`,
        `      meaningEn: ${q(o.en)},`,
      ];
      if (o.ruleNote) fields.push(`      ruleNote: ${q(o.ruleNote)},`);
      if (o.contrast) {
        fields.push(
          `      contrast: { writtenForm: ${q(o.contrast.writtenForm)}, meaningEn: ${q(o.contrast.meaningEn)}${o.contrast.note ? `, note: ${q(o.contrast.note)}` : ""} },`,
        );
      }
      return `    silentLetter({\n${fields.join("\n")}\n    }),`;
    },

    liaisonListenLit: (id, o) => {
      requireLit(id, o, ["words", "en"]);
      if (!Array.isArray(o.linked)) {
        throw new Error(`liaisonListenLit(${id}): "linked" must be an array of junction indices (may be empty)`);
      }
      const fields = [
        `      id: ${q(id)},`,
        `      words: [${o.words.map(q).join(", ")}],`,
        `      linkedJunctions: [${o.linked.join(", ")}],`,
        `      meaningEn: ${q(o.en)},`,
      ];
      if (o.audioText) fields.push(`      audioText: ${q(o.audioText)},`);
      if (o.junctionNotes) {
        const notes = Object.entries(o.junctionNotes)
          .map(([k, v]) => `${k}: ${q(v)}`)
          .join(", ");
        fields.push(`      junctionNotes: { ${notes} },`);
      }
      if (o.explanation) fields.push(`      explanation: ${q(o.explanation)},`);
      return `    liaisonListen({\n${fields.join("\n")}\n    }),`;
    },

    genderSortLit: (id, o) => {
      requireLit(id, o, ["buckets", "items"]);
      const buckets = o.buckets.map((b) => `{ id: ${q(b.id)}, label: ${q(b.label)} }`).join(", ");
      const items = o.items.map((it) => `{ surface: ${q(it.surface)}, bucketId: ${q(it.bucketId)} }`).join(", ");
      const fields = [
        `      id: ${q(id)},`,
        `      buckets: [${buckets}],`,
        `      items: [${items}],`,
      ];
      if (o.endingRule) fields.push(`      endingRule: ${q(o.endingRule)},`);
      if (o.explanation) fields.push(`      explanation: ${q(o.explanation)},`);
      return `    genderSort({\n${fields.join("\n")}\n    }),`;
    },
  };

  return { S, checkDistractors };
}

export { q, bare, lower1, accepted, words };
