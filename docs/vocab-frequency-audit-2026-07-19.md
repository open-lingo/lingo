# Vocab × frequency audit — 2026-07-19

Input to the dict-form-first rewrite (spine draft-2). Compares the course's
775 atoms (module allocations as of `main` today) against the **NINJAL CEJC
spoken-conversation top-500** (`docs/data/ja-top500-cejc.json`; primary
source: CEJC short-unit-word lemma frequency TSV, cross-checked against
OpenSubtitles 2018). Spoken corpus chosen deliberately — this is a
conversational course. Caveat: spoken corpora over-weight fillers,
first-person pronouns, and casual forms; treat ranks as strong signal, not
gospel.

Coverage: **278 of 442 content words** in the top 500 map to a course atom
(matcher artifacts checked by hand: いい taught m8 as "いい / よい";
ありがとうございます / ください / ごめんなさい taught as phrase variants).

## Strong findings (Spencer asked for strong-only)

### 1. The function-noun spine words are missing, and they're grammar enablers
- **こと #44** — no atom. Teach as vocab WITH nominalization (draft-2 s11).
- **とき #62** — no atom. Teach WITH temporal clauses (moving earlier per review).
- **ほう #66** — no atom. Teach WITH comparisons-I (のほうが).
- **もの #56** — atom exists but m24 + blocked, while its derivatives precede
  it: かいもの m15, たべもの/のみもの m21. Confirms Spencer's instinct:
  teach 物/もの early as a compositional concept (food module — たべもの =
  たべ+もの, のみもの = のみ+もの), then derivatives are free.

### 2. The interaction layer is a hole (and side-quest-purge debt)
うん **#1** (the most frequent word in spoken Japanese), そう #9, はい #23
(atom BLOCKED — stranded in the deleted survival sidequest), だめ #113,
なるほど #132, ごめん #178 (also stranded). Fix in draft-2: the register
module (s07) teaches はい/ええ/うん as one word at three registers;
はい/ごめん atoms must move out of `sidequest-survival` into the main
course.

### 3. Choose the s05/s06 verb seed-set BY FREQUENCY
Current allocations of top-frequency verbs: いう #20 → future(!),
わかる #53 → future+blocked(!), おもう #38 → grammar-only (とおもいます m18,
never a drilled verb), なる #39 → m27, できる #82 → m23, つかう #103 → m29,
かう #118 → m25, きく #120 → m24, でる/だす/いれる/おく → future.
The rewrite's first ~20 verbs should be drawn from the top of this list —
いう/おもう/わかる/なる belong in the first verb modules, not the horizon.
もらう #98 / くれる #114 / あげる #171 stay structurally N4 (give/receive)
but earn an early receptive intro (they're top-120 spoken).

### 4. Conversation-glue adverbs need a drip
ぜんぜん #97 (grammar-taught m11, no atom → SRS never reviews it),
ちゃんと #173, ずっと #174, たとえば #223, さっき #227, すぐ #237,
きっと #287, まず #264, たぶん #87 (m18+blocked), もっと #224 (m22).
Fits the sprinkle principle: 1–2 glue adverbs per module as vocabulary,
not a block.

### 5. First-person pronouns beyond わたし
おれ #83, ぼく #164 — recognition-level teaching belongs in the register
thread (s07 intro, s25 mastery). A course that only knows わたし
mis-models half of spoken input.

## Non-findings (checked, fine as-is)
- m1–m2 kana-drill vocab (うま, かめ, きのこ…, 69 atoms outside top-500):
  picturable nouns are the right tool for kana drills; keep.
- Body/health (s17 words: あたま #329, おなか #405, いたい #275) — all in
  the top 500, so Spencer's "is this even N5?" concern is answered:
  keep the module, mid-course placement is fine.
- Domain nouns (にく #378, やさい #411, おさけ #369) land mid-list —
  current placements m21–22 are late-ish but not egregious; the draft-2
  situation-belt reshuffle covers it.
