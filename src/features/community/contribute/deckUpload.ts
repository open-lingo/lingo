import type { DeckCreate, DeckCard } from "@/shared/api/decks";

function generateCardId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Minimal card shape we accept from JSON. */
interface RawCard {
  id?: string;
  front: string;
  back: string;
  type: "word" | "sentence" | "other";
  note?: string;
  image?: string;
  reasoning?: string;
  parts?: { segment: string; meaning?: string; particleId?: string }[];
  words?: { segment: string; meaning?: string; particleId?: string }[];
  definition?: string;
  context?: string;
}

/** Minimal deck shape we accept from JSON. Matches DeckCreate minus server fields. */
interface RawDeck {
  languageId: string;
  name: string;
  description?: string;
  image?: string;
  defaultEase?: number;
  status?: "draft" | "published";
  cards: RawCard[];
}

function isRawCard(obj: unknown): obj is RawCard {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.front === "string" &&
    typeof o.back === "string" &&
    (o.type === "word" || o.type === "sentence" || o.type === "other")
  );
}

function isRawDeck(obj: unknown): obj is RawDeck {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.languageId !== "string" || o.languageId.trim() === "") return false;
  if (typeof o.name !== "string" || o.name.trim() === "") return false;
  if (!Array.isArray(o.cards)) return false;
  return o.cards.every(isRawCard);
}

function normalizeCard(raw: RawCard): DeckCard {
  return {
    id: raw.id?.trim() || generateCardId(),
    front: String(raw.front ?? ""),
    back: String(raw.back ?? ""),
    type: raw.type,
    note: raw.note ? String(raw.note) : undefined,
    image: raw.image ? String(raw.image) : undefined,
    reasoning: raw.reasoning ? String(raw.reasoning) : undefined,
    parts: raw.parts,
    words: raw.words,
    definition: raw.definition ? String(raw.definition) : undefined,
    context: raw.context ? String(raw.context) : undefined,
  };
}

/**
 * Parse and normalize uploaded deck JSON into DeckCreate format.
 * Accepts the same shape we send to the API, minus server-populated fields
 * (id, authorId, courseId, version, cardCount, createdAt, updatedAt).
 * Card ids are generated if missing.
 */
export function parseDeckJson(json: string): DeckCreate {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error("Invalid JSON");
  }

  if (!isRawDeck(parsed)) {
    throw new Error(
      "Deck must have languageId (string), name (string), and cards (array). Each card needs front, back, and type (word|sentence|other)."
    );
  }

  const defaultEase = parsed.defaultEase;
  const clampedEase =
    defaultEase != null
      ? Math.max(1.3, Math.min(3, Number(defaultEase)))
      : undefined;

  return {
    languageId: parsed.languageId.trim(),
    name: parsed.name.trim(),
    description: parsed.description?.trim() || undefined,
    image: parsed.image?.trim() || undefined,
    defaultEase: clampedEase,
    status: parsed.status === "published" ? "published" : "draft",
    cards: parsed.cards.map(normalizeCard),
  };
}
