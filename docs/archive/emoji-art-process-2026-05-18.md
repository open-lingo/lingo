# Vocab-card art process (2026-05-18)

The repeatable methodology used to ship Lingo's vocab-card art system. Re-run this whenever a new language ships, a new module introduces ≥10 new vocab words, or the audit needs a refresh.

## Goal

Every authored vocab word has an **image a learner can intuitively correlate with the meaning**, drawn from an **open-source pack we can monetize without paying**. Style consistent (~75% cartoony, ~75% colorful, soft outline, rounded geometry, transparent bg). Words whose meaning has no honest visual referent are explicitly flagged as image-MCQ-unsafe and taught via alternative step types.

## Constraints (non-negotiable)

1. **License:** Apache 2.0 / MIT / CC0 / public-domain only. No CC BY-SA (share-alike), no CC-NC (non-commercial), no proprietary packs (JoyPixels, Emojidex).
2. **Primary pack:** Google Noto Emoji (Apache 2.0, no attribution).
3. **Custom-art top-up:** MIT-licensed in-repo SVGs under `src/pub/lingo-art/svg/`, ~80% Noto style match minimum.
4. **No source-font-dependent text inside SVG art** unless the font is already loaded app-wide (Noto Sans JP is OK; system-ui is not).

## Process (11 steps)

### 1. Inventory the authored vocab

Pull every `(kana, meaningEn, emoji)` tuple from `src/features/lesson/data/`. Use the existing regex pattern in the build script:

```js
const reEmoji = /\{\s*kana:\s*"([^"]+)"\s*,\s*meaningEn:\s*"([^"]+)"\s*,\s*emoji:\s*"([^"]+)"/g;
```

### 2. Audit the resolver

Generate URLs for every emoji via `notoEmojiUrl(emoji)`. HEAD-check each against `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/...`. Real failures reveal resolver bugs (we found two: keycaps need zero-padding < 0x100, regional-indicator pairs need flag routing to `third_party/region-flags/`).

### 3. Collision audit

Find emojis used for ≥2 distinct meanings, both **cross-curriculum** (e.g. 🏠 on both `いえ` "house" and `うち` "home") and **intra-module** (same emoji on multiple words in one lesson). Intra-module collisions kill the visual-MCQ distractor pool — they MUST be swapped.

### 4. Style baseline (Playwright)

Render every shipped Noto SVG in a grid, screenshot at production size (64px — the actual lesson-card size). Rate the pack on quantifiable traits:

- **Cartoony %** (subjective — degree of stylization vs realism)
- **Colorful %** (saturation, # of colors per glyph)
- **Outline weight** (px equivalent at native 128px viewBox)
- **Geometric style** (rounded vs sharp)
- **Background** (transparent only)

Any swap or custom art must stay inside this style envelope.

### 5. Refinement pass

For each collision, pick a Noto alternative that:
- Reads as the target meaning (not a related-but-different concept)
- Stays in style
- Doesn't introduce a new collision

Example: `かわ` "river" was 🏞️ — but 🏞️ literally **is** the "national park" emoji and was already on `こうえん` "park". Swap: `かわ` → 🛶 (canoe = river travel) didn't work either (Edith audit: "boat, not river"); pass 4 settled on `かわ` → 🏞️ and `こうえん` → 🌲 (evergreen tree).

### 6. 4-persona audit (Opus subagents, parallel)

Dispatch 4 Opus agents at different ages: **9yo (Maya), 16yo (Trent), 38yo (Devon), 67yo (Edith).** Each gets:
- A screenshot of the rendered Noto art for every word
- A flat `kana | meaning | emoji` text list
- Instructions to score 1-5 (5 = instant click; 1 = misleading)
- Persona-specific lenses (kids hate "thinking too hard", adults hate collisions, retirees can't parse modern pictograms or micro-detail)

Convergent failures (≥3 personas mark a word ≤2) are the real bugs. Wave failures (1 persona dissatisfied) are taste.

### 7. Custom-SVG fill (only for convergent failures, ~80% style fit OK)

For each convergent failure, author a custom SVG in `src/pub/lingo-art/svg/` in Noto-adjacent style:
- 128×128 viewBox, transparent bg
- 2-2.5px `#1e293b` outline
- Flat fill with saturated primary palette
- Rounded geometry
- No system-ui font text dependencies

Wire each new SVG into `LINGO_CUSTOM_ART` (in `src/shared/assets/notoEmoji.ts`) keyed by kana. The view code uses `lingoArtUrl(kana) ?? notoEmojiUrl(emoji)` so custom-art wins where it exists.

### 8. Production-size validation

Screenshot each new SVG at **48px / 64px / 96px / 144px** sizes side-by-side via Playwright. The 64px column is the production cell size — if it doesn't read there, refine. Drop any text that's unreadable at 64px (e.g., a "$5" price tag, a date stamp in cursive).

### 9. Block-list the unwinnable

Words whose meaning has no honest visual referent get added to `WORD_IMAGE_MCQ_BLOCKLIST` in `_jaGrammarHelpers.ts`. The `vocabMcq` / `wordImageMcq` / `priorWordMcq` helpers throw on import if a blocked kana lands as the MCQ target. Pool helpers (`withoutMcqBlocked()`) filter blocked atoms out of random-draw sources so seeded picks never land on them.

Blocked categories: pronouns, particles, polite-form variants, abstract grammar (existence-of, tense markers, copulas), demonstrative distance, weekday labels (Noto has no per-day glyph), and concept words like 意味 / 理由 / 種類.

### 10. Curriculum integration (subagent)

Dispatch one Opus subagent to:
- Replace `wordImageMcq` calls on blocked words with `listeningBuild` / `listeningComp` / `phrase_card` / `dialogue_listen` (whatever fits the surrounding density)
- Add `wordImageMcq` exposure for words that just gained custom art but weren't visual-tested in their primary lesson
- Filter pre-existing review pools with `withoutMcqBlocked()` so seeded picks can't land on blocked targets

Tests fail-fast (`npx vitest run`) when a pool is too thin or a blocked word slips through.

### 11. Reference compile (for future modules)

Dispatch 4 Opus agents at ~165 words each to assign emoji across the **whole next level's vocab** (e.g., the full 662-word N5 list from `wkei/jlpt-vocab-api`). Each produces JSON with `{word, kana, meaning, emoji, blocked, note}`. Merge, HEAD-check every URL, surface collisions vs already-authored vocab. Output to:

- `docs/n5-vocab-emoji-reference-<date>.md` (human table)
- `docs/n5-vocab-emoji-map-<date>.json` (machine-readable)

Future lesson authors pull from this reference when introducing a new word — no fresh emoji decision required at authoring time.

## Commands you'll actually run

```bash
# Inventory
node -e "$(cat scripts/extract_words.mjs)"   # ad-hoc; not committed yet

# HEAD-check URLs
node /tmp/verify_urls.mjs                    # template in conversation history

# Visual baseline screenshot (any URL → PNG)
node scripts/shot.mjs <path> [width] [height] [--full]

# Custom SVG audit at production size
# Build an HTML doc with 48/64/96/144 columns per SVG, screenshot, Read inline.

# 4-persona audit dispatch
# Agent({ model: "opus" }) × 4 in parallel, run_in_background: true.

# Run tests
npx vitest run src/features/lesson/data/
npx tsc --noEmit
```

## Why this works (and where it doesn't)

**Works:** the rubric is consistent, the Noto pack is wide enough that ~77% of vocab gets a clean canonical emoji, and the block-list keeps abstract grammar out of visual-MCQ where it'd mislead.

**Doesn't:** sibling-age contrast (兄/弟, 姉/妹) has no clean solution in any flat emoji pack — even our custom SVGs with kanji badges only weakly carry the "older" cue. Same with ZWJ family glyphs (👨‍👦 reads as "man with boy" not "father"). For these we accept the kana label carries the meaning + use `phrase_card` to establish context.

**Cost:** roughly 6 Opus subagent runs per language pass (4 persona audit + 1 curriculum integration + 1 reference compile). Each ~$0.50-1.00. The methodology pays back in agent-time saved on per-lesson art decisions later.

## When to re-run

- New language ships → full process, top to bottom.
- New module introduces ≥10 new vocab words → just steps 1-4 + 9 (skip personas if vocab is concrete-noun-heavy).
- Audit feedback comes in from real users → step 6 (4-persona) + step 7 (custom SVG fills for new failures).
- Resolver bug surfaces (404s in production) → step 2.
