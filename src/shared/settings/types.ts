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
  /**
   * Super-user opt-out: when true, the auto-included course deck is hidden
   * from the reviewer queue (power users who bring their own Anki/community
   * decks). Default off/undefined — the course deck is "subscribed by
   * default" so learners can review the words their lessons unlock. See
   * `useSubscriptionQueue`.
   */
  hideCourseDeck?: boolean;
  /**
   * Optional user intake cap (D5, srs-scheduling-model-2026-06-15). Unset =
   * no cap: every unlocked word is available to review (lesson pace is the
   * throttle). Set a number to limit new cards/day if the learner wants a
   * lighter daily load.
   */
  maxNewCardsPerDay?: number;
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
    /** Soft UI sound effects (answer chimes, lesson-complete). Speech audio is
     *  unaffected. Default on. */
    soundEnabled?: boolean;
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
    /**
     * When true, character-build tile banks ("Build the word for X") hide
     * the per-kana romaji label until the learner taps a tile (also plays
     * its sound) or hovers it briefly — forcing kana reading instead of
     * matching romaji to the English prompt. Independent of `showRomaji`:
     * romaji can stay on everywhere else while build tiles fade first.
     *
     * Default OFF (romaji shown) as a beginner scaffold; auto-flips ON
     * (one-time) when the learner reaches Module 10 — by ~10h in they can
     * read kana. Learner-toggleable from Settings either way.
     */
    hideBuildTileRomaji?: boolean;
    /**
     * One-shot guard for the Module-10 auto-flip of `hideBuildTileRomaji`,
     * so it won't re-fire if the learner turns it back off manually.
     */
    buildTileRomajiAutoFlipped?: boolean;
    /**
     * Self-chosen daily study target in minutes (FTUE goal-setting step).
     * Drives the home Daily-goal card. Default 10. The learner picks this in
     * the first-session arc; evidence shows self-chosen goals retain better
     * than assigned ones (docs/ftue-design-2026-06-14.md).
     */
    dailyGoalMinutes?: number;
    /**
     * One-shot: true after the new-user first-session arc (motivation →
     * daily goal → optional placement) has run. Separate from
     * `onboardingCompleted` (which only marks the language pick). The arc
     * shows once, only to brand-new users (no lesson progress).
     */
    ftueArcSeen?: boolean;
    /** Optional motivation the learner picked in the arc (travel/culture/…).
     *  Recorded for later personalization; no behavior depends on it yet. */
    motivation?: string;
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
    soundEnabled: true,
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
    hideBuildTileRomaji: false,
    buildTileRomajiAutoFlipped: false,
    dailyGoalMinutes: 10,
    ftueArcSeen: false,
  },
  display: {},
  flashcards: {
    studyOptions: [],
  },
};
