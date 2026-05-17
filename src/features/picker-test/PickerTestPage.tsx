/**
 * Side-by-side comparison of the language picker variants for Task #88
 * (the headline new-user-funnel fix). Toggle between "side-by-side" and
 * focused views so we can compare or test each in isolation.
 *
 * Route: /:lang/picker-test (dev / preview only).
 *
 * Wiring to the real signup flow (LanguageContext, Auth0 round-trip,
 * landing-page CTA) happens AFTER Spencer picks a variant — this page
 * is pure visual mock so we can decide on the design first.
 */
import { useState } from "react";
import { LanguagePickerGrid } from "./LanguagePickerGrid";

type View = "compare" | "current" | "grid";

const VIEWS: { id: View; label: string; description: string }[] = [
  { id: "compare", label: "Side by side", description: "Both pickers stacked for direct comparison" },
  { id: "current", label: "Current (pill row)", description: "What LanguagePickerModal renders today" },
  { id: "grid",    label: "New (2×2 flag grid)", description: "Mirrors the word_image_mcq pattern" },
];

export default function PickerTestPage() {
  const [view, setView] = useState<View>("compare");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Language picker — design comparison
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Two visual variants for the first-launch language picker
          (Task&nbsp;#88). Both are pure mocks — clicking a language only
          updates local state, not the actual learning language.
        </p>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          View
        </span>
        {VIEWS.map((v) => {
          const active = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              title={v.description}
              className={
                "rounded-md border-2 px-3 py-1.5 text-sm font-semibold transition-colors duration-100 " +
                (active
                  ? "border-accent bg-accent text-white"
                  : "border-border bg-surface text-text-primary hover:border-accent")
              }
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {view === "compare" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
              A — Current (pill row)
            </h2>
            <LanguagePickerGrid variant="current" />
            <ul className="mt-3 list-inside list-disc text-xs text-text-secondary">
              <li>Only renders 2 of 7 languages (Ko, Ja in AVAILABLE_LEARNING_LANGUAGES)</li>
              <li>Pill-button row, wraps awkwardly</li>
              <li>No honesty about which languages have real content</li>
              <li>Currently dead code on first signup (default is "ko")</li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-muted">
              B — 2×2 flag grid (proposed)
            </h2>
            <LanguagePickerGrid variant="grid" />
            <ul className="mt-3 list-inside list-disc text-xs text-text-secondary">
              <li>Shows all 7 configured languages</li>
              <li>Noto Emoji flag SVGs (device-agnostic, not OS emoji font)</li>
              <li>"Soon" badge on unbuilt languages — honest signal</li>
              <li>Mirrors word_image_mcq card pattern (familiar from lessons)</li>
              <li>Square aspect-ratio cards, 60% flag fill</li>
            </ul>
          </div>
        </div>
      )}

      {view === "current" && (
        <div className="mx-auto max-w-2xl">
          <LanguagePickerGrid variant="current" />
        </div>
      )}

      {view === "grid" && (
        <div>
          <LanguagePickerGrid variant="grid" />
        </div>
      )}

      <footer className="mt-10 text-xs text-text-secondary">
        <p>
          Pure visual mock. Selection state is local to this page; no
          settings are written. Production wiring (default unset → picker
          → Auth0 appState round-trip → seed setting) tracked in Task&nbsp;#88.
        </p>
      </footer>
    </div>
  );
}
