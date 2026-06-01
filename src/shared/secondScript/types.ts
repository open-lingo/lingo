/**
 * Generic second-script (kanji / hanja / hanzi) reveal engine — stub
 * for Phase 2.
 *
 * Per ADR-011 + ADR-001, languages with a logographic overlay over a
 * phonetic script (JA kanji on kana, ZH hanzi as the script proper, KO
 * hanja as optional) opt into this via `LanguageModule.secondScript`.
 *
 * The eventual SecondScriptCapability slot looks roughly like:
 *
 *   interface SecondScriptCapability {
 *     required: boolean;                       // ZH true; JA/KO false
 *     glyphMap: Map<AtomId, SecondScriptForm>;
 *     strokeOrderData?: Record<Glyph, StrokeOrder>;
 *     unlockPolicy: "always" | "auto" | "manual";
 *   }
 *
 * Phase 2 codifies the types + drives the SecondScriptIntroStep
 * component off them. For now JA kanji data lives at
 * features/languages/ja/secondScript/n5Kanji.ts, consumed directly by
 * the JA-specific KanjiPracticePage.
 */
export {};
