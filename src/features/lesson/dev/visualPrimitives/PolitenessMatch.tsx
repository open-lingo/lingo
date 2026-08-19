import { useState } from "react";
import type { RegisterAudienceView } from "@/features/lesson/components/steps/RegisterScene";
import { CastFigure } from "@/features/lesson/components/steps/castArt";

/**
 * DEV PROTOTYPE · "match the politeness to the person".
 *
 * Spencer 2026-08-18: *"maybe we also make some cool step type of 'match the
 * politeness to X person' like match pairs, and we could use it in other
 * places or something. that might be a little too childish, but just an
 * idea."*
 *
 * It is not childish, and the reason is worth stating: every other register
 * exercise in the course asks the learner to PRODUCE a form and then tells
 * them whether it was polite enough. This asks the inverse — here is a form,
 * who is it for — which is the direction the knowledge is actually used in.
 * A learner who can only go form→politeness has memorised a table; one who
 * can go politeness→person has the rule.
 *
 * One constraint the idea forces and prose would have hidden: **a matching
 * exercise needs one person per politeness level.** The cast has TWO level-3
 * audiences (おばあさん and てんいん), so a four-way match over うん/はい/ええ
 * has no unique answer. Any real step type built from this must either pick a
 * distinct-level subset (what this prototype does) or accept many-to-one
 * pairing — it cannot just hand the whole cast to a match grid.
 *
 * State machine deliberately mirrors `MatchPairsStepView` (idle → selected →
 * matched | wrong, tap one side then the other) so promoting this to a real
 * step type is a port, not a redesign.
 */

export type PolitenessPair = {
  id: string;
  /** The utterance. */
  form: string;
  /** The audience it belongs to — must be unique per politeness level. */
  audience: RegisterAudienceView;
};

export function PolitenessMatch({
  prompt,
  pairs,
}: {
  prompt: string;
  pairs: PolitenessPair[];
}) {
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const done = matched.size === pairs.length;

  function tapPerson(pairId: string) {
    if (!selected || matched.has(pairId)) return;
    if (selected === pairId) {
      setMatched(new Set([...matched, pairId]));
      setSelected(null);
      setWrong(null);
      return;
    }
    setMistakes((m) => m + 1);
    setWrong(pairId);
    setSelected(null);
    window.setTimeout(() => setWrong(null), 520);
  }

  return (
    <div className="w-full">
      <p className="m-0 text-sm font-semibold text-text-primary">{prompt}</p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {pairs.map((p) => {
          const isMatched = matched.has(p.id);
          const isSelected = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={isMatched}
              onClick={() => setSelected(isSelected ? null : p.id)}
              className={`rounded-2xl border-[2.5px] px-4 py-2 text-lg font-bold transition ${
                isMatched
                  ? "invisible"
                  : isSelected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-text-primary hover:border-accent"
              }`}
            >
              {p.form}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {pairs.map((p) => {
          const isMatched = matched.has(p.id);
          const isWrong = wrong === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => tapPerson(p.id)}
              aria-label={`Say it to ${p.audience.label}`}
              className={`flex flex-col items-center rounded-2xl border-[2.5px] px-1 py-2 transition ${
                isMatched
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isWrong
                    ? "border-rose-500 bg-rose-500/10"
                    : selected
                      ? "border-accent/50 hover:border-accent"
                      : "border-border"
              }`}
              style={
                isWrong
                  ? { animation: "politeness-match-shake 380ms ease-in-out" }
                  : undefined
              }
            >
              {/* UPRIGHT portraits only — never the bowing pose. In the
                  register scene the posture is the answer being taught; here
                  it would be the answer being given away. */}
              {p.audience.portraitUrl ? (
                <img
                  src={p.audience.portraitUrl}
                  alt=""
                  className="h-20 w-auto"
                />
              ) : (
                <svg viewBox="-40 -84 80 92" className="h-20 w-auto">
                  <CastFigure
                    role={p.audience.role}
                    color={p.audience.color}
                    politeness={p.audience.politeness}
                  />
                </svg>
              )}
              <span className="mt-1 text-sm font-bold text-text-primary">
                {p.audience.ja}
              </span>
              {/* The slot is permanently reserved so a correct match never
                  reflows the row — same rule the lesson shell already holds
                  for the Continue CTA. */}
              <span
                className={`mt-1 grid h-8 w-full place-items-center rounded-lg text-base font-bold ${
                  isMatched
                    ? "bg-emerald-500/15 text-text-primary"
                    : "border border-dashed border-border text-transparent"
                }`}
              >
                {isMatched ? p.form : "―"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="m-0 mt-2 h-5 text-xs font-semibold text-text-secondary">
        {done
          ? mistakes === 0
            ? "Clean sweep."
            : `Done — ${mistakes} miss${mistakes === 1 ? "" : "es"}.`
          : selected
            ? "Now tap who you would say it to."
            : "Tap a phrase first."}
      </p>

      <style>{`@keyframes politeness-match-shake {
        0%,100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }`}</style>
    </div>
  );
}
