/**
 * Generic classifier (counter / measure word) engine — stub for
 * Phase 2.
 *
 * Per ADR-011, classifier teaching is a CJK pattern (JA counters /
 * KO counters / ZH measure words). JA data lives at
 * features/languages/ja/classifiers.ts; KO data lives at
 * features/languages/ko/classifiers.ts.
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
