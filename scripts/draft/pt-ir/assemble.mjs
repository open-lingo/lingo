/**
 * pt-ir/assemble.mjs — the Portuguese step emitters, FRAMELESS ONLY.
 *
 * This is `es-ir/assemble.mjs` (the ES frame-parameterized assembler) with
 * every frame-drawing code path removed rather than stubbed — not a corner
 * cut, but the correct scope: `docs/pt-course-design-2026-09-18.md` §1 row 1
 * decides PT's whole authoring pipeline is "frameless" (an agent drafts IR
 * directly against a brief; no `frames-pt-*.mjs` verb-cell generator, no
 * `morph-pt.mjs`, no drafted-pool JSON — ever, not just "not yet" the way
 * FR's `fr-ir/assemble.mjs` frames its own frameless-for-now state). So
 * `pick()` and everything that exists solely to feed it (formMcq,
 * formDistractors, listeningDistractors, the frame-drawing build/translate/
 * speaking/cloze/listenComp/listenBuild, the `conjugate` import from
 * `morph-es.mjs`) are DROPPED, not disabled.
 *
 *   const A = makeAssembler({ moduleId: "m1" });
 *   A.S.buildLit("pt-m1-1-b-1", { pt: "eu sou estudante", en: "I am a student", atoms: [...] });
 *
 * WHAT DID NOT CHANGE: nothing emitted here is sampled. Every Portuguese
 * string is carried LITERALLY in the IR (the *Lit beats) — there is no pool
 * to draw from and nothing here invents a sentence. A literal beat missing a
 * field fails by NAME at compile time (`requireLit`), because the frameless
 * pipeline has no draft pool to blame for a gap — the IR is the only place
 * the omission can live.
 *
 * FIELD NAMING: the ES parent's literal-beat objects carry their target
 * sentence as `o.es`. Here that field is `o.pt` throughout (IR authors write
 * `pt: "..."`, not `es: "..."`) — this is a real rename, not cosmetic, so an
 * author copy-pasting an ES IR snippet gets a clear "missing field" error
 * instead of a silently-blank Portuguese sentence.
 *
 * PT-SPECIFIC RULE (design doc §3): Portuguese's contraction set (do/da/no/
 * na/pelo/dele/…) is far larger than ES's two-item list and closer to FR's
 * burden. Contractions are cloze-only, never separable tiles — `buildLit`
 * and `listenBuildLit` both throw if a contraction shows up as a tile (see
 * `checkNoContractionTiles` below).
 */

const q = (s) => JSON.stringify(s);
const bare = (s) => s.replace(/\.$/, "");
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const deaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const words = (pt) => bare(pt).split(" ");
/** Tiles keep the sentence's own casing except the sentence-initial capital —
 *  a mid-sentence capital is a proper name («o marido da Ana»), and a tile
 *  reading "ana" against a target of "Ana" is the compiler's fault, not the
 *  author's (the same lesson ES learned in its own m5). */
const tileWords = (pt) => words(pt).map((w, i) => (i === 0 ? lower1(w) : w));

/** translate accepts the sentence with and without accents, capitalised or
 *  not — the accent policy is accept-but-flag; a learner on a US keyboard
 *  must never be graded wrong for a missing ã/ç/é. */
const accepted = (pt) =>
  [...new Set([lower1(bare(pt)), bare(pt), deaccent(lower1(bare(pt))), deaccent(bare(pt))])];

/** A literal beat missing a field fails by NAME at compile time — the
 *  frameless pipeline has no draft pool to blame, so the IR is the only
 *  place the omission can live. */
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

/** atoms must be DECLARED on every literal beat, but [] is legal — the
 *  m1/m2 convention (inherited from ES) for a step that credits nothing
 *  (cross-module tails). */
function requireAtoms(id, o) {
  if (!Array.isArray(o.atoms)) {
    throw new Error(`${id}: atoms must be an array (use [] to credit nothing)`);
  }
}

/**
 * PT contraction set (design doc §3 — do/da/no/na/pelo/dele/… plus the
 * demonstrative-contracted forms). Checked case-insensitively against every
 * build/listen-build tile so a contraction can never be handed to the
 * learner as a movable piece — cloze is the only legal presentation.
 */
const PT_CONTRACTIONS = new Set(
  [
    "do", "da", "dos", "das", "no", "na", "nos", "nas", "ao", "aos", "à", "às",
    "num", "numa", "nuns", "numas", "pelo", "pela", "pelos", "pelas",
    "dele", "dela", "deles", "delas",
    "desse", "dessa", "desses", "dessas", "deste", "desta", "destes", "destas",
    "disso", "disto", "daquilo", "daquele", "daquela", "naquele", "naquela",
  ].map((s) => s.toLowerCase()),
);

/** `kind` names the calling factory ("buildLit" / "listenBuildLit") so the
 *  thrown error points at the actual step kind the author wrote. */
function checkNoContractionTiles(kind, id, tiles) {
  for (const tile of tiles) {
    if (PT_CONTRACTIONS.has(String(tile).toLowerCase())) {
      throw new Error(
        `${kind}(${id}): "${tile}" is a PT contraction — contractions are cloze-only, ` +
          `never separable tiles (docs/pt-course-design-2026-09-18.md §3). Use clozeLit instead.`,
      );
    }
  }
}

export function makeAssembler({ moduleId }) {
  // PT modules are named "mN" like ES/FR, with one narrow escape hatch for
  // a throwaway smoke fixture (`_smoke`) used to prove the compiler end to
  // end without committing real content under an "mN" name it doesn't own.
  if (!/^(m\d+|_smoke)$/.test(moduleId)) {
    throw new Error(`makeAssembler: bad moduleId "${moduleId}"`);
  }

  /**
   * A build tile that is ALSO an answer token oversupplies that token, and
   * `buildTileFloor` fails the whole suite for it — correctly: the learner is
   * handed two of the same tile and only one slot. Emitting it is an
   * authoring mistake, so this throws at compile time rather than shipping a
   * step that cannot be assembled as intended.
   */
  function checkDistractors(id, pt, distractors) {
    const answer = new Set(words(pt).map(lower1));
    const collide = distractors.filter((d) => answer.has(lower1(d)));
    if (collide.length) {
      throw new Error(
        `${id}: distractor tile(s) ${collide.join(", ")} already appear in the answer "${bare(pt)}"`,
      );
    }
    return distractors;
  }

  /** Mirror of buildAcceptance.ts coverWithTiles: lay the sentence out as
   *  whole tiles (multi-word tiles allowed), each used at most as often as
   *  the bank holds it; punctuation-fused tiles stay at their edge. */
  function coverWithTiles(sentence, tiles, normFn) {
    const words = sentence.split(" ").filter(Boolean);
    const kinds = new Map();
    for (const t of tiles) {
      const n = normFn(t);
      const k = kinds.get(n);
      if (k) k.count++;
      else kinds.set(n, { words: n.split(" "), opens: /^[¿¡]/.test(t), closes: /[?!.]$/.test(t), count: 1 });
    }
    const cands = [...kinds.values()].sort((a, b) => b.words.length - a.words.length);
    let edge = null;
    const rec = (i) => {
      if (i === words.length) return true;
      for (const c of cands) {
        if (c.count === 0 || c.words.some((w, j) => words[i + j] !== w)) continue;
        if ((c.opens && i !== 0) || (c.closes && i + c.words.length !== words.length)) { edge = `moves the punctuated tile «${c.words.join(" ")}» off its edge`; continue; }
        c.count--; if (rec(i + c.words.length)) return true; c.count++;
      }
      return false;
    };
    return rec(0) ? null : (edge ?? "cannot be laid out from the bank's tiles");
  }

  function checkAlso(id, pt, distractors, also) {
    if (!Array.isArray(also)) throw new Error(`${id}: also must be a list`);
    if (also.length > 3) throw new Error(`${id}: also lists ${also.length} alternates > max 3`);
    const norm = (s) => bare(s).toLowerCase().replace(/[¿¡]/g, "").replace(/[.!?,;:]+/g, "").replace(/\s+/g, " ").trim();
    const exact = norm(pt);
    const tiles = [...tileWords(pt), ...distractors];
    const seen = new Set();
    for (const alt of also) {
      const n = norm(alt);
      if (n === exact) throw new Error(`${id}: also «${alt}» is the answer itself`);
      if (seen.has(n)) throw new Error(`${id}: also «${alt}» listed twice`);
      seen.add(n);
      const why = coverWithTiles(n, tiles, norm);
      if (why) throw new Error(`${id}: also «${alt}» ${why}`);
    }
    return also.map((a) => lower1(bare(a)));
  }

  const S = {
    info: (id, title, body, variant = "grammar") =>
      `    infoStep(\n      ${q(id)},\n      ${q(title)},\n      ${q(body)},\n      ${q(variant)},\n    ),`,

    phrase: (id, meaning, text, emoji) =>
      emoji
        ? `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}, undefined, { emoji: ${q(emoji)} }),`
        : `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}),`,

    textMcq: (id, target, distractors, prompt) =>
      `    vocabTextMcq(${q(id)}, ${q(target)}, [${distractors.map(q).join(", ")}]${prompt ? `, ${q(prompt)}` : ""}),`,

    mcq: (id, prompt, correct, distractors, why, atoms) =>
      `    sentenceMcq({\n      id: ${q(id)},\n      prompt: ${q(prompt)},\n      correctText: ${q(correct)},\n      distractorsText: [${distractors.map(q).join(", ")}],\n      explanation: ${q(why)},\n      exercisedAtomSurfaces: [${atoms.map(q).join(", ")}],\n    }),`,

    match: (id, surfaces) => `    matchPairs(${q(id)}, [${surfaces.map(q).join(", ")}]),`,

    reviewMatch: (id, seed) => `    reviewMatchPairs(${q(id)}, ${q(seed)}, ${q(moduleId)}, 6),`,

    capstoneMatch: (id, entries) =>
      `    capstoneMatchPairs(${q(id)}, [\n${entries.map((e) => `      { surface: ${q(e.surface)}, gloss: ${q(e.gloss)} },`).join("\n")}\n    ]),`,

    selfExplain: (o) =>
      `    selfExplain({\n      id: ${q(o.id)},\n      anchorLabel: ${q(o.anchorLabel)},\n      anchorAudioText: ${q(o.anchorAudioText)},\n      question: ${q(o.question)},\n      rule: { text: ${q(o.rule)} },\n      surface: { text: ${q(o.surface)} },\n      distractor: { text: ${q(o.distractor)} },\n      ruleExplanation: ${q(o.ruleExplanation)},\n    }),`,

    // ── LITERAL beats — the whole PT vocabulary (no frame, no pool) ──────
    // A *Lit beat carries its Portuguese and English literally in the IR
    // and names its exercised atoms explicitly. Same emitted factories,
    // same downstream gates; only the source of the sentence differs.

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
      requireLit(id, o, ["pt", "en"]);
      requireAtoms(id, o);
      checkNoContractionTiles("buildLit", id, [...tileWords(o.pt), ...(o.tiles ?? [])]);
      checkDistractors(id, o.pt, o.tiles ?? []);
      // `also:` — vetted alternative sentences (max 3), each buildable from
      // the bank. Absent = exact grading; nothing is emitted.
      const also = checkAlso(id, o.pt, o.tiles ?? [], o.also ?? []);
      const alsoArg = also.length ? `,\n      [${also.map(q).join(", ")}]` : "";
      return `    build(\n      ${q(id)},\n      ${q(`Build: '${bare(o.en)}'`)},\n      ${q(lower1(bare(o.pt)))},\n      [${[...tileWords(o.pt), ...(o.tiles ?? [])].map(q).join(", ")}],\n      [${tileWords(o.pt).map(q).join(", ")}],\n      [${o.atoms.map(q).join(", ")}]${alsoArg},\n    ),`;
    },

    translateLit: (id, o) => {
      requireLit(id, o, ["pt", "en"]);
      requireAtoms(id, o);
      return `    translateStep({\n      id: ${q(id)},\n      promptEn: ${q(bare(o.en))},\n      acceptedAnswers: [${accepted(o.pt).map(q).join(", ")}],\n      audioText: ${q(lower1(bare(o.pt)))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    speakLit: (id, o) => {
      requireLit(id, o, ["pt", "en"]);
      requireAtoms(id, o);
      if (o.cue !== undefined && o.cue !== "recall") {
        throw new Error(`speakLit(${id}): cue must be "recall" when present, got "${o.cue}"`);
      }
      // cue:"recall" = §13.9 law 3 (cued-recall speaking). The recall-law
      // lint in the module test — never a recall before a printed voicing —
      // owns the ordering; this emitter only carries the flag.
      return `    speaking(${q(id)}, ${q(lower1(bare(o.pt)))}, ${q(bare(o.en))}, [${o.atoms.map(q).join(", ")}]${o.cue ? `, ${q(o.cue)}` : ""}),`;
    },

    listenCompLit: (id, o) => {
      requireLit(id, o, ["pt", "en", "distractorsEn"]);
      requireAtoms(id, o);
      const d = o.distractorsEn;
      if (!Array.isArray(d) || d.length !== 3 || new Set(d).size !== 3 || d.includes(o.en)) {
        throw new Error(
          `listenCompLit(${id}): needs exactly 3 distinct English distractors, none equal to the answer`,
        );
      }
      return `    listeningCompSentence({\n      id: ${q(id)},\n      audioText: ${q(lower1(bare(o.pt)))},\n      correctMeaningEn: ${q(bare(o.en))},\n      distractorsEn: [${d.map((x) => q(bare(x))).join(", ")}],\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    listenBuildLit: (id, o) => {
      requireLit(id, o, ["pt", "en"]);
      requireAtoms(id, o);
      checkNoContractionTiles("listenBuildLit", id, [...tileWords(o.pt), ...(o.tiles ?? [])]);
      checkDistractors(id, o.pt, o.tiles ?? []);
      return `    listeningBuildSentence({\n      id: ${q(id)},\n      target: ${q(lower1(bare(o.pt)))},\n      tiles: [${[...tileWords(o.pt), ...(o.tiles ?? [])].map(q).join(", ")}],\n      correctOrder: [${tileWords(o.pt).map(q).join(", ")}],\n      promptEn: ${q(bare(o.en))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    /** A cloze whose blank + options the author names. The blank must be a
     *  literal word of the sentence, the options must include it. This is
     *  also how every PT contraction is taught (design doc §3): a
     *  contraction is a `clozeLit` blank, never a `buildLit`/`listenBuildLit`
     *  tile. */
    clozeLit: (id, o) => {
      requireLit(id, o, ["pt", "en", "blank", "options"]);
      requireAtoms(id, o);
      const w = words(o.pt);
      const i = w.indexOf(o.blank);
      if (i === -1) {
        throw new Error(`clozeLit(${id}): "${o.blank}" is not a word of "${o.pt}"`);
      }
      if (!o.options.includes(o.blank)) {
        throw new Error(`clozeLit(${id}): options must include the blanked word "${o.blank}"`);
      }
      if (new Set(o.options).size !== o.options.length) {
        throw new Error(`clozeLit(${id}): duplicate options`);
      }
      const before = w.slice(0, i).join(" ") + (i > 0 ? " " : "");
      const after = (i < w.length - 1 ? " " : "") + w.slice(i + 1).join(" ") + ".";
      return `    cloze(\n      ${q(id)},\n      ${q(before)},\n      ${q(after)},\n      ${q(o.blank)},\n      [${o.options.map(q).join(", ")}],\n      ${q(bare(o.en))},\n      ${q(lower1(bare(o.pt)))},\n      ${q(o.why ?? "")},\n      [${o.atoms.map(q).join(", ")}],\n    ),`;
    },

    // ── §13 beats — carried over unchanged from ES (all string-literal, ──
    // no frame/pool involvement in the ES version either). All strings are
    // carried VERBATIM (no case/punctuation munging — sims and maps are
    // authored surfaces, not derived sentences).

    /**
     * Literal dialogue_sim. The compile-time checks are the §13.6
     * self-cueing law's machine-checkable clauses:
     *   - an option that MIRRORS the NPC line may only be correct/alsoCorrect
     *     (the natural-answer trap)
     *   - goal lines stay ≤8 words (goal-as-narration reads like a pretest)
     *   - a turn marked debut keeps exactly ONE right reply (the
     *     both-correct dodge lets a debut be dodged forever)
     *   - build-mode replies: answer + every alsoAccepted must be
     *     composable from the tiles
     */
    simLit: (id, o) => {
      requireLit(id, o, ["scene", "turns"]);
      if (!o.scene.emoji || !o.scene.title) {
        throw new Error(`simLit(${id}): scene needs emoji + title`);
      }
      const norm = (s) =>
        String(s).toLowerCase().replace(/[¿¡?!.,«»]/g, "").trim();
      for (const t of o.turns) {
        requireLit(`${id}.${t.id ?? "?"}`, t, ["id", "npc", "goal", "reply"]);
        requireLit(`${id}.${t.id}.npc`, t.npc, ["speaker", "pt", "gloss"]);
        const goalWords = t.goal.trim().split(/\s+/).length;
        if (goalWords > 8) {
          throw new Error(
            `simLit(${id}.${t.id}): goal line is ${goalWords} words (max 8): "${t.goal}"`,
          );
        }
        const r = t.reply;
        if (r.mode === "choice") {
          requireLit(`${id}.${t.id}.reply`, r, ["options", "correctOptionId"]);
          if (!r.options.some((op) => op.id === r.correctOptionId)) {
            throw new Error(
              `simLit(${id}.${t.id}): correctOptionId "${r.correctOptionId}" is not an option`,
            );
          }
          const rightIds = new Set([r.correctOptionId, ...(r.alsoCorrectOptionIds ?? [])]);
          for (const op of r.options) {
            if (norm(op.text) === norm(t.npc.pt) && !rightIds.has(op.id)) {
              throw new Error(
                `simLit(${id}.${t.id}): option "${op.text}" mirrors the NPC line but is ` +
                  `marked wrong — the natural-answer trap (§13.6 failure mode 1)`,
              );
            }
          }
          if (t.debut && (r.alsoCorrectOptionIds ?? []).length > 0) {
            throw new Error(
              `simLit(${id}.${t.id}): a DEBUT turn keeps exactly one right reply ` +
                `(§13.6 failure mode 4 — the both-correct dodge)`,
            );
          }
        } else if (r.mode === "build") {
          requireLit(`${id}.${t.id}.reply`, r, ["tiles", "answer"]);
          const bank = new Map();
          for (const tile of r.tiles) bank.set(tile, (bank.get(tile) ?? 0) + 1);
          for (const ans of [r.answer, ...(r.alsoAccepted ?? [])]) {
            const need = new Map();
            for (const wd of ans.split(/\s+/)) need.set(wd, (need.get(wd) ?? 0) + 1);
            for (const [wd, n] of need) {
              if ((bank.get(wd) ?? 0) < n) {
                throw new Error(
                  `simLit(${id}.${t.id}): accepted reply "${ans}" needs tile "${wd}" ` +
                    `×${n} but the bank has ${bank.get(wd) ?? 0}`,
                );
              }
            }
          }
        } else {
          throw new Error(`simLit(${id}.${t.id}): reply.mode must be "choice" or "build"`);
        }
      }
      const turnSrc = o.turns
        .map((t) => {
          const npc = [
            `            speaker: ${q(t.npc.speaker)},`,
            `            kana: ${q(t.npc.pt)},`,
            ...(t.npc.audioText ? [`            audioText: ${q(t.npc.audioText)},`] : []),
            `            gloss: ${q(t.npc.gloss)},`,
          ].join("\n");
          const r = t.reply;
          const reply =
            r.mode === "choice"
              ? [
                  `            mode: "choice",`,
                  `            options: [`,
                  ...r.options.map(
                    (op) => `              { id: ${q(op.id)}, text: ${q(op.text)} },`,
                  ),
                  `            ],`,
                  `            correctOptionId: ${q(r.correctOptionId)},`,
                  ...(r.alsoCorrectOptionIds?.length
                    ? [
                        `            alsoCorrectOptionIds: [${r.alsoCorrectOptionIds.map(q).join(", ")}],`,
                      ]
                    : []),
                  ...(r.audioText ? [`            audioText: ${q(r.audioText)},`] : []),
                ].join("\n")
              : [
                  `            mode: "build",`,
                  `            tiles: [${r.tiles.map(q).join(", ")}],`,
                  `            answer: ${q(r.answer)},`,
                  ...(r.alsoAccepted?.length
                    ? [`            alsoAccepted: [${r.alsoAccepted.map(q).join(", ")}],`]
                    : []),
                ].join("\n");
          return [
            `        {`,
            `          id: ${q(t.id)},`,
            `          npc: {`,
            npc,
            `          },`,
            `          goal: ${q(t.goal)},`,
            `          reply: {`,
            reply,
            `          },`,
            ...(t.replyGloss ? [`          replyGloss: ${q(t.replyGloss)},`] : []),
            ...(t.explanation ? [`          explanation: ${q(t.explanation)},`] : []),
            `        },`,
          ].join("\n");
        })
        .join("\n");
      return [
        `    {`,
        `      id: ${q(id)},`,
        `      type: "dialogue_sim",`,
        `      scene: { emoji: ${q(o.scene.emoji)}, title: ${q(o.scene.title)}${o.scene.setting ? `, setting: ${q(o.scene.setting)}` : ""} },`,
        `      exercisedAtomIds: [${(o.exposesAtoms ?? []).map(q).join(", ")}],`,
        `      turns: [`,
        turnSrc,
        `      ],`,
        `    },`,
      ].join("\n");
    },

    /**
     * Literal word_map — the §13.3 first-sentence-view beat. Checks: every
     * pair's tokenIndex exists, audioText present (the map autoplays its
     * sentence), tokenGenders keys in range.
     */
    mapLit: (id, o) => {
      requireLit(id, o, ["tokens", "pairs", "audioText"]);
      for (const p of o.pairs) {
        if (typeof p.tokenIndex !== "number" || p.tokenIndex < 0 || p.tokenIndex >= o.tokens.length) {
          throw new Error(
            `mapLit(${id}): pair "${p.en}" points at tokenIndex ${p.tokenIndex} ` +
              `but tokens has ${o.tokens.length} entries`,
          );
        }
      }
      for (const k of Object.keys(o.tokenGenders ?? {})) {
        if (Number(k) < 0 || Number(k) >= o.tokens.length) {
          throw new Error(`mapLit(${id}): tokenGenders[${k}] is out of range`);
        }
      }
      return [
        `    {`,
        `      id: ${q(id)},`,
        `      type: "word_map",`,
        `      tokens: [${o.tokens.map(q).join(", ")}],`,
        `      pairs: [`,
        ...o.pairs.map(
          (p) => `        { en: ${q(p.en)}, tokenIndex: ${p.tokenIndex} },`,
        ),
        `      ],`,
        `      audioText: ${q(o.audioText)},`,
        ...(o.revealNote ? [`      revealNote: ${q(o.revealNote)},`] : []),
        ...(o.tokenGenders
          ? [
              `      tokenGenders: { ${Object.entries(o.tokenGenders)
                .map(([k, v]) => `${k}: ${q(v)}`)
                .join(", ")} },`,
            ]
          : []),
        `    },`,
      ].join("\n");
    },

    /**
     * Audio-prompted word MCQ — the zero-reading retrieval beat. meaningEn =
     * the target surface is what flips WordImageMcqStepView into audio mode
     * ("Which word do you hear?"), so it is set here, never by the author.
     */
    audioWimcq: (id, o) => {
      requireLit(id, o, ["target", "distractors"]);
      requireLit(`${id}.target`, o.target, ["surface", "emoji"]);
      if (o.distractors.length < 2) {
        throw new Error(`audioWimcq(${id}): needs >= 2 distractors`);
      }
      for (const d of o.distractors) {
        requireLit(`${id}.distractor`, d, ["surface", "emoji"]);
        if (d.surface === o.target.surface) {
          throw new Error(`audioWimcq(${id}): distractor repeats the target`);
        }
      }
      const opts = [
        `        { id: "correct", word: ${q(o.target.surface)}, emoji: ${q(o.target.emoji)} },`,
        ...o.distractors.map(
          (d, i) => `        { id: ${q(`o${i + 1}`)}, word: ${q(d.surface)}, emoji: ${q(d.emoji)} },`,
        ),
      ];
      return [
        `    {`,
        `      id: ${q(id)},`,
        `      type: "word_image_mcq",`,
        `      meaningEn: ${q(o.target.surface)},`,
        `      options: [`,
        ...opts,
        `      ],`,
        `      correctOptionId: "correct",`,
        `    },`,
      ].join("\n");
    },

    /** Literal match_pairs with explicit source/target pairs (the closing
     *  match). ≥6 pairs — the house floor the m1/m2 closes all meet. */
    matchLit: (id, o) => {
      requireLit(id, o, ["pairs"]);
      if (o.pairs.length < 6) {
        throw new Error(`matchLit(${id}): ${o.pairs.length} pairs — the closing match floor is 6`);
      }
      return [
        `    {`,
        `      id: ${q(id)},`,
        `      type: "match_pairs",`,
        `      prompt: ${q(o.prompt ?? "Match them.")},`,
        `      pairs: [`,
        ...o.pairs.map(
          (p, i) => `        { id: ${q(`p${i + 1}`)}, source: ${q(p.source)}, target: ${q(p.target)} },`,
        ),
        `      ],`,
        `    },`,
      ].join("\n");
    },

    /**
     * Agreement cloze: segments alternate text and blanks whose fillers
     * agree together (o/a articles, -ão plural class, etc. — design doc §3).
     * IR shape:
     *   segments: [{text:"S"}, {blank:{id:"art", answer:"a",
     *              options:["a","o"]}}, {text:" casa é bonita"}, …]
     * Emits the agreementCloze factory (slot-rotates each blank itself).
     */
    agreementLit: (id, o) => {
      requireLit(id, o, ["segments", "en"]);
      requireAtoms(id, o);
      const hasBlank = o.segments.some((seg) => seg.blank);
      if (!hasBlank) throw new Error(`agreementLit(${id}): no blanks declared`);
      const segs = o.segments
        .map((seg) => {
          if (seg.text !== undefined) return `      { text: ${q(seg.text)} },`;
          const b = seg.blank;
          requireLit(`${id}.blank`, b, ["id", "answer", "options"]);
          if (!b.options.includes(b.answer)) {
            throw new Error(
              `agreementLit(${id}): blank "${b.id}" answer "${b.answer}" not in options`,
            );
          }
          return `      { blank: { id: ${q(b.id)}, correctAnswer: ${q(b.answer)}, options: [${b.options.map(q).join(", ")}] } },`;
        })
        .join("\n");
      return `    agreementCloze(\n      ${q(id)},\n      [\n${segs}\n      ],\n      ${q(bare(o.en))},\n      ${o.audioText ? q(o.audioText) : "undefined"},\n      [${o.atoms.map(q).join(", ")}],\n    ),`;
    },

    /**
     * Gender sort: sort BARE nouns onto their o/a buckets. Items carry
     * {surface, side: "o"|"a", meaningEn, note?}; ≤2 per module (the warm-up
     * game, not a drill). endingRule is the post-grade generalisation line.
     */
    genderSort: (id, o) => {
      requireLit(id, o, ["items"]);
      if (o.items.length < 4) {
        throw new Error(`genderSort(${id}): needs >= 4 items (got ${o.items.length})`);
      }
      for (const it of o.items) {
        requireLit(`${id}.item`, it, ["surface", "side", "meaningEn"]);
        if (it.side !== "o" && it.side !== "a") {
          throw new Error(`genderSort(${id}): item "${it.surface}" side must be "o" or "a"`);
        }
        if (/^(o|a|os|as|um|uma|uns|umas) /.test(it.surface)) {
          throw new Error(
            `genderSort(${id}): item "${it.surface}" carries its article — the article IS the answer, items stay bare`,
          );
        }
      }
      const items = o.items
        .map(
          (it, i) =>
            `        { id: ${q(`i${i + 1}`)}, surface: ${q(it.surface)}, bucketId: ${q(it.side)}, meaningEn: ${q(it.meaningEn)}${it.note ? `, note: ${q(it.note)}` : ""} },`,
        )
        .join("\n");
      return [
        `    {`,
        `      id: ${q(id)},`,
        `      type: "gender_sort",`,
        ...(o.prompt ? [`      prompt: ${q(o.prompt)},`] : []),
        `      buckets: [`,
        `        { id: "o", label: "o" },`,
        `        { id: "a", label: "a" },`,
        `      ],`,
        `      items: [`,
        items,
        `      ],`,
        ...(o.endingRule ? [`      endingRule: ${q(o.endingRule)},`] : []),
        `    },`,
      ].join("\n");
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
  };

  return { S, checkDistractors };
}

export { q, bare, lower1, accepted, words };
