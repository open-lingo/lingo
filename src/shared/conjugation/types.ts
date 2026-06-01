/**
 * Generic conjugation-engine types — stub for Phase 2.
 *
 * Per ADR-011, the inflection-table engine lives here once a second
 * language (KO, ES) lights up the pattern. For Phase 1 the only impl
 * is `features/languages/ja/conjugationTables.ts`. This file establishes
 * the placeholder so consumers know where the engine will live.
 *
 * The eventual ConjugationCapability slot on LanguageModule looks
 * roughly like:
 *
 *   interface ConjugationCapability {
 *     verbForms: ReadonlyArray<string>;
 *     adjForms?: ReadonlyArray<string>;
 *     getVerbsUpToModule(moduleId: string): VerbEntry[];
 *     getAdjsUpToModule(moduleId: string): AdjEntry[];
 *   }
 *
 * Phase 2 will codify these types and ConjugationTableView will read
 * them off the language module.
 */
export {};
