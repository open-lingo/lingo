import { useEffect, useRef } from "react";
import type { Flashcard } from "@/features/flashcards/data/types";

/**
 * Warm the browser image cache for the next few cards in the queue so the
 * artwork is decoded before the card is shown — no pop-in after flip/advance.
 *
 * Keyed off the upcoming slice of the queue; each new src is requested via a
 * detached `Image()` exactly once (we track what we've already kicked off).
 */
export function useImagePreload(
  cards: Flashcard[],
  startIndex: number,
  ahead = 3,
): void {
  const requested = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const upcoming = cards.slice(startIndex + 1, startIndex + 1 + ahead);
    for (const card of upcoming) {
      const src = card.image;
      if (!src || requested.current.has(src)) continue;
      requested.current.add(src);
      const img = new Image();
      // `decoding=async` lets the browser decode off the main thread; by the
      // time the card mounts the bitmap is ready to paint.
      img.decoding = "async";
      img.src = src;
    }
  }, [cards, startIndex, ahead]);
}
