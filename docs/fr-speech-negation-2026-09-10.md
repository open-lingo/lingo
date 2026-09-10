# FR speech grading — jamais/rien/plus (2026-09-10)

Verification for `docs/fr-m18-brief-2026-09-10.md`'s two unverified claims.
Test: `src/features/languages/fr/__tests__/frSpeechNegation.test.ts` (real
`scoreAlternativesGeneric`; `loose-match.ts` **unchanged** — 283/283 speech
tests green, incl. all 132 elision cases).

## Claim 1: does the matcher grade jamais/rien/plus correctly?

**Ne-drop generalizes cleanly** (matches the `pas` precedent
`frSpeechElision.test.ts` already verified): "je mange jamais", "je vois
rien", "je mange plus"/"j'mange plus"/"jmange plus" all pass. No fix needed.

**Four measured false-positive risks, none fixed** (each needs raising
`PARTIAL_COVERAGE_FLOOR` or edit-distance/phonetic scoring — matcher-wide,
not a targeted fold like the apostrophe fix):
- **rien/bien**: "je ne mange bien" vs target "…rien" scores 0.923 (perfect); bare words 0.75 (close, still a pass).
- **jamais/mais**: "mais" is a literal substring of "jamais" (0.667 coverage, over the 0.6 floor) → 1.0 via substring path; full-sentence 0.857.
- **jamais/rien cross-swap**: shape-dependent — "je n'ai rien"/"…jamais" fails (0.545), but "je ne sais jamais"/"…rien" (brief's L1 sentence) scores 0.643 (close, a pass).
- **encore/plus** (near-opposite meaning): "il habite encore à Paris" vs "…plus à Paris" scores 0.75 (pass); dropping negation entirely scores 0.737 (also a pass).

**Structural, not unverified**: a text-based ASR scorer cannot see `plus`'s
silent vs. voiced final -s — the transcript text is identical either way.
No `speaking` step on `ne…plus` can verify pronunciation, only wording.

## Claim 2: does edge-tts render negative «plus» as [ply] (silent -s)?

Generated 2 real clips (`fr-FR-DeniseNeural`, prod voice) via a scratch deck:
`.venv/bin/python -m pipeline.tts.generate --provider edge --lang fr --decks-dir
<scratch>/decks --out-dir <scratch>/out`. Isolated each clip's "plus" segment
(silencedetect @ -50dB + spectrogram); compared high-frequency energy ([s]/[z]
= broadband noise ~4–10kHz; a vowel/liquid ending is not):

| clip | "plus" segment | full-band RMS | >4kHz RMS | gap |
|---|---|---|---|---|
| «je ne mange plus» | 266ms | −27.3dB | −47.1dB | **−19.8dB** |
| «deux plus deux» | 323ms | −22.6dB | −27.5dB | **−4.9dB** |

Spectrograms confirm it visually: the arithmetic clip shows a bright
broadband burst to 10kHz where "plus" ends (classic /s/); the negative
clip shows near-silence above ~5kHz at the same point.

**Confidence: high, not certain.** Segmentation was automatic (silencedetect)
+ visual estimation, not forced alignment; per task constraints I did not
(cannot) listen. Spencer should confirm by ear — clips + spectrogram PNGs in
scratchpad `fr-plus-probe/{out/fr,analysis}/`:
`1e45c1eac1af9e7a.mp3` («je ne mange plus»), `f55769634e918eec.mp3` («deux plus deux»).

## Constraints for the m18 dispatch (paste verbatim)

1. Ne-dropped colloquial hearings of jamais/rien/plus grade safely — author freely, same as `pas`.
2. Never author an isolated bare-word `speaking` target for `jamais` alone (mais-substring false positive, scores perfect).
3. Don't rely on a `speaking` step to teach/prove jamais-vs-rien or rien-vs-bien, especially L1/L3/L6 discrimination — use build/cloze/MCQ instead.
4. Never pair an `encore`-recall sentence against a `ne…plus` target as spoken alternates — can grade equivalent despite opposite meaning.
5. `ne…plus` `speaking` steps (once promoted past L7's written-only default) confirm wording only, never the silent -s. TTS probe (high, not certain, confidence) supports edge-tts rendering it correctly as [ply]; Spencer's ear check is still the final word.
