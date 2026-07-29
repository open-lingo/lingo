# Conversation Trainer — Design Spec

**Date:** 2026-07-24
**Status:** DESIGN (approved in brainstorming; pending spec review → writing-plans)

## Goal

A scripted **roleplay conversation trainer** at `/practice/conversation`: the app voices one speaker, the learner produces the other speaker's lines, turn by turn. Framework-based and language-agnostic — Korean and Japanese in v1 — reusing the existing lesson production primitives and SRS. It turns dialogue *content the course already has* into an interactive dialogue *surface*, closing the gap where Korean has a mini-dialogue in every module (m3–m27) but no dialogue player.

**Explicitly NOT this build:** the comprehensibility-gated LLM conversation partner (`local-conversation-llm-recon-2026-07-05.md`). That is a separate, later build; this trainer owns the `/practice/conversation` surface so the LLM partner can slot in as a second "free chat" mode without rework.

## Architecture

Three units with clear boundaries:

1. **Data — a per-language scenario registry.** `ConversationScenario[]` per language (`ko/conversations.ts`, `ja/conversations.ts`), mirroring how the per-language curriculum + `conjugationProvider` registries work. Populated in v1 by **converting the existing per-module mini-dialogues** into structured form.
2. **Provider — a language-agnostic resolver.** `getConversationScenarios(languageId, reachedModule)` filters to unlocked scenarios; wired through the `LanguageModule` capability slot (like `vocabGraduation`/conjugation) so each language plugs in its registry.
3. **Player — one shared `<ConversationPlayer>`.** Sequences a scenario's lines: app-role lines auto-play (multi-voice TTS) and show text + translation; learner-role lines render a graded production step. Reuses the existing step primitives — no new step engines.

### Data model

```ts
type ConversationSpeaker = "A" | "B";

interface ConversationLine {
  speaker: ConversationSpeaker;
  text: string;                     // target-language line, e.g. "커피 한 잔 주세요"
  translation: string;              // English gloss
  audioText: string;                // TTS key (usually === text; may drop trailing 。/？)
  romanization?: string;            // optional reading aid (KO Revised Romanization / JA romaji)
  exercisedAtomSurfaces?: string[]; // SRS credit when this is a LEARNER line
  exercisedGrammar?: string[];
  tiles?: string[];                 // build-tile pool (correct tokens + distractors) for the tiles rung
}

interface ConversationScenario {
  id: string;                       // "ko-m5-cafe"
  languageId: string;               // "ko" | "ja"
  module: number;                   // unlock module (== the source mini-dialogue's module)
  title: string;                    // "At a cafe"
  situation: string;                // one-line setup shown before play
  learnerRole: ConversationSpeaker; // which side the learner produces
  lines: ConversationLine[];        // ordered, linear (no branching in v1)
}
```

### Content: convert existing mini-dialogues

Every JA & KO module m3–m27 has a "Mini-dialogue —" lesson (`ko/curriculum/m*.ts`, `ja/curriculum/m*.ts`) whose exchange currently lives as `infoStep` text plus scattered practice steps. Conversion is a **content pass**, not new authoring: lift the exchange into `ConversationScenario.lines`, split by speaker, attach per-line `translation`/`audioText`, mark the learner's side, and populate `tiles` (correct tokens + a few same-category distractors) for each learner line. JA additionally has structured dialogue data in its `dialogueListen` factory calls — reuse those where present. Result: ~25 scenarios per language, already comprehensibility-calibrated to their module.

### Core loop — roleplay with a production ramp

`<ConversationPlayer scenario>` walks the lines in order:

- **App-role line:** render a speaker chip + line text + translation (reading aids per Settings), **auto-play its TTS in that speaker's voice**, then advance (auto after playback, with a replay control).
- **Learner-role line:** render a graded production step. Wrong → retry (feedback), clean → advance. On success, **SRS-credit the line's `exercisedAtoms` on the production modality** via the existing `gradeFromLesson` (correct→Good, retried→Hard, wrong→Again).

**Production ramps across the learner's turns within a run:** the first learner turn is **build-from-tiles**, middle turns are **typing** (reusing the translate/`TranslateStepView` input, incl. the KO romaja→Hangul compose), and the last learner turn (and any replay) is **speak** (reusing `SpeakingStepView`, which is now KO-capable and grades via the just-fixed `scoreAlternativesGeneric`). A run-level override lets the learner pin a single mode (Tiles / Type / Speak). This delivers the ramp the roleplay loop was chosen for while keeping tiles as the reliable floor.

### Multi-voice TTS

Two speakers need two distinct voices per language. The manifest keys audio as `<lang>:<text>`, with a voice-qualified variant already in use for JA (`ja-keita:<text>` — the male dialogue voice; backend `gen_keita_dialogue.py` / `gen_dialogue_voices.py`). The player picks a voice per speaker: **speaker A → the default language voice, speaker B → a voice-tagged second voice**, and fetches audio via the speaker's voice tag.

- **JA:** default Nanami + existing `ja-keita`. No backend work.
- **KO:** default `ko-KR-SunHiNeural` (SunHi, female) + **add a second voice `ko-KR-InJoonNeural` (InJoon, male)** — a small addition to `lingo-core/scripts/tts/generate.py` + the KO deck-emit, plus a `ko-injoon:<text>` manifest tag. **This is the one backend dependency.**

`getTtsUrl` gains a `voice?` argument (default = language default) resolving to the voice-tagged manifest key; falls back to the default voice, then to browser synthesis, so a missing second-voice clip degrades gracefully rather than breaking a run.

### Surface, routing, gating

New `/practice/conversation` pillar tile in the practice hub (`features/practice/`). The landing lists scenarios up to the learner's reached module (locked beyond, like the conjugation hub); **each scenario unlocks with its module** (KO m3 "meeting someone" available early). Pick a scenario → run it → completion summary (turns, accuracy, atoms produced).

## Error handling

- Missing second-voice TTS clip → fall back to default voice → browser synthesis (never a silent/blocked turn).
- Speech recognition unavailable/denied → the speak rung degrades to type for that turn (no dead end).
- A scenario whose learner-line tokens aren't covered by its `tiles` pool fails a build-time assertion (below), not at runtime.

## Testing

- **Provider unit tests:** scenario resolution by reached module; learner-line extraction; tile-pool validity (each learner line's correct tokens ⊆ its `tiles`).
- **Comprehensibility gate** (reuse the `curriculumAssertions` pattern): every content word in every scenario decomposes to atoms with `fromModule ≤ scenario.module`. Since we convert already-calibrated mini-dialogues this should hold; the assertion locks it.
- **`<ConversationPlayer>` render smoke:** an app line plays + shows translation; a learner line renders the ramped production step; a correct answer advances and writes the expected production SRS grade.
- **Per-language parity:** KO and JA each expose scenarios for their content modules; `getConversationScenarios` respects the module gate both directions.

## Scope boundaries

**In (v1):** KO + JA; convert existing mini-dialogues; roleplay loop with tiles→type→speak ramp; `/practice/conversation` module-gated tile; production SRS credit on learner lines; second KO voice.

**Deferred:** the LLM conversation partner (drops into this surface as a second mode); branching dialogues; a dedicated new-scenario bank beyond the converted mini-dialogues; SRS-adaptive per-turn difficulty; ES (add once its mini-dialogue content is confirmed — ES already has the `dialogueListen` factory, so the player is ready for it).

## Open risks

- **Conversion effort** is ~25 scenarios × 2 languages of careful content work (speaker split, tiles, atom tagging). Front-loaded but mechanical; the comprehensibility assertion catches miscalibration.
- **Second KO voice** requires a backend TTS generation run; until it lands, KO runs on one voice (both speakers same voice) — acceptable degradation, flagged in the plan.
