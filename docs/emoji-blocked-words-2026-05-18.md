# Image-Blocked Vocab — Authoring Guide (2026-05-18)

> **⚠️ PARTIALLY STALE for ja (2026-07-16 script-ladder wave). `Status: LIVE-with-corrections.`**
> Every "`phrase_card`" recommendation below is **BANNED in ja** — `phrase_card` is shelved and
> `vocab()`/`phrase()` silently emit it (authoring-guide §4b2; conformance-test-enforced). The
> *blocklist itself* (which words have no honest image) is still correct and load-bearing; only
> the prescribed teaching method changed. **For ja, teach a blocked word via `vocabMcq` is not an
> option either — introduce it through `listeningCompSentence` + `speaking`, a `build` sentence,
> or a `grammarRule` compact card** (never a passive card). `particle_cloze` is also limited to
> within 2 modules of the particle's introduction (§4c). es/ko may still use `phrase_card`.
> Kanji-as-glyph anchoring (row for 意味/理由/…) is fine and now automatic — kanji renders live
> from M8. When reading a "phrase_card" cell below, mentally substitute the ja methods above.

A short list of N5 vocab words where **no image (Noto, custom SVG, or any open-source asset) reliably carries the meaning**. The 4-persona audit (9yo / 16yo / 38yo / 67yo Opus subagents) flagged each below as scoring ≤3 across personas even after the custom-art pass — the concept itself is abstract grammar, not a visual referent.

For these words, **don't ship a `wordImageMcq` card**. Use the alternative step types listed.

## Related docs + source files

- **[n5-vocab-emoji-reference-2026-05-18.md](./n5-vocab-emoji-reference-2026-05-18.md)** — 662-word N5 vocab → emoji map. Single source of truth for assignments when authoring new M8-M30 lessons. Includes 149 additional blocked words categorized + a per-word `note` column.
- **[n5-vocab-emoji-map-2026-05-18.json](./n5-vocab-emoji-map-2026-05-18.json)** — same data, machine-readable.
- `src/shared/assets/notoEmoji.ts` — `notoEmojiUrl()` (handles zero-padding + flag routing) and `lingoArtUrl(kana)` (custom-SVG override map).
- `src/features/lesson/data/_jaGrammarHelpers.ts` — `WORD_IMAGE_MCQ_BLOCKLIST` (runtime guard) + `withoutMcqBlocked()` helper.
- `src/pub/lingo-art/svg/` — 9 custom MIT-licensed SVGs (desk, today, room, shop, photo, sky, hundred, magazine, which).
- `src/pub/noto-emoji/svg/` — 155 vendored Noto SVGs (Apache 2.0).

## Currently authored (have placeholder emoji + custom SVG that the audit graded "weak correlation OK")

These are NOT removed from the curriculum. They have custom art under `src/pub/lingo-art/svg/` that gives a weak correlation cue, but the *primary* teaching surface for these words should NOT be `wordImageMcq` — use the alternatives below.

| Kana | Meaning | Custom art (weak) | Recommended primary step types |
|---|---|---|---|
| あります | exists (thing) | `exists-thing.svg` (box + ✓) | `particle_cloze` ("テーブルの上に本が___"), `build_sentence`, `listening_comp` |
| います | exists (alive) | `exists-alive.svg` (creature + sparkles) | `particle_cloze` ("公園に犬が___"), contrast with あります via `self_explanation_mcq` |
| どれ | which one | `which.svg` (A/B/C/D grid) | `multiple_choice` (ask "Which is X?" with kana options), `dialogue_listen` |
| あなた | you | `you.svg` (pointing finger + YOU label) | `phrase_card` only — gloss, don't drill. Japanese pronouns are context-dropped in practice. |
| わたし | I/me | (Noto 🙋) | `phrase_card` only. Same reason as above. |

## Cards where the audit flagged sibling-age ambiguity but custom art doesn't fully resolve it

| Kana | Meaning | Custom art | Caveat |
|---|---|---|---|
| あに / あね | older brother / sister | `older-brother.svg` / `older-sister.svg` | Kanji badge (兄 / 姉) is what carries the "older" cue, not the face. Acceptable but pair with `dialogue_listen` for age context ("My older sister is 25"). |
| ちち / はは | (my) father / mother | `father.svg` / `mother.svg` | Adult-with-child composition reads as "parent" but doesn't specifically read as "father" vs "older male relative." Pair with `phrase_card` that establishes context ("This is my dad"). |

## Truly image-blocked (do NOT author `wordImageMcq` for these)

Add to this list as new N5 vocab is introduced.

- **Verb conjugation forms** (たべます vs たべる, よみます vs よむ) — same physical action, different politeness. Don't double-card them.
- **Polite-form differentiation** (ます-form is a register marker, not a meaning) — teach via `phrase_card` showing both forms side-by-side.
- **Tense markers** (ました past, ません negative-non-past) — particle/cloze territory, not vocab.
- **Pronouns** (あなた, わたし, かれ, かのじょ) — drop frequency is high in Japanese; don't over-drill via image-MCQ.
- **Demonstratives spatial distance** (これ near / それ mid / あれ far) — image can show pointing but not distance. Use `phrase_card` with positional context.
- **Particle words** (は が を に で へ と の も から まで) — taught via `particle_cloze` only. No image.
- **Copulas** (です じゃない) — function words, no image.
- **Abstract nouns** (意味 / 理由 / 種類 / 場合 / とき / ほう) — when these enter the curriculum, use `phrase_card` + kanji-as-glyph (the kanji itself is the visual anchor).
- **Adjective concepts where polysemy hurts** (たかい "tall" vs "expensive") — disambiguate with two separate cards, each with concrete image.

## Authoring rule

When adding a new vocab word, run this check:
1. Does the meaning have a concrete physical referent? → Noto or custom-art image OK.
2. Does the meaning depend on grammatical context? → No image. Use `particle_cloze` / `phrase_card` / `dialogue_listen`.
3. Are two words distinguished only by politeness or tense? → One image, both forms share it, or no image for the variant.

## End-to-end workflow (when authoring a new M8+ vocab word)

1. **Look up the word in [n5-vocab-emoji-reference-2026-05-18.md](./n5-vocab-emoji-reference-2026-05-18.md).**
   - **Mapped** → copy the listed emoji into your `RowWord` / `ReviewAtom`'s `emoji` field. Done.
   - **Blocked** → add the kana to `WORD_IMAGE_MCQ_BLOCKLIST` in `_jaGrammarHelpers.ts`, and teach the word via `phrase_card` / `particle_cloze` / `listening_build` / `dialogue_listen` only. Never call `wordImageMcq` / `priorWordMcq` / `vocabMcq` with this kana — the guard throws at import.
   - **No-fit** (currently only `テーブル`) → author a custom SVG under `src/pub/lingo-art/svg/`, then add an entry to `LINGO_CUSTOM_ART` in `notoEmoji.ts` keyed by kana. The view code resolves custom-art first, Noto-emoji fallback.
2. **Verify the emoji renders.** `notoEmojiUrl(emoji)` should return a URL that maps to a vendored file under `src/pub/noto-emoji/svg/`. If the file isn't vendored yet, download from `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/<filename>` and drop it under that path (Apache 2.0, no attribution required per pack license).
3. **Author the lesson.** Pull review atoms via `pickReviewAtoms(seed, withoutMcqBlocked(pool), n)` — the helper drops blocked atoms before the seeded pick so the random draw can never land on a blocklisted target.
4. **Run tests.** `npx vitest run src/features/lesson/data/` — the curriculum-coverage and grammar-rule tests import all modules and will fail-fast if a blocked word slips into a visual-MCQ slot.

## Maintenance

- Update this doc when an audit flags a new word as image-MCQ-unsafe. Strip an entry when custom art for it ships and the audit grades it ≥4.
- When the N5 reference doc grows (M-whatever introduces new vocab not in the snapshot), append entries in the same format and re-run the HEAD-check script (`node /tmp/merge_n5.mjs` pattern).
- The 4-persona audit rubric lives in conversation history (2026-05-18 session); rerun it via 4 parallel Opus subagent dispatches when the custom-art pack ships a meaningful update.
