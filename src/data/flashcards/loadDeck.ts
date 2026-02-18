import type { FlashcardDeck } from "./types";
import type { ParticlesData } from "../particles/types";

import koDeck from "./ko-beginner.json";
import koParticles from "../particles/ko.json";

const decksByLang: Record<string, FlashcardDeck> = {
  ko: koDeck as FlashcardDeck,
};

const particlesByLang: Record<string, ParticlesData> = {
  ko: koParticles as ParticlesData,
};

export function getDeckForLanguage(languageId: string): FlashcardDeck | null {
  return decksByLang[languageId] ?? null;
}

export function getParticlesForLanguage(languageId: string): ParticlesData | null {
  return particlesByLang[languageId] ?? null;
}
