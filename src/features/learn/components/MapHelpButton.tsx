import { useState } from "react";
import { Icon } from "@/shared/components/Icon";

/**
 * Small "?" affordance floated on the transit map. Opens a popover
 * explaining how to read the map — the copy that used to sit as a helper
 * paragraph below the map, tucked away so it doesn't cost vertical space.
 */
export function MapHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-3 top-3 z-[6]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="How to read the map"
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-full border border-border bg-surface/90 text-text-secondary shadow-card backdrop-blur-sm transition hover:text-text-primary"
      >
        <Icon name="help" size={16} aria-hidden />
      </button>
      {open ? (
        <>
          {/* click-away catcher */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-10 w-64 rounded-card border border-border bg-surface p-3 text-[12.5px] leading-relaxed text-text-secondary shadow-popover">
            <p className="mb-1 font-bold text-text-primary">Reading the map</p>
            <p>
              Stations are modules — spacing scales with lesson count. Branch
              lines are side quests, and dashed track is the roadmap ahead.
              Click a station to open its district; the depot links to
              practice.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
