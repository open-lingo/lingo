/**
 * Central language module registry. ADR-001.
 *
 * Every cross-language consumer (placement, SRS lesson builder, lesson
 * atom index, vocab art) goes through `getLanguageModule(id)`. Direct
 * imports of `JA_COURSE_ATOMS` / `jaGrammarHelpers` / etc. from outside
 * `features/languages/ja/` are anti-patterns — they will be caught by
 * the grep in the PR review checklist.
 */

import { jaModule } from "@/features/languages/ja/module";
import { koModule } from "@/features/languages/ko/module";
import type { LanguageModule } from "./LanguageModule";
import type { Atom, AtomId, LanguageId } from "./types";

const MODULES: Partial<Record<LanguageId, LanguageModule>> = {
  ja: jaModule,
  ko: koModule,
};

export function getLanguageModule(id: LanguageId): LanguageModule {
  const m = MODULES[id];
  if (!m) {
    throw new Error(
      `No language module registered for "${id}". Did you forget to add it to shared/language/registry.ts?`,
    );
  }
  return m;
}

export function tryGetLanguageModule(id: LanguageId): LanguageModule | null {
  return MODULES[id] ?? null;
}

export function getAllLanguageIds(): LanguageId[] {
  return Object.keys(MODULES) as LanguageId[];
}

export function isLanguageRegistered(id: string): boolean {
  return id in MODULES;
}

export function getCourseAtoms(id: LanguageId): readonly Atom[] {
  const m = tryGetLanguageModule(id);
  return m?.courseAtoms ?? [];
}

// ── Global atom index (lazy on first lookup, per open-items.md #2) ──────
let _atomIndex: Map<AtomId, Atom> | null = null;

function buildAtomIndex(): Map<AtomId, Atom> {
  const idx = new Map<AtomId, Atom>();
  for (const langId of getAllLanguageIds()) {
    for (const atom of getCourseAtoms(langId)) {
      idx.set(atom.id, atom);
    }
  }
  return idx;
}

export function findAtom(atomId: AtomId): Atom | null {
  if (_atomIndex == null) {
    _atomIndex = buildAtomIndex();
  }
  return _atomIndex.get(atomId) ?? null;
}

export function findAtomBySurface(lang: LanguageId, surface: string): Atom | null {
  for (const atom of getCourseAtoms(lang)) {
    if (atom.surface === surface) return atom;
  }
  return null;
}

/** Test-only — reset the lazy atom index. */
export function __resetAtomIndexForTests(): void {
  _atomIndex = null;
}
