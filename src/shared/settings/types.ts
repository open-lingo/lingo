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
    /** App chrome layout: "topbar" = horizontal nav (default), "sidebar" = left rail (desktop ≥lg). */
    navLayout: "topbar" | "sidebar";
  };
  accessibility: {
    reducedMotion: boolean;
    /** When true, applies Atkinson Hyperlegible as the UI font for improved readability. */
    dyslexiaFont: boolean;
    /** Global font-size scale factor. 1.0 = default (16px). Range 0.85–1.4. */
    fontSize?: number;
  };
  audio: {
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
    /**
     * True after the user has completed initial setup (picked a learning
     * language). Stored in the user settings blob on the server so clearing
     * browser storage does not replay the first-launch language modal.
     */
    onboardingCompleted?: boolean;
    uiLocale: string;
    showAlphabetRomanization?: boolean;
    /**
     * Global "show romaji reading aid" toggle. When true (the default),
     * every kana surface in the app renders romaji above un-mastered
     * kana — speaking, MCQ options, build-sentence tiles, dialogue
     * transcripts, etc.
     *
     * The default flips OFF automatically (one-time) when the learner
     * reaches Module 15 OR passes the alphabet trainer's full test for
     * hiragana/katakana — whichever fires first. After the auto-flip,
     * `romajiAutoFlipped` is set so the auto-off won't fire again, and
     * the learner can re-enable manually from Settings.
     */
    showRomaji?: boolean;
    /**
     * One-shot flag set when the auto-off rule (M15 reached OR alphabet
     * mastered) has fired. Prevents re-flipping if the learner later
     * turns romaji back on manually.
     */
    romajiAutoFlipped?: boolean;
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
    navLayout: "topbar",
  },
  accessibility: {
    reducedMotion: false,
    dyslexiaFont: false,
  },
  audio: {
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
    onboardingCompleted: false,
    uiLocale: "en",
    showAlphabetRomanization: true,
    showRomaji: true,
    romajiAutoFlipped: false,
  },
  display: {},
  flashcards: {
    studyOptions: [],
  },
};
