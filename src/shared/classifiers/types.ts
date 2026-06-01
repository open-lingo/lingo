/**
 * Generic classifier (counter / measure word) engine — stub for
 * Phase 2.
 *
 * Per ADR-011, classifier teaching is a CJK pattern (JA counters /
 * KO counters / ZH measure words). For Phase 1, JA data lives at
 * features/languages/ja/classifiers.ts and KO data stays at
 * features/practice/data/ko-counters.ts until step 3 (KO module
 * skeleton) relocates it.
 *
 * The eventual ClassifierSet shape:
 *
 *   interface ClassifierSet {
 *     defs: ReadonlyArray<ClassifierDef>;
 *     pickFor(noun: string): ClassifierDef | null;
 *   }
 *
 * The shared engine + teach-step renderer land in Phase 2.
 */
export {};
