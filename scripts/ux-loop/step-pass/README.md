# Step-Type UX Pass

A third-person UI review of **every reachable lesson step type**, across device
**and** desktop viewports, that stays honest by never letting one model's opinion
decide. The local vision model is a free, exhaustive *generator*; a DOM
measurement is the *judge*. This is the [ux-loop](../) pattern extended from
"a few marketing routes" to "all 36 step types", with a measurement gate bolted
on so we get away from single-model blindness without inheriting single-model
hallucination.

## Why it exists

The mobile gate's route matrix visits **2** step types out of 36 (all
`ja-m4-neo-1`). Everything else in the course renders a step type no automated
check has ever looked at. And a vision model pointed at a screenshot will
confidently invent geometry defects ("the badge is clipped", "the X is flush to
the edge") that aren't there. So:

- **Coverage** comes from walking the whole lesson registry for a reachable
  `(lessonId, stepIndex)` per type — 23 of 36 are deep-linkable today.
- **Trust** comes from measuring the pixels. The model proposes; the DOM
  disposes.

## The pipeline

```
capture  → screenshot each (step type × viewport), device-faithful (insets+touch)
QUOTE    → local 122B vision model proposes candidate issues, each tagged with a
           machine-checkable claim_kind (free, so let it be exhaustive)
MEASURE  → a DOM getBoundingClientRect probe finds the ground truth independently
CLASSIFY → a quote is CONFIRMED only if a measurement backs it; an unbacked
           MEASURABLE quote is a REFUTED false positive; a measured fact no quote
           mentioned is a model MISS; a TASTE quote (hierarchy/contrast/…) is
           queued for a human/frontier model — never auto-anything.
```

The seven confirmable, measurable kinds: `edge-bleed`, `clipped`, `tap-target`,
`truncation`, `overflow`, `cta-fold`. (`reflow-on-submit` is deliberately in the
taste bucket — faithfully measuring it needs each step *answered correctly* first,
which a single static render can't do; clicking a raw CTA produces phantom
deltas. A future per-step answerer can promote it.)

Every confirmed finding is measurement-true. The model's contribution is a
human-readable description on the findings it corroborates, plus the taste queue.

## The trust metric — and what the first full run actually said

Because every measurable model claim is checked against geometry, the run reports
the model's **false-positive rate** (refuted / measurable claims) for free.

The first full run (`v2-2026-08-21`, 23 types × 4 viewports, 92 cells) was
decisive: **the 122B's geometry false-positive rate was 100% (76/76 refuted)**,
and every one of the **8 confirmed findings was measured-only** — the model
surfaced *none* of the real defects. Its taste queue was 371 items but 369 were
"minor" and the 2 "notable" ones were speculative. Read plainly: a pure vision
pass here would have handed you 76 wrong fixes and caught 0 of the real 2.

So the doctrine has a number behind it now: **the measurement is the product;
the vision quote is an optional, currently low-value third-person view.** That is
why `--quote` is opt-in (see below). Trust the model's *eye* not at all; its
*taste* only weakly. The trust metric is what tells you that, per model, per run —
re-check it if you ever swap in a stronger vision model.

## What the first run found (and what we did)

Eight confirmed, all measurement-true:

- **`symbol_trace` "Skip this letter"/"Clear" — 19–21px tap targets on all 4
  viewports.** Real, cross-cutting, under the 24px WCAG floor. **Fixed** 2026-08-21
  (`min-h-[24px]` hit-area floor; px not rem — the laptop-720 `--font-base` drop
  made a rem floor resolve to 23px, exactly the CLAUDE.md landmine). Re-measured
  clean on all four.
- **`match_pairs` — 131px stage overflow @ 375×667.** Known and **by design**
  (CLAUDE.md lists it; the stage scroller handles it). No change.
- **3 trivial polish overflows** (7–11px: `listening_build`, `dialogue_listen`).
  Content-specific, scroll cleanly, on shared high-traffic step views. Held on
  purpose — chasing 9px with a padding change that ripples across every lesson
  risks more than it fixes. Logged, not silently dropped.

## Run it

Prereqs: dev server on `:5173`, `.auth/user.json` (`npm run test:e2e:auth`),
Ollama serving the vision model, and the coverage map.

```bash
# 1. (re)build the coverage map — one reachable route per step type
STEP_COVERAGE_EMIT=1 npx vitest run \
  src/features/lesson/dev/stepTypeCoverage.emit.test.ts

# 2. run the pass — measurement-only by default (fast, trustworthy, no model)
node scripts/ux-loop/step-pass/run.mjs

# scope it
node scripts/ux-loop/step-pass/run.mjs --types match_pairs,grammar_rule
node scripts/ux-loop/step-pass/run.mjs --viewports iphone-se,desktop-1080p
node scripts/ux-loop/step-pass/run.mjs --quote        # add the vision third-person view
```

Output → `artifacts/ux-loop/step-pass/<stamp>/`:
`report.html` (open this — grouped by step type, a card per viewport with the
shot, confirmed findings, taste queue, refuted count, and the trust metric),
`findings.json` (everything), `REPORT.md` (summary).

## Coverage: 23 of 36 reachable

The other 13 are dynamic/engine-generated (`kanji_reveal` from the review
builder, `conjugation_cloze` from the engine), FR types that only fire in modules
past the shipped `fr-m1` (`gender_sort`, `aspect_choice_cloze`, `agreement_chain`,
`liaison_listen`), or have no static producer at all (`dialogue_sim`,
`tap_the_word`, `word_map`, `stress_pattern`, `pretest_mcq`, `fill_blank`,
`symbol_production`). The report lists all 13 by name — no silent caps. Extending
reachability (sourcing them from the practice surfaces / the review builder) is
the obvious follow-up.

## Files

| File | Role |
|---|---|
| `classify.mjs` (+`.test.mjs`) | PURE confirm/refute core. The measurement decides; the model corroborates, is refuted, or is queued. 10 tests. |
| `measure.mjs` | Device-faithful DOM geometry probe (insets+touch on phones, plain window on desktop). CLI-runnable per route. |
| `quote.mjs` | The 122B vision generator; proposes issues tagged with a machine-checkable `claim_kind`. CLI-runnable per shot. |
| `run.mjs` | Orchestrator: capture+measure (one browser pass) → quote → classify → report. |
| `report.mjs` | Renders the self-contained HTML report. |
| `../../../src/features/lesson/dev/stepTypeCoverage.emit.test.ts` | Builds the coverage map by walking every lesson through the real content pipeline (vitest, gated behind `STEP_COVERAGE_EMIT=1`). |

## Doctrine

Same law as the doc-hygiene loop: **the objective signal decides, the model
never does.** A local model is a generator you can run for free and exhaustively;
a frontier model or a measurement is the judge. Never auto-apply the generator's
list.
