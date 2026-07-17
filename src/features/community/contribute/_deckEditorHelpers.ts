import { getParticlesForLanguage } from "@/features/flashcards/data/loadDeck";
import type { Flashcard, CardSegment } from "@/features/flashcards/data/types";
import type { DeckCreate } from "@/shared/api/decks";

export function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse default ease from editor string; returns undefined if empty or invalid (backend uses 2.5). */
export function parseDefaultEase(s: string): number | undefined {
  const n = Number(s.trim());
  if (s.trim() === "" || Number.isNaN(n)) return undefined;
  return Math.max(1.3, Math.min(3, n));
}

/** Card mode: Simple = front/back/note. Segmented = segments define front (word or sentence). */
export const CARD_MODE_SIMPLE = "simple" as const;
export const CARD_MODE_SEGMENTED = "segmented" as const;
export type CardMode = typeof CARD_MODE_SIMPLE | typeof CARD_MODE_SEGMENTED;

export const SEGMENTED_TYPES: { value: "word" | "sentence"; labelKey: string }[] = [
  { value: "word", labelKey: "community.editorCardTypeWord" },
  { value: "sentence", labelKey: "community.editorCardTypeSentence" },
];

export function segmentsToFront(
  segments: CardSegment[] | undefined,
  isSentence: boolean,
): string {
  if (!segments?.length) return "";
  const text = segments.map((s) => s.segment).join(isSentence ? " " : "");
  return text;
}

/** Auto-parse particleId from segment text by matching known particles (e.g. 는 → 은_는). */
export function inferParticleId(segment: string, languageId: string): string | undefined {
  if (!segment.trim()) return undefined;
  const data = getParticlesForLanguage(languageId);
  if (!data?.particles) return undefined;
  for (const p of data.particles) {
    const forms = p.form.split("/");
    if (forms.some((f) => f.trim() === segment) || p.form === segment) return p.id;
  }
  return undefined;
}

export const EMPTY_CARD: Omit<Flashcard, "id"> = {
  front: "",
  back: "",
  type: "other",
};

export interface BuildDeckPayloadArgs {
  languageId: string;
  name: string;
  description: string;
  image: string;
  defaultEase: string;
  cards: Flashcard[];
  /** True only when creating a brand-new deck flagged as a story companion. */
  isNewCompanionDeck: boolean;
}

/** Build the create/update payload from the editor's local state (status: draft). */
export function buildDeckPayload(args: BuildDeckPayloadArgs): DeckCreate {
  const { languageId, name, description, image, defaultEase, cards, isNewCompanionDeck } =
    args;
  const base: DeckCreate = {
    languageId,
    name: name.trim(),
    description: description.trim() || undefined,
    image: image.trim() || undefined,
    defaultEase: parseDefaultEase(defaultEase),
    status: "draft",
    cards: cards.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type,
      note: c.note,
      image: c.image,
      reasoning: c.reasoning,
      definition: c.definition,
      context: c.context,
      parts: c.type === "word" ? c.parts : undefined,
      words: c.type === "sentence" ? c.words : undefined,
    })),
  };
  if (isNewCompanionDeck) {
    return { ...base, companionToStoryId: "pending" };
  }
  return base;
}
