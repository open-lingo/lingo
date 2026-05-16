import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useSettings } from "@/shared/contexts/SettingsContext";
import type { SubscriptionQueueFilter } from "./useSubscriptionQueue";

/** Resolve SRS review queue filter from URL (?decks= / ?studyOption= / ?scope=) + saved study options. */
export function useReviewQueueFilter(): SubscriptionQueueFilter {
  const [params] = useSearchParams();
  const { settings } = useSettings();

  const decksCsv = params.get("decks");
  const studyOptionId = params.get("studyOption");
  const scope = params.get("scope");

  const studyOptionsJson = JSON.stringify(settings.flashcards?.studyOptions ?? []);

  return useMemo((): SubscriptionQueueFilter => {
    if (decksCsv?.trim()) {
      const ids = new Set(
        decksCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
      if (ids.size > 0) return { kind: "deckIds", deckIds: ids };
    }
    if (studyOptionId?.trim()) {
      const opt = settings.flashcards?.studyOptions?.find((o) => o.id === studyOptionId.trim());
      if (opt && opt.deckIds.length > 0) {
        return { kind: "deckIds", deckIds: new Set(opt.deckIds) };
      }
    }
    if (scope === "vocab" || scope === "lessons") {
      return { kind: "preset", preset: scope };
    }
    return { kind: "all" };
  }, [decksCsv, studyOptionId, scope, studyOptionsJson, settings.flashcards?.studyOptions]);
}
