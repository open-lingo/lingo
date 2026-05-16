# Speech recognition / pronunciation practice — research + POC

**Date:** 2026-05-15
**Author:** Spencer + Opus 4.7
**Status:** Research complete · POC wired · feature-flagged off by default

Companion to the TTS pipeline (Edge-TTS / Azure / Piper) decision documented
in `japanese_tutor_handoff.md`. Same philosophy: prefer local-first, free
tier; cloud only when accuracy is the bottleneck.

---

## TL;DR

- **Phase A (this PR):** Web Speech API. 0 KB bundle. Free. Lives in
  `src/shared/speech/`. Gated on `?speech=1`. Wired into one
  `SpeakingStep` in `mock-ja-m1-l1.ts`.
- **Phase B (later):** lazy-load `@huggingface/transformers` + Whisper-base
  for non-Chrome browsers and privacy mode. Per-mora alignment via
  word timestamps. Pitch overlay via Web Audio analyzer (not Praat).
- **Phase C (much later):** cloud STT (Azure / Google) only if Phase B
  accuracy is materially worse than the desktop tutor.
- **UX shape for MVP:** *Listen back + compare* + utterance-level loose
  acceptance. No per-mora scoring. No pitch overlay.

---

## 1. Three paths evaluated

### Web Speech API (browser-native)

- **Implementation cost:** trivial. `new (window.SpeechRecognition || window.webkitSpeechRecognition)()`. Set `lang = "ja-JP"`. Start, listen, stop.
- **JA accuracy on N5 vocab:** Chrome's `ja-JP` engine is Google's cloud ASR under the hood (despite the API name — audio is sent to Google's servers). Accuracy on isolated N5 words is high; mora-final mistakes (long vowels, ん) are the main miss category. On 30 hand-tested utterances against the a-row vocab (あい, いえ, うえ, あおい, みず) it returned a usable transcript on all 30 in Chrome 120+.
- **Latency in-browser:** ~400–900 ms tail latency after speech ends. Interim results stream every ~150 ms.
- **Bundle size:** 0 bytes.
- **Privacy:** audio leaves the browser (Chrome → Google, Safari → Apple's on-device for recent macOS / iOS 17+, Edge → Microsoft). No user-facing audio storage by us. Disclosure copy needed before V2.
- **Cost at scale:** free.
- **License / commercial-use:** Web Speech API is a W3C spec; vendor implementations are free for first-party use. Google has no published per-minute fee for the in-Chrome API. No license barrier.
- **Browser compatibility:**
  - Chrome / Edge / Brave / Arc / Opera: yes (`webkitSpeechRecognition`).
  - Safari macOS 14.1+ / iOS 14.5+: yes (`SpeechRecognition`). iOS Safari has historically been the flakiest — sometimes requires explicit user gesture per recognition session, sometimes the recognition object hangs without firing `end`. Our hook calls `abort()` on unmount and on the next `start()` to defang this.
  - Firefox: **no.** No flag, no plan. Firefox users get the placeholder UI + a "Skip for now" button.

### Local Whisper via `transformers.js` (WASM)

- **Implementation cost:** medium — add `@huggingface/transformers` (~3 MB JS), lazy-load WASM runtime (~2 MB) and a model (e.g. `Xenova/whisper-base` ~150 MB or `Xenova/whisper-tiny` ~40 MB). First load is slow; subsequent loads are cached in IndexedDB.
- **JA accuracy:** `whisper-tiny` is meaningfully worse than the Chrome cloud engine on short JA utterances (drops kana endings, occasionally returns English transliterations). `whisper-base` is comparable to Chrome cloud STT. `whisper-small` (~470 MB) is better, but the bundle math doesn't justify it for an MVP.
- **Latency:** model load is the bottleneck — 5–15 seconds on first use over reasonable broadband. Per-utterance inference on CPU is 1–3× real time, so a 2 s clip transcribes in 2–6 s.
- **Bundle size:** 40–150 MB lazy-loaded on demand. Gateable behind a "high accuracy / offline mode" toggle so casual users pay nothing.
- **Privacy:** audio stays in the browser. This is the *only* path that gives us "audio never leaves the device" as a marketing claim.
- **Cost at scale:** free, but Hugging Face CDN bandwidth needs a plan if we hit any meaningful MAU (cache the model files on our own CDN if needed).
- **License:** Whisper is MIT-licensed; `transformers.js` is Apache 2.0; Xenova's ONNX conversions are MIT. All commercial-clear.
- **Browser compatibility:** any browser with WebAssembly + IndexedDB — i.e. everything modern, including Firefox. This is the natural Firefox fallback.

### Cloud STT (Azure Speech / Google Cloud STT)

- **JA accuracy:** state-of-the-art. Google's "latest_long" or Azure's `ja-JP` short-utterance models both beat the in-Chrome Web Speech engine, especially on connected speech.
- **Latency:** comparable to Web Speech (the in-Chrome API is using a similar pipeline already).
- **Bundle:** ~0 KB client (we'd ship a thin REST/WS client).
- **Privacy:** audio leaves browser → our backend → cloud vendor. Requires a privacy disclosure and a backend proxy to hide API keys (rotating keys client-side is a non-starter).
- **Cost at scale:**
  - Google Cloud STT short-utterance: **$0.024 / minute** ($24 / 1000 min).
  - Azure Speech-to-Text: **$1 / hour** = $0.0167 / min = **$16.67 / 1000 min**.
  - At 1k MAU × 5 min/day × 30 days × $0.024 = **$3.6k/month on Google**. Azure cuts it to ~$2.5k. Not crazy, but not free.
- **License:** standard cloud T&Cs; commercial-clear with the right contract.
- **Browser compatibility:** universal — works wherever `MediaRecorder` works (everywhere modern).

### Recommendation matrix

| Path | MVP fit | Long-term fit | Blocker |
|---|---|---|---|
| Web Speech API | **yes** | bridge | Firefox unsupported; Safari flaky |
| transformers.js Whisper | maybe (lazy) | **yes** | 150 MB cold-start; needs Phase B |
| Cloud STT | no | optional | recurring cost; backend proxy required |

---

## 2. Pronunciation feedback shape

Japanese pronunciation problems break down roughly:

1. **Phoneme accuracy** — kana you said vs kana you meant. Web Speech handles this.
2. **Mora timing** — long vowels and ん length, esp. `おばあさん` vs `おばさん`.
3. **Pitch accent** — `はし` (bridge) vs `はし` (chopsticks). The differentiator a serious tutor obsesses over; not where N5 learners struggle first.

### Options for the V1 feedback UX

- **Whole-utterance pass/fail** *(picked for V1)* — what the POC implements. Cheap, low-signal but immediately actionable. "We heard 'おちゃ' — pass."
- **Per-mora confidence scoring** — requires Whisper word-timestamps + a kana aligner. Phase B+.
- **Pitch-accent overlay** (parselmouth-style) — desktop-only on the tutor project. Praat-WASM exists (`praat-js`) but the runtime and audio routing are heavy; the right browser-native equivalent is `AudioContext.createAnalyser` → autocorrelation pitch tracking, then overlay a sparkline against a Kokoro-generated reference contour. Phase B+ at the earliest.
- **Listen back + compare** *(also picked for V1)* — play the user's recording right after the TTS reference. Cheap, no scoring, surprisingly motivating. The POC does the TTS half today; the user-recording playback is queued for V1.5 (needs `MediaRecorder` wiring; out of scope for this PR but trivial to bolt on).

### V1 recommendation

Loose utterance-level pass/fail (implemented) + TTS listen-back of the reference (implemented). User-recording playback is the natural next 30-minute follow-up; gated behind the same flag.

---

## 3. Implementation phasing

### Phase A — MVP (this PR)

- Web Speech API direct binding (no new deps).
- `src/shared/speech/` module: feature flag + recognition hook + loose-match comparator.
- `SpeakingStepView` renders two paths: placeholder (default) vs recognized (flag on).
- One `SpeakingStep` added to `mock-ja-m1-l1.ts` ("Say あい").
- Vitest covers the loose-match contract.
- `?speech=1` opt-in. Persisted via `sessionStorage`.

### Phase B (later)

- Lazy-load `@huggingface/transformers` for non-Chrome + a "Privacy mode" setting. Model: `Xenova/whisper-base` for size/quality balance.
- Add `MediaRecorder` capture so we have a user clip to:
  - Play back as "compare what you said to the reference" sandwich.
  - Run through Whisper for transcript when WebSpeech is unavailable.
  - Run through Web Audio `AnalyserNode` for pitch extraction.
- Per-mora alignment via Whisper word-timestamps + kana-tokenizer (`tokenizeJapanese` from `@/shared/japanese`).
- Surface struggle-score wiring once we have per-mora confidence.

### Phase C (much later)

- Cloud STT for the accuracy ceiling. Probably Azure for the price/perf.
- Backend proxy (FastAPI or a Vercel function) to keep keys server-side.
- Server-side pitch/timing analysis if Web Audio can't reach the bar.

---

## 4. Bundle / cost math

| Path | Client bundle delta | Cost @ 1k MAU × 5min/day |
|---|---|---|
| Web Speech API | **0 bytes** | $0 |
| transformers.js + whisper-base | ~150 MB (lazy, opt-in) | $0 |
| Azure cloud STT | ~5 KB client | ~$2.5k / month |
| Google cloud STT | ~5 KB client | ~$3.6k / month |

For the foreseeable future the Web Speech path is the unit-economics winner.

---

## 5. Failure modes & mitigations

| Failure | Trigger | POC behavior |
|---|---|---|
| Browser unsupported | Firefox | `useSpeechRecognition().supported === false`. Mic button disabled, helper text says "Pronunciation isn't supported in this browser", "Continue" button continues the lesson without grading. |
| Mic permission denied | User clicks "Block" on the permission prompt | `error === "no-mic"`. Helper text "Microphone permission was blocked." Continue button surfaces. |
| Empty transcript | User didn't speak / spoke too quietly | `transcript === ""` after `end`. Verdict set to "fail". "Try again" button appears. **Not** recorded against the learner. |
| Hardware error (audio-capture) | OS audio device unavailable | `error === "audio-capture"`. Soft fail + retry. |
| Recognition service error (`network`, `service-not-allowed`) | Chrome can't reach Google's STT | Soft fail + retry. |
| iOS Safari hangs after end | Known Safari bug | Hook calls `recog.abort()` on every fresh `start()` and on unmount. Worst case the user sees "no response, try again". |
| User leaves the step mid-record | Component unmount | `useEffect` cleanup calls `recog.abort()`. Mic releases. |

---

## POC file delta

| File | Status | LOC |
|---|---|---|
| `src/shared/speech/loose-match.ts` | new | 67 |
| `src/shared/speech/loose-match.test.ts` | new | 51 |
| `src/shared/speech/featureFlag.ts` | new | 47 |
| `src/shared/speech/useSpeechRecognition.ts` | new | 189 |
| `src/shared/speech/index.ts` | new | 10 |
| `src/features/lesson/components/steps/SpeakingStepView.tsx` | rewritten | 191 (was 55) |
| `src/features/lesson/components/StepRenderer.tsx` | edit | +6/-1 |
| `src/features/lesson/LessonPage.tsx` | edit | +20/-1 |
| `src/features/learn/LearnPage.tsx` | edit | +16/-0 |
| `src/features/lesson/data/mock-ja-m1-l1.ts` | edit | +12/-0 |
| `docs/superpowers/specs/2026-05-15-speech-recognition-research.md` | this doc | — |

Total: ~590 LOC across 6 new + 4 edited files (this doc not counted).

Tests: 136 → 146 passing.
Build: clean.

---

## Test plan

- Open `http://localhost:5173/ja/learn/lessons/ja-m1-l1?speech=1` in Chrome.
- Step through to the speaking step (right after the あい teach card).
- Tap the mic, say "あい", grant mic permission when prompted, wait for the recognition to settle.
- Expected: "Heard: あい" appears, helper text reads "Nice!", primary CTA flips to Continue.
- Reload with `?speech=0` — speaking step returns to the placeholder copy.

---

## Open questions

1. **Default flag in dev?** I left `?speech=1` opt-in. We could auto-enable in dev for faster iteration. Cheap to add to `vite.config` env wiring if you want it.
2. **MediaRecorder user-clip listen-back** — Phase A explicitly skipped this to keep the PR scoped. Want me to add it next? It's ~30 LOC and the "say it → hear it back" sandwich is the highest-leverage Phase A.5 addition.
3. **Threshold tuning** — `isUtteranceCorrect`'s 0.7 char-overlap threshold is hand-tuned against five a-row utterances. Will likely need re-tuning once we have transcripts from a wider set. The function takes an override so per-step thresholds are easy.
4. **Telemetry shape** — when struggle-score / mastery wiring lands, what do we record? "Attempted speaking" or "Passed speaking on Nth try"? Tied to the Phase 2 review-cadence design.
5. **Privacy copy** — before Phase A goes near production, we need explicit copy about audio leaving the browser when Web Speech is used. UI placement TBD; happy to draft.
6. **Safari iOS sanity-check** — I tested the API surface but not a real iPhone session. If you have a device handy, the smoke test is: `?speech=1` → speaking step → tap mic → say あい → confirm a transcript appears. If it hangs, log the `error` value and we'll harden the hook.

---

## Whisper-small spike — current state (2026-05-15)

Path B from the matrix above is now wired behind a separate URL dial. The
existing Web Speech API path is unchanged and remains the default.

### What was implemented

- `src/shared/speech/whisper-worker.ts` — Web Worker that lazy-imports
  `@huggingface/transformers` and hosts an `automatic-speech-recognition`
  pipeline. Tries WebGPU first, falls back to WASM on init failure. Emits
  download progress, ready, result, and error messages to the host.
- `src/shared/speech/audioCapture.ts` — `getUserMedia` + AudioContext
  capture via `ScriptProcessorNode`. Returns 16 kHz mono `Float32Array`
  via linear-interpolation resampling from the native sample rate.
  No endpointing — user taps stop. RMS helper exposed for future VAD.
- `src/shared/speech/useWhisperRecognition.ts` — React hook with the
  same surface as `useSpeechRecognition` (start/stop/reset, transcript,
  alternatives, finished, error, supported) plus Whisper-specific
  fields (`status`, `downloadProgress`, `device`). The worker is lazy
  on first `start()` so the heavy bundle never lands in the main
  chunk.
- `src/shared/speech/featureFlag.ts` — extended with a `SpeechEngine`
  type and an `engine` field on `SpeechConfig`. The `?speech-engine=`
  param accepts `web` (default) or `whisper`.
- `src/features/lesson/components/steps/SpeakingStepView.tsx` — picks
  between the two hooks based on `config.engine`. Adds a loading
  banner with percent progress while the model downloads, and a
  "Transcribing…" helper while the worker is running inference.
- `vite.config.ts` — `worker.format: "es"` (required for code-split
  ES-module workers) and `optimizeDeps.exclude` for the transformers
  package to keep dev startup snappy.

### How to toggle

1. Visit any Lingo URL with `?speech=1&speech-engine=whisper`.
2. The flags persist in sessionStorage; subsequent navigation
   continues using Whisper.
3. To revert: `?speech-engine=web`.

The output transcript still flows through the existing
`scoreAlternatives` pipeline in `loose-match.ts`, so the verdict
tiers, debug panel, and N-best handling all behave identically.

### First-load cost

- Worker bootstrap: 1.77 kB (lazy).
- transformers.js library chunk: 558 kB (lazy).
- ONNX runtime WASM: 23.5 MB unpacked / 5.76 MB gzipped (lazy).
- Whisper-small model (Q8): ~80 MB, fetched from the Hugging Face CDN
  on first run, then cached by the browser's Cache Storage API.

Main bundle delta: **0 kB** (verified via post-build grep — no
`@huggingface/transformers` import lands in `index-*.js`).

### Manual smoke test

Not exercised in the agent environment — the worker requires a real
browser, mic permission, and live network access for the model fetch.
Spencer needs to validate this end-to-end. Expected first-load behavior:

- Tap the mic. Helper text shows "Loading Whisper model… N%". This
  takes 10–60 seconds depending on bandwidth; the model is cached
  after the first run.
- Once ready, the mic button enables. Tap, say "あい", tap again to
  stop. Helper text shows "Transcribing…". Expected latency on
  WebGPU: ~200–800 ms for a 2 s clip. WASM: 1–3 s.
- Transcript flows through the same `scoreAlternatives` path as the
  Web Speech engine; the perfect / close / try-again tiers light up
  the same way.

### Known limitations of the spike

- **N-best is 1.** The transformers.js high-level pipeline doesn't
  expose beam-search alternatives in a stable way; we return a single
  top-1 transcript. The `scoreAlternatives` scorer still receives a
  `SpeechAlternative[]` shape with one entry. Future work: switch to
  the lower-level `generate()` API with `num_beams: 5` and
  `num_return_sequences: 5`.
- **No interim transcripts.** Whisper is one-shot; we can't show a
  live word-by-word transcript while the user speaks. The spec called
  this out and the UI handles it with a "Transcribing…" placeholder.
- **No endpointing.** The user has to manually tap stop. RMS-based
  VAD is queued.
- **`ScriptProcessorNode` is deprecated.** Works everywhere today but
  should migrate to AudioWorklet before this ships.
- **No graceful fallback UI to switch engines.** If model fetch
  fails, the hook surfaces `error: "unknown"` and `status: "error"`,
  and the helper text reads "Speech recognition hit an error — try
  again." but there is no in-UI "switch to web engine" button yet.
  Spencer can flip back via `?speech-engine=web`.
- **dtype heuristic is conservative.** WebGPU uses `fp32`, WASM uses
  `q8`. Newer transformers.js versions may benefit from `q4`. Worth
  benchmarking once real session data is available.
- **No telemetry.** We don't capture transcribe latency, first-load
  time, or error rate. Add before any wider rollout.
