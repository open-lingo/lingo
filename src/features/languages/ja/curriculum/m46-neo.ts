/**
 * m46-neo — the SEVENTEENTH module of the JLPT N4 tier. Spine unit `n4-17`
 * (`docs/spine-n4.md` §`n4-17`), "Timing & aspect: 〜間に／〜うちに／
 * 〜ところだ／〜たばかり" (`docs/ja-m46-brief-2026-09-10.md`).
 *
 * Consolidation module: ONE mechanism (a timing/aspect frame riding a noun
 * or verb-form host) spent across four distinct nominal hosts, plus a
 * quantity-drip interleave break and a compound-verb trio:
 *
 *  - **L1, ids `aida-duration`/`aida-ni-point`**: あいだ vs あいだに — same
 *    noun host (間), に is the entire signal between "the whole span" and
 *    "one point inside it."
 *  - **L2**: unrelated interleave break — とちゅう carrier vocab, no new
 *    grammar point (doctrine: never block-teach the four timing frames
 *    back to back).
 *  - **L3, id `uchi-ni-window`**: うちに rides the SAME already-known うち
 *    lexeme (`ja-m6-1-uchi`, m16) widening its own sense range — not a
 *    second homograph. `kind: rule` card only, referencing the atom by id.
 *  - **review-1**: 間/間に/うちに mixed, L1-L3 only.
 *  - **L4, id `tokoro-da-aspect`**: ところだ's three tenses. Cashes in
 *    ところ (`courseAtoms.ts`, was future-tagged with a DEAD
 *    `introducedByLessonId` pointer into the retired `_archive/m9.ts` —
 *    re-pointed to this lesson, the landmine CLAUDE.md itself warns about).
 *  - **L5**: quantity-drip interleave break — ばかり(`bakari-quantity`) +
 *    ずつ(`zutsu-distribution`) + め(`ordinal-me`). め stays UNREGISTERED
 *    as a bare atom (collides with m16's め "eye") — only the two fused
 *    ordinal surfaces ひとつめ／ふたつめ are registered, as
 *    `derivedFrom`-exempt vocab riding the already-taught number atoms.
 *  - **L6, ids `compound-verb-hajimeru`/`compound-verb-tsuzukeru`**:
 *    masu-stem + はじめる／つづける ("start/keep doing X"), riding the
 *    prior-taught verbs はじめる(m33)/つづける(m30). Cashes in はじめ
 *    (noun, "the beginning" — distinct from the verb はじめる). つづく
 *    (intransitive partner of つづける) debuts too, deepening the m33/m41
 *    transitivity-family lens. Dictionary-form ONLY (budget-disciplined).
 *  - **review-2**: mid-third — 間/うちに/ところだ + compound verbs mixed,
 *    semantic clozes only.
 *  - **L7, id `ta-bakari-vs-ta-tokoro`**: たばかり vs たところ pairwise
 *    discrimination — たばかり foregrounds RECENCY, たところ foregrounds
 *    sequence-position. たばかり rides the SAME ばかり atom as L5's
 *    quantity-ばかり (one lexeme, two grammar cards, mirroring m44's
 *    youda-direct-evidence precedent) — deliberately a full lesson apart
 *    so neither primes the other. Vocab: ひさしぶり.
 *  - **L8, ids `mama-stative`/`compound-verb-owaru`**: まま ("as is,
 *    unchanged" — the stative cousin of て-おく／て-ある, m30/m41) +
 *    masu-stem+おわる ("finish doing X"), completing the compound-verb
 *    trio. おわる rides the prior m32 atom untouched. Unlike L6, this
 *    lesson budgets BOTH dictionary and past-tense compound surfaces
 *    (たべおわる／たべおわった) since おわる is a live, ordinary verb.
 *    Vocab: そのまま, いっしゅん.
 *  - **review-3**: full-module mixed review, all 12 grammar points +
 *    carrier vocab (うち/おわる/はじめる/つづける/だんだん) as
 *    already-known.
 *  - **challenge**: あいだに + compound-verb-owaru + mama-stative combined
 *    in one capstone arc, a combo not repeated anywhere else in the
 *    module (inv 26 — every challenge beat's grammarPointId set is
 *    distinct across all 8 teaching-lesson challenges + this capstone).
 *
 * Verb-risk decisions: はじめる／つづける／おわる are confirmed absent from
 * `VERB_ENTRIES` (`conjugationTables.ts`) despite being taught, registered
 * verbs — per m45's own corrected engineering finding, EVERY full
 * conjugated/compound surface needed hand registration as `kind: verb-form`
 * `derivedFrom` newAtoms regardless of `VERB_ENTRIES` membership. Only the
 * surfaces actually drilled are registered: たべはじめる／よみつづける (L6,
 * dictionary form only) and たべおわる／たべおわった (L8, dictionary + one
 * past tense).
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m46.ir.yaml`
 * (`node scripts/compile-ir.mjs m46`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. Lesson-id numbering follows m43/m45's non-skipping convention
 * (1,2,3,review-1,4,5,6,review-2,7,8,review-3,challenge). NO katakana rows,
 * so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m46Ir from "./ir/m46.ir.json";

const COMPILED: LessonContent[] = compileModule(m46Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m46-neo: compiled lesson ${id} missing`);
  return l;
};

export const M46_NEO_LESSONS: LessonContent[] = [
  byId("ja-m46-neo-1"),
  byId("ja-m46-neo-2"),
  byId("ja-m46-neo-3"),
  byId("ja-m46-neo-review-1"),
  byId("ja-m46-neo-4"),
  byId("ja-m46-neo-5"),
  byId("ja-m46-neo-6"),
  byId("ja-m46-neo-review-2"),
  byId("ja-m46-neo-7"),
  byId("ja-m46-neo-8"),
  byId("ja-m46-neo-review-3"),
  byId("ja-m46-neo-challenge"),
];
