# FR article glob-order race — 2026-09-10

**Bug.** `fr/courseAtoms.ts` + `curriculum/index.ts` populated the FR atom
registry via eager `import.meta.glob` over `./m*.ts`. Vite sorts a glob's
combined file list **lexicographically** ("m10" < "m2"), not numerically.
`withArticle()` (`grammarHelpers.ts`) reads the registry at *module-eval
time* inside `vocabMcq`/`vocabTextMcq`; a later-numbered module could
evaluate before an earlier module registered its atom, so `withArticle()`
silently fell back to the bare noun — baked into that module's singleton
export. Repro'd with a throwaway probe against a real `vite build()`
output: confirmed the production bundle, not just tests, was hit.

**Fix (the class).** Split each glob into three digit-width-bucketed calls
(`m[1-9]`, `m[1-9][0-9]`, `m[1-9][0-9][0-9]`), merged by spread — same
width ⇒ lexicographic == numeric, recovering true numeric eval order.
Same-class fix: `crossModuleVocabMcq()` (re-implemented in m11/m14/m15/
m16/m17.ts) bypassed `withArticle()` via literal text — 7 stale-bare call
sites corrected.

**Gate.** `fr/__tests__/frArticleBakedSurfaces.test.ts` flags a gendered
noun shown bare outside its home module. Proven to fail by reverting the
digit-bucket fix, then restored.

**`moduleBarGuards.ts` fix.** Its `PRIOR` set lacked the elision-derivation
`getFrRealFormLexicon()` already had, causing a false "non-intro debut"
on an atom's first elided-form reference (`l'école`) — fixed to mirror it.

**Second, deeper race — alternate entry points.** Any file whose first
curriculum-touching import is a raw `./mN` (not `courseAtoms.ts`/
`curriculum/index.ts`) becomes an alternate entry into the same cyclic
graph (`mN.ts` imports `atom` back from `courseAtoms.ts`). Under vitest's
shared (`isolate:false`) worker, whichever import graph is walked first
decides the "true" entry; ES circular-import semantics then skip that
entry module (e.g. m1) mid-evaluation when the canonical glob reaches back
for it — its atoms never register — while siblings (m3/m4/m6) evaluate
fully against the incomplete registry and bake bare text (observed:
"café"). Fix: `import "../courseAtoms";` as the literal first import in
all 19 `mN.test.ts` (m3–m21) + `fr-doctrine.test.ts`. Deeper:
`curriculum/index.ts` ran its **own independent** triple-glob over the
same files — a second uncoordinated entry — fixed the same way. Verified:
with `m22.test.ts` excluded, 15/15 clean runs. `m22.test.ts` and
`m23.test.ts` (both concurrent FR-author-lane files, out of scope, the
latter landed mid-session) each still open with a raw `./m1..` import and
are the only residual sources — recommend the same one-line guard there.

**"Fail loudly" (deferred).** Preferred design: a hard throw in
`withArticle()` on an unregistered atom. Deferred — while the race was
open, a throw during curriculum-module eval (not just test eval) would
crash every file sharing the worker's cache, worse than today's scoped
failure. Revisit once `m22`/`m23`'s test files get the guard too.

**Gates:** `--project curriculum fr` run 5x. First 3 (before `m23.ts`/
`.test.ts` landed): identical, 0/3 bare-café, 331/331 real assertions
passed (file-level "failed" counts were 100% concurrent ES m33/JA m44
background-crashes, stack-traced, not FR). One mid-transition run caught
the known `m22.test.ts` entry-race bare-café directly. Final 2 (identical,
8 failed/1807 passed): zero bare-café — all 8 trace to still-authoring
`m23` content (missing TTS clips, untaught-word prompt, checkpoint count
short by one, recall-before-voicing gap), none touching this fix. `tsc
--noEmit` (fr-scoped): clean. `--project app`: 0 FR-specific failures.
Follow-ons: guard `m22.test.ts`/`m23.test.ts` (and future `mN.test.ts`).
