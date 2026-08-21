# ux-loop

A semi-autonomous UI-quality loop: capture faithful screenshots → let a free
local model enumerate candidate problems → **judge every checkable claim with a
DOM measurement** → a human/frontier model does the taste and ranking. One law
runs through all of it:

> **The objective signal decides; the model never does.** A local model is a
> generator you can run for free and exhaustively. A measurement (or a frontier
> model) is the judge. Never auto-apply the generator's list.

## Two members

### 1. The route loop (marketing / arbitrary routes)

Point it at specific routes and viewports; good for a handful of surfaces you
already suspect.

| Script | Role |
|---|---|
| `capture.mjs` | Device-faithful screenshots (insets + touch + seeds) for a route. |
| `measure.mjs` | Real `getBoundingClientRect` geometry on a mobile surface — the justification behind any spacing/tap-target claim. |
| `overflow-scan.mjs` | Finds elements spilling past the viewport or their own box. |
| `judge-ux.mjs` | Local 122B **enumerates** observable, rubric-checkable problems (never ranks — per `local-model-stack` memory). |
| `judge-suggest.mjs` | Local 122B proposes a concrete fix per issue; feeds `/qa/ux-audit`. |

### 2. The [step-pass](step-pass/) (every lesson step type)

Coverage-driven: walks the whole lesson registry for a reachable route per step
type (23 of 36 today), shoots each across device **and** desktop, and runs the
generator/judge split with a measurement gate that reports the model's
false-positive rate as a per-run trust score. **This is the recommended default
process** — see `step-pass/README.md`.

## The measurement-first verdict (2026-08-21)

The first full step-pass run settled how much to trust the local *vision* model
for this task: on 92 cells its geometry false-positive rate was **100% (76/76
refuted)** and it surfaced **none** of the 8 real (measured) findings. So:

- **Default to measurement-only.** `node scripts/ux-loop/step-pass/run.mjs` runs
  no model — it's fast, free of hallucination, and covers all reachable types ×
  device+desktop.
- **The vision quote is opt-in** (`--quote`). It's still free and still fully
  judged by the measurement, so it costs nothing to add when you want the
  third-person view — just don't trust its eye. Re-check the trust metric if you
  swap in a stronger vision model; that number is exactly how you'd know it got
  better.

## Prereqs

Dev server on `:5173` (step-pass) or the port you pass via `PLAYWRIGHT_BASE_URL`
(route loop), `.auth/user.json` (`npm run test:e2e:auth`), and — only for the
model phases — Ollama serving the 122B vision tier (`local-model-stack` memory).
