/**
 * Deterministic module compiler (authoring pipeline v2, 2026-07-20).
 *
 * Turns an authored content IR (docs/content-ir-spec-2026-07-20.md) into
 * LessonContent[] that satisfies the moduleBarGuards invariants BY
 * CONSTRUCTION: step-type assignment, ordering (no adjacent same-type, ≤2
 * selection-taps), the house review tail, one -capstone in the stretch window,
 * and close-on-match. Phase-1 authors the pedagogy (YAML); this is phase 2.
 *
 * `diagnoseModule` is the author⇄compiler feedback channel: it reports what
 * the IR is missing (density-short, distractor-thin, …) so the content author
 * can fix the YAML instead of the compiler guessing.
 */
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import { JA_COURSE_ATOMS } from "@/features/languages/ja/courseAtoms";
import {
  build,
  cloze,
  dialogueListen,
  conjugationTransform,
  grammarRule,
  listeningBuildSentence,
  reviewMatchPairs,
  speaking,
  translateStep,
  vocabMcq,
  WORD_IMAGE_MCQ_BLOCKLIST,
  type ReviewAtom,
} from "@/features/languages/ja/grammarHelpers";

// ── IR types ────────────────────────────────────────────────────────────────
export type IRAtom = {
  kana: string;
  romaji?: string;
  gloss: string;
  /** Compact gloss for width-constrained surfaces (match-pair tiles). The
   *  full teaching gloss stays everywhere else. Long glosses without one
   *  overflow the match card below the fold (Gate 10, m6 2026-07-23). */
  shortGloss?: string;
  imageable?: boolean;
  kind?: string;
  derivedFrom?: string;
  verbClass?: string;
};
export type IRGrammarPoint = {
  id: string;
  rule: string;
  examples: { ja: string; en: string }[];
  antiPattern?: { ja: string; why: string };
  /**
   * Declares this point as a CONJUGATION rule (spec 2026-07-23): the
   * compiler auto-emits a transform-card ramp right after the rule step —
   * recognition drills of the transformation itself, before any sentence
   * work — built from the module's `newAtoms` whose `derivedFrom` +
   * `verbClass` match. `classes` uses IR verbClass names (ru/u/irregular).
   */
  conjugation?: { form: string; classes: string[] };
};
export type IRBeat =
  | { kind: "rule"; grammarPointId: string }
  | {
      /** `challenge` is the current name for the per-lesson integration
       *  beat (inv 26); `capstone` is the legacy alias still used by m6's
       *  IR until it is re-authored. Treated identically everywhere. */
      kind: "sentence" | "capstone" | "challenge";
      ja: string;
      en: string;
      mode: "build" | "translate" | "listening";
      exercises?: string[];
      combines?: string[];
      /** Additional CORRECT surfaces to grade right (each expands through
       *  the same variant machinery) — e.g. それが わからない beside the
       *  authored それは わからない: が isn't taught yet, but correct
       *  Japanese must never grade wrong (Spencer 2026-07-23). */
      alsoAccept?: string[];
      /** Known learner trap on this beat: a WRONG surface + why. Compiles
       *  to a reactive tip on the step; the tip gate fires it only when
       *  the learner's typed answer actually contains the trap (それを…
       *  with わかる — the transitive-“get” instinct). */
      pitfall?: { wrong: string; why: string; title?: string };
    }
  | {
      kind: "particle-cloze";
      stem: string;
      tail: string;
      answer: string;
      options: string[];
      en: string;
      explanation?: string;
    }
  | {
      kind: "dialogue";
      lines: { speaker: string; ja: string; en?: string }[];
      questions: { q: string; options: string[]; answer: string }[];
    };
export type IRLesson = {
  id: string;
  title?: string;
  focus?: string;
  introduces?: string[];
  beats: IRBeat[];
  reviewPool?: string[];
  /** Inv 25 (Spencer 2026-07-26): a module is 8-11 `teaching` + 3 `review`
   *  + 1 `challenge`, and the challenge lesson is always LAST. Declare it
   *  explicitly rather than inferring from beat shape or id suffix — the
   *  old inference ("no capstone beat means review", plus an id-ends-in-12
   *  special case) cannot express three review lessons. Omitted → inferred
   *  for back-compat with m6's IR. */
  role?: "teaching" | "review" | "challenge";
};
export type ModuleIR = {
  module: string;
  title: string;
  register?: string;
  priorNeoModules?: string[];
  newAtoms?: IRAtom[];
  grammarPoints?: IRGrammarPoint[];
  /** Grammar points this module EXERCISES but does not TEACH — taught by an
   *  earlier module, so they carry no rule/examples here. `exercises:` and
   *  `combines:` may name these freely; anything in neither list is a typo
   *  (diagnostic `unknown-grammar-point`). Also the declared surface for
   *  cross-module grammar review to draw on. */
  priorGrammarPoints?: string[];
  lessons: IRLesson[];
};

export type Diagnostic = {
  lesson: string;
  kind:
    | "provenance"
    | "density-short"
    | "density-over"
    | "variety-thin"
    | "distractor-thin"
    | "capstone-missing"
    | "repeat"
    | "dialogue-distractor-synth"
    | "gloss-long"
    | "gloss-mismatch"
    | "unbuildable"
    | "image-debut"
    | "ordering"
    /** `exercises:`/`combines:` names a grammar point the IR never
     *  declares — silent typos used to sail straight through. */
    | "unknown-grammar-point"
    /** Inv 26: a challenge step whose grammar-point combination already
     *  appeared in an earlier beat — longer-but-familiar is not a
     *  challenge. */
    | "challenge-not-novel";
  detail: string;
};

// ── atom + tokenizer plumbing ────────────────────────────────────────────────
type Atom = {
  kana: string;
  meaningEn: string;
  shortGloss?: string;
  emoji?: string;
  fromModule: ReviewAtom["fromModule"];
};

/** Match-pair tiles are width-constrained; long glosses wrap and push pairs
 *  below the fold (Spencer m6 walk 2026-07-23: "definitions on these words
 *  need to be shorter — display the longer on the flash cards"). Tiles use
 *  the authored shortGloss when present, else the first `/`- or `,`-segment
 *  of the teaching gloss ("won't eat / don't eat" → "won't eat"). The full
 *  gloss is untouched everywhere else — flashcards, speaking, MCQ. */
function matchTileGloss(a: { meaningEn: string; shortGloss?: string }): string {
  return a.shortGloss ?? a.meaningEn.split(/[/,;]/)[0].trim();
}

// Kana-faithful romaji (Spencer ruling: は→ha, を→wo, へ→he — the particle's
// spelling, not its pronunciation). Display-only, for grammar-card examples.
const ROMAJI: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo", しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho", にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo", みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo", ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo", びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko", さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to", な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho", ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  // を → "o": the KANA_ROMAJI citation reading (Spencer ruling) — the
  // sentence-line "gohanwo" vs per-kana "o" mismatch was a sweep finding.
  や: "ya", ゆ: "yu", よ: "yo", ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro", わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go", ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do", ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ト: "to", ム: "mu", ミ: "mi", カ: "ka", ケ: "ke", ン: "n", タ: "ta", ナ: "na",
};
function kanaToRomaji(input: string): string {
  const s = input.replace(/[。、？！]/g, "");
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " || ch === "　") {
      out.push(" ");
      i++;
    } else if (ch === "っ") {
      const r = ROMAJI[s.slice(i + 1, i + 3)] ?? ROMAJI[s[i + 1] ?? ""] ?? "";
      if (r) out.push(r[0]);
      i++;
    } else if (ch === "ー") {
      const last = out[out.length - 1];
      if (last) out.push(last[last.length - 1]);
      i++;
    } else if (ROMAJI[s.slice(i, i + 2)]) {
      out.push(ROMAJI[s.slice(i, i + 2)]);
      i += 2;
    } else if (ROMAJI[ch]) {
      out.push(ROMAJI[ch]);
      i += 1;
    } else {
      out.push(ch);
      i += 1;
    }
  }
  return out.join("").replace(/\s+/g, " ").trim();
}

const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
const PUNCT = /[。、？！]/g;

const SELECTION = new Set([
  "listening_comprehension",
  "word_image_mcq",
  "sentence_mcq",
  "particle_cloze",
  "self_explanation_mcq",
  "multiple_choice",
]);

function atomIndex(ir: ModuleIR): Map<string, Atom> {
  const m = new Map<string, Atom>();
  for (const a of JA_COURSE_ATOMS as unknown as Array<Record<string, unknown>>) {
    const kana = a.kana as string;
    if (kana && !m.has(kana))
      m.set(kana, {
        kana,
        meaningEn: (a.meaningEn as string) ?? kana,
        shortGloss: a.shortGloss as string | undefined,
        emoji: a.emoji as string | undefined,
        fromModule: (a.fromModule as ReviewAtom["fromModule"]) ?? "m6",
      });
  }
  for (const a of ir.newAtoms ?? [])
    m.set(a.kana, {
      kana: a.kana,
      meaningEn: a.gloss,
      shortGloss: a.shortGloss,
      fromModule: ir.module as ReviewAtom["fromModule"],
    });
  return m;
}

function makeTokenizer(atoms: Map<string, Atom>) {
  const vocab = [...new Set([...atoms.keys(), ...PARTICLES, ...NAMES, ...INTERJ])].sort(
    (a, b) => b.length - a.length,
  );
  return function tokenize(ja: string): string[] {
    // Authored spaces are WORD BOUNDARIES — tokenize each segment
    // independently, never matching across them. Stripping spaces first
    // let はい greedy-match across the きょうは|いかない boundary and
    // emitted an UNBUILDABLE build step (きょう・はい・か・ない —
    // Spencer m6 walk 2026-07-23). The `unbuildable` diagnostic below is
    // the standing gate for this class.
    const out: string[] = [];
    for (const str of ja.replace(PUNCT, "").split(/[　\s]+/).filter(Boolean)) {
      let i = 0;
      while (i < str.length) {
        const hit = vocab.find((t) => str.startsWith(t, i));
        if (hit) {
          out.push(hit);
          i += hit.length;
        } else {
          let j = i + 1;
          while (j < str.length && !vocab.some((t) => str.startsWith(t, j))) j++;
          out.push(str.slice(i, j));
          i = j;
        }
      }
    }
    return out;
  };
}

// ── compiler ────────────────────────────────────────────────────────────────
export function compileModule(ir: ModuleIR): LessonContent[] {
  const atoms = atomIndex(ir);
  const tokenize = makeTokenizer(atoms);
  const gpById = new Map((ir.grammarPoints ?? []).map((g) => [g.id, g]));
  const moduleId = ir.module;
  const emojiPool: Atom[] = [...atoms.values()].filter(
    (a) => a.emoji && !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
  );

  const resolve = (kana: string): Atom =>
    atoms.get(kana) ?? { kana, meaningEn: kana, fromModule: moduleId as ReviewAtom["fromModule"] };
  const exercised = (ja: string): string[] => tokenize(ja).filter((t) => atoms.has(t));
  const acceptedVariants = (ja: string): string[] => {
    const noPunct = ja.replace(PUNCT, "").trim();
    const noSpace = noPunct.replace(/[　\s]/g, "");
    return [...new Set([ja.trim(), noPunct, noSpace])];
  };
  const clean = (ja: string) => ja.replace(PUNCT, "").trim();

  // Inv 25: a module carries THREE review lessons. Resolve every lesson's
  // role up front so review lessons can be numbered without colliding —
  // the old single-review assumption named them all `ja-<m>-neo-review`.
  const roleOf = (l: IRLesson): "teaching" | "review" | "challenge" => {
    if (l.role) return l.role;
    // Legacy inference for m6-era IR that predates `role:`.
    if (l.id.endsWith("-challenge")) return "challenge";
    const hasChallengeBeat = l.beats.some(
      (b) => b.kind === "capstone" || b.kind === "challenge",
    );
    return hasChallengeBeat ? "teaching" : "review";
  };
  const reviewIds = ir.lessons.filter((l) => roleOf(l) === "review").map((l) => l.id);

  return ir.lessons.map((lesson) => {
    const role = roleOf(lesson);
    const isReview = role === "review";
    // Review lessons are named `-review` so the guards' review-lesson
    // exemptions (challenge step, dialogue-open) fire. A lone review keeps
    // the unnumbered id m6 already ships; 2+ get a 1-based suffix.
    const reviewId =
      reviewIds.length > 1
        ? `ja-${moduleId}-neo-review-${reviewIds.indexOf(lesson.id) + 1}`
        : `ja-${moduleId}-neo-review`;
    const lid = isReview ? reviewId : `ja-${lesson.id}`;
    let n = 0;
    const sid = (tag: string) => `${lid}-${tag}-${n++}`;

    const ruleSteps: LessonStep[] = [];
    const body: LessonStep[] = [];
    // Transform ramp (spec 2026-07-23): pinned IMMEDIATELY after the rule
    // steps, exempt from the interleaver — the whole point is that the
    // transformation gets drilled before any sentence work, and that no
    // typed production lands adjacent to a new rule.
    const transformRamp: LessonStep[] = [];
    let capstone: LessonStep | null = null;

    const IR_CLASS_TO_GROUP: Record<string, "ichidan" | "godan" | "irregular"> = {
      ru: "ichidan",
      u: "godan",
      irregular: "irregular",
    };

    for (const beat of lesson.beats) {
      if (beat.kind === "rule") {
        const gp = gpById.get(beat.grammarPointId);
        if (!gp) continue;
        ruleSteps.push(
          grammarRule({
            id: `${lid}-rule-${beat.grammarPointId}`,
            title: lesson.title ?? ir.title,
            rule: gp.rule,
            examples: gp.examples.map((e) => ({ ...e, romaji: kanaToRomaji(e.ja) })),
            antiPattern: gp.antiPattern
              ? {
                  ja: gp.antiPattern.ja,
                  romaji: kanaToRomaji(gp.antiPattern.ja),
                  en: "(incorrect)",
                  why: gp.antiPattern.why,
                }
              : undefined,
            grammarPointId: beat.grammarPointId,
            conjugationForm: gp.conjugation?.form,
          }),
        );
        if (gp.conjugation) {
          const groups = gp.conjugation.classes
            .map((c) => IR_CLASS_TO_GROUP[c])
            .filter(Boolean);
          // Ramp material: THIS LESSON's derived forms whose base's class
          // matches the rule — scoped to `introduces` so a same-class atom
          // from a later lesson (いない, L6) can't ride an earlier ramp
          // ahead of its own base verb's intro (teach-first, inv 33).
          const scope = new Set(lesson.introduces ?? []);
          const material = (ir.newAtoms ?? []).filter(
            (a) =>
              a.derivedFrom &&
              a.verbClass &&
              groups.includes(IR_CLASS_TO_GROUP[a.verbClass]) &&
              (scope.size === 0 || scope.has(a.kana)),
          );
          for (const a of material.slice(0, 3)) {
            const group = IR_CLASS_TO_GROUP[a.verbClass as string];
            transformRamp.push(
              conjugationTransform({
                id: `${lid}-tf-${transformRamp.length}`,
                base: a.derivedFrom as string,
                baseGloss:
                  atoms.get(a.derivedFrom as string)?.meaningEn ??
                  a.derivedFrom as string,
                targetGloss: a.shortGloss ?? a.gloss,
                form: gp.conjugation.form as Parameters<typeof conjugationTransform>[0]["form"],
                group,
                baseRomaji: kanaToRomaji(a.derivedFrom as string),
              }),
            );
          }
          // NOTE: the ungraded "type-tease" card was emitted here for one
          // day and CUT (Spencer 2026-07-24): the lesson already forces
          // sentence-level typing on translate steps, so a word-typing
          // "bonus" after that read as redundant, and word-level typed
          // production correctly waits for FSRS graduation (stage 3).
          // The `ungraded` step variant still exists for manual authoring.
        }
      } else if (
        beat.kind === "sentence" ||
        beat.kind === "capstone" ||
        beat.kind === "challenge"
      ) {
        // New IR uses `challenge` (→ `-challenge` step id); m6's legacy
        // `capstone` beats keep emitting `-capstone` so shipped step ids
        // (and saved lesson-resume state keyed by them) don't churn.
        const id =
          beat.kind === "challenge"
            ? `${lid}-challenge`
            : beat.kind === "capstone"
              ? `${lid}-capstone`
              : sid("s");
        const ex = exercised(beat.ja);
        let step: LessonStep;
        if (beat.mode === "translate") {
          step = translateStep({
            id,
            promptEn: beat.en,
            acceptedAnswers: [
              ...acceptedVariants(beat.ja),
              ...(beat.alsoAccept ?? []).flatMap(acceptedVariants),
            ],
            audioText: clean(beat.ja),
            exercisedAtomKanas: ex,
          });
          if (beat.pitfall) {
            // Known-trap tip: the reactive-tip gate (reactiveTipGate.ts)
            // fires this ONLY when the learner's typed answer actually
            // contains the trap surface — targeted correction, not a
            // generic lecture.
            step.reactiveGrammarTip = {
              grammarPointId: `pitfall-${id}`,
              title: beat.pitfall.title ?? "Heads up",
              ruleLine: beat.pitfall.why,
              wrongJa: beat.pitfall.wrong,
              wrongRomaji: kanaToRomaji(beat.pitfall.wrong),
              rightJa: beat.ja,
              rightRomaji: kanaToRomaji(beat.ja),
              why: beat.pitfall.why,
            };
          }
        } else if (beat.mode === "listening") {
          const tiles = tokenize(beat.ja);
          step = listeningBuildSentence({
            id,
            target: clean(beat.ja),
            tiles,
            correctOrder: tiles,
            promptEn: "Build what you hear.",
            exercisedAtomKanas: ex,
          });
        } else {
          const tiles = tokenize(beat.ja);
          step = build(id, `Build: ${beat.en}`, clean(beat.ja), tiles, tiles, ex);
        }
        // Track B (grammar SRS): carry the beat's declared grammar points
        // onto the step. `exercises` (sentence) and `combines` (challenge)
        // share one vocabulary. Until 2026-07-26 both fields were authored
        // but never read — this is what makes compiled content gradeable
        // against the grammar scheduler instead of dead metadata.
        const points = [...(beat.exercises ?? []), ...(beat.combines ?? [])];
        if (points.length) step.exercisedGrammar = [...new Set(points)];
        if (beat.kind === "capstone" || beat.kind === "challenge")
          capstone = step;
        else body.push(step);
      } else if (beat.kind === "particle-cloze") {
        const full = clean(`${beat.stem}${beat.answer}${beat.tail}`);
        body.push(
          cloze(sid("cloze"), beat.stem, beat.tail, beat.answer, beat.options, beat.en, full, beat.explanation),
        );
      } else if (beat.kind === "dialogue") {
        const questions = beat.questions.map((q, qi) => {
          const wrong = q.options.filter((o) => o !== q.answer);
          const fillers = ["We can't tell", "Neither", "Both", "Not yet"];
          const distractors = [...wrong];
          for (const f of fillers) {
            if (distractors.length >= 3) break;
            if (!distractors.includes(f) && f !== q.answer) distractors.push(f);
          }
          return {
            id: `q${qi}`,
            prompt: q.q,
            correctText: q.answer,
            distractors: distractors.slice(0, 3) as [string, string, string],
          };
        });
        body.push(
          dialogueListen({
            id: sid("dlg"),
            lines: beat.lines.map((l) => ({ speaker: l.speaker, kana: l.ja })),
            questions,
          }),
        );
      }
    }

    // ── DENSITY: assemble the middle pool so rule + middle + capstone + match
    //    lands in [18, 24]; pad with review fillers, trim fillers if over.
    const pool = (lesson.reviewPool ?? []).map(resolve);
    // Match pairs are EXCLUSIVELY words (Spencer 2026-07-24: "が is not a
    // word") — particles drill in cloze/build, never as match tiles.
    const matchable = pool.filter((a) => !PARTICLES.includes(a.kana));
    const picked = (matchable.length >= 4 ? matchable : [...matchable, ...emojiPool]).slice(0, 6);
    const tileGlosses = picked.map(matchTileGloss);
    const matchAtoms = picked.map((a, i) => ({
      ...a,
      // Truncation must never create two identical targets (elimination
      // ambiguity — matchPairsPairCount guard): a collided tile falls back
      // to its full gloss, e.g. で/に both shortening to "at".
      meaningEn:
        tileGlosses.filter((g) => g === tileGlosses[i]).length > 1
          ? a.meaningEn
          : tileGlosses[i],
    }));
    const match = reviewMatchPairs(`${lid}-rev`, matchAtoms);
    const fixed =
      ruleSteps.length +
      transformRamp.length +
      (lesson.introduces ?? []).filter((k) => {
        const x = (ir.newAtoms ?? []).find((n) => n.kana === k);
        return x && x.imageable !== false && !!atoms.get(k)?.emoji;
      }).length +
      (capstone ? 1 : 0) +
      1;
    const middle: LessonStep[] = [...body];
    // Never TYPED-recall this lesson's own new words or any conjugated
    // form — the transform cells own their production timeline.
    const noTyped = new Set<string>([
      ...(lesson.introduces ?? []),
      ...(ir.newAtoms ?? []).filter((x) => x.derivedFrom).map((x) => x.kana),
    ]);
    let fi = 0;
    while (middle.length + fixed < 18 && fi < 60) {
      const f = reviewFiller(lid, fi, pool, emojiPool, noTyped);
      if (f) middle.push(f);
      fi++;
    }
    while (middle.length + fixed > 24 && middle.some((s) => s.id.includes("-fill-"))) {
      const idx = middle.findIndex((s) => s.id.includes("-fill-"));
      middle.splice(idx, 1);
    }

    // Image-first debuts (Spencer 2026-07-23): an imageable NEW word's
    // first-ever appearance IS its word_image_mcq — pinned ahead of the
    // ramp and middle so nothing can precede it, emitted ONCE (module-wide
    // repeat ban enforced by the image-debut diagnostic).
    const debutSteps: LessonStep[] = [];
    for (const kana of lesson.introduces ?? []) {
      const irAtom = (ir.newAtoms ?? []).find((x) => x.kana === kana);
      const atom = atoms.get(kana);
      if (!irAtom || irAtom.imageable === false || !atom?.emoji) continue;
      const v = tryVocabMcq(`${lid}-debut-${debutSteps.length}`, atom, emojiPool);
      if (v) debutSteps.push(v);
    }

    // ── SEQUENCE: rule(s) first → IMAGE DEBUTS (pinned) → TRANSFORM RAMP
    //    (pinned, exempt from the interleaver: the transformation is
    //    drilled before any sentence work, and no typed production can
    //    land adjacent to a new rule — spec 2026-07-23) → interleaved
    //    middle → ungraded type-tease → capstone (stretch) → close on
    //    match_pairs.
    const pinned = [...ruleSteps, ...debutSteps, ...transformRamp];
    // Typed translates live as late as possible ("more repetitions before
    // typing", Spencer 2026-07-24) — but the tail must keep ≥2t-1 slots so
    // t translates can still alternate with other types (no-adjacent bar).
    const typedCount = middle.filter((s) => s.type === "translate").length;
    const midSeq = interleave(middle, lastType(pinned), {
      deferTypes: new Set(["translate"]),
      deferUntil: Math.max(
        0,
        Math.min(
          Math.ceil(middle.length * (2 / 3)),
          middle.length - (typedCount * 2 - 1),
        ),
      ),
    });
    const steps: LessonStep[] = [...pinned, ...midSeq];
    if (capstone) placeCapstone(steps, capstone, pinned.length);
    repairAdjacency(steps, pinned.length);
    steps.push(match);

    return {
      id: lid,
      moduleId,
      courseId: "mock-1",
      languageId: "ja",
      title: lesson.title ?? `${ir.title} — ${lesson.id}`,
      description: lesson.focus,
      estimatedMinutes: 5,
      xpReward: 15,
      introducesVocabIds: [],
      steps,
    } as LessonContent;
  });
}

function lastType(steps: LessonStep[]): string | null {
  return steps.length ? steps[steps.length - 1].type : null;
}

/** Reorganize greedy: at each slot pick the MOST-ABUNDANT remaining type that
 *  differs from the previous and won't make a 3rd selection-tap in a row. This
 *  spreads scarce types out and only violates when a type is unavoidably
 *  dominant (which then surfaces as an `ordering` diagnostic). */
function interleave(
  pool: LessonStep[],
  prev: string | null,
  opts?: { deferTypes?: Set<string>; deferUntil?: number },
): LessonStep[] {
  const remaining = [...pool];
  const out: LessonStep[] = [];
  let last = prev;
  let selRun = prev && SELECTION.has(prev) ? 1 : 0;
  while (remaining.length) {
    const byType = new Map<string, number>();
    for (const s of remaining) byType.set(s.type, (byType.get(s.type) ?? 0) + 1);
    const rank = (t: string) => byType.get(t) ?? 0;
    // deferTypes are held out of the early lesson (typed translate lives
    // in the final third — "more repetitions before typing", Spencer
    // 2026-07-24). Soft constraint: the fallback tiers below may still
    // place one early rather than deadlock.
    const deferred = (t: string) =>
      (opts?.deferTypes?.has(t) ?? false) && out.length < (opts?.deferUntil ?? 0);
    // Urgency: once a type's remaining count can only JUST alternate into
    // the remaining slots (2n-1 ≥ slots), it must be picked at every legal
    // opportunity or an adjacency is forced at the tail (seen live with 6
    // deferred translates, 2026-07-24).
    const urgent = [...byType.keys()].filter(
      (t) => t !== last && (byType.get(t) ?? 0) * 2 - 1 >= remaining.length,
    );
    let cands = urgent.length
      ? urgent
      : [...byType.keys()].filter(
          (t) => t !== last && !(selRun >= 2 && SELECTION.has(t)) && !deferred(t),
        );
    if (!cands.length)
      cands = [...byType.keys()].filter((t) => !(selRun >= 2 && SELECTION.has(t)));
    if (!cands.length) cands = [...byType.keys()].filter((t) => t !== last);
    if (!cands.length) cands = [...byType.keys()];
    cands.sort((a, b) => rank(b) - rank(a));
    const t = cands[0];
    const idx = remaining.findIndex((s) => s.type === t);
    const [s] = remaining.splice(idx, 1);
    selRun = SELECTION.has(s.type) ? (last && SELECTION.has(last) ? selRun + 1 : 1) : 0;
    last = s.type;
    out.push(s);
  }
  return out;
}

/**
 * Post-pass adjacency repair: the greedy interleaver + translate deferral
 * can strand two same-type steps at the tail (six deferred translates,
 * 2026-07-24). Swap the later duplicate with the nearest earlier step
 * whose move breaks the pair without creating a new one. Deferral is
 * soft, adjacency is hard — one translate drifting earlier is the price.
 */
function repairAdjacency(seq: LessonStep[], floor: number): void {
  const t = (k: number): string | undefined => seq[k]?.type;
  for (let i = floor + 1; i < seq.length; i++) {
    if (t(i) !== t(i - 1)) continue;
    // The transform ramp is LEGALLY consecutive (capped at 3 by the guard).
    if (t(i) === "conjugation_transform") continue;
    for (let j = i - 2; j > floor; j--) {
      if (t(j) === t(i)) continue;
      // After swapping j↔i, check all four affected adjacencies.
      const jPrev = t(j - 1);
      const jNext = j + 1 === i ? t(j) : t(j + 1);
      const iNext = t(i + 1);
      if (
        jPrev !== t(i) &&
        jNext !== t(i) &&
        t(i - 1) !== t(j) &&
        (iNext === undefined || iNext !== t(j))
      ) {
        [seq[j], seq[i]] = [seq[i], seq[j]];
        break;
      }
    }
  }
}

/** Insert the capstone in the stretch window [N-8, N-3] (N = final length),
 *  preferring a slot whose neighbours differ in type (no adjacency). */
function placeCapstone(steps: LessonStep[], capstone: LessonStep, ruleCount: number): void {
  const N = steps.length + 2; // + capstone + match
  const lo = Math.max(N - 8, ruleCount);
  const hi = Math.min(N - 3, steps.length);
  for (let p = hi; p >= lo; p--) {
    const before = steps[p - 1]?.type;
    const after = steps[p]?.type; // undefined at end → match (match_pairs) follows, always differs
    if (before !== capstone.type && (after === undefined || after !== capstone.type)) {
      steps.splice(p, 0, capstone);
      return;
    }
  }
  steps.splice(Math.min(hi, steps.length), 0, capstone);
}

function tryVocabMcq(id: string, target: Atom, distractorPool: Atom[]): LessonStep | null {
  try {
    return vocabMcq(id, target as never, distractorPool as never);
  } catch {
    return null;
  }
}

function reviewFiller(
  lid: string,
  i: number,
  pool: Atom[],
  emojiPool: Atom[],
  noTyped: ReadonlySet<string>,
): LessonStep | null {
  // Fable sweep 2026-07-24, three filler classes fixed at the source:
  //  - PARTICLES never filler: mic-grading a single mora ("say が aloud")
  //    is ASR-noise, and typing に from a metalanguage gloss is a guessing
  //    game — particles drill in cloze/build/match only.
  //  - Prompts/glosses use the SHORT gloss: the raw teaching gloss printed
  //    the answer's own stem ("There isn't (negative of いる)" → いない)
  //    and leaked authoring tone ("— IRREGULAR") onto learner cards.
  //  - No TYPED recall of `noTyped` atoms (this lesson's own introduces +
  //    conjugated forms): word-typing waits for consolidation — the filler
  //    path was bypassing the transform stage-3 gate same-session.
  const usable = pool.filter((p) => !PARTICLES.includes(p.kana));
  const a = usable.length
    ? usable[i % usable.length]
    : emojiPool[i % Math.max(emojiPool.length, 1)];
  if (!a) return null;
  const gloss = matchTileGloss(a);
  const typedOk = !noTyped.has(a.kana);
  if (i % 2 === 0 || !typedOk) {
    return speaking(`${lid}-fill-${i}`, a.kana, gloss, [a.kana]);
  }
  return translateStep({
    id: `${lid}-fill-${i}`,
    promptEn: gloss,
    acceptedAnswers: [a.kana],
    audioText: a.kana,
    exercisedAtomKanas: [a.kana],
  });
}

// ── diagnostics (author ⇄ compiler feedback) ─────────────────────────────────
export function diagnoseModule(ir: ModuleIR): Diagnostic[] {
  const out: Diagnostic[] = [];
  const gpById = new Map((ir.grammarPoints ?? []).map((g) => [g.id, g]));
  // Buildability gate (Spencer 2026-07-23: an unbuildable build step
  // shipped — tokens crossed a word boundary). Every sentence surface must
  // tokenize into KNOWN units only (atoms/particles/names/interjections);
  // an unknown fragment means the tile bank cannot spell the sentence.
  const atoms = atomIndex(ir);
  const tokenize = makeTokenizer(atoms);
  const KNOWN = new Set([...atoms.keys(), ...PARTICLES, ...NAMES, ...INTERJ]);
  for (const lesson of ir.lessons) {
    for (const b of lesson.beats) {
      if (b.kind !== "sentence" && b.kind !== "capstone" && b.kind !== "challenge")
        continue;
      const alien = tokenize(b.ja).filter((t) => !KNOWN.has(t) && t.length > 1);
      if (alien.length > 0)
        out.push({
          lesson: lesson.id,
          kind: "unbuildable",
          detail: `"${b.ja}" tokenizes to unknown fragment(s) ${alien.join("・")} — the tile bank cannot spell this sentence; fix the surface or teach the missing atom`,
        });
    }
  }
  // Image-debut invariant (Spencer 2026-07-23): the word_image_mcq is a
  // word's FIRST-EVER appearance, and it never repeats. Checked on the
  // COMPILED module: (a) no word is the correct answer of >1 image MCQ;
  // (b) an imageable introduced word's first surfaced step is its debut
  // MCQ. Distractor/grading fields are excluded from "appearance".
  {
    const compiled = compileModule(ir);
    const mcqSeen = new Map<string, string>();
    const introduced = new Set(
      (ir.newAtoms ?? [])
        .filter((a) => a.imageable !== false && atoms.get(a.kana)?.emoji)
        .map((a) => a.kana),
    );
    const firstAppearance = new Map<string, { stepId: string; type: string }>();
    for (const lesson of compiled) {
      for (const step of lesson.steps as Array<Record<string, unknown>>) {
        if (step.type === "word_image_mcq") {
          const opts = step.options as Array<{ id: string; word: string }>;
          const word = opts.find((o) => o.id === step.correctOptionId)?.word;
          if (word) {
            const prior = mcqSeen.get(word);
            if (prior)
              out.push({
                lesson: lesson.id,
                kind: "image-debut",
                detail: `${word} gets a SECOND image MCQ (${step.id}; first was ${prior}) — the picture quiz is first-exposure only, use speaking/translate for review`,
              });
            else mcqSeen.set(word, step.id as string);
          }
        }
        const surface = JSON.stringify({
          ...step,
          distractors: undefined,
          acceptedAnswers: undefined,
        });
        for (const kana of introduced) {
          if (!firstAppearance.has(kana) && surface.includes(kana))
            firstAppearance.set(kana, {
              stepId: step.id as string,
              type: step.type as string,
            });
        }
      }
    }
    for (const [kana, first] of firstAppearance) {
      if (first.type !== "word_image_mcq")
        out.push({
          lesson: ir.module,
          kind: "image-debut",
          detail: `imageable word ${kana} first appears on ${first.type} (${first.stepId}) — its image MCQ must be the first-ever appearance`,
        });
    }
  }

  const baseGlossOf = (kana: string): string | null => {
    const irAtom = (ir.newAtoms ?? []).find((n) => n.kana === kana);
    if (irAtom) return `${irAtom.shortGloss ?? ""} ${irAtom.gloss}`;
    const course = (JA_COURSE_ATOMS as ReadonlyArray<{ kana: string; meaningEn: string; shortGloss?: string }>).find(
      (c) => c.kana === kana,
    );
    return course ? `${course.shortGloss ?? ""} ${course.meaningEn}` : null;
  };
  for (const a of ir.newAtoms ?? []) {
    const tile = a.shortGloss ?? a.gloss.split(/[/,;]/)[0].trim();
    if (tile.length > 28)
      out.push({
        lesson: ir.module,
        kind: "gloss-long",
        detail: `${a.kana} match-tile gloss "${tile}" is ${tile.length} chars even after first-segment split — add a shortGloss (≤28 chars)`,
      });
    // Base ⇄ derived sense consistency (Spencer m6 walk 2026-07-23: みる
    // "to see" beside みない "won't watch" reads as two different verbs).
    // The derived tile's content words, negation stripped, must appear in
    // the base atom's gloss.
    if (a.derivedFrom) {
      const base = baseGlossOf(a.derivedFrom);
      if (base) {
        const content = tile
          .toLowerCase()
          .replace(/\b(won't|don't|doesn't|isn't|aren't|not|no|there)\b/g, " ")
          .replace(/[^a-z']+/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 2);
        if (content.length > 0 && !content.some((w) => base.toLowerCase().includes(w)))
          out.push({
            lesson: ir.module,
            kind: "gloss-mismatch",
            detail: `${a.kana} tile gloss "${tile}" shares no content word with base ${a.derivedFrom} gloss "${base.trim()}" — align the sense (shortGloss on either side)`,
          });
      }
    }
  }
  // ── Grammar-point tagging (`exercises:` / `combines:`) ───────────────
  // Known ids = taught here + declared as prior-module. Everything else is
  // a typo that used to pass silently (the old validation covered only
  // `kind: rule` beats).
  const knownPoints = new Set([
    ...(ir.grammarPoints ?? []).map((g) => g.id),
    ...(ir.priorGrammarPoints ?? []),
  ]);
  const pointsOf = (b: IRBeat): string[] =>
    b.kind === "sentence" || b.kind === "capstone" || b.kind === "challenge"
      ? [...(b.exercises ?? []), ...(b.combines ?? [])]
      : [];
  const seenCombos = new Set<string>();
  const comboKey = (pts: string[]) => [...new Set(pts)].sort().join("+");
  for (const lesson of ir.lessons) {
    for (const beat of lesson.beats) {
      const pts = pointsOf(beat);
      for (const p of pts)
        if (!knownPoints.has(p))
          out.push({
            lesson: lesson.id,
            kind: "unknown-grammar-point",
            detail: `exercises/combines names "${p}", which is neither in grammarPoints[] nor priorGrammarPoints[] — fix the typo or declare it`,
          });
      // Inv 26: a challenge beat must present a combination not already
      // drilled. Exact-set repeats are longer-but-familiar, not a stretch.
      if (beat.kind === "capstone" || beat.kind === "challenge") {
        if (pts.length < 3)
          out.push({
            lesson: lesson.id,
            kind: "challenge-not-novel",
            detail: `challenge beat combines ${pts.length} grammar point(s); invariant 26 wants ≥3`,
          });
        else if (seenCombos.has(comboKey(pts)))
          out.push({
            lesson: lesson.id,
            kind: "challenge-not-novel",
            detail: `challenge combination [${comboKey(pts)}] already appeared earlier in this module — vary the shape`,
          });
      }
      if (pts.length) seenCombos.add(comboKey(pts));
    }
  }
  for (const lesson of ir.lessons) {
    const buildable = lesson.beats.filter(
      (b) => b.kind === "sentence" || b.kind === "particle-cloze" || b.kind === "dialogue",
    ).length;
    if (buildable < 6 && !lesson.id.endsWith("-12"))
      out.push({
        lesson: lesson.id,
        kind: "density-short",
        detail: `${buildable} practice beats — compiler pads review to reach 18, but authored practice reads better`,
      });
    // Review lessons carry no challenge beat by design. Prefer the explicit
    // `role:` field; fall back to the legacy id-suffix sniff for m6-era IR.
    const declaredReview =
      lesson.role === "review" ||
      (lesson.role === undefined && lesson.id.endsWith("-12"));
    if (
      !lesson.beats.some((b) => b.kind === "capstone" || b.kind === "challenge") &&
      !declaredReview
    )
      out.push({
        lesson: lesson.id,
        kind: "capstone-missing",
        detail: "no challenge beat (kind: challenge)",
      });
    for (const b of lesson.beats) {
      if (b.kind === "dialogue")
        for (const q of b.questions)
          if (q.options.filter((o) => o !== q.answer).length < 3)
            out.push({
              lesson: lesson.id,
              kind: "dialogue-distractor-synth",
              detail: `question "${q.q}" has <3 real distractors — compiler synthesized fillers; supply 3 real ones`,
            });
      if (b.kind === "rule" && !gpById.has(b.grammarPointId))
        out.push({ lesson: lesson.id, kind: "provenance", detail: `unknown grammarPointId ${b.grammarPointId}` });
    }
  }
  return out;
}
