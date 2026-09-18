---
name: lane-briefing
description: How to brief and dispatch a subagent lane in Open Lingo, and what every lane must be told. Read BEFORE any Agent/Task dispatch, and before writing a brief for the local models. Covers the six questions a brief must answer, the mandatory model choice, the skills a lane must be told to invoke, the off-limits list (no git add -A, no bare stash, no editing the main checkout, no monitor polling), scope collision with concurrent lanes, and how to brief a local model.
---

# Briefing a lane

Spencer, 2026-09-15: *"before every agent dispatch, seed purpose, project +
language context, tools, format; thin briefs waste laps."* The evidence: the #165
lane built a shared component for the wrong step type; a b13 hypothesis was built
on a `blocked` flag that wasn't the cause; agents re-discovered the repo layout
every lap; three lanes with no `model:` cost roughly a million subagent tokens in
one day.

Write the brief to a file in the session scratchpad and reuse it across every
agent in the lane.

---

## 1. The six questions a brief must answer

1. **Purpose + exact output shape.** What decision does this lane's output feed,
   and what does the answer look like (a table with these columns; a diff; a
   number)? "Investigate X" produces prose nobody can act on.
2. **Project context as paths, not descriptions.** The absolute paths it should
   read first. Tell it `docs/INDEX.md` and `docs/CODE_MAP.md` exist rather than
   describing the architecture.
3. **Language/course context.** Which course, which modules, where the atoms and
   gates live, what the runtime actually does with the content.
4. **Tools it should know.** The dev server command, `scripts/shot.mjs` +
   `SHOT_OUT`, that `?step=N` is **0-indexed**, `git log --grep "TestFlight #"`,
   the grep recipes that work, and what is read-only.
5. **What makes it faster.** A fixed taxonomy for its verdicts, item ranges,
   caps, and: *return the result as text **and** write it to the scratchpad* —
   the harness sometimes blocks writes, and the parent reads the message, not
   files.
6. **What it must NOT do.** See §3.

## 2. Model is mandatory

**HARD RULE: never call `Agent` without `model:`.** A dispatch with no override
inherits the lead model. Three such lanes on 2026-09-09 cost ≈1M subagent tokens
in a day; Spencer: "we used way too much usage."

- `model: "sonnet"` — build, author, generate-assets, run-a-script, mechanical
  edit, inventory, triage-label lanes. This is the default choice.
- `model: "opus"` — at most, and only for lanes whose job is judging or reading
  screenshots.
- The lead (Fable) reserves itself for merge and review decisions and **never
  runs a lane itself**.
- Leave `CLAUDE_CODE_SUBAGENT_MODEL` unset — it unconditionally overrides
  per-agent `model:`.
- Crop screenshots to the region under test before reading them (`sips -c`). One
  playtest pass per lane; re-shoot only the screen a fix touched.

**Bulk content never runs inline.** Lesson bodies, module YAML, drill banks, clip
lists — anything formulaic over ~100 lines — goes to Sonnet, one or two lessons
per agent, in parallel, each iterating on its own gate until clean. If a gate
fails on an agent's draft, send the failure back or spawn a fresh fixer; do not
rewrite it yourself.

## 3. The off-limits list — put this in every brief

- **Never `git add -A` or `git commit -a`.** The tree usually has several
  concurrent sessions' dirty files. Stage explicit paths only; for a shared file
  use a scoped partial commit (`git commit -m "…" -- <your paths>`). Don't
  `git reset` or switch branches.
- **Never bare `git stash` / `git stash pop`.** The stash stack is shared across
  every worktree and another session may pop yours. Prefer a temporary WIP commit.
  If you must stash: `git stash push -u -m "<unique-tag>"`, capture the SHA from
  `git stash list --format='%H %gs'`, restore with `git stash apply <sha>`, then
  drop it by re-finding the tag.
- **Confirm which checkout you are editing.** The local coder's harness once
  resolved cwd to the primary repo and edited `main` instead of the worktree —
  several files had to be discarded. Run from the intended root; verify with
  `git -C <path> diff` that your edits landed where you think.
- **No commits or pushes** unless the brief explicitly grants them.
- **No polling a monitor.** Use an until-condition or report status and stop;
  don't burn turns waiting.
- **Return text, not files**, as the primary deliverable. Do not write report,
  summary or findings markdown unless asked — the parent reads your message.
- **No guessing a location without a grep hit**, and no proposing fixes to
  compiled/generated files (see `codebase-search` §6).
- **Don't touch `~/.claude/**` or `.env*`.**

## 4. Scope collisions

Several lanes run concurrently on the same tree. A brief must name **the files
this lane owns** and **the files it must not touch**.

- Before dispatching, `git status` and check whether another session is already
  mid-fix on the same ask — b13 #92 found exactly that, with a comment quoting
  the same feedback item.
- **Tell the lane to scope its gate run to its own directories and to state which
  failures belong to other lanes.** Two recent lanes reported 6 and 9 failures
  that were entirely other lanes' in-flight edits to files they never touched.
  A lane that reports "3355 passed, 9 failed" without attributing the 9 has not
  reported a result.
- **Commit each lane to the branch as it lands**, with explicit paths — not at
  the end of the session. A `/private/tmp` worktree vanished on a macOS update
  with ~25 uncommitted files; only the committed branch survived. (Recovery is
  possible by replaying `Edit`/`Write` inputs from the session `.jsonl`, and took
  ten minutes — but don't rely on it.)
- Before claiming a commit is self-contained, check that every **new import
  resolves to something tracked at HEAD**, and build once in a detached worktree.
  `9d782f42` staged one file that imported an untracked file from a concurrent
  session; it compiled in the dirty tree and broke a fresh checkout days later.

## 5. Tell the lane which skills to invoke

Project skills in `.claude/skills/` are auto-discoverable — a subagent sees them
in its skill list and can invoke them with the `Skill` tool (verified). But
discovery is a coin flip on wording, so **name them in the brief**:

> Invoke the `mobile-ui-verify` skill before measuring anything, and
> `regression-classes` before you report done. Both are at
> `.claude/skills/<name>/SKILL.md` if the Skill tool isn't available to you.

Pick per lane:

| Lane kind | Name these |
|---|---|
| any fix lane, at the end | `regression-classes` |
| locating code, auditing a subsystem | `codebase-search` |
| sizing, layout, screenshots, furigana | `mobile-ui-verify` |
| curriculum, glosses, atoms, tiles, TTS text | `content-change` |
| pushing / building / uploading | `release-lap` |
| pulling and triaging TestFlight | `feedback-triage` |

If a lane's `tools:` allowlist omits `Skill`, it cannot invoke any of them — paste
the relevant section into the brief instead. `.claude/agents/` is **gitignored**
in this repo, so do not rely on an agent definition's frontmatter to preload
skills; it won't exist on another machine or in a fresh worktree.

## 6. Briefing a local model

Different rules — local models get data, not code.

- **Extract the rows to JSON first** (word, gloss, sentence, module, neighbours)
  and feed rows, not repo context. State the product rules in plain language
  (closest 1-to-1 US English, speak like an average 30-year-old, object-drop is
  fine, one clip per surface) plus the course position. No pasted code, no long
  docs. *"It doesn't need as much code context, just the json."*
- **Let it propose the replacement**, not just a verdict. Require structured
  output: one JSON object per row, fixed keys (`verdict`, `reason`,
  `replacement`, `confidence`), low temperature, a few worked examples, 20–50
  rows per call.
- **Set `num_ctx` explicitly.** Ollama defaults to 4096 regardless of the model's
  advertised maximum and silently truncates — which surfaces as "API returned an
  empty or malformed response". Use the `-256k` tags via `claude-local`
  (`coder`→`qwen3-coder-next-256k`, `judge`→`qwen3.5-judge-256k`,
  `gemma`→`gemma4-31b-256k`, `qwen27`→`qwen3.8-27b-256k`). Never cap at 64k.
- **Thinking is per-model, not a blanket setting.** The 122B judge needs
  `think:false` at the top level (not inside `options`) — with thinking it
  produced 60–80% empty outputs at 200–435 s/lesson. `gemma4:31b` and
  `qwen3.8:27b` do better *with* thinking. Say which in the brief.
- **Judge reliability is per language.** `qwen3.8-27b-256k` with thinking over ES
  m21–m38 scored **0.94 precision** (32 true / 2 false over 180 lessons) — use it
  for ES/FR sweeps. On KO/JA it is a gross-error detector only, never a reviewer:
  a v1 run hit ~10% precision, called standard Revised Romanisation wrong and
  denied 짜다 = "salty". Words-audit precision was 90.6% against 42% on sentences —
  its residual errors are dictionary facts (POS, register, primary sense,
  frequency) it cannot see.
- **Never trust a local coder's self-report.** It fabricated success on 3 of 5
  first runs. The driver reads `git diff` itself and confirms which checkout got
  the edit. Keep it to ≤5 files per run, and never number lines when pasting code
  for in-place editing.
- A frontier model verifies a sample before anything reaches a learner; that
  sample's precision decides whether the batch ships. This is not optional.
- Give it **slot choices, not free-form generation** — JS assembles the sentence,
  the model picks enum'd slots. Spend the judgment on the inventory (the word
  pool), not on validating the output.

## 7. When Spencer is in the loop

- **He is walking lessons:** fix each finding inline immediately, append every
  failure to the ledger, never block his loop on design debate, audit after the
  walk ends. *"Just fix these inline as we go, I will keep submitting, document
  the failure and then we can course audit after."* When he's blocked, offer the
  next queued quick task unprompted.
- **Before presenting a decision list:** investigate every item, resolve what you
  can resolve yourself, and surface only genuine judgment calls — each with your
  own stated position. *"Investigate what you are suggesting me and then only give
  the items that need my weigh in."*
- **Multi-part message:** enumerate **every** actionable clause into the todo list
  before starting, and verify each is done or explicitly deferred before reporting
  the message handled. A dropped clause has cost a full session lap.
- **Device/infra loops:** verify actual state with a command before prescribing
  steps, and report status during long waits without being asked.
- **Quantify risk:** blast radius and cost as numbers, not assurances.

## Lane toolset (2026-09-18)

Measured on three finished lanes: SYNC 162 tool calls/33min/12.2s per call, FB30
273/36min/7.9s, CALIB 112/14min/7.7s. Time per call is model round-trip latency,
so the two levers are FEWER calls and SMALLER results — not more verification.
Tell every lane about `scripts/lane/`:

- `test.sh <files/dirs>` — scoped vitest, failures + totals only (not the full
  log); `--project curriculum|app`, `--tsc` for errors-only typecheck.
- `find.mjs "<query>" [--symbol NAME] [--lang ja|ko|es|fr]` — one-call code
  search, confirmed candidates only, top 12; `--lang` also locates a sentence
  in the emitted course content (lesson id + 0-indexed step).
- `step-url.mjs "<sentence or lessonId>" --lang ja` — dev `?step=N` URL(s) for
  a screenshot sentence, 0-indexed, in one call.
- `stats.mjs <transcript.jsonl>...` — run it on your own transcript before
  reporting done; it prints the same table used to measure the three lanes
  above.
- `sim-proof.sh "<lessonId>?step=N" [--scales 100,125] [--simulate build]
  [--replay <golden>] [--port 54xx] [--lane NAME]` — ONE call proves a step
  on the real 15 Pro Max simulator: queues on `$S/sim.lock` (≤15 min wait) so
  two lanes never fight over the one simulator, runs on an ISOLATED dev
  server port (a shared default port silently bound by another worktree
  reads as "no probe report"), and prints ONE compact `scale | verdicts |
  screenshot | fit-scale | overflow px` table instead of a manual
  boot/tap/probe/shot/replay/compare pass (measured: GHOST made ~250 raw
  Bash calls doing this by hand).

And the four efficiency rules, restated in every brief: batch independent
commands into one call; `tsc` at most twice; scoped vitest at most 4 runs;
never dump a file >200 lines or a test log unfiltered.

- **Module gate is fast by default (2026-09-18).** `npm run module-gate -- mN --compact` no longer runs the whole 19k-test suite; `MODULE_GATE_FULL=1` opts in (preflight already gives CI parity before a push). Run the gate ONCE per module after its edits are final, never per sentence. Its TTS-deck stage rewrites `../lingo-data/data/test_decks/` — copy that directory aside first if the repo is dirty.
- **Local-judge runs are the slow thing, not tests.** A 31B judge scores ~6–9 s per sentence; scope every judge run to the rows you changed and never re-judge unchanged rows to "verify".
