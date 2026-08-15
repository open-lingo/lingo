# `scripts/draft/` — cheap example-sentence drafting

Draft the `kind: sentence` beats of a module's IR with a local model, for free,
and spend paid tokens only where they buy something.

## The split, and why it is this split

| tier | cost | does | measured on |
|---|---|---|---|
| `frames.mjs` (plain JS) | free | **all Japanese syntax** | grammaticality is guaranteed, not sampled |
| local model (Ollama) | free | picks which taught words combine; writes the English gloss | 12/12 unique in 55s (shisa-70b) |
| `ja-lexicon-judge` agent (Fable) | ~pennies, **once** | classifies the taught inventory into pools | 225 words, reused by every module after |
| main agent (Opus) | expensive | designs the frame; reads a sample | one frame per module |

The load-bearing idea is that judgment is applied to the **inventory** — a few
hundred words, classified once, committed to disk — and not to the **output**,
which is unbounded. A wrong word in a pool is one fix that repairs every module
authored afterwards. A wrong sentence is one fix, forever, for each one.

## Three attempts, measured on this repo's own vocabulary gate

1. **Free-form prompt** listing all 603 taught words → **1 / 12 usable.** Shisa
   writes fluent Japanese and ignores the word list; a model tuned for fluency
   optimises against the one constraint that matters here.
2. **JSON-schema `enum` over every output token** → **0 untaught words, 0
   usable sentences.** 「このアメリカのおいしいケンとたべてみる」 — "delicious
   Ken". Constraining a free-text field to a token list removes the model's
   ability to form a sentence at all.
3. **Slot-filling (this directory)** → **12 / 12 grammatical, 100% unique.**
   Grammar is a JS template, vocabulary is an `enum` per slot, and the model is
   left with the one job it is good at: choosing combinations that mean
   something.

The conclusion from (2) is not "constrained decoding does not work". It is that
the constraint was on the wrong thing.

## Usage

```bash
# 1. Classify the taught inventory (once per band; local model, ~40s)
node scripts/draft/classify.mjs qwen3:4b scripts/draft/semantic-pools.json

# 2. Audit that classification with the ja-lexicon-judge agent, and commit the
#    result. Do not skip this — see "the inventory is the product" below.

# 3. Draft
node scripts/draft/generate.mjs m31                      # human-readable
node scripts/draft/generate.mjs m31 --yaml               # IR beats, paste-ready
node scripts/draft/generate.mjs m31 --model qwen --rounds 5   # faster, blander
```

Requires Ollama on `localhost:11434`. `--model shisa` (default) is slower and
picks markedly better pairings — doctor→medicine, friend→present — where
`--model qwen` produces "I give a boat to a person". Local inference is free, so
oversample and throw away rather than tuning for first-pass yield.

## Adding a module

Add a frame to `frames.mjs`. A frame is: the slot pools each grammatical role
draws from, a builder per variant, and the module's hard rules **expressed as
narrowed pools rather than as validation**.

That last part is the design rule worth keeping. m31's spine states the ban
"あげる cannot point at me (×わたしにあげる)". An earlier version detected it
after the fact and rejected 4 of 8 candidates. The shipped version gives あげる
a receiver pool containing no inside person, so the error is unreachable and the
yield is 100%. Prevention where the rule is mechanical; validation only for what
a pool cannot express.

Japanese is assembled from space-separated phrase chunks — 「この りょうりを
たべてみる。」 — because the build-tile step splits on those spaces. Use the `j()`
helper; never concatenate.

## The inventory is the product

Every hand-written blocklist in this project has leaked, in the same way, four
times: `ー` (U+30FC) read as punctuation so every taught loanword scored as
untaught; a zsh `for` over an unquoted string that silently matched nothing; a
`pos === "noun"` filter that returned zero rows; and a regex object filter that
let `がくせい` through and produced 「ちちは ともだちに がくせいを あげます」 —
"my father gives a student to a friend".

So `semantic-pools.json` enumerates a decision per word rather than matching a
pattern, and it is a committed file so it can be read and checked. When output
looks wrong, fix the pool, not the sentence.

`classify.mjs` gets the easy half right and the world-knowledge half wrong — it
put けいたい (mobile phone) in `person`, marked まど (window) giftable, and
declined to use `portable-object` at all. That is what the Fable audit pass is
for, and why the local classification is a draft rather than the artifact.

## What still needs a human

Nothing in this pipeline checks that a combination is *pedagogically* apt, only
that it is legal and plausible. 「アメリカじんは わたしに シャワーを くれます」
is a grammatical sentence about being given a shower. Read a sample before
pasting into an IR — and when you find one, ask first whether the pool is wrong.
