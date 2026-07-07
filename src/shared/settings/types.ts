export const SETTINGS_VERSION = 1;

/** Card/modal corner-rounding presets (see `shared/theme/cornerStyle.ts`). */
export type CornerStyle = "sharp" | "default" | "rounded" | "pill";

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
  /**
   * Grading button layout in the reviewer. `"simple"` = 2 buttons
   * (Didn't know / Knew it), `"full"` = the 4-button Again/Hard/Good/Easy
   * row. Undefined = history-aware default (see `resolveGradingLayout`):
   * "full" once any card has been reviewed, "simple" for a fresh learner.
   * Once the user touches the toggle their explicit choice wins forever.
   */
  gradingLayout?: "simple" | "full";
  /**
   * Show the interval-preview chips ("<1d"/"3d") on grade buttons. Hidden by
   * default (previews tempt grading-to-schedule, which corrupts FSRS input);
   * the "Show scheduling intervals" toggle re-enables them.
   */
  showIntervalPreviews?: boolean;
};

export type UserSettings = {
  _version?: number;
  appearance: {
    /** "auto" | "system" = follow prefers-color-scheme; else light|dark|sepia|amoled or custom id */
    themeId: string;
    /** App chrome layout: "topbar" = horizontal nav (default), "sidebar" = left rail (desktop ≥lg). */
    navLayout: "topbar" | "sidebar";
    /**
     * Corner-rounding preset for cards and modals. Drives the
     * `--radius-card` CSS variable at runtime (see `cornerStyle.ts` for the
     * preset→radius mapping and ThemeContext for where it's applied).
     * Default "default" = the current card feel.
     */
    cornerStyle: CornerStyle;
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
     * Global "show romaji reading aid" master toggle. When true (the
     * default), kana surfaces render romaji above the kana — speaking,
     * MCQ options, build-sentence tiles, dialogue transcripts, etc.
     *
     * Romaji retires per script on its own: the render gate hides a kana's
     * romaji once that script's auto-off guard is set — hiragana at Module
     * 10, katakana at Module 17 (see romajiAutoFlip.ts). This single toggle
     * still masters both scripts (off here = no romaji anywhere); the
     * `romajiOnForDay` escape hatch can force it back on for one day.
     */
    showRomaji?: boolean;
    /** @deprecated Legacy single-flip guard (pre per-script model). Kept
     *  only for settings-blob back-compat; no longer read. */
    romajiAutoFlipped?: boolean;
    /**
     * Per-script one-time auto-off guards for the romaji reading aid,
     * flipped when the learner crosses that script's fluency milestone
     * (hiragana M10 / katakana M17). The render gate hides that script's
     * romaji once set — unless `showRomaji` is toggled back on or
     * `romajiOnForDay` is today. Two guards, one user-facing toggle.
     */
    hiraganaRomajiAutoOff?: boolean;
    katakanaRomajiAutoOff?: boolean;
    /**
     * Escape hatch: an ISO local date (YYYY-MM-DD). While it equals today,
     * romaji is forced ON for every script regardless of the per-script
     * auto-off guards — "show romaji for today", auto-expires at midnight.
     */
    romajiOnForDay?: string | null;
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
    /**
     * Language id of a `/try` preview lesson the visitor completed *before*
     * signing up. Carried across the Auth0 round-trip (sessionStorage →
     * persisted here in LanguageContext) so the post-signup experience can
     * acknowledge the taste instead of treating them as cold — e.g. the
     * first-session arc skips the redundant motivation step. null = no
     * preview was completed pre-signup.
     */
    previewCompletedLanguageId?: string | null;
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
    cornerStyle: "default",
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
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
    romajiOnForDay: null,
    hideBuildTileRomaji: false,
    buildTileRomajiAutoFlipped: false,
    dailyGoalMinutes: 10,
    ftueArcSeen: false,
    previewCompletedLanguageId: null,
  },
  display: {},
  flashcards: {
    studyOptions: [],
  },
};
