/**
 * Generic reading-annotation renderer.
 *
 * Phase 2 (2026-06-01) — the bare-text path now consumes the active
 * language's `module.readingAnnotation` capability for tokenization +
 * annotation. JA plugs in its kana-aware annotator via the
 * `ReadingAnnotationCapability` slot (see
 * `features/languages/ja/module.ts`).
 *
 * Segments mode still accepts the JA-content shape (`JapaneseAnnotation[]`)
 * directly because lesson authoring tools serialize that shape into JA
 * lesson content; per-language reading annotators are responsible for
 * producing fragments in bare-text mode at runtime.
 *
 * When no language is active or the active language has no
 * `readingAnnotation` capability, the component renders plain text
 * (no helper, no ruby).
 */
import { useMemo, type ReactElement } from "react";
import { containsKanji, isKana, isKatakana } from "@/shared/japanese/kanaTable";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import { useTrackExposure } from "@/shared/symbolMastery";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  romajiVisibleForScript,
  todayLocalDate,
  HIRAGANA_ROMAJI_OFF_MODULE,
  KATAKANA_ROMAJI_OFF_MODULE,
} from "@/shared/settings/romajiAutoFlip";
import { useLessonModuleIndex } from "@/shared/contexts/LessonModuleContext";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";
import { getCardState, isMastered } from "@/features/flashcards/engine";
import { KanjiRuby } from "./KanjiRuby";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { tryGetLanguageModule } from "@/shared/language/registry";
import type { AnnotationFragment } from "@/shared/language/types";

/**
 * Furigana visibility for a kanji segment, SRS side (Spencer 2026-07-17 —
 * window floor OR unmastered, uniform across sentence surfaces, build tiles,
 * and match tiles): a segment the kanji substitution pass stamped
 * (`furiganaWindowOpen` + `atomId`) shows furigana while the lesson module is
 * inside the kanji's unlock+FURIGANA_WINDOW grace window (the floor — even
 * for long-mastered atoms) OR until the atom is FSRS-mastered. Unstamped
 * segments (hand-authored kanji, kanji_reading prompts, kana) return `true`:
 * their visibility stays purely data-driven (`reading !== surface` floats;
 * `reading === surface` has nothing to float — the kanji_reading
 * suppression). Pure store read — callers wanting reactivity re-run it keyed
 * on `useSRSStoreRevision()`.
 */
export function kanjiFuriganaSrsVisible(
  segment: Pick<JapaneseAnnotation, "atomId" | "furiganaWindowOpen">,
): boolean {
  if (segment.furiganaWindowOpen === undefined || !segment.atomId) {
    return true; // unstamped segment → legacy reading!==surface behavior
  }
  return (
    segment.furiganaWindowOpen || !isMastered(getCardState(segment.atomId))
  );
}

type CommonProps = {
  /** Inline className applied to the outer <span>. */
  className?: string;
  /** When true, render the romaji helper regardless of per-kana mastery
   *  state. Used by teaching scaffolds (e.g. M2 "How do you say X?" MCQ)
   *  where the romaji IS the lookup key, not the answer. */
  forceShowHelper?: boolean;
  /** When true, force the romaji helper OFF regardless of the global
   *  show-romaji setting, mastery state, or `forceShowHelper`. Used where
   *  the romaji would give away the answer — e.g. character-build tile
   *  banks, which print "su/shi/..." above each kana and let a learner
   *  solve by matching romaji to the English prompt without reading any
   *  kana (Spencer 2026-06-13). Wins over every other visibility input. */
  hideHelper?: boolean;
};

type BareProps = CommonProps & {
  text: string;
  segments?: undefined;
};

type SegmentedProps = CommonProps & {
  segments: JapaneseAnnotation[];
  text?: undefined;
};

type Props = BareProps | SegmentedProps;

/**
 * One renderer for every annotated string in the app. Wraps each
 * annotation fragment in <ruby><rt>helper</rt></ruby>; the <rt> only
 * shows if the learner has NOT crossed the mastery bar for that symbol.
 *
 * - Bare mode: `<AnnotatedText text="みず" />` — tokenizes via
 *   `module.readingAnnotation.annotate`.
 * - Segments mode: pass JA-shape segments for authored content.
 */
export function AnnotatedText(props: Props): ReactElement {
  const segments = "segments" in props && props.segments ? props.segments : null;
  const text = "text" in props && props.text != null ? props.text : "";
  const className = props.className;
  const forceShowHelper = props.forceShowHelper ?? false;
  const hideHelper = props.hideHelper ?? false;

  // Active language id — null when no learner profile is set yet
  // (LanguagePickerModal route). Falls back to "ja" so authored JA
  // surfaces inside the lesson player keep rendering correctly.
  const language = useActiveLanguageOrJa();

  if (segments) {
    return (
      <span className={className} lang={language}>
        {segments.map((seg, i) => (
          <SegmentRender
            key={i}
            segment={seg}
            forceShowHelper={forceShowHelper}
            hideHelper={hideHelper}
          />
        ))}
      </span>
    );
  }

  return (
    <span className={className} lang={language}>
      <BareRender
        text={text}
        forceShowHelper={forceShowHelper}
        hideHelper={hideHelper}
        languageId={language}
      />
    </span>
  );
}

function useActiveLanguageOrJa(): string {
  try {
    const { language } = useLanguage();
    return language?.id ?? "ja";
  } catch {
    // No provider — defaults to JA so the JA-heavy lesson player keeps
    // rendering in tests / Storybook contexts that don't mount the
    // LanguageProvider.
    return "ja";
  }
}

function BareRender({
  text,
  forceShowHelper,
  hideHelper,
  languageId,
  role,
}: {
  text: string;
  forceShowHelper: boolean;
  hideHelper?: boolean;
  languageId: string;
  role?: JapaneseAnnotation["role"];
}) {
  const fragments = useMemo<AnnotationFragment[]>(() => {
    const module = tryGetLanguageModule(languageId);
    const annotator = module?.readingAnnotation;
    if (!annotator) {
      // No capability — plain text. One fragment per char keeps the
      // render shape stable.
      return Array.from(text).map((ch) => ({ text: ch }));
    }
    return annotator.annotate(text);
  }, [text, languageId]);

  return (
    <>
      {fragments.map((frag, i) =>
        frag.symbols && frag.reading ? (
          <WordToken
            key={i}
            word={frag.text}
            romaji={frag.reading}
            symbols={frag.symbols}
            role={role}
            forceShowHelper={forceShowHelper}
            hideHelper={hideHelper}
            languageId={languageId}
          />
        ) : frag.reading ? (
          <SymbolToken
            key={i}
            symbol={frag.text}
            symbolId={frag.symbolId ?? `${languageId}:${frag.text}`}
            helper={frag.reading}
            role={role}
            forceShowHelper={forceShowHelper}
            hideHelper={hideHelper}
            languageId={languageId}
          />
        ) : (
          <span key={i} data-role={role}>{frag.text}</span>
        ),
      )}
    </>
  );
}

function SegmentRender({
  segment,
  forceShowHelper,
  hideHelper,
}: {
  segment: JapaneseAnnotation;
  forceShowHelper: boolean;
  hideHelper?: boolean;
}) {
  const { surface, reading, romaji, role } = segment;
  // FURIGANA VISIBILITY, SRS side (Spencer 2026-07-17 — uniform with build
  // tiles): for a kanji segment the substitution pass stamped
  // (`furiganaWindowOpen` + `atomId`), furigana is visible while the module
  // sits inside the kanji's unlock+FURIGANA_WINDOW grace window (the floor)
  // OR until the atom is FSRS-mastered (the extension — past the window,
  // furigana stays until the learner actually knows the word). Segments the
  // pass did NOT stamp (no atomId / no flag — hand-authored kanji,
  // kanji_reading prompts, every kana segment) keep the legacy rule: the
  // reading floats whenever `reading !== surface`, and stays structurally
  // suppressed when `reading === surface` (nothing to float — the
  // kanji_reading "answer never prints" guarantee). The predicate is
  // `kanjiFuriganaSrsVisible` (top of file, shared with the match-tile
  // renderer). Mirrors `useBuildTileKanji`'s useMemo-on-revision pattern:
  // reactive when the SRSStoreRevisionProvider is mounted, a plain
  // read-at-mount otherwise (the context defaults to 0 with no provider —
  // null-safe).
  const revision = useSRSStoreRevision();
  const furiganaMasteryVisible = useMemo(
    () => kanjiFuriganaSrsVisible(segment),
    // `revision` re-reads mastery after an SRS store change (sync/review).
    [segment, revision],
  );
  // Pure non-Japanese segments (English prose, punctuation, numbers) render
  // as plain text — no <ruby>, no helper. This keeps "What does あい mean?"
  // free of phantom romaji annotations above the English words. Kanji-only
  // surfaces (一, 六 — from the kanji substitution layer) are NOT plain
  // text: they fall through to the kanji branch so their furigana reading
  // can float above.
  const hasAnyKana = Array.from(surface).some(isKana);
  if (!hasAnyKana && !containsKanji(surface)) {
    return <span data-role={role}>{surface}</span>;
  }
  // If the segment carries no kanji and surface===reading, annotate it like a
  // bare kana string (per-kana helpers pre-M3, word-grouped romaji after).
  // Spaces/punctuation inside the segment are fine: buildSentenceAnnotation
  // filler runs span particles and separators ("は とおいです"), and the bare
  // annotator already handles them. Requiring every char to be kana sent
  // those fillers into the kanji-branch fallback below, which floated their
  // own kana reading above them (ja-m8-6-1 regression).
  const isPureKana = surface === reading && !containsKanji(surface);
  if (isPureKana) {
    // If author supplied an explicit segment-level romaji, prefer it over
    // the annotator for the *whole* segment as a single annotation.
    if (romaji) {
      return (
        <KanaSegment
          surface={surface}
          romaji={romaji}
          role={role}
          hideHelper={hideHelper}
        />
      );
    }
    // No explicit override — same annotator as the bare path, so authored
    // segments get word-level romaji grouping past the kana phase too (the
    // M3+ invariant; pre-M3 the annotator emits per-kana fragments and this
    // renders identically to the historical per-token loop). Regression:
    // SpeakingStepView reference cards showed さん as "sa"+"n" forever
    // because this branch bypassed the lexicon.
    return (
      <BareRender
        text={surface}
        forceShowHelper={forceShowHelper}
        hideHelper={hideHelper}
        languageId="ja"
        role={role}
      />
    );
  }
  // Kanji branch — render the surface with the reading floating above
  // as a single ruby.
  //
  // NEVER-MIX RULE (Spencer 2026-07-16 — "we just dont want romaji +
  // kanji ever, looks tacky and is bad practice"): once `surface` carries
  // any kanji, ROMAJI is suppressed outright — no settings input can bring
  // it back, matching `useRomajiHelperVisible` below. FURIGANA (the kana
  // `reading`) is not romaji: it's how Japanese annotates kanji, and it's
  // the whole point of the kanji substitution layer. The layer always
  // carries the kana reading on stamped segments — visibility is decided
  // HERE by `furiganaMasteryVisible` (window floor OR unmastered, above).
  // reading === surface still means "nothing to float" (the kanji_reading
  // suppression shape and pre-2026-07-17 authored data).
  const kanjiSurface = containsKanji(surface);
  const helper = kanjiSurface
    ? reading !== surface
      ? reading
      : null
    : (romaji ?? reading);
  if (kanjiSurface && helper != null) {
    // Okurigana-aligned ruby (Spencer QA 2026-07-17): the <rt> covers only
    // the kanji run — 飲(の)まない, never (のまない) over 飲まない.
    return (
      <KanjiRuby
        surface={surface}
        reading={helper}
        show={!hideHelper && furiganaMasteryVisible}
        data-role={role}
      />
    );
  }
  const showHelper = !hideHelper && helper != null;
  return (
    <ruby data-role={role}>
      {surface}
      <rt
        className="kana-helper"
        data-visible={showHelper ? "true" : "false"}
        aria-hidden={!showHelper}
      >
        {showHelper ? helper : "​"}
      </rt>
    </ruby>
  );
}

function KanaSegment({
  surface,
  romaji,
  role,
  hideHelper,
}: {
  surface: string;
  romaji: string;
  role?: JapaneseAnnotation["role"];
  hideHelper?: boolean;
}) {
  return (
    <ruby data-role={role}>
      {surface}
      <rt className="kana-helper" aria-hidden={hideHelper}>
        {hideHelper ? "​" : romaji}
      </rt>
    </ruby>
  );
}

type KanaScript = "hiragana" | "katakana";

/**
 * Per-script romaji fade: the single `showRomaji` master toggle gates
 * both scripts; each script's romaji auto-hides once the learner crosses
 * its module milestone (hiragana M7 / katakana M17), unless the "show
 * romaji for today" escape hatch is active. `hideHelper` is a hard OFF
 * (answer-giveaway surfaces like build-tile banks). `forceShowHelper`
 * (lookup-key surfaces like the M2 "how do you say X" MCQ) can still
 * surface romaji when the master toggle is off, but never resurrects a
 * script the learner has formally retired.
 *
 * Multi-script callers (word tokens over mixed surfaces like アメリカじん)
 * pass every script present: the helper stays visible while ANY of them
 * still shows romaji, and force-show is dead only once ALL are retired.
 *
 * NEVER-MIX RULE (Spencer 2026-07-16 — "we just dont want romaji + kanji
 * ever, looks tacky and is bad practice"): `surface` is the raw rendered
 * text (the word or symbol, pre-annotation). If it contains any kanji,
 * this returns false unconditionally — before the settings/script checks
 * below, so it wins over `forceShowHelper`, over `showRomaji`, and over
 * the "romaji for today" escape hatch alike. Dormant today (the JA
 * annotator only emits kana fragments pre-kanji-layer), but real so the
 * kanji-substitution layer can't accidentally resurrect romaji-over-kanji
 * through this gate once it starts feeding kanji text through here.
 */
function useRomajiHelperVisible({
  scripts,
  surface,
  forceShowHelper,
  hideHelper,
  languageId,
}: {
  scripts: readonly KanaScript[];
  surface: string;
  forceShowHelper?: boolean;
  hideHelper?: boolean;
  languageId?: string;
}): boolean {
  const { settings } = useSettings();
  // Where the learner is *right now*, so the ladder gates by position and not
  // only by the one-shot `hiraganaRomajiAutoOff` flag (which is set on lesson
  // completion, so QA jumps / deep links into a late lesson leak romaji).
  // null outside a lesson → guard-only behavior, unchanged.
  const moduleIndex = useLessonModuleIndex();
  const today = todayLocalDate();
  if (containsKanji(surface)) return false;
  // Non-JA phonetic scripts (e.g. Korean Revised Romanization above Hangul)
  // use one language-neutral "show romanization" toggle — no per-script fade
  // model. The kana-script logic below is JA-specific.
  if (languageId && languageId !== "ja") {
    if (hideHelper) return false;
    return !!forceShowHelper || (settings.learning.showRomanization ?? true);
  }
  const romajiVisible = scripts.some((script) =>
    romajiVisibleForScript({ settings, script, today, moduleIndex }),
  );
  const allRetired = scripts.every((script) => {
    const threshold =
      script === "katakana"
        ? KATAKANA_ROMAJI_OFF_MODULE
        : HIRAGANA_ROMAJI_OFF_MODULE;
    const guardOff =
      script === "katakana"
        ? (settings.learning.katakanaRomajiAutoOff ?? false)
        : (settings.learning.hiraganaRomajiAutoOff ?? false);
    // Position past the threshold retires the script even when the guard
    // never flipped, so `forceShowHelper` can't resurrect romaji at m29+.
    return guardOff || (moduleIndex != null && moduleIndex >= threshold);
  });
  return !hideHelper && (romajiVisible || (!!forceShowHelper && !allRetired));
}

/** Effect-only child: keeps hook usage legal while a word token tracks
 *  exposure for EACH contained symbol (mastery counters stay per-kana). */
function TrackExposure({ symbol }: { symbol: string }) {
  useTrackExposure(symbol);
  return null;
}

/**
 * Word-grouped fragment (post-kana-phase bare mode): ONE ruby spanning the
 * whole word with its authored romaji rendered once — "gakusei" over
 * がくせい instead of per-glyph "ga ku se i". Visually equivalent to the
 * segments-mode `KanaSegment`, but wired into mastery tracking and the
 * per-script fade like `SymbolToken`.
 */
function WordToken({
  word,
  romaji,
  symbols,
  role,
  forceShowHelper,
  hideHelper,
  languageId,
}: {
  word: string;
  romaji: string;
  symbols: string[];
  role?: JapaneseAnnotation["role"];
  forceShowHelper?: boolean;
  hideHelper?: boolean;
  languageId?: string;
}) {
  const scripts: KanaScript[] = [];
  if (Array.from(word).some((ch) => isKatakana(ch))) scripts.push("katakana");
  if (Array.from(word).some((ch) => isKana(ch) && !isKatakana(ch))) {
    scripts.push("hiragana");
  }
  const helperVisible = useRomajiHelperVisible({
    scripts: scripts.length > 0 ? scripts : ["hiragana"],
    surface: word,
    forceShowHelper,
    hideHelper,
    languageId,
  });
  return (
    <>
      {symbols.map((s, i) => (
        <TrackExposure key={i} symbol={s} />
      ))}
      <ruby data-word-romaji="true" data-role={role}>
        {word}
        <rt
          className="kana-helper"
          data-visible={helperVisible ? "true" : "false"}
          aria-hidden={!helperVisible}
        >
          {helperVisible ? romaji : "​"}
        </rt>
      </ruby>
    </>
  );
}

function SymbolToken({
  symbol,
  symbolId,
  helper,
  role,
  forceShowHelper,
  hideHelper,
  languageId,
}: {
  symbol: string;
  symbolId: string;
  helper: string;
  role?: JapaneseAnnotation["role"];
  forceShowHelper?: boolean;
  hideHelper?: boolean;
  languageId?: string;
}) {
  useTrackExposure(symbol);
  const helperVisible = useRomajiHelperVisible({
    scripts: [isKatakana(symbol) ? "katakana" : "hiragana"],
    surface: symbol,
    forceShowHelper,
    hideHelper,
    languageId,
  });
  return (
    <ruby data-role={role} data-symbol-id={symbolId}>
      {symbol}
      <rt
        className="kana-helper"
        data-visible={helperVisible ? "true" : "false"}
        aria-hidden={!helperVisible}
      >
        {helperVisible ? helper : "​"}
      </rt>
    </ruby>
  );
}
