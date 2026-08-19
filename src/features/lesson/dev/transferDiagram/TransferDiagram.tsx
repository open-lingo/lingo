import type {
  TransferDiagramParty,
  TransferDiagramRow,
} from "../../types";
import type { DevTransferSpec } from "./transferSpec";

/**
 * DEV · The transfer diagram renderer.
 *
 * House style is taken from the nine hand-authored files in
 * `src/pub/lingo-art/svg/` (see `shared/assets/notoEmoji.ts`): 2.5px #1e293b
 * outline, flat saturated fill, rounded geometry, no gradients. Those ship at
 * ~1 KB each; this whole diagram is geometry too, so it costs bytes of markup
 * rather than a raster download.
 *
 * Structural strokes (arrow, boundary, labels) use `currentColor` and theme
 * tokens so the picture inverts with the app theme. Only the character fills
 * are fixed, because they are the identity of the party — ともだち has to be
 * the same teal in every row or the reader loses the thread.
 */

const OUTLINE = "#1e293b";

/**
 * A party. Deliberately a featureless blob: no hair, no clothing, no build.
 *
 * This is what lets あに / あね / ちち / はは appear at all. The 2026-05-18
 * audit blocked them from `word_image_mcq` because a drawn PERSON reads as a
 * generic person — "age cue carried by kanji, not face". A blob makes no claim
 * about age, gender or ethnicity, so the label and the うち boundary carry the
 * whole meaning and nothing in the art contradicts them.
 */
function Blob({
  cx,
  cy,
  color,
  ghost = false,
}: {
  cx: number;
  cy: number;
  color: string;
  ghost?: boolean;
}) {
  return (
    <g opacity={ghost ? 0.3 : 1}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={30}
        ry={34}
        fill={ghost ? "none" : color}
        // A ghost is structural — it marks an ABSENCE, not a character — so it
        // follows the theme. The fixed #1e293b house outline is invisible on a
        // dark background when there is no bright fill behind it to carry it.
        stroke={ghost ? "currentColor" : OUTLINE}
        strokeWidth={2.5}
        strokeDasharray={ghost ? "5 4" : undefined}
      />
      {/* eyes + smile only when present — a ghost has no face to read */}
      {!ghost && (
        <>
          <circle cx={cx - 10} cy={cy - 6} r={3.2} fill={OUTLINE} />
          <circle cx={cx + 10} cy={cy - 6} r={3.2} fill={OUTLINE} />
          <path
            d={`M ${cx - 8} ${cy + 8} Q ${cx} ${cy + 15} ${cx + 8} ${cy + 8}`}
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

/** Node label + its particle for this row, stacked under the blob. */
function NodeLabel({
  cx,
  party,
  particle,
  isSubject,
  hidden,
}: {
  cx: number;
  party: TransferDiagramParty;
  particle: string | undefined;
  isSubject: boolean;
  hidden: boolean;
}) {
  return (
    <>
      <text
        x={cx}
        y={142}
        textAnchor="middle"
        className="fill-current text-[15px] font-bold"
        opacity={hidden ? 0.4 : 1}
      >
        {party.label}
        {particle ? (
          <tspan className="fill-current" opacity={0.95}>
            {particle}
          </tspan>
        ) : null}
      </text>
      <text
        x={cx}
        y={160}
        textAnchor="middle"
        className="fill-current text-[10px]"
        opacity={hidden ? 0.35 : 0.55}
      >
        {hidden ? "dropped — the verb said it" : isSubject ? "the subject" : party.gloss}
      </text>
    </>
  );
}

const LEFT_X = 120;
const RIGHT_X = 480;
const MID_Y = 78;

/** One verb = one arrow over a fixed cast. */
function Row({ spec, row }: { spec: DevTransferSpec; row: TransferDiagramRow }) {
  const uid = `${spec.id}-${row.verb}`;
  const leftHidden = row.hidden === "left";
  const rightHidden = row.hidden === "right";
  // The arrow always spans the same gap; only its direction flips. Keeping the
  // geometry identical across rows is the whole point — the reader compares
  // one moving part, not two.
  const goesRight = row.from === "left";
  const x1 = goesRight ? 172 : 428;
  const x2 = goesRight ? 428 : 172;

  return (
    <svg
      viewBox="0 0 600 190"
      className="w-full text-text-primary"
      role="img"
      aria-label={`${row.verb}: ${spec.object.label} moves from ${
        row.from === "left" ? spec.left.label : spec.right.label
      } to ${row.from === "left" ? spec.right.label : spec.left.label}`}
    >
      <defs>
        <marker
          id={`arrow-${uid}`}
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

      {/* うち boundary — fixed around the inside party, never moves between
          rows. The circle is the constant; the arrow is the variable. */}
      {spec.left.inside && (
        <>
          <rect
            x={8}
            y={12}
            width={196}
            height={166}
            rx={18}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="7 6"
            opacity={0.4}
          />
          <text
            x={22}
            y={32}
            className="fill-current text-[12px] font-bold"
            opacity={0.55}
          >
            うち
          </text>
        </>
      )}
      <text
        x={584}
        y={32}
        textAnchor="end"
        className="fill-current text-[12px] font-bold"
        opacity={0.55}
      >
        そと
      </text>

      {/* subject ring — the ONLY difference between くれる and もらう */}
      <circle
        cx={row.subject === "left" ? LEFT_X : RIGHT_X}
        cy={MID_Y}
        r={40}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        opacity={0.9}
      />

      <Blob cx={LEFT_X} cy={MID_Y} color={spec.left.color} ghost={leftHidden} />
      <Blob cx={RIGHT_X} cy={MID_Y} color={spec.right.color} ghost={rightHidden} />

      <line
        x1={x1}
        y1={MID_Y}
        x2={x2}
        y2={MID_Y}
        stroke="currentColor"
        strokeWidth={3}
        markerEnd={`url(#arrow-${uid})`}
      />

      {/* what moves, riding the arrow */}
      <text
        x={300}
        y={MID_Y - 14}
        textAnchor="middle"
        className="fill-current text-[13px] font-semibold"
      >
        {spec.object.label}
        {spec.object.particle}
      </text>
      {/* the verb, under the arrow it belongs to */}
      <text
        x={300}
        y={MID_Y + 32}
        textAnchor="middle"
        className="fill-current text-[18px] font-bold"
      >
        {row.verb}
      </text>

      <NodeLabel
        cx={LEFT_X}
        party={spec.left}
        particle={row.leftParticle}
        isSubject={row.subject === "left"}
        hidden={leftHidden}
      />
      <NodeLabel
        cx={RIGHT_X}
        party={spec.right}
        particle={row.rightParticle}
        isSubject={row.subject === "right"}
        hidden={rightHidden}
      />
    </svg>
  );
}

export function TransferDiagram({
  spec,
  showNotes = true,
}: {
  spec: DevTransferSpec;
  showNotes?: boolean;
}) {
  return (
    <div className="space-y-1">
      {spec.rows.map((row) => (
        <div key={row.verb} className="rounded-lg border border-border p-2">
          <Row spec={spec} row={row} />
          {showNotes && (
            <p className="m-0 px-2 pb-1 text-xs text-text-secondary">
              {row.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
