/**
 * m20-neo — COMPARISONS I: のほうが…より. The winner goes first, marked ほうが;
 * the loser hangs off より; and NOTHING inflects — Japanese has no comparative
 * ending at all, which is the good news English speakers need told out loud.
 * Spine tile n09.
 *
 * The module's argument is that a comparison is two nouns and a predicate the
 * learner already owns. ほう is an ORDINARY NOUN ("the ~ one"), which is why it
 * takes の in front and が behind; より is one more particle in the slot after
 * the loser. The reduced 「AはBより〜」 and the bare 「Bより〜」 are what people
 * actually say, so they land in L2, immediately after the teaching frame.
 *
 * 「AとBと どっちが〜？」 asks it, and the answer comes back with ほうが and no
 * より at all. どっち is the plain default; どちら is its polite twin and gets
 * its register home with a stranger in L9 — the spine's "register pair".
 *
 * The ledger row also owes numbers 100-10000 and 〜こ. The regular cells
 * compose from numbers the learner owns (ごひゃく, よんせん, いちまん); the five
 * that do NOT compose — さんびゃく, ろっぴゃく, はっぴゃく, さんぜん, はっせん —
 * are atoms of their own, and `m20-neo.test.ts` checks every hundred/thousand
 * surface against the number in front of it.
 *
 * いちばん is deliberately ABSENT: n09 is the INTRO beat of the comparison
 * spiral and n14 (m26) is its deepen beat.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m20.ir.yaml`
 * (`node scripts/compile-ir.mjs m20`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m20Ir from "./ir/m20.ir.json";

const COMPILED: LessonContent[] = compileModule(m20Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m20-neo: compiled lesson ${id} missing`);
  return l;
};

export const M20_NEO_LESSONS: LessonContent[] = [
  byId("ja-m20-neo-1"),
  byId("ja-m20-neo-2"),
  byId("ja-m20-neo-3"),
  byId("ja-m20-neo-review-1"),
  byId("ja-m20-neo-4"),
  byId("ja-m20-neo-5"),
  byId("ja-m20-neo-6"),
  byId("ja-m20-neo-review-2"),
  byId("ja-m20-neo-7"),
  byId("ja-m20-neo-8"),
  byId("ja-m20-neo-9"),
  byId("ja-m20-neo-review-3"),
  byId("ja-m20-neo-challenge"),
];
