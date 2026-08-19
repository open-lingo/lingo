import { useState } from "react";
import { OUTLINE, PARTICLE, SceneChips } from "./sceneArt";

/**
 * The scale scene — comparison as a ranked axis.
 *
 * ~5 points want this picture (`yori-comparison` in m20/m26/m28,
 * `ichiban-superlative` in m26, `hou-ga-ii` in m28), and they are the same
 * axis read three ways: より names ONE step on it, いちばん names the top of
 * it, ほうがいい points at the side you should take.
 *
 * The thing prose keeps failing to convey is that 「A は B より たかい」 puts
 * B in the *comparison* slot, not the subject slot — the sentence is about A.
 * On an axis that is a position, so the frame highlights A and dims B rather
 * than asserting the difference in a clause.
 */

import type { ScaleFrame, ScaleItem, ScaleSpec } from "@/features/lesson/types";

export type { ScaleFrame, ScaleItem, ScaleSpec };

const LEFT = 96;
const RIGHT = 504;
const AXIS_Y = 142;
/** Rank is drawn as SIZE. Smallest and largest rendered art. */
const ART_MIN = 34;
const ART_MAX = 82;
/** Under `rankAs: "count"` every item renders at one size and the glyph stack
 *  above it carries the rank instead. */
const ART_FIXED = 42;
const GLYPH_STEP = 14;

export function ScaleScene({
  spec,
  scopeId,
}: {
  spec: ScaleSpec;
  scopeId: string;
}) {
  const [frameId, setFrameId] = useState(spec.frames[0].id);
  const frame = spec.frames.find((f) => f.id === frameId) ?? spec.frames[0];
  const n = spec.items.length;
  const xOf = (i: number) => LEFT + (i * (RIGHT - LEFT)) / Math.max(1, n - 1);
  const involved = (id: string) =>
    frame.against === undefined || id === frame.subject || id === frame.against;

  return (
    <div className="w-full text-text-primary">
      <svg
        viewBox="0 0 600 216"
        className="w-full"
        role="img"
        aria-label={`${spec.dimension} scale: ${spec.items.map((i) => i.label).join(", ")}`}
      >
        <text
          x={300}
          y={20}
          textAnchor="middle"
          fontSize={13}
          fontWeight={700}
          fill="currentColor"
          opacity={0.55}
          letterSpacing="0.08em"
        >
          ← {spec.dimension.toUpperCase()} →
        </text>

        <line
          x1={LEFT - 26}
          y1={AXIS_Y}
          x2={RIGHT + 26}
          y2={AXIS_Y}
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.5}
        />
        <path
          d={`M ${RIGHT + 18} ${AXIS_Y - 8} L ${RIGHT + 32} ${AXIS_Y} L ${RIGHT + 18} ${AXIS_Y + 8} Z`}
          fill={OUTLINE}
          opacity={0.5}
        />

        {spec.items.map((it, i) => {
          const on = involved(it.id);
          const isSubject = it.id === frame.subject;
          /* Rank is SIZE. Spencer 2026-08-18: *"I think the boxes should
             probably be replaced with the images themselves."* A coloured
             rectangle asks the learner to decode a legend before they can read
             the axis; a cat, a dog and an elephant do not. It also makes the
             picture literally true for おおきい and おもい, which is where this
             scene will get most of its use. */
          const counting = spec.rankAs === "count" && !!spec.rankGlyph;
          const size = counting
            ? ART_FIXED
            : ART_MIN + (i * (ART_MAX - ART_MIN)) / Math.max(1, n - 1);
          const x = xOf(i);
          /* Total drawn height, so the highlight box and the ABOUT THIS marker
             sit above whichever encoding is in play. */
          const stack = counting ? 8 + (i + 1) * GLYPH_STEP : 0;
          const top = AXIS_Y - size - stack;
          return (
            <g key={it.id} opacity={on ? 1 : 0.28}>
              {isSubject && (
                <rect
                  x={x - size / 2 - 7}
                  y={top - 7}
                  width={size + 14}
                  height={size + stack + 12}
                  rx={11}
                  fill="none"
                  stroke={PARTICLE}
                  strokeWidth={3}
                />
              )}
              {it.artUrl ? (
                <image
                  href={it.artUrl}
                  x={x - size / 2}
                  y={AXIS_Y - size}
                  width={size}
                  height={size}
                  preserveAspectRatio="xMidYMax meet"
                />
              ) : (
                <rect
                  x={x - size / 2}
                  y={AXIS_Y - size}
                  width={size}
                  height={size}
                  rx={5}
                  fill={it.color}
                  stroke={OUTLINE}
                  strokeWidth={2.5}
                />
              )}
              {counting &&
                Array.from({ length: i + 1 }, (_, k) => (
                  <text
                    key={k}
                    x={x}
                    y={AXIS_Y - size - 10 - k * GLYPH_STEP}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={800}
                    fill={it.color}
                  >
                    {spec.rankGlyph}
                  </text>
                ))}
              <text
                x={x}
                y={AXIS_Y + 26}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fill="currentColor"
              >
                {it.label}
              </text>
              {isSubject && (
                <text
                  x={x}
                  y={top - 15}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fill={PARTICLE}
                  letterSpacing="0.06em"
                >
                  ABOUT THIS
                </text>
              )}
            </g>
          );
        })}

        <text
          x={300}
          y={204}
          textAnchor="middle"
          fontSize={21}
          fontWeight={700}
          fill={PARTICLE}
          key={`${scopeId}-${frameId}`}
        >
          {frame.ja}
        </text>
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SceneChips
          legend="Which pattern?"
          items={spec.frames.map((f) => ({ id: f.id, label: f.pattern }))}
          value={frameId}
          onChange={setFrameId}
        />
      </div>
      <p className="m-0 mt-1.5 text-xs leading-snug text-text-secondary">
        {frame.note}
      </p>
    </div>
  );
}
