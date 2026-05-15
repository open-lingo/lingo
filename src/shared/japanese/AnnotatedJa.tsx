import { Fragment, useMemo, type ReactElement } from "react";
import { tokenizeJapanese, isKana, KANA_ROMAJI } from "./kanaTable";
import type { JapaneseAnnotation } from "./types";
import {
  useTrackExposure,
  useKanaHelperVisible,
} from "@/features/japanese/kanaMastery";

type CommonProps = {
  /** Inline className applied to the outer <span>. */
  className?: string;
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
 * One renderer for every Japanese string in the app. Wraps kana in
 * <ruby><rt>romaji</rt></ruby>; the <rt> only shows if the learner has
 * NOT crossed the mastery bar for that kana.
 *
 * - Bare mode: `<AnnotatedJa text="みず" />` — tokenizes + auto-romaji.
 * - Segments mode: pass explicit `segments` for kanji words or to override
 *   romaji per segment.
 */
export function AnnotatedJa(props: Props): ReactElement {
  const segments = "segments" in props && props.segments ? props.segments : null;
  const text = "text" in props && props.text != null ? props.text : "";
  const className = props.className;

  if (segments) {
    return (
      <span className={className} lang="ja">
        {segments.map((seg, i) => (
          <SegmentRender key={i} segment={seg} />
        ))}
      </span>
    );
  }

  return (
    <span className={className} lang="ja">
      <BareRender text={text} />
    </span>
  );
}

function BareRender({ text }: { text: string }) {
  const tokens = useMemo(() => tokenizeJapanese(text), [text]);
  return (
    <>
      {tokens.map((tok, i) =>
        tok.kana ? (
          <KanaToken key={i} kana={tok.text} romaji={tok.romaji ?? ""} />
        ) : (
          <span key={i}>{tok.text}</span>
        ),
      )}
    </>
  );
}

function SegmentRender({ segment }: { segment: JapaneseAnnotation }) {
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
      return <KanaSegment surface={surface} romaji={romaji} role={role} />;
    }
    return (
      <Fragment>
        {tokens.map((tok, i) =>
          tok.kana ? (
            <KanaToken
              key={i}
              kana={tok.text}
              romaji={tok.romaji ?? ""}
              role={role}
            />
          ) : (
            <span key={i}>{tok.text}</span>
          ),
        )}
      </Fragment>
    );
  }
  // Kanji branch — Phase 3 will animate this for furigana; for now,
  // render the surface with the reading floating above as a single ruby.
  const helper = romaji ?? reading;
  return (
    <ruby data-role={role}>
      {surface}
      <rt className="kana-helper">{helper}</rt>
    </ruby>
  );
}

function KanaSegment({
  surface,
  romaji,
  role,
}: {
  surface: string;
  romaji: string;
  role?: JapaneseAnnotation["role"];
}) {
  return (
    <ruby data-role={role}>
      {surface}
      <rt className="kana-helper">{romaji}</rt>
    </ruby>
  );
}

function KanaToken({
  kana,
  romaji,
  role,
}: {
  kana: string;
  romaji: string;
  role?: JapaneseAnnotation["role"];
}) {
  useTrackExposure(kana);
  const helperVisible = useKanaHelperVisible(kana);
  const fallback = romaji || KANA_ROMAJI[kana] || "";
  return (
    <ruby data-role={role}>
      {kana}
      <rt
        className="kana-helper"
        data-visible={helperVisible ? "true" : "false"}
        aria-hidden={!helperVisible}
      >
        {helperVisible ? fallback : "​"}
      </rt>
    </ruby>
  );
}
