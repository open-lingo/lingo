# Korean (Hangul) stroke-order practice — worktree report

Branch: `ui/ko-stroke-order`

## Feasibility verdict: YES — the JA engine was reused as-is, zero engine changes.

The existing glyph/stroke engine (`src/shared/glyphs/`) is fully script-agnostic.
Adding Hangul required **no changes to the renderer, animation hook, comparison
masking, or the step components** — only data + three small registration edits.

### How the engine generalizes

The pipeline is keyed entirely off two payload fields the alphabet session
already populates per script:

- `step.payload.scriptId` → `getReferenceFor(scriptId, symbol)` resolves bundled
  SVG stroke data from `data/<scriptId>.json`, else falls back to the
  non-deterministic system-font reference.
- `step.payload.hasStrokeOrder` (from `AlphabetDef.hasStrokeOrder`) → gates the
  numbered stroke guides + "Replay stroke order" animation in
  `SymbolTraceStepView` / `SymbolProductionStepView`.

`makePayload()` in `alphabetSession.ts` sets `scriptId: alphabet.id` ("hangul")
and `hasStrokeOrder: alphabet.hasStrokeOrder` for **every** script uniformly, so
the moment Hangul data exists and the flag flips, the `/practice/alphabet/hangul`
trace + production surfaces light up automatically. Same `[0,0,109,109]`
KanjiVG-style viewBox, same `svgReference` rasterization, same
`renderStrokesProgressive` animation, same `getTotalLength`-driven stroke reveal.

## What shipped

**Unit:** per-JAMO stroke order — the pedagogically correct unit for Hangul.
A Korean syllable block is composed from jamo; teaching stroke order at the jamo
level is how Hangul handwriting is actually taught (and it's a bounded, clean
data set vs. 11,172 precomposed syllable blocks).

**40 basic jamo** — the full set in the `ko` `AlphabetDef.characters` list:

- 14 plain/aspirated consonants: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ
- 5 tense consonants: ㄲ ㄸ ㅃ ㅆ ㅉ
- 6 basic vowels: ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ
- 4 y-vowels: ㅑ ㅕ ㅛ ㅠ
- 11 compound vowels: ㅐ ㅔ ㅒ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ

Every jamo carries canonical stroke order (top-to-bottom, left-to-right;
horizontal-before-vertical at corners), with each stroke's `start` point matched
to its path `M` command so the numbered guide circles land correctly.

## Files

- `src/shared/glyphs/data/hangul.json` — **new.** 40 jamo, KanjiVG-style
  `[0,0,109,109]` viewBox.
- `src/shared/glyphs/registry.ts` — registered the lazy `hangul` loader +
  `"hangul"` in the `ScriptId` union (Vite code-splits it into its own
  5.6 kB / 1.6 kB-gzip chunk, same as the kana chunks).
- `src/shared/domain/languageConfig.ts` — `hasStrokeOrder: true` on the `ko`
  Hangul alphabet; comment refresh.
- `src/shared/glyphs/data.test.ts` — Hangul coverage tests (every jamo in the
  def + every section character has stroke data; path/start integrity).
- `src/shared/glyphs/types.ts` — doc comment refresh.
- `src/features/languages/ko/curriculum/_hangulRowHelpers.ts` — comment clarifying
  the jamo-vs-syllable split (curriculum steps trace syllable blocks → no
  per-block stroke data → `hasStrokeOrder` stays false there; jamo surface gets
  full stroke order).
- `src/shared/components/SiteFooter.tsx` + `en.json`/`ko.json` — attribution:
  the footer credited only "KanjiVG · CC BY-SA 3.0". Hangul jamo data is
  hand-authored original work, so added "Hangul stroke data © Open Lingo".

## Data source

**Hand-authored.** No suitable bundled/MIT Hangul stroke source existed in
`node_modules`. Jamo are geometrically simple (straight lines + a handful of
ovals/curves for ㅇ/ㅎ), so authoring clean skeletal centerlines in the existing
KanjiVG coordinate space — with correct canonical stroke order and direction —
was straightforward and accurate. Original work, no license encumbrance (vs.
KanjiVG's CC BY-SA 3.0 for the JA kanji/kana).

## Verification

- `npx tsc --noEmit` — clean.
- `npm run build` — clean; `hangul` chunk emitted (5.56 kB / gzip 1.60 kB).
- `npm run test:run` — 1022 passed / 112 files (8 glyph tests incl. new Hangul
  coverage).
- Screenshot (`docs/screenshots/ko-stroke-trace.png`): the Hangul trace surface
  at `/ko/practice/alphabet/hangul/learn` renders the faded ㄱ guide template
  with the numbered stroke-start circle. Live verification also confirmed the
  "Replay stroke order" animation drawing ㄱ progressively and the 2-stroke ㅏ
  animating in correct order (long vertical first, then the short branch).

## Follow-ups (not in scope this window)

- **Syllable-block stroke order.** The KO *curriculum* lessons (`_hangulRowHelpers`)
  trace whole syllable blocks (가, 나, 고기 …), which have no per-block stroke
  data, so they fall back to the system-font guide. Composing block stroke order
  from the constituent jamo (positioning + scaling each jamo into the block's
  left/right/bottom slot) is the natural extension — the jamo paths shipped here
  are the building blocks for it.
- **Korean alphabet audio.** `letterDetails.audioKey` is populated for the first
  consonant/vowel rows only; tense/compound jamo have romanization but no audio
  asset yet (pre-existing gap, unrelated to stroke order).
