import { useState } from "react";
import { PARTICLE, SceneChips } from "./sceneArt";
import { CastFigure } from "./castArt";

/**
 * The register scene — WHO you are talking to, drawn.
 *
 * Spencer 2026-08-18: *"the politeness register is good, I think we DO want
 * images we preload of who each person is."* The cast already exists and is
 * already addressed by ROLE rather than by name (`registerAudiences.ts`,
 * Spencer 2026-07-27 — 「せんせい」 makes the required register readable
 * straight off the screen where 「たなか」 requires remembering who Tanaka is).
 * What it lacked was a face.
 *
 * Two things this adds:
 *
 *   1. **The cast has a body.** Either a generated portrait (`portraitUrl`) or
 *      the drawn `CastFigure` fallback — both in the same flat / dark-outline
 *      house style as the transfer and journey scenes. Role reads from the
 *      silhouette: cap, glasses and a book, a bun and a cane, an apron.
 *   2. **The bow IS the politeness meter.** Level 1 stands straight, level 2
 *      leans, level 3 is drawn bowing. Register in Japanese is a property of
 *      the ADDRESSEE rather than an abstract formality setting, so the whole
 *      cast stays on screen and each one shows the posture it is owed — the
 *      others standing straighter is what makes the deep bow legible.
 *
 * The utterance re-renders underneath. Nothing about the meaning changes —
 * which is the point, and is very hard to say in prose without the learner
 * concluding that です means something.
 */

import type {
  RegisterAudienceView,
  RegisterSpec,
} from "@/features/lesson/types";

export type { RegisterAudienceView, RegisterSpec };

const GROUND = 132;
/** Rendered height of a portrait, feet on the ground line. */
const PORTRAIT_H = 96;

/**
 * You cannot fake a pose with an affine transform on a raster.
 *
 * This went through two wrong answers before the right one. Rotating the image
 * about the feet swings the whole rectangle, so a foot lifts off the ground
 * line and the character reads as TOPPLING. `skewX` fixed the feet but sheared
 * every part of the image equally, so heads became slanted ovals instead of
 * rotated circles — Spencer, looking at it: *"image gens were a bit weird,
 * everyone else is like tilted some way, was the image transformed weird?"*
 * The art was fine. The transform was the defect.
 *
 * So level 3 gets a DRAWN pose (`bowPortraitUrl`) and no transform at all.
 * Level 2 keeps the upright portrait with a lean small enough that the shear
 * is invisible — which is also the truer picture, because です・ます is the
 * polite default rather than a deferential act. Level 1 stands straight.
 */
function poseFor(a: RegisterAudienceView): {
  href: string;
  transform?: string;
} {
  if (a.politeness === 3 && a.bowPortraitUrl) {
    return { href: a.bowPortraitUrl };
  }
  const href = a.portraitUrl!;
  if (a.politeness === 1) return { href };
  /* ~7°. Beyond about 10° the shear starts to read on the head. */
  const deg = a.politeness === 2 ? 7 : 14;
  const lean = Math.tan((deg * Math.PI) / 180) * PORTRAIT_H;
  return {
    href,
    transform: `translate(${-lean / 2} 0) skewX(${-deg}) scale(1 ${1 - deg / 260})`,
  };
}

export function RegisterScene({
  spec,
  scopeId,
}: {
  spec: RegisterSpec;
  scopeId: string;
}) {
  const [id, setId] = useState(spec.audiences[0].id);
  const who = spec.audiences.find((a) => a.id === id) ?? spec.audiences[0];
  const n = spec.audiences.length;

  return (
    <div className="w-full text-text-primary">
      <svg
        viewBox="0 0 600 196"
        className="w-full"
        role="img"
        aria-label={`Speaking to ${who.label}: ${spec.forms[who.politeness]}`}
      >
        {/* The whole cast stays on screen — the learner is choosing a PERSON,
            not toggling a setting, and the others standing straighter is what
            makes the chosen one's bow legible. */}
        {spec.audiences.map((a, i) => {
          const x = 78 + (i * 414) / Math.max(1, n - 1);
          const on = a.id === who.id;
          return (
            <g key={a.id}>
              {on && (
                <rect
                  x={x - 48}
                  y={GROUND - PORTRAIT_H - 14}
                  width={96}
                  height={PORTRAIT_H + 22}
                  rx={14}
                  fill="none"
                  stroke={PARTICLE}
                  strokeWidth={2.5}
                />
              )}
              {/* The floor a bow is measured against. Without it the tilt is
                  the only cue; with it, the head visibly closes the gap. */}
              <line
                x1={x - 38}
                y1={GROUND}
                x2={x + 38}
                y2={GROUND}
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={on ? 0.5 : 0.18}
              />
              <g transform={`translate(${x} ${GROUND})`}>
                {a.portraitUrl ? (
                  (() => {
                    const pose = poseFor(a);
                    return (
                      <g opacity={on ? 1 : 0.34} transform={pose.transform}>
                        <image
                          href={pose.href}
                          x={-PORTRAIT_H / 2}
                          y={-PORTRAIT_H}
                          width={PORTRAIT_H}
                          height={PORTRAIT_H}
                          preserveAspectRatio="xMidYMax meet"
                        />
                      </g>
                    );
                  })()
                ) : (
                  <CastFigure
                    role={a.role}
                    color={a.color}
                    politeness={a.politeness}
                    dimmed={!on}
                  />
                )}
              </g>
              <text
                x={x}
                y={GROUND + 24}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fill="currentColor"
                opacity={on ? 1 : 0.45}
              >
                {a.ja}
              </text>
            </g>
          );
        })}

        {/* The utterance. Only the FORM moves; the gloss is pinned below so the
            learner can watch the meaning hold still. */}
        <text
          x={300}
          y={188}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill={PARTICLE}
          key={`${scopeId}-${who.id}`}
        >
          {spec.forms[who.politeness]}
        </text>
      </svg>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SceneChips
          legend="Who are you talking to?"
          items={spec.audiences.map((a) => ({ id: a.id, label: a.ja }))}
          value={id}
          onChange={setId}
        />
        <span className="ml-auto text-xs text-text-muted">
          politeness {who.politeness}/3
        </span>
      </div>
      <p className="m-0 mt-1.5 text-xs leading-snug text-text-secondary">
        Same thing said, every time: “{spec.gloss}”. Only the ending moves —
        and it moves because the PERSON changed, not because the meaning did.
      </p>
    </div>
  );
}
