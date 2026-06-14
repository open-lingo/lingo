import { JA_COURSE_ATOMS_BY_ID } from "@/features/languages/ja/courseAtoms";

/**
 * Best-effort human label for a concept id used on the Journey mastery grid.
 *
 * Concept ids arrive as canonical SRS ids (`ja:biiru`, ADR-005). The JA atom
 * map is keyed by the bare id, so strip the language prefix before lookup and
 * fall back to a humanized id for anything the curriculum can't resolve
 * (grammar points, other languages).
 */
export function conceptLabel(conceptId: string): string {
  const bare = conceptId.includes(":")
    ? conceptId.slice(conceptId.indexOf(":") + 1)
    : conceptId;
  const atom = JA_COURSE_ATOMS_BY_ID.get(bare);
  if (atom) return atom.kana;
  return bare.replace(/[-_]/g, " ");
}
