# JA sentence-recycling audit — m1–m38 (2026-09-09)

Spencer's ask: find, programmatically, where lessons under-recycle previously taught verbs/nouns/adjectives — "at least ~20% of sentences using previous verbs and previous nouns and previous adjectives" — especially additive-form modules (ておく, て-forms, たら, ば, volitional, …) and lessons that teach few brand-new verb lemmas. Method, classification, and exposure-channel definitions are in this script's header comment (`scripts/ja-recycle-rate.ts`) and its pure classifier (`scripts/ja-recycle-lib.ts`, unit-tested). **Read-only measurement — no curriculum changes made by this script or this pass.**

Ranking floor: a lesson needs >= 3 distinct answer-position sentences to be ranked at all (below that, a recycle percentage is not meaningful) — m1/m2 kana-row lessons mostly fall under this floor and are shown in their module tables with a sentence count but excluded from the "below 20%" ranking.

**Hand-validated 2026-09-09** against the real compiled steps (dump script, not committed): `ja-m4-neo-9` (hand-authored m4 — confirmed its 2 sentences contain only くるま/かさ, both new to m4, so 0% is right, not a tokenizer gap); `ja-m31-neo-3` (confirmed the module's sole verb もらう/くれる is m31's own newAtom on every sentence, so 0% verb-recycle is the module drilling its own new verb, not a classification miss); `ja-m30-neo-2` (confirmed て-form surfaces like のんで/たべて/きいて correctly resolve through `derivedFrom` to their earlier-taught base verbs のむ/たべる/きく, which is the exact mechanism additive-form modules needed to score high verb-recycle).

## m1 — Hiragana rows (m1)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m1-l1-1 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-l1-2 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-l1-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ha-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ha-2 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ha-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ka-1 _(insufficient data)_ | 13 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ka-2 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ka-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-sa-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-sa-2 _(insufficient data)_ | 11 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-sa-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ta-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ta-2 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ta-3 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-na-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-na-2 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-na-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ma-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ma-2 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ma-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ya-1 _(insufficient data)_ | 6 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ya-2 _(insufficient data)_ | 8 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ya-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ra-1 _(insufficient data)_ | 10 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ra-2 _(insufficient data)_ | 11 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-ra-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-wa-1 _(insufficient data)_ | 6 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-wa-2 _(insufficient data)_ | 9 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-wa-3 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |

## m2 — Katakana + dakuten/yōon rows (m2)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m1-b-1 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-b-2 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-b-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-d-1 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-d-2 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-d-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-g-1 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-g-2 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-g-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-p-1 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-p-2 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-p-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-intro-1 _(insufficient data)_ | 11 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-intro-2 _(insufficient data)_ | 13 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-intro-3 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-rare-1 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-rare-2 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-rare-3 _(insufficient data)_ | 17 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-sh-ch-1 _(insufficient data)_ | 13 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-sh-ch-2 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-sh-ch-3 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-voiced-1 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-voiced-2 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-yoon-voiced-3 _(insufficient data)_ | 12 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-z-1 _(insufficient data)_ | 14 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-z-2 _(insufficient data)_ | 16 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m1-z-3 _(insufficient data)_ | 15 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |

## m3 — m3 — plain sentences

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m3-neo-1 _(insufficient data)_ | 24 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-2 _(insufficient data)_ | 24 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-3 _(insufficient data)_ | 22 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-4 _(insufficient data)_ | 21 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-5 _(insufficient data)_ | 24 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-6 _(insufficient data)_ | 21 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m3-neo-review _(insufficient data)_ | 20 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |

## m4 — m4 — possession & pointing

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m4-neo-1 _(insufficient data)_ | 21 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-2 _(insufficient data)_ | 21 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-3 _(insufficient data)_ | 20 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-4 _(insufficient data)_ | 21 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-5 | 21 | 8 | 37.5% | 0.0% | 37.5% | 0.0% | 0 |  |
| ja-m4-neo-6 _(insufficient data)_ | 21 | 1 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-7 _(insufficient data)_ | 20 | 2 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m4-neo-8 _(insufficient data)_ | 20 | 2 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-9 | 20 | 3 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-10 _(insufficient data)_ | 20 | 1 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m4-neo-11 | 20 | 4 | 25.0% | 0.0% | 25.0% | 0.0% | 0 |  |
| ja-m4-neo-review | 20 | 5 | 80.0% | 0.0% | 80.0% | 0.0% | 0 |  |

## m5 — m5

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m5-neo-1 _(insufficient data)_ | 19 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-2 _(insufficient data)_ | 20 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m5-neo-3 _(insufficient data)_ | 22 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m5-neo-4 _(insufficient data)_ | 20 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-5 _(insufficient data)_ | 19 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-6 _(insufficient data)_ | 20 | 2 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-7 _(insufficient data)_ | 21 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m5-neo-8 _(insufficient data)_ | 19 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-9 _(insufficient data)_ | 23 | 1 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-10 _(insufficient data)_ | 20 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m5-neo-11 _(insufficient data)_ | 19 | 2 | 50.0% | 50.0% | 0.0% | 0.0% | 0 |  |
| ja-m5-neo-review _(insufficient data)_ | 20 | 2 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |

## m6 — Negatives & Existence

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m6-neo-1 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 0.0% | 0.0% | 0 |  |
| ja-m6-neo-2 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-3 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-4 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 1 |  |
| ja-m6-neo-5 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 1 |  |
| ja-m6-neo-6 | 18 | 4 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-7 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-8 | 18 | 7 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-9 | 18 | 3 | 100.0% | 66.7% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-10 | 18 | 8 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-11 | 18 | 9 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-challenge | 18 | 12 | 100.0% | 16.7% | 100.0% | 0.0% | 0 |  |
| ja-m6-neo-review | 18 | 5 | 100.0% | 40.0% | 100.0% | 0.0% | 0 |  |

## m7 — Politeness as a layer: ます and です

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m7-neo-1 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-2 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-3 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-review-1 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m7-neo-4 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-5 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-6 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m7-neo-review-2 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-7 | 18 | 4 | 75.0% | 50.0% | 75.0% | 0.0% | 1 |  |
| ja-m7-neo-8 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-9 _(insufficient data)_ | 18 | 2 | 50.0% | 50.0% | 50.0% | 0.0% | 0 |  |
| ja-m7-neo-review-3 _(insufficient data)_ | 18 | 2 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m7-neo-challenge | 18 | 11 | 63.6% | 45.5% | 63.6% | 0.0% | 0 |  |

## m8 — Asking for things: て-form and ください

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m8-neo-1 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 1 | YES |
| ja-m8-neo-2 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m8-neo-10 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 2 | YES |
| ja-m8-neo-review-1 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m8-neo-11 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m8-neo-3 | 18 | 3 | 100.0% | 33.3% | 100.0% | 0.0% | 0 | YES |
| ja-m8-neo-4 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m8-neo-5 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 0.0% | 0.0% | 0 |  |
| ja-m8-neo-6 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 0.0% | 0.0% | 0 |  |
| ja-m8-neo-review-2 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 0.0% | 0.0% | 0 |  |
| ja-m8-neo-7 _(insufficient data)_ | 18 | 1 | 0.0% | 0.0% | 0.0% | 0.0% | 1 |  |
| ja-m8-neo-8 | 18 | 3 | 100.0% | 100.0% | 33.3% | 0.0% | 0 | YES |
| ja-m8-neo-9 | 18 | 4 | 100.0% | 75.0% | 50.0% | 0.0% | 0 |  |
| ja-m8-neo-review-3 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m8-neo-challenge | 18 | 8 | 100.0% | 75.0% | 62.5% | 0.0% | 0 |  |

## m9 — Numbers and first purchases

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m9-neo-1 | 18 | 3 | 33.3% | 0.0% | 33.3% | 0.0% | 0 |  |
| ja-m9-neo-2 _(insufficient data)_ | 18 | 2 | 0.0% | 0.0% | 0.0% | 0.0% | 0 |  |
| ja-m9-neo-3 | 18 | 5 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m9-neo-review-1 | 18 | 7 | 85.7% | 85.7% | 85.7% | 0.0% | 0 |  |
| ja-m9-neo-4 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m9-neo-5 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m9-neo-6 | 18 | 4 | 75.0% | 25.0% | 75.0% | 0.0% | 1 |  |
| ja-m9-neo-review-2 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m9-neo-7 | 18 | 8 | 100.0% | 62.5% | 87.5% | 0.0% | 0 |  |
| ja-m9-neo-8 | 18 | 3 | 100.0% | 66.7% | 66.7% | 0.0% | 0 |  |
| ja-m9-neo-9 | 18 | 3 | 66.7% | 33.3% | 66.7% | 0.0% | 0 |  |
| ja-m9-neo-review-3 | 18 | 7 | 100.0% | 85.7% | 57.1% | 0.0% | 0 |  |
| ja-m9-neo-challenge | 18 | 7 | 100.0% | 71.4% | 100.0% | 0.0% | 0 |  |

## m10 — Register in the wild: yes, no-possession, and softening

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m10-neo-1 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m10-neo-2 | 18 | 4 | 100.0% | 75.0% | 100.0% | 0.0% | 1 |  |
| ja-m10-neo-3 | 18 | 3 | 100.0% | 66.7% | 100.0% | 0.0% | 0 |  |
| ja-m10-neo-review-1 | 18 | 6 | 100.0% | 83.3% | 83.3% | 0.0% | 0 |  |
| ja-m10-neo-4 _(insufficient data)_ | 18 | 2 | 50.0% | 0.0% | 50.0% | 0.0% | 0 |  |
| ja-m10-neo-5 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m10-neo-6 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m10-neo-review-2 _(insufficient data)_ | 18 | 2 | 100.0% | 50.0% | 50.0% | 50.0% | 0 |  |
| ja-m10-neo-7 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 1 |  |
| ja-m10-neo-8 | 18 | 5 | 100.0% | 80.0% | 80.0% | 20.0% | 0 |  |
| ja-m10-neo-9 | 18 | 5 | 80.0% | 60.0% | 40.0% | 0.0% | 0 |  |
| ja-m10-neo-review-3 | 18 | 4 | 75.0% | 75.0% | 0.0% | 0.0% | 0 |  |
| ja-m10-neo-challenge | 18 | 8 | 87.5% | 50.0% | 75.0% | 0.0% | 0 |  |

## m11 — Time I: the clock, the calendar, and plain past た

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m11-neo-1 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m11-neo-2 _(insufficient data)_ | 18 | 1 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m11-neo-3 | 18 | 8 | 100.0% | 100.0% | 62.5% | 0.0% | 0 |  |
| ja-m11-neo-10 | 19 | 10 | 90.0% | 60.0% | 90.0% | 0.0% | 0 |  |
| ja-m11-neo-review-1 | 18 | 8 | 100.0% | 87.5% | 62.5% | 0.0% | 0 |  |
| ja-m11-neo-4 | 18 | 8 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m11-neo-5 | 18 | 9 | 88.9% | 0.0% | 88.9% | 0.0% | 0 |  |
| ja-m11-neo-6 | 18 | 5 | 100.0% | 0.0% | 100.0% | 20.0% | 0 |  |
| ja-m11-neo-review-2 | 18 | 10 | 90.0% | 0.0% | 90.0% | 0.0% | 0 |  |
| ja-m11-neo-7 | 18 | 7 | 100.0% | 85.7% | 100.0% | 0.0% | 0 |  |
| ja-m11-neo-8 _(insufficient data)_ | 18 | 2 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m11-neo-9 | 18 | 10 | 90.0% | 40.0% | 80.0% | 0.0% | 0 |  |
| ja-m11-neo-11 | 18 | 11 | 100.0% | 36.4% | 81.8% | 0.0% | 1 |  |
| ja-m11-neo-12 | 18 | 7 | 100.0% | 28.6% | 85.7% | 0.0% | 0 |  |
| ja-m11-neo-review-3 | 18 | 14 | 92.9% | 50.0% | 64.3% | 0.0% | 0 |  |
| ja-m11-neo-challenge | 18 | 10 | 100.0% | 40.0% | 90.0% | 10.0% | 0 |  |

## m12 — Adjectives as mini-predicates (い + な)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m12-neo-1 | 19 | 5 | 100.0% | 80.0% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-2 _(insufficient data)_ | 18 | 2 | 100.0% | 0.0% | 100.0% | 100.0% | 0 |  |
| ja-m12-neo-3 | 18 | 5 | 100.0% | 0.0% | 100.0% | 20.0% | 0 |  |
| ja-m12-neo-review-1 | 18 | 7 | 100.0% | 28.6% | 100.0% | 14.3% | 0 |  |
| ja-m12-neo-4 | 18 | 4 | 100.0% | 0.0% | 100.0% | 25.0% | 0 |  |
| ja-m12-neo-5 | 18 | 3 | 100.0% | 33.3% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-6 _(insufficient data)_ | 18 | 2 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-review-2 | 18 | 3 | 100.0% | 0.0% | 100.0% | 33.3% | 0 |  |
| ja-m12-neo-7 | 18 | 3 | 100.0% | 66.7% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-8 _(insufficient data)_ | 18 | 2 | 100.0% | 50.0% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-9 | 18 | 4 | 100.0% | 0.0% | 100.0% | 0.0% | 0 |  |
| ja-m12-neo-review-3 | 18 | 7 | 100.0% | 14.3% | 100.0% | 14.3% | 0 |  |
| ja-m12-neo-challenge | 18 | 10 | 100.0% | 20.0% | 100.0% | 10.0% | 0 |  |

## m13 — Wanting: たい + ほしい

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m13-neo-1 | 19 | 13 | 100.0% | 61.5% | 100.0% | 69.2% | 0 |  |
| ja-m13-neo-2 | 18 | 11 | 100.0% | 63.6% | 100.0% | 45.5% | 0 |  |
| ja-m13-neo-3 | 18 | 11 | 100.0% | 45.5% | 100.0% | 45.5% | 0 |  |
| ja-m13-neo-review-1 | 18 | 14 | 100.0% | 64.3% | 100.0% | 42.9% | 0 |  |
| ja-m13-neo-4 | 18 | 10 | 100.0% | 60.0% | 100.0% | 40.0% | 0 |  |
| ja-m13-neo-5 | 18 | 10 | 100.0% | 100.0% | 100.0% | 70.0% | 0 |  |
| ja-m13-neo-6 | 18 | 10 | 100.0% | 10.0% | 80.0% | 100.0% | 0 |  |
| ja-m13-neo-review-2 | 18 | 14 | 100.0% | 28.6% | 100.0% | 57.1% | 0 |  |
| ja-m13-neo-7 | 18 | 8 | 87.5% | 0.0% | 87.5% | 62.5% | 0 |  |
| ja-m13-neo-8 | 18 | 14 | 100.0% | 92.9% | 85.7% | 28.6% | 0 |  |
| ja-m13-neo-9 | 18 | 13 | 100.0% | 38.5% | 84.6% | 46.2% | 0 |  |
| ja-m13-neo-10 | 23 | 16 | 87.5% | 12.5% | 81.3% | 18.8% | 3 |  |
| ja-m13-neo-review-3 | 22 | 21 | 90.5% | 28.6% | 90.5% | 42.9% | 0 |  |
| ja-m13-neo-challenge | 18 | 14 | 92.9% | 57.1% | 78.6% | 78.6% | 0 |  |

## m14 — て-form II: ている + permission/prohibition

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m14-neo-1 | 18 | 10 | 70.0% | 10.0% | 70.0% | 40.0% | 2 | YES |
| ja-m14-neo-2 | 18 | 13 | 100.0% | 100.0% | 100.0% | 15.4% | 0 | YES |
| ja-m14-neo-3 | 18 | 14 | 92.9% | 85.7% | 64.3% | 50.0% | 0 | YES |
| ja-m14-neo-review-1 | 18 | 12 | 91.7% | 66.7% | 83.3% | 25.0% | 0 | YES |
| ja-m14-neo-4 | 18 | 12 | 100.0% | 50.0% | 100.0% | 16.7% | 0 | YES |
| ja-m14-neo-5 | 18 | 12 | 100.0% | 91.7% | 100.0% | 8.3% | 1 | YES |
| ja-m14-neo-6 | 18 | 11 | 90.9% | 81.8% | 72.7% | 45.5% | 0 | YES |
| ja-m14-neo-review-2 | 18 | 14 | 92.9% | 78.6% | 85.7% | 14.3% | 0 | YES |
| ja-m14-neo-7 | 18 | 12 | 91.7% | 50.0% | 66.7% | 25.0% | 0 | YES |
| ja-m14-neo-8 | 18 | 12 | 91.7% | 58.3% | 83.3% | 16.7% | 0 | YES |
| ja-m14-neo-9 | 18 | 12 | 100.0% | 91.7% | 100.0% | 25.0% | 0 | YES |
| ja-m14-neo-10 | 22 | 13 | 69.2% | 46.2% | 61.5% | 15.4% | 4 | YES |
| ja-m14-neo-review-3 | 21 | 20 | 90.0% | 55.0% | 75.0% | 20.0% | 0 | YES |
| ja-m14-neo-challenge | 18 | 14 | 92.9% | 85.7% | 92.9% | 57.1% | 0 | YES |

## m15 — Relative clauses + こと/の + とき

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m15-neo-1 | 18 | 13 | 100.0% | 100.0% | 100.0% | 30.8% | 0 |  |
| ja-m15-neo-2 | 18 | 12 | 100.0% | 16.7% | 100.0% | 66.7% | 0 |  |
| ja-m15-neo-3 | 18 | 13 | 100.0% | 23.1% | 100.0% | 76.9% | 0 |  |
| ja-m15-neo-review-1 | 18 | 12 | 100.0% | 41.7% | 91.7% | 75.0% | 0 |  |
| ja-m15-neo-4 | 18 | 13 | 92.3% | 92.3% | 61.5% | 84.6% | 0 |  |
| ja-m15-neo-5 | 18 | 13 | 100.0% | 76.9% | 76.9% | 23.1% | 0 |  |
| ja-m15-neo-6 | 18 | 13 | 100.0% | 61.5% | 92.3% | 30.8% | 0 |  |
| ja-m15-neo-review-2 | 18 | 13 | 100.0% | 92.3% | 69.2% | 46.2% | 0 |  |
| ja-m15-neo-7 | 18 | 13 | 100.0% | 61.5% | 100.0% | 15.4% | 0 |  |
| ja-m15-neo-8 | 18 | 13 | 100.0% | 92.3% | 100.0% | 7.7% | 0 | YES |
| ja-m15-neo-9 | 18 | 14 | 100.0% | 92.9% | 85.7% | 14.3% | 0 |  |
| ja-m15-neo-review-3 | 18 | 14 | 100.0% | 64.3% | 85.7% | 57.1% | 0 |  |
| ja-m15-neo-challenge | 18 | 13 | 100.0% | 84.6% | 84.6% | 69.2% | 0 |  |

## m16 — Connecting: から/ので, ranges, なかった

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m16-neo-1 | 18 | 10 | 100.0% | 90.0% | 50.0% | 40.0% | 0 |  |
| ja-m16-neo-2 | 18 | 12 | 100.0% | 50.0% | 83.3% | 41.7% | 0 |  |
| ja-m16-neo-3 | 18 | 11 | 100.0% | 72.7% | 63.6% | 54.5% | 0 |  |
| ja-m16-neo-review-1 | 18 | 12 | 100.0% | 58.3% | 58.3% | 33.3% | 0 |  |
| ja-m16-neo-4 | 18 | 7 | 100.0% | 57.1% | 85.7% | 42.9% | 0 |  |
| ja-m16-neo-5 | 18 | 9 | 100.0% | 88.9% | 88.9% | 0.0% | 0 |  |
| ja-m16-neo-6 | 18 | 9 | 77.8% | 66.7% | 44.4% | 0.0% | 0 |  |
| ja-m16-neo-review-2 | 18 | 8 | 75.0% | 50.0% | 37.5% | 12.5% | 0 |  |
| ja-m16-neo-7 | 18 | 9 | 100.0% | 100.0% | 100.0% | 22.2% | 0 |  |
| ja-m16-neo-8 | 19 | 12 | 100.0% | 83.3% | 100.0% | 16.7% | 0 |  |
| ja-m16-neo-9 | 18 | 12 | 100.0% | 58.3% | 91.7% | 16.7% | 0 |  |
| ja-m16-neo-10 | 22 | 14 | 92.9% | 35.7% | 92.9% | 0.0% | 3 |  |
| ja-m16-neo-11 | 19 | 11 | 100.0% | 18.2% | 90.9% | 18.2% | 2 |  |
| ja-m16-neo-review-3 | 24 | 18 | 94.4% | 50.0% | 77.8% | 16.7% | 0 |  |
| ja-m16-neo-challenge | 18 | 12 | 100.0% | 91.7% | 91.7% | 25.0% | 0 |  |

## m17 — Family I: your side (うち)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m17-neo-1 | 18 | 12 | 100.0% | 66.7% | 91.7% | 33.3% | 0 |  |
| ja-m17-neo-2 | 18 | 13 | 92.3% | 23.1% | 92.3% | 38.5% | 0 |  |
| ja-m17-neo-3 | 18 | 11 | 100.0% | 72.7% | 81.8% | 45.5% | 0 |  |
| ja-m17-neo-review-1 | 18 | 12 | 100.0% | 41.7% | 91.7% | 50.0% | 0 |  |
| ja-m17-neo-4 | 18 | 11 | 90.9% | 81.8% | 63.6% | 27.3% | 0 |  |
| ja-m17-neo-5 | 18 | 10 | 90.0% | 30.0% | 30.0% | 50.0% | 0 |  |
| ja-m17-neo-6 | 18 | 9 | 100.0% | 44.4% | 66.7% | 33.3% | 0 |  |
| ja-m17-neo-review-2 | 18 | 10 | 100.0% | 60.0% | 50.0% | 50.0% | 0 |  |
| ja-m17-neo-7 | 18 | 12 | 100.0% | 16.7% | 100.0% | 33.3% | 0 |  |
| ja-m17-neo-8 | 18 | 13 | 84.6% | 0.0% | 84.6% | 30.8% | 0 |  |
| ja-m17-neo-9 | 18 | 11 | 81.8% | 18.2% | 81.8% | 0.0% | 0 |  |
| ja-m17-neo-review-3 | 18 | 14 | 85.7% | 28.6% | 71.4% | 50.0% | 0 |  |
| ja-m17-neo-challenge | 18 | 13 | 92.3% | 46.2% | 84.6% | 30.8% | 0 |  |

## m18 — Saying & thinking: とおもう + という

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m18-neo-1 | 18 | 13 | 100.0% | 92.3% | 92.3% | 7.7% | 0 |  |
| ja-m18-neo-2 | 18 | 13 | 100.0% | 100.0% | 84.6% | 7.7% | 0 |  |
| ja-m18-neo-3 | 18 | 13 | 100.0% | 92.3% | 69.2% | 15.4% | 0 |  |
| ja-m18-neo-review-1 | 18 | 13 | 100.0% | 100.0% | 76.9% | 0.0% | 0 |  |
| ja-m18-neo-4 | 18 | 13 | 100.0% | 92.3% | 92.3% | 30.8% | 0 |  |
| ja-m18-neo-5 | 18 | 12 | 100.0% | 100.0% | 91.7% | 16.7% | 0 |  |
| ja-m18-neo-6 | 18 | 13 | 100.0% | 100.0% | 84.6% | 15.4% | 0 |  |
| ja-m18-neo-review-2 | 18 | 13 | 100.0% | 100.0% | 100.0% | 23.1% | 0 |  |
| ja-m18-neo-7 | 18 | 13 | 92.3% | 69.2% | 84.6% | 23.1% | 0 |  |
| ja-m18-neo-8 | 18 | 11 | 100.0% | 90.9% | 90.9% | 9.1% | 0 |  |
| ja-m18-neo-9 | 18 | 12 | 83.3% | 33.3% | 50.0% | 16.7% | 0 |  |
| ja-m18-neo-review-3 | 18 | 13 | 100.0% | 84.6% | 76.9% | 0.0% | 0 |  |
| ja-m18-neo-challenge | 18 | 12 | 100.0% | 91.7% | 100.0% | 25.0% | 0 |  |

## m19 — Getting around: motion particles

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m19-neo-1 | 18 | 13 | 100.0% | 84.6% | 92.3% | 7.7% | 0 |  |
| ja-m19-neo-2 | 18 | 13 | 100.0% | 84.6% | 92.3% | 7.7% | 0 |  |
| ja-m19-neo-3 | 18 | 13 | 92.3% | 69.2% | 46.2% | 15.4% | 0 |  |
| ja-m19-neo-review-1 | 18 | 12 | 100.0% | 83.3% | 91.7% | 0.0% | 0 |  |
| ja-m19-neo-4 | 18 | 12 | 100.0% | 91.7% | 100.0% | 8.3% | 0 |  |
| ja-m19-neo-5 | 18 | 12 | 91.7% | 50.0% | 58.3% | 0.0% | 0 |  |
| ja-m19-neo-6 | 18 | 8 | 100.0% | 37.5% | 100.0% | 37.5% | 0 |  |
| ja-m19-neo-review-2 | 18 | 12 | 100.0% | 50.0% | 83.3% | 16.7% | 0 |  |
| ja-m19-neo-7 | 18 | 11 | 100.0% | 81.8% | 72.7% | 0.0% | 0 |  |
| ja-m19-neo-8 | 18 | 8 | 50.0% | 12.5% | 37.5% | 25.0% | 0 |  |
| ja-m19-neo-9 | 18 | 8 | 87.5% | 62.5% | 37.5% | 0.0% | 0 |  |
| ja-m19-neo-review-3 | 18 | 13 | 100.0% | 69.2% | 76.9% | 0.0% | 0 |  |
| ja-m19-neo-challenge | 18 | 12 | 100.0% | 100.0% | 66.7% | 0.0% | 0 |  |

## m20 — Comparisons I: のほうが…より

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m20-neo-1 | 18 | 10 | 100.0% | 30.0% | 100.0% | 100.0% | 0 |  |
| ja-m20-neo-2 | 18 | 9 | 100.0% | 44.4% | 100.0% | 22.2% | 0 |  |
| ja-m20-neo-3 | 18 | 9 | 100.0% | 11.1% | 100.0% | 44.4% | 0 |  |
| ja-m20-neo-review-1 | 18 | 13 | 100.0% | 30.8% | 100.0% | 46.2% | 0 |  |
| ja-m20-neo-4 | 18 | 11 | 100.0% | 27.3% | 100.0% | 18.2% | 0 |  |
| ja-m20-neo-5 | 18 | 10 | 100.0% | 30.0% | 100.0% | 30.0% | 0 |  |
| ja-m20-neo-6 | 18 | 10 | 100.0% | 90.0% | 80.0% | 30.0% | 0 |  |
| ja-m20-neo-review-2 | 18 | 12 | 100.0% | 50.0% | 91.7% | 33.3% | 0 |  |
| ja-m20-neo-7 | 18 | 12 | 100.0% | 33.3% | 100.0% | 83.3% | 0 |  |
| ja-m20-neo-8 | 18 | 10 | 100.0% | 30.0% | 100.0% | 70.0% | 0 |  |
| ja-m20-neo-9 | 18 | 9 | 100.0% | 0.0% | 88.9% | 77.8% | 0 |  |
| ja-m20-neo-review-3 | 18 | 12 | 100.0% | 25.0% | 83.3% | 33.3% | 0 |  |
| ja-m20-neo-challenge | 18 | 12 | 100.0% | 41.7% | 100.0% | 83.3% | 0 |  |

## m21 — Listing & describing: や, たり — carrying Family II

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m21-neo-1 | 18 | 11 | 100.0% | 63.6% | 100.0% | 36.4% | 0 |  |
| ja-m21-neo-2 | 18 | 12 | 100.0% | 66.7% | 100.0% | 16.7% | 0 |  |
| ja-m21-neo-3 | 18 | 11 | 90.9% | 45.5% | 90.9% | 36.4% | 0 |  |
| ja-m21-neo-review-1 | 18 | 13 | 100.0% | 53.8% | 100.0% | 38.5% | 0 |  |
| ja-m21-neo-4 | 18 | 11 | 90.9% | 54.5% | 90.9% | 27.3% | 0 |  |
| ja-m21-neo-5 | 18 | 11 | 100.0% | 54.5% | 90.9% | 27.3% | 0 |  |
| ja-m21-neo-6 | 18 | 11 | 100.0% | 27.3% | 100.0% | 0.0% | 0 |  |
| ja-m21-neo-review-2 | 18 | 12 | 100.0% | 58.3% | 91.7% | 0.0% | 0 |  |
| ja-m21-neo-7 | 18 | 12 | 100.0% | 91.7% | 100.0% | 8.3% | 0 |  |
| ja-m21-neo-8 | 18 | 12 | 100.0% | 41.7% | 100.0% | 66.7% | 0 |  |
| ja-m21-neo-9 | 18 | 10 | 80.0% | 20.0% | 70.0% | 0.0% | 0 |  |
| ja-m21-neo-review-3 | 18 | 13 | 84.6% | 30.8% | 84.6% | 38.5% | 0 |  |
| ja-m21-neo-challenge | 18 | 12 | 100.0% | 33.3% | 100.0% | 50.0% | 0 |  |

## m22 — Body, health & help: 〜が いたい

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m22-neo-1 | 18 | 11 | 100.0% | 81.8% | 100.0% | 9.1% | 0 |  |
| ja-m22-neo-2 | 18 | 12 | 91.7% | 66.7% | 91.7% | 8.3% | 0 |  |
| ja-m22-neo-3 | 18 | 12 | 100.0% | 91.7% | 83.3% | 8.3% | 0 |  |
| ja-m22-neo-review-1 | 18 | 12 | 91.7% | 83.3% | 91.7% | 8.3% | 0 |  |
| ja-m22-neo-5 | 18 | 13 | 84.6% | 84.6% | 38.5% | 23.1% | 0 |  |
| ja-m22-neo-6 | 18 | 10 | 80.0% | 80.0% | 30.0% | 20.0% | 0 |  |
| ja-m22-neo-7 | 18 | 13 | 100.0% | 84.6% | 100.0% | 0.0% | 0 |  |
| ja-m22-neo-review-2 | 18 | 13 | 84.6% | 76.9% | 46.2% | 15.4% | 0 |  |
| ja-m22-neo-9 | 18 | 11 | 72.7% | 27.3% | 54.5% | 0.0% | 0 |  |
| ja-m22-neo-10 | 18 | 12 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m22-neo-11 | 18 | 13 | 100.0% | 100.0% | 92.3% | 46.2% | 0 | YES |
| ja-m22-neo-review-3 | 18 | 13 | 84.6% | 69.2% | 76.9% | 7.7% | 0 |  |
| ja-m22-neo-challenge | 18 | 12 | 91.7% | 83.3% | 91.7% | 25.0% | 0 |  |

## m23 — Experience & intent: 〜た ことが ある, つもり

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m23-neo-1 | 18 | 13 | 100.0% | 84.6% | 100.0% | 15.4% | 0 |  |
| ja-m23-neo-2 | 18 | 13 | 100.0% | 76.9% | 100.0% | 15.4% | 1 |  |
| ja-m23-neo-3 | 18 | 13 | 100.0% | 92.3% | 76.9% | 15.4% | 1 |  |
| ja-m23-neo-review-1 | 18 | 14 | 100.0% | 78.6% | 85.7% | 21.4% | 0 |  |
| ja-m23-neo-5 | 18 | 13 | 100.0% | 69.2% | 92.3% | 0.0% | 1 |  |
| ja-m23-neo-6 | 18 | 13 | 100.0% | 100.0% | 92.3% | 0.0% | 0 |  |
| ja-m23-neo-7 | 18 | 11 | 100.0% | 90.9% | 100.0% | 54.5% | 0 |  |
| ja-m23-neo-review-2 | 18 | 14 | 100.0% | 78.6% | 85.7% | 21.4% | 0 |  |
| ja-m23-neo-9 | 18 | 13 | 100.0% | 61.5% | 100.0% | 0.0% | 0 |  |
| ja-m23-neo-10 | 18 | 13 | 100.0% | 92.3% | 92.3% | 0.0% | 0 | YES |
| ja-m23-neo-11 | 18 | 13 | 100.0% | 92.3% | 76.9% | 7.7% | 0 |  |
| ja-m23-neo-review-3 | 18 | 13 | 100.0% | 92.3% | 92.3% | 7.7% | 0 |  |
| ja-m23-neo-challenge | 18 | 13 | 100.0% | 84.6% | 92.3% | 7.7% | 0 |  |

## m24 — Can & let's: potential, ましょう, 〜ない？

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m24-neo-1 | 18 | 10 | 100.0% | 40.0% | 100.0% | 10.0% | 3 |  |
| ja-m24-neo-2 | 18 | 10 | 100.0% | 10.0% | 100.0% | 30.0% | 5 |  |
| ja-m24-neo-3 | 18 | 13 | 100.0% | 30.8% | 100.0% | 46.2% | 1 |  |
| ja-m24-neo-review-1 | 18 | 13 | 100.0% | 30.8% | 100.0% | 23.1% | 0 |  |
| ja-m24-neo-5 | 18 | 11 | 90.9% | 54.5% | 81.8% | 9.1% | 3 |  |
| ja-m24-neo-6 | 18 | 13 | 100.0% | 15.4% | 100.0% | 23.1% | 2 |  |
| ja-m24-neo-7 | 18 | 12 | 100.0% | 83.3% | 91.7% | 25.0% | 1 |  |
| ja-m24-neo-review-2 | 18 | 12 | 100.0% | 50.0% | 100.0% | 33.3% | 0 |  |
| ja-m24-neo-9 | 18 | 13 | 100.0% | 76.9% | 84.6% | 38.5% | 1 |  |
| ja-m24-neo-10 | 18 | 10 | 100.0% | 40.0% | 100.0% | 20.0% | 0 |  |
| ja-m24-neo-11 | 18 | 11 | 100.0% | 54.5% | 100.0% | 27.3% | 0 |  |
| ja-m24-neo-review-3 | 18 | 11 | 100.0% | 72.7% | 90.9% | 18.2% | 0 |  |
| ja-m24-neo-challenge | 18 | 13 | 100.0% | 46.2% | 100.0% | 15.4% | 0 |  |

## m25 — Conjecture: でしょう / だろう / かな + weather

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m25-neo-1 | 18 | 10 | 100.0% | 0.0% | 100.0% | 30.0% | 0 |  |
| ja-m25-neo-2 | 18 | 8 | 100.0% | 12.5% | 100.0% | 75.0% | 0 |  |
| ja-m25-neo-3 | 18 | 11 | 100.0% | 36.4% | 90.9% | 9.1% | 1 |  |
| ja-m25-neo-review-1 | 18 | 11 | 100.0% | 9.1% | 100.0% | 36.4% | 0 |  |
| ja-m25-neo-5 | 18 | 11 | 81.8% | 63.6% | 72.7% | 9.1% | 0 |  |
| ja-m25-neo-6 | 18 | 13 | 76.9% | 38.5% | 61.5% | 23.1% | 0 |  |
| ja-m25-neo-7 | 18 | 8 | 100.0% | 62.5% | 100.0% | 12.5% | 0 |  |
| ja-m25-neo-review-2 | 18 | 13 | 92.3% | 30.8% | 76.9% | 23.1% | 0 |  |
| ja-m25-neo-9 | 18 | 7 | 100.0% | 0.0% | 100.0% | 14.3% | 0 |  |
| ja-m25-neo-10 | 18 | 10 | 100.0% | 20.0% | 100.0% | 50.0% | 0 |  |
| ja-m25-neo-11 | 18 | 13 | 100.0% | 76.9% | 69.2% | 30.8% | 0 |  |
| ja-m25-neo-review-3 | 18 | 8 | 100.0% | 62.5% | 75.0% | 12.5% | 0 |  |
| ja-m25-neo-challenge | 18 | 13 | 100.0% | 46.2% | 92.3% | 7.7% | 0 |  |

## m26 — Comparisons II: 〜の なかで … いちばん

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m26-neo-1 | 18 | 13 | 100.0% | 38.5% | 92.3% | 92.3% | 0 |  |
| ja-m26-neo-2 | 18 | 13 | 100.0% | 0.0% | 100.0% | 38.5% | 0 |  |
| ja-m26-neo-3 | 18 | 12 | 100.0% | 83.3% | 83.3% | 91.7% | 0 |  |
| ja-m26-neo-review-1 | 18 | 14 | 100.0% | 42.9% | 85.7% | 78.6% | 0 |  |
| ja-m26-neo-5 | 18 | 13 | 100.0% | 15.4% | 100.0% | 92.3% | 0 |  |
| ja-m26-neo-6 | 18 | 13 | 100.0% | 7.7% | 100.0% | 30.8% | 0 |  |
| ja-m26-neo-7 | 18 | 11 | 100.0% | 9.1% | 100.0% | 90.9% | 0 |  |
| ja-m26-neo-review-2 | 18 | 14 | 100.0% | 7.1% | 100.0% | 78.6% | 0 |  |
| ja-m26-neo-9 | 18 | 12 | 100.0% | 8.3% | 66.7% | 91.7% | 0 |  |
| ja-m26-neo-10 | 18 | 13 | 100.0% | 84.6% | 100.0% | 7.7% | 0 |  |
| ja-m26-neo-11 | 18 | 12 | 91.7% | 0.0% | 58.3% | 75.0% | 0 |  |
| ja-m26-neo-review-3 | 18 | 14 | 92.9% | 28.6% | 64.3% | 50.0% | 0 |  |
| ja-m26-neo-challenge | 18 | 14 | 100.0% | 42.9% | 100.0% | 85.7% | 0 |  |

## m27 — Explaining: んだ/んです, すぎる, なる

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m27-neo-1 | 18 | 8 | 100.0% | 87.5% | 100.0% | 25.0% | 0 |  |
| ja-m27-neo-2 | 18 | 9 | 100.0% | 66.7% | 88.9% | 33.3% | 0 |  |
| ja-m27-neo-3 | 18 | 11 | 100.0% | 81.8% | 27.3% | 27.3% | 0 |  |
| ja-m27-neo-review-1 | 18 | 10 | 100.0% | 70.0% | 70.0% | 30.0% | 0 |  |
| ja-m27-neo-5 | 18 | 8 | 100.0% | 87.5% | 87.5% | 12.5% | 0 |  |
| ja-m27-neo-6 | 18 | 6 | 100.0% | 66.7% | 100.0% | 16.7% | 0 |  |
| ja-m27-neo-7 | 18 | 12 | 91.7% | 41.7% | 83.3% | 8.3% | 0 |  |
| ja-m27-neo-review-2 | 18 | 7 | 100.0% | 57.1% | 100.0% | 14.3% | 0 |  |
| ja-m27-neo-9 | 18 | 13 | 69.2% | 23.1% | 61.5% | 15.4% | 0 |  |
| ja-m27-neo-10 | 18 | 12 | 100.0% | 41.7% | 100.0% | 33.3% | 0 |  |
| ja-m27-neo-11 | 18 | 11 | 90.9% | 9.1% | 90.9% | 18.2% | 0 |  |
| ja-m27-neo-review-3 | 18 | 13 | 84.6% | 23.1% | 76.9% | 38.5% | 0 |  |
| ja-m27-neo-challenge | 18 | 14 | 92.9% | 50.0% | 92.9% | 7.1% | 0 |  |

## m28 — Must & should: なきゃ/なければ, ほうがいい

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m28-neo-1 | 18 | 10 | 100.0% | 60.0% | 90.0% | 0.0% | 0 |  |
| ja-m28-neo-2 | 18 | 11 | 100.0% | 54.5% | 100.0% | 18.2% | 0 |  |
| ja-m28-neo-3 | 18 | 11 | 100.0% | 45.5% | 90.9% | 36.4% | 0 |  |
| ja-m28-neo-review-1 | 18 | 13 | 100.0% | 46.2% | 100.0% | 7.7% | 0 |  |
| ja-m28-neo-5 | 18 | 11 | 100.0% | 27.3% | 100.0% | 0.0% | 0 |  |
| ja-m28-neo-6 | 18 | 10 | 100.0% | 40.0% | 100.0% | 100.0% | 0 |  |
| ja-m28-neo-7 | 18 | 12 | 100.0% | 91.7% | 100.0% | 91.7% | 0 |  |
| ja-m28-neo-review-2 | 18 | 14 | 100.0% | 64.3% | 100.0% | 92.9% | 0 |  |
| ja-m28-neo-9 | 18 | 9 | 100.0% | 55.6% | 100.0% | 44.4% | 0 |  |
| ja-m28-neo-10 | 18 | 11 | 100.0% | 36.4% | 100.0% | 90.9% | 0 |  |
| ja-m28-neo-11 | 18 | 10 | 100.0% | 100.0% | 100.0% | 10.0% | 0 |  |
| ja-m28-neo-review-3 | 18 | 12 | 100.0% | 50.0% | 100.0% | 41.7% | 0 |  |
| ja-m28-neo-challenge | 18 | 14 | 100.0% | 64.3% | 100.0% | 50.0% | 0 |  |

## m29 — Register mastery + N5 capstone

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m29-neo-1 | 18 | 5 | 100.0% | 20.0% | 100.0% | 0.0% | 0 |  |
| ja-m29-neo-2 | 18 | 10 | 100.0% | 70.0% | 100.0% | 40.0% | 0 |  |
| ja-m29-neo-3 | 18 | 10 | 100.0% | 10.0% | 100.0% | 90.0% | 0 |  |
| ja-m29-neo-review-1 | 18 | 10 | 100.0% | 10.0% | 100.0% | 60.0% | 0 |  |
| ja-m29-neo-5 | 18 | 10 | 100.0% | 90.0% | 100.0% | 30.0% | 0 |  |
| ja-m29-neo-6 | 18 | 11 | 100.0% | 90.9% | 100.0% | 9.1% | 0 |  |
| ja-m29-neo-7 | 18 | 9 | 100.0% | 55.6% | 100.0% | 66.7% | 0 |  |
| ja-m29-neo-review-2 | 18 | 12 | 100.0% | 66.7% | 100.0% | 33.3% | 0 |  |
| ja-m29-neo-9 | 18 | 8 | 100.0% | 50.0% | 100.0% | 50.0% | 0 |  |
| ja-m29-neo-10 | 18 | 13 | 100.0% | 53.8% | 100.0% | 7.7% | 0 |  |
| ja-m29-neo-11 | 18 | 9 | 100.0% | 55.6% | 77.8% | 66.7% | 0 |  |
| ja-m29-neo-14 | 18 | 9 | 100.0% | 11.1% | 88.9% | 77.8% | 0 |  |
| ja-m29-neo-review-3 | 18 | 13 | 100.0% | 46.2% | 100.0% | 46.2% | 0 |  |
| ja-m29-neo-challenge | 18 | 13 | 100.0% | 76.9% | 100.0% | 46.2% | 0 |  |

## m30 — て + helper I: 〜てみる / 〜ておく

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m30-neo-1 | 18 | 13 | 100.0% | 92.3% | 84.6% | 15.4% | 0 | YES |
| ja-m30-neo-2 | 18 | 12 | 100.0% | 75.0% | 100.0% | 50.0% | 3 | YES |
| ja-m30-neo-3 | 19 | 9 | 100.0% | 77.8% | 100.0% | 22.2% | 0 | YES |
| ja-m30-neo-review-1 | 18 | 11 | 100.0% | 81.8% | 90.9% | 36.4% | 0 | YES |
| ja-m30-neo-5 | 18 | 13 | 100.0% | 92.3% | 92.3% | 7.7% | 1 | YES |
| ja-m30-neo-6 | 18 | 12 | 100.0% | 91.7% | 100.0% | 8.3% | 0 | YES |
| ja-m30-neo-7 | 18 | 14 | 92.9% | 71.4% | 71.4% | 42.9% | 2 | YES |
| ja-m30-neo-review-2 | 18 | 14 | 100.0% | 85.7% | 92.9% | 7.1% | 0 | YES |
| ja-m30-neo-9 | 18 | 12 | 100.0% | 58.3% | 100.0% | 8.3% | 0 | YES |
| ja-m30-neo-10 | 18 | 13 | 100.0% | 76.9% | 84.6% | 69.2% | 1 | YES |
| ja-m30-neo-11 | 18 | 13 | 100.0% | 92.3% | 84.6% | 23.1% | 0 | YES |
| ja-m30-neo-review-3 | 18 | 15 | 100.0% | 86.7% | 86.7% | 33.3% | 0 | YES |
| ja-m30-neo-challenge | 18 | 14 | 100.0% | 85.7% | 100.0% | 57.1% | 0 | YES |

## m31 — Give & receive I: あげる・くれる・もらう (things)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m31-neo-1 | 21 | 16 | 93.8% | 0.0% | 93.8% | 25.0% | 2 |  |
| ja-m31-neo-2 | 20 | 13 | 100.0% | 0.0% | 92.3% | 30.8% | 1 |  |
| ja-m31-neo-3 | 18 | 13 | 92.3% | 0.0% | 92.3% | 0.0% | 0 |  |
| ja-m31-neo-review-1 | 18 | 13 | 100.0% | 0.0% | 100.0% | 7.7% | 0 |  |
| ja-m31-neo-5 | 18 | 13 | 84.6% | 0.0% | 84.6% | 30.8% | 0 |  |
| ja-m31-neo-6 | 18 | 11 | 90.9% | 18.2% | 81.8% | 18.2% | 0 |  |
| ja-m31-neo-7 | 18 | 10 | 90.0% | 50.0% | 90.0% | 0.0% | 1 |  |
| ja-m31-neo-review-2 | 18 | 13 | 92.3% | 23.1% | 84.6% | 23.1% | 0 |  |
| ja-m31-neo-9 | 18 | 13 | 100.0% | 0.0% | 100.0% | 7.7% | 2 |  |
| ja-m31-neo-10 | 18 | 12 | 100.0% | 8.3% | 100.0% | 8.3% | 1 |  |
| ja-m31-neo-11 | 18 | 13 | 84.6% | 0.0% | 84.6% | 30.8% | 0 |  |
| ja-m31-neo-review-3 | 18 | 15 | 80.0% | 13.3% | 73.3% | 0.0% | 0 |  |
| ja-m31-neo-challenge | 18 | 13 | 100.0% | 38.5% | 100.0% | 30.8% | 0 |  |

## m32 — Conditionals I: たら (と as the contrast)

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m32-neo-1 | 22 | 14 | 100.0% | 92.9% | 92.9% | 0.0% | 2 |  |
| ja-m32-neo-2 | 20 | 15 | 100.0% | 100.0% | 100.0% | 0.0% | 1 |  |
| ja-m32-neo-3 | 24 | 13 | 92.3% | 84.6% | 69.2% | 0.0% | 1 |  |
| ja-m32-neo-review-1 | 18 | 11 | 100.0% | 81.8% | 90.9% | 0.0% | 0 |  |
| ja-m32-neo-5 | 24 | 14 | 71.4% | 57.1% | 50.0% | 7.1% | 3 |  |
| ja-m32-neo-6 | 24 | 13 | 100.0% | 100.0% | 53.8% | 7.7% | 3 |  |
| ja-m32-neo-7 | 22 | 14 | 85.7% | 42.9% | 78.6% | 7.1% | 1 |  |
| ja-m32-neo-review-2 | 18 | 10 | 90.0% | 80.0% | 70.0% | 0.0% | 0 |  |
| ja-m32-neo-9 | 21 | 15 | 100.0% | 86.7% | 80.0% | 26.7% | 0 |  |
| ja-m32-neo-10 | 21 | 13 | 100.0% | 46.2% | 84.6% | 15.4% | 2 |  |
| ja-m32-neo-11 | 20 | 16 | 81.3% | 62.5% | 68.8% | 0.0% | 0 |  |
| ja-m32-neo-review-3 | 18 | 10 | 90.0% | 70.0% | 80.0% | 10.0% | 0 |  |
| ja-m32-neo-challenge | 18 | 13 | 92.3% | 76.9% | 92.3% | 23.1% | 0 |  |

## m33 — Transitivity I: 自動詞/他動詞 — が vs を

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m33-neo-1 | 20 | 7 | 100.0% | 71.4% | 100.0% | 14.3% | 1 |  |
| ja-m33-neo-2 | 19 | 9 | 100.0% | 66.7% | 100.0% | 22.2% | 1 |  |
| ja-m33-neo-3 | 20 | 8 | 87.5% | 12.5% | 87.5% | 0.0% | 1 |  |
| ja-m33-neo-review-1 | 18 | 9 | 100.0% | 66.7% | 100.0% | 22.2% | 0 |  |
| ja-m33-neo-5 | 19 | 10 | 100.0% | 40.0% | 100.0% | 0.0% | 1 |  |
| ja-m33-neo-6 | 20 | 9 | 100.0% | 66.7% | 88.9% | 0.0% | 1 |  |
| ja-m33-neo-7 | 19 | 7 | 100.0% | 28.6% | 100.0% | 14.3% | 2 |  |
| ja-m33-neo-review-2 | 18 | 8 | 100.0% | 50.0% | 100.0% | 25.0% | 0 |  |
| ja-m33-neo-9 | 20 | 7 | 100.0% | 100.0% | 100.0% | 28.6% | 0 | YES |
| ja-m33-neo-10 | 18 | 9 | 77.8% | 44.4% | 77.8% | 0.0% | 2 |  |
| ja-m33-neo-11 | 19 | 8 | 100.0% | 12.5% | 100.0% | 0.0% | 4 |  |
| ja-m33-neo-review-3 | 18 | 8 | 87.5% | 50.0% | 87.5% | 12.5% | 0 |  |
| ja-m33-neo-13 | 20 | 14 | 92.9% | 50.0% | 85.7% | 0.0% | 0 |  |
| ja-m33-neo-challenge | 18 | 11 | 100.0% | 81.8% | 100.0% | 9.1% | 0 |  |

## m34 — Volitional: よう/おう + とおもう, ことにする

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m34-neo-1 | 20 | 6 | 100.0% | 100.0% | 100.0% | 16.7% | 0 |  |
| ja-m34-neo-2 | 18 | 6 | 100.0% | 100.0% | 83.3% | 0.0% | 0 |  |
| ja-m34-neo-3 | 18 | 3 | 100.0% | 0.0% | 100.0% | 33.3% | 0 |  |
| ja-m34-neo-review-1 _(insufficient data)_ | 18 | 2 | 100.0% | 50.0% | 100.0% | 50.0% | 0 |  |
| ja-m34-neo-5 | 18 | 7 | 100.0% | 71.4% | 71.4% | 0.0% | 1 |  |
| ja-m34-neo-6 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 1 |  |
| ja-m34-neo-7 | 18 | 3 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |
| ja-m34-neo-review-2 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 0.0% | 0.0% | 0 |  |
| ja-m34-neo-9 | 18 | 5 | 100.0% | 100.0% | 100.0% | 20.0% | 0 |  |
| ja-m34-neo-10 | 18 | 5 | 100.0% | 60.0% | 80.0% | 40.0% | 1 |  |
| ja-m34-neo-review-3 | 18 | 3 | 100.0% | 66.7% | 66.7% | 0.0% | 0 |  |
| ja-m34-neo-challenge | 18 | 12 | 100.0% | 83.3% | 83.3% | 25.0% | 0 |  |

## m35 — Give & receive II: 〜てあげる/てくれる/てもらう + asking favors

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m35-neo-1 | 18 | 4 | 100.0% | 100.0% | 75.0% | 50.0% | 1 | YES |
| ja-m35-neo-2 | 18 | 7 | 100.0% | 85.7% | 100.0% | 0.0% | 0 | YES |
| ja-m35-neo-3 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 100.0% | 1 | YES |
| ja-m35-neo-review-1 | 18 | 4 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m35-neo-5 | 18 | 3 | 100.0% | 33.3% | 66.7% | 33.3% | 1 | YES |
| ja-m35-neo-6 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 1 | YES |
| ja-m35-neo-7 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m35-neo-review-2 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 | YES |
| ja-m35-neo-9 | 18 | 8 | 100.0% | 100.0% | 100.0% | 0.0% | 1 | YES |
| ja-m35-neo-10 | 18 | 3 | 100.0% | 66.7% | 100.0% | 33.3% | 0 | YES |
| ja-m35-neo-review-3 _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m35-neo-challenge | 18 | 6 | 100.0% | 83.3% | 100.0% | 16.7% | 0 | YES |

## m36 — Looks like: 〜そう(appearance), 〜がる, 〜やすい/にくい, 〜ながら

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m36-neo-1 | 18 | 11 | 100.0% | 9.1% | 100.0% | 54.5% | 0 |  |
| ja-m36-neo-2 | 18 | 3 | 100.0% | 100.0% | 100.0% | 33.3% | 0 |  |
| ja-m36-neo-3 | 18 | 8 | 100.0% | 25.0% | 100.0% | 75.0% | 0 |  |
| ja-m36-neo-review-1 | 18 | 5 | 100.0% | 40.0% | 100.0% | 60.0% | 0 |  |
| ja-m36-neo-5 | 18 | 7 | 100.0% | 100.0% | 100.0% | 14.3% | 2 | YES |
| ja-m36-neo-6 | 18 | 10 | 100.0% | 10.0% | 100.0% | 50.0% | 0 |  |
| ja-m36-neo-7 | 18 | 8 | 100.0% | 100.0% | 87.5% | 0.0% | 0 |  |
| ja-m36-neo-review-2 | 18 | 7 | 100.0% | 42.9% | 100.0% | 28.6% | 0 |  |
| ja-m36-neo-9 | 18 | 6 | 100.0% | 0.0% | 100.0% | 33.3% | 0 | YES |
| ja-m36-neo-10 | 18 | 7 | 100.0% | 71.4% | 100.0% | 14.3% | 0 |  |
| ja-m36-neo-review-3 | 18 | 5 | 100.0% | 40.0% | 100.0% | 20.0% | 0 |  |
| ja-m36-neo-challenge | 18 | 7 | 100.0% | 100.0% | 100.0% | 0.0% | 0 |  |

## m37 — Conditionals II: ば + なら

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m37-neo-1 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 100.0% | 50.0% | 1 |  |
| ja-m37-neo-2 | 18 | 4 | 100.0% | 100.0% | 75.0% | 50.0% | 0 |  |
| ja-m37-neo-3 | 18 | 6 | 100.0% | 100.0% | 66.7% | 33.3% | 0 |  |
| ja-m37-neo-review-1 | 18 | 3 | 100.0% | 100.0% | 66.7% | 66.7% | 0 |  |
| ja-m37-neo-5 | 18 | 5 | 100.0% | 100.0% | 100.0% | 40.0% | 0 |  |
| ja-m37-neo-6 | 18 | 5 | 100.0% | 100.0% | 80.0% | 60.0% | 0 |  |
| ja-m37-neo-7 | 18 | 6 | 100.0% | 100.0% | 100.0% | 16.7% | 0 | YES |
| ja-m37-neo-review-2 | 18 | 7 | 100.0% | 100.0% | 100.0% | 42.9% | 0 |  |
| ja-m37-neo-9 | 18 | 4 | 100.0% | 75.0% | 50.0% | 75.0% | 1 |  |
| ja-m37-neo-10 | 18 | 11 | 100.0% | 72.7% | 81.8% | 72.7% | 0 |  |
| ja-m37-neo-review-3 | 18 | 7 | 100.0% | 71.4% | 85.7% | 71.4% | 0 |  |
| ja-m37-neo-challenge | 18 | 6 | 100.0% | 83.3% | 83.3% | 83.3% | 0 |  |

## m38 — て + helper II: 〜てしまう/ちゃう + 〜ていく/〜てくる

| Lesson | Steps | Sentences | Recycle% overall | verb | noun | adj | New verbs | Additive? |
|---|---|---|---|---|---|---|---|---|
| ja-m38-neo-1 | 18 | 3 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m38-neo-2 | 18 | 3 | 100.0% | 66.7% | 100.0% | 33.3% | 3 | YES |
| ja-m38-neo-3 _(insufficient data)_ | 18 | 2 | 100.0% | 50.0% | 100.0% | 100.0% | 0 | YES |
| ja-m38-neo-review-1 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 | YES |
| ja-m38-neo-5 | 18 | 4 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m38-neo-6 | 18 | 3 | 100.0% | 33.3% | 100.0% | 0.0% | 2 | YES |
| ja-m38-neo-7 | 18 | 4 | 100.0% | 75.0% | 75.0% | 75.0% | 3 | YES |
| ja-m38-neo-review-2 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 | YES |
| ja-m38-neo-9 | 18 | 3 | 100.0% | 33.3% | 100.0% | 33.3% | 2 | YES |
| ja-m38-neo-10 _(insufficient data)_ | 18 | 2 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |
| ja-m38-neo-review-3 _(insufficient data)_ | 18 | 0 | 0.0% | 0.0% | 0.0% | 0.0% | 0 | YES |
| ja-m38-neo-challenge _(insufficient data)_ | 18 | 1 | 100.0% | 100.0% | 100.0% | 0.0% | 0 | YES |

## Lessons below 20% overall recycle, ranked

1 of 380 ranked lessons (>= 3 sentences) are below 20%. Additive-form and few-new-verb (<=2 new verb lemmas) lessons are sorted to the top of this list, then by ascending recycle%.

| # | Module | Lesson | Recycle% | New verbs | Additive? |
|---|---|---|---|---|---|
| 1 | m4 | ja-m4-neo-9 ⚑ | 0.0% | 0 |  |

⚑ = additive-form grammar point or <=2 new verb lemmas taught (the two classes Spencer named).

## Re-author candidates for the ⚑-flagged lessons below 20%

For each flagged lesson: up to 5 concrete sentences that are the best re-author targets — same-frame near-duplicates of each other when the lesson has any (a literal repeated syntactic skeleton with swapped nouns/verbs), else the sentences built entirely from this lesson's own brand-new vocabulary — plus one suggested earlier-module word (same POS, most recently taught, not already used in this lesson) that could take a content-word slot instead.

### m4 / ja-m4-neo-9 (0.0% recycle, 0 new verbs)

- `ケンの くるまは どれ` — no same-frame duplicate found; flagged for using only this lesson's own new vocabulary — suggest swapping in **うみ** (earlier-module, same class)
- `これは ケンの くるまだ` — no same-frame duplicate found; flagged for using only this lesson's own new vocabulary — suggest swapping in **うみ** (earlier-module, same class)
- `それは ミカの かさだ` — no same-frame duplicate found; flagged for using only this lesson's own new vocabulary — suggest swapping in **うみ** (earlier-module, same class)

## Supplementary cut: verb-only recycle below 20%

The literal ask ranks by the OR-across-classes overall metric, and only 1 lesson qualifies below 20% course-wide (above) — this course's authorial convention seeds an earlier person/place/time noun into nearly every sentence for scene-setting, so noun reuse alone saturates "overall" almost everywhere (see m31 below: 80-100% overall on nearly every lesson). That masks the exact failure mode Spencer named: a module drilling 2-3 brand-new verbs for 8-9 teaching lessons can hit 0% VERB recycle while scoring 90%+ overall. This cut ranks by verb-recycle% alone, no additive/new-verb re-sort — read it alongside the per-module tables above, not as a replacement for the primary ranking.

64 of 380 ranked lessons are below 20% verb-recycle.

| Module | Lesson | Verb recycle% | Overall% | New verbs | Additive? |
|---|---|---|---|---|---|
| m4 | ja-m4-neo-5 | 0.0% | 37.5% | 0 |  |
| m4 | ja-m4-neo-9 | 0.0% | 0.0% | 0 |  |
| m4 | ja-m4-neo-11 | 0.0% | 25.0% | 0 |  |
| m4 | ja-m4-neo-review | 0.0% | 80.0% | 0 |  |
| m6 | ja-m6-neo-6 | 0.0% | 100.0% | 0 |  |
| m6 | ja-m6-neo-8 | 0.0% | 100.0% | 0 |  |
| m6 | ja-m6-neo-10 | 0.0% | 100.0% | 0 |  |
| m6 | ja-m6-neo-11 | 0.0% | 100.0% | 0 |  |
| m9 | ja-m9-neo-1 | 0.0% | 33.3% | 0 |  |
| m11 | ja-m11-neo-4 | 0.0% | 100.0% | 0 |  |
| m11 | ja-m11-neo-5 | 0.0% | 88.9% | 0 |  |
| m11 | ja-m11-neo-6 | 0.0% | 100.0% | 0 |  |
| m11 | ja-m11-neo-review-2 | 0.0% | 90.0% | 0 |  |
| m12 | ja-m12-neo-3 | 0.0% | 100.0% | 0 |  |
| m12 | ja-m12-neo-4 | 0.0% | 100.0% | 0 |  |
| m12 | ja-m12-neo-review-2 | 0.0% | 100.0% | 0 |  |
| m12 | ja-m12-neo-9 | 0.0% | 100.0% | 0 |  |
| m13 | ja-m13-neo-7 | 0.0% | 87.5% | 0 |  |
| m17 | ja-m17-neo-8 | 0.0% | 84.6% | 0 |  |
| m20 | ja-m20-neo-9 | 0.0% | 100.0% | 0 |  |
| m25 | ja-m25-neo-1 | 0.0% | 100.0% | 0 |  |
| m25 | ja-m25-neo-9 | 0.0% | 100.0% | 0 |  |
| m26 | ja-m26-neo-2 | 0.0% | 100.0% | 0 |  |
| m26 | ja-m26-neo-11 | 0.0% | 91.7% | 0 |  |
| m31 | ja-m31-neo-1 | 0.0% | 93.8% | 2 |  |
| m31 | ja-m31-neo-2 | 0.0% | 100.0% | 1 |  |
| m31 | ja-m31-neo-3 | 0.0% | 92.3% | 0 |  |
| m31 | ja-m31-neo-review-1 | 0.0% | 100.0% | 0 |  |
| m31 | ja-m31-neo-5 | 0.0% | 84.6% | 0 |  |
| m31 | ja-m31-neo-9 | 0.0% | 100.0% | 2 |  |
| m31 | ja-m31-neo-11 | 0.0% | 84.6% | 0 |  |
| m34 | ja-m34-neo-3 | 0.0% | 100.0% | 0 |  |
| m36 | ja-m36-neo-9 | 0.0% | 100.0% | 0 | YES |
| m26 | ja-m26-neo-review-2 | 7.1% | 100.0% | 0 |  |
| m26 | ja-m26-neo-6 | 7.7% | 100.0% | 0 |  |
| m26 | ja-m26-neo-9 | 8.3% | 100.0% | 0 |  |
| m31 | ja-m31-neo-10 | 8.3% | 100.0% | 1 |  |
| m25 | ja-m25-neo-review-1 | 9.1% | 100.0% | 0 |  |
| m26 | ja-m26-neo-7 | 9.1% | 100.0% | 0 |  |
| m27 | ja-m27-neo-11 | 9.1% | 90.9% | 0 |  |
| … | (24 more, see `--json`) | | | | |

