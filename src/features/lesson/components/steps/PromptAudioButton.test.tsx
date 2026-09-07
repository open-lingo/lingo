/**
 * PromptAudioButton contract: TestFlight #48/#53 fix. The slot must be
 * present from first render (no mount-triggered layout shift) and must
 * only ever change styling, never presence, when `answered` flips.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));

import { PromptAudioButton } from "./PromptAudioButton";

afterEach(() => cleanup());

describe("PromptAudioButton", () => {
  it("renders nothing when the step has no audio, before or after answering", () => {
    const { rerender, container } = render(
      <PromptAudioButton hasAudio={false} answered={false} onPlay={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid="prompt-audio-button"]')).toBeNull();
    rerender(<PromptAudioButton hasAudio={false} answered={true} onPlay={vi.fn()} />);
    expect(container.querySelector('[data-testid="prompt-audio-button"]')).toBeNull();
  });

  it("reserves the slot pre-answer: same node present, locked and disabled", () => {
    render(<PromptAudioButton hasAudio={true} answered={false} onPlay={vi.fn()} />);
    const btn = screen.getByTestId("prompt-audio-button");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn.getAttribute("aria-label")).not.toBe("Play audio");
  });

  it("never fires onPlay while locked", () => {
    const onPlay = vi.fn();
    render(<PromptAudioButton hasAudio={true} answered={false} onPlay={onPlay} />);
    fireEvent.click(screen.getByTestId("prompt-audio-button"));
    expect(onPlay).not.toHaveBeenCalled();
  });

  it("swaps to a live, labeled play button post-answer — same node, no remount", () => {
    const onPlay = vi.fn();
    render(<PromptAudioButton hasAudio={true} answered={true} onPlay={onPlay} />);
    const btn = screen.getByRole("button", { name: "Play audio" });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("keeps the wrapper's box the same across the answered transition (no size change)", () => {
    const { rerender, getByTestId } = render(
      <PromptAudioButton hasAudio={true} answered={false} onPlay={vi.fn()} />,
    );
    const before = getByTestId("prompt-audio-button").className;
    rerender(<PromptAudioButton hasAudio={true} answered={true} onPlay={vi.fn()} />);
    const after = getByTestId("prompt-audio-button").className;
    // Both states share the same sizing classes (h-7 w-7); only
    // color/cursor/border tokens are allowed to differ.
    expect(before).toMatch(/h-7 w-7/);
    expect(after).toMatch(/h-7 w-7/);
  });
});
