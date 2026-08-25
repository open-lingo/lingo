/**
 * m35-neo — the SIXTH module of the JLPT N4 tier. Spine unit `n4-06`
 * (`docs/spine-n4.md` §`n4-06`), "Give & receive II: 〜てあげる/てくれる/
 * てもらう + asking favors".
 *
 * The spine's own headline: **m30's schema × m31's verbs — NO new rule, one
 * composition, drilled until it is reflex.** The learner owns the て+helper
 * slot and the three transfer verbs; this module parks a verb of doing in
 * front of them and every particle rule carries over unchanged.
 *
 *  - **L1, てくれる first and heaviest** — the ordinary way to report a
 *    kindness (せんせいが おしえてくれた); highest-frequency member, the one
 *    English speakers under-produce.
 *  - **L2, てあげる with its politeness trap taught AS the antiPattern** —
 *    ×せんせいを てつだってあげます condescends; textbooks skip this, we
 *    teach the error and L10 supplies the fix.
 *  - **L3, てもらう** — the viewpoint flip ("I got someone to…"), m31's
 *    くれる/もらう mirror applied to actions.
 *  - **L5/L6, THE FAVOR-REQUEST LADDER, pairwise** — casual rungs
 *    (〜て / てくれる？ / てくれない？) then polite (てくれませんか /
 *    てもらえますか vs m8's directive てください). N-way assembly happens
 *    ONLY in review-3, per the RUN-PLAN pairwise standing decision.
 *  - **L7, だけ / しか〜ない** — だけ counts what is there and stays
 *    positive; しか counts what is missing, demands its ない, and REPLACES
 *    が/を outright.
 *  - **L9, favors in motion** — むかえに いく/くる on m19's purpose-に;
 *    たすかった as the thanks-response.
 *  - **L10, offering without the trap** — てつだいましょうか (m24 machinery
 *    + m34's register work) as the correct upward offer.
 *
 * DIALOGUE_SIM ×2 (the richest sim material in the tier — a favor only
 * exists as a turn): L5 moving-day with Ken (はこんでくれない？, casual
 * rungs); L10 after class with Tanaka (offer てつだいましょうか, accept
 * politely — the L2 trap gets its lived contrast).
 *
 * つれる is DEFERRED to m38 (its natural frame is つれていく/つれてくる,
 * which would front-run ていく/てくる) — noted for m38's author.
 *
 * Compiler-pipeline module: pedagogy lives in `ir/m35.ir.yaml`
 * (`node scripts/compile-ir.mjs m35`), laid out by `compileModule` at import.
 * DO NOT hand-edit lessons here — edit the IR and recompile.
 *
 * Shape (inv 25): 12 lessons = 8 teaching + 3 review + 1 challenge, challenge
 * LAST. NO katakana rows, so the compiled order IS the shipped order.
 */
import type { LessonContent } from "@/features/lesson/types";
import { compileModule, type ModuleIR } from "@/features/lesson/data/moduleCompiler";
import m35Ir from "./ir/m35.ir.json";

const COMPILED: LessonContent[] = compileModule(m35Ir as unknown as ModuleIR);
const byId = (id: string): LessonContent => {
  const l = COMPILED.find((x) => x.id === id);
  if (!l) throw new Error(`m35-neo: compiled lesson ${id} missing`);
  return l;
};

export const M35_NEO_LESSONS: LessonContent[] = [
  byId("ja-m35-neo-1"),
  byId("ja-m35-neo-2"),
  byId("ja-m35-neo-3"),
  byId("ja-m35-neo-review-1"),
  byId("ja-m35-neo-5"),
  byId("ja-m35-neo-6"),
  byId("ja-m35-neo-7"),
  byId("ja-m35-neo-review-2"),
  byId("ja-m35-neo-9"),
  byId("ja-m35-neo-10"),
  byId("ja-m35-neo-review-3"),
  byId("ja-m35-neo-challenge"),
];
