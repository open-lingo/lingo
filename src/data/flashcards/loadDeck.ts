import type { FlashcardDeck } from "./types";
import type { ParticlesData } from "../particles/types";

import koDeck from "./ko-beginner.json";
import jaDeck from "./ja-beginner.json";
import koParticles from "../particles/ko.json";
import jaParticles from "../particles/ja.json";

const decksByLang: Record<string, FlashcardDeck> = {
  ko: koDeck as FlashcardDeck,
  ja: jaDeck as FlashcardDeck,
};

const particlesByLang: Record<string, ParticlesData> = {
  ko: koParticles as ParticlesData,
  ja: jaParticles as ParticlesData,
};

export function getDeckForLanguage(languageId: string): FlashcardDeck | null {
  return decksByLang[languageId] ?? null;
}

export function getParticlesForLanguage(languageId: string): ParticlesData | null {
  return particlesByLang[languageId] ?? null;
}
