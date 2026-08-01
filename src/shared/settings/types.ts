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
   * lighter daily load (0 = pause new cards entirely). `null` = explicit
   * reset to the uncapped default — `updateFlashcards` filters `undefined`
   * out of patches, so null is the only way to UNSET the cap through the
   * merge; readers use `??` (null and absent behave identically) and the
   * hydrate validator drops null on reload.
   */
  maxNewCardsPerDay?: number | null;
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
  /**
   * Opt-in frequency ("optional") vocabulary. When true, high-frequency words
   * beyond the authored lessons are unlocked as the learner reaches the module
   * that gates them (`frequencyRankToModule`), flow through the SAME throttled
   * new-card intake as lesson vocab, and are tagged `source: "freq"` on the
   * card so surfaces can label them "optional". Default OFF — off means
   * frequency atoms never enter the deck or intake, and lesson-driven unlocks
   * are untouched. See `features/languages/frequencyResolver`.
   */
  frequencyVocab?: boolean;
};

export type UserSettings = {
  _version?: number;
  appearance: {
    /** "auto" | "system" = follow prefers-color-scheme; else light|dark|amoled or custom id */
    themeId: string;
    /** App chrome layout: "sidebar" = left rail (default, desktop ≥lg), "topbar" = horizontal nav. */
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
     * PER-LANGUAGE "show romanization reading aid" toggle, keyed by
     * languageId (e.g. `{ ja: true, ko: false }`). An ABSENT key means "on" —
     * the default is true, so a language with no stored entry shows its
     * romanization aid. Resolve through `isRomanizationOn(learning, langId)`;
     * never read a bare boolean off this field.
     *
     * When on for a language, phonetic scripts render their romanization as a
     * reading aid — JA romaji above kana (speaking, MCQ options, build-sentence
     * tiles, dialogue transcripts, etc.) and KO Revised Romanization above
     * Hangul. The toggle surface stays language-agnostic (one "Show
     * romanization" row per language section); only the STORAGE is per-language,
     * so JA-on + KO-off (and vice versa) is possible.
     *
     * For Japanese the aid retires per script on its own: the render gate hides
     * a kana's romaji once that script's auto-off guard is set — hiragana at
     * Module 7, katakana at Module 17 (see romanizationAutoFlip.ts). The `ja`
     * key still masters both scripts (off there = no romanization anywhere in
     * JA); the `romanizationOnForDay` escape hatch can force it back on for one
     * day.
     *
     * Was a single JA-only boolean `showRomaji`, then a single cross-language
     * boolean `showRomanization`, before becoming per-language; legacy scalar
     * blobs are folded into the map on hydrate (see `migrateReadingAidKeys` in
     * SettingsContext).
     */
    showRomanization?: Record<string, boolean>;
    /** @deprecated Legacy single-flip guard (pre per-script model). Kept
     *  only for settings-blob back-compat; no longer read. Was
     *  `romajiAutoFlipped`. */
    romanizationAutoFlipped?: boolean;
    /**
     * Per-script one-time auto-off guards for the JA romaji reading aid,
     * flipped when the learner crosses that script's fluency milestone
     * (hiragana M7 / katakana M17). The render gate hides that script's
     * romaji once set — unless `showRomanization` is toggled back on or
     * `romanizationOnForDay` is today. Two guards, one user-facing toggle.
     */
    hiraganaRomajiAutoOff?: boolean;
    katakanaRomajiAutoOff?: boolean;
    /**
     * Escape hatch: an ISO local date (YYYY-MM-DD). While it equals today,
     * romanization is forced ON for every script regardless of the per-script
     * auto-off guards — "show romanization for today", auto-expires at midnight.
     * Was named `romajiOnForDay`; legacy blobs migrated on hydrate.
     */
    romanizationOnForDay?: string | null;
    /**
     * When true, character-build tile banks ("Build the word for X") hide
     * the per-kana romaji label until the learner taps a tile (also plays
     * its sound) or hovers it briefly — forcing kana reading instead of
     * matching romaji to the English prompt. Independent of `showRomanization`:
     * romaji can stay on everywhere else while build tiles fade first.
     *
     * Default OFF (romaji shown) as a beginner scaffold; auto-flips ON
     * (one-time) when the learner reaches Module 5, two modules ahead of
     * the full hiragana romaji auto-off (Module 7) — by then they can
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
    /**
     * Layout the learner prefers for the Learn course map: "card" (the rich
     * accordion cards, default) or "list" (a compact per-module row). Synced
     * cross-device via the settings blob. Absent = "card".
     */
    courseMapView?: "card" | "list";
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
    navLayout: "sidebar",
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
    showRomanization: {},
    romanizationAutoFlipped: false,
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
    romanizationOnForDay: null,
    hideBuildTileRomaji: false,
    buildTileRomajiAutoFlipped: false,
    dailyGoalMinutes: 10,
    ftueArcSeen: false,
    previewCompletedLanguageId: null,
  },
  display: {},
  flashcards: {
    studyOptions: [],
    // Opt-in: frequency ("optional") vocab is off until the learner enables it.
    frequencyVocab: false,
  },
};

/**
 * Resolve the per-language "show romanization" reading-aid toggle. An absent
 * key means "on" (default true), so a language the learner has never toggled
 * shows its romanization aid. This is the ONLY correct way to read
 * `learning.showRomanization` — it is a per-language map, not a boolean.
 */
export function isRomanizationOn(
  learning: Pick<UserSettings["learning"], "showRomanization">,
  languageId: string,
): boolean {
  return learning.showRomanization?.[languageId] ?? true;
}
