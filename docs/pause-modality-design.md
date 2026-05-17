# Pause-modality system — design (future scope)

Written 2026-05-16. **Not implemented.** Tracked as task #97.

Reason for deferral: Spencer wants friend testers to experience the full
lesson flow (speaking + listening) for the first round of feedback. The
pause system is for when learners with no mic / no headphones / sensory
preferences start showing up — currently a low-priority case.

## Two surfaces

### A. Inline "skip for 20 min" affordance
- Small ghost button under every `SpeakingStep` / `ListeningBuildStep` /
  `ListeningCompStep`: *"🔇 Skip speaking for 20 min"* (or "listening")
- Tap → write expiry timestamp to localStorage; from that point any
  matching step gets substituted on the fly
- Lesson header shows a chip: *"Speaking paused — 18 min"* with × to
  restore

### B. Persistent settings toggles
- New "Lesson types" section in Settings
- Two checkboxes: "Speaking practice (uses your mic)" + "Listening
  practice (audio)"
- **Guard:** when one is OFF, the other toggle is disabled with a
  tooltip *"At least one must stay on"*
- Stored in the existing Settings context (`learning.speakingEnabled`,
  `learning.listeningEnabled`)

## State precedence (when consulting `isSpeakingActive` / `isListeningActive`)

1. Settings OFF → false (persistent — no timer shown)
2. Timer active → false (paused until expiry)
3. Otherwise → true

## Substitution map

When a paused step would render, the player substitutes it on the fly:

| Paused step | Substitute |
|---|---|
| `speaking` ("say こえ") | `multiple_choice` — "What does こえ mean?" with 4 EN options |
| `listening_build` (audio → build) | `word_image_mcq` — show the word directly, pick the matching emoji |
| `listening_comp` (audio → pick meaning) | `multiple_choice` reading-based — show kana, pick meaning |

For variety: rotate among 2-3 substitute shapes so a 20-min skip doesn't
feel like the same card six times.

## Storage shape

```ts
// Timed pause (sessionish, expires)
const KEY = "lingo_modality_paused_v1";
type ModalityPauseState = {
  speakingExpiresAt?: number; // ms epoch
  listeningExpiresAt?: number;
};

// Persistent — extends existing Settings learning section
type LearningSettings = {
  ...
  speakingEnabled: boolean; // default true
  listeningEnabled: boolean; // default true
};
```

## Helper API — new file `src/features/lesson/modalityPause.ts`

```ts
isSpeakingActive(): boolean
isListeningActive(): boolean
pauseSpeakingFor(ms: number): void
pauseListeningFor(ms: number): void
restoreSpeaking(): void
restoreListening(): void
getSpeakingRemainingMs(): number  // 0 if active
getListeningRemainingMs(): number
substituteIfPaused(step: LessonStep): LessonStep  // dispatched in LessonPage
```

## Edge cases handled

- **Mastery interaction:** substituted steps record completion normally
  → mastery (★) unaffected
- **Whisper preload:** pause UX won't trigger model download
- **Reciprocal pause:** listening off but speaking on still works
  (speaking has audio reference but isn't gated on hearing)
- **Toast deduplication:** one-time-per-session "Speaking paused — you'll
  see word puzzles instead"
- **Settings vs timer race:** if a learner pauses listening for 20 min
  then disables listening in settings, the persistent disable wins (no
  timer shown anymore — but on re-enabling in settings, the original
  timer expiry should NOT auto-resume; clear it)

## Phases (~10-14h total)

1. **Storage helpers + Settings type extension** (S, ~2-3h) —
   `modalityPause.ts` + add `speakingEnabled` / `listeningEnabled` to
   the Settings type
2. **Substitution helper + LessonPage dispatch wiring** (M, ~2-3h)
3. **Inline skip button + header chip + restore-toast** (M, ~3-4h)
4. **Settings UI with both-disabled guard** (S, ~1-2h)
5. **Tests (substitution map, expiry, guard)** (S, ~1h)

## Trigger to revisit

Build this when:
- Friend testers report mic-less testing trouble, OR
- A user explicitly asks for a "no mic" mode, OR
- We expand to a language where speaking infrastructure is weaker
- (Or just any time we want to broaden accessibility)

## Related work

- Speaking step renderer: `src/features/lesson/components/steps/SpeakingStepView.tsx`
- Speech flag (now default-on): `src/shared/speech/featureFlag.ts`
- Settings context: search for `useSettings` / `learning.*` paths
- LessonPage step dispatch: `src/features/lesson/LessonPage.tsx`
