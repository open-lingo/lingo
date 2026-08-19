import { useState } from "react";
import { OUTLINE, PARTICLE, SceneChips } from "./sceneArt";

/**
 * The order scene — **said order vs clock order.**
 *
 * ~9 grammar points across m14/m15/m19/m23/m30 (まえに, てから, とき, あとで,
 * た-form subordination, から…まで) are one fact: Japanese decides with a
 * connective whether the sentence runs forward or backward through time, and
 * the learner's whole difficulty is that the FIRST clause they hear is often
 * the SECOND thing that happens.
 *
 * REBUILT 2026-08-18. Spencer, on the first version: *"the timeline is kind
 * of confusing to me, the intersect doesnt mean much … I eat rice and before
 * sleep intersecting doesnt make sense to me."* He is right twice over.
 *
 *   1. **The crossing lines were an abstraction that had to be taught first.**
 *      Two beziers meeting in the middle only means "out of order" if someone
 *      tells you so; until then it is decoration. This version deletes the
 *      connectors and numbers the moments instead. ① and ② need no key —
 *      every learner can already read 2-then-1 as out of order, and the badge
 *      on the clause is literally the same badge as the one on the clock.
 *   2. **The example was bad.** 「ねる まえに ごはんを たべる」 is a strange
 *      thing to say. Both sentences here are lifted VERBATIM from m15's own
 *      authored beats (L9 まえに / L10 てから) and they share the same two
 *      events, so the connective is the only thing that varies.
 *
 * The two rows are deliberately different media: the said row is HTML so long
 * clauses wrap on a phone instead of overflowing a fixed viewBox, and the
 * clock row is SVG because it needs real geometry.
 */

export type TimelineMoment = {
  /** What happens at this point on the clock. */
  label: string;
  /** Wall-clock stamp. Grounds the axis in something concrete — the previous
   *  version's axis was an unlabelled arrow, which is a diagram of nothing. */
  clock: string;
  color: string;
};

export type TimelineFrame = {
  id: string;
  /** Chip label — the connective itself. */
  connective: string;
  /** Clause said FIRST in the sentence, and which moment it names. */
  first: { text: string; at: "early" | "late" };
  /** Clause said SECOND. */
  second: { text: string; at: "early" | "late" };
  /** English of the WHOLE sentence. Spencer 2026-08-18: *"needs space for
   *  sentence translation to be included so they can see it."* Without it the
   *  learner is decoding two clauses AND an ordering rule at once; the gloss
   *  removes the first job so the picture only has to teach the second. */
  en: string;
  /** Re-label the clock when this connective's example needs its own events.
   *  Only とき-style same-moment frames have needed it so far. */
  moments?: { early: TimelineMoment; late: TimelineMoment };
  note: string;
};

export type TimelineSpec = {
  early: TimelineMoment;
  late: TimelineMoment;
  frames: TimelineFrame[];
};

const AXIS_Y = 52;

function Clause({
  n,
  text,
  color,
}: {
  n: number;
  text: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-2xl border-[2.5px] px-3 py-1.5 text-base font-bold sm:text-lg"
      style={{ borderColor: color }}
    >
      <span
        aria-hidden
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold text-white"
        style={{ background: color }}
      >
        {n}
      </span>
      {text}
    </span>
  );
}

export function TimelineScene({
  spec,
  scopeId,
}: {
  spec: TimelineSpec;
  scopeId: string;
}) {
  const [frameId, setFrameId] = useState(spec.frames[0].id);
  const frame = spec.frames.find((f) => f.id === frameId) ?? spec.frames[0];

  const moments = frame.moments ?? { early: spec.early, late: spec.late };
  /** The badge number IS the clock order — that is the whole mechanism. */
  const numOf = (at: "early" | "late") => (at === "early" ? 1 : 2);
  const momentOf = (at: "early" | "late") => moments[at];

  const said = [numOf(frame.first.at), numOf(frame.second.at)] as const;
  const sameMoment = said[0] === said[1];
  const reversed = !sameMoment && said[0] > said[1];

  /* A frame whose clauses land on one moment draws ONE node, centred. Dimming
     the unused node instead would leave an irrelevant event on screen. */
  const shown = sameMoment
    ? ([[frame.first.at, 300]] as const)
    : ([
        ["early", 180],
        ["late", 420],
      ] as const);

  return (
    <div className="w-full text-text-primary">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
        You say it like this
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Clause
          n={said[0]}
          text={frame.first.text}
          color={momentOf(frame.first.at).color}
        />
        <span aria-hidden className="text-lg font-bold text-text-muted">
          →
        </span>
        <Clause
          n={said[1]}
          text={frame.second.text}
          color={momentOf(frame.second.at).color}
        />
      </div>

      <p className="m-0 mt-1.5 text-sm italic leading-snug text-text-secondary">
        “{frame.en}”
      </p>

      <p
        key={`${scopeId}-${frameId}-verdict`}
        className="m-0 mt-1.5 text-sm font-bold"
        style={{ color: reversed ? PARTICLE : "inherit" }}
      >
        {sameMoment
          ? "Both clauses name the SAME moment — no order at all."
          : reversed
            ? "You say ② first. The sentence runs BACKWARD through the clock."
            : "You say ① first. The sentence runs FORWARD, same as the clock."}
      </p>

      <p className="m-0 mt-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
        It happens like this
      </p>
      <svg
        viewBox="0 0 600 108"
        className="mt-0.5 w-full"
        role="img"
        aria-label={`Clock order: ${shown
          .map(([at]) => momentOf(at).label)
          .join(", then ")}`}
      >
        <line
          x1={60}
          y1={AXIS_Y}
          x2={528}
          y2={AXIS_Y}
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.45}
        />
        <path
          d={`M 522 ${AXIS_Y - 8} L 538 ${AXIS_Y} L 522 ${AXIS_Y + 8} Z`}
          fill={OUTLINE}
          opacity={0.45}
        />
        <text
          x={538}
          y={AXIS_Y + 26}
          textAnchor="end"
          fontSize={11}
          fontWeight={700}
          fill="currentColor"
          opacity={0.5}
          letterSpacing="0.08em"
        >
          TIME
        </text>

        {shown.map(([at, x]) => {
          const m = momentOf(at);
          return (
            <g key={at}>
              <text
                x={x}
                y={AXIS_Y - 26}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="currentColor"
                opacity={0.6}
              >
                {m.clock}
              </text>
              <circle
                cx={x}
                cy={AXIS_Y}
                r={18}
                fill={m.color}
                stroke={OUTLINE}
                strokeWidth={2.5}
              />
              <text
                x={x}
                y={AXIS_Y}
                dy="0.36em"
                textAnchor="middle"
                fontSize={17}
                fontWeight={800}
                fill="#fff"
              >
                {numOf(at)}
              </text>
              <text
                x={x}
                y={AXIS_Y + 44}
                textAnchor="middle"
                fontSize={17}
                fontWeight={700}
                fill="currentColor"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SceneChips
          legend="Which connective?"
          items={spec.frames.map((f) => ({ id: f.id, label: f.connective }))}
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
