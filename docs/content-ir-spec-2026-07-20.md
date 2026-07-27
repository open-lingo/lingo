# Content IR + deterministic compiler — authoring pipeline v2 (2026-07-20)

**Status:** APPROVED (Spencer, 2026-07-23) — YAML IR confirmed; format choice is delegated to the authoring agent (whatever is easiest to compile deterministically). Supersedes the "one agent writes final TS" flow for neo modules.

Spencer's directive: split authoring into (1) a content author that produces the
whole module's teaching substance, and (2) a **deterministic compiler** that lays
it out into lessons. The compiler is where the layout invariants (density, variety,
tails, capstone, provenance) are satisfied **by construction** — the same rules
`moduleBarGuards` currently *checks* become the compiler's *generation* rules.

```
m<N>.ir.yaml  ──[ compile-module.mjs ]──▶  m<N>-neo.gen.ts  ──▶ wired + gated
  (phase 1: LLM,          (phase 2: deterministic —      (phase 3: module-gate +
   whole module,           step-type assignment,          thin LLM naturalness
   pedagogy only)          ordering, tails, capstone,     verify)
                           teach-first check, codegen)
```

## Why YAML, not free markdown
The IR is **structured YAML** (readable like markdown, parseable like JSON). A
deterministic compiler can't reliably parse free prose; YAML keeps it
human-reviewable — Spencer QAs the *content* here, before a line of TS exists —
while giving the compiler typed fields. Provenance is a first-class field, which
is how teach-first (invariant 33) + hide-the-old-course get enforced at the source.

## Schema

```yaml
module: m6
title: "Negatives & Existence"
register: plain                 # plain | (later) polite-layer
priorNeoModules: [m3, m4, m5]   # taught-set = intro-step words from these (NEO only, never old tags)

# Every atom m6 INTRODUCES. Nothing may appear in a lesson surface unless it is
# here OR in the prior-neo taught-set. The compiler tokenizes every `ja` and fails
# on any word without provenance (this is the teach-first guarantee).
newAtoms:
  - kana: たべない
    romaji: tabenai
    gloss: "won't eat / don't eat"
    imageable: false            # true → MUST debut on word_image_mcq (inv 30)
    kind: verb-form             # vocab | verb | verb-form | particle | grammar-chunk
    derivedFrom: たべる          # for conjugated forms — links to the base atom
  - kana: ある
    romaji: aru
    gloss: "to exist (inanimate)"
    imageable: false
    kind: verb
    verbClass: u                # u | ru | irregular  (verbs only)
  # …

grammarPoints:
  - id: nai-negatives
    rule: "Plain negative: う-verbs → あ-row + ない (のむ→のまない); る-verbs → drop る + ない (たべる→たべない); する→しない, くる→こない."
    examples:
      - { ja: "たべない", en: "I won't eat." }
      - { ja: "みずを のまない", en: "I don't drink water." }
    antiPattern: { ja: "たべるない", why: "the る isn't dropped before ない" }   # must be GENUINELY wrong (inv 12)

lessons:
  - id: m6-neo-1
    title: "Saying no — ない"
    focus: "plain negative by verb class; たべる/のむ → たべない/のまない"
    introduces: [たべない, のまない]      # atoms first TAUGHT here (each needs an intro beat below)
    beats:                               # ORDERED teaching content; compiler assigns step types + interleaves
      - { kind: rule, grammarPointId: nai-negatives }
      - { kind: sentence, ja: "たべない", en: "I won't eat.", exercises: [nai-negatives], mode: build }
      - { kind: sentence, ja: "みずを のまない", en: "I don't drink water.", exercises: [nai-negatives, wo], mode: translate }
      - { kind: dialogue, speakers-ok: true,
          lines: [ { speaker: Mika, ja: "たべる？", en: "Eating?" },
                   { speaker: Tom,  ja: "ううん、たべない。", en: "Nope, not eating." } ],
          questions: [ { q: "Does Tom eat?", options: ["Yes","No"], answer: "No" } ] }
      - { kind: capstone, ja: "ごはんを たべない", en: "I won't eat rice.",
          combines: [nai-negatives, wo, gohan], mode: build }
    reviewPool: [たべる, のむ, ごはん, みず, たべない]   # atoms for the house review tail

# Notes the author leaves for the compiler / reviewer (free text, ignored by codegen)
notes: |
  Reinforcement targets to prefer as carriers (from context pack): ひと, きょう, うえ …
```

### Beat kinds → compiler output
| beat.kind | compiles to | provenance rule |
|---|---|---|
| `vocab-intro` (imageable) | `word_image_mcq` → `speaking` | debut; atom in `introduces` |
| `vocab-intro` (blocked) | `build`/`listeningComp`+`speaking`/rule card | debut; atom in `introduces` |
| `rule` | `grammar_rule` (with antiPattern → reactive tip) | — |
| `sentence` | `build`/`translate`/`listening_build` per `mode` | every token taught-first |
| `particle-cloze` | `particle_cloze` (≤2 modules from particle intro, inv 5) | — |
| `dialogue` | `dialogue_listen` (2-voice TTS; Keita for male) | **every token taught-first (inv 33)** |
| `capstone` | one `-capstone` generation step before the tail (inv 26) | combines ≥2 prior concepts |

## What the compiler does (deterministic — no LLM)
1. **Provenance / teach-first (inv 33, 16):** build the neo taught-set from `priorNeoModules` (intro-step words only) + accumulate this module's `introduces` **in lesson+beat order**. Tokenize every `ja` surface; **fail** if any content word isn't taught-yet. A `dialogue`/`sentence` word introduced later in the same lesson than where it's used is a failure.
2. **Step-type assignment:** per the beat table; imageable debuts forced to `word_image_mcq` (inv 30).
3. **Ordering & density (inv 15/24, guide bar):** interleave so no two adjacent steps share a type, ≤2 selection-taps in a row, ≥5 distinct types, 18–24 steps, **close on `match_pairs`**. Insert the house review tail (`reviewMatchPairs` over `reviewPool` + `vocabMcq` + a `listening_build`) before the close; place the single `-capstone` immediately before the tail.
4. **Distractors (inv 10):** draw from the module's declared sibling-sets (other taught verbs / sibling particles / co-deictics), never invented non-words; rotate correct-answer slots (inv 11).
5. **Codegen:** emit `m<N>-neo.gen.ts` calling the existing factory helpers (`build`, `speaking`, `vocabMcq`, `grammarRule`, `dialogueListen`, `reviewMatchPairs`, …) with stable ids `ja-m<N>-neo-<lesson>-<beat>`.
6. **Self-report:** print an exposure summary (CEJC-weighted, inv 27) and the provenance ledger so `module-gate` + the thin verify pass have less to do.

## Author ⇄ compiler feedback loop (Spencer 2026-07-20)
The compiler is deterministic but NOT silent: when the IR is underspecified it
emits a structured **diagnostics report** the content author consumes and fixes,
instead of failing opaquely or guessing at layout. Loop until clean. Each
diagnostic names the lesson/beat AND the concrete fix the author must make:

| kind | meaning → author's fix |
|---|---|
| `provenance` | word W in `<beat>` isn't taught yet → add an intro beat earlier (or note it as prior-neo) — teach-first, inv 33 |
| `density-short` | lesson has N buildable beats, needs ≥M for the 18–24 band → add sentences/drills from the reinforcement/carrier pool |
| `variety-thin` | <5 distinct step types would result → add a different beat kind |
| `distractor-thin` | MCQ/build has <3 real sibling distractors → widen the sibling-set (compiler won't invent non-words) |
| `capstone-missing` | no `-capstone` combining ≥2 prior concepts → supply/enrich one |
| `repeat` | sentence surface used >3× → vary the carrier |
| `gloss-long` | atom gloss >28 chars with no `shortGloss` → add one; long glosses overflow the match-pair card below the fold (Gate 10, m6 2026-07-23) |

Diagnostics emit as JSON (machine-consumable by the author agent) **and** a human
summary. The author revises the IR; re-compile; repeat until zero diagnostics —
then phase 3. This is the "they talk to each other" channel: the compiler tells
the author exactly what optimization or manual work the layout needs.

## What still needs a (thin) LLM — phase 3
Naturalness of `ja`/glosses, distractor sanity, dialogue register — a small verify
pass, plus the existing `module-gate` (scoped tests → TTS → tsc → visual capture →
CI parity → exposure audit) and ONE continuity judge. The compiler removes the
*structural* defect classes; phase 3 covers the *semantic* residue.

## ~~Open decision for Spencer~~ RESOLVED (2026-07-23)
YAML confirmed. Spencer's ruling: the IR format is *for the agent* — pick
whatever is easiest for an agent to turn into lessons deterministically. YAML
stays unless a future compiler change makes something else strictly easier.
