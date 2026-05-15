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
