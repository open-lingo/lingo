/**
 * User preferences shape. Persisted locally (or via User API when you add one).
 * Used for learning language, theme, UI locale, and future options.
 */
export type UserSettings = {
  /** Learning language id (e.g. "ko", "ja"). */
  learningLanguageId: string;
  /** UI theme. */
  theme: "dark" | "light";
  /** UI locale for i18n (e.g. "en", "es"). */
  uiLocale: string;
};

export const DEFAULT_SETTINGS: UserSettings = {
  learningLanguageId: "ko",
  theme: "dark",
  uiLocale: "en",
};
