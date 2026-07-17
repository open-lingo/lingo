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
import { useMemo } from "react";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { KanjiRuby } from "@/shared/readingAnnotation/KanjiRuby";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import { getCardState, isMastered } from "@/features/flashcards/engine";
import { resolveBuildTileKanji } from "@/features/languages/ja/secondScript/buildTileKanji";

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
 * outside a lesson (`useLessonModuleIndex() === null`).
 */
export function useBuildTileKanji(
  tiles: readonly string[],
  granularity: "word" | "character",
): ReadonlyMap<string, BuildTileDisplay> {
  const moduleIndex = useLessonModuleIndex();
  const revision = useSRSStoreRevision();
  return useMemo(() => {
    const map = new Map<string, BuildTileDisplay>();
    if (granularity === "character") return map; // kana IS the content
    for (const kana of new Set(tiles)) {
      const resolved = resolveBuildTileKanji(kana, moduleIndex);
      if (!resolved) continue;
      map.set(kana, {
        ...resolved,
        furiganaVisible: !isMastered(getCardState(resolved.atomId)),
      });
    }
    return map;
    // `revision` re-reads mastery after an SRS store change (sync/review).
  }, [tiles, granularity, moduleIndex, revision]);
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
}: {
  /** The kana tile string (grading identity). */
  tile: string;
  /** Kanji display entry from `useBuildTileKanji`, if the tile kanji-fies. */
  kanji?: BuildTileDisplay;
  /** Romaji hard-off passthrough (character-build fade) for kana tiles. */
  hideHelper?: boolean;
}) {
  if (!kanji) return <AnnotatedJa text={tile} hideHelper={hideHelper} />;
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
