/**
 * Shared tile surface for the two build-step views (BuildSentenceStepView
 * + ListeningBuildStepView) — Spencer pedagogy ruling 2026-07-17: build
 * tiles DISPLAY a word's kanji once the lesson's module has unlocked it,
 * with kana furigana above until the atom reaches FSRS mastery ("they
 * NEED the exposure").
 *
 * DISPLAY-ONLY: tile identity, `tiles`, `correctOrder`, and every
 * comparison stay the KANA strings — the views keep tracking bank
 * indices/kana and only swap what's painted. Character-granularity builds
 * (kana decoding drills) never kanji-fy: kana IS their content.
 *
 * FURIGANA = KANA ONLY (never-mix rule): a kanji-fied tile renders its
 * own <ruby> here and never routes through the romaji helper machinery,
 * so romaji can never appear on a kanji-bearing tile. The <rt> carries
 * `data-visible="true|false"` exactly like AnnotatedText's helper <rt>s,
 * so tests/judges assert visibility the same way, and it keeps a
 * zero-width-space placeholder when hidden so tile geometry (and the
 * invisible slot-sizing copies the views render) is measured with the
 * SAME glyph box either way.
 *
 * MASTERY READ (v1): `isMastered` over the SRS card state, read via
 * `getCardState(atomId)` inside a useMemo keyed on `useSRSStoreRevision`
 * — reactive when the revision provider is mounted (app shell), a plain
 * read-at-mount otherwise. Tiles don't need live updates mid-step.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { KanjiRuby } from "@/shared/readingAnnotation/KanjiRuby";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import { getCardState, isMastered } from "@/features/flashcards/engine";
import {
  auxiliarySuppressedTiles,
  resolveBuildTileKanji,
} from "@/features/languages/ja/secondScript/buildTileKanji";

/** Hover dwell before a character-build tile's romaji peek fires. Long
 *  enough that a passing cursor doesn't leak the answer, short enough to
 *  feel like an intentional peek. */
export const HOVER_REVEAL_MS = 500;

/**
 * Per-tile romaji peek for character-granularity builds (Spencer
 * 2026-07-19: "make them hoverable for the romaji hint"). A tile reveals
 * on tap or after a hover dwell and stays revealed. Revealed tiles are
 * FORCED on (AnnotatedText forceShowHelper), so the peek works even when
 * romaji is globally hidden — the per-script auto-off guard (hiragana@M7)
 * or the M5 tile-fade setting. The prior sentence-view reveal only cleared
 * its local hide flag, which the global gate silently overrode for any
 * learner past the cutoff. Keyed by BANK index (duplicate glyphs reveal
 * independently, matching the views' index-tracked tiles).
 */
export function useTileRomajiPeek(enabled: boolean) {
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const hoverTimer = useRef<number | null>(null);
  const reveal = useCallback(
    (i: number) => {
      if (!enabled) return;
      setRevealed((prev) => {
        if (prev.has(i)) return prev;
        const next = new Set(prev);
        next.add(i);
        return next;
      });
    },
    [enabled],
  );
  const hoverStart = useCallback(
    (i: number) => {
      if (!enabled || revealed.has(i)) return;
      hoverTimer.current = window.setTimeout(() => reveal(i), HOVER_REVEAL_MS);
    },
    [enabled, revealed, reveal],
  );
  const hoverEnd = useCallback(() => {
    if (hoverTimer.current != null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);
  return { revealed, reveal, hoverStart, hoverEnd };
}

export type BuildTileDisplay = {
  /** Kanji display surface (e.g. 店). */
  surface: string;
  /** The tile's kana — furigana reading; identical to the grading string. */
  reading: string;
  atomId: string;
  /** Furigana shows while the atom is NOT FSRS-mastered. */
  furiganaVisible: boolean;
};

/**
 * kana tile → kanji display map for a build step's bank. Empty for
 * character-granularity builds (kana decoding — excluded by ruling) and
 * outside a lesson (`useLessonModuleIndex() === null`). Tiles in AUXILIARY
 * position (glued behind a て/で-form in the authored sentence — 〜てみる,
 * 〜ておく, …) are excluded: the helper verb is written in kana, and the
 * per-tile resolver alone cannot see the neighbour that makes it one
 * (`auxiliarySuppressedTiles` — Spencer prod QA 2026-08-21, 見る on m30's
 * てみる helper tile).
 */
export function useBuildTileKanji(
  tiles: readonly string[],
  granularity: "word" | "character",
  targetSentence: string | undefined,
  correctOrder: readonly string[],
): ReadonlyMap<string, BuildTileDisplay> {
  const moduleIndex = useLessonModuleIndex();
  const revision = useSRSStoreRevision();
  return useMemo(() => {
    const map = new Map<string, BuildTileDisplay>();
    if (granularity === "character") return map; // kana IS the content
    const suppressed = auxiliarySuppressedTiles(targetSentence, correctOrder);
    for (const kana of new Set(tiles)) {
      if (suppressed.has(kana)) continue; // auxiliary position → stays kana
      const resolved = resolveBuildTileKanji(kana, moduleIndex);
      if (!resolved) continue;
      map.set(kana, {
        ...resolved,
        furiganaVisible: !isMastered(getCardState(resolved.atomId)),
      });
    }
    return map;
    // `revision` re-reads mastery after an SRS store change (sync/review).
  }, [tiles, granularity, targetSentence, correctOrder, moduleIndex, revision]);
}

/**
 * One tile's visible glyphs. Kanji-fied tiles render a single <ruby> with
 * the kana floating as furigana until mastered; everything else falls
 * back to the exact AnnotatedText call the views always made (romaji
 * helpers, character-build hide/reveal, etc. unchanged).
 *
 * Used for bank tiles, placed/tray tiles, AND the invisible slot-sizing
 * ghost copies — geometry must be measured with the same glyphs or the
 * slots/tray mis-size.
 */
export function BuildTileSurface({
  tile,
  kanji,
  hideHelper,
  forceHelper,
}: {
  /** The kana tile string (grading identity). */
  tile: string;
  /** Kanji display entry from `useBuildTileKanji`, if the tile kanji-fies. */
  kanji?: BuildTileDisplay;
  /** Romaji hard-off passthrough (character-build fade) for kana tiles. */
  hideHelper?: boolean;
  /** Romaji hard-ON passthrough (peek reveal — see useTileRomajiPeek).
   *  Overrides the global script guard; hideHelper still wins inside
   *  AnnotatedText, so pass at most one. Kanji tiles ignore it (never
   *  romaji on a kanji-bearing tile). */
  forceHelper?: boolean;
}) {
  if (!kanji)
    return (
      <AnnotatedJa
        text={tile}
        hideHelper={hideHelper}
        forceShowHelper={forceHelper}
      />
    );
  // Okurigana-aligned shared ruby (Spencer QA 2026-07-17): the <rt> covers
  // only the kanji run — 飲(の)まない, never (のまない) over 飲まない.
  return (
    <KanjiRuby
      data-build-tile-kanji="true"
      lang="ja"
      surface={kanji.surface}
      reading={kanji.reading}
      show={kanji.furiganaVisible}
    />
  );
}
