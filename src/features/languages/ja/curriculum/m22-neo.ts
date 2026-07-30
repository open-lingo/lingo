/**
 * m22-neo — BODY, HEALTH & HELP. Spine tile s17.
 *
 * The module's argument is that Japanese does not let you OWN a pain. The body
 * part is the thing that IS painful and it takes が — 「あたまが いたい」, the
 * head is painful — and いたい is an ADJECTIVE, so を is not a stylistic slip
 * but a sentence that does not parse. Put a person in front and both particles
 * work at once: 「わたしは あたまが いたい」, は for who and が for which part.
 * A symptom you HAVE simply EXISTS: 「ねつが ある」.
 *
 * Health is also where register stops being decoration, so the second half of
 * the module runs the clinic and the pharmacy in です・ます: L6 describes
 * symptoms politely, L9 asks for medicine with ください, L10 is what the doctor
 * tells you NOT to do (ないでください — the spine's named spend) and L11 is the
 * question you actually want to ask back (〜ても いい？).
 *
 * **は "tooth" and かぜ "a cold" appear NOWHERE**, by Spencer's ruling of
 * 2026-07-27 and for a mechanical reason: は resolves to the topic particle and
 * かぜ to 風 "wind", so both are homograph LOSERS that no token can identify and
 * nothing can schedule. `homographTeaching.test.ts` fails the build on anyone
 * who tries. **て "hand" IS taught**, after verifying rather than assuming: the
 * whole compiled course contains zero bare て tiles, because the tokenizer is
 * longest-match-first and every て-form in use has its own atom row.
 *
 * The 本 counter drips here as ordinary vocabulary (RUN-PLAN reconciliation,
 * `counter-hon` m21→m22). **Every 本 cell is a WHOLE ATOM**: the base form ほん
 * is already the m3 atom for "book", which owns the kana in
 * `JA_COURSE_ATOMS_BY_KANA` (first-wins + ruling table),
 * so nothing can compose — 「ごほん」 would tile a library. 「にほん」 is banned
 * three times over. `m22-neo.test.ts` checks every 〜ほん surface against the
 * number in front of it.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m22.ir.yaml`
 * (`node scripts/compile-ir.mjs m22`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 13 lessons = 9 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows — the katakana programme ended at m11, so the
 * compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m22Ir from "./ir/m22.ir.json";

const COMPILED: LessonContent[] = compileModule(m22Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m22-neo: compiled lesson ${id} missing`);
  return l;
};

export const M22_NEO_LESSONS: LessonContent[] = [
  byId("ja-m22-neo-1"),
  byId("ja-m22-neo-2"),
  byId("ja-m22-neo-3"),
  byId("ja-m22-neo-review-1"),
  byId("ja-m22-neo-5"),
  byId("ja-m22-neo-6"),
  byId("ja-m22-neo-7"),
  byId("ja-m22-neo-review-2"),
  byId("ja-m22-neo-9"),
  byId("ja-m22-neo-10"),
  byId("ja-m22-neo-11"),
  byId("ja-m22-neo-review-3"),
  byId("ja-m22-neo-challenge"),
];
