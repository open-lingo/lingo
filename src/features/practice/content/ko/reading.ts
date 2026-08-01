/**
 * Reading derivation for authored KO content — Revised Romanization via
 * `romanizeKorean`, keeping the reading aid consistent with the rest of the
 * KO surfaces.
 */
import { romanizeKorean } from "@/features/languages/ko/romanization/hangulRomanize";

export function withReading<T extends { text: string; reading?: string }>(line: T): T {
  return line.reading ? line : { ...line, reading: romanizeKorean(line.text) };
}
