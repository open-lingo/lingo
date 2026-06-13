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
import { Fragment, useMemo, type ReactElement } from "react";
import { isKana, KANA_ROMAJI, tokenizeJapanese } from "@/shared/japanese/kanaTable";
import type { JapaneseAnnotation } from "@/shared/japanese/types";
import {
  useSymbolHelperVisible,
  useTrackExposure,
} from "@/shared/symbolMastery";
import { useSettings } from "@/shared/contexts/SettingsContext";
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
}: {
  text: string;
  forceShowHelper: boolean;
  hideHelper?: boolean;
  languageId: string;
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
        frag.reading ? (
          <SymbolToken
            key={i}
            symbol={frag.text}
            symbolId={frag.symbolId ?? `${languageId}:${frag.text}`}
            helper={frag.reading}
            forceShowHelper={forceShowHelper}
            hideHelper={hideHelper}
          />
        ) : (
          <span key={i}>{frag.text}</span>
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
  // If the segment is pure kana and surface===reading, render each kana
  // with its own helper (consistent with the bare path).
  const isPureKana = surface === reading && Array.from(surface).every(isKana);
  if (isPureKana) {
    const tokens = tokenizeJapanese(surface);
    // If author supplied an explicit segment-level romaji, prefer it over
    // per-token lookup for the *whole* segment as a single annotation.
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
    return (
      <Fragment>
        {tokens.map((tok, i) =>
          tok.kana ? (
            <SymbolToken
              key={i}
              symbol={tok.text}
              symbolId={`ja:${tok.text}`}
              helper={tok.romaji ?? KANA_ROMAJI[tok.text] ?? ""}
              role={role}
              forceShowHelper={forceShowHelper}
              hideHelper={hideHelper}
            />
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </Fragment>
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
  const masteryVisible = useSymbolHelperVisible(symbol);
  // Global "show romaji" setting (default ON until either: user turns
  // it off, learner reaches M15, or alphabet trainer marks the script
  // mastered). When ON, every kana on every surface shows its romaji
  // helper. When OFF, falls back to per-kana mastery visibility +
  // any caller's `forceShowHelper` override.
  // `hideHelper` is a hard OFF that wins over everything (answer-giveaway
  // surfaces like character-build tile banks).
  const globalShowRomaji = useSettings().settings.learning.showRomaji ?? true;
  const helperVisible =
    !hideHelper && (globalShowRomaji || forceShowHelper || masteryVisible);
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
