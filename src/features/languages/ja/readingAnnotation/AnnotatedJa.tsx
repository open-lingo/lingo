/**
 * JA reading-annotation wrapper.
 *
 * Re-exports the generic `AnnotatedText` renderer under the legacy
 * `AnnotatedJa` name so JA call sites are unchanged. Phase 2 will fold
 * the JA-specific tokenizer + kana mastery hook into a capability
 * payload on `LanguageModule.readingAnnotation` and pass it as a prop
 * instead of having the engine import them directly.
 */
export { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
