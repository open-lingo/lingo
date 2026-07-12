export {
  isUtteranceCorrect,
  normalizeJa,
  normalizeTypedAnswer,
  normalizeForCompare,
  normalizeTarget,
  charOverlap,
  scoreAlternatives,
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
} from "./useSpeechRecognition";
export {
  useWhisperRecognition,
  type UseWhisperRecognitionApi,
  type WhisperStatus,
} from "./useWhisperRecognition";
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
