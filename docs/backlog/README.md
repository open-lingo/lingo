# The backlog — one file, machine-readable, sorted

**Status:** LIVE · started 2026-07-28 · this is the single place outstanding
work is recorded. `docs/followups.md` and the "Open" sections of
`docs/learner-sim/TRIAGE.md` are now HISTORY — everything live from them was
migrated here. Do not add new items there.

## Files

| file | what |
| --- | --- |
| `items.yaml` | every open item, one record each |
| `README.md` | this — the schema and the conventions |

Query it with `node scripts/backlog.mjs` rather than reading the YAML top to
bottom:

```
node scripts/backlog.mjs                  # everything, sorted worst-first
node scripts/backlog.mjs --next           # low-hanging fruit: high value, low effort
node scripts/backlog.mjs --tag module/m12 # one module
node scripts/backlog.mjs --tag page/trainer
node scripts/backlog.mjs --area engine
node scripts/backlog.mjs --severity blocker
node scripts/backlog.mjs --id B014        # one item, full detail
node scripts/backlog.mjs --stats          # counts by severity / effort / area
node scripts/backlog.mjs --check          # schema validation (run before committing)
```

## Record schema

```yaml
- id: B001                    # stable, never reused, never renumbered
  title: one line, states the DEFECT not the fix
  status: open                # open | fixed | wontfix | note | decision-needed
  severity: blocker           # blocker | major | minor | note
  effort: S                   # XS | S | M | L | XL   (cost to CORRECT)
  confidence: verified        # verified | reported | suspected
  area: content               # content | engine | ui | data | tooling | pedagogy
  tags: [module/m12, lesson/ja-m12-neo-1, step/grammar_rule]
  found: 2026-07-28
  source: learner-walk-2      # who/what found it
  detail: >
    What is wrong, from the LEARNER's side where possible.
  evidence: >
    The concrete thing that proves it. A step id, a count, a quote.
  fix: >
    Sketch only. Not a promise of approach.
  blocked_by: [B007]          # optional
  note: >                     # optional — Spencer's own words, kept verbatim
```

### severity

| value | means |
| --- | --- |
| `blocker` | the learner cannot proceed honestly — must guess, or is asked for something never taught |
| `major` | teaches something wrong, contradicts an earlier card, or wastes a whole surface |
| `minor` | friction, ugliness, a missed chance to teach |
| `note` | a decision, a preference, or a thing deliberately left alone. Not work. |

### effort — the difficulty rating

| value | means |
| --- | --- |
| `XS` | one line, one file, no test needed |
| `S` | one file, contained, existing tests cover it |
| `M` | several files or a content re-author, needs a new test |
| `L` | needs a design decision first, or touches a shipped contract |
| `XL` | new subsystem / new step type / engine work |

### confidence

`verified` — reproduced here, with the evidence in the record.
`reported` — a walker or Spencer said it; plausible but not re-derived.
`suspected` — inferred from adjacent facts. Check the instrument first.

> **Check the instrument before believing an absence.** Twice now a simulated
> reader has reported that the course never teaches X when the EMITTER was
> hiding X. Anything tagged `confidence: reported` about something *missing*
> gets verified against the source before it gets fixed.

### tags

Free-form but conventional, and always lowercase:

- `module/mN` — always add one when it applies
- `lesson/<lesson id>` — exact id, e.g. `lesson/ja-m13-neo-1`
- `step/<step type>` — `step/build_sentence`, `step/grammar_rule`, `step/translate`, `step/conjugation_transform`, `step/dialogue_listen`, `step/particle_cloze`
- `page/<surface>` — `page/trainer`, `page/learn-map`, `page/lesson-player`, `page/practice-hub`
- `system/<thing>` — `system/srs`, `system/tts`, `system/kanji`, `system/romaji`, `system/gating`
- `class/<recurring shape>` — used to spot repeats, e.g. `class/untaught-before-required`, `class/test-pins-the-bug`

## Conventions that keep this useful

1. **One defect per record.** If a scan turned one report into thirty
   instances, that is ONE record with the count in `evidence`.
2. **Title states the defect, never the fix.** "が is required from m7 and
   explained in m16", not "add a が card".
3. **Never delete a record.** Flip `status` to `fixed` / `wontfix` and leave
   it. The history is the point — this file is also the record of what kept
   going wrong.
4. **`note` is not work.** Spencer's rulings and preferences live here so they
   are not lost, but they never appear in `--next`.
5. New items from a Spencer play-through get `source: spencer-play` and land
   at the bottom; renumber nothing.
