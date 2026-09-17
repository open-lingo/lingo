export {
  isUtteranceCorrect,
  normalizeJa,
  normalizeTypedAnswer,
  normalizeForCompare,
  normalizeTarget,
  charOverlap,
  scoreAlternatives,
  scoreAlternativesGeneric,
  normalizeGeneric,
  DEFAULT_TIERS,
  type Verdict,
  type MatchTiers,
  type MatchResult,
  type AlternativeScore,
} from "./loose-match";
export {
  isSpeechFlagEnabled,
  setSpeechFlag,
  isSpeechRecognitionSupported,
  getSpeechConfig,
  setSpeechConfigValue,
  applySpeechQueryParams,
  SPEECH_DEFAULTS,
  SPEECH_QUERY_KEYS,
  type SpeechConfig,
  type SpeechEngine,
} from "./featureFlag";
export {
  useSpeechRecognition,
  type UseSpeechRecognitionApi,
  type SpeechErrorCode,
  type SpeechAlternative,
  type SpeechTimings,
} from "./useSpeechRecognition";
export {
  buildAcceptedForms,
  matchAcceptedForm,
  matchAcceptedAlternatives,
  interimEditBudget,
  boundedEditDistance,
  expandChoonpu,
  longVowelVariants,
  type AcceptedForms,
  type AcceptedFormsInput,
  type AcceptedMatch,
} from "./acceptedForms";
// Absolute specifier (not a bare "./useWhisperRecognition" relative import)
// on purpose: vite.config.ts aliases this exact string to a lightweight
// native-only stub under `--mode native` (perf review 2026-09-17, lane A4b —
// docs/perf-2026-09-17.md §1). Keeps the heavy transformers.js/onnxruntime
// dependency graph out of the native build; web/dev/vitest are unaffected.
export {
  useWhisperRecognition,
  type UseWhisperRecognitionApi,
  type WhisperStatus,
} from "@/shared/speech/useWhisperRecognition";
export {
  useNativeSpeechRecognition,
  type NativeSpeechPlugin,
} from "./useNativeSpeechRecognition";
export {
  tiersForTarget,
  classifyMoraBand,
  type MoraBand,
} from "./moraTiers";
export {
  pushSpeechLog,
  getSpeechLog,
  subscribeSpeechLog,
  __clearSpeechLog,
  type SpeechLogEntry,
  type SpeechLogVerdict,
} from "./speechLog";
