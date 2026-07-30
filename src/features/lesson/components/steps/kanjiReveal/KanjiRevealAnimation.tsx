import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { useRevealKeyframes, useRevealPhase } from "./revealKeyframes";

/**
 * The kana→kanji reveal animation — step 1 of the switchover beat (B061).
 *
 * Spencer's sequence, chosen 2026-07-29 from the bake-off at
 * `/ja/qa/kanji-reveal`: *"ink wipe for 5 where it unwipes the tomodachi kana,
 * then 3 the components slide together, then unwipe tomodachi on top in the
 * furigana."*
 *
 * Four beats, one continuous left-to-right gesture: the kana is ERASED off the
 * baseline, the kanji glyphs slide in and take the spot it vacated, then the kana
 * WIPES BACK IN one slot higher at furigana size. The motion states the whole
 * rule — this word keeps its sound, gives up the baseline, and moves upstairs.
 *
 * Lives here rather than in the dev gallery because it now backs a real step
 * type; the gallery imports it, so there is exactly one implementation and no
 * chance of the shipped beat drifting from the one that was signed off.
 *
 * Three non-obvious things, each of which was a bug first and is covered by
 * `docs/kanji-switchover-design-2026-07-28.md` §6h:
 *
 *  - Wipes are LINEAR. `EASE` is 92% complete at 40% of its duration, which made
 *    the erase blink out and leave the stage empty.
 *  - The base glyphs never move. ともだち is WIDER than 友達, so ruby layout
 *    stretches the base by 37px once furigana exists; the real ruby is therefore
 *    mounted before anything animates, and sliding decoys land on positions read
 *    out of it.
 *  - The word row is bottom-anchored, so the one-time font-load reflow of the
 *    <rt> grows upward into reserved space instead of shoving the base down.
 */

export type RevealWord = {
  kana: string;
  kanji: string;
  gloss: string;
  /** Per-character sense. `null` where no honest standalone gloss exists. */
  parts: { glyph: string; sense: string | null }[];
};

export type RevealProps = {
  word: RevealWord;
  replayKey: number;
  /** Fires when the sequence finishes — the gate for the Continue button. */
  onDone?: () => void;
};

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Wipes and erases use LINEAR, never `EASE`.
 *
 * `EASE` is a strong ease-out — correct for something that flies in and settles,
 * and wrong for a clip-path wipe: it is 67% complete at 20% of its duration and
 * 92% at 40%, so an "erase" reads as the text blinking out and then the stage
 * sitting empty for the rest of the phase. A wipe has to look like one steady
 * hand crossing the word, which is exactly linear. (Measured, after the sequence
 * showed a dead frame in capture.)
 */
const WIPE_EASE = "linear";

function Stage({ children, height = 210 }: { children: ReactNode; height?: number }) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ height }}
    >
      {children}
    </div>
  );
}

function Gloss({ text, delayMs }: { text: string; delayMs: number }) {
  return (
    <p
      data-krv
      className="text-sm text-text-secondary"
      style={{ animation: `krv-fade-up 320ms ${EASE} ${delayMs}ms both` }}
    >
      {text}
    </p>
  );
}

/**
 * Measures where each BASE glyph sits inside a mounted ruby, in coordinates
 * relative to the wrapper.
 *
 * This exists because of a measured fact about production rendering: ともだち
 * (4 kana at 0.65em) is WIDER than 友達 (2 kanji), and ruby layout stretches the
 * base to match its annotation — **37.1px of forced spread** at 60px type. That
 * spread is permanent; it is simply how the word looks once it has furigana. So
 * a reveal must not show the kanji at their natural spacing and then let the ruby
 * yank them apart when the reading appears, which is precisely the jump Spencer
 * reported.
 *
 * Reading the positions out of the real ruby, rather than computing them, means
 * the sliding glyphs land pixel-exact on where the production renderer puts them
 * — for any word, any font, any future change to `.kana-helper`'s size.
 */
function useBaseGlyphBoxes(
  hostRef: React.RefObject<HTMLElement | null>,
  active: boolean,
  key: string,
): { left: number; width: number }[] | null {
  const [boxes, setBoxes] = useState<{ left: number; width: number }[] | null>(null);
  useLayoutEffect(() => {
    if (!active) {
      setBoxes(null);
      return;
    }
    const host = hostRef.current;
    const ruby = host?.querySelector("ruby");
    if (!host || !ruby) return;
    const origin = host.getBoundingClientRect();
    const found: { left: number; width: number }[] = [];
    const walker = document.createTreeWalker(ruby, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      // Skip the annotation — only the baseline glyphs are being slid.
      if (node.parentElement?.tagName === "RT") continue;
      const text = node.textContent ?? "";
      for (let i = 0; i < text.length; i++) {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getBoundingClientRect();
        if (r.width > 0) found.push({ left: r.left - origin.left, width: r.width });
      }
    }
    if (found.length > 0) setBoxes(found);
  }, [hostRef, active, key]);
  return boxes;
}

export function RevealChoreo({ word, replayKey, onDone }: RevealProps) {
  useRevealKeyframes();
  // Beat 2 is shorter than the 600ms erase it triggers, so the kanji are already
  // arriving while the last of the kana is still being wiped. Butted end to end
  // the stage went completely empty for a beat, which reads as a broken render
  // rather than a hand-off. (Found by frame capture.)
  const { phase } = useRevealPhase([560, 380, 900, 620, 260], replayKey, onDone);
  const settled = phase >= 4;
  const sliding = phase === 2;

  const rubyHost = useRef<HTMLSpanElement | null>(null);
  const glyphBoxes = useBaseGlyphBoxes(
    rubyHost,
    phase >= 2,
    `${word.kanji}-${replayKey}`,
  );
  const chars = [...word.kanji];

  return (
    <div className="space-y-2 text-center">
      <Stage height={210}>
        {/* `w-full` on the column, not just the rows: a shrink-to-fit column
            takes its width from its widest child, so the rows' own `w-full`
            resolved against a box that changed width when the sense line
            mounted and unmounted — which pushed the word off centre. */}
        <div className="flex w-full flex-col items-center">
          {/* The word row is BOTTOM-anchored, not vertically centred. Centring
              means any change in the ruby's height moves the base glyphs by half
              of it — and the ruby DOES change height once, on the very first run,
              when the JA font finishes loading and the <rt> metrics settle
              (measured: h 71→87, base jumped 12px). Anchoring the base to a fixed
              bottom edge makes the rt grow upward into reserved space instead, so
              the font-load reflow is invisible. Verified: baseline bottom is
              constant across the whole sequence on a warm run, and moves 4px
              instead of 12px on a cold one. */}
          <div className="relative w-full" style={{ height: 132 }}>
            {/* The kana on the baseline, erased away. Stays mounted into the
                slide so the wipe can finish underneath the arriving kanji. */}
            {phase < 3 && (
              <span
                data-krv
                className="absolute inset-x-0 block text-center text-5xl tracking-wide"
                style={{
                  bottom: 12,
                  // Positioned children have to declare nowrap: `absolute`
                  // inside a shrink-to-fit column resolved against a ~0-width
                  // parent and wrapped ともだち one character per line.
                  whiteSpace: "nowrap",
                  animation:
                    phase >= 1
                      ? `krv-erase 600ms ${WIPE_EASE} both`
                      : `krv-fade-in 280ms ${EASE} both`,
                }}
              >
                {word.kana}
              </span>
            )}

            {/* ONE DOM state from the slide onward: the real `AnnotatedText`
                ruby, mounted at phase 2 and never swapped. It is transparent
                while the decoy glyphs slide, then simply becomes visible — so the
                geometry the learner ends on was already established before
                anything moved. `KanjiRuby` always emits the <rt> (zero-width
                space when hidden) so its box is identical either way, which is
                what makes this safe. */}
            <span
              ref={rubyHost}
              data-krv
              className="krv-choreo absolute inset-x-0 block text-center text-6xl leading-tight"
              data-paint={phase >= 3 ? "painting" : "pending"}
              style={{
                bottom: 12,
                whiteSpace: "nowrap",
                visibility: phase >= 2 ? "visible" : "hidden",
                // Hard cut, NOT a cross-fade. The decoys finish at exactly these
                // glyph positions at full opacity, so swapping in the same frame
                // is pixel-identical and therefore invisible. Fading the ruby up
                // from 0 instead left a 240ms window where the decoys were gone
                // and the ruby was still transparent — the kanji flashed out.
                // Keyed on `sliding` alone (not `glyphBoxes`) so the ruby cannot
                // flash at full opacity for the one frame before measurement.
                opacity: sliding ? 0 : 1,
              }}
            >
              <AnnotatedJa
                segments={[{ surface: word.kanji, reading: word.kana }]}
                forceShowHelper
              />
            </span>

            {/* The slide. Each glyph starts off to its own side and animates to
                `left` — the position the ruby above already reserved for it — so
                the hand-off to the real renderer moves nothing at all. */}
            {sliding &&
              glyphBoxes &&
              glyphBoxes.map((box, i) => {
                const fromLeft = i < glyphBoxes.length / 2;
                const dx = fromLeft ? -56 : 56;
                return (
                  <span
                    key={`slide-${i}`}
                    data-krv
                    className="absolute block text-6xl leading-tight"
                    style={{
                      bottom: 12,
                      left: box.left,
                      width: box.width,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      // Only transform+opacity move, so the slide composites off
                      // the main thread and cannot disturb the reserved layout.
                      ["--krv-dx" as string]: `${dx}px`,
                      animation: `krv-slide-home 620ms ${EASE} ${i * 70}ms both`,
                    }}
                  >
                    {chars[i] ?? ""}
                  </span>
                );
              })}
          </div>

          {/* Reserved whether or not the senses are showing. */}
          <div className="flex items-start justify-center" style={{ height: 20 }}>
            {sliding && (
              <span
                data-krv
                className="text-[11px] text-text-muted"
                style={{ animation: `krv-fade-in 280ms linear 300ms both` }}
              >
                {word.parts
                  .map((p) => (p.sense ? `${p.glyph} ${p.sense}` : `${p.glyph} —`))
                  .join("   ·   ")}
              </span>
            )}
          </div>
        </div>
      </Stage>
      {settled && <Gloss text={word.gloss} delayMs={60} />}

      {/*
        Scoped to this candidate. `krv-slide-home` is defined here rather than in
        the shared sheet because it reads a per-glyph `--krv-dx`.

        The paint is a clip on the <rt> ALONE, so the base glyphs are completely
        static while the red comes in. That ordering is the whole fix: the glyphs
        arrive and settle in phase 2, the furigana paints in phase 3, and the two
        never happen at the same time.
      */}
      <style>{`
        @keyframes krv-slide-home {
          from { transform: translateX(var(--krv-dx)); opacity: 0; }
          to   { transform: translateX(0);             opacity: 1; }
        }
        .krv-choreo[data-paint="pending"] rt.kana-helper { clip-path: inset(0 100% 0 0); }
        .krv-choreo[data-paint="painting"] rt.kana-helper {
          animation: krv-wipe 560ms ${WIPE_EASE} both;
        }
      `}</style>
    </div>
  );
}
