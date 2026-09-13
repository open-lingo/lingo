/**
 * Single shared renderer for a kanji surface with FSRS/window-gated furigana
 * (Spencer 2026-07-17) — used by AnnotatedText's kanji branch, the build-tile
 * surface, and the review match tiles so all three sites share one DOM
 * convention:
 *
 *   - OKURIGANA-ALIGNED: the <rt> covers only the kanji run
 *     (`alignFurigana`) — 飲(の)む, not (のむ) over 飲む. Shared kana affixes
 *     render as sibling bases inside the SAME <ruby> element (an empty
 *     aria-hidden <rt> pairs off a leading kana prefix), so a ruby's base
 *     text is always the full surface — tests and visual-QA judges keep
 *     asserting on whole-surface bases.
 *   - The helper <rt class="kana-helper"> carries `data-visible="true|false"`
 *     and keeps a zero-width-space placeholder when hidden, exactly like
 *     every other helper <rt> in the app, so geometry is measured with the
 *     same glyph box either way.
 *   - FURIGANA = KANA ONLY: this component never renders romaji (never-mix).
 */
import type { ComponentPropsWithoutRef } from "react";
import { alignFurigana } from "@/shared/japanese/okurigana";

type Props = {
  /** Kanji-bearing display surface (飲まない, 学校…). */
  surface: string;
  /** Kana reading for the whole surface; aligned onto the kanji run here. */
  reading: string;
  /** Whether the furigana is visible (window floor OR unmastered — the
   *  caller computes it, e.g. via `kanjiFuriganaSrsVisible`). */
  show: boolean;
} & ComponentPropsWithoutRef<"ruby">;

/**
 * Whether the reading can be CENTRED over its kanji run without WebKit prying
 * the word apart. `ruby-align: center` pads the annotated base out to the
 * width of its annotation; that padding lands INSIDE the word whenever a kana
 * affix shares the <ruby> (忙(いそが)しい → "忙 しい", TestFlight #36), but is
 * harmless — symmetric, outside the glyphs — when the ruby is the whole word
 * (外国, 日本語). With no affix we always centre; with an affix we centre only
 * when the reading cannot be wider than the run: helper kana are ≤0.75em of
 * the base (`.kana-helper` = max(.65em, 12px) on a ≥16px host), so a reading
 * with no more glyphs than its kanji run never exceeds it (行(い)く, 食(た)べる —
 * measured 0px base shift on the iOS 18.7 simulator; 4 kana over 3 kanji is
 * the worst fit at 0.5px a side). Everything else keeps `start`, where the
 * reading overhangs the affix (TestFlight #62 asked for centred furigana
 * "if we can help it"; this is the subset we can).
 */
export function kanjiRubyFits(parts: { prefix: string; body: string; rt: string; suffix: string }): boolean {
  if (parts.prefix === "" && parts.suffix === "") return true;
  return [...parts.rt].length <= [...parts.body].length;
}

export function KanjiRuby({ surface, reading, show, className, ...rubyProps }: Props) {
  const parts = alignFurigana(surface, reading);
  const { prefix, body, rt, suffix } = parts;
  return (
    // `kanji-ruby` (index.css) start-aligns the annotation so a reading wider
    // than its kanji overhangs the following kana instead of prying the word
    // apart — 忙(いそが)しい rendered as "忙 しい" on iOS (TestFlight #36).
    // `data-fit="true"` opts the safe subset back into `center` (#62).
    <ruby
      {...rubyProps}
      className={className ? `kanji-ruby ${className}` : "kanji-ruby"}
      data-fit={kanjiRubyFits(parts) ? "true" : "false"}
    >
      {prefix !== "" && (
        <>
          {prefix}
          {/* Empty pair-off <rt> so the annotated base starts at `body`. */}
          <rt aria-hidden="true" />
        </>
      )}
      {body}
      <rt
        className="kana-helper"
        data-visible={show ? "true" : "false"}
        aria-hidden={!show}
      >
        {/* The reading lives in an inner span so effects can target the INK
            and never the <rt> box: WebKit drops an <rt> out of its ruby the
            moment the <rt> itself gets a compositing layer (a clip-path
            animation was painting the reveal's furigana at the bottom of the
            page on iOS — TestFlight #12). */}
        <span className="kana-helper-ink">{show ? rt : "​"}</span>
      </rt>
      {suffix}
    </ruby>
  );
}
