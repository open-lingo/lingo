import { useEffect, useMemo, useState } from "react";
import type { JourneyDiagramSlot, JourneyDiagramSpec } from "../../types";

/**
 * The interactive journey scene — sibling of `TransferScene`.
 *
 * A transfer moves an OBJECT between two people, and the question it answers
 * is "which way did it go?". A journey moves the SUBJECT along a path, and
 * the question is a different one: **which particle marks which role?** A
 * learner meeting 「くるまで えきに いく」 has to know that で names what you
 * travel BY and に names where you end UP — and prose can only assert that,
 * one sentence per role, in a paragraph the learner reads once.
 *
 * So the picture puts all the roles on one path at the positions they
 * describe, and the learner selects a role to see what it does. The controls
 * are the grammar again: the chips ARE the particle inventory of the module.
 *
 * The destination chip is the exception and carries a toggle, because に and
 * へ mark the same slot and differ only in feel. Two static rows would show a
 * difference that is not there; swapping one for the other IN PLACE shows the
 * one that is.
 */

const OUTLINE = "#1e293b";
/** Shared with TransferScene: one colour for every grammar marker, so a
 *  particle reads as a class of thing rather than part of its noun. */
const PARTICLE = "#e11d48";

const PATH_Y = 104;
const START_X = 86;
const END_X = 512;
/** The traveller stops SHORT of the arrowhead: the arrowhead is the
 *  destination, and a blob parked on top of it hides the thing it arrived at.
 *  (First render did exactly that — わたし covered えきに and the verb.) */
const TRAVEL_FROM = 120;
const TRAVEL_TO = 420;
/** Three bands, so nothing can collide: traveller + means ABOVE the path,
 *  the path itself, place labels BELOW it. */
const TRAVELLER_DY = -52;
const TRAVEL_MS = 1700;

type Role = "origin" | "means" | "limit" | "destination";

function Traveller({ color, label }: { color: string; label: string }) {
  return (
    <g>
      <ellipse
        cx={0}
        cy={0}
        rx={26}
        ry={28}
        fill={color}
        stroke={OUTLINE}
        strokeWidth={2.5}
      />
      <circle cx={-8} cy={-6} r={2.9} fill={OUTLINE} />
      <circle cx={8} cy={-6} r={2.9} fill={OUTLINE} />
      <path
        d="M -7 8 Q 0 15 7 8"
        fill="none"
        stroke={OUTLINE}
        strokeWidth={2.1}
        strokeLinecap="round"
      />
      <text
        x={0}
        y={-38}
        textAnchor="middle"
        fontSize={17}
        fontWeight={700}
        fill="currentColor"
      >
        {label}
      </text>
    </g>
  );
}

/** A place on the path: a post, its noun, and the particle that marks it. */
function Marker({
  x,
  slot,
  particle,
  active,
  post = true,
}: {
  x: number;
  slot: JourneyDiagramSlot;
  particle: string;
  active: boolean;
  /** The destination has no post — the arrowhead already is one. */
  post?: boolean;
}) {
  return (
    <g opacity={active ? 1 : 0.45}>
      {post && (
      <line
        x1={x}
        y1={PATH_Y - 16}
        x2={x}
        y2={PATH_Y + 16}
        stroke={active ? PARTICLE : OUTLINE}
        strokeWidth={active ? 4 : 2.5}
        strokeLinecap="round"
      />
      )}
      <text
        x={x}
        y={PATH_Y + 44}
        textAnchor="middle"
        fontSize={19}
        fontWeight={700}
        fill="currentColor"
      >
        {slot.label}
        <tspan fill={PARTICLE}>{particle}</tspan>
      </text>
    </g>
  );
}

export function JourneyScene({
  spec,
  scopeId,
}: {
  spec: JourneyDiagramSpec;
  scopeId: string;
}) {
  /** Only the roles this sentence actually fills, left to right along the path. */
  const slots = useMemo(() => {
    const out: { role: Role; slot: JourneyDiagramSlot; x: number }[] = [];
    if (spec.origin) out.push({ role: "origin", slot: spec.origin, x: START_X });
    if (spec.limit) out.push({ role: "limit", slot: spec.limit, x: 340 });
    out.push({ role: "destination", slot: spec.destination, x: END_X });
    if (spec.means) out.push({ role: "means", slot: spec.means, x: -1 });
    return out;
  }, [spec]);

  const [role, setRole] = useState<Role>(
    spec.origin ? "origin" : "destination",
  );
  /** false = the primary particle, true = `destinationAlt`. */
  const [alt, setAlt] = useState(false);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => setRunKey((k) => k + 1), [role, alt, scopeId]);

  const destParticle =
    alt && spec.destinationAlt
      ? spec.destinationAlt.particle
      : spec.destination.particle;

  const active = slots.find((s) => s.role === role);
  const note =
    role === "destination" && alt && spec.destinationAlt
      ? spec.destinationAlt.note
      : (active?.slot.note ?? "");

  /* A limit BOUNDS the movement, so selecting まで stops the traveller there
     instead of letting it run on to the arrowhead. That is the whole content
     of the note ("the walking stops there") — showing it beats asserting it. */
  const travelTo =
    role === "limit" ? (slots.find((s) => s.role === "limit")?.x ?? TRAVEL_TO) : TRAVEL_TO;

  /* @keyframes live in a GLOBAL namespace, so two scenes on one page would
     otherwise share — and the last one mounted would win for both. Same fix
     as TransferScene: scope the name per scene AND per replay. */
  const uid = `${scopeId.replace(/[^a-z0-9]/gi, "")}-${runKey}`;

  return (
    <div className="w-full text-text-primary">
      <style>{`
        @keyframes jTravel-${uid} {
          from { transform: translateX(${TRAVEL_FROM}px); }
          to   { transform: translateX(${travelTo}px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jt-${uid} { animation: none !important;
                       transform: translateX(${travelTo}px); }
        }
      `}</style>

      <svg
        viewBox="0 0 600 178"
        className="w-full"
        role="img"
        aria-label={`A journey: ${slots
          .map((s) => `${s.slot.label} ${s.role}`)
          .join(", ")}`}
      >
        {/* The path itself. */}
        <line
          x1={START_X}
          y1={PATH_Y}
          x2={END_X}
          y2={PATH_Y}
          stroke={OUTLINE}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="10 7"
          opacity={0.5}
        />
        {/* The arrowhead IS the destination marker — it lights up with it. */}
        <path
          d={`M ${END_X - 14} ${PATH_Y - 10} L ${END_X + 4} ${PATH_Y} L ${END_X - 14} ${PATH_Y + 10} Z`}
          fill={role === "destination" ? PARTICLE : OUTLINE}
          opacity={role === "destination" ? 1 : 0.5}
        />

        {slots
          .filter((s) => s.x >= 0)
          .map((s) => (
            <Marker
              key={s.role}
              x={s.x}
              slot={s.slot}
              particle={s.role === "destination" ? destParticle : s.slot.particle}
              active={s.role === role}
              post={s.role !== "destination"}
            />
          ))}

        {/* The traveller, and what it travels BY — で rides on the traveller
            rather than sitting on the path, because a means is not a place. */}
        <g
          className={`jt-${uid}`}
          style={{
            animation: `jTravel-${uid} ${TRAVEL_MS}ms ease-in-out forwards`,
          }}
        >
          <g transform={`translate(0 ${PATH_Y + TRAVELLER_DY})`}>
            <Traveller color={spec.traveller.color} label={spec.traveller.label} />
            {spec.means && (
              <g opacity={role === "means" ? 1 : 0.5}>
                <rect
                  x={-42}
                  y={24}
                  width={84}
                  height={26}
                  rx={13}
                  fill="none"
                  stroke={role === "means" ? PARTICLE : OUTLINE}
                  strokeWidth={role === "means" ? 3 : 2}
                />
                <text
                  x={0}
                  y={42}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={700}
                  fill="currentColor"
                >
                  {spec.means.label}
                  <tspan fill={PARTICLE}>{spec.means.particle}</tspan>
                </text>
              </g>
            )}
          </g>
        </g>

        {/* The verb rides high above the arrowhead, clear of the traveller's
            stopping position and of the destination label below the path. */}
        <text
          x={END_X + 4}
          y={PATH_Y - 46}
          textAnchor="end"
          fontSize={17}
          fontWeight={700}
          fill="currentColor"
          opacity={0.85}
        >
          {spec.verb}
        </text>
      </svg>

      <div className="mt-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <fieldset className="flex flex-wrap items-center gap-1.5">
            <legend className="sr-only">Which part of the journey?</legend>
            <span className="text-xs font-semibold text-text-muted">
              Which part?
            </span>
            {slots.map((s) => (
              <button
                key={s.role}
                type="button"
                aria-pressed={s.role === role}
                onClick={() => setRole(s.role)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  s.role === role
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-text-secondary hover:border-accent"
                }`}
              >
                {s.slot.label}
                {s.role === "destination" ? destParticle : s.slot.particle}
              </button>
            ))}
          </fieldset>

          {spec.destinationAlt && role === "destination" && (
            <button
              type="button"
              onClick={() => setAlt((a) => !a)}
              className="rounded-full border border-accent px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent-muted"
            >
              swap for {alt ? spec.destination.particle : spec.destinationAlt.particle}
            </button>
          )}

          <button
            type="button"
            onClick={() => setRunKey((k) => k + 1)}
            aria-label="Replay the journey"
            className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition hover:border-accent"
          >
            ⟲ Replay
          </button>
        </div>

        <p className="m-0 mt-1.5 text-xs leading-snug text-text-secondary">
          {note}
        </p>
      </div>
    </div>
  );
}
