/**
 * Re-exports for backward compatibility. Prefer languageConfig for new code.
 */
import type { LanguageConfig } from "@/shared/domain/languageConfig";
import { LANGUAGES, getLanguageById } from "@/shared/domain/languageConfig";

export type Language = Pick<LanguageConfig, "id" | "name" | "flag">;

export { LANGUAGES, getLanguageById };
