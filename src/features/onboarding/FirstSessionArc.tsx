import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/shared/contexts/SettingsContext";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { dismissPlacement } from "@/features/placement/hooks/usePlacementDismissed";

/**
 * First-session arc (FTUE P0 — docs/ftue-design-2026-06-14.md §5).
 *
 * Shown ONCE to a brand-new learner (no completed lessons, arc not yet seen),
 * right after they pick a language and before the cold drop into lesson 1.
 * Three light steps: motivation → self-chosen daily goal → an explicitly
 * OPTIONAL placement offer. Tone is deliberately calm and adult — no forced
 * cheerfulness, no baby-talk (house rule: the average user isn't dumb).
 *
 * Evidence: self-chosen goals + a commitment CTA retain better than assigned
 * ones; value-before-friction; learn-by-doing for everything else.
 */

const GOAL_OPTIONS = [5, 10, 15, 20] as const;
const MOTIVATIONS = [
  { id: "travel", label: "Travel" },
  { id: "culture", label: "Culture & media" },
  { id: "work", label: "Work or study" },
  { id: "family", label: "Family & friends" },
  { id: "curious", label: "Just curious" },
] as const;

/** Pure gate predicate — exported for tests. The arc runs only for a learner
 *  with zero completed lessons who hasn't seen it yet. */
export function shouldShowFirstSessionArc(opts: {
  completedCount: number;
  ftueArcSeen: boolean | undefined;
}): boolean {
  return opts.completedCount === 0 && !opts.ftueArcSeen;
}

export function FirstSessionArc() {
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();
  const langPath = useLangPath();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [goal, setGoal] = useState<number>(
    settings.learning.dailyGoalMinutes ?? 10,
  );

  const visible = shouldShowFirstSessionArc({
    completedCount: getMockCompletedLessonIds().length,
    ftueArcSeen: settings.learning.ftueArcSeen,
  });
  if (!visible) return null;

  function finish(next?: () => void) {
    updateSetting("learning.ftueArcSeen", true);
    // The arc owns the new-user placement decision — record it on the shared
    // placement-dismissed flag so the standalone PlacementPrompt never
    // double-fires (whichever path the learner took, they've decided).
    dismissPlacement();
    next?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/95 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
        {/* Step dots */}
        <div className="mb-6 flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-accent" : "bg-border"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <section aria-labelledby="ftue-motivation-h">
            <h2
              id="ftue-motivation-h"
              className="text-xl font-bold text-text-primary"
            >
              What brings you to Japanese?
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              Optional — it just helps us pick relevant examples.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {MOTIVATIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    updateSetting("learning.motivation", m.id);
                    setStep(1);
                  }}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition hover:border-accent"
                >
                  {m.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 text-sm font-medium text-text-muted underline decoration-dotted underline-offset-4 transition hover:text-text-primary"
            >
              Skip
            </button>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="ftue-goal-h">
            <h2 id="ftue-goal-h" className="text-xl font-bold text-text-primary">
              Pick a daily goal
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              How many minutes a day feels right? You can change this any time.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGoal(m)}
                  aria-pressed={goal === m}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                    goal === m
                      ? "border-accent bg-accent-muted text-accent"
                      : "border-border bg-surface text-text-primary hover:border-accent"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                updateSetting("learning.dailyGoalMinutes", goal);
                setStep(2);
              }}
              className="mt-6 w-full rounded-xl border-[1.5px] border-accent-hover bg-accent px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:bg-accent-hover"
            >
              Commit to my goal
            </button>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="ftue-start-h">
            <h2
              id="ftue-start-h"
              className="text-xl font-bold text-text-primary"
            >
              Where do you want to start?
            </h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              New to Japanese? Start at the beginning. Already know some? An
              optional placement can move you ahead — entirely your call.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => finish(() => navigate(langPath("learn")))}
                className="w-full rounded-xl border-[1.5px] border-accent-hover bg-accent px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:bg-accent-hover"
              >
                Start from the beginning
              </button>
              <button
                type="button"
                onClick={() =>
                  finish(() => navigate(langPath("learn/placement-test")))
                }
                className="w-full rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
              >
                Take the optional placement
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-text-muted">
              The placement is optional — skipping it costs you nothing.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
