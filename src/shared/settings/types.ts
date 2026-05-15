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
  };
  notifications: {
    dailyReminderTime?: string;
    reminderEnabled: boolean;
  };
  learning: {
    learningLanguageId: string;
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
  },
  notifications: {
    reminderEnabled: false,
  },
  learning: {
    learningLanguageId: "ko",
    uiLocale: "en",
    showAlphabetRomanization: true,
    showAlphabetFurigana: true,
  },
  display: {},
  flashcards: {
    studyOptions: [],
  },
};
