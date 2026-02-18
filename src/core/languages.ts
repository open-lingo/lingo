/**
 * Re-exports for backward compatibility. Prefer languageConfig for new code.
 */
import type { LanguageConfig } from "./languageConfig";
import { LANGUAGES, getLanguageById } from "./languageConfig";

export type Language = Pick<LanguageConfig, "id" | "name" | "flag">;

export { LANGUAGES, getLanguageById };
