# Grammar-rule prose is invisible to every kana-based lint

Filed 2026-08-19, from the m32 authoring walk.

## The blind spot

`kanaSurfaces` — the collector every kana-based lint reads — only keeps a
string that is kana-ONLY:

```ts
const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー、。？！　 ]+$/u;
```

Every grammar-rule title and every rule bullet is mixed script: Japanese
quoted inside English explanation, usually with kanji and always with Latin
letters. None of it survives that filter. So the provenance/untracked-word
check, the invariant-30 debut check and the invariant-33 teach-first check all
see rule prose as empty.

That is 152,466 characters of authored rule text across m6–m32 containing 567
Japanese quotations — the largest unlinted Japanese surface in the course.

## How bad is it actually — measured

Crude sweep: pull every 「…」 span out of every compiled module's rule text,
split on authored spaces, and check each chunk against that module's own
compiled `priorVocab` ∪ `newAtoms` ∪ `priorAtoms`, allowing a trailing
particle and a short list of endings.

| | |
|---|---|
| rule characters swept | 152,466 |
| Japanese quotations | 567 |
| distinct space-separated chunks | 849 |
| chunks the crude check could not account for | 169 |

**Then read the 169.** They are `がくせいだ`, `たべるのが`, `さんまい`,
`ごふん`, `いくんだ`, `かっておく`, `たかいけど` — copula compounds,
nominalisations, counters, 〜んだ, 〜ておく. Every sample is a CONSTRUCTION the
module is teaching, not a word the learner has not met. The crude checker
models a trailing particle and about a dozen endings; the course's real
tokenizer models far more.

**So: the blind spot is real, and it does not appear to be hiding untaught
vocabulary.** Worth saying plainly, because "the largest unlinted surface in
the course" invites an alarm the evidence does not support.

## What closing it properly takes

The honest check is the compiler's own tokenizer, not a regex. It lives as a
closure inside `moduleCompiler.ts` (built around line 643) and is not
exported; the exported entry point is `diagnoseModule`, which walks beats and
never looks at `grammarPoints[].rule`.

So the fix is: walk rule prose in `diagnoseModule`, extract 「…」 spans, run
them through the same tokenizer the beats use, and report unknown tokens as a
new diagnostic. That is shared compiler code across 27 modules — measure the
diagnostic count before turning it into a gate, and expect the first run to
surface tokenizer gaps (te-forms, polite surfaces, counters) rather than
content errors, exactly as m32's own authoring walk did.

Not started. Reproduce the measurement above from `curriculum/ir/m*.ir.json`.
