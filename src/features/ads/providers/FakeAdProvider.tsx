import type { AdProvider, AdRequest, AdRendered } from "./types";

/**
 * Placeholder ad provider for dev, tests, and pre-AdSense-approval
 * environments. Always "ready" — every request returns a styled
 * `Sponsored - Demo Ad` card so we can verify layout, dismissal, and
 * gating without depending on a network/AdSense fill.
 */
export class FakeAdProvider implements AdProvider {
  readonly id = "fake";

  isReady(): boolean {
    return true;
  }

  request(req: AdRequest): AdRendered | null {
    const impressionId = `fake-${req.slot}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    return {
      impressionId,
      node: <FakeAdCard slot={req.slot} />,
    };
  }
}

function FakeAdCard({ slot }: { slot: string }) {
  return (
    <div
      data-testid={`fake-ad-${slot}`}
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-border bg-surface-muted px-4 py-3 text-text-secondary"
    >
      <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
        Sponsored
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-text-primary">Demo ad placeholder</span>
        <span className="truncate text-xs text-text-muted">
          Slot: {slot} - replace with a real provider when AdSense is wired.
        </span>
      </div>
      <span aria-hidden className="text-xs font-mono text-text-muted">
        Demo Ad
      </span>
    </div>
  );
}
