# Image-Blocked Vocab — Authoring Guide (2026-05-18)

A short list of N5 vocab words where **no image (Noto, custom SVG, or any open-source asset) reliably carries the meaning**. The 4-persona audit (9yo / 16yo / 38yo / 67yo Opus subagents) flagged each below as scoring ≤3 across personas even after the custom-art pass — the concept itself is abstract grammar, not a visual referent.

For these words, **don't ship a `wordImageMcq` card**. Use the alternative step types listed.

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

Update this doc when a new word fails the visual test.
