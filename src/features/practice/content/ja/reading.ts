/** Romaji derivation for authored JA content — keeps the data files terse. */
import { annotateJapaneseText } from "@/features/languages/ja/romajiLexicon";

export function jaReading(text: string): string {
  return annotateJapaneseText(text, true)
    .map((f) => f.reading ?? "")
    .filter(Boolean)
    .join(" ");
}

export function withReading<T extends { text: string; reading?: string }>(line: T): T {
  return line.reading ? line : { ...line, reading: jaReading(line.text) };
}
