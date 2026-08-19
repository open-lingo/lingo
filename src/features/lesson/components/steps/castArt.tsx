import { OUTLINE } from "./sceneArt";

/**
 * THE CAST — the course's recurring people, drawn.
 *
 * Spencer 2026-08-18: *"the politeness register is good, I think we DO want
 * images we preload of who each person is … we can also replace them with
 * emojis or something so ambiguous blobs arent the only thing."*
 *
 * The blob was deliberately faceless for a reason that still holds elsewhere —
 * a labelled node in a transfer diagram must NOT look like a portrait, because
 * a face cannot carry 「あに」 (2026-05-18 blocklist audit). But the register
 * cast is the opposite case: the whole content of the lesson is WHO you are
 * talking to, so an ambiguous circle is withholding the one thing that matters.
 *
 * Three deliberate choices:
 *
 *   1. **The bow hinges at the WAIST, not the centre of mass.** The previous
 *      version rotated a near-circle, which is invisible — every politeness
 *      level rendered identically. Legs stay planted, the torso and head swing
 *      forward, and the head visibly travels: 24px down and 46px across
 *      between level 1 and level 3. That reads as a bow with nothing labelled.
 *   2. **Ground-anchored props stay on the ground.** おばあさん's cane is drawn
 *      OUTSIDE the rotating group — a cane that swings with the torso stops
 *      being a cane.
 *   3. **Role is carried by silhouette, not by face.** Cap, side part, bun,
 *      apron. Faces are the same three marks on everyone, so the learner reads
 *      the ROLE — which is the register cue — rather than a person.
 *
 * Every figure is drawn in local coordinates with the FEET at the origin and
 * the head top at y ≈ -71, so a caller only has to place the feet.
 */

import type { CastRole } from "@/features/lesson/types";
export type { CastRole };

/** Where the torso pivots. */
const HINGE_Y = -30;
/** Head centre, measured from the hinge. */
const HEAD_Y = -56;
const HEAD_R = 15;

/** Level 1 stands straight; level 3 bows to 55°. */
export function bowDegrees(politeness: 1 | 2 | 3): number {
  return ((politeness - 1) / 2) * 55;
}

function Face() {
  return (
    <g>
      <circle cx={-5} cy={HEAD_Y - 2} r={1.9} fill={OUTLINE} />
      <circle cx={5} cy={HEAD_Y - 2} r={1.9} fill={OUTLINE} />
      <path
        d={`M -4.5 ${HEAD_Y + 5} Q 0 ${HEAD_Y + 9} 4.5 ${HEAD_Y + 5}`}
        fill="none"
        stroke={OUTLINE}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Hair + headwear. The single strongest role cue at this size. */
function Hair({ role, color }: { role: CastRole; color: string }) {
  if (role === "friend") {
    // Baseball cap — reads "casual" instantly, and casual IS the register.
    return (
      <g>
        <path
          d={`M ${-HEAD_R - 1} ${HEAD_Y - 3} A ${HEAD_R + 1} ${HEAD_R + 1} 0 0 1 ${HEAD_R + 1} ${HEAD_Y - 3} Z`}
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <path
          d={`M 2 ${HEAD_Y - 3} q 16 0 17 5 q -9 3 -17 1 Z`}
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  if (role === "grandmother") {
    // Bun. The one silhouette that carries age without drawing wrinkles.
    return (
      <g>
        <circle
          cx={0}
          cy={HEAD_Y - HEAD_R - 4}
          r={7}
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.2}
        />
        <path
          d={`M ${-HEAD_R} ${HEAD_Y - 4} A ${HEAD_R} ${HEAD_R} 0 0 1 ${HEAD_R} ${HEAD_Y - 4} Z`}
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
      </g>
    );
  }
  // Teacher and clerk share a neat side part — the "at work" silhouette.
  return (
    <path
      d={`M ${-HEAD_R} ${HEAD_Y - 3}
          A ${HEAD_R} ${HEAD_R} 0 0 1 ${HEAD_R} ${HEAD_Y - 3}
          L ${HEAD_R - 3} ${HEAD_Y - 7}
          Q ${-2} ${HEAD_Y - 2} ${-HEAD_R} ${HEAD_Y - 3} Z`}
      fill={color}
      stroke={OUTLINE}
      strokeWidth={2.2}
      strokeLinejoin="round"
    />
  );
}

/** Props that ride with the upper body. */
function CarriedProp({ role }: { role: CastRole }) {
  if (role === "teacher") {
    return (
      <g>
        {/* Glasses */}
        <g stroke={OUTLINE} strokeWidth={1.9} fill="none">
          <circle cx={-5.5} cy={HEAD_Y - 2} r={5} />
          <circle cx={5.5} cy={HEAD_Y - 2} r={5} />
          <line x1={-0.5} y1={HEAD_Y - 2} x2={0.5} y2={HEAD_Y - 2} />
        </g>
        {/* A book, held. Marks the teacher as the one who is teaching, which
            is exactly why the learner owes them です・ます. */}
        <rect
          x={6}
          y={-24}
          width={17}
          height={13}
          rx={1.5}
          fill="#fff"
          stroke={OUTLINE}
          strokeWidth={2}
        />
        <line
          x1={14.5}
          y1={-24}
          x2={14.5}
          y2={-11}
          stroke={OUTLINE}
          strokeWidth={1.6}
        />
      </g>
    );
  }
  if (role === "grandmother") {
    return (
      <g stroke={OUTLINE} strokeWidth={1.9} fill="none">
        <circle cx={-5.5} cy={HEAD_Y - 2} r={4.6} />
        <circle cx={5.5} cy={HEAD_Y - 2} r={4.6} />
        <line x1={-0.9} y1={HEAD_Y - 2} x2={0.9} y2={HEAD_Y - 2} />
      </g>
    );
  }
  if (role === "clerk") {
    return (
      <g>
        {/* Apron over the torso — the uniform is the role. */}
        <path
          d="M -11 -28 L 11 -28 L 13 -1 L -13 -1 Z"
          fill="#fff"
          stroke={OUTLINE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <rect
          x={-6}
          y={-24}
          width={12}
          height={7}
          rx={1.5}
          fill="#fff"
          stroke={OUTLINE}
          strokeWidth={1.8}
        />
      </g>
    );
  }
  return null;
}

export function CastFigure({
  role,
  color,
  politeness,
  dimmed = false,
}: {
  role: CastRole;
  color: string;
  politeness: 1 | 2 | 3;
  dimmed?: boolean;
}) {
  const deg = bowDegrees(politeness);
  return (
    <g opacity={dimmed ? 0.34 : 1}>
      {/* Legs — planted. They are what makes the torso's swing read as a bow
          rather than as the whole figure toppling. */}
      <path
        d={`M -14 0 L -11 ${HINGE_Y} L 11 ${HINGE_Y} L 14 0 Z`}
        fill={color}
        stroke={OUTLINE}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* おばあさん's cane is ground furniture, not carried kit — it must not
          rotate with her. */}
      {role === "grandmother" && (
        <path
          d="M 21 -34 q 7 0 7 6 L 28 0"
          fill="none"
          stroke={OUTLINE}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}

      <g
        transform={`translate(0 ${HINGE_Y}) rotate(${deg})`}
        style={{ transition: "transform 480ms cubic-bezier(.34,1.25,.64,1)" }}
      >
        {/* Arms first so the torso covers the shoulder joint. */}
        <path
          d="M -15 -26 q -6 12 -4 24"
          fill="none"
          stroke={color}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
        <path
          d="M 15 -26 q 6 12 4 24"
          fill="none"
          stroke={color}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
        <path
          d="M -17 0 L -14 -34 Q 0 -41 14 -34 L 17 0 Z"
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <circle
          cx={0}
          cy={HEAD_Y}
          r={HEAD_R}
          fill={color}
          stroke={OUTLINE}
          strokeWidth={2.5}
        />
        <Face />
        <Hair role={role} color={color} />
        <CarriedProp role={role} />
      </g>
    </g>
  );
}
