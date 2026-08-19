import { useEffect, useMemo, useState } from "react";
import type {
  TransferDiagramRow,
  TransferDiagramSpec,
} from "../../types";

/**
 * DEV · The interactive transfer scene.
 *
 * The static stacked rows (`TransferDiagram`) show all the verbs at once, which
 * is the right shape for a reference. This is the other shape: ONE scene the
 * learner operates.
 *
 * The controls are not chrome — they are the grammar. Choosing a transfer verb
 * in Japanese is a two-question decision tree:
 *
 *   1. which way did the thing go?   -> あげる  vs  {くれる, もらう}
 *   2. whose sentence is it?         -> くれる  vs  もらう
 *
 * So the page asks exactly those two questions and lets the answer redraw the
 * picture. Question 2 only appears when two verbs actually share a direction,
 * which is why かす/かりる renders with one control and the axis with two.
 */

const OUTLINE = "#1e293b";
/** Every particle, every row, one colour — so the grammar marker reads as a
 *  class of thing rather than as part of the word it clings to. */
const PARTICLE = "#e11d48";

const LEFT_X = 120;
const RIGHT_X = 480;
const MID_Y = 74;
/** Where the うち boundary sits. The pulse timing below is derived from it. */
const BOUNDARY_X = 210;
const TRAVEL_MS = 1500;

function Blob({
  cx,
  color,
  ghost,
}: {
  cx: number;
  color: string;
  ghost: boolean;
}) {
  return (
    <g opacity={ghost ? 0.32 : 1}>
      <ellipse
        cx={cx}
        cy={MID_Y}
        rx={32}
        ry={34}
        fill={ghost ? "none" : color}
        stroke={ghost ? "currentColor" : OUTLINE}
        strokeWidth={2.5}
        strokeDasharray={ghost ? "5 4" : undefined}
      />
      {!ghost && (
        <>
          <circle cx={cx - 10} cy={MID_Y - 7} r={3.4} fill={OUTLINE} />
          <circle cx={cx + 10} cy={MID_Y - 7} r={3.4} fill={OUTLINE} />
          <path
            d={`M ${cx - 9} ${MID_Y + 9} Q ${cx} ${MID_Y + 17} ${cx + 9} ${MID_Y + 9}`}
            fill="none"
            stroke={OUTLINE}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  );
}

/**
 * A generic parcel, never the named object.
 *
 * Deliberate: inv 30 (the m14 trap) means a `kind: rule` beat pins ahead of the
 * interleaved middle, so naming an imageable atom on a card can steal its
 * `word_image_mcq` debut. Drawing an unnamed parcel and putting the kana on the
 * arrow label sidesteps that entirely — the picture shows "a thing", the text
 * says which thing.
 */
function Parcel() {
  return (
    <g>
      <rect
        x={-13}
        y={-11}
        width={26}
        height={22}
        rx={3}
        fill="#fbbf24"
        stroke={OUTLINE}
        strokeWidth={2.5}
      />
      <rect x={-3} y={-11} width={6} height={22} fill="#ef4444" />
      <rect x={-13} y={-3} width={26} height={5} fill="#ef4444" />
    </g>
  );
}

export function TransferScene({
  spec,
  scopeId,
}: {
  spec: TransferDiagramSpec;
  /** Scopes the global @keyframes names — see the note in the <style>. */
  scopeId: string;
}) {
  const dirs = useMemo(
    () => Array.from(new Set(spec.rows.map((r) => r.from))),
    [spec],
  );
  const [dir, setDir] = useState<"left" | "right">(dirs[0]);
  const candidates = spec.rows.filter((r) => r.from === dir);
  const [subjIdx, setSubjIdx] = useState(0);
  const row: TransferDiagramRow = candidates[Math.min(subjIdx, candidates.length - 1)];
  // Re-mounting the animated group is what restarts the CSS animation; without
  // a changing key the object would only ever travel once.
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    setSubjIdx(0);
  }, [dir]);
  useEffect(() => {
    setRunKey((k) => k + 1);
  }, [dir, subjIdx, scopeId]);

  const goesRight = row.from === "left";
  const startX = goesRight ? 168 : 432;
  const endX = goesRight ? 432 : 168;
  const dx = endX - startX;
  // The pulse fires when the parcel actually reaches the boundary, so an
  // outgoing throw flashes early and an incoming one flashes late. Timing it
  // from the geometry rather than a guess is the whole point of the beat.
  const crossFrac = Math.min(
    0.95,
    Math.max(0.05, (BOUNDARY_X - startX) / dx),
  );

  /** Unique per scene AND per replay: scopes the global @keyframes names. */
  const uid = `${scopeId.replace(/[^a-z0-9]/gi, "")}-${runKey}`;

  const leftGhost = row.hidden === "left";
  const rightGhost = row.hidden === "right";

  return (
    <div className="rounded-2xl border border-border bg-surface p-2.5">
      <svg viewBox="0 0 600 178" className="w-full text-text-primary">
        {/* Keyframe names MUST be namespaced per scene. Several scenes render
            on one page and `@keyframes` is a GLOBAL name — a shared name means
            the last-mounted scene's travel distance silently wins for all of
            them, which sends the parcel the wrong way. */}
        <style>{`
          @keyframes tdTravel-${uid} {
            from { transform: translateX(0px); }
            to   { transform: translateX(${dx}px); }
          }
          @keyframes tdPulse-${uid} {
            0%, 100% { stroke-opacity: .45; }
            50%      { stroke-opacity: 1; }
          }
          .td-parcel-${uid} {
            animation: tdTravel-${uid} ${TRAVEL_MS}ms cubic-bezier(.45,.05,.3,1) forwards;
          }
          .td-bound-${uid} {
            animation: tdPulse-${uid} 520ms ease-in-out ${Math.round(TRAVEL_MS * crossFrac) - 180}ms 1;
          }
          @media (prefers-reduced-motion: reduce) {
            .td-parcel-${uid} { animation: none; transform: translateX(${dx}px); }
            .td-bound-${uid}  { animation: none; }
          }
        `}</style>
        <defs>
          <marker
            id={`sc-arrow-${uid}`}
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={6}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* うち as a GROUND, washed in the learner's own colour — "my group"
            rendered as literally my colour. そと is the page itself. */}
        <rect
          x={10}
          y={10}
          width={200}
          height={158}
          rx={20}
          fill={spec.left.color}
          opacity={0.1}
        />
        <rect
          key={`b${runKey}`}
          className={`td-bound-${uid}`}
          x={10}
          y={10}
          width={200}
          height={158}
          rx={20}
          fill="none"
          stroke={spec.left.color}
          strokeWidth={2.5}
          strokeOpacity={0.45}
        />
        <text
          x={26}
          y={32}
          className="text-[12px] font-bold"
          fill={spec.left.color}
        >
          {spec.insideLabel}
        </text>
        <text
          x={578}
          y={32}
          textAnchor="end"
          className="fill-current text-[12px] font-bold"
          opacity={0.4}
        >
          {spec.outsideLabel}
        </text>

        {/* the ring says who the sentence is ABOUT — the only thing separating
            くれる from もらう, which share an arrow */}
        <circle
          cx={row.subject === "left" ? LEFT_X : RIGHT_X}
          cy={MID_Y}
          r={44}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          opacity={0.85}
        />

        <Blob cx={LEFT_X} color={spec.left.color} ghost={leftGhost} />
        <Blob cx={RIGHT_X} color={spec.right.color} ghost={rightGhost} />

        <line
          x1={startX}
          y1={MID_Y}
          x2={endX}
          y2={MID_Y}
          stroke="currentColor"
          strokeWidth={2.5}
          opacity={0.35}
          markerEnd={`url(#sc-arrow-${uid})`}
        />

        <g key={`p${runKey}`} transform={`translate(${startX}, ${MID_Y})`}>
          <g className={`td-parcel-${uid}`}>
            <Parcel />
          </g>
        </g>

        <text
          x={300}
          y={MID_Y - 28}
          textAnchor="middle"
          className="fill-current text-[13px] font-semibold"
        >
          {spec.object.label}
          <tspan fill={PARTICLE}>{spec.object.particle}</tspan>
        </text>
        <text
          x={300}
          y={MID_Y + 40}
          textAnchor="middle"
          className="fill-current text-[24px] font-bold"
        >
          {row.verb}
        </text>

        {[
          {
            cx: LEFT_X,
            party: spec.left,
            particle: row.leftParticle,
            ghost: leftGhost,
            subject: row.subject === "left",
          },
          {
            cx: RIGHT_X,
            party: spec.right,
            particle: row.rightParticle,
            ghost: rightGhost,
            subject: row.subject === "right",
          },
        ].map((n) => (
          <g key={n.party.label} opacity={n.ghost ? 0.5 : 1}>
            <text
              x={n.cx}
              y={158}
              textAnchor="middle"
              className="fill-current text-[16px] font-bold"
            >
              {n.party.label}
              {n.particle ? <tspan fill={PARTICLE}>{n.particle}</tspan> : null}
            </text>
            <text
              x={n.cx}
              y={178}
              textAnchor="middle"
              className="fill-current text-[10px] font-semibold uppercase"
              style={{ letterSpacing: "0.08em" }}
              opacity={0.55}
            >
              {n.ghost
                ? "dropped"
                : n.subject
                  ? "the subject"
                  : n.party.gloss}
            </text>
          </g>
        ))}
      </svg>

      {/* The two questions. Not chrome — this IS the decision the grammar asks.
          Both questions and Replay share ONE wrapping row: on a laptop the
          card has to clear the Continue button without scrolling, and a
          dedicated row per control was costing ~34px each for no clarity. */}
      <div className="mt-1.5 border-t border-border pt-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="sr-only">Which way did it go?</legend>
            <span className="text-xs font-semibold text-text-muted">
              Which way did it go?
            </span>
            {dirs.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === dir}
                onClick={() => setDir(d)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  d === dir
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-text-secondary hover:border-accent"
                }`}
              >
                {d === "left"
                  ? `out of ${spec.insideLabel} →`
                  : `← into ${spec.insideLabel}`}
              </button>
            ))}
          </fieldset>

          {candidates.length > 1 && (
            <fieldset className="flex flex-wrap items-center gap-1.5">
              <legend className="sr-only">Whose sentence is it?</legend>
              <span className="text-xs font-semibold text-text-muted">
                Whose sentence?
              </span>
              {candidates.map((c, i) => (
                <button
                  key={c.verb}
                  type="button"
                  aria-pressed={i === subjIdx}
                  onClick={() => setSubjIdx(i)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    i === subjIdx
                      ? "bg-accent text-accent-foreground"
                      : "border border-border text-text-secondary hover:border-accent"
                  }`}
                >
                  {c.subject === "left" ? spec.left.label : spec.right.label}
                </button>
              ))}
            </fieldset>
          )}

          <button
            type="button"
            onClick={() => setRunKey((k) => k + 1)}
            aria-label="Replay the movement"
            className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition hover:border-accent"
          >
            ⟲ Replay
          </button>
        </div>

        <p className="m-0 mt-1.5 text-xs leading-snug text-text-secondary">
          {row.note}
        </p>
      </div>
    </div>
  );
}
