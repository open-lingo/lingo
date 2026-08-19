import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TransferDiagram } from "./TransferDiagram";
import { TransferScene } from "../../components/steps/TransferScene";
import { ALL_SPECS, M31_AXIS } from "./transferSpec";
import { JourneyScene } from "../../components/steps/JourneyScene";
import { ALL_JOURNEYS, M19_CURRENT_RULES } from "./journeySpec";

/**
 * DEV · Transfer diagram (give/receive and friends) — prototype driver.
 * Route: `/:lang/qa/transfer-diagram`.
 *
 * Spencer, 2026-08-17:
 *
 *   "maybe we need a good way to teach and display these kind of verbs too,
 *    maybe a new evolution to the info card? something to visibly display
 *    these or some other text book style visual?"
 *
 * The claim under test: あげる/くれる/もらう is a PICTURE, and m31's rule card
 * is currently 840 characters of prose describing an arrow. Everything the
 * prose asserts — the うち boundary, the direction, who the sentence is about,
 * and the receiver dropping out of a くれる sentence — is a position or a
 * label in a diagram.
 *
 * Touches NOTHING: no IR, no step type, no atom registry, no TTS, no
 * curriculum test. `transferSpec.ts` mirrors the proposed `diagram:` field so
 * this page is the executable spec for that shape, not a use of it.
 *
 * Art note: this is geometry, not a raster. The nine hand-authored files in
 * `src/pub/lingo-art/svg/` ship at ~1 KB each; a generated PNG of the same
 * scene measured 140 KB and could not be re-coloured, re-labelled, or made to
 * match the house outline. See the header notes on the page.
 */

/** Lesson shell is `h-[calc(100dvh-6.5rem)]`; CLAUDE.md requires ≤700px. */
const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

/**
 * Snapshot of the SHIPPING m31 L1 rule string, copied from
 * `ir/m31.ir.yaml` on 2026-08-17 (840 chars). Kept verbatim so the
 * side-by-side is honest; re-copy it if the IR changes.
 */
const CURRENT_RULE =
  "Japanese has no single verb for give, and which one you reach for depends on WHICH WAY the thing moved past you — not on who is talking, not on politeness. Direction. Japanese draws a circle around you and the people who belong to you (うち, inside); everybody else stands そと, outside. あげる is the verb for a thing going OUT: 「ともだちに プレゼントを あげる。」 I'll give my friend a present. くれる is the same arrow pointed back IN: 「ともだちが プレゼントを くれる。」 My friend gives me a present. They are not two levels of politeness and not giver-verb versus receiver-verb — they are ONE EVENT SEEN FROM OPPOSITE ENDS. あげる is you watching the present leave; くれる is you watching it arrive. Watch what the direction changes: the giver takes は with あげる and が with くれる, and with くれる the receiver — me — drops out of the sentence entirely, because the verb has already said it.";

/** What the rule string could shrink to once the picture carries the rest. */
const PROPOSED_RULE =
  "Which verb you reach for depends on WHICH WAY the thing moved past you — not on who is talking, not on politeness. Japanese draws a circle around you and the people who belong to you (うち, inside); everybody else stands そと, outside.";

type Mode = "scene" | "journey" | "diagram" | "prose" | "both";

export default function TransferDiagramQaPage() {
  const [heightIdx, setHeightIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("scene");
  const [showNotes, setShowNotes] = useState(true);
  const [overflow, setOverflow] = useState("");
  const frameRef = useRef<HTMLDivElement | null>(null);
  const height = FRAME_HEIGHTS[heightIdx].px;

  // "Measure `scrollHeight - clientHeight` on the step container, not vibes"
  // (CLAUDE.md). Same probe as the dialogue-sim page.
  useEffect(() => {
    const tick = () => {
      const el = frameRef.current;
      if (!el) return;
      const over = el.scrollHeight - el.clientHeight;
      setOverflow(
        over > 1
          ? `⚠️ step container overflows by ${over}px`
          : "✓ no step-container overflow",
      );
    };
    tick();
    const id = window.setInterval(tick, 600);
    return () => window.clearInterval(id);
  }, [height, mode, showNotes]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-5 border-b border-border pb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-warning">
            DEV · Transfer diagram (prototype)
          </div>
          <h1 className="m-0 mt-1 text-2xl font-bold">
            ↔️ give / receive as a picture
          </h1>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            m31's L1 card is <b>840 characters</b> of prose describing an arrow.
            Every fact in it is a position or a label in a diagram. This page
            renders the diagram so you can decide whether it replaces the prose.
          </p>
          <ul className="m-0 mt-3 list-disc space-y-1 pl-5 text-xs text-text-secondary">
            <li>
              <b>The circle never moves.</b> わたし stays left, inside うち, on
              every row — only the <i>arrow</i> flips. An anchor that jumped
              sides per row would teach nothing.
            </li>
            <li>
              <b>くれる and もらう share an arrow.</b> The only difference is
              which party the sentence is about, drawn as the ring. Prose has to
              assert that; the picture shows it. This is the pair learners
              actually confuse.
            </li>
            <li>
              <b>The ghost is the point.</b> くれる drops the receiver, so
              わたし renders dashed and faceless with a caption — the learner
              sees an <i>absence</i>, not an omission.
            </li>
            <li>
              <b>Blobs carry no age, gender or ethnicity.</b> That is what lets
              あに appear at all: it is a labelled node in a relation, not a
              portrait. See the third block below.
            </li>
          </ul>
          <p className="m-0 mt-3 text-xs text-text-muted">
            <Link to="../qa" className="underline">
              QA test-drive
            </Link>
            {" · "}
            <Link to="../qa/dialogue-sim" className="underline">
              dialogue-sim
            </Link>
            {" · "}
            <Link to="../learn/lessons/ja-m31-neo-1" className="underline">
              the real m31 L1
            </Link>
          </p>
        </header>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          <span className="font-semibold text-text-muted">Frame:</span>
          {FRAME_HEIGHTS.map((h, i) => (
            <button
              key={h.px}
              type="button"
              onClick={() => setHeightIdx(i)}
              className={`rounded px-2 py-1 ${
                i === heightIdx
                  ? "border-accent bg-accent-muted text-accent"
                  : "border border-border"
              }`}
            >
              {h.label}
            </button>
          ))}
          <span className="ml-auto font-mono">{overflow}</span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs">
          <span className="font-semibold text-text-muted">Show:</span>
          {(["scene", "journey", "diagram", "prose", "both"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2 py-1 ${
                m === mode
                  ? "border-accent bg-accent-muted text-accent"
                  : "border border-border"
              }`}
            >
              {m}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1">
            <input
              type="checkbox"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
            />
            per-row notes
          </label>
        </div>

        <div
          ref={frameRef}
          style={{ height }}
          className="overflow-y-auto rounded-xl border border-border bg-surface p-4"
        >
          {(mode === "prose" || mode === "both") && (
            <section className="mb-4">
              <h2 className="m-0 mb-1 text-sm font-bold">
                Shipping today — {CURRENT_RULE.length} chars
              </h2>
              <p className="m-0 text-sm leading-relaxed text-text-secondary">
                {CURRENT_RULE}
              </p>
            </section>
          )}

          {mode === "scene" && (
            <>
              <p className="m-0 mb-3 text-xs text-text-secondary">
                One scene the learner operates. The two controls are the two
                questions Japanese actually asks before you can pick a transfer
                verb — answer them and the picture redraws.
              </p>
              {ALL_SPECS.map((spec) => (
                <section key={spec.id} className="mb-5">
                  <h2 className="m-0 mb-2 text-sm font-bold">{spec.title}</h2>
                  <TransferScene spec={spec} scopeId={spec.id} />
                </section>
              ))}
            </>
          )}

          {mode === "journey" && (
            <>
              <p className="m-0 mb-3 text-xs text-text-secondary">
                A SECOND primitive, not a second use of the first. A transfer
                moves an object between two people; a journey moves the subject
                along a path. m19 teaches に / へ / で / まで in one module and
                から arrived in m16 — five particles whose whole difficulty is
                which ROLE each one assigns. So the picture puts the roles on
                one path and lets the learner select one. に vs へ mark the same
                slot, so that one is a swap in place rather than two rows.
              </p>
              {ALL_JOURNEYS.map((spec) => (
                <section key={spec.id} className="mb-5">
                  <h2 className="m-0 mb-2 text-sm font-bold">{spec.title}</h2>
                  <JourneyScene spec={spec} scopeId={spec.id} />
                </section>
              ))}
              <section className="mt-6 border-t border-border pt-3">
                <h2 className="m-0 mb-2 text-sm font-bold">
                  The three m19 rule cards this would thin out
                </h2>
                {M19_CURRENT_RULES.map((r) => (
                  <p
                    key={r.id}
                    className="m-0 mb-2 text-xs leading-relaxed text-text-secondary"
                  >
                    <span className="font-bold text-text-primary">{r.id}</span>{" "}
                    ({r.text.length} chars) — {r.text}
                  </p>
                ))}
              </section>
            </>
          )}

          {(mode === "diagram" || mode === "both") && (
            <>
              <section className="mb-4">
                <h2 className="m-0 mb-1 text-sm font-bold">
                  Proposed rule text — {PROPOSED_RULE.length} chars
                </h2>
                <p className="m-0 text-sm leading-relaxed text-text-secondary">
                  {PROPOSED_RULE}
                </p>
              </section>
              {ALL_SPECS.map((spec) => (
                <section key={spec.id} className="mb-5">
                  <h2 className="m-0 mb-2 text-sm font-bold">{spec.title}</h2>
                  <TransferDiagram spec={spec} showNotes={showNotes} />
                </section>
              ))}
            </>
          )}
        </div>

        <p className="mt-3 text-xs text-text-muted">
          Rule text drops {CURRENT_RULE.length - PROPOSED_RULE.length} chars (
          {Math.round(
            (1 - PROPOSED_RULE.length / CURRENT_RULE.length) * 100,
          )}
          %) if the diagram carries the direction, the particles, the subject
          and the dropped receiver. {M31_AXIS.rows.length} rows here; the same
          renderer covers かす/かりる and おしえる/ならう. It does NOT cover
          いく/くる or のる/おりる — the rollout doc listed them, and they turn
          out to be JOURNEYS (the subject moves, not an object), which is what
          the "journey" mode above is for.
        </p>
      </div>
    </div>
  );
}
