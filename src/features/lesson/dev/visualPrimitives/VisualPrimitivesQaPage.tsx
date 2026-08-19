import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TimelineScene } from "@/features/lesson/components/steps/TimelineScene";
import { ScaleScene } from "@/features/lesson/components/steps/ScaleScene";
import { RegisterScene } from "@/features/lesson/components/steps/RegisterScene";
import { PolitenessMatch } from "./PolitenessMatch";
import { preloadCastPortraits } from "@/features/languages/ja/castPortraits";
import {
  M15_TIMELINE,
  M26_SCALE,
  M26_SIZE_SCALE,
  M10_REGISTER,
  M10_YES,
  M10_YES_DRAWN,
} from "./primitiveSpecs";

/**
 * DEV · The scene primitives, all four in one place.
 * Route: `/:lang/qa/visual-primitives`.
 *
 * Spencer, 2026-08-18:
 *
 *   "please make QA pages of the things you proposed … i feel like the course
 *    needs slightly more visual polish, maybe we get them used to characters
 *    to indicate politeness? just a thought, try your ideas"
 *
 * The transfer diagram shipped in m31 and the journey scene is staged on
 * `/qa/transfer-diagram`. This page carries the three that follow from the
 * 231-point survey: TIMELINE (~9 points), SCALE (~5), and REGISTER (the
 * character idea).
 *
 * Touches NOTHING: no IR, no step type, no atom registry, no TTS, no
 * curriculum test. `primitiveSpecs.ts` is the executable spec for the shapes
 * a `timeline:` / `scale:` / `register:` field would take.
 *
 * The claim under test is the same one m31 proved: a rule whose content is a
 * POSITION should be drawn, and the controls should be the grammar rather
 * than chrome around it.
 */

/** Lesson shell is fixed-height; CLAUDE.md requires checking ≤700px. */
const FRAME_HEIGHTS = [
  { label: "700px viewport (the rule)", px: 596 },
  { label: "640px viewport (short laptop)", px: 536 },
  { label: "900px viewport (roomy)", px: 796 },
] as const;

type Tab = "timeline" | "scale" | "register" | "match" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "timeline", label: "timeline (rebuilt)" },
  { id: "scale", label: "scale" },
  { id: "register", label: "register / cast" },
  { id: "match", label: "politeness match" },
  { id: "all", label: "everything" },
];

/** うん / はい / ええ against one audience per level. See the note in the
 *  section body for why てんいん is not in this grid. */
const MATCH_PAIRS = ["friend", "teacher", "grandmother"].map((id) => {
  const a = M10_YES.audiences.find((x) => x.id === id)!;
  return { id, form: { 1: "うん", 2: "はい", 3: "ええ" }[a.politeness], audience: a };
});

function Section({
  title,
  points,
  children,
}: {
  title: string;
  points: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="m-0 mb-0.5 text-sm font-bold">{title}</h2>
      <p className="m-0 mb-2 text-xs text-text-muted">{points}</p>
      {children}
    </section>
  );
}

export default function VisualPrimitivesQaPage() {
  const [heightIdx, setHeightIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("timeline");
  const [overflow, setOverflow] = useState("");
  const frameRef = useRef<HTMLDivElement | null>(null);
  const height = FRAME_HEIGHTS[heightIdx].px;

  useEffect(preloadCastPortraits, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const over = el.scrollHeight - el.clientHeight;
    setOverflow(
      over > 0 ? `step container overflows by ${over}px` : "fits — 0px overflow",
    );
  }, [height, tab]);

  const show = (t: Tab) => tab === t || tab === "all";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <p className="m-0 text-xs font-bold uppercase tracking-wider text-accent">
        DEV · scene primitives (prototype)
      </p>
      <h1 className="m-0 mb-2 text-2xl font-extrabold">
        three more rules that are pictures
      </h1>
      <p className="m-0 mb-3 text-sm leading-relaxed text-text-secondary">
        From reading all 231 grammar points: the transfer diagram is a
        give/receive instrument and has nearly no homes left outside m31. These
        are the clusters that DO repeat. Each one is a rule whose content is a
        position, currently carried by a paragraph asserting it.
      </p>
      <ul className="mb-3 list-disc pl-5 text-sm leading-relaxed text-text-secondary">
        <li>
          <b>Timeline — rebuilt.</b> The crossing lines are gone. You said the
          intersect didn&apos;t mean much, and it didn&apos;t: it only reads as
          &ldquo;out of order&rdquo; once someone tells you so. Now the moments
          are NUMBERED, and the same badge appears on the clause and on the
          clock. 2-then-1 needs no key. Both sentences are verbatim m15 beats
          and share the same two events.
        </li>
        <li>
          <b>Scale.</b> より names one step, いちばん names the top, ほうがいい
          points at a side. Bar height encodes rank so the ordering is readable
          before the words are — and each item now carries its OWN course art,
          pulled from the vocab map, so it is the same picture the learner met
          on the flashcard.
        </li>
        <li>
          <b>Register.</b> The cast is generated art now — four characters,
          made locally with Z-Image-Turbo, background cut to alpha,{" "}
          <b>23.6&nbsp;KB for all four</b>. The bow is still the meter and it
          animates on the person, because register in Japanese is a property of
          the addressee and not an abstract formality setting.
        </li>
        <li>
          <b>Politeness match.</b> Your idea, prototyped. It asks the INVERSE of
          every other register exercise — here is a form, who is it for — and
          that is the direction the knowledge actually gets used in.
        </li>
      </ul>
      <p className="m-0 mb-4 text-sm text-text-secondary">
        <Link className="text-link underline" to="../qa/transfer-diagram">
          transfer + journey scenes
        </Link>{" "}
        · <Link className="text-link underline" to="../qa">QA test-drive</Link>
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2">
        <span className="text-xs font-semibold text-text-muted">Frame:</span>
        {FRAME_HEIGHTS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setHeightIdx(i)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              i === heightIdx
                ? "bg-accent text-accent-foreground"
                : "border border-border text-text-secondary hover:border-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto font-mono text-xs text-warning">
          {overflow.startsWith("fits") ? "" : "⚠️ "}
          {overflow}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2">
        <span className="text-xs font-semibold text-text-muted">Show:</span>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              t.id === tab
                ? "bg-accent text-accent-foreground"
                : "border border-border text-text-secondary hover:border-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        ref={frameRef}
        style={{ height }}
        className="overflow-y-auto rounded-xl border border-border bg-surface p-4"
      >
        {show("timeline") && (
          <Section
            title="TIMELINE — まえに / てから / とき"
            points="~9 points: m14 ている ×2, m15 まえに・てから・とき, m19 から…まで, m23 てから・とき, m30 まえに"
          >
            <TimelineScene spec={M15_TIMELINE} scopeId="tl-m15" />
          </Section>
        )}

        {show("scale") && (
          <>
            <Section
              title="SCALE — the art IS the bar"
              points="~5 points: m20/m26/m28 より, m26 いちばん, m28 ほうがいい · ねこ/いぬ/ぞう are m1/m1/m2 atoms"
            >
              <ScaleScene spec={M26_SIZE_SCALE} scopeId="sc-size" />
            </Section>
            <Section
              title="SCALE — price, ranked in ¥ instead of size"
              points="same axis, same reading; the unit changes from “how big” to “how many”"
            >
              <ScaleScene spec={M26_SCALE} scopeId="sc-m26" />
              <p className="m-0 mt-3 text-xs leading-snug text-text-secondary">
                Size-as-rank is literally true for おおきい and おもい, and a
                lie for たかい. So price ranks by COUNT instead: every item is
                drawn the same size and the ¥ stack carries the position. The
                axis is read identically either way.
              </p>
            </Section>
          </>
        )}

        {show("register") && (
          <>
            <Section
              title="REGISTER — the cast, as characters"
              points="m7/m10/m29 register-audience · the cast is registerAudiences.ts, unchanged — only the drawing is new"
            >
              <RegisterScene spec={M10_YES} scopeId="rg-yes" />
            </Section>
            <Section
              title="REGISTER — where two levels share a form"
              points="the honest case: です/ます covers both 2 and 3 for a verb, and the picture should not pretend otherwise"
            >
              <RegisterScene spec={M10_REGISTER} scopeId="rg-iku" />
            </Section>
            <Section
              title="REGISTER — drawn fallback (no portraits)"
              points="same scene, same spec, portraitUrl removed — what renders if the generated art is ever unavailable, and the comparison you asked for"
            >
              <RegisterScene spec={M10_YES_DRAWN} scopeId="rg-drawn" />
            </Section>
          </>
        )}

        {show("match") && (
          <Section
            title="MATCH THE POLITENESS TO THE PERSON"
            points="prototype only · state machine mirrors MatchPairsStepView so promoting it is a port, not a redesign"
          >
            <PolitenessMatch
              prompt="Match each way of saying “yes” to who you would say it to."
              pairs={MATCH_PAIRS}
            />
            <p className="m-0 mt-3 text-xs leading-snug text-text-secondary">
              One constraint this surfaced: a match grid needs ONE person per
              politeness level, and the cast has two level-3 audiences
              (おばあさん and てんいん). A four-way match over うん/はい/ええ has
              no unique answer, so any real step type has to pick a
              distinct-level subset — which is what this does — or accept
              many-to-one pairing.
            </p>
          </Section>
        )}
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Nothing here is wired into a lesson. Each scene is one component plus a
        spec type, the same shape the transfer diagram took before it shipped:
        add a field to a grammar point in the IR, trim the prose it replaces,
        recompile.
      </p>
    </div>
  );
}
