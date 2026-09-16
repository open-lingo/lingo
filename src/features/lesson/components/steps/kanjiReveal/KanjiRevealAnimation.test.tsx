/**
 * TestFlight #159/#162 — on iOS WKWebView the reveal's kana→kanji wipe
 * reached `settled` (the gloss was on screen, so the JS-side sequence had
 * genuinely finished) with the word still cut at ~50%, clipping the BASE
 * glyphs too, not only the reading. Device-sim repro (freezing/resuming the
 * app process mid-sequence, standing in for a real WKWebView interruption —
 * a system dialog, an audio-session change, backgrounding) reproduced the
 * same family of bug: a correctly-painted end state going stale again after
 * an interruption. Chromium/Playwright WebKit never show it, because both
 * repaint an animation's `fill-mode: both` end frame reliably; WKWebView
 * does not.
 *
 * The fix (`KanjiRevealAnimation.tsx`) stops trusting the `krv-wipe`
 * clip-path animation to hold its own end frame. Once the sequence is
 * `settled`, `data-paint` flips to `"done"`, which is styled by a PLAIN,
 * non-animated CSS rule — no `animation` property is present in that rule at
 * all, so there is nothing left running for WebKit to freeze mid-flight or
 * fail to repaint. These tests exercise the state machine that drives that
 * attribute, which is exactly what the fix changed: reaching the resting
 * state must depend only on the phase timers (or the reduced-motion
 * shortcut), never on any animation/transition event actually firing —
 * happy-dom fires none of those, so a component that secretly needed one
 * would simply hang here.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { RevealChoreo, type RevealWord } from "./KanjiRevealAnimation";
import { LessonModuleProvider } from "@/shared/contexts/LessonModuleContext";

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: {} } },
  }),
}));

const WORD: RevealWord = {
  kana: "あした",
  kanji: "明日",
  gloss: "tomorrow",
  parts: [
    { glyph: "明", sense: "bright" },
    { glyph: "日", sense: "day / sun" },
  ],
};

// [560, 380, 900, 620, 260] — the real production sequence in
// KanjiRevealAnimation.tsx. Kept as literals here (not imported) so the test
// fails loudly if that ladder is ever edited without updating these totals.
// `settled` (data-paint="done", the gloss) flips on the 4th phase boundary;
// `onDone` (the Continue-button gate) fires 260ms later, on the 5th.
const PAINT_DONE_MS = 560 + 380 + 900 + 620;
const TOTAL_MS = PAINT_DONE_MS + 260;

function renderBeat(onDone?: () => void) {
  return render(
    <LessonModuleProvider moduleIndex={19}>
      <RevealChoreo word={WORD} replayKey={0} onDone={onDone} />
    </LessonModuleProvider>,
  );
}

function paintState(container: HTMLElement): string | null {
  return container.querySelector(".krv-choreo")?.getAttribute("data-paint") ?? null;
}

function doneRuleCss(container: HTMLElement): string {
  const styles = [...container.querySelectorAll("style")];
  const withDoneRule = styles.find((s) => s.textContent?.includes('[data-paint="done"]'));
  return withDoneRule?.textContent ?? "";
}

describe("RevealChoreo — settled state is timer-driven, not animation-driven", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts pending and reaches data-paint=\"done\" once the phase timers finish, firing onDone exactly once", () => {
    const onDone = vi.fn();
    const { container } = renderBeat(onDone);

    expect(paintState(container)).toBe("pending");
    expect(screen.queryByText(WORD.gloss)).toBeNull();
    expect(onDone).not.toHaveBeenCalled();

    // Advance to just short of the reveal settling: still not done.
    act(() => {
      vi.advanceTimersByTime(PAINT_DONE_MS - 1);
    });
    expect(paintState(container)).not.toBe("done");
    expect(onDone).not.toHaveBeenCalled();

    // happy-dom never fires `animationend`/`transitionend` — reaching "done"
    // here proves the end state depends only on the timer ladder, not on any
    // animation event. `onDone` (the Continue-button gate) has not fired yet
    // — it lands 260ms later, on the sequence's final phase.
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(paintState(container)).toBe("done");
    expect(screen.getByText(WORD.gloss)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(TOTAL_MS - PAINT_DONE_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    // The resting frame comes from a rule with NO animation property, so
    // there is nothing running for WebKit to fail to repaint after
    // "done" is reached — the exact WKWebView failure mode from #159/#162.
    const css = doneRuleCss(container);
    expect(css).toMatch(/\[data-paint="done"\][^}]*\{[^}]*clip-path:\s*inset\(0 0 0 0\)/);
    expect(css).not.toMatch(/\[data-paint="done"\][^}]*\{[^}]*animation:\s*krv-wipe/);

    // Time continuing to pass after settling must not un-settle it (no
    // regression toward "painting"/"pending" once done).
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(paintState(container)).toBe("done");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("clips the reading fully while pending and mid-wipe while painting, distinct from the final done rule", () => {
    const { container } = renderBeat();
    expect(paintState(container)).toBe("pending");

    // Past the erase (560) + slide (380) beats: painting begins at 1840ms
    // ([560,380,900] cumulative), before the wipe's own 560ms lands.
    act(() => {
      vi.advanceTimersByTime(560 + 380 + 900 + 1);
    });
    expect(paintState(container)).toBe("painting");
    expect(screen.queryByText(WORD.gloss)).toBeNull();
  });
});

describe("RevealChoreo — prefers-reduced-motion", () => {
  const realMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    vi.useRealTimers();
  });

  it("renders the final state immediately, without waiting for the timer ladder", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const onDone = vi.fn();
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = renderBeat(onDone));
    });

    // No `vi.advanceTimersByTime` at all — a reduced-motion learner must not
    // sit through the same ~2.7s in real time just to see instant sub-frames.
    expect(paintState(container)).toBe("done");
    expect(screen.getByText(WORD.gloss)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
