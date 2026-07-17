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

export function KanjiRuby({ surface, reading, show, ...rubyProps }: Props) {
  const { prefix, body, rt, suffix } = alignFurigana(surface, reading);
  return (
    <ruby {...rubyProps}>
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
        {show ? rt : "​"}
      </rt>
      {suffix}
    </ruby>
  );
}
