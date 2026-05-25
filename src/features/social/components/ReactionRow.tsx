/**
 * A composable horizontal row of one-tap reaction buttons. Generalizes
 * `KudosButton` — each reaction is the same affordance, just a different
 * emoji + kind. Maintains local toggle state per kind.
 *
 * MOCK: tap toggles in-memory; real impl posts each kind to the social API.
 */
import { useState } from "react";
import { cn } from "@/shared/components/ui/cn";
import {
  REACTION_EMOJI,
  type ActivityReaction,
  type ReactionKind,
} from "../mock/mockSocial";

export type ReactionRowProps = {
  /** Existing reactions on the item (from server). */
  reactions: ActivityReaction[];
  /** Which kinds the user can add. Order = render order. */
  available?: ReactionKind[];
  /** Compact mode for tight rows. */
  size?: "sm" | "md";
  /** Optional aria-label prefix — e.g. "Cheer on Anna's streak". */
  ariaLabelPrefix?: string;
};

const DEFAULT_AVAILABLE: ReactionKind[] = ["wave", "fire", "clap", "target"];

export function ReactionRow({
  reactions,
  available = DEFAULT_AVAILABLE,
  size = "sm",
  ariaLabelPrefix,
}: ReactionRowProps) {
  // Local overrides on top of the incoming reactions. Two sets:
  //   - `added`   : kinds the user just turned on (initial.mine !== true)
  //   - `removed` : kinds the user just turned off (initial.mine === true)
  // Rendered count = initial.count + (on now && !was-mine ? +1 : 0)
  //                                  + (was-mine && !on now ? -1 : 0)
  const [added, setAdded] = useState<Set<ReactionKind>>(new Set());
  const [removed, setRemoved] = useState<Set<ReactionKind>>(new Set());

  const byKind = new Map<ReactionKind, ActivityReaction>();
  for (const r of reactions) byKind.set(r.kind, r);

  const toggle = (kind: ReactionKind) => {
    const initial = byKind.get(kind);
    const wasMine = initial?.mine === true;
    const isOnNow = wasMine ? !removed.has(kind) : added.has(kind);

    if (isOnNow) {
      // turn off
      if (wasMine) {
        const next = new Set(removed);
        next.add(kind);
        setRemoved(next);
      } else {
        const next = new Set(added);
        next.delete(kind);
        setAdded(next);
      }
    } else {
      // turn on
      if (wasMine) {
        const next = new Set(removed);
        next.delete(kind);
        setRemoved(next);
      } else {
        const next = new Set(added);
        next.add(kind);
        setAdded(next);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {available.map((kind) => {
        const initial = byKind.get(kind);
        const wasMine = initial?.mine === true;
        const isOnNow = wasMine ? !removed.has(kind) : added.has(kind);
        const baseCount = initial?.count ?? 0;
        const delta = isOnNow && !wasMine ? 1 : !isOnNow && wasMine ? -1 : 0;
        const count = baseCount + delta;

        return (
          <button
            key={kind}
            type="button"
            onClick={() => toggle(kind)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border font-semibold transition",
              size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
              isOnNow
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface text-text-secondary hover:border-accent hover:bg-accent-muted hover:text-accent",
            )}
            aria-pressed={isOnNow}
            aria-label={
              ariaLabelPrefix
                ? `${ariaLabelPrefix} — ${kind}`
                : isOnNow
                  ? `Remove ${kind} reaction`
                  : `React with ${kind}`
            }
          >
            <span aria-hidden>{REACTION_EMOJI[kind]}</span>
            {count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
