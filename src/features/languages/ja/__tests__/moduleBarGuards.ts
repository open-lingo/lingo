/**
 * Reusable per-module authoring-bar guards (2026-07-20).
 *
 * Everything the m3-neo pilot walk turned into pinned invariants, as ONE
 * registration call so every new module gets the full bar automatically
 * instead of relying on the next authoring agent to copy test files:
 *
 *  - density band + ≥12 lessons per module (invariant 15/25)
 *  - no two adjacent same-type steps; max 2 selection-taps in a row;
 *    ≥5 distinct types; close on a match grid (guide density bar)
 *  - no primary sentence surface used >3x per lesson (invariant 24)
 *  - production-framed prompts are never sentence MCQs (invariant 24)
 *  - vocab provenance: every non-prior word debuts on an intro-capable
 *    step, and no untracked multi-kana words exist (invariant 24)
 *  - persona canon: named characters never flip facts (invariant 21)
 *
 * Call from the module's test file:
 *   registerModuleBarGuards({ moduleLabel: "m4-neo", lessons: M4_NEO_LESSONS,
 *     priorModules: ["m1","m2","m3"], canon: COURSE_CANON, minLessons: 12 });
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
import { JA_COURSE_ATOMS, JA_COURSE_ATOMS_BY_KANA } from "../courseAtoms";
import { M3_M7_REVIEW_POOL } from "../grammarHelpers";
import { getRealFormLexicon } from "./moduleContentLints";
import {
  SELECTION_TYPES,
  INTRO_TYPES as ALL_INTRO_TYPES,
  kanaSurfaces,
  jaSurfaces,
} from "@/features/lesson/data/stepTaxonomy";

// SHARED with the compiler — see `lesson/data/stepTaxonomy.ts`. Never
// re-declare these here: the compiler places debuts against the same sets
// and the same kana projection this guard reads, and silent drift between
// the two is a debugging cycle every time.
const SELECTION = SELECTION_TYPES;
const INTRO_TYPES = ALL_INTRO_TYPES;

/** Course-wide persona canon — extend when a character gains a fact. */
export const COURSE_CANON: Record<string, Set<string>> = {
  トム: new Set(["がくせい", "アメリカじん", "ともだち"]),
  ミカ: new Set(["がくせい", "にほんじん", "ともだち"]),
  たなか: new Set(["せんせい"]),
  ケン: new Set(["がくせい", "にほんじん", "ともだち"]),
};

const STRUCTURAL = new Set([
  "だ", "です", "は", "も", "の", "トム", "ミカ", "ケン", "たなか",
  "、", "。", "？", "！",
]);

const jaStrings = kanaSurfaces;

/** A dedicated review lesson: `…-review` (single) or `…-review-2` (one of
 *  several — inv 25 ships three per module). */
export const isReviewLessonId = (id: string): boolean =>
  /-review(-\d+)?$/.test(id);

export function registerModuleBarGuards(opts: {
  moduleLabel: string;
  lessons: LessonContent[];
  /** Modules whose atoms count as already-known (e.g. ["m1","m2","m3"]). */
  priorModules: string[];
  canon?: Record<string, Set<string>>;
  /** Minimum lesson count (Spencer 2026-07-26, inv 25: 12 from m7 on;
   *  m3's 7 is grandfathered — it taught only three things). */
  minLessons?: number;
  /** Maximum lesson count (Spencer 2026-07-26, inv 25: hard ceiling 15 =
   *  11 teaching + 3 review + 1 challenge). */
  maxLessons?: number;
  /** Inv 25 (Spencer 2026-07-26): the CHALLENGE lesson is always the
   *  module's final lesson. Gated so pre-rule modules (m4/m5/m6) don't
   *  fail before they're re-authored. */
  requireChallengeLast?: boolean;
  /** Inv 25 (Spencer 2026-07-26): exactly N dedicated review lessons
   *  (id ends `-review`), placed at the beginning/middle/end thirds.
   *  Pass 3 for m7+. */
  requireReviewCount?: number;
  /** Invariant 30 (Spencer 2026-07-20): imageable module-new atoms debut
   *  on word_image_mcq; teaching lessons don't open on dialogue_listen.
   *  Gated so already-shipped modules retrofit on their own schedule. */
  requireImageFirst?: boolean;
  /** Invariant 26 (m5+): every teaching lesson carries ONE integration
   *  step — the CHALLENGE STEP (id suffix `-challenge`, legacy
   *  `-capstone`; build/translate/listening_build) placed before the
   *  review tail, combining ≥3 grammar points in a shape not seen
   *  elsewhere in the module. Review lessons are exempt.
   *  NOTE (2026-07-26): "capstone" is retired as a name — `requireCapstone`
   *  is the legacy alias, both suffixes are accepted while m3–m6 await
   *  re-authoring. New modules emit `-challenge`. */
  requireChallengeStep?: boolean;
  /** @deprecated legacy alias for `requireChallengeStep`. */
  requireCapstone?: boolean;
  /** HIDE-THE-OLD-COURSE (Spencer 2026-07-20): the prior NEO modules'
   *  lessons. When provided, "already known" vocab is derived from ACTUAL
   *  neo usage instead of the stale old-course `fromModule` tags. Pass
   *  [...M3_NEO_LESSONS, ...M4_NEO_LESSONS, ...] for m6+. */
  priorLessons?: LessonContent[];
  /** Invariant 33 (Spencer 2026-07-20): teach-first. A dialogue is never a
   *  valid FIRST exposure — every content word must debut on a real intro
   *  step before any dialogue uses it. Drops dialogue_listen from the
   *  intro-capable set. Enable for m6+; shipped modules retrofit later. */
  requireTeachFirst?: boolean;
  /**
   * Surfaces this module DECLARES in its IR `newAtoms` that exist in neither
   * `courseAtoms` nor `getRealFormLexicon()` — i.e. derived forms the
   * conjugation engine cannot produce.
   *
   * Added 2026-07-27 for m27. Every earlier module's IR-only atoms were
   * reachable by accident: m11's たべました / m12's たかくない / m13's たべたい /
   * m14's しって / m16's たべませんでした are all real conjugated forms the
   * engine emits, and m24's しましょう decomposes into two rows that exist. The
   * 〜すぎる family is neither — 「たべすぎたんだ」 tokenized to たべ plus the
   * unknown fragment 「すぎたん」 — so the tokenizer below could not see the
   * module's own vocabulary at all.
   *
   * This is additive and per-module: an entry here becomes a TOKEN, which
   * means the provenance check that follows starts applying to it (it must
   * still debut on an intro-capable step). Leaving it out does not make the
   * guard stricter — it makes the word invisible to the debut check, which is
   * the opposite of what this file is for.
   */
  extraVocab?: string[];
  /**
   * `extraVocab` tokens that are exempt from the "debuts on an intro-capable
   * step" half of the vocab-provenance check (they still tokenize — this
   * only skips the debut-type assertion). For a DERIVED verb-form whose
   * lesson pins a transform ramp covering MORE of `introduces:` than the
   * rule card's own hand-written `examples[]` happens to illustrate, the
   * ramp — pinned before every interleaved sentence (moduleCompiler.ts's
   * SEQUENCE comment) — is unavoidably that form's first appearance, and
   * `conjugation_transform` is deliberately excluded from `INTRO_TYPES`
   * (stepTaxonomy.ts) for a DIFFERENT reason (inv 37: a ramp must not be a
   * BASE VERB's only debut). A derived form was never eligible for a
   * `courseAtoms` row in the first place (`irAtomRegistration.test.ts`'s
   * `DERIVED_KINDS` rule) — it exists only so the tokenizer can see it — so
   * requiring it to ALSO clear a debut-type bar with no registrable atom
   * behind it is a check this class of token was never meant to satisfy.
   * First used by m34-neo-2 (みよう/でよう, landed 2026-08-24): the module's
   * own `introduces:` names six verbs for the ru-irregular ramp, and the
   * rule card's hand-written examples cover four.
   */
  debutExempt?: string[];
}): void {
  const { moduleLabel, lessons, priorModules, canon = COURSE_CANON } = opts;
  const priorSet = new Set(priorModules);
  // Kana-module (m1/m2) atoms are always known by m3+ (the kana ladder),
  // even when the neo lessons never reuse them.
  const KANA_KNOWN = JA_COURSE_ATOMS.filter(
    (a) => a.fromModule === "m1" || a.fromModule === "m2",
  ).map((a) => a.kana);
  // Tokenizer vocabulary: every atom surface + M3–M7 review-pool surfaces +
  // conjugation-aware real forms (te/ta/nai/masu — else たべない reads as
  // "untracked" the first time a negatives module runs, methodology audit
  // Gap 1) + structural glue. Independent of provenance (PRIOR is below).
  const VOCAB = new Set([
    ...JA_COURSE_ATOMS.map((a) => a.kana),
    ...M3_M7_REVIEW_POOL.map((a) => a.kana),
    ...getRealFormLexicon(),
    ...(opts.extraVocab ?? []),
  ]);
  const ALL = [...new Set([...VOCAB, ...STRUCTURAL])].sort(
    (a, b) => b.length - a.length,
  );
  function tokenize(str0: string): { tokens: string[]; unknown: string[] } {
    const tokens: string[] = [];
    const unknown: string[] = [];
    // Split on whitespace FIRST — the content is space-segmented into bunsetsu,
    // and a boundary-crossing longest match would mis-segment (でた, the ta-form
    // of でる, otherwise eats a で particle + the た of たべる in "…で たべる").
    for (const chunk of str0.split(/[　\s]+/).filter(Boolean)) {
      let i = 0;
      while (i < chunk.length) {
        const hit = ALL.find((t) => chunk.startsWith(t, i));
        if (hit) {
          tokens.push(hit);
          i += hit.length;
        } else {
          let j = i + 1;
          while (j < chunk.length && !ALL.some((t) => chunk.startsWith(t, j))) j++;
          unknown.push(chunk.slice(i, j));
          i = j;
        }
      }
    }
    return { tokens, unknown };
  }

  // Teach-first (invariant 33, Spencer 2026-07-20): a dialogue is NEVER a
  // valid first exposure — content words must debut on a real intro step
  // before any dialogue uses them, so dialogue_listen drops out of the
  // intro-capable set under requireTeachFirst.
  const introTypes = opts.requireTeachFirst
    ? new Set([...INTRO_TYPES].filter((t) => t !== "dialogue_listen"))
    : INTRO_TYPES;
  // "Already known" vocab. HIDE-THE-OLD-COURSE (Spencer 2026-07-20): when the
  // caller passes the prior NEO modules' lessons, provenance is derived from
  // ACTUAL neo usage — and STEP-AWARE: a word counts as known only if a prior
  // neo module INTRODUCED it on an intro-capable step. A word that appeared
  // ONLY in a prior dialogue was never taught (that is exactly how m5's
  // いくら/えん/いらっしゃいませ read as "known"), so it does NOT count. The
  // stale old-course `fromModule` tags are never consulted in this mode;
  // tag-based PRIOR is the fallback only for modules not yet on priorLessons.
  const PRIOR = new Set<string>(KANA_KNOWN);
  if (opts.priorLessons) {
    for (const lesson of opts.priorLessons)
      for (const step of lesson.steps)
        if (introTypes.has(step.type))
          for (const s of jaStrings(step))
            for (const t of tokenize(s).tokens)
              if (t.length > 1) PRIOR.add(t);
  } else {
    for (const a of JA_COURSE_ATOMS)
      if (priorSet.has(a.fromModule as string)) PRIOR.add(a.kana);
    for (const a of M3_M7_REVIEW_POOL)
      if (priorSet.has(a.fromModule)) PRIOR.add(a.kana);
  }

  describe(`${moduleLabel} authoring bar`, () => {
    if (opts.minLessons) {
      it(`ships at least ${opts.minLessons} lessons`, () => {
        expect(lessons.length).toBeGreaterThanOrEqual(opts.minLessons!);
      });
    }

    if (opts.maxLessons) {
      it(`ships at most ${opts.maxLessons} lessons (inv 25 ceiling)`, () => {
        expect(lessons.length).toBeLessThanOrEqual(opts.maxLessons!);
      });
    }

    if (opts.requireChallengeLast) {
      it("the CHALLENGE lesson is the module's final lesson (inv 25)", () => {
        const last = lessons[lessons.length - 1];
        expect(
          last?.id.endsWith("-challenge"),
          `last lesson is ${last?.id}, expected a -challenge lesson`,
        ).toBe(true);
      });
    }

    if (opts.requireReviewCount !== undefined) {
      it(`ships exactly ${opts.requireReviewCount} review lessons (inv 25)`, () => {
        const reviews = lessons.filter((l) => isReviewLessonId(l.id));
        expect(
          reviews.length,
          `review lessons: ${reviews.map((l) => l.id).join(", ") || "none"}`,
        ).toBe(opts.requireReviewCount);
      });

      it("review lessons sit in the beginning/middle/end thirds (inv 25)", () => {
        // With the challenge lesson pinned last, the reviews should be
        // spread rather than clustered: no two in the same third of the
        // module, measured over the non-challenge lessons.
        const body = lessons.filter((l) => !l.id.endsWith("-challenge"));
        const thirds = new Set(
          body
            .map((l, i) => [l, i] as const)
            .filter(([l]) => isReviewLessonId(l.id))
            .map(([, i]) => Math.min(2, Math.floor((i * 3) / body.length))),
        );
        expect(
          thirds.size,
          `review lessons cluster: thirds hit = ${[...thirds].join(",")}`,
        ).toBe(opts.requireReviewCount);
      });
    }

    for (const lesson of lessons) {
      it(`${lesson.id}: density + variety bar`, () => {
        const types = lesson.steps.map((s) => s.type);
        for (let i = 1; i < types.length; i++) {
          // The transform RAMP is deliberately consecutive (spec
          // 2026-07-23): 2-3 transform cards pinned right after the rule
          // drill the same operation on different verbs — repetition of
          // the drill shape is the point, not a variety defect. Cap the
          // run at 3 instead of banning adjacency.
          if (
            types[i] === "conjugation_transform" &&
            types[i - 1] === "conjugation_transform"
          ) {
            const runStart = types.slice(0, i).lastIndexOf("grammar_rule");
            expect(
              i - runStart,
              `${lesson.id} transform ramp longer than 3 @${i}`,
            ).toBeLessThanOrEqual(3);
            continue;
          }
          // Two rule cards pinned back-to-back is deliberately consecutive
          // too, on the same reasoning as the transform ramp above: `pinned`
          // (moduleCompiler.ts) puts every `kind: rule` beat first, in
          // authored order, exempt from the interleaver, so a lesson with
          // two rule beats on the SAME grammarPointId (different `variant`)
          // always lands them adjacent. m34-neo-1 is the first lesson to do
          // this on purpose — the module's own thesis card, showing the
          // plain volitional and its ましょう dress back to back (Spencer
          // 2026-08-24). Cap the run at 2 instead of banning adjacency,
          // exactly like the transform ramp does.
          if (types[i] === "grammar_rule" && types[i - 1] === "grammar_rule") {
            let runLen = 2;
            for (let j = i - 2; j >= 0 && types[j] === "grammar_rule"; j--) runLen++;
            expect(
              runLen,
              `${lesson.id} rule-card run longer than 2 @${i}`,
            ).toBeLessThanOrEqual(2);
            continue;
          }
          expect(
            types[i],
            `${lesson.id} adjacent ${types[i]} @${i}`,
          ).not.toBe(types[i - 1]);
        }
        let run = 0;
        for (const t of types) {
          run = SELECTION.has(t) ? run + 1 : 0;
          expect(run, `${lesson.id} selection run`).toBeLessThanOrEqual(2);
        }
        expect(types.length, `${lesson.id} steps`).toBeGreaterThanOrEqual(18);
        expect(types.length, `${lesson.id} steps`).toBeLessThanOrEqual(24);
        expect(types[types.length - 1]).toBe("match_pairs");
        expect(new Set(types).size).toBeGreaterThanOrEqual(5);
      });

      it(`${lesson.id}: no primary sentence surface repeats more than 3x`, () => {
        const counts = new Map<string, number>();
        for (const s of lesson.steps as any[]) {
          const surf =
            s.audioText ?? s.target ?? s.targetSentence ?? s.correctKana ??
            s.targetPhrase ?? s.acceptedAnswers?.[0];
          if (typeof surf !== "string") continue;
          const norm = surf.replace(/[。\s　]/g, "");
          counts.set(norm, (counts.get(norm) ?? 0) + 1);
        }
        for (const [sentence, n] of counts)
          expect(n, `${lesson.id}: "${sentence}" used ${n}x`).toBeLessThanOrEqual(3);
      });

      const wantChallengeStep =
        opts.requireChallengeStep ?? opts.requireCapstone;
      if (wantChallengeStep && !isReviewLessonId(lesson.id)) {
        it(`${lesson.id}: has ONE challenge integration step before the review tail (invariant 26)`, () => {
          // `-challenge` is the current name; `-capstone` is the legacy
          // suffix still carried by m3-m6 until they are re-authored.
          const isChallengeStep = (id: string) =>
            id.endsWith("-challenge") || id.endsWith("-capstone");
          const idx = lesson.steps.findIndex((s) => isChallengeStep(s.id));
          expect(idx, `${lesson.id}: no challenge step`).toBeGreaterThan(-1);
          expect(
            lesson.steps.filter((s) => isChallengeStep(s.id)).length,
            `${lesson.id}: more than one challenge step`,
          ).toBe(1);
          const step = lesson.steps[idx] as any;
          expect(
            ["build_sentence", "translate", "listening_build"],
            `${lesson.id}: challenge step must be a generation step`,
          ).toContain(step.type);
          // Near the end, but before the closing grid — the stretch beat
          // precedes the recognition-easy tail.
          expect(idx).toBeGreaterThanOrEqual(lesson.steps.length - 8);
          expect(idx).toBeLessThan(lesson.steps.length - 2);
        });
      }

      it(`${lesson.id}: no derived spot-the-mistake step (invariant 32 — retired)`, () => {
        for (const st of lesson.steps as any[]) {
          expect(
            st.id?.endsWith("-spot"),
            `${lesson.id}/${st.id}: spot-the-mistake step is retired (invariant 32)`,
          ).not.toBe(true);
          expect(
            /one of these is wrong/i.test(st.prompt ?? ""),
            `${lesson.id}/${st.id}: "one of these is wrong" prompt is retired (invariant 32)`,
          ).toBe(false);
        }
      });

      it(`${lesson.id}: no full-sentence recognition MCQs (invariant 28 — test-outs only)`, () => {
        // sentenceMcq compiles to a multiple_choice step; the offender is
        // one whose CORRECT option is a multi-word Japanese sentence
        // (picking a built sentence). Single-chunk MCQs (register/act-out)
        // and vocab/English-option MCQs are fine.
        for (const st of lesson.steps as any[]) {
          if (st.type !== "multiple_choice") continue;
          const correct = (st.options ?? []).find(
            (o: any) => o.id === st.correctOptionId,
          );
          const text: string = correct?.text ?? "";
          const isJa =
            /[぀-ヿ]/.test(text) && !/[a-zA-Z]/.test(text);
          const bare = text.replace(/[。？！]/g, "");
          if (isJa && /[ 　]/.test(bare)) {
            throw new Error(
              `${lesson.id}/${st.id}: full-sentence recognition MCQ ("${text}") — pick-the-built-sentence is test-out only; use build/translate/speaking`,
            );
          }
        }
      });

      if (opts.requireImageFirst && !lesson.id.endsWith("-review")) {
        it(`${lesson.id}: does not open on a dialogue (invariant 30)`, () => {
          expect(
            lesson.steps[0]?.type,
            `${lesson.id}: teaching lessons establish words before dialogue`,
          ).not.toBe("dialogue_listen");
        });
      }

      it(`${lesson.id}: production prompts are plain, no theatrics (invariant 29)`, () => {
        for (const st of lesson.steps as any[]) {
          const isProd = st.type === "build_sentence" || st.type === "translate";
          const isLc = st.type === "listening_comprehension";
          if (!isProd && !isLc) continue;
          const prompt: string = st.prompt ?? st.promptEn ?? st.question ?? "";
          // A theatrical scenario has an internal sentence period ("… up.
          // Tell Tom: …"); plain and register-cued prompts never do.
          if (/[.!?]\s+\S/.test(prompt.trim().replace(/[.!?]+$/, ""))) {
            throw new Error(
              `${lesson.id}/${st.id} (${st.type}): theatrical prompt ("${prompt}") — plain only ("Build: <English>" / "What does this mean?"); no scenario, no internal sentence period (inv 29)`,
            );
          }
        }
      });

      it(`${lesson.id}: production-framed prompts are generation steps, not MCQs`, () => {
        for (const s of lesson.steps as any[]) {
          if (s.type !== "sentence_mcq" && s.type !== "multiple_choice") continue;
          const prompt = `${s.prompt ?? ""} ${s.question ?? ""}`;
          const correct =
            s.correctKana ??
            s.options?.find((o: any) => o.id === s.correctOptionId)?.text ??
            "";
          if (/\breply\b|\bsay:/i.test(prompt) && /[ 　]/.test(correct)) {
            throw new Error(
              `${lesson.id}/${s.id}: production-framed prompt with a full-sentence answer must be a build/translate/speaking step`,
            );
          }
        }
      });
    }

    it("vocab provenance: no untracked words; new words debut on intro-capable steps", () => {
      const firstSeen = new Map<string, string>();
      for (const lesson of lessons) {
        for (const step of lesson.steps as any[]) {
          // `jaSurfaces` applies the grading-only + intentionally-wrong
          // scrubs (acceptedAnswers, antiPattern, transform distractors) —
          // and is the SAME projection the compiler places debuts against.
          // `particle_cloze.options` is the same class of thing (a wrong
          // answer the learner must REJECT) but jaSurfaces doesn't scrub it
          // course-wide, because every prior module's cloze distractors were
          // real, tokenizable words. m34 is the first to cloze a FORMATION
          // error (たべろう/のむう/…, m34-neo.test.ts's own distractor-only
          // ratchet) — deliberate non-words that don't tokenize, same as a
          // conjugation_transform distractor. Scrub locally, scoped to this
          // one exposure check, rather than touching jaSurfaces itself: that
          // function backs GATE 7 / invariant 30 / every other module's
          // guards, and scrubbing it there is a course-wide behaviour change
          // this landing has no need to make.
          const scrubbed = step.type === "particle_cloze" ? { ...step, options: undefined } : step;
          for (const s of jaSurfaces(scrubbed)) {
            const { tokens, unknown } = tokenize(s);
            for (const u of unknown)
              expect(
                u.length,
                `untracked word "${u}" in ${step.id} "${s}"`,
              ).toBeLessThanOrEqual(1);
            for (const t of tokens) {
              if (PRIOR.has(t) || STRUCTURAL.has(t) || t.length === 1) continue;
              if (!firstSeen.has(t)) firstSeen.set(t, step.type);
            }
          }
        }
      }
      const debutExempt = new Set(opts.debutExempt ?? []);
      for (const [word, type] of firstSeen) {
        if (debutExempt.has(word)) continue;
        expect(
          introTypes.has(type),
          `"${word}" debuts on non-intro step type ${type}` +
            (type === "dialogue_listen"
              ? ` — teach-first (invariant 33): a dialogue can't be a word's` +
                ` first exposure; introduce it earlier on a word_image_mcq/` +
                `speaking/build/grammar_rule/listening_comp`
              : ""),
        ).toBe(true);
      }
    });

    if (opts.requireImageFirst) {
      it("imageable module-new atoms debut on word_image_mcq (invariant 30)", () => {
        const thisModule = `m${moduleLabel.match(/m(\d+)/)?.[1]}`;
        const imageable = JA_COURSE_ATOMS.filter(
          (a) =>
            a.fromModule === thisModule &&
            a.kind === "vocab" &&
            a.emoji &&
            !(a as any).blocked &&
            // HIDE-THE-OLD-COURSE: a word the learner already knows from a
            // prior NEO module (in PRIOR) is not "module-new" no matter what
            // its stale old-course fromModule tag says (えき/います false-flag).
            !PRIOR.has(a.kana) &&
            // HOMOGRAPH LOSER (2026-07-27, m20): a bare kana means exactly ONE
            // atom — that is what JA_PRIMARY_ATOM_BY_KANA decides, and
            // `JA_COURSE_ATOMS_BY_KANA` is the resolved answer. 歯 "tooth"
            // shares は with the TOPIC PARTICLE and carries a stale
            // old-course m20 tag, so every は the tokenizer emits (i.e. every
            // lesson in the course) read as 歯 debuting on whatever step came
            // first. The atom the kana does NOT resolve to can never be
            // identified by a token, so requiring it to debut on a picture MCQ
            // is a false positive by construction. Same class as the m18 fix
            // that made this check tokenize instead of substring-match, and
            // the length-1 escape used elsewhere cannot help here because the
            // atom IS one character.
            JA_COURSE_ATOMS_BY_KANA.get(a.kana)?.id === a.id,
        );
        const firstType = new Map<string, string>();
        for (const lesson of lessons) {
          for (const step of lesson.steps as any[]) {
            // TOKENIZE, never substring-match — the same lesson moduleCompiler's
            // own image-debut diagnostic learned ("いま is a substring of
            // かいます"). A raw `JSON.stringify(step).includes(kana)` reports a
            // debut for every atom whose kana happens to occur inside an
            // unrelated word, and for a ONE-CHARACTER atom that is every lesson
            // in the course: き (木, stale old-course m18 tag) "debuts" on the
            // first step containing きく / きょう / きっさてん. The stale tags are
            // exactly what the PRIOR filter above exists to neutralize, and the
            // length-1 escape it uses (`t.length > 1`) cannot help here because
            // the atom itself is one character. Tokenizing fixes both: a kana
            // run only counts when the longest-match tokenizer actually yields
            // it as a word.
            for (const s of jaSurfaces(step)) {
              for (const t of tokenize(s).tokens) {
                if (!firstType.has(t)) {
                  firstType.set(t, step.type);
                  // DEBUG_INV30_WORD=て — print where a word's debut lands.
                  if (process.env.DEBUG_INV30_WORD === t)
                    console.error(`inv30[${t}]: ${lesson.id ?? "?"} / ${step.id} (${step.type}) — surface 「${s}」`);
                }
              }
            }
          }
        }
        const offenders: string[] = [];
        for (const atom of imageable) {
          const t = firstType.get(atom.kana);
          if (!t) continue; // atom exists but unused in this module — other gate
          if (t !== "word_image_mcq")
            offenders.push(`${atom.kana} (${atom.emoji}) debuts on ${t}`);
        }
        expect(
          offenders,
          `imageable module-new atoms must debut on word_image_mcq:\n  ${offenders.join("\n  ")}`,
        ).toEqual([]);
      });
    }

    it("persona canon is consistent module-wide", () => {
      const names = Object.keys(canon).join("|");
      const preds = [...new Set(Object.values(canon).flatMap((s) => [...s]))].join("|");
      const re = new RegExp(`(${names})(?:は|も) (${preds})だ`, "g");
      for (const lesson of lessons) {
        const blob = JSON.stringify(lesson.steps);
        for (const m of blob.matchAll(re))
          expect(
            canon[m[1]].has(m[2]),
            `${lesson.id}: "${m[0]}" contradicts persona canon`,
          ).toBe(true);
      }
    });
  });
}
