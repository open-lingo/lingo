/** Top-level settings nav (non-language). */
export type SettingsGlobalSectionId =
  | "general"
  | "appearance"
  | "accessibility"
  | "notifications"
  | "privacy"
  | "more-info";

export type SettingsLanguageSectionId = `lang-${string}`;

export type SettingsSectionId = SettingsGlobalSectionId | SettingsLanguageSectionId;

export const SETTINGS_GLOBAL_SECTIONS: SettingsGlobalSectionId[] = [
  "general",
  "appearance",
  "accessibility",
  "notifications",
  "privacy",
  "more-info",
];

export function isLanguageSectionId(
  id: SettingsSectionId,
): id is SettingsLanguageSectionId {
  return id.startsWith("lang-");
}

export function languageIdFromSection(id: SettingsLanguageSectionId): string {
  return id.slice("lang-".length);
}
