import type { ParticlesData } from "@/features/practice/data/types";
import koParticles from "@/features/languages/ko/particles.json";
import jaParticles from "@/features/practice/data/ja.json";

/**
 * Deck loading was historically backed by static JSON stub decks
 * (`ja-beginner.json` + a stale `LESSON_TO_CARDS` unlock map). Those are
 * gone (2026-06-13): the JA course deck is now generated from curriculum
 * atoms — see `./courseDeck.ts` (`buildEnrichedJaCourseDeck`) — and the
 * flashcard surface sources it via `useFlashcardDueSummary`. Community /
 * addon decks come from the backend deck API.
 *
 * Only the particle data + cover-image helper remain here; both still have
 * live consumers (practice page, community/admin deck cards).
 */
const particlesByLang: Record<string, ParticlesData> = {
  ko: koParticles as ParticlesData,
  ja: jaParticles as ParticlesData,
};

export function getParticlesForLanguage(languageId: string): ParticlesData | null {
  return particlesByLang[languageId] ?? null;
}

/** Placeholder image base; deterministic per seed. Replace with /api/placeholder/deck/{id} when backend supports it. */
const PLACEHOLDER_BASE = "https://picsum.photos/seed";

/**
 * Returns the deck/addon cover image URL. Uses `image` if set; otherwise a deterministic placeholder.
 * @param id - Deck or addon ID (used as placeholder seed)
 * @param image - Optional custom image URL from manifest/addon
 * @param size - Placeholder dimensions (default 400x200)
 */
export function getDeckImageUrl(
  id: string,
  image?: string | null,
  size = "400/200"
): string {
  if (image) return image;
  return `${PLACEHOLDER_BASE}/${encodeURIComponent(id)}/${size}`;
}
