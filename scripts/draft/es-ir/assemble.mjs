/**
 * es-ir/assemble.mjs — the step emitters, FRAME-PARAMETERIZED.
 *
 * This is `assemble-es-m17.mjs` with the module hard-coding taken out. That
 * file proved the shape by shipping m17; every function in it referred to
 * `es_m17` and the literal string "m17" directly, so it could author exactly
 * one module. Here the frame, the pool and the module id are arguments, which
 * is the whole difference between a script and a compiler.
 *
 *   const A = makeAssembler({ frame, pool, moduleId: "m18", tense: "preterite" });
 *   A.S.build("es-m18-1-b-a1", A.pick("tener", "yo"), ["tuviste"]);
 *
 * WHAT DID NOT CHANGE, and must not: nothing emitted here is sampled. Every
 * Spanish string traces to `morph-es.mjs`, every English one to the frame's
 * own tables, and a form the pool failed to cover is FRAME-FILLED and reported
 * on stderr rather than silently substituted. A pipeline that quietly fills its
 * own gaps stops being measurable, which is the one property that made the m17
 * wave auditable at all.
 */
import { conjugate } from "../morph-es.mjs";

const q = (s) => JSON.stringify(s);
const bare = (s) => s.replace(/\.$/, "");
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const deaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const words = (es) => bare(es).split(" ");
/** Tiles keep the sentence's own casing except the sentence-initial capital —
 *  a mid-sentence capital is a proper name («el esposo de Ana»), and a tile
 *  reading "ana" against a target of "Ana" is the compiler's fault, not the
 *  author's. Blanket lower1 over every word did exactly that (found in m5). */
const tileWords = (es) => words(es).map((w, i) => (i === 0 ? lower1(w) : w));

/** translate accepts the sentence with and without accents, capitalised or
 *  not. The ES engine's accent policy is accept-but-flag; a learner on a US
 *  keyboard must never be graded wrong for a missing á. */
const accepted = (es) =>
  [...new Set([lower1(bare(es)), bare(es), deaccent(lower1(bare(es))), deaccent(bare(es))])];

const PERSONS = ["yo", "tu", "el", "nosotros", "ustedes"];

/** A literal beat missing a field fails by NAME at compile time — the
 *  frameless pipeline has no draft pool to blame, so the IR is the only
 *  place the omission can live. */
function requireLit(id, o, fields) {
  for (const f of fields) {
    const v = o?.[f];
    const missing = v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
    if (missing) throw new Error(`${id}: literal beat is missing "${f}"`);
  }
}


/** atoms must be DECLARED on every literal beat, but [] is legal — the
 *  m1/m2 convention for a step that credits nothing (cross-module tails). */
function requireAtoms(id, o) {
  if (!Array.isArray(o.atoms)) {
    throw new Error(`${id}: atoms must be an array (use [] to credit nothing)`);
  }
}

const PERSON_LABEL = { yo: "yo", tu: "tú", el: "él/ella", nosotros: "nosotros", ustedes: "ustedes" };

export function makeAssembler({ frame, pool, moduleId, tense = "preterite" }) {
  // frame === null is the PHRASE-MODULE mode (m1-class content: greetings,
  // numbers, fixed expressions — no verbs, so no frame, no drafted pool).
  // Every drafted emitter still exists but pick() refuses, so an IR that
  // tries a draw in a frameless module fails by name instead of by crash.
  if (frame === undefined) throw new Error("makeAssembler: no frame");
  if (!Array.isArray(pool)) throw new Error("makeAssembler: pool must be an array of picks");
  if (frame === null && pool.length > 0) {
    throw new Error("makeAssembler: a frameless module cannot carry a drafted pool");
  }
  if (!/^m\d+$/.test(moduleId)) throw new Error(`makeAssembler: bad moduleId "${moduleId}"`);

  const frameFilled = [];
  const used = new Set();

  /** A drafted sentence for this exact (verb, person), never reused, preferring
   *  the richest one available (object + time marker). */
  function pick(verb, person, want = {}) {
    if (frame === null) {
      throw new Error(
        `pick(${verb}.${person}): ${moduleId} is a frameless (phrase) module — ` +
          "use the *Lit step kinds (buildLit/translateLit/speakLit/listenCompLit/" +
          "listenBuildLit/clozeLit), which carry their sentences literally",
      );
    }
    const score = (p) => (p.object ? 1 : 0) + (p.time ? 1 : 0);
    const cands = pool
      .filter((p) => p.verb === verb && p.person === person && !used.has(p.es))
      .filter((p) => (want.object === undefined ? true : Boolean(p.object) === want.object))
      .filter((p) => (want.time === undefined ? true : Boolean(p.time) === want.time))
      .filter((p) => (want.timeIs === undefined ? true : p.time === want.timeIs))
      // `tenseIs` is what an aspect-contrast module actually wants. Pinning
      // `timeIs` on every draw says "use «siempre» here", which is a claim
      // about the marker; the author's real claim is "this step must be
      // imperfect" and any habitual marker will do. m19's first compile pinned
      // markers everywhere and frame-filled 65 of 65 cells — the pool was
      // fully drafted and then fully ignored, because an exact-marker filter
      // almost never matches a 115-sentence pool.
      .filter((p) => (want.tenseIs === undefined ? true : p.tense === want.tenseIs))
      .filter((p) => (want.objectIs === undefined ? true : p.object === want.objectIs))
      .sort((a, b) => score(b) - score(a));
    if (cands.length) {
      used.add(cands[0].es);
      return cands[0];
    }
    const objs = frame.objectsByVerb?.[verb] ?? [];
    const object = want.object === false ? null : (want.objectIs ?? objs[0] ?? null);

    /**
     * The frame owns rules the fallback cannot see. m18's is the durative one:
     * «tener» names a state, so «tuve un perro ayer» is grammatical and means
     * nothing a person would say, and the frame throws on it. An earlier
     * version of this fallback took `frame.time[0]` unconditionally and died on
     * the first such cell.
     *
     * So it SEARCHES the frame's own legal space instead of guessing once —
     * every declared marker in order, then no marker at all. Nothing is
     * invented: each candidate is a sentence the frame itself agreed to build.
     * If the author pinned a marker with `timeIs`, that is a judgment call and
     * the rejection is allowed to surface.
     */
    const legalTimes = (frame.time ?? [])
      .map((t) => t.es)
      .filter((t) => want.tenseIs === undefined || frame.tenseFor?.(t) === want.tenseIs);
    const times =
      want.timeIs !== undefined
        ? [want.timeIs]
        : want.time === false
          ? [null]
          : // A tense-pinned draw may not fall through to "no marker at all":
            // in m19 a sentence without one has no aspect, which is the whole
            // thing the step is testing.
            [...legalTimes, ...(want.tenseIs === undefined ? [null] : [])];

    let built = null;
    let firstError = null;
    for (const time of times) {
      try {
        built = frame.build({ person, verb, object, time });
        break;
      } catch (e) {
        firstError ??= e;
      }
    }
    if (!built) throw firstError ?? new Error(`frame cannot build ${verb}.${person}`);

    frameFilled.push(`${verb}.${person}`);
    used.add(built.es);
    return built;
  }

  /**
   * A build tile that is ALSO an answer token oversupplies that token, and
   * `buildTileFloor` fails the whole suite for it — correctly: the learner is
   * handed two «escribimos» tiles and only one slot. Emitting it is an authoring
   * mistake, so this throws at compile time rather than shipping a step that
   * cannot be assembled as intended.
   */
  function checkDistractors(id, es, distractors) {
    const answer = new Set(words(es).map(lower1));
    const collide = distractors.filter((d) => answer.has(lower1(d)));
    if (collide.length) {
      throw new Error(
        `${id}: distractor tile(s) ${collide.join(", ")} already appear in the answer "${bare(es)}"`,
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

  function checkAlso(id, es, distractors, also) {
    if (!Array.isArray(also)) throw new Error(`${id}: also must be a list`);
    if (also.length > 3) throw new Error(`${id}: also lists ${also.length} alternates > max 3`);
    const norm = (s) => bare(s).toLowerCase().replace(/[¿¡]/g, "").replace(/[.!?,;:]+/g, "").replace(/\s+/g, " ").trim();
    const exact = norm(es);
    const tiles = [...tileWords(es), ...distractors];
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

  /** Atom surfaces a sentence exercises: its conjugated verb, its object noun,
   *  and its time marker. */
  const exercised = (p) => [p.conj, p.object, p.time].filter(Boolean);

  /**
   * Distractors for a listening step: the SAME event with exactly one thing
   * moved — the person, the object, or the time. Three unrelated sentences
   * would let a learner pass by spotting one content word; these force an
   * actual parse. Built through `frame.build`, so a distractor is never
   * ungrammatical English.
   */
  function listeningDistractors(p) {
    const cands = [];
    const push = (o) => {
      try {
        const en = frame.build({ ...p, ...o }).en;
        if (en !== p.en && !cands.includes(en)) cands.push(en);
      } catch {
        /* an unbuildable variant is simply not a candidate */
      }
    };
    const persons = PERSONS.filter((x) => x !== p.person);
    const objs = (frame.objectsByVerb?.[p.verb] ?? []).filter((o) => o !== p.object);
    const times = (frame.time ?? []).map((t) => t.es).filter((t) => t !== p.time);

    for (const person of persons) push({ person });
    for (const object of objs.slice(0, 3)) push({ object });
    for (const time of times.slice(0, 3)) push({ time });
    for (const person of persons) for (const time of times.slice(0, 2)) push({ person, time });

    if (cands.length < 3) {
      throw new Error(
        `listeningDistractors: only ${cands.length} for "${p.es}" — the frame has no third neighbour`,
      );
    }
    const step = Math.max(1, Math.floor(cands.length / 3));
    return [cands[0], cands[step] ?? cands[1], cands[step * 2] ?? cands[2]];
  }

  /**
   * Wrong-form distractors for "pick the <tense>". Every one is a REAL form of
   * the SAME verb: the present of the same person (which for -ar yo/él is the
   * accent minimal pair hablo/habló), another person's form in the same tense,
   * and the infinitive. A distractor the learner could plausibly have produced
   * beats a distractor that is merely wrong.
   */
  function formDistractors(verb, person) {
    // A frame may own this. The default below builds distractors WITHIN one
    // tense, which is right for a module that teaches a paradigm — but wrong
    // for one that teaches a CONTRAST, where the plausible wrong answer is the
    // same person in the other aspect and the default cannot produce it.
    // m19's «hablaba» must be able to sit against «hablé»; nothing else in a
    // four-option cloze is a real competitor.
    if (frame.formDistractors) {
      const given = frame.formDistractors(verb, person, { conjugate, tense, PERSONS });
      const right0 = conjugate(verb, person, tense);
      if (!Array.isArray(given) || given.length < 3) {
        throw new Error(`${frame.id}.formDistractors(${verb}.${person}) returned < 3`);
      }
      if (given.includes(right0)) {
        throw new Error(
          `${frame.id}.formDistractors(${verb}.${person}) includes the answer "${right0}"`,
        );
      }
      if (new Set(given).size !== given.length) {
        throw new Error(`${frame.id}.formDistractors(${verb}.${person}) has duplicates`);
      }
      return given.slice(0, 3);
    }
    const right = conjugate(verb, person, tense);
    const others = PERSONS.filter((x) => x !== person);
    const set = new Set([
      conjugate(verb, person, "present"),
      conjugate(verb, others[0], tense),
      verb,
    ]);
    set.delete(right);
    const out = [...set];
    for (const fallbackTense of [tense, "imperfect", "present"]) {
      for (const o of others) {
        if (out.length >= 3) break;
        const f = conjugate(verb, o, fallbackTense);
        if (f !== right && !out.includes(f)) out.push(f);
      }
    }
    if (out.length < 3) {
      throw new Error(`formDistractors: only ${out.length} for ${verb}.${person}`);
    }
    return out.slice(0, 3);
  }

  const S = {
    info: (id, title, body, variant = "grammar") =>
      `    infoStep(\n      ${q(id)},\n      ${q(title)},\n      ${q(body)},\n      ${q(variant)},\n    ),`,

    phrase: (id, meaning, text, emoji) =>
      emoji
        ? `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}, undefined, { emoji: ${q(emoji)} }),`
        : `    vocab(${q(id)}, ${q(meaning)}, ${q(text)}),`,

    formMcq: (id, verb, person, why) => {
      const right = conjugate(verb, person, tense);
      const [d1, d2, d3] = formDistractors(verb, person);
      return `    sentenceMcq({\n      id: ${q(id)},\n      prompt: ${q(`Pick the ${PERSON_LABEL[person]} ${tense} of ${verb}.`)},\n      correctText: ${q(right)},\n      distractorsText: [${q(d1)}, ${q(d2)}, ${q(d3)}],\n      explanation: ${q(why)},\n      exercisedAtomSurfaces: [${q(right)}],\n    }),`;
    },

    build: (id, p, distractors) =>
      (checkDistractors(id, p.es, distractors),
      `    build(\n      ${q(id)},\n      ${q(`Build: '${p.en.replace(/\.$/, "")}'`)},\n      ${q(bare(p.es).toLowerCase() === bare(p.es) ? bare(p.es) : lower1(bare(p.es)))},\n      [${[...words(p.es).map(lower1), ...distractors].map(q).join(", ")}],\n      [${words(p.es).map(lower1).map(q).join(", ")}],\n      [${exercised(p).map(q).join(", ")}],\n    ),`),

    translate: (id, p) =>
      `    translateStep({\n      id: ${q(id)},\n      promptEn: ${q(p.en)},\n      acceptedAnswers: [${accepted(p.es).map(q).join(", ")}],\n      audioText: ${q(lower1(bare(p.es)))},\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`,

    speaking: (id, p) =>
      `    speaking(${q(id)}, ${q(lower1(bare(p.es)))}, ${q(bare(p.en))}, [${exercised(p).map(q).join(", ")}]),`,

    cloze: (id, p, why) => {
      const w = words(p.es);
      const i = w.indexOf(p.conj);
      if (i === -1) {
        throw new Error(`cloze(${id}): "${p.conj}" is not a word of "${p.es}" — cannot blank it`);
      }
      const before = w.slice(0, i).join(" ") + (i > 0 ? " " : "");
      const after = (i < w.length - 1 ? " " : "") + w.slice(i + 1).join(" ") + ".";
      const [d1, d2, d3] = formDistractors(p.verb, p.person);
      return `    cloze(\n      ${q(id)},\n      ${q(before)},\n      ${q(after)},\n      ${q(p.conj)},\n      [${[p.conj, d1, d2, d3].map(q).join(", ")}],\n      ${q(bare(p.en))},\n      ${q(lower1(bare(p.es)))},\n      ${q(why)},\n      [${exercised(p).map(q).join(", ")}],\n    ),`;
    },

    listenComp: (id, p) => {
      const [d1, d2, d3] = listeningDistractors(p);
      return `    listeningCompSentence({\n      id: ${q(id)},\n      audioText: ${q(lower1(bare(p.es)))},\n      correctMeaningEn: ${q(bare(p.en))},\n      distractorsEn: [${q(bare(d1))}, ${q(bare(d2))}, ${q(bare(d3))}],\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`;
    },

    listenBuild: (id, p, distractors) =>
      (checkDistractors(id, p.es, distractors),
      `    listeningBuildSentence({\n      id: ${q(id)},\n      target: ${q(lower1(bare(p.es)))},\n      tiles: [${[...words(p.es).map(lower1), ...distractors].map(q).join(", ")}],\n      correctOrder: [${words(p.es).map(lower1).map(q).join(", ")}],\n      promptEn: ${q(bare(p.en))},\n      exercisedAtomSurfaces: [${exercised(p).map(q).join(", ")}],\n    }),`),

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

    // ── LITERAL beats — the phrase-module (frameless) vocabulary ──────────
    // A *Lit beat carries its Spanish and English literally in the IR and
    // names its exercised atoms explicitly, because a fixed phrase has no
    // (verb, person) cell to derive either from. Same emitted factories,
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
      requireLit(id, o, ["es", "en"]);
      requireAtoms(id, o);
      checkDistractors(id, o.es, o.tiles ?? []);
      // `also:` — vetted alternative sentences (max 3), each buildable from
      // the bank. Absent = exact grading; nothing is emitted. Mirrors
      // lintAlsoAccepted in buildAcceptance.ts so the compile fails where
      // the test would.
      const also = checkAlso(id, o.es, o.tiles ?? [], o.also ?? []);
      const alsoArg = also.length ? `,\n      [${also.map(q).join(", ")}]` : "";
      return `    build(\n      ${q(id)},\n      ${q(`Build: '${bare(o.en)}'`)},\n      ${q(lower1(bare(o.es)))},\n      [${[...tileWords(o.es), ...(o.tiles ?? [])].map(q).join(", ")}],\n      [${tileWords(o.es).map(q).join(", ")}],\n      [${o.atoms.map(q).join(", ")}]${alsoArg},\n    ),`;
    },

    translateLit: (id, o) => {
      requireLit(id, o, ["es", "en"]);
      requireAtoms(id, o);
      return `    translateStep({\n      id: ${q(id)},\n      promptEn: ${q(bare(o.en))},\n      acceptedAnswers: [${accepted(o.es).map(q).join(", ")}],\n      audioText: ${q(lower1(bare(o.es)))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    speakLit: (id, o) => {
      requireLit(id, o, ["es", "en"]);
      requireAtoms(id, o);
      if (o.cue !== undefined && o.cue !== "recall") {
        throw new Error(`speakLit(${id}): cue must be "recall" when present, got "${o.cue}"`);
      }
      // cue:"recall" = §13.9 law 3 (cued-recall speaking). The recall-law
      // lint in the module test — never a recall before a printed voicing —
      // owns the ordering; this emitter only carries the flag.
      return `    speaking(${q(id)}, ${q(lower1(bare(o.es)))}, ${q(bare(o.en))}, [${o.atoms.map(q).join(", ")}]${o.cue ? `, ${q(o.cue)}` : ""}),`;
    },

    listenCompLit: (id, o) => {
      requireLit(id, o, ["es", "en", "distractorsEn"]);
      requireAtoms(id, o);
      const d = o.distractorsEn;
      if (!Array.isArray(d) || d.length !== 3 || new Set(d).size !== 3 || d.includes(o.en)) {
        throw new Error(
          `listenCompLit(${id}): needs exactly 3 distinct English distractors, none equal to the answer`,
        );
      }
      return `    listeningCompSentence({\n      id: ${q(id)},\n      audioText: ${q(lower1(bare(o.es)))},\n      correctMeaningEn: ${q(bare(o.en))},\n      distractorsEn: [${d.map((x) => q(bare(x))).join(", ")}],\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    listenBuildLit: (id, o) => {
      requireLit(id, o, ["es", "en"]);
      requireAtoms(id, o);
      checkDistractors(id, o.es, o.tiles ?? []);
      return `    listeningBuildSentence({\n      id: ${q(id)},\n      target: ${q(lower1(bare(o.es)))},\n      tiles: [${[...tileWords(o.es), ...(o.tiles ?? [])].map(q).join(", ")}],\n      correctOrder: [${tileWords(o.es).map(q).join(", ")}],\n      promptEn: ${q(bare(o.en))},\n      exercisedAtomSurfaces: [${o.atoms.map(q).join(", ")}],\n    }),`;
    },

    /** A cloze whose blank + options the author names. The blank must be a
     *  literal word of the sentence, the options must include it, and E2
     *  (intro-only) is left to the module bar gates, which know the atoms. */
    clozeLit: (id, o) => {
      requireLit(id, o, ["es", "en", "blank", "options"]);
      requireAtoms(id, o);
      const w = words(o.es);
      const i = w.indexOf(o.blank);
      if (i === -1) {
        throw new Error(`clozeLit(${id}): "${o.blank}" is not a word of "${o.es}"`);
      }
      if (!o.options.includes(o.blank)) {
        throw new Error(`clozeLit(${id}): options must include the blanked word "${o.blank}"`);
      }
      if (new Set(o.options).size !== o.options.length) {
        throw new Error(`clozeLit(${id}): duplicate options`);
      }
      const before = w.slice(0, i).join(" ") + (i > 0 ? " " : "");
      const after = (i < w.length - 1 ? " " : "") + w.slice(i + 1).join(" ") + ".";
      return `    cloze(\n      ${q(id)},\n      ${q(before)},\n      ${q(after)},\n      ${q(o.blank)},\n      [${o.options.map(q).join(", ")}],\n      ${q(bare(o.en))},\n      ${q(lower1(bare(o.es)))},\n      ${q(o.why ?? "")},\n      [${o.atoms.map(q).join(", ")}],\n    ),`;
    },

    // ── §13 beats (2026-08-24 wave) — the step kinds the hand-authored ──
    // m1/m2 wrote as literals, now emittable from IR so m3+ can be authored
    // the normal way. All strings are carried VERBATIM (no case/punctuation
    // munging — sims and maps are authored surfaces, not derived sentences).
    // Render-level seeded shuffle owns option order (2026-08-24 fix), so
    // emitters write correct-first for readability, like the hand files.

    /**
     * Literal dialogue_sim. The compile-time checks are the §13.6
     * self-cueing law's machine-checkable clauses (each one is a named
     * failure mode from Spencer's 2026-08-20 walk):
     *   - an option that MIRRORS the NPC line may only be correct/alsoCorrect
     *     (the natural-answer trap: hola → hola marked wrong)
     *   - goal lines stay ≤8 words (goal-as-narration reads like a pretest)
     *   - a turn marked debut keeps exactly ONE right reply (the
     *     both-correct dodge lets a debut be dodged forever)
     *   - build-mode replies: answer + every alsoAccepted must be
     *     composable from the tiles (max-acceptance is only honest if the
     *     bank can actually build what it accepts)
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
        requireLit(`${id}.${t.id}.npc`, t.npc, ["speaker", "es", "gloss"]);
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
            if (norm(op.text) === norm(t.npc.es) && !rightIds.has(op.id)) {
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
            `            kana: ${q(t.npc.es)},`,
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
     * Audio-prompted word MCQ — the zero-reading retrieval beat (§13.5
     * companion rule). meaningEn = the target surface is what flips
     * WordImageMcqStepView into audio mode ("Which word do you hear?"),
     * so it is set here, never by the author.
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
     * Agreement cloze (m6+): segments alternate text and blanks whose
     * fillers agree together. IR shape:
     *   segments: [{text:"L"}, {blank:{id:"art", answer:"a",
     *              options:["a","o"]}}, {text:" cas"}, …]
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
     * Gender sort (m6+): sort BARE nouns onto their la/el buckets. Items
     * carry {surface, side: "el"|"la", meaningEn, note?}; ≤2 per module
     * (the warm-up game, not a drill). endingRule is the post-grade
     * generalisation line.
     */
    genderSort: (id, o) => {
      requireLit(id, o, ["items"]);
      if (o.items.length < 4) {
        throw new Error(`genderSort(${id}): needs >= 4 items (got ${o.items.length})`);
      }
      for (const it of o.items) {
        requireLit(`${id}.item`, it, ["surface", "side", "meaningEn"]);
        if (it.side !== "el" && it.side !== "la") {
          throw new Error(`genderSort(${id}): item "${it.surface}" side must be "el" or "la"`);
        }
        if (/^(el|la|un|una|los|las) /.test(it.surface)) {
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
        `        { id: "el", label: "el" },`,
        `        { id: "la", label: "la" },`,
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

  return {
    pick,
    S,
    frameFilled,
    exercised,
    formDistractors,
    listeningDistractors,
    checkDistractors,
    conjugateIn: (verb, person) => conjugate(verb, person, tense),
  };
}

export { q, bare, lower1, accepted, words, PERSONS, PERSON_LABEL };
