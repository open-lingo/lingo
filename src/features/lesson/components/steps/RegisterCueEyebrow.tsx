import { Badge } from "@/shared/components/ui";
import type { RegisterCue } from "../../types";

/**
 * The audience/politeness cue above a production prompt — "POLITE",
 * "TO A FRIEND", "TO YOUR TEACHER".
 *
 * A two-line wrapper over the `Badge` eyebrow variant, not a new primitive:
 * every step view that shows a prompt renders THIS rather than its own
 * `<Badge variant="eyebrow" tone=…>`, so the cue's tone (and any later
 * change to it — an icon, a tooltip, a colour split between polite and
 * plain) happens once instead of five times. No sizing, spacing or colour
 * literals live here; `tone` is the only choice made, and it is made from
 * the data.
 *
 * Deliberately NOT rendered by `ListeningBuildStepView`: a listening build
 * gets its register from the audio, and printing "POLITE" above a sentence
 * the learner has yet to hear hands them the ます they are being tested on.
 * The step still CARRIES the cue (the agreement gate sweeps compiled steps),
 * it just isn't shown.
 *
 * Returns null for an un-cued step, so call sites need no conditional.
 */
export function RegisterCueEyebrow({
  cue,
  className,
}: {
  cue: RegisterCue | undefined;
  className?: string;
}) {
  if (!cue) return null;
  return (
    <Badge
      variant="eyebrow"
      // Polite vs plain is the ONE distinction the learner acts on, so it
      // gets a colour difference rather than the same muted grey twice.
      tone={cue.form === "polite" ? "accent" : "muted"}
      data-register-form={cue.form}
      {...(cue.audience ? { "data-register-audience": cue.audience } : {})}
      className={className}
    >
      {cue.label}
    </Badge>
  );
}
