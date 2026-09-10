# KO-source learner (Korean speaker → JA, later → ES/FR) — scope 2026-09-10

**Status:** SCOPE (nothing implemented). Builds on the measured audit in
`reverse-teaching-readiness-2026-07-29.md` (still accurate; re-verified 2026-09-10
against source by a read-only agent). This doc adds what changed since July,
the honest sizing, and the decisions Spencer owes before anyone builds.

## What the app can and cannot do today
- Courses are keyed by TARGET language only (`languageConfig.ts:69`, `course.ts:100`,
  routes `/:lang/…`). There is no (source, target) pair. `settings.learning.uiLocale`
  exists but only chrome/i18n/date code reads it — content never does
  (`LOCALIZATION.md:23` names the gap; the promised manifest was never built).
- UI chrome: real i18next layer; `locales/ko.json` is a genuine near-complete
  Korean UI translation (2,218 keys, 49 missing). BUT the lesson surface is weak:
  84 `t()` calls under `src/features/lesson/`, only 5 resolve (no `lesson`
  namespace); `Feedback.tsx` / `SpeakingStepView.tsx` are raw English; ~209 more
  English literals are emitted by builders (`moduleCompiler.ts`, `buildSrsReviewLesson.ts`).
- Grading is instruction-language-clean (id or JA-string comparisons) EXCEPT four
  English-shape couplings that would corrupt grading under Korean glosses:
  `jaAcceptedForms.ts:127` (`/^to /` on meaningEn decides verb class),
  `matchPairsFloor.ts:86,402,476` (Latin regexes), `jaSurfaceForms.ts:91`,
  `moduleCompiler.ts` cue regexes + dedupe keys. All small, named fixes.
- TTS keyed `ja:<text>` — every clip transfers. Romaji ruby carrier is a plain
  string, so hangul readings are schema-compatible (product call, not a blocker).
- Content English: ~15k strings for JA alone (10k IR m6–m29, 2.5k hand-TS m1–m5/m30,
  1k atom glosses, 665 map titles, ~620 misc). m30–m38 (N4, shipped after the audit)
  add an unmeasured amount on the same shapes; ES/FR/KO courses are not counted.

## Effort ladder (pick a rung)
| Rung | What the friend gets | Work | Size |
|---|---|---|---|
| 0 | Korean chrome, English lesson content, romaji | fix the `lesson.*` namespace + ~74 literals + builder literals; nothing content-side | days; benefits every course |
| 1 | KO→JA pilot: m1–m8 in Korean | rung 0 + extraction pipeline (§3c of the readiness doc) + 4 grading de-couplings + cue→structured field + MT wave for ~8 modules + Korean QA | ~2–3 weeks incl. plumbing; ~3.5k strings |
| 2 | Full KO→JA (m1–m38) | rung 1 + MT wave over the rest + coverage ratchet + hangul-ruby option | +2–3 weeks; ~17k strings / ~70k words |
| 3 | KO→ES, KO→FR | same catalogs mechanism reused; ES/FR content volumes unmeasured (ES has 20 modules, FR 10) | ~1–2 weeks each after rung 2 |
| ✗ | KO→EN | no English target course/TTS corpus exists — a from-scratch course build | months; not a translation pass |

## Where local models fit
- First-pass MT of the sidecar catalogs: `qwen3.5:122b-a10b` handles ko/ja/en; shisa-70b
  is JA/EN only. Local drafting is $0 but must be QA-gated: a Sonnet reviewer pass per
  module + the friend (or Payton, the KO tester) reading a sample. Pin non-MLX tags and
  put category lists in prompts (the emoji-refit lesson: schema `enum` alone is ignored).
- Staleness is mechanical (en-source hash per entry), so re-runs only re-translate diffs.

## Decisions Spencer owes before rung 1
1. **The friend's profile.** If they read English comfortably, rung 0 is most of the
   value at ~1/20th of the cost; rung 1 only pays if English instruction is a real barrier.
2. **Pilot range.** m1–m2 are kana rows (hand-TS, chrome-like text); m3–m5 hand-TS;
   m6+ IR (cleanest to extract). Recommendation: pilot = m1–m8 so the friend can start
   at the beginning; accept that m1–m5 need a hand-TS extractor branch.
3. **Readings.** Ship romaji in v1 (Korean JA pedagogy moves to raw kana fast) and add
   hangul ruby as a setting later — or require hangul from day one.
4. **Who QAs Korean.** Payton (KO tester) vs the friend vs Sonnet-only.
5. **Rule prose.** Translate grammar explanations (~209 rules + 920 example lines +
   ~167 "like English X" comparisons that need re-anchoring to Korean, not translating)
   or keep rules in English and translate only glosses/prompts for the pilot.

## Recommendation
Do rung 0 now (it is shared debt and helps the ES/FR/KO learners too), then build the
extractor + the four de-couplings as one PR, then run the MT wave one module at a time
through the same one-lesson-per-agent loop used for authoring. Start with m6–m8 (IR)
to prove the pipeline, backfill m1–m5 second.

Related: `reverse-teaching-readiness-2026-07-29.md` (measurements, §3c architecture,
§4 D1–D8 authoring rules already binding), `LOCALIZATION.md`, `ko-handoff-payton-2026-09-09.md`.

## Decisions inferred 2026-09-10 (Spencer: "fulfill the goal of korean to other language support")
Per the standing rule (infer from the project goal + docs, record, proceed), the five
decisions above are resolved as follows until Spencer overrides:
1. **Profile:** unknown → build rung 0 first regardless (shared debt, every course benefits),
   then rung 1. Rung 0 lane dispatched 2026-09-10 (`docs/ko-source-rung0-2026-09-10.md`).
2. **Pilot range:** m1–m8 (the doc's own recommendation; the learner starts at the beginning).
3. **Readings:** romaji in v1; hangul ruby as a later setting (schema-compatible, product call).
4. **QA:** Sonnet reviewer per module + a Payton sample; the friend reads when available.
5. **Rule prose:** pilot keeps grammar rules in English; translate glosses/prompts/cues
   only (cheapest reversible slice; re-anchoring "like English X" comparisons is a
   separate pass once the pilot proves the catalog mechanism).
Order: rung 0 → extractor + 4 grading de-couplings (one PR, after the JA authoring lane
is quiet because `moduleCompiler.ts` is shared) → MT wave one module at a time.
