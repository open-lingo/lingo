# How to read a learner-view file

Each `mN.md` is one module, lessons in the order the course presents them,
steps in the order the learner meets them. **The answers are not in these
files.** Options and tiles are shuffled, option ids are stripped, per-token
readings and glosses are removed, and the post-mistake hints are removed. If
you can answer a step, it is because the course taught you — which is the
whole point of the exercise.

Every step is numbered and tagged with its type. Here is what each one puts in
front of a learner.

## Steps that TEACH

**`grammar_rule`** — a rule card. The learner reads it before the beats that
drill it. Everything on it is shown: the rule, worked examples with their
English, an `NOT:` anti-pattern (a wrong sentence and why it is wrong), and
sometimes a cultural note. This is the module's teaching, so if something later
feels unexplained, the first question is whether a rule card covered it.

**`symbol_intro`** — a kana is introduced: the symbol, its romanisation, a
pronunciation hint, sometimes an example word.

## Steps that ASK

**`build_sentence`** — an English prompt and a bank of TILES. The learner drags
tiles into order to make the Japanese. The bank contains distractor tiles that
do not belong in the answer. A `[register cue: …]` line means the prompt tells
you who you are speaking to, and the expected politeness follows from that. A
`[frame: …]` line is fixed text the sentence is built inside.

**`listening_build`** — the learner HEARS a sentence (given as `AUDIO:`) and
rebuilds it from tiles. The audio is what a learner's ears get, so it is
printed; the question is whether they can parse it.

**`listening_comprehension`** — the learner hears `AUDIO:` and answers a
question about it in English. Distractors are usually near-misses: wrong
winner, wrong adjective, comparison-instead-of-superlative.

**`dialogue_listen`** — a short dialogue is heard, then comprehension
questions. Only the Japanese lines are shown; the English translations are
withheld because they answer the questions.

**`translate`** — English in, Japanese out. Graded max-acceptance: every
correct rendering is accepted, so "polite or plain" is usually both fine unless
the prompt cues a register.

**`speaking`** — the learner says a Japanese sentence out loud from an English
prompt.

**`multiple_choice`** — a prompt and lettered options.

**`particle_cloze`** — a sentence with a blank, its English meaning, and
candidate particles (or endings). Tests the one slot.

**`word_image_mcq`** — a word's FIRST exposure in the course: a meaning (shown
here in brackets, an emoji in the app) and candidate words. If a word arrives
here, that is the course introducing it.

**`kanji_reading`** — a kanji is shown bare and the learner picks its reading.

**`match_pairs`** — two shuffled columns to pair up. The pairing is the answer,
so the columns are shuffled independently.

**`conjugation_transform`** — a base form and a target form; pick the correct
conjugation.

**`self_explanation_mcq`** — asks the learner to state WHY, not what. Tests
whether the rule was understood rather than memorised.

**`symbol_recognition` / `symbol_to_sound`** — kana drills.
**`symbol_trace`** — handwriting practice.
**`row_test`** — a gate at the end of a kana row; must be passed to continue.

## What the learner does NOT get

No answer key, no per-word glosses inside a Japanese sentence, no romaji
crutch beyond what the course itself shows, and no explanation until after
they have answered. A learner who cannot answer a step has either not been
taught it, or has been taught it badly — and telling those two apart is what
this simulation is for.
