/**
 * Spanish sentence templates — a small starter set.
 *
 * Spanish surface == reading (Latin script), so no `readingPattern` is needed;
 * plain substitution of `pattern` doubles as the reading. Patterns are chosen to
 * be article/gender-safe (they take a bare noun) so any in-POS filler stays
 * grammatical. ES template depth is intentionally deferred (see the plan).
 */
import type { SentenceTemplate } from "@/features/practice/engine/types";

export const ES_TEMPLATES: SentenceTemplate[] = [
  {
    id: "es-me-gusta-x",
    pattern: "Me gusta {x}",
    translationPattern: "I like {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 3 },
  },
  {
    id: "es-quiero-x",
    pattern: "Quiero {x}",
    translationPattern: "I want {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 4 },
  },
  {
    id: "es-hay-x",
    pattern: "Hay {x}",
    translationPattern: "There is {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 4 },
  },
  {
    id: "es-necesito-x",
    pattern: "Necesito {x}",
    translationPattern: "I need {x}.",
    slots: [{ key: "x", pos: "noun" }],
    grammarGate: { minModule: 5 },
  },
];
