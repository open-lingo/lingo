/**
 * Reaction affordance for an activity item.
 *
 * Two variants:
 *  - `inline`: a horizontal row of one-tap reaction pills (legacy; used where
 *    vertical space is plentiful).
 *  - `menu` (default): a single compact trigger (lucide `smile`) that opens a
 *    portal Popover holding the reaction options. A small summary chip of the
 *    current reactions renders beside the trigger so counts stay visible
 *    without the row eating vertical space. This keeps activity cards short.
 *
 * State: when `onToggle` is provided the parent owns state (controlled);
 * otherwise the component manages a local optimistic toggle (uncontrolled,
 * used by previews/tests).
 */
import { useState } from "react";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import { Popover } from "@/shared/components/ui/Popover";
import {
  REACTION_EMOJI,
  type ActivityReaction,
  type ReactionKind,
} from "../types";

export type ReactionRowProps = {
  /** Existing reactions on the item (from server). */
  reactions: ActivityReaction[];
  /** Which kinds the user can add. Order = render order. */
  available?: ReactionKind[];
  /** Compact mode for tight rows. */
  size?: "sm" | "md";
  /** Layout. `menu` = collapse behind a single trigger (default). */
  variant?: "inline" | "menu";
  /** Optional aria-label prefix — e.g. "Cheer on Anna's streak". */
  ariaLabelPrefix?: string;
  /** Called when the user toggles a reaction. Receives the kind. When
   *  provided, the component delegates state to the parent (controlled).
   *  When absent, the component manages local toggle state (uncontrolled). */
  onToggle?: (kind: ReactionKind) => void;
  /** When true, all buttons are disabled (pending mutation). */
  disabled?: boolean;
};

const DEFAULT_AVAILABLE: ReactionKind[] = ["wave", "fire", "clap", "target"];

export function ReactionRow({
  reactions,
  available = DEFAULT_AVAILABLE,
  size = "sm",
  variant = "menu",
  ariaLabelPrefix,
  onToggle,
  disabled,
}: ReactionRowProps) {
  // Local overrides on top of the incoming reactions (uncontrolled mode):
  //   - `added`   : kinds the user just turned on (initial.mine !== true)
  //   - `removed` : kinds the user just turned off (initial.mine === true)
  const [added, setAdded] = useState<Set<ReactionKind>>(new Set());
  const [removed, setRemoved] = useState<Set<ReactionKind>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  const isControlled = typeof onToggle === "function";

  const byKind = new Map<ReactionKind, ActivityReaction>();
  for (const r of reactions) byKind.set(r.kind, r);

  const isOn = (kind: ReactionKind): boolean => {
    const wasMine = byKind.get(kind)?.mine === true;
    if (isControlled) return wasMine;
    return wasMine ? !removed.has(kind) : added.has(kind);
  };

  const countOf = (kind: ReactionKind): number => {
    const initial = byKind.get(kind);
    const wasMine = initial?.mine === true;
    const onNow = isOn(kind);
    const base = initial?.count ?? 0;
    const delta = isControlled ? 0 : onNow && !wasMine ? 1 : !onNow && wasMine ? -1 : 0;
    return base + delta;
  };

  const toggle = (kind: ReactionKind) => {
    if (isControlled) {
      onToggle!(kind);
      return;
    }
    const wasMine = byKind.get(kind)?.mine === true;
    const onNow = isOn(kind);
    if (onNow) {
      if (wasMine) setRemoved((s) => new Set(s).add(kind));
      else
        setAdded((s) => {
          const n = new Set(s);
          n.delete(kind);
          return n;
        });
    } else {
      if (wasMine)
        setRemoved((s) => {
          const n = new Set(s);
          n.delete(kind);
          return n;
        });
      else setAdded((s) => new Set(s).add(kind));
    }
  };

  const pill = (kind: ReactionKind) => {
    const onNow = isOn(kind);
    const count = countOf(kind);
    return (
      <button
        key={kind}
        type="button"
        disabled={disabled}
        onClick={() => toggle(kind)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-semibold transition",
          size === "sm" ? "min-h-7 px-2 py-0.5 text-xs" : "min-h-8 px-2.5 py-1 text-sm",
          onNow
            ? "border-accent bg-accent-muted text-accent"
            : "border-border bg-surface text-text-secondary hover:border-accent hover:bg-accent-muted hover:text-accent",
          disabled ? "opacity-60" : "",
        )}
        aria-pressed={onNow}
        aria-label={
          ariaLabelPrefix
            ? `${ariaLabelPrefix} — ${kind}`
            : onNow
              ? `Remove ${kind} reaction`
              : `React with ${kind}`
        }
      >
        <span aria-hidden>{REACTION_EMOJI[kind]}</span>
        {count > 0 ? <span>{count}</span> : null}
      </button>
    );
  };

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-1">
        {available.map(pill)}
      </div>
    );
  }

  // ── menu variant ──────────────────────────────────────────────────────────
  // Summary: which kinds currently have a non-zero count, shown as a compact
  // emoji + total chip so the card communicates "people reacted" at a glance.
  const active = available.filter((k) => countOf(k) > 0);
  const total = active.reduce((s, k) => s + countOf(k), 0);
  const mineAny = available.some((k) => isOn(k));

  return (
    <div className="flex items-center gap-1.5">
      <Popover
        open={menuOpen}
        onOpenChange={(o) => !disabled && setMenuOpen(o)}
        placement="top-start"
        trigger={
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full border transition",
              mineAny
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface text-text-muted hover:border-accent hover:bg-accent-muted hover:text-accent",
              disabled ? "opacity-60" : "",
            )}
            aria-label={ariaLabelPrefix ?? "React"}
          >
            <Icon name="smile" size={14} aria-hidden />
          </button>
        }
      >
        <div className="flex items-center gap-1">{available.map(pill)}</div>
      </Popover>

      {active.length > 0 ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-[11px] text-text-secondary">
          {active.map((k) => (
            <span key={k} aria-hidden>
              {REACTION_EMOJI[k]}
            </span>
          ))}
          <span className="ml-0.5 font-semibold">{total}</span>
        </span>
      ) : null}
    </div>
  );
}
