export const SETTINGS_VERSION = 1;

/** Named SRS study buckets; decks may appear in several options. */
export type StudyOption = {
  id: string;
  name: string;
  /** Subscribed deck ids included when reviewing this option. */
  deckIds: string[];
};

export type FlashcardsSettings = {
  studyOptions: StudyOption[];
};

export type UserSettings = {
  _version?: number;
  appearance: {
    /** "auto" | "system" = follow prefers-color-scheme; else light|dark|sepia|amoled or custom id */
    themeId: string;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast?: boolean;
    fontScale?: number;
  };
  audio: {
    soundEnabled: boolean;
    /**
     * When true, the auto-play hook (`useAutoPlayJaAudio`) becomes a no-op
     * so the device never produces unbidden TTS audio on step mount —
     * critical for public-space learners (libraries, transit, shared
     * desks). User-triggered playback (`playJaAudio` from a tap on the
     * speaker / mic button) intentionally still plays, because the user
     * has explicitly asked to hear it. Persisted in localStorage like
     * the rest of UserSettings.
     */
    silentMode: boolean;
    /**
     * App-wide volume (0..1). Applied at the audio output stage so the
     * learner can lower or boost Lingo without touching the OS / browser
     * volume mixer. SettingsContext syncs this into
     * `src/shared/audio/volume.ts`, which feeds both the Web Audio TTS
     * GainNode and the `playLocalAudio` HTMLAudio wrapper.
     */
    volume: number;
  };
  notifications: {
    dailyReminderTime?: string;
    reminderEnabled: boolean;
  };
  learning: {
    /** `null` until the user has explicitly picked a learning language.
     *  When null, LanguagePickerModal renders on first launch. Pre-Task-#88
     *  this defaulted to "ko" which made the picker dead code on first
     *  signup. */
    learningLanguageId: string | null;
    uiLocale: string;
    showAlphabetRomanization?: boolean;
    showAlphabetFurigana?: boolean;
  };
  display?: {
    dateLocale?: string;
    timezoneOverride?: string;
  };
  /** Flashcards / SRS preferences (synced when backend accepts nested patch). */
  flashcards?: FlashcardsSettings;
};

export const DEFAULT_SETTINGS: UserSettings = {
  _version: SETTINGS_VERSION,
  appearance: {
    themeId: "auto",
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontScale: 1,
  },
  audio: {
    soundEnabled: true,
    silentMode: false,
    volume: 1,
  },
  notifications: {
    reminderEnabled: false,
  },
  learning: {
    // null = "user hasn't picked yet" → LanguagePickerModal renders on
    // first launch (Task #88). Was hardcoded "ko" which silently forced
    // every new account into the Korean stub course.
    learningLanguageId: null,
    uiLocale: "en",
    showAlphabetRomanization: true,
    showAlphabetFurigana: true,
  },
  display: {},
  flashcards: {
    studyOptions: [],
  },
};
