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
import { isKana, isKatakana } from "@/shared/japanese/kanaTable";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import { useTrackExposure } from "@/shared/symbolMastery";
import { useSettings } from "@/shared/contexts/SettingsContext";
import {
  romajiVisibleForScript,
  todayLocalDate,
} from "@/shared/settings/romajiAutoFlip";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { tryGetLanguageModule } from "@/shared/language/registry";
import type { AnnotationFragment } from "@/shared/language/types";

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
  // Pure non-kana segments (English prose, punctuation, numbers) render as
  // plain text — no <ruby>, no helper. This keeps "What does あい mean?"
  // free of phantom romaji annotations above the English words.
  const hasAnyKana = Array.from(surface).some(isKana);
  if (!hasAnyKana) {
    return <span data-role={role}>{surface}</span>;
  }
  // If the segment is pure kana and surface===reading, annotate it like a
  // bare kana string (per-kana helpers pre-M3, word-grouped romaji after).
  const isPureKana = surface === reading && Array.from(surface).every(isKana);
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
  const helper = romaji ?? reading;
  return (
    <ruby data-role={role}>
      {surface}
      <rt className="kana-helper" aria-hidden={hideHelper}>
        {hideHelper ? "​" : helper}
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
 * its module milestone (hiragana M10 / katakana M17), unless the "show
 * romaji for today" escape hatch is active. `hideHelper` is a hard OFF
 * (answer-giveaway surfaces like build-tile banks). `forceShowHelper`
 * (lookup-key surfaces like the M2 "how do you say X" MCQ) can still
 * surface romaji when the master toggle is off, but never resurrects a
 * script the learner has formally retired.
 *
 * Multi-script callers (word tokens over mixed surfaces like アメリカじん)
 * pass every script present: the helper stays visible while ANY of them
 * still shows romaji, and force-show is dead only once ALL are retired.
 */
function useRomajiHelperVisible({
  scripts,
  forceShowHelper,
  hideHelper,
}: {
  scripts: readonly KanaScript[];
  forceShowHelper?: boolean;
  hideHelper?: boolean;
}): boolean {
  const { settings } = useSettings();
  const today = todayLocalDate();
  const romajiVisible = scripts.some((script) =>
    romajiVisibleForScript({ settings, script, today }),
  );
  const allRetired = scripts.every((script) =>
    script === "katakana"
      ? (settings.learning.katakanaRomajiAutoOff ?? false)
      : (settings.learning.hiraganaRomajiAutoOff ?? false),
  );
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
}: {
  word: string;
  romaji: string;
  symbols: string[];
  role?: JapaneseAnnotation["role"];
  forceShowHelper?: boolean;
  hideHelper?: boolean;
}) {
  const scripts: KanaScript[] = [];
  if (Array.from(word).some((ch) => isKatakana(ch))) scripts.push("katakana");
  if (Array.from(word).some((ch) => isKana(ch) && !isKatakana(ch))) {
    scripts.push("hiragana");
  }
  const helperVisible = useRomajiHelperVisible({
    scripts: scripts.length > 0 ? scripts : ["hiragana"],
    forceShowHelper,
    hideHelper,
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
}: {
  symbol: string;
  symbolId: string;
  helper: string;
  role?: JapaneseAnnotation["role"];
  forceShowHelper?: boolean;
  hideHelper?: boolean;
}) {
  useTrackExposure(symbol);
  const helperVisible = useRomajiHelperVisible({
    scripts: [isKatakana(symbol) ? "katakana" : "hiragana"],
    forceShowHelper,
    hideHelper,
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
